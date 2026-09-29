import type {
  Department,
  DepartmentId,
  DepartmentQueue,
  DiagnosticResource,
  FlowNode,
  FlowEdge,
  HospitalAlert,
  HospitalStatus,
  InterventionOption,
  Patient,
  PatientJourney,
  RippleStep,
  ScenarioId,
  ScenarioPhase,
  TimeHorizon,
} from "../data/types"
import { departments as defaultDepartments } from "../data/hospital"
import { flowGraph as defaultFlowGraph } from "../data/flow"
import { diagnostics as defaultDiagnostics } from "../data/diagnostics"
import { patients as defaultPatients } from "../data/patients"
import { INITIAL_QUEUES } from "../data/queues"
import { IMAGES } from "../data/images"

// ============================================================================
// FlowPulse Scenario Engine
// Computes dynamic hospital state per scenario, multi-phase progression, and time horizon.
// ============================================================================

export interface ScenarioComputedData {
  hospitalStatus: HospitalStatus
  hospitalHealthScore: number
  departments: Department[]
  queues: DepartmentQueue[]
  flowGraph: { nodes: FlowNode[]; edges: FlowEdge[] }
  diagnostics: DiagnosticResource[]
  patients: Patient[]
  kpis: {
    activePatients: number
    waitingPatients: number
    labUtilization: number
    labAvgWait: number
    emergencyWaitMinutes: number
    emergencyOccupancy: number
    availableBeds: number
    occupiedBeds: number
    delayedDischarges: number
    delayedDoctorReviews: number
    activeBottlenecks: number
    rippleRiskScore: number
  }
  ripple: RippleStep[]
  interventions: InterventionOption[]
  activeAlerts: HospitalAlert[]
  patientJourney: PatientJourney
  rootCauseBreakdown: { name: string; percentage: number; color: string }[]
  timeHorizonNote: string
}

