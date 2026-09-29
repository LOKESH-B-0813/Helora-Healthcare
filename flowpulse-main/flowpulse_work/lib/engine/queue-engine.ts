import type { DepartmentId, FlowStageId } from '../data/types'
import { SERVICE_DURATION_STANDARDS, QUEUE_THRESHOLDS } from '../config/queue-config'

// ============================================================================
// FlowPulse Smart Queue & Wait-Time Engine
// Pure calculation utilities for queue position, waiting times, and arrival windows.
// ============================================================================

/**
 * Parses time string (e.g. "10:30 AM", "11:45") into total minutes from midnight.
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 10 * 60 + 30
  const match = timeStr.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i)
  if (!match) return 10 * 60 + 30

  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const meridian = match[3]?.toUpperCase()

  if (meridian === 'PM' && hours < 12) hours += 12
  if (meridian === 'AM' && hours === 12) hours = 0

  return hours * 60 + minutes
}

/**
 * Formats total minutes from midnight into 12-hour string (e.g. "11:45 AM").
 */
export function formatMinutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60)
  const hours24 = Math.floor(normalized / 60)
  const minutes = normalized % 60
  const hours12 = hours24 % 12 || 12
  const meridian = hours24 >= 12 ? 'PM' : 'AM'
  return `${hours12}:${String(minutes).padStart(2, '0')} ${meridian}`
}

/**
 * Calculates estimated wait time:
 * predictedWait = ((patientsAhead * averageServiceMinutes) / max(activeResources, 1)) + operationalDelay
 */
export function calculateEstimatedWait({
  patientsAhead,
  averageServiceMinutes,
  activeResources,
  operationalDelayMinutes = 0,
  resourcePenaltyMinutes = 0,
}: {
  patientsAhead: number
  averageServiceMinutes: number
  activeResources: number
  operationalDelayMinutes?: number
  resourcePenaltyMinutes?: number
}): number {
  const effectiveResources = Math.max(1, activeResources)
  const rawWait = Math.round(
    (patientsAhead * averageServiceMinutes) / effectiveResources,
  )
  return Math.max(0, rawWait + operationalDelayMinutes + resourcePenaltyMinutes)
}

/**
 * Calculates expected service start time given base arrival time and wait minutes.
 */
export function calculateExpectedServiceTime(
  baseTimeStr: string,
  waitMinutes: number,
): string {
  const baseMinutes = parseTimeToMinutes(baseTimeStr)
  return formatMinutesToTime(baseMinutes + waitMinutes)
}

/**
 * Calculates adaptive arrival window:
 * recommendedArrival = scheduledAppointment + predictedDepartmentDelay - registrationBuffer - safetyBuffer
 */
export function calculateAdaptiveArrivalWindow(
  scheduledTimeStr: string,
  predictedDelayMinutes: number = 0,
  registrationBuffer: number = QUEUE_THRESHOLDS.registrationBufferMinutes,
  safetyBuffer: number = QUEUE_THRESHOLDS.safetyBufferMinutes,
): {
  recommendedArrivalWindow: string
  arrivalStartMinutes: number
  arrivalEndMinutes: number
  targetArrivalMinutes: number
  isAdjusted: boolean
  explanation: string
} {
  const scheduledMinutes = parseTimeToMinutes(scheduledTimeStr)
  const delayOffset = Math.max(0, predictedDelayMinutes)

  // Target arrival time
  const targetArrival = scheduledMinutes + delayOffset - registrationBuffer - safetyBuffer
  const windowStart = targetArrival - 5
  const windowEnd = targetArrival + 5

  const formatShort = (mins: number) => {
    const h = Math.floor(mins / 60) % 12 || 12
    const m = mins % 60
    return `${h}:${String(m).padStart(2, '0')}`
  }

  const isAdjusted = delayOffset > 5

  return {
    recommendedArrivalWindow: `${formatShort(windowStart)}–${formatMinutesToTime(windowEnd)}`,
    arrivalStartMinutes: windowStart,
    arrivalEndMinutes: windowEnd,
    targetArrivalMinutes: targetArrival,
    isAdjusted,
    explanation: isAdjusted
      ? `Adjusted for current operational queue backlog (+${delayOffset}m delay).`
      : 'Standard operational arrival window based on nominal clinic throughput.',
  }
}

/**
 * Comprehensive Door-to-Door Journey Estimator:
 * TOTAL VISIT TIME = Registration + Queue Wait + Consultation + Diagnostics + Review + Pharmacy
 */
