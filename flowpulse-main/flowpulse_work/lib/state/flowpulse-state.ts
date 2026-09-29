import type {
  Bed,
  Department,
  DepartmentQueue,
  DiagnosticResource,
  FlowGraph,
  Hospital,
  HospitalAlert,
  HospitalStatus,
  InterventionOption,
  InterventionState,
  Patient,
  PatientJourney,
  RippleStep,
  ScenarioId,
  ScenarioPhase,
  StaffMember,
  StaffRoleView,
  TimeHorizon,
  UserAppointment,
  ActivityLogEvent,
} from "../data/types"
import { hospital as defaultHospital } from "../data/hospital"
import { staff as defaultStaff } from "../data/staff"
import { beds as defaultBeds } from "../data/beds"
import { computeScenarioState, ScenarioComputedData } from "./scenario-engine"

// ============================================================================
// FlowPulse State Model
// Single central store powering both Staff Command Center and Patient Experience.
// ============================================================================

export interface FlowPulseState {
  hospital: Hospital
  departments: Department[]
  queues: DepartmentQueue[]
  patients: Patient[]
  staff: StaffMember[]
  beds: Bed[]
  diagnosticResources: DiagnosticResource[]
  flowGraph: FlowGraph
  
  // Role View Selector
  staffRoleView: StaffRoleView

  // Scenario & Simulation Controls
  activeScenario: ScenarioId
  scenarioPhase: ScenarioPhase
  timeHorizon: TimeHorizon
  isSimulating: boolean
  
  // Interventions & Decisions
  interventions: InterventionOption[]
  approvedIntervention: string | null
  interventionState: InterventionState
  
  // Calculated & Dynamic Values
  hospitalStatus: HospitalStatus
  hospitalHealthScore: number
  rippleEvents: RippleStep[]
  activityFeed: ActivityLogEvent[]
  notifications: HospitalAlert[]
  patientJourney: PatientJourney
  rootCauseBreakdown: { name: string; percentage: number; color: string }[]
  
  // Computed KPI aggregates
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
  
  // Judge Demo Workflow State
  judgeDemoActive: boolean
  judgeDemoStep: number // 1 to 14
  
  // User appointments (persisted)
  userAppointments: UserAppointment[]
}

// ----------------------------------------------------------------------------
// Action Definitions
// ----------------------------------------------------------------------------
export type FlowPulseAction =
  | { type: "SET_ROLE_VIEW"; roleView: StaffRoleView }
  | { type: "SET_SCENARIO"; scenarioId: ScenarioId }
  | { type: "SET_SCENARIO_PHASE"; phase: ScenarioPhase }
  | { type: "SET_TIME_HORIZON"; horizon: TimeHorizon }
  | { type: "START_SIMULATION" }
  | { type: "PAUSE_SIMULATION" }
  | { type: "RESET_SCENARIO" }
  | { type: "APPROVE_INTERVENTION"; interventionId: string }
  | { type: "REJECT_INTERVENTION" }
  | { type: "MODIFY_INTERVENTION" }
  | { type: "START_JUDGE_DEMO" }
  | { type: "ADVANCE_JUDGE_DEMO" }
  | { type: "SET_JUDGE_DEMO_STEP"; step: number }
  | { type: "RESET_JUDGE_DEMO" }
  | { type: "ADD_APPOINTMENT"; appointment: UserAppointment }
  | { type: "MARK_ALERT_READ"; alertId: string }
  | { type: "MARK_ALL_ALERTS_READ" }
  | { type: "LOG_ACTIVITY"; event: Omit<ActivityLogEvent, "id" | "timestamp"> }

// ----------------------------------------------------------------------------
// Initial Activity Feed
// ----------------------------------------------------------------------------
const INITIAL_ACTIVITIES: ActivityLogEvent[] = [
  {
    id: "act-1",
    timestamp: "11:30:00",
    category: "system",
    title: "System Initialization",
    detail: "12 hospital feeds connected and telemetry verified.",
    tone: "healthy",
  },
  {
    id: "act-2",
    timestamp: "11:31:15",
    category: "prediction",
    title: "FlowPulse Predictive Engine Online",
    detail: "Real-time horizon models initialized at 30m, 60m, 120m.",
    tone: "healthy",
  },
]

