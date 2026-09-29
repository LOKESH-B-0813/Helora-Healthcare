import type {
  Department,
  DepartmentId,
  Patient,
  StaffMember,
  StatusTone,
} from "../data/types"
import type { FlowPulseState } from "./flowpulse-state"

// ============================================================================
// FlowPulse Selectors
// Central typed accessors ensuring unified metrics across public & staff views.
// ============================================================================

export function getDepartmentById(state: FlowPulseState, id: DepartmentId): Department | undefined {
  return state.departments.find((d) => d.id === id)
}

export function getDepartmentLoad(state: FlowPulseState, id: DepartmentId): number {
  const d = getDepartmentById(state, id)
  return d ? d.utilization : 0
}

export function getDepartmentWait(state: FlowPulseState, id: DepartmentId): number {
  const d = getDepartmentById(state, id)
  return d ? d.avgWaitMinutes : 0
}

export function getAvailableBeds(state: FlowPulseState): number {
  return state.kpis.availableBeds
}

export function getPatientsInDepartment(state: FlowPulseState, deptId: DepartmentId): Patient[] {
  return state.patients.filter((p) => p.currentDepartment === deptId)
}

export function getStaffByDepartment(state: FlowPulseState, deptId: DepartmentId): StaffMember[] {
  return state.staff.filter((s) => s.department === deptId)
}

export function getHospitalHealth(state: FlowPulseState) {
  return {
    status: state.hospitalStatus,
    score: state.hospitalHealthScore,
    activeBottlenecks: state.kpis.activeBottlenecks,
    rippleRiskScore: state.kpis.rippleRiskScore,
  }
}

export function getCurrentBottlenecks(state: FlowPulseState) {
  return state.departments.filter((d) => d.status === "critical" || d.status === "warning")
}

export function getCurrentRipple(state: FlowPulseState) {
  return state.rippleEvents
}

export function getPatientJourney(state: FlowPulseState) {
  return state.patientJourney
}

export function getScenarioMetrics(state: FlowPulseState) {
  return {
    activeScenario: state.activeScenario,
    scenarioPhase: state.scenarioPhase,
    timeHorizon: state.timeHorizon,
    approvedIntervention: state.approvedIntervention,
    kpis: state.kpis,
  }
}

export function getUnreadNotificationsCount(state: FlowPulseState): number {
  return state.notifications.filter((n) => !n.read).length
}

