// ============================================================================
// FlowPulse AI — Centralized data models
// Every screen in the prototype reads from these shared types.
// ============================================================================

// --- Shared primitives -------------------------------------------------------

export type StatusTone = "healthy" | "warning" | "critical" | "neutral"

export type HospitalStatus =
  | "Stable"
  | "Elevated"
  | "Strained"
  | "Critical"

export type StaffRoleView = "operations-manager" | "department-head" | "bed-manager"

/** Stage identifiers used across the patient-flow graph. */
export type FlowStageId =
  | "registration"
  | "emergency"
  | "opd"
  | "consultation"
  | "laboratory"
  | "radiology"
  | "review"
  | "ward"
  | "icu"
  | "pharmacy"
  | "discharge"

// --- Hospital & departments --------------------------------------------------

export interface Hospital {
  id: string
  name: string
  region: string
  totalBeds: number
  departmentCount: number
}

export type DepartmentId =
  | "emergency"
  | "general-opd"
  | "cardiology"
  | "laboratory"
  | "radiology"
  | "icu"
  | "ward-a"
  | "ward-b"
  | "pharmacy"
  | "discharge"

export interface Department {
  id: DepartmentId
  name: string
  /** Short code used in dense tables / graph nodes. */
  code: string
  capacity: number
  currentOccupancy: number
  staffOnDuty: number
  /** 0–100 utilization percentage in the NORMAL baseline. */
  utilization: number
  avgWaitMinutes: number
  status: StatusTone
  description?: string
  imageUrl?: string
  specialties?: string[]
}

// --- Patients ----------------------------------------------------------------

export type PatientStatus =
  | "waiting"
  | "in-consultation"
  | "in-treatment"
  | "awaiting-results"
  | "ready-for-discharge"
  | "admitted"
  | "transferring"

/** Clinical priority is assigned by hospital staff — never inferred by AI. */
export type ClinicalPriority = "critical" | "urgent" | "standard" | "low"

export type DelayRisk = "low" | "moderate" | "high"

export interface Patient {
  id: string
  name: string
  age: number
  gender: "M" | "F"
  currentDepartment: DepartmentId
  previousDepartment: DepartmentId | null
  nextDepartment: DepartmentId | null
  /** ISO-like clock time "HH:MM" for the prototype. */
  arrivalTime: string
  waitingMinutes: number
  status: PatientStatus
  predictedCompletionTime: string
  /** Operational delay risk — a workflow signal, not a clinical one. */
  delayRisk: DelayRisk
  delayRiskScore: number
  /** Supplied by hospital staff. */
  clinicalPriority: ClinicalPriority
}

// --- Staff -------------------------------------------------------------------

export type StaffRole = "doctor" | "nurse" | "technician"

export type StaffAvailability =
  | "available"
  | "busy"
  | "on-break"
  | "off-duty"

export interface StaffMember {
  id: string
  name: string
  role: StaffRole
  department: DepartmentId
  /** e.g. "Cardiologist", "ICU Nurse", "Radiography Tech". */
  qualification: string
  /** Specialised skills used for scenario reassignment logic. */
  skills: string[]
  /** 0–100 current workload. */
  workload: number
  availability: StaffAvailability
  imageUrl?: string
  yearsExperience?: number
  education?: string
  languages?: string[]
  nextSlot?: string
  rating?: number
  biography?: string
  specialtyTags?: string[]
}

// --- Beds --------------------------------------------------------------------

export type BedStatus =
  | "occupied"
  | "available"
  | "reserved"
  | "dirty"
  | "cleaning"
  | "blocked"

export interface Bed {
  id: string
  ward: string
  bedNumber: string
  status: BedStatus
  assignedPatientId: string | null
  /** "HH:MM" when the bed is expected to become available, if applicable. */
  expectedAvailableAt: string | null
}

// --- Diagnostic resources ----------------------------------------------------

export type DiagnosticType =
  | "analyzer"
  | "ct"
  | "mri"
  | "xray"
  | "ultrasound"

export type EquipmentStatus = "online" | "degraded" | "offline" | "maintenance"

export interface DiagnosticResource {
  id: string
  name: string
  type: DiagnosticType
  department: DepartmentId
  status: EquipmentStatus
  /** Studies / samples processable per hour at full capacity. */
  capacityPerHour: number
  /** 0–100 current utilization. */
  utilization: number
}

// --- Patient-flow graph ------------------------------------------------------

export interface FlowNode {
  id: FlowStageId
  label: string
  /** Patients currently at this stage. */
  count: number
  status: StatusTone
}

export interface FlowEdge {
  id: string
  from: FlowStageId
  to: FlowStageId
  /** Patients that moved along this edge in the current window. */
  volume: number
  /** Average traversal time in minutes. */
  avgMinutes: number
}

