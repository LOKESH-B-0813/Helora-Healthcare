// ============================================================================
// FlowPulse AI — Operating Theater (OT) Overrun Simulation Scenario
// Simulates complex multi-hour surgical delays and downstream PACU/ICU bed bottlenecks.
// ============================================================================

import type { ScenarioDefinition } from './mci-surge'

export const OT_OVERRUN_SCENARIO: ScenarioDefinition = {
  id: 'ot-overrun',
  name: 'Operating Theater Complex Overrun',
  tagline: 'Emergency neurosurgery extension delays 8 elective surgical procedures.',
  category: 'operational',
  severity: 'warning',
  initialHealthScore: 61,
  description:
    'Simulates a 4.5-hour surgical complexity extension in Main Suite 3, causing an acute post-anesthesia recovery backlog and cascading ward admission delays.',
  bottleneckDepartment: 'ward-a',
  estimatedRecoveryMinutes: 60,
  phases: [
    {
      phaseNumber: 1,
      title: 'Intraoperative Case Extension',
      description: 'Surgical team reports unexpected vascular complication requiring 180 min extension.',
      affectedDepartments: ['icu', 'ward-a'],
      hospitalHealthScore: 78,
      hospitalStatus: 'Elevated',
    },
    {
      phaseNumber: 2,
      title: 'PACU Recovery Gridlock',
      description: 'Post-Anesthesia Care Unit reaches 100% capacity; incoming post-op transfers paused.',
      affectedDepartments: ['ward-a', 'ward-b', 'icu'],
      hospitalHealthScore: 64,
      hospitalStatus: 'Strained',
    },
    {
      phaseNumber: 3,
      title: 'Dynamic Surgical Re-Sequencing',
      description: 'AI re-schedules 4 outpatient day cases and opens secondary PACU recovery annex.',
      affectedDepartments: ['ward-a', 'discharge'],
      hospitalHealthScore: 82,
      hospitalStatus: 'Elevated',
    },
    {
      phaseNumber: 4,
      title: 'Bed Turnover & Flow Normalization',
      description: 'Expedited ward discharges release 8 inpatient surgical beds.',
      affectedDepartments: ['ward-a', 'ward-b'],
      hospitalHealthScore: 92,
      hospitalStatus: 'Stable',
    },
  ],
  interventions: [
    {
      id: 'ot-resequence-elective',
      title: 'Dynamic Case Re-sequencing & Day Surgery Re-routing',
      description: 'Re-route minor arthroscopy and laparoscopic cases to Ambulatory Surgery Wing B.',
      costEstimate: '₹18,000',
      timeToEffectMinutes: 15,
      riskLevel: 'low',
      predictedScoreImprovement: 28,
      recommended: true,
    },
  ],
}
