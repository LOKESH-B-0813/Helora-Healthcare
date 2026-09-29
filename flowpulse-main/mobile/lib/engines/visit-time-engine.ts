// ============================================================================
// FlowPulse Patient Visit Time Engine (Mobile Local)
// Calculates recommended arrivals, stage milestones, remaining duration, and door-to-door completion.
// ============================================================================

import type { DepartmentId } from '../constants/timings'
import { SERVICE_DURATION_STANDARDS, QUEUE_THRESHOLDS } from '../constants/timings'
import { parseTimeToMinutes, formatMinutesToTime } from './queue-engine'

/**
 * Calculates adaptive recommended arrival window.
 * recommendedArrival = scheduledAppointment + predictedDepartmentDelay - registrationBuffer - safetyBuffer
 */
export function calculateRecommendedArrival(
  scheduledTimeStr: string,
  predictedDepartmentDelayMinutes: number = 0,
): {
  recommendedWindow: string
  targetArrivalMinutes: number
  targetArrivalTimeStr: string
  isAdjusted: boolean
  delayOffsetMinutes: number
} {
  const scheduledMinutes = parseTimeToMinutes(scheduledTimeStr)
  const delayOffset = Math.max(0, predictedDepartmentDelayMinutes)

  const targetArrival = scheduledMinutes + delayOffset - QUEUE_THRESHOLDS.registrationBufferMinutes - QUEUE_THRESHOLDS.safetyBufferMinutes
  const windowStart = targetArrival - 5
  const windowEnd = targetArrival + 5

  const formatShort = (mins: number) => {
    const h = Math.floor(((mins % (24 * 60)) + (24 * 60)) % (24 * 60) / 60) % 12 || 12
    const m = mins % 60
    return `${h}:${String(m).padStart(2, '0')}`
  }

  const isAdjusted = delayOffset > 5

  return {
    recommendedWindow: `${formatShort(windowStart)}–${formatMinutesToTime(windowEnd)}`,
    targetArrivalMinutes: targetArrival,
    targetArrivalTimeStr: formatMinutesToTime(targetArrival),
    isAdjusted,
    delayOffsetMinutes: delayOffset,
  }
}

/**
 * Calculates expected queue wait time before consultation starts.
 */
export function calculateExpectedQueueWait(
  patientsAhead: number,
  averageConsultationMinutes: number = 18,
  activeStaffCount: number = 3,
  operationalDelayMinutes: number = 0,
): number {
  const effectiveStaff = Math.max(1, activeStaffCount)
  const rawWait = Math.round((patientsAhead * averageConsultationMinutes) / effectiveStaff)
  return Math.max(0, rawWait + operationalDelayMinutes)
}

/**
 * Calculates expected consultation start time.
 */
export function calculateExpectedConsultation(
  arrivalOrReferenceTime: string,
  queueWaitMinutes: number,
): string {
  const refMinutes = parseTimeToMinutes(arrivalOrReferenceTime)
  return formatMinutesToTime(refMinutes + queueWaitMinutes)
}

/**
 * Calculates stage start time given previous stage end or reference.
 */
export function calculateStageStart(
  previousStageEndTime: string,
  transitOrWaitMinutes: number = 0,
): string {
  const prevMins = parseTimeToMinutes(previousStageEndTime)
  return formatMinutesToTime(prevMins + transitOrWaitMinutes)
}

/**
 * Calculates stage end time given start time and duration.
 */
export function calculateStageEnd(
  stageStartTime: string,
  durationMinutes: number,
): string {
  const startMins = parseTimeToMinutes(stageStartTime)
  return formatMinutesToTime(startMins + durationMinutes)
}

/**
 * Comprehensive Door-to-Door Journey Estimator:
 * TOTAL VISIT TIME = Registration + Queue Wait + Consultation + Diagnostic Wait & Processing + Doctor Review + Pharmacy
 */
export function calculateExpectedCompletion({
  departmentId = 'cardiology',
  scheduledTime = '10:30 AM',
  queueWaitMinutes = 14,
  includeDiagnostics = true,
  diagnosticWaitMinutes = 14,
  diagnosticProcessingMinutes = 15,
  consultationDurationMinutes = 18,
  reviewDurationMinutes = 12,
  pharmacyDurationMinutes = 8,
  registrationMinutes = 5,
}: {
  departmentId?: DepartmentId
  scheduledTime?: string
  queueWaitMinutes?: number
  includeDiagnostics?: boolean
  diagnosticWaitMinutes?: number
  diagnosticProcessingMinutes?: number
  consultationDurationMinutes?: number
  reviewDurationMinutes?: number
  pharmacyDurationMinutes?: number
  registrationMinutes?: number
}): {
  totalVisitMinutes: number
  formattedDuration: string
  expectedCompletionTime: string
  breakdown: {
    registration: number
    queueWait: number
    consultation: number
    diagnosticWait: number
    diagnosticProcessing: number
    review: number
    pharmacy: number
  }
} {
  const consult = consultationDurationMinutes || SERVICE_DURATION_STANDARDS[departmentId]?.nominalMinutes || 18
  const diagWait = includeDiagnostics ? diagnosticWaitMinutes : 0
  const diagProc = includeDiagnostics ? diagnosticProcessingMinutes : 0
  const review = includeDiagnostics ? reviewDurationMinutes : 0
  const pharmacy = pharmacyDurationMinutes

  const totalVisitMinutes =
    registrationMinutes +
    queueWaitMinutes +
    consult +
    diagWait +
    diagProc +
    review +
    pharmacy

  const hours = Math.floor(totalVisitMinutes / 60)
  const mins = totalVisitMinutes % 60
  const formattedDuration = hours > 0 ? `${hours} hr ${mins} min` : `${mins} min`

  const startMinutes = parseTimeToMinutes(scheduledTime)
  const expectedCompletionTime = formatMinutesToTime(startMinutes + totalVisitMinutes)

  return {
    totalVisitMinutes,
    formattedDuration,
    expectedCompletionTime,
    breakdown: {
      registration: registrationMinutes,
      queueWait: queueWaitMinutes,
      consultation: consult,
      diagnosticWait: diagWait,
      diagnosticProcessing: diagProc,
      review,
      pharmacy,
    },
  }
}

/**
 * Calculates remaining visit time from current clock or stage position.
 */
export function calculateRemainingVisitTime(
  currentStageIndex: number,
  totalStagesCount: number = 6,
  estimatedCompletionTimeStr: string = '12:05 PM',
  currentReferenceTimeStr: string = '10:52 AM',
): {
  remainingMinutes: number
  formattedRemainingTime: string
  progressPercentage: number
} {
  const currentMins = parseTimeToMinutes(currentReferenceTimeStr)
  const completionMins = parseTimeToMinutes(estimatedCompletionTimeStr)

  let diff = completionMins - currentMins
  if (diff < 0) diff += 24 * 60

  const hours = Math.floor(diff / 60)
  const mins = diff % 60
  const formattedRemainingTime = hours > 0 ? `${hours} hr ${mins} min` : `${mins} min`

  const progress = Math.min(100, Math.max(10, Math.round((currentStageIndex / Math.max(1, totalStagesCount - 1)) * 100)))

  return {
    remainingMinutes: diff,
    formattedRemainingTime,
    progressPercentage: progress,
  }
}