// ----------------------------------------------------------------------------
// Initial State Builder
// ----------------------------------------------------------------------------
export function createInitialState(): FlowPulseState {
  const computed = computeScenarioState("normal", 0, "now", null)

  return {
    hospital: defaultHospital,
    departments: computed.departments,
    queues: computed.queues,
    patients: computed.patients,
    staff: defaultStaff,
    beds: defaultBeds,
    diagnosticResources: computed.diagnostics,
    flowGraph: computed.flowGraph,

    staffRoleView: "operations-manager",

    activeScenario: "normal",
    scenarioPhase: 0,
    timeHorizon: "now",
    isSimulating: false,

    interventions: computed.interventions,
    approvedIntervention: null,
    interventionState: "unreviewed",

    hospitalStatus: computed.hospitalStatus,
    hospitalHealthScore: computed.hospitalHealthScore,
    rippleEvents: computed.ripple,
    activityFeed: INITIAL_ACTIVITIES,
    notifications: computed.activeAlerts,
    patientJourney: computed.patientJourney,
    rootCauseBreakdown: computed.rootCauseBreakdown,

    kpis: computed.kpis,

    judgeDemoActive: false,
    judgeDemoStep: 1,

    userAppointments: [
      {
        id: "FP-2026-10482",
        patientName: "Arjun Kumar",
        departmentId: "cardiology",
        departmentName: "Cardiology",
        doctorId: "DOC-101",
        doctorName: "Dr. Ananya Rao",
        doctorQualification: "Consultant Cardiologist",
        scheduledTime: "10:30 AM",
        recommendedArrivalWindow: "10:35–10:45 AM",
        estimatedCompletionTime: "12:08 PM",
        status: "confirmed",
        createdAt: new Date().toISOString(),
      },
    ],
  }
}