export function calculatePatientJourneyEstimate({
  departmentId,
  scheduledTime = '10:30 AM',
  currentQueueWait = 14,
  includeDiagnostics = true,
  isDiagnosticDelayed = false,
  diagnosticDelayMinutes = 0,
}: {
  departmentId: DepartmentId
  scheduledTime?: string
  currentQueueWait?: number
  includeDiagnostics?: boolean
  isDiagnosticDelayed?: boolean
  diagnosticDelayMinutes?: number
}) {
  const regMinutes = SERVICE_DURATION_STANDARDS['general-opd'] ? 5 : 5
  const queueWait = currentQueueWait
  const consultMinutes = SERVICE_DURATION_STANDARDS[departmentId]?.nominalMinutes || 18
  const diagMinutes = includeDiagnostics
    ? (SERVICE_DURATION_STANDARDS['laboratory']?.nominalMinutes || 15) + (isDiagnosticDelayed ? diagnosticDelayMinutes : 0)
    : 0
  const reviewMinutes = includeDiagnostics ? 12 : 0
  const pharmMinutes = 8

  const totalVisitMinutes =
    regMinutes + queueWait + consultMinutes + diagMinutes + reviewMinutes + pharmMinutes

  const hours = Math.floor(totalVisitMinutes / 60)
  const remainingMins = totalVisitMinutes % 60
  const formattedDuration =
    hours > 0 ? `${hours} hr ${remainingMins} min` : `${remainingMins} min`

  const scheduledMinutes = parseTimeToMinutes(scheduledTime)
  const expectedCompletionMinutes = scheduledMinutes + totalVisitMinutes
  const expectedCompletionTime = formatMinutesToTime(expectedCompletionMinutes)

  const arrival = calculateAdaptiveArrivalWindow(
    scheduledTime,
    Math.max(0, currentQueueWait - 8),
  )

  const expectedConsultation = formatMinutesToTime(
    scheduledMinutes + regMinutes + queueWait,
  )

  return {
    scheduledTime,
    recommendedArrivalWindow: arrival.recommendedArrivalWindow,
    expectedConsultation,
    expectedWaitingMinutes: queueWait,
    totalDurationMinutes: totalVisitMinutes,
    totalDurationFormatted: formattedDuration,
    expectedCompletionTime,
    isAdjusted: arrival.isAdjusted || isDiagnosticDelayed,
    explanation: arrival.explanation,
    stageBreakdown: {
      registrationMinutes: regMinutes,
      queueWaitMinutes: queueWait,
      consultationMinutes: consultMinutes,
      diagnosticsMinutes: diagMinutes,
      reviewMinutes,
      pharmacyMinutes: pharmMinutes,
    },
  }
}

/**
 * Calculates expected start time for a specific downstream care stage.
 */
export function calculateExpectedStageStart(
  baseTimeStr: string,
  offsetMinutes: number,
): string {
  const baseMinutes = parseTimeToMinutes(baseTimeStr)
  return formatMinutesToTime(baseMinutes + offsetMinutes)
}

/**
 * Calculates expected completion time for a stage given start time and duration.
 */
export function calculateExpectedStageEnd(
  startTimeStr: string,
  durationMinutes: number,
): string {
  const startMinutes = parseTimeToMinutes(startTimeStr)
  return formatMinutesToTime(startMinutes + durationMinutes)
}

/**
 * Calculates overall visit completion time given scheduled start and cumulative durations.
 */
export function calculateVisitCompletion(
  scheduledTimeStr: string,
  stageDurations: number[],
): string {
  const scheduledMinutes = parseTimeToMinutes(scheduledTimeStr)
  const totalDuration = stageDurations.reduce((a, b) => a + b, 0)
  return formatMinutesToTime(scheduledMinutes + totalDuration)
}

/**
 * Calculates difference in minutes between scheduled time and predicted service time.
 */
export function calculateDelayMinutes(
  scheduledTimeStr: string,
  predictedTimeStr: string,
): number {
  const scheduled = parseTimeToMinutes(scheduledTimeStr)
  const predicted = parseTimeToMinutes(predictedTimeStr)
  return Math.max(0, predicted - scheduled)
}

/**
 * Calculates forecast predicted time based on horizon and active bottlenecks.
 */
export function calculateTimelineForecast({
  scheduledTime,
  baseDelayMinutes,
  horizon,
  departmentId,
  isLabFailure = false,
  isRecovered = false,
}: {
  scheduledTime: string
  baseDelayMinutes: number
  horizon: 'now' | '30m' | '60m' | '120m'
  departmentId: DepartmentId
  isLabFailure?: boolean
  isRecovered?: boolean
}): {
  predictedServiceTime: string
  predictedDelayMinutes: number
  predictedCompletionTime: string
} {
  let extraDelay = 0

  if (isLabFailure && !isRecovered) {
    if (horizon === '30m') extraDelay = departmentId === 'laboratory' ? 14 : 8
    else if (horizon === '60m') extraDelay = departmentId === 'laboratory' ? 23 : 16
    else if (horizon === '120m') extraDelay = departmentId === 'emergency' ? 25 : 18
    else extraDelay = departmentId === 'laboratory' ? 16 : 6
  } else if (isRecovered) {
    extraDelay = -Math.min(baseDelayMinutes, 8)
  } else {
    if (horizon === '30m') extraDelay = 2
    else if (horizon === '60m') extraDelay = 4
    else if (horizon === '120m') extraDelay = 6
  }

  const effectiveDelay = Math.max(0, baseDelayMinutes + extraDelay)
  const scheduledMins = parseTimeToMinutes(scheduledTime)
  const predictedServiceMins = scheduledMins + effectiveDelay
  const predictedServiceTime = formatMinutesToTime(predictedServiceMins)

  // Standard visit completion is approx scheduled + 90 min + effective delay
  const completionMins = scheduledMins + 95 + effectiveDelay
  const predictedCompletionTime = formatMinutesToTime(completionMins)

  return {
    predictedServiceTime,
    predictedDelayMinutes: effectiveDelay,
    predictedCompletionTime,
  }
}

