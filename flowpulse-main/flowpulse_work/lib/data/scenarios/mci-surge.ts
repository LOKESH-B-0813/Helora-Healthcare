import type { DepartmentId, HospitalStatus, StatusTone } from '../types'

export interface ScenarioPhaseInfo {
  phaseNumber: number
  title: string
  description: string
  affectedDepartments: DepartmentId[]
  hospitalHealthScore: number
  hospitalStatus: HospitalStatus
}

export interface ScenarioInterventionInfo {
  id: string
  title: string
  description: string
  costEstimate: string
  timeToEffectMinutes: number
  riskLevel: 'low' | 'medium' | 'high'
  predictedScoreImprovement: number
  recommended: boolean
}

export interface ScenarioDefinition {
  id: string
  name: string
  tagline: string
  category: 'surge' | 'operational' | 'equipment' | 'staffing'
  severity: StatusTone
  initialHealthScore: number
  description: string
  bottleneckDepartment: DepartmentId
  estimatedRecoveryMinutes: number
  phases: ScenarioPhaseInfo[]
  interventions: ScenarioInterventionInfo[]
}

export const MCI_SURGE_SCENARIO: ScenarioDefinition = {
  id: 'mci-surge',
  name: 'Mass Casualty Incident (Level-1 Code Red)',
  tagline: 'Multi-vehicle collision creates sudden influx of 28 acute trauma cases.',
  category: 'surge',
  severity: 'critical',
  initialHealthScore: 42,
  description:
    'Simulates a city-wide multi-vehicle collision resulting in 28 critical and emergent trauma admissions over a 30-minute window, straining emergency triage, blood bank, and surgical suites.',
  bottleneckDepartment: 'emergency',
  estimatedRecoveryMinutes: 90,
  phases: [
    {
      phaseNumber: 1,
      title: 'Code Red Dispatch & Notification',
      description: 'Regional EMS dispatch signals 28 incoming casualties with multi-system trauma.',
      affectedDepartments: ['emergency', 'radiology', 'icu'],
      hospitalHealthScore: 68,
      hospitalStatus: 'Elevated',
    },
    {
      phaseNumber: 2,
      title: 'Triage Surge & Trauma Bay Saturation',
      description: 'First 14 ambulance arrivals saturate all 12 emergency trauma bays.',
      affectedDepartments: ['emergency', 'radiology', 'laboratory'],
      hospitalHealthScore: 52,
      hospitalStatus: 'Strained',
    },
    {
      phaseNumber: 3,
      title: 'Peak Surgical & Diagnostic Gridlock',
      description: 'Trauma CT scanner queue surges to 18 patients; blood bank reserves dip below 35%.',
      affectedDepartments: ['radiology', 'emergency', 'icu', 'ward-a'],
      hospitalHealthScore: 42,
      hospitalStatus: 'Critical',
    },
    {
      phaseNumber: 4,
      title: 'Hospital-Wide Mobilization Protocol',
      description: 'Off-duty trauma surgeons arrive; elective OT cases deferred to free 6 operating suites.',
      affectedDepartments: ['emergency', 'ward-a', 'ward-b', 'discharge'],
      hospitalHealthScore: 72,
      hospitalStatus: 'Elevated',
    },
    {
      phaseNumber: 5,
      title: 'Stabilization & Flow Normalization',
      description: 'All 28 casualties stabilized; acute post-op cases transferred to critical care ICU.',
      affectedDepartments: ['icu', 'ward-a', 'ward-b'],
      hospitalHealthScore: 88,
      hospitalStatus: 'Stable',
    },
  ],
  interventions: [
    {
      id: 'mci-triage-surge-team',
      title: 'Deploy Rapid Trauma Response Teams',
      description: 'Activate Code Red on-call surgical roster and convert Day Surgery recovery into Level-2 Trauma beds.',
      costEstimate: '₹45,000 / shift',
      timeToEffectMinutes: 10,
      riskLevel: 'low',
      predictedScoreImprovement: 38,
      recommended: true,
    },
    {
      id: 'mci-regional-diversion',
      title: 'Initiate Regional Trauma Diversion',
      description: 'Divert minor Green-tag walk-in injuries to affiliated Riverside and Harbor View centers.',
      costEstimate: '₹12,000',
      timeToEffectMinutes: 15,
      riskLevel: 'medium',
      predictedScoreImprovement: 24,
      recommended: false,
    },
  ],
}