// ----------------------------------------------------------------------------
// Reducer
// ----------------------------------------------------------------------------
export function flowPulseReducer(state: FlowPulseState, action: FlowPulseAction): FlowPulseState {
  const nowTime = new Date().toLocaleTimeString([], { hour12: false })

  switch (action.type) {
    case "SET_ROLE_VIEW":
      return { ...state, staffRoleView: action.roleView }

    case "SET_SCENARIO": {
      const isLab = action.scenarioId === "lab-analyzer-failure"
      const phase: ScenarioPhase = isLab ? 1 : 0
      const computed = computeScenarioState(action.scenarioId, phase, state.timeHorizon, null)

      const newActivities = [...state.activityFeed]
      if (isLab) {
        newActivities.unshift({
          id: `act-${Date.now()}`,
          timestamp: "11:32:01",
          category: "equipment",
          title: "Lab Analyzer #2 Went Offline",
          detail: "Hardware signal lost on LAB-AN-02. Testing capacity reduced by 50%.",
          tone: "critical",
        })
      } else {
        newActivities.unshift({
          id: `act-${Date.now()}`,
          timestamp: nowTime,
          category: "system",
          title: `Scenario Switched to ${action.scenarioId.toUpperCase()}`,
          detail: "Operational models updated to reflect active simulation.",
          tone: "neutral",
        })
      }

      return {
        ...state,
        activeScenario: action.scenarioId,
        scenarioPhase: phase,
        approvedIntervention: null,
        interventionState: "unreviewed",
        departments: computed.departments,
        queues: computed.queues,
        flowGraph: computed.flowGraph,
        diagnosticResources: computed.diagnostics,
        patients: computed.patients,
        hospitalStatus: computed.hospitalStatus,
        hospitalHealthScore: computed.hospitalHealthScore,
        kpis: computed.kpis,
        rippleEvents: computed.ripple,
        notifications: [...computed.activeAlerts, ...state.notifications.slice(0, 5)],
        patientJourney: computed.patientJourney,
        activityFeed: newActivities.slice(0, 20),
      }
    }

    case "SET_SCENARIO_PHASE": {
      const computed = computeScenarioState(
        state.activeScenario,
        action.phase,
        state.timeHorizon,
        state.approvedIntervention,
      )

      const newActivities = [...state.activityFeed]
      if (action.phase === 1) {
        newActivities.unshift({
          id: `act-${Date.now()}`,
          timestamp: "11:32:01",
          category: "equipment",
          title: "Analyzer #2 Went Offline",
          detail: "LAB-AN-02 signal drop reported via Sunquest LIS.",
          tone: "critical",
        })
      } else if (action.phase === 2) {
        newActivities.unshift({
          id: `act-${Date.now()}`,
          timestamp: "11:32:08",
          category: "system",
          title: "Abnormal Queue Growth Detected",
          detail: "Lab queue grew to 44 samples; utilization climbed to 92%.",
          tone: "critical",
        })
      } else if (action.phase === 3) {
        newActivities.unshift({
          id: `act-${Date.now()}`,
          timestamp: "11:32:14",
          category: "prediction",
          title: "Ripple Prediction Generated",
          detail: "Projected Emergency wait escalation: 18 min → 43 min at +120m horizon.",
          tone: "critical",
        })
      } else if (action.phase === 4) {
        newActivities.unshift({
          id: `act-${Date.now()}-sim`,
          timestamp: "11:32:18",
          category: "intervention",
          title: "4 Operational Interventions Simulated",
          detail: "Counterfactual trade-off matrix computed across Options A, B, C, D.",
          tone: "healthy",
        })
        newActivities.unshift({
          id: `act-${Date.now()}-rec`,
          timestamp: "11:32:25",
          category: "intervention",
          title: "Option C Recommended by FlowPulse",
          detail: "Activate Backup Analyzer (LAB-AN-03) recommended with 88% confidence.",
          tone: "healthy",
        })
      } else if (action.phase === 6) {
        newActivities.unshift({
          id: `act-${Date.now()}`,
          timestamp: "11:34:10",
          category: "recovery",
          title: "Laboratory Load Decreasing",
          detail: "Backup analyzer online. Lab util reducing 92% → 68%, ED projected wait dropping to 25 min.",
          tone: "healthy",
        })
      }

      return {
        ...state,
        scenarioPhase: action.phase,
        departments: computed.departments,
        queues: computed.queues,
        flowGraph: computed.flowGraph,
        diagnosticResources: computed.diagnostics,
        patients: computed.patients,
        hospitalStatus: computed.hospitalStatus,
        hospitalHealthScore: computed.hospitalHealthScore,
        kpis: computed.kpis,
        rippleEvents: computed.ripple,
        notifications: [...computed.activeAlerts, ...state.notifications.slice(0, 5)],
        patientJourney: computed.patientJourney,
        activityFeed: newActivities.slice(0, 20),
      }
    }

    case "SET_TIME_HORIZON": {
      const computed = computeScenarioState(
        state.activeScenario,
        state.scenarioPhase,
        action.horizon,
        state.approvedIntervention,
      )

      return {
        ...state,
        timeHorizon: action.horizon,
        departments: computed.departments,
        queues: computed.queues,
        flowGraph: computed.flowGraph,
        kpis: computed.kpis,
        hospitalStatus: computed.hospitalStatus,
        hospitalHealthScore: computed.hospitalHealthScore,
      }
    }

    case "START_SIMULATION":
      return { ...state, isSimulating: true }

    case "PAUSE_SIMULATION":
      return { ...state, isSimulating: false }

    case "RESET_SCENARIO": {
      const computed = computeScenarioState("normal", 0, "now", null)
      return {
        ...state,
        activeScenario: "normal",
        scenarioPhase: 0,
        timeHorizon: "now",
        isSimulating: false,
        approvedIntervention: null,
        interventionState: "unreviewed",
        judgeDemoActive: false,
        judgeDemoStep: 1,
        departments: computed.departments,
        queues: computed.queues,
        flowGraph: computed.flowGraph,
        diagnosticResources: computed.diagnostics,
        patients: computed.patients,
        hospitalStatus: computed.hospitalStatus,
        hospitalHealthScore: computed.hospitalHealthScore,
        kpis: computed.kpis,
        rippleEvents: computed.ripple,
        notifications: computed.activeAlerts,
        patientJourney: computed.patientJourney,
        activityFeed: [
          {
            id: `act-${Date.now()}`,
            timestamp: nowTime,
            category: "system",
            title: "Hospital State Reset",
            detail: "All departments, diagnostic units, and queues returned to baseline normal.",
            tone: "healthy",
          },
          ...state.activityFeed.slice(0, 15),
        ],
      }
    }

    case "APPROVE_INTERVENTION": {
      const computed = computeScenarioState(
        state.activeScenario,
        6, // Move immediately to recovery phase
        state.timeHorizon,
        action.interventionId,
      )

      const approvedOpt = state.interventions.find((o) => o.id === action.interventionId)

      return {
        ...state,
        approvedIntervention: action.interventionId,
        interventionState: "approved",
        scenarioPhase: 6,
        departments: computed.departments,
        queues: computed.queues,
        flowGraph: computed.flowGraph,
        diagnosticResources: computed.diagnostics,
        hospitalStatus: computed.hospitalStatus,
        hospitalHealthScore: computed.hospitalHealthScore,
        kpis: computed.kpis,
        rippleEvents: computed.ripple,
        patientJourney: computed.patientJourney,
        activityFeed: [
          {
            id: `act-${Date.now()}-app`,
            timestamp: "11:32:41",
            category: "approval",
            title: `Plan Approved by Operations Manager`,
            detail: `${approvedOpt?.label ?? "Option C"} authorized. Commencing hardware initialization.`,
            tone: "healthy",
          },
          {
            id: `act-${Date.now()}-act`,
            timestamp: "11:32:53",
            category: "recovery",
            title: `Backup Analyzer Activated`,
            detail: "LAB-AN-03 spun up; specimen queue recovering and discharge pathways cleared.",
            tone: "healthy",
          },
          {
            id: `act-${Date.now()}-dec`,
            timestamp: "11:34:10",
            category: "recovery",
            title: "Laboratory Load Decreasing",
            detail: "Testing load reduced to 68%. Emergency projected wait falling to 25 min.",
            tone: "healthy",
          },
          ...state.activityFeed.slice(0, 15),
        ],
        notifications: [
          {
            id: `alt-app-${Date.now()}`,
            title: "Intervention Approved & Active",
            detail: "Option C activated. Projected recovery in 18 minutes.",
            tone: "healthy",
            time: "Just now",
            read: false,
            actionLink: "/staff/scenario-simulator",
          },
          ...state.notifications.slice(0, 5),
        ],
      }
    }

    case "REJECT_INTERVENTION":
      return {
        ...state,
        interventionState: "rejected",
        activityFeed: [
          {
            id: `act-${Date.now()}`,
            timestamp: nowTime,
            category: "approval",
            title: "Intervention Rejected",
            detail: "Operational intervention was dismissed by Operations Manager.",
            tone: "warning",
          },
          ...state.activityFeed.slice(0, 15),
        ],
      }

    case "MODIFY_INTERVENTION":
      return {
        ...state,
        interventionState: "modified",
      }

    // ------------------------------------------------------------------------
    // Judge Demo Workflow Actions
    // ------------------------------------------------------------------------
    case "START_JUDGE_DEMO": {
      const computed = computeScenarioState("normal", 0, "now", null)
      return {
        ...state,
        judgeDemoActive: true,
        judgeDemoStep: 1,
        activeScenario: "normal",
        scenarioPhase: 0,
        approvedIntervention: null,
        interventionState: "unreviewed",
        departments: computed.departments,
        queues: computed.queues,
        flowGraph: computed.flowGraph,
        diagnosticResources: computed.diagnostics,
        hospitalStatus: computed.hospitalStatus,
        kpis: computed.kpis,
        patientJourney: computed.patientJourney,
        activityFeed: [
          {
            id: `act-${Date.now()}`,
            timestamp: "11:30:00",
            category: "system",
            title: "Judge Demo Mode Initiated",
            detail: "Step 1: Normal baseline hospital operations active.",
            tone: "healthy",
          },
          ...state.activityFeed.slice(0, 15),
        ],
      }
    }

    case "ADVANCE_JUDGE_DEMO": {
      const nextStep = Math.min(14, state.judgeDemoStep + 1)
      return flowPulseReducer(state, { type: "SET_JUDGE_DEMO_STEP", step: nextStep })
    }

    case "SET_JUDGE_DEMO_STEP": {
      const step = action.step
      let nextScenario: ScenarioId = state.activeScenario
      let nextPhase: ScenarioPhase = state.scenarioPhase
      let nextApproved: string | null = state.approvedIntervention
      let nextHorizon: TimeHorizon = state.timeHorizon

      if (step === 1) {
        nextScenario = "normal"
        nextPhase = 0
        nextApproved = null
        nextHorizon = "now"
      } else if (step === 2) {
        nextScenario = "lab-analyzer-failure"
        nextPhase = 1
        nextApproved = null
      } else if (step === 3) {
        nextScenario = "lab-analyzer-failure"
        nextPhase = 2
        nextApproved = null
      } else if (step === 4) {
        nextScenario = "lab-analyzer-failure"
        nextPhase = 3
        nextApproved = null
      } else if (step === 5 || step === 6 || step === 7) {
        nextScenario = "lab-analyzer-failure"
        nextPhase = 3
        nextApproved = null
      } else if (step === 8 || step === 9) {
        nextScenario = "lab-analyzer-failure"
        nextPhase = 4
        nextApproved = null
      } else if (step === 10) {
        nextScenario = "lab-analyzer-failure"
        nextPhase = 5
        nextApproved = "option-c"
      } else if (step >= 11) {
        nextScenario = "lab-analyzer-failure"
        nextPhase = 6
        nextApproved = "option-c"
      }

      const computed = computeScenarioState(nextScenario, nextPhase, nextHorizon, nextApproved)

      return {
        ...state,
        judgeDemoActive: true,
        judgeDemoStep: step,
        activeScenario: nextScenario,
        scenarioPhase: nextPhase,
        timeHorizon: nextHorizon,
        approvedIntervention: nextApproved,
        interventionState: nextApproved ? "approved" : "unreviewed",
        departments: computed.departments,
        queues: computed.queues,
        flowGraph: computed.flowGraph,
        diagnosticResources: computed.diagnostics,
        hospitalStatus: computed.hospitalStatus,
        hospitalHealthScore: computed.hospitalHealthScore,
        kpis: computed.kpis,
        rippleEvents: computed.ripple,
        patientJourney: computed.patientJourney,
        notifications: [...computed.activeAlerts, ...state.notifications.slice(0, 5)],
      }
    }

    case "RESET_JUDGE_DEMO":
      return flowPulseReducer(state, { type: "RESET_SCENARIO" })

    case "ADD_APPOINTMENT":
      return {
        ...state,
        userAppointments: [action.appointment, ...state.userAppointments],
        activityFeed: [
          {
            id: `act-${Date.now()}`,
            timestamp: nowTime,
            category: "system",
            title: `New Appointment Booked (${action.appointment.departmentName})`,
            detail: `Patient ${action.appointment.patientName} scheduled for ${action.appointment.scheduledTime} with ${action.appointment.doctorName}.`,
            tone: "healthy",
          },
          ...state.activityFeed.slice(0, 15),
        ],
      }

    case "MARK_ALERT_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id === action.alertId ? { ...n, read: true } : n)),
      }

    case "MARK_ALL_ALERTS_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      }

    case "LOG_ACTIVITY":
      return {
        ...state,
        activityFeed: [
          {
            id: `act-${Date.now()}`,
            timestamp: nowTime,
            ...action.event,
          },
          ...state.activityFeed.slice(0, 20),
        ],
      }

    default:
      return state
  }
}