// ----------------------------------------------------------------------------
// Base Patient Journey (Arjun Kumar - Cardiology visit with Dr. Ananya Rao)
// ----------------------------------------------------------------------------
export function getBasePatientJourney(
  scenarioId: ScenarioId,
  phase: ScenarioPhase,
  approvedIntervention: string | null,
): PatientJourney {
  let labWait = "31 min"
  let labTime = "11:18 est."
  let reviewTime = "11:43 est."
  let pharmacyTime = "11:56 est."
  let completionTime = "12:08 PM"
  let arrivalWindow = "10:35–10:45 AM"
  let alertMessage: string | null = null

  if (scenarioId === "lab-analyzer-failure") {
    if (phase >= 1 && phase <= 4) {
      labWait = phase >= 2 ? "48 min (+17m delay)" : "31 min"
      labTime = phase >= 2 ? "11:34 est." : "11:18 est."
      reviewTime = phase >= 2 ? "12:01 est." : "11:43 est."
      pharmacyTime = phase >= 2 ? "12:14 est." : "11:56 est."
      completionTime = phase >= 2 ? "12:24 PM" : "12:08 PM"
      arrivalWindow = phase >= 2 ? "10:40–10:50 AM" : "10:35–10:45 AM"
      if (phase >= 2) {
        alertMessage =
          "Your estimated journey has been updated (+16m) due to temporary laboratory analyzer maintenance. Care team is actively coordinating throughput."
      }
    } else if (phase >= 5) {
      if (approvedIntervention === "option-c" || approvedIntervention === "option-d" || phase === 6) {
        labWait = "26 min (Recovered)"
        labTime = "11:22 est."
        reviewTime = "11:48 est."
        pharmacyTime = "12:01 est."
        completionTime = "12:12 PM"
        arrivalWindow = "10:35–10:45 AM"
        alertMessage =
          "Operational recovery underway: Backup analyzer LAB-AN-03 activated. Your estimated completion time improved to 12:12 PM."
      } else {
        labWait = "48 min"
        completionTime = "12:24 PM"
      }
    }
  } else if (scenarioId === "patient-surge") {
    completionTime = "12:28 PM"
    alertMessage = "High clinic inflow today. Priority triage active."
  } else if (scenarioId === "doctor-shortage") {
    completionTime = "12:35 PM"
    alertMessage = "Doctor review stage running with adjusted cadence."
  }

  return {
    patientId: "FP-2026-10482",
    patientName: "Arjun Kumar",
    departmentName: "Cardiology",
    doctorName: "Dr. Ananya Rao",
    doctorImage: IMAGES.doctors.drAnanyaRao,
    appointmentTime: "10:30 AM",
    recommendedArrival: arrivalWindow,
    estimatedCompletion: completionTime,
    alertMessage,
    stages: [
      {
        name: "Scheduled Appointment",
        stageId: "opd",
        status: "completed",
        scheduledTime: "10:30 AM",
        actualOrEstimatedTime: "10:30 AM",
        note: "Confirmed on-time arrival",
      },
      {
        name: "Registration & Triage",
        stageId: "registration",
        status: "completed",
        scheduledTime: "10:35 AM",
        actualOrEstimatedTime: "10:37 AM",
        note: "Vitals recorded · Non-urgent priority",
      },
      {
        name: "Doctor Consultation",
        stageId: "consultation",
        status: "in-progress",
        scheduledTime: "10:50 AM",
        actualOrEstimatedTime: "10:51 AM",
        waitMinutes: 8,
        note: "In consultation with Dr. Ananya Rao",
      },
      {
        name: "Diagnostic Laboratory",
        stageId: "laboratory",
        status: "upcoming",
        scheduledTime: "11:15 AM",
        actualOrEstimatedTime: labTime,
        waitMinutes: parseInt(labWait, 10) || 31,
        note: `Blood chemistry panel · ${labWait}`,
      },
      {
        name: "Doctor Review",
        stageId: "review",
        status: "upcoming",
        scheduledTime: "11:40 AM",
        actualOrEstimatedTime: reviewTime,
        note: "Results evaluation & prescription",
      },
      {
        name: "Pharmacy Dispensing",
        stageId: "pharmacy",
        status: "upcoming",
        scheduledTime: "11:55 AM",
        actualOrEstimatedTime: pharmacyTime,
        note: "Medication pickup",
      },
      {
        name: "Discharge & Departure",
        stageId: "discharge",
        status: "upcoming",
        scheduledTime: "12:08 PM",
        actualOrEstimatedTime: completionTime,
        note: "Care summary & follow-up schedule",
      },
    ],
  }
}

// ----------------------------------------------------------------------------
// Interventions Library for LAB_ANALYZER_FAILURE
// ----------------------------------------------------------------------------
export const LAB_FAILURE_INTERVENTIONS: InterventionOption[] = [
  {
    id: "option-a",
    label: "Option A — Do Nothing (Baseline)",
    description: "Allow analyzer repair queue to proceed without operational adjustments.",
    edWaitMinutes: 43,
    delayedDischarges: 9,
    bedsDelta: -7,
    bedsDeltaLabel: "7 Beds lost to holdovers",
    staffImpact: "Low",
    operationalCost: "Low",
    confidence: 94,
    recommended: false,
  },
  {
    id: "option-b",
    label: "Option B — Reassign Qualified Technician",
    description: "Temporarily shift Technician T07 (S. Verma) from Radiology to assist Laboratory manual processing.",
    edWaitMinutes: 31,
    delayedDischarges: 5,
    bedsDelta: 4,
    bedsDeltaLabel: "4 Beds recovered",
    staffImpact: "Medium",
    operationalCost: "Low",
    confidence: 76,
    recommended: false,
  },
  {
    id: "option-c",
    label: "Option C — Activate Backup Analyzer (LAB-AN-03)",
    description: "Bring cold-standby Analyzer #3 online and reroute routine biochemistry batches.",
    edWaitMinutes: 25,
    delayedDischarges: 3,
    bedsDelta: 6,
    bedsDeltaLabel: "6 Beds recovered",
    staffImpact: "Low",
    operationalCost: "Medium",
    confidence: 88,
    recommended: true,
  },
  {
    id: "option-d",
    label: "Option D — Tech Reassignment + Backup Analyzer",
    description: "Simultaneously spin up Analyzer #3 and reassign T07 for maximum specimen throughput.",
    edWaitMinutes: 21,
    delayedDischarges: 2,
    bedsDelta: 7,
    bedsDeltaLabel: "7 Beds recovered",
    staffImpact: "High",
    operationalCost: "High",
    confidence: 84,
    recommended: false,
  },
]

