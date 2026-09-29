// ============================================================================
// FlowPulse AI — Service Standards & Timing Constants
// Compatible mirror of hospital operational standards for patient visit calculations.
// ============================================================================

export type DepartmentId =
  | 'cardiology'
  | 'general-opd'
  | 'emergency'
  | 'laboratory'
  | 'radiology'
  | 'icu'
  | 'ward-a'
  | 'ward-b'
  | 'pharmacy'
  | 'discharge'

export interface ServiceDurationStandard {
  departmentId: DepartmentId
  nominalMinutes: number
  rangeMinutes: [number, number]
  resourceType: string
}

export const SERVICE_DURATION_STANDARDS: Record<DepartmentId, ServiceDurationStandard> = {
  cardiology: {
    departmentId: 'cardiology',
    nominalMinutes: 18,
    rangeMinutes: [15, 25],
    resourceType: 'Cardiac Suites',
  },
  'general-opd': {
    departmentId: 'general-opd',
    nominalMinutes: 14,
    rangeMinutes: [10, 18],
    resourceType: 'Consultation Rooms',
  },
  emergency: {
    departmentId: 'emergency',
    nominalMinutes: 12,
    rangeMinutes: [8, 20],
    resourceType: 'Triage Bays',
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
  healthyMaxWait: 15,
  moderateMaxWait: 25,
  warningMaxWait: 35,
  criticalMinWait: 36,

  registrationBufferMinutes: 5,
  safetyBufferMinutes: 5,
  minimumArrivalWindowWidthMinutes: 10,
}

export const DELAY_THRESHOLDS = {
  onTimeMaxMinutes: 5,
  moderateDelayMaxMinutes: 15,
  highDelayMaxMinutes: 30,
}