export interface FlowGraph {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

// --- Predictions -------------------------------------------------------------

export interface DepartmentPrediction {
  departmentId: DepartmentId
  currentUtilization: number
  utilizationAt30: number
  utilizationAt60: number
  utilizationAt120: number
  /** Net queue growth expected over the horizon (patients). */
  queueGrowth: number
  predictedWaitMinutes: number
  /** 0–100 model confidence. */
  confidence: number
  bottleneckRisk: StatusTone
}

// --- Scenarios & interventions ----------------------------------------------

export type ScenarioId =
  | "normal"
  | "patient-surge"
  | "lab-analyzer-failure"
  | "doctor-shortage"
  | "ct-machine-failure"
  | "bed-shortage"

export interface ScenarioKpis {
  labUtilization: number
  emergencyWaitMinutes: number
  availableBeds: number
  hospitalStatus: HospitalStatus
}

export interface RippleStep {
  /** Minutes into the future. */
  offsetMinutes: 30 | 60 | 90 | 120
  label: string
  /** Optional headline metric for the step. */
  metric?: string
  severity: StatusTone
}

export interface InterventionOption {
  id: string
  label: string
  description: string
  edWaitMinutes: number
  delayedDischarges: number
  /** Positive = beds recovered, negative = beds lost. */
  bedsDelta: number
  bedsDeltaLabel: string
  staffImpact: "Low" | "Medium" | "High"
  operationalCost: "Low" | "Medium" | "High"
  confidence?: number
  recommended?: boolean
}

export interface Scenario {
  id: ScenarioId
  label: string
  description: string
  severity: StatusTone
  kpis: ScenarioKpis
  /** Lab utilization progression as the scenario unfolds. */
  labUtilizationCurve: number[]
  ripple: RippleStep[]
  interventions: InterventionOption[]
}

// --- Extended state types ----------------------------------------------------

export type ScenarioPhase = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type TimeHorizon = "now" | "30m" | "60m" | "120m"

export type InterventionState = "unreviewed" | "approved" | "modified" | "rejected"

export interface ActivityLogEvent {
  id: string
  timestamp: string
  category: "system" | "equipment" | "prediction" | "intervention" | "approval" | "recovery"
  title: string
  detail: string
  tone: StatusTone
}

export interface HospitalAlert {
  id: string
  title: string
  detail: string
  tone: StatusTone
  time: string
  read: boolean
  actionLink?: string
}

export interface PatientJourneyStage {
  name: string
  stageId: FlowStageId
  status: "completed" | "in-progress" | "upcoming"
  scheduledTime: string
  actualOrEstimatedTime: string
  waitMinutes?: number
  note?: string
}

export interface PatientJourney {
  patientId: string
  patientName: string
  departmentName: string
  doctorName: string
  doctorImage?: string
  appointmentTime: string
  recommendedArrival: string
  estimatedCompletion: string
  stages: PatientJourneyStage[]
  alertMessage?: string | null
}

export interface UserAppointment {
  id: string
  patientName: string
  departmentId: DepartmentId
  departmentName: string
  doctorId: string
  doctorName: string
  doctorQualification?: string
  doctorImage?: string
  scheduledTime: string
  recommendedArrivalWindow: string
  estimatedCompletionTime: string
  status: "confirmed" | "completed" | "cancelled"
  createdAt: string
}

// --- Live Queues & Wait-Time Engine -----------------------------------------

export type QueueStatus = "HEALTHY" | "MODERATE" | "WARNING" | "CRITICAL" | "RECOVERING"

export interface QueuePatient {
  patientId: string
  patientName: string
  token: string
  doctorId?: string
  doctorName?: string
  departmentId: DepartmentId
  queuePosition: number
  patientsAhead: number
  estimatedWaitMinutes: number
  expectedServiceTime: string
  arrivalTime: string
  /** Clinical priority is assigned by hospital staff — never inferred by AI. */
  priority: ClinicalPriority
  nextStage: FlowStageId | string
  delayRisk: DelayRisk
  status: "SERVING" | "NEXT" | "WAITING" | "DELAYED"
}

export interface DepartmentQueue {
  queueId: string
  departmentId: DepartmentId
  departmentName: string
  code: string
  currentToken: string
  currentlyServingPatientId: string | null
  currentlyServingPatientName: string | null
  waitingPatients: QueuePatient[]
  averageServiceMinutes: number
  activeResources: number
  maximumResources: number
  resourceUnit: string
  currentWaitMinutes: number
  predictedWait30: number
  predictedWait60: number
  predictedWait120: number
  queueStatus: QueueStatus
  lastUpdated: string
  rootCauses?: {
    factor: string
    percentage: number
  }[]
}

// --- Live Patient Flow Timeline Models ---------------------------------------

export type DelayCategory = "ON_TIME" | "MODERATE_DELAY" | "HIGH_DELAY" | "CRITICAL_DELAY"

export type TimelineStatus =
  | "COMPLETED"
  | "IN_PROGRESS"
  | "WAITING"
  | "DELAYED"
  | "PREDICTED_CHANGE"
  | "SCHEDULED"

export interface TimelineCareStage {
  stageId: FlowStageId | string
  stageName: string
  status: "completed" | "in-progress" | "upcoming"
  expectedTime: string
  actualTime?: string
  waitMinutes?: number
  note?: string
}

export interface TimelinePatientEntry {
  id: string
  patientName: string
  token: string
  departmentId: DepartmentId
  departmentName: string
  doctorId: string
  doctorName: string
  scheduledTime: string
  predictedServiceTime: string
  delayMinutes: number
  delayCategory: DelayCategory
  queuePosition: number | null
  patientsAhead: number
  status: TimelineStatus
  nextStage: string
  expectedCompletionTime: string
  clinicalPriority: ClinicalPriority
  careStages: TimelineCareStage[]
  projectedDelaysNotice?: string
  beforeInterventionCompletion?: string
  afterInterventionCompletion?: string
  timeSavedMinutes?: number
}

export interface TimelineSummaryMetrics {
  scheduledToday: number
  currentlyWaiting: number
  currentlyServing: number
  averageDelayMinutes: number
  longestDelayMinutes: number
  expectedOnTimePercent: number
  patientTimeSavedMinutes?: number
  averageTimeSavedMinutes?: number
  hospitalMinutesRecovered?: number
  isRecovered: boolean
}

