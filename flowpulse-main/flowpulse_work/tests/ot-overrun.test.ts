import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { OT_OVERRUN_SCENARIO } from '../lib/data/scenarios/ot-overrun'

describe('FlowPulse Simulation - Operating Theater Overrun', () => {
  it('defines surgical overrun scenario and PACU bottleneck parameters', () => {
    assert.equal(OT_OVERRUN_SCENARIO.id, 'ot-overrun')
    assert.equal(OT_OVERRUN_SCENARIO.bottleneckDepartment, 'ward-a')
    assert.ok(OT_OVERRUN_SCENARIO.phases.length >= 4)
  })

  it('includes case resequencing intervention', () => {
    assert.ok(OT_OVERRUN_SCENARIO.interventions.length >= 1)
    assert.equal(OT_OVERRUN_SCENARIO.interventions[0].id, 'ot-resequence-elective')
    assert.equal(OT_OVERRUN_SCENARIO.interventions[0].recommended, true)
  })
})
