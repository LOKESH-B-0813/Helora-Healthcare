import type { DepartmentId, QueueStatus } from '../data/types'

// ============================================================================
// Centralized Queue Standards & Thresholds Configuration
// Single source of truth for service durations, buffer times, and alert thresholds.
// ============================================================================

export interface ServiceDurationStandard {
  departmentId: DepartmentId
  nominalMinutes: number
  rangeMinutes: [number, number]
  resourceType: string
}

export const SERVICE_DURATION_STANDARDS: Record<DepartmentId, ServiceDurationStandard> = {
  emergency: {
    departmentId: 'emergency',
    nominalMinutes: 12,
    rangeMinutes: [8, 20],
    resourceType: 'Triage Bays',
  },
  'general-opd': {
    departmentId: 'general-opd',
    nominalMinutes: 14,
    rangeMinutes: [10, 18],
    resourceType: 'Consultation Rooms',
  },
  cardiology: {
    departmentId: 'cardiology',
    nominalMinutes: 18,
    rangeMinutes: [15, 25],
    resourceType: 'Cardiac Suites',
  },
  laboratory: {
    departmentId: 'laboratory',
    nominalMinutes: 15,
    rangeMinutes: [10, 20],
    resourceType: 'Biochemistry Analyzers',
  },
  radiology: {
    departmentId: 'radiology',
    nominalMinutes: 20,
    rangeMinutes: [15, 30],
    resourceType: 'Imaging Suites (CT/MRI/X-Ray)',
  },
  icu: {
    departmentId: 'icu',
    nominalMinutes: 45,
    rangeMinutes: [30, 60],
    resourceType: 'Intensivist Beds',
  },
  'ward-a': {
    departmentId: 'ward-a',
    nominalMinutes: 30,
    rangeMinutes: [20, 45],
    resourceType: 'Inpatient Beds',
  },
  'ward-b': {
    departmentId: 'ward-b',
    nominalMinutes: 30,
    rangeMinutes: [20, 45],
    resourceType: 'Inpatient Beds',
  },
  pharmacy: {
    departmentId: 'pharmacy',
    nominalMinutes: 8,
    rangeMinutes: [5, 12],
    resourceType: 'Dispensing Counters',
  },
  discharge: {
    departmentId: 'discharge',
    nominalMinutes: 5,
    rangeMinutes: [3, 8],
    resourceType: 'Discharge Desks',
  },
}

export const QUEUE_THRESHOLDS = {
  // Wait time thresholds in minutes
  healthyMaxWait: 15,
  moderateMaxWait: 25,
  warningMaxWait: 35,
  criticalMinWait: 36,

  // Adaptive arrival buffers
  registrationBufferMinutes: 5,
  safetyBufferMinutes: 5,
  minimumArrivalWindowWidthMinutes: 10,
}

export const DELAY_THRESHOLDS = {
  onTimeMaxMinutes: 5,
  moderateDelayMaxMinutes: 15,
  highDelayMaxMinutes: 30,
}

export function evaluateQueueStatus(waitMinutes: number, capacityRatio: number = 1): QueueStatus {
  if (waitMinutes >= QUEUE_THRESHOLDS.criticalMinWait || capacityRatio < 0.7) {
    return 'CRITICAL'
  }
  if (waitMinutes >= QUEUE_THRESHOLDS.warningMaxWait || capacityRatio < 0.8) {
    return 'WARNING'
  }
  if (waitMinutes > QUEUE_THRESHOLDS.healthyMaxWait) {
    return 'MODERATE'
  }
  return 'HEALTHY'
}

export function evaluateDelayCategory(delayMinutes: number): import('../data/types').DelayCategory {
  if (delayMinutes <= DELAY_THRESHOLDS.onTimeMaxMinutes) {
    return 'ON_TIME'
  }
  if (delayMinutes <= DELAY_THRESHOLDS.moderateDelayMaxMinutes) {
    return 'MODERATE_DELAY'
  }
  if (delayMinutes <= DELAY_THRESHOLDS.highDelayMaxMinutes) {
    return 'HIGH_DELAY'
  }
  return 'CRITICAL_DELAY'
}

