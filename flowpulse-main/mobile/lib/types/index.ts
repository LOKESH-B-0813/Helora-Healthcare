// ============================================================================
// FlowPulse AI — Patient Mobile TypeScript Definitions
// Clean, strongly typed representations of patient journeys, queues, and appointments.
// ============================================================================

import type { DepartmentId } from '../constants/timings'

export type { DepartmentId }

export type StatusTone = 'healthy' | 'warning' | 'critical' | 'neutral' | 'ai'

export type FlowStageId =
  | 'registration'
  | 'emergency'
  | 'opd'
  | 'consultation'
  | 'laboratory'
  | 'radiology'
  | 'review'
  | 'ward'
  | 'icu'
  | 'pharmacy'
  | 'discharge'

export type QueueStatus = 'HEALTHY' | 'MODERATE' | 'WARNING' | 'CRITICAL' | 'RECOVERING'

export interface PatientProfile {
  id: string
  name: string
  age: number
  gender: 'M' | 'F'
  phone: string
  email: string
  bloodGroup: string
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }
  notificationPreferences: {
    pushEnabled: boolean
    smsEnabled: boolean
    queueAlerts: boolean
    estimateUpdates: boolean
  }
}

export interface Doctor {
  id: string
  name: string
  departmentId: DepartmentId
  departmentName: string
  qualification: string
  skills: string[]
  imageUrl: string
  yearsExperience: number
  education: string
  languages: string[]
  nextAvailableSlot: string
  rating: number
  biography: string
  specialtyTags: string[]
}

export interface DepartmentInfo {
  id: DepartmentId
  name: string
  code: string
  avgWaitMinutes: number
  status: StatusTone
  description: string
  imageUrl: string
  specialties: string[]
  activeDoctorsCount: number
}

export interface UserAppointment {
  id: string
  patientId: string
  patientName: string
  departmentId: DepartmentId
  departmentName: string
  doctorId: string
  doctorName: string
  doctorQualification: string
  doctorImageUrl: string
  scheduledDate: string
  scheduledTime: string
  recommendedArrivalWindow: string
  expectedQueueWaitMinutes: number
  expectedConsultationTime: string
  estimatedVisitDuration: string
  estimatedCompletionTime: string
  token: string
  status: 'confirmed' | 'in-progress' | 'completed' | 'cancelled'
  createdAt: string
}

export interface QueuePatientPosition {
  token: string
  patientName: string
  isSelf: boolean
  position: number
  estimatedWaitMinutes: number
  expectedServiceTime: string
  status: 'SERVING' | 'NEXT' | 'WAITING' | 'DELAYED'
}

export interface PatientLiveQueue {
  departmentId: DepartmentId
  departmentName: string
  doctorId: string
  doctorName: string
  myToken: string
  myPosition: number
  patientsAhead: number
  estimatedWaitMinutes: number
  expectedConsultationTime: string
  currentToken: string
  nextToken: string
  status: QueueStatus
  lastUpdated: string
  isLive: boolean
  queueStream: QueuePatientPosition[]
}

export interface CareStage {
  id: string
  stageId: FlowStageId
  name: string
  status: 'completed' | 'in-progress' | 'upcoming'
  scheduledTime: string
  actualOrEstimatedTime: string
  waitMinutes?: number
  note?: string
  location?: string
  badgeLabel?: string
  badgeTone?: StatusTone
}

export interface PatientVisitJourney {
  patientId: string
  patientName: string
  appointmentId: string
  departmentName: string
  doctorName: string
  doctorImageUrl: string
  appointmentTime: string
  recommendedArrival: string
  currentQueuePosition: number
  patientsAhead: number
  currentWaitMinutes: number
  estimatedCompletionTime: string
  remainingVisitTime: string
  alertMessage: string | null
  stages: CareStage[]
  hasDiagnosticDelay: boolean
  diagnosticDelayMinutes: number
  isRecovered: boolean
  recoveredMinutes: number
}

export interface MobileNotification {
  id: string
  category: 'queue' | 'estimate' | 'recovery' | 'appointment' | 'system'
  title: string
  message: string
  timestamp: string
  read: boolean
  tone: StatusTone
  actionRoute?: string
}

export type DemoScenarioMode = 'NORMAL' | 'LAB_INCIDENT' | 'STAFF_RECOVERY'
