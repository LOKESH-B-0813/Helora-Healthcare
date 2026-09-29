import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { BED_SHORTAGE_SCENARIO } from '../lib/data/scenarios/bed-shortage'

describe('FlowPulse Simulation - Emergency Bed Shortage Protocol', () => {
  it('defines bed shortage scenario and discharge bottleneck parameters', () => {
    assert.equal(BED_SHORTAGE_SCENARIO.id, 'bed-shortage')
    assert.equal(BED_SHORTAGE_SCENARIO.bottleneckDepartment, 'discharge')
    assert.ok(BED_SHORTAGE_SCENARIO.phases.length >= 4)
  })

  it('includes fast-track discharge lounge intervention', () => {
    assert.ok(BED_SHORTAGE_SCENARIO.interventions.length >= 1)
    assert.equal(BED_SHORTAGE_SCENARIO.interventions[0].id, 'activate-discharge-lounge')
    assert.equal(BED_SHORTAGE_SCENARIO.interventions[0].recommended, true)
  })
})
