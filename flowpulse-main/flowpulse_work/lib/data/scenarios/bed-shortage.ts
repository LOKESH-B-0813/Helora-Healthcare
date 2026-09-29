// ============================================================================
// FlowPulse AI — Emergency Bed Shortage & Diversion Protocol Scenario
// Simulates acute inpatient bed saturation, delayed discharges, and dynamic bed reallocation.
// ============================================================================

import type { ScenarioDefinition } from './mci-surge'

export const BED_SHORTAGE_SCENARIO: ScenarioDefinition = {
  id: 'bed-shortage',
  name: 'Acute Inpatient Bed Saturation (Code Amber)',
  tagline: 'Delayed morning discharges cause ED boarding backlog of 14 admitted patients.',
  category: 'operational',
  severity: 'critical',
  initialHealthScore: 48,
  description:
    'Simulates a scenario where pharmacy prescription verification delays prevent 18 expected morning discharges, resulting in emergency room boarding gridlock.',
  bottleneckDepartment: 'discharge',
  estimatedRecoveryMinutes: 45,
  phases: [
    {
      phaseNumber: 1,
      title: 'Discharge Paperwork & Billing Delay',
      description: 'Central pharmacy prescription queue backlog stalls morning inpatient discharges.',
      affectedDepartments: ['discharge', 'pharmacy', 'ward-a'],
      hospitalHealthScore: 68,
      hospitalStatus: 'Elevated',
    },
    {
      phaseNumber: 2,
      title: 'Emergency Department Boarding Surge',
      description: 'Emergency department holds 14 admitted patients awaiting inpatient bed turnover.',
      affectedDepartments: ['emergency', 'ward-a', 'ward-b', 'discharge'],
      hospitalHealthScore: 48,
      hospitalStatus: 'Critical',
    },
    {
      phaseNumber: 3,
      title: 'Expedited Discharge Lounge Activation',
      description: 'Hospital triggers Discharge Lounge fast-track; bedside clinical pharmacists deployed.',
      affectedDepartments: ['discharge', 'pharmacy', 'ward-a'],
      hospitalHealthScore: 76,
      hospitalStatus: 'Elevated',
    },
    {
      phaseNumber: 4,
      title: 'Bed Turnover & Inpatient Handoff',
      description: 'Rapid environmental sanitization frees 16 inpatient beds; ED boarding cleared.',
      affectedDepartments: ['ward-a', 'ward-b', 'emergency'],
      hospitalHealthScore: 90,
      hospitalStatus: 'Stable',
    },
  ],
  interventions: [
    {
      id: 'activate-discharge-lounge',
      title: 'Activate Fast-Track Discharge Lounge Protocol',
      description: 'Transfer medically stable awaiting-transport patients to the comfort lounge to release beds immediately.',
      costEstimate: '₹8,000',
      timeToEffectMinutes: 10,
      riskLevel: 'low',
      predictedScoreImprovement: 34,
      recommended: true,
    },
  ],
}