// ----------------------------------------------------------------------------
// Main Computation Function
// ----------------------------------------------------------------------------
export function computeScenarioState(
  scenarioId: ScenarioId,
  phase: ScenarioPhase = 0,
  horizon: TimeHorizon = "now",
  approvedIntervention: string | null = null,
): ScenarioComputedData {
  const depts: Department[] = JSON.parse(JSON.stringify(defaultDepartments))
  const diags: DiagnosticResource[] = JSON.parse(JSON.stringify(defaultDiagnostics))
  const fNodes: FlowNode[] = JSON.parse(JSON.stringify(defaultFlowGraph.nodes))
  const fEdges: FlowEdge[] = JSON.parse(JSON.stringify(defaultFlowGraph.edges))
  const patList: Patient[] = JSON.parse(JSON.stringify(defaultPatients))

  let hospitalStatus: HospitalStatus = "Stable"
  let healthScore = 92
  let labUtil = 74
  let labWait = 31
  let edWait = 18
  let edOcc = 21
  let availBeds = 18
  let delayedDischarges = 0
  let delayedReviews = 0
  let activeBottlenecks = 0
  let rippleScore = 14

  let rippleSteps: RippleStep[] = [
    { offsetMinutes: 30, label: "Scheduled clinic arrivals on track", metric: "100% SLA", severity: "healthy" },
    { offsetMinutes: 60, label: "Laboratory processing steady", metric: "31 min avg", severity: "healthy" },
    { offsetMinutes: 90, label: "Inpatient discharge velocity normal", metric: "14/hr", severity: "healthy" },
    { offsetMinutes: 120, label: "Emergency department flow balanced", metric: "18 min wait", severity: "healthy" },
  ]

  let activeAlerts: HospitalAlert[] = [
    {
      id: "alt-1",
      title: "FlowPulse Engine Active",
      detail: "12 hospital feeds connected with 98.4% telemetry confidence.",
      tone: "healthy",
      time: "Just now",
      read: false,
    },
  ]

  let rootCauseBreakdown = [
    { name: "Laboratory Capacity", percentage: 31, color: "var(--color-critical, #e11d48)" },
    { name: "Doctor Review", percentage: 23, color: "var(--color-warning, #f59e0b)" },
    { name: "Discharge Process", percentage: 17, color: "#3b82f6" },
    { name: "Bed Cleaning / Turnover", percentage: 13, color: "#8b5cf6" },
    { name: "Pharmacy Queue", percentage: 9, color: "#10b981" },
    { name: "Other Factors", percentage: 7, color: "#64748b" },
  ]

  // ==========================================================================
  // SCENARIO: LAB_ANALYZER_FAILURE
  // ==========================================================================
  if (scenarioId === "lab-analyzer-failure") {
    const an2 = diags.find((d) => d.id === "LAB-AN-02")
    const an3 = diags.find((d) => d.id === "LAB-AN-03")

    if (phase === 0) {
      labUtil = 74
      labWait = 31
      edWait = 18
      availBeds = 18
      hospitalStatus = "Stable"
      healthScore = 91
      activeBottlenecks = 0
    } else if (phase === 1) {
      if (an2) {
        an2.status = "offline"
        an2.utilization = 0
      }
      labUtil = 74
      labWait = 31
      edWait = 18
      availBeds = 18
      hospitalStatus = "Stable"
      healthScore = 84
      activeBottlenecks = 1
      activeAlerts.unshift({
        id: `alt-p1-${Date.now()}`,
        title: "Laboratory Analyzer #2 Offline",
        detail: "Automated alert from LIS: Specimen batch routing degraded.",
        tone: "warning",
        time: "1m ago",
        read: false,
        actionLink: "/staff/departments",
      })
    } else if (phase === 2) {
      if (an2) {
        an2.status = "offline"
        an2.utilization = 0
      }
      labUtil = 92
      labWait = 48
      edWait = 19
      availBeds = 17
      hospitalStatus = "Elevated"
      healthScore = 72
      activeBottlenecks = 1
      rippleScore = 48

      activeAlerts.unshift({
        id: `alt-p2-${Date.now()}`,
        title: "Laboratory Bottleneck Building",
        detail: "Utilization climbed to 92%. Expected wait increased to 48 min.",
        tone: "critical",
        time: "Just now",
        read: false,
        actionLink: "/staff/ripple-analysis",
      })
    } else if (phase === 3 || phase === 4 || (phase === 5 && approvedIntervention === null)) {
      if (an2) {
        an2.status = "offline"
        an2.utilization = 0
      }
      labUtil = 92
      labWait = 54
      delayedReviews = 14
      delayedDischarges = 9
      activeBottlenecks = 2
      rippleScore = 86

      if (horizon === "now") {
        edWait = 18
        availBeds = 18
        hospitalStatus = "Elevated"
        healthScore = 68
      } else if (horizon === "30m") {
        edWait = 22
        availBeds = 16
        hospitalStatus = "Elevated"
        healthScore = 60
      } else if (horizon === "60m") {
        edWait = 29
        availBeds = 14
        hospitalStatus = "Strained"
        healthScore = 49
      } else if (horizon === "120m") {
        edWait = 43
        availBeds = 11
        hospitalStatus = "Critical"
        healthScore = 38
      }

      rippleSteps = [
        {
          offsetMinutes: 30,
          label: "14 Doctor Reviews delayed due to pending lab results",
          metric: "+14 Reviews",
          severity: "warning",
        },
        {
          offsetMinutes: 60,
          label: "9 Inpatient Discharges stalled awaiting clinical sign-off",
          metric: "+9 Discharges",
          severity: "warning",
        },
        {
          offsetMinutes: 90,
          label: "7 Inpatient beds remain blocked by delayed discharges",
          metric: "-7 Beds",
          severity: "critical",
        },
        {
          offsetMinutes: 120,
          label: "Emergency Department boarding surge: Wait spikes 18 → 43 min",
          metric: "43 min wait",
          severity: "critical",
        },
      ]

      activeAlerts.unshift({
        id: `alt-p3-${Date.now()}`,
        title: "Critical Downstream Ripple Predicted",
        detail: "Laboratory outage predicted to escalate Emergency wait to 43 min at +120m.",
        tone: "critical",
        time: "Just now",
        read: false,
        actionLink: "/staff/ripple-analysis",
      })
    } else if (phase >= 5 && (approvedIntervention === "option-c" || approvedIntervention === "option-d" || phase === 6)) {
      if (an3) {
        an3.status = "online"
        an3.utilization = 64
      }
      if (an2) {
        an2.status = "maintenance"
        an2.utilization = 0
      }

      labUtil = 68
      labWait = 26
      edWait = 25
      availBeds = 17
      delayedDischarges = 3
      delayedReviews = 4
      activeBottlenecks = 0
      hospitalStatus = "Stable"
      healthScore = 89
      rippleScore = 22

      rippleSteps = [
        { offsetMinutes: 30, label: "Backup Analyzer #3 running routine batches", metric: "60/hr cap", severity: "healthy" },
        { offsetMinutes: 60, label: "Doctor Review queue normalized", metric: "4 in queue", severity: "healthy" },
        { offsetMinutes: 90, label: "Discharge turnover restored: 6 beds recovered", metric: "+6 Beds", severity: "healthy" },
        { offsetMinutes: 120, label: "Emergency wait stabilized at 25 min", metric: "25 min (Safe)", severity: "healthy" },
      ]

      activeAlerts.unshift({
        id: `alt-p6-${Date.now()}`,
        title: "Plan Executed — Hospital Flow Recovering",
        detail: "Option C activated. Laboratory load decreasing from 92% to 68%.",
        tone: "healthy",
        time: "Just now",
        read: false,
        actionLink: "/staff/scenario-simulator",
      })
    }

    const labDept = depts.find((d) => d.id === "laboratory")
    if (labDept) {
      labDept.utilization = labUtil
      labDept.avgWaitMinutes = labWait
      labDept.status = labUtil >= 88 ? "critical" : labUtil >= 80 ? "warning" : "healthy"
    }

    const edDept = depts.find((d) => d.id === "emergency")
    if (edDept) {
      edDept.avgWaitMinutes = edWait
      edDept.status = edWait >= 38 ? "critical" : edWait >= 24 ? "warning" : "healthy"
    }

    const dcDept = depts.find((d) => d.id === "discharge")
    if (dcDept) {
      dcDept.avgWaitMinutes = phase >= 3 && phase <= 4 ? 58 : 34
      dcDept.status = phase >= 3 && phase <= 4 ? "warning" : "healthy"
    }
  } else if (scenarioId === "patient-surge") {
    hospitalStatus = "Strained"
    healthScore = 64
    edWait = 46
    edOcc = 24
    activeBottlenecks = 2
    rippleScore = 78
    const edDept = depts.find((d) => d.id === "emergency")
    if (edDept) {
      edDept.utilization = 98
      edDept.avgWaitMinutes = 46
      edDept.status = "critical"
    }
    const opdDept = depts.find((d) => d.id === "general-opd")
    if (opdDept) {
      opdDept.utilization = 92
      opdDept.avgWaitMinutes = 42
      opdDept.status = "warning"
    }
  } else if (scenarioId === "doctor-shortage") {
    hospitalStatus = "Strained"
    healthScore = 70
    delayedReviews = 18
    activeBottlenecks = 2
    rippleScore = 65
    const cardDept = depts.find((d) => d.id === "cardiology")
    if (cardDept) {
      cardDept.utilization = 94
      cardDept.avgWaitMinutes = 52
      cardDept.status = "critical"
    }
  } else if (scenarioId === "ct-machine-failure") {
    hospitalStatus = "Elevated"
    healthScore = 76
    activeBottlenecks = 1
    rippleScore = 55
    const radDept = depts.find((d) => d.id === "radiology")
    if (radDept) {
      radDept.utilization = 96
      radDept.avgWaitMinutes = 64
      radDept.status = "critical"
    }
    const ct1 = diags.find((d) => d.id === "RAD-CT-01")
    if (ct1) {
      ct1.status = "offline"
      ct1.utilization = 0
    }
  } else if (scenarioId === "bed-shortage") {
    hospitalStatus = "Critical"
    healthScore = 52
    availBeds = 3
    activeBottlenecks = 3
    rippleScore = 89
    const wa = depts.find((d) => d.id === "ward-a")
    if (wa) {
      wa.utilization = 98
      wa.status = "critical"
    }
    const wb = depts.find((d) => d.id === "ward-b")
    if (wb) {
      wb.utilization = 96
      wb.status = "critical"
    }
  }

  fNodes.forEach((node) => {
    if (node.id === "laboratory") {
      node.count = Math.round(24 * (labUtil / 74))
      node.status = labUtil >= 88 ? "critical" : labUtil >= 80 ? "warning" : "healthy"
    } else if (node.id === "emergency") {
      node.count = Math.round(21 * (edWait / 18))
      node.status = edWait >= 38 ? "critical" : edWait >= 24 ? "warning" : "healthy"
    } else if (node.id === "review") {
      node.count = 19 + delayedReviews
      node.status = delayedReviews > 8 ? "critical" : delayedReviews > 3 ? "warning" : "healthy"
    } else if (node.id === "discharge") {
      node.count = 9 + delayedDischarges
      node.status = delayedDischarges > 6 ? "warning" : "healthy"
    }
  })

  // Clone and dynamically adjust department queues per scenario
  const queuesList: DepartmentQueue[] = JSON.parse(JSON.stringify(INITIAL_QUEUES))

  const labQueue = queuesList.find((q) => q.departmentId === "laboratory")
  if (labQueue) {
    if (scenarioId === "lab-analyzer-failure") {
      if (phase === 0) {
        labQueue.activeResources = 3
        labQueue.currentWaitMinutes = 18
        labQueue.queueStatus = "HEALTHY"
      } else if (phase === 1) {
        labQueue.activeResources = 2
        labQueue.currentWaitMinutes = 24
        labQueue.predictedWait30 = 38
        labQueue.queueStatus = "MODERATE"
      } else if (phase >= 2 && phase <= 4) {
        labQueue.activeResources = 2
        labQueue.currentWaitMinutes = phase >= 3 ? 43 : 34
        labQueue.predictedWait30 = 43
        labQueue.predictedWait60 = 47
        labQueue.predictedWait120 = 41
        labQueue.queueStatus = "CRITICAL"
      } else if (phase === 5) {
        labQueue.activeResources = 3 // Backup analyzer active
        labQueue.currentWaitMinutes = 27
        labQueue.predictedWait30 = 22
        labQueue.queueStatus = "RECOVERING"
      } else if (phase === 6) {
        labQueue.activeResources = 3
        labQueue.currentWaitMinutes = 20
        labQueue.predictedWait30 = 18
        labQueue.queueStatus = "HEALTHY"
      }
    }
  }

  const edQueue = queuesList.find((q) => q.departmentId === "emergency")
  if (edQueue) {
    edQueue.currentWaitMinutes = edWait
    edQueue.predictedWait120 =
      scenarioId === "lab-analyzer-failure" && phase >= 2 && phase < 5 ? 43 : 18
    edQueue.queueStatus = edWait >= 35 ? "CRITICAL" : edWait >= 20 ? "WARNING" : "HEALTHY"
  }

  const timeHorizonNote =
    horizon === "now"
      ? "Real-time live snapshot"
      : `Predictive forecast at +${horizon.replace("m", "")} minutes into future`

  const patientJourney = getBasePatientJourney(scenarioId, phase, approvedIntervention)

  return {
    hospitalStatus,
    hospitalHealthScore: healthScore,
    departments: depts,
    queues: queuesList,
    flowGraph: { nodes: fNodes, edges: fEdges },
    diagnostics: diags,
    patients: patList,
    kpis: {
      activePatients: patList.filter((p) => p.status !== "ready-for-discharge").length,
      waitingPatients: queuesList.reduce((acc, q) => acc + (q.waitingPatients?.length || 0), 0),
      labUtilization: labUtil,
      labAvgWait: labWait,
      emergencyWaitMinutes: edWait,
      emergencyOccupancy: edOcc,
      availableBeds: availBeds,
      occupiedBeds: 120 - availBeds,
      delayedDischarges,
      delayedDoctorReviews: delayedReviews,
      activeBottlenecks,
      rippleRiskScore: rippleScore,
    },
    ripple: rippleSteps,
    interventions: LAB_FAILURE_INTERVENTIONS,
    activeAlerts,
    patientJourney,
    rootCauseBreakdown,
    timeHorizonNote,
  }
}