// ----------------------------------------------------------------------------
// Adaptive Arrival Window Calculator (Phase 13)
// recommendedArrival = scheduledAppointment + predictedDepartmentDelay - regBuffer - safetyBuffer
// ----------------------------------------------------------------------------
export function calculateAdaptiveArrival(
  state: FlowPulseState,
  departmentId: DepartmentId,
  scheduledTime: string = "10:30 AM",
): {
  recommendedArrivalWindow: string
  expectedConsultation: string
  expectedWaitingMinutes: number
  totalDurationMinutes: number
  totalDurationFormatted: string
  estimatedCompletion: string
  delayMinutes: number
  isAdjusted: boolean
  explanation: string
  breakdown: {
    registrationMinutes: number
    queueWaitMinutes: number
    consultationMinutes: number
    diagnosticsMinutes: number
    reviewMinutes: number
    pharmacyMinutes: number
  }
} {
  const dept = getDepartmentById(state, departmentId)
  const currentWait = dept ? dept.avgWaitMinutes : 12

  // Emergency is prioritized for immediate triage
  if (departmentId === "emergency") {
    return {
      recommendedArrivalWindow: "Immediate Triage",
      expectedConsultation: "Immediate",
      expectedWaitingMinutes: 0,
      totalDurationMinutes: 120,
      totalDurationFormatted: "2 hr (Variable)",
      estimatedCompletion: "Immediate Triage",
      delayMinutes: 0,
      isAdjusted: false,
      explanation: "Emergency care is prioritized for immediate clinical triage upon arrival.",
      breakdown: {
        registrationMinutes: 2,
        queueWaitMinutes: 0,
        consultationMinutes: 30,
        diagnosticsMinutes: 45,
        reviewMinutes: 25,
        pharmacyMinutes: 18,
      },
    }
  }

  // Parse time (e.g. "10:30 AM")
  const match = scheduledTime.match(/(\d+):(\d+)\s*(AM|PM)?/i)
  let baseHour = 10
  let baseMinute = 30
  if (match) {
    baseHour = parseInt(match[1], 10)
    baseMinute = parseInt(match[2], 10)
    const meridian = match[3]?.toUpperCase()
    if (meridian === "PM" && baseHour < 12) baseHour += 12
    if (meridian === "AM" && baseHour === 12) baseHour = 0
  }

  const baseTotalMinutes = baseHour * 60 + baseMinute

  // Predicted delay offset
  const predictedDelay = Math.max(0, currentWait - 10)
  const registrationBuffer = 10
  const safetyBuffer = 5

  // recommended arrival target in minutes
  const arrivalTargetMinutes = baseTotalMinutes + predictedDelay - registrationBuffer - safetyBuffer
  const windowStart = arrivalTargetMinutes - 5
  const windowEnd = arrivalTargetMinutes + 5

  const formatTime = (mins: number) => {
    const h = Math.floor((mins % (24 * 60)) / 60)
    const m = (mins + 60) % 60
    const h12 = h % 12 || 12
    const ampm = h >= 12 ? "PM" : "AM"
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`
  }

  const formatShort = (mins: number) => {
    const h = Math.floor((mins % (24 * 60)) / 60)
    const m = (mins + 60) % 60
    const h12 = h % 12 || 12
    return `${h12}:${String(m).padStart(2, "0")}`
  }

  const registrationMinutes = 5
  const queueWaitMinutes = currentWait
  const consultationMinutes = 18
  const diagnosticsMinutes = 25
  const reviewMinutes = 12
  const pharmacyMinutes = 10

  const totalDurationMinutes =
    registrationMinutes +
    queueWaitMinutes +
    consultationMinutes +
    diagnosticsMinutes +
    reviewMinutes +
    pharmacyMinutes

  const hours = Math.floor(totalDurationMinutes / 60)
  const remainingMins = totalDurationMinutes % 60
  const totalDurationFormatted =
    hours > 0 ? `${hours} hr ${remainingMins} min` : `${remainingMins} min`

  const expectedConsult = baseTotalMinutes + predictedDelay
  const estimatedComplete = baseTotalMinutes + totalDurationMinutes

  const windowStr = `${formatShort(windowStart)}–${formatTime(windowEnd)}`

  return {
    recommendedArrivalWindow: windowStr,
    expectedConsultation: formatTime(expectedConsult),
    expectedWaitingMinutes: currentWait,
    totalDurationMinutes,
    totalDurationFormatted,
    estimatedCompletion: formatTime(estimatedComplete),
    delayMinutes: predictedDelay,
    isAdjusted: predictedDelay > 5,
    explanation:
      predictedDelay > 5
        ? `Adjusted for current ${dept?.name ?? "clinic"} operational load (+${predictedDelay}m backlog).`
        : "Standard operational arrival window based on nominal clinic flow.",
    breakdown: {
      registrationMinutes,
      queueWaitMinutes,
      consultationMinutes,
      diagnosticsMinutes,
      reviewMinutes,
      pharmacyMinutes,
    },
  }
}

// ----------------------------------------------------------------------------
// Central Queue Selectors (Phase: Live Queues & Smart Wait Time Engine)
// ----------------------------------------------------------------------------

export function getAllQueues(state: FlowPulseState) {
  return state.queues || []
}

export function getQueueByDepartment(state: FlowPulseState, departmentId: DepartmentId) {
  return (state.queues || []).find((q) => q.departmentId === departmentId)
}

export function getQueueById(state: FlowPulseState, queueId: string) {
  return (state.queues || []).find((q) => q.queueId === queueId)
}

export function getQueueSummary(state: FlowPulseState) {
  const queues = state.queues || []
  const totalWaiting = queues.reduce(
    (sum, q) => sum + (q.waitingPatients ? q.waitingPatients.length : 0),
    0,
  )

  const activeWaits = queues.map((q) => q.currentWaitMinutes)
  const avgWait =
    activeWaits.length > 0
      ? Math.round(activeWaits.reduce((a, b) => a + b, 0) / activeWaits.length)
      : 14

  const sortedByWait = [...queues].sort((a, b) => b.currentWaitMinutes - a.currentWaitMinutes)
  const longestQueue = sortedByWait[0] || null

  const criticalQueuesCount = queues.filter((q) => q.queueStatus === "CRITICAL").length
  const warningQueuesCount = queues.filter((q) => q.queueStatus === "WARNING").length

  // Patients with high/moderate delay risk
  let delayRiskPatientsCount = 0
  queues.forEach((q) => {
    (q.waitingPatients || []).forEach((p) => {
      if (p.delayRisk === "high" || p.delayRisk === "moderate") {
        delayRiskPatientsCount++
      }
    })
  })

  return {
    totalWaiting,
    avgWait,
    longestQueue,
    criticalQueuesCount,
    warningQueuesCount,
    delayRiskPatientsCount: Math.max(delayRiskPatientsCount, 12),
  }
}

export function getPatientQueueInfo(state: FlowPulseState, patientId: string = "FP-2026-10482") {
  const queues = state.queues || []
  for (const queue of queues) {
    const p = (queue.waitingPatients || []).find((pt) => pt.patientId === patientId)
    if (p) {
      return {
        queue,
        patient: p,
        position: p.queuePosition,
        ahead: p.patientsAhead,
        token: p.token,
        estimatedWaitMinutes: p.estimatedWaitMinutes,
        expectedServiceTime: p.expectedServiceTime,
      }
    }
  }

  // Fallback for Arjun Kumar (Cardiology / Lab)
  return {
    queue: getQueueByDepartment(state, "cardiology") || null,
    patient: {
      patientId: "FP-2026-10482",
      patientName: "Arjun Kumar",
      token: "C-021",
      queuePosition: 3,
      patientsAhead: 2,
      estimatedWaitMinutes: 14,
      expectedServiceTime: "10:48 AM",
    },
    position: 3,
    ahead: 2,
    token: "C-021",
    estimatedWaitMinutes: 14,
    expectedServiceTime: "10:48 AM",
  }
}

// ----------------------------------------------------------------------------
// Live Patient Flow Timeline Selectors (Phase: Smart Queue Schedule)
// ----------------------------------------------------------------------------

import type { TimelinePatientEntry, TimelineSummaryMetrics, TimeHorizon } from "../data/types"
import { evaluateDelayCategory } from "../config/queue-config"
import { parseTimeToMinutes, formatMinutesToTime } from "../engine/queue-engine"

export const BASELINE_TIMELINE_RECORDS: Omit<TimelinePatientEntry, "delayCategory" | "careStages">[] = [
  {
    id: "FP-2026-10480",
    patientName: "Kavya R.",
    token: "C-018",
    departmentId: "cardiology",
    departmentName: "Cardiology",
    doctorId: "DOC-101",
    doctorName: "Dr. Ananya Rao",
    scheduledTime: "09:30 AM",
    predictedServiceTime: "09:32 AM",
    delayMinutes: 2,
    queuePosition: null,
    patientsAhead: 0,
    status: "COMPLETED",
    nextStage: "Pharmacy",
    expectedCompletionTime: "11:05 AM",
    clinicalPriority: "standard",
  },
  {
    id: "FP-2026-10481",
    patientName: "Mohammed A.",
    token: "C-019",
    departmentId: "cardiology",
    departmentName: "Cardiology",
    doctorId: "DOC-101",
    doctorName: "Dr. Ananya Rao",
    scheduledTime: "09:50 AM",
    predictedServiceTime: "09:57 AM",
    delayMinutes: 7,
    queuePosition: null,
    patientsAhead: 0,
    status: "COMPLETED",
    nextStage: "Discharge",
    expectedCompletionTime: "11:25 AM",
    clinicalPriority: "standard",
  },
  {
    id: "FP-2026-10479",
    patientName: "Priya S.",
    token: "C-020",
    departmentId: "cardiology",
    departmentName: "Cardiology",
    doctorId: "DOC-101",
    doctorName: "Dr. Ananya Rao",
    scheduledTime: "10:10 AM",
    predictedServiceTime: "10:21 AM",
    delayMinutes: 11,
    queuePosition: 1,
    patientsAhead: 0,
    status: "IN_PROGRESS",
    nextStage: "Doctor Review",
    expectedCompletionTime: "11:45 AM",
    clinicalPriority: "urgent",
  },
  {
    id: "FP-2026-10482",
    patientName: "Arjun Kumar",
    token: "C-021",
    departmentId: "cardiology",
    departmentName: "Cardiology",
    doctorId: "DOC-101",
    doctorName: "Dr. Ananya Rao",
    scheduledTime: "10:30 AM",
    predictedServiceTime: "10:48 AM",
    delayMinutes: 18,
    queuePosition: 2,
    patientsAhead: 1,
    status: "WAITING",
    nextStage: "Consultation",
    expectedCompletionTime: "12:05 PM",
    clinicalPriority: "standard",
  },
  {
    id: "FP-2026-10483",
    patientName: "Ravi M.",
    token: "C-022",
    departmentId: "cardiology",
    departmentName: "Cardiology",
    doctorId: "DOC-101",
    doctorName: "Dr. Ananya Rao",
    scheduledTime: "10:50 AM",
    predictedServiceTime: "11:06 AM",
    delayMinutes: 16,
    queuePosition: 3,
    patientsAhead: 2,
    status: "WAITING",
    nextStage: "Consultation",
    expectedCompletionTime: "12:20 PM",
    clinicalPriority: "standard",
  },
  {
    id: "FP-2026-10484",
    patientName: "Meena S.",
    token: "C-023",
    departmentId: "cardiology",
    departmentName: "Cardiology",
    doctorId: "DOC-101",
    doctorName: "Dr. Ananya Rao",
    scheduledTime: "11:10 AM",
    predictedServiceTime: "11:22 AM",
    delayMinutes: 12,
    queuePosition: 4,
    patientsAhead: 3,
    status: "SCHEDULED",
    nextStage: "Consultation",
    expectedCompletionTime: "12:40 PM",
    clinicalPriority: "standard",
  },
  {
    id: "FP-2026-10485",
    patientName: "Suresh K.",
    token: "C-024",
    departmentId: "cardiology",
    departmentName: "Cardiology",
    doctorId: "DOC-102",
    doctorName: "Dr. Meera Iyer",
    scheduledTime: "11:30 AM",
    predictedServiceTime: "11:46 AM",
    delayMinutes: 16,
    queuePosition: 5,
    patientsAhead: 4,
    status: "SCHEDULED",
    nextStage: "Consultation",
    expectedCompletionTime: "01:00 PM",
    clinicalPriority: "standard",
  },
  {
    id: "FP-2026-10486",
    patientName: "Anita D.",
    token: "C-025",
    departmentId: "cardiology",
    departmentName: "Cardiology",
    doctorId: "DOC-102",
    doctorName: "Dr. Meera Iyer",
    scheduledTime: "11:50 AM",
    predictedServiceTime: "12:05 PM",
    delayMinutes: 15,
    queuePosition: 6,
    patientsAhead: 5,
    status: "SCHEDULED",
    nextStage: "Consultation",
    expectedCompletionTime: "01:20 PM",
    clinicalPriority: "standard",
  },
  {
    id: "FP-2026-10487",
    patientName: "Vikram P.",
    token: "C-026",
    departmentId: "general-opd",
    departmentName: "General OPD",
    doctorId: "DOC-103",
    doctorName: "Dr. Rajesh Sharma",
    scheduledTime: "12:10 PM",
    predictedServiceTime: "12:28 PM",
    delayMinutes: 18,
    queuePosition: 7,
    patientsAhead: 6,
    status: "SCHEDULED",
    nextStage: "Consultation",
    expectedCompletionTime: "01:40 PM",
    clinicalPriority: "standard",
  },
  {
    id: "FP-2026-10488",
    patientName: "Sunita B.",
    token: "C-027",
    departmentId: "general-opd",
    departmentName: "General OPD",
    doctorId: "DOC-103",
    doctorName: "Dr. Rajesh Sharma",
    scheduledTime: "12:30 PM",
    predictedServiceTime: "12:45 PM",
    delayMinutes: 15,
    queuePosition: 8,
    patientsAhead: 7,
    status: "SCHEDULED",
    nextStage: "Consultation",
    expectedCompletionTime: "02:00 PM",
    clinicalPriority: "standard",
  },
  {
    id: "FP-2026-10489",
    patientName: "Deepak N.",
    token: "LAB-042",
    departmentId: "laboratory",
    departmentName: "Laboratory",
    doctorId: "DOC-104",
    doctorName: "Dr. Sunita Patel",
    scheduledTime: "10:45 AM",
    predictedServiceTime: "11:12 AM",
    delayMinutes: 27,
    queuePosition: 1,
    patientsAhead: 0,
    status: "WAITING",
    nextStage: "Biochemistry Analyzer",
    expectedCompletionTime: "11:55 AM",
    clinicalPriority: "urgent",
  },
  {
    id: "FP-2026-10490",
    patientName: "Gita R.",
    token: "RAD-018",
    departmentId: "radiology",
    departmentName: "Radiology",
    doctorId: "DOC-105",
    doctorName: "Dr. Amit Verma",
    scheduledTime: "11:00 AM",
    predictedServiceTime: "11:11 AM",
    delayMinutes: 11,
    queuePosition: 2,
    patientsAhead: 1,
    status: "WAITING",
    nextStage: "CT Scan",
    expectedCompletionTime: "12:10 PM",
    clinicalPriority: "standard",
  },
]

export function getTimelineSchedule(
  state: FlowPulseState,
  options?: {
    departmentId?: string
    doctorId?: string
    status?: string
    horizon?: TimeHorizon
    searchQuery?: string
    sortBy?: 'predicted' | 'scheduled' | 'delay' | 'position' | 'status'
  },
): TimelinePatientEntry[] {
  const isLabFailure =
    state.activeScenario === "lab-analyzer-failure" &&
    state.scenarioPhase >= 2 &&
    state.scenarioPhase < 5
  const isRecovered =
    state.activeScenario === "lab-analyzer-failure" &&
    (state.scenarioPhase >= 5 || state.approvedIntervention !== null)

  const horizon = options?.horizon || state.timeHorizon || "now"

  let entries: TimelinePatientEntry[] = BASELINE_TIMELINE_RECORDS.map((base) => {
    let delay = base.delayMinutes
    let predictedServiceTime = base.predictedServiceTime
    let expectedCompletion = base.expectedCompletionTime
    let status = base.status

    // Lab Analyzer Failure adjustments
    if (isLabFailure) {
      if (base.patientName === "Arjun Kumar") {
        delay = 18
        predictedServiceTime = "10:48 AM"
        expectedCompletion = "12:16 PM" // +16 min lab diagnostic backlog
        status = "DELAYED"
      } else if (base.departmentId === "laboratory") {
        delay = Math.min(60, base.delayMinutes + 18)
        const scheduledMins = parseTimeToMinutes(base.scheduledTime)
        predictedServiceTime = formatMinutesToTime(scheduledMins + delay)
        expectedCompletion = formatMinutesToTime(scheduledMins + delay + 45)
        status = "DELAYED"
      } else if (base.patientName === "Priya S.") {
        expectedCompletion = "12:24 PM"
      } else if (base.patientName === "Ravi M.") {
        expectedCompletion = "12:37 PM"
      }
    } else if (isRecovered) {
      // Option C Recovery Dynamics
      if (base.patientName === "Arjun Kumar") {
        delay = 14
        predictedServiceTime = "10:44 AM"
        expectedCompletion = "12:07 PM" // recovered from 12:16 to 12:07 (9 min saved)
        status = "PREDICTED_CHANGE"
      } else if (base.patientName === "Priya S.") {
        expectedCompletion = "12:13 PM"
        status = "PREDICTED_CHANGE"
      } else if (base.patientName === "Ravi M.") {
        expectedCompletion = "12:22 PM"
        status = "PREDICTED_CHANGE"
      } else if (base.departmentId === "laboratory") {
        delay = Math.max(8, base.delayMinutes - 12)
        const scheduledMins = parseTimeToMinutes(base.scheduledTime)
        predictedServiceTime = formatMinutesToTime(scheduledMins + delay)
        expectedCompletion = formatMinutesToTime(scheduledMins + delay + 35)
      }
    }

    // Horizon prediction adjustments (Future Horizon Simulation)
    if (horizon !== "now") {
      const horizonOffset = horizon === "30m" ? 9 : horizon === "60m" ? 16 : 24
      const scheduledMins = parseTimeToMinutes(base.scheduledTime)
      predictedServiceTime = formatMinutesToTime(scheduledMins + delay + horizonOffset)
    }

    // Care Stages
    const careStages = [
      {
        stageId: "registration",
        stageName: "Registration",
        status: base.status === "COMPLETED" || base.status === "IN_PROGRESS" || base.patientName === "Arjun Kumar" ? ("completed" as const) : ("upcoming" as const),
        expectedTime: base.scheduledTime,
        actualTime: base.status === "COMPLETED" || base.status === "IN_PROGRESS" ? "10:34 AM" : undefined,
        waitMinutes: 0,
      },
      {
        stageId: "consultation",
        stageName: `${base.departmentName} Consultation`,
        status: base.status === "COMPLETED" ? ("completed" as const) : base.status === "IN_PROGRESS" ? ("in-progress" as const) : ("upcoming" as const),
        expectedTime: predictedServiceTime,
        waitMinutes: delay,
      },
      {
        stageId: "laboratory",
        stageName: "Laboratory Diagnostics",
        status: "upcoming" as const,
        expectedTime: isLabFailure && base.patientName === "Arjun Kumar" ? "11:31 AM" : isRecovered && base.patientName === "Arjun Kumar" ? "11:22 AM" : "11:18 AM",
        waitMinutes: isLabFailure ? 34 : isRecovered ? 20 : 15,
        note: isLabFailure && base.patientName === "Arjun Kumar" ? "+16m temporary delay (analyzer maintenance)" : undefined,
      },
      {
        stageId: "review",
        stageName: "Doctor Review",
        status: "upcoming" as const,
        expectedTime: isLabFailure && base.patientName === "Arjun Kumar" ? "11:54 AM" : "11:42 AM",
        waitMinutes: isLabFailure ? 18 : 10,
      },
      {
        stageId: "pharmacy",
        stageName: "Pharmacy Dispensing",
        status: "upcoming" as const,
        expectedTime: isLabFailure && base.patientName === "Arjun Kumar" ? "12:08 PM" : "11:57 AM",
        waitMinutes: 8,
      },
      {
        stageId: "discharge",
        stageName: "Discharge Clearance",
        status: "upcoming" as const,
        expectedTime: expectedCompletion,
        waitMinutes: 5,
      },
    ]

    const delayCategory = evaluateDelayCategory(delay)

    return {
      ...base,
      delayMinutes: delay,
      delayCategory,
      predictedServiceTime,
      expectedCompletionTime: expectedCompletion,
      status,
      careStages,
      projectedDelaysNotice:
        isLabFailure && (base.patientName === "Arjun Kumar" || base.patientName === "Priya S.")
          ? "+14 projected doctor review holds"
          : undefined,
      beforeInterventionCompletion: isLabFailure || isRecovered ? (base.patientName === "Arjun Kumar" ? "12:16 PM" : base.patientName === "Priya S." ? "12:24 PM" : "12:37 PM") : undefined,
      afterInterventionCompletion: isRecovered ? (base.patientName === "Arjun Kumar" ? "12:07 PM" : base.patientName === "Priya S." ? "12:13 PM" : "12:22 PM") : undefined,
      timeSavedMinutes: isRecovered ? (base.patientName === "Arjun Kumar" ? 9 : base.patientName === "Priya S." ? 11 : 15) : undefined,
    }
  })

  // Filtering
  if (options?.departmentId && options.departmentId !== "all") {
    entries = entries.filter((e) => e.departmentId === options.departmentId)
  }

  if (options?.doctorId && options.doctorId !== "all") {
    entries = entries.filter((e) => e.doctorId === options.doctorId)
  }

  if (options?.status && options.status !== "all") {
    const s = options.status.toUpperCase()
    entries = entries.filter((e) => e.status === s || (s === "DELAYED" && e.delayCategory === "HIGH_DELAY"))
  }

  if (options?.searchQuery?.trim()) {
    const q = options.searchQuery.toLowerCase()
    entries = entries.filter(
      (e) =>
        e.patientName.toLowerCase().includes(q) ||
        e.token.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.doctorName.toLowerCase().includes(q) ||
        e.departmentName.toLowerCase().includes(q),
    )
  }

  // Sorting
  const sortBy = options?.sortBy || "predicted"
  entries.sort((a, b) => {
    if (sortBy === "scheduled") {
      return parseTimeToMinutes(a.scheduledTime) - parseTimeToMinutes(b.scheduledTime)
    }
    if (sortBy === "delay") {
      return b.delayMinutes - a.delayMinutes
    }
    if (sortBy === "position") {
      const posA = a.queuePosition ?? 999
      const posB = b.queuePosition ?? 999
      return posA - posB
    }
    if (sortBy === "status") {
      return a.status.localeCompare(b.status)
    }
    // Default: predicted service time
    return parseTimeToMinutes(a.predictedServiceTime) - parseTimeToMinutes(b.predictedServiceTime)
  })

  return entries
}

export function getTimelineSummaryMetrics(
  state: FlowPulseState,
  entries: TimelinePatientEntry[],
): TimelineSummaryMetrics {
  const isRecovered =
    state.activeScenario === "lab-analyzer-failure" &&
    (state.scenarioPhase >= 5 || state.approvedIntervention !== null)

  const scheduledToday = entries.length || 28
  const currentlyWaiting = entries.filter((e) => e.status === "WAITING").length || 8
  const currentlyServing = entries.filter((e) => e.status === "IN_PROGRESS").length || 2

  const activeDelays = entries.map((e) => e.delayMinutes)
  const averageDelayMinutes =
    activeDelays.length > 0
      ? Math.round(activeDelays.reduce((a, b) => a + b, 0) / activeDelays.length)
      : 14

  const longestDelayMinutes = Math.max(...activeDelays, 31)

  const onTimeCount = entries.filter(
    (e) => e.delayCategory === "ON_TIME" || e.delayMinutes <= 10,
  ).length
  const expectedOnTimePercent = Math.round((onTimeCount / Math.max(1, entries.length)) * 100)

  return {
    scheduledToday: Math.max(scheduledToday, 28),
    currentlyWaiting: Math.max(currentlyWaiting, 8),
    currentlyServing: Math.max(currentlyServing, 2),
    averageDelayMinutes,
    longestDelayMinutes,
    expectedOnTimePercent: Math.min(100, Math.max(45, expectedOnTimePercent || 76)),
    patientTimeSavedMinutes: isRecovered ? 9 : undefined,
    averageTimeSavedMinutes: isRecovered ? 11 : undefined,
    hospitalMinutesRecovered: isRecovered ? 128 : undefined,
    isRecovered,
  }
}


