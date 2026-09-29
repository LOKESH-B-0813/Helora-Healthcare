import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { calculatePatientJourneyEstimate } from '../lib/engine/queue-engine'

describe('FlowPulse Mobile Patient Journey & State Sync', () => {
  it('generates a consistent baseline patient journey for nominal operations', () => {
    const journey = calculatePatientJourneyEstimate({
      departmentId: 'cardiology',
      scheduledTime: '10:30 AM',
      currentQueueWait: 14,
      includeDiagnostics: true,
    })

    assert.equal(journey.scheduledTime, '10:30 AM')
    assert.ok(journey.recommendedArrivalWindow.length > 0)
    assert.equal(typeof journey.isAdjusted, 'boolean')
    assert.ok(journey.totalDurationMinutes > 0)
  })

  it('adjusts estimated visit duration when lab delay scenario is active', () => {
    const delayJourney = calculatePatientJourneyEstimate({
      departmentId: 'cardiology',
      scheduledTime: '10:30 AM',
      currentQueueWait: 32,
      includeDiagnostics: true,
      isDiagnosticDelayed: true,
      diagnosticDelayMinutes: 20,
    })

    assert.equal(delayJourney.isAdjusted, true)
    assert.ok(delayJourney.totalDurationMinutes >= 70)
  })
})
