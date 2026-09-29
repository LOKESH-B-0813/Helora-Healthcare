import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { MCI_SURGE_SCENARIO } from '../lib/data/scenarios/mci-surge'

describe('FlowPulse Simulation - Mass Casualty Incident (MCI)', () => {
  it('defines comprehensive scenario parameters and emergency bottleneck', () => {
    assert.equal(MCI_SURGE_SCENARIO.id, 'mci-surge')
    assert.equal(MCI_SURGE_SCENARIO.bottleneckDepartment, 'emergency')
    assert.equal(MCI_SURGE_SCENARIO.severity, 'critical')
    assert.ok(MCI_SURGE_SCENARIO.phases.length >= 5)
  })

  it('provides actionable clinical mitigation interventions', () => {
    assert.ok(MCI_SURGE_SCENARIO.interventions.length >= 2)
    const recommended = MCI_SURGE_SCENARIO.interventions.find((i) => i.recommended)
    assert.ok(recommended !== undefined)
    assert.ok((recommended?.predictedScoreImprovement ?? 0) > 30)
  })
})
