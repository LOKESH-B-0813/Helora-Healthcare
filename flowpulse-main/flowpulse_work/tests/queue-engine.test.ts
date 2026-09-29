import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseTimeToMinutes,
  formatMinutesToTime,
  calculateEstimatedWait,
  calculateExpectedServiceTime,
  calculateAdaptiveArrivalWindow,
  calculatePatientJourneyEstimate,
  calculateExpectedStageStart,
  calculateExpectedStageEnd,
  calculateVisitCompletion,
  calculateDelayMinutes,
  calculateTimelineForecast,
} from '../lib/engine/queue-engine'

describe('FlowPulse Queue Engine - Time Utilities', () => {
  it('correctly parses 12-hour AM/PM time strings into minutes from midnight', () => {
    assert.equal(parseTimeToMinutes('10:30 AM'), 630)
    assert.equal(parseTimeToMinutes('12:00 PM'), 720)
    assert.equal(parseTimeToMinutes('12:00 AM'), 0)
    assert.equal(parseTimeToMinutes('02:15 PM'), 855)
    assert.equal(parseTimeToMinutes('11:59 PM'), 1439)
  })

  it('correctly formats minutes from midnight into 12-hour format', () => {
    assert.equal(formatMinutesToTime(630), '10:30 AM')
    assert.equal(formatMinutesToTime(720), '12:00 PM')
    assert.equal(formatMinutesToTime(0), '12:00 AM')
    assert.equal(formatMinutesToTime(855), '2:15 PM')
  })

  it('handles negative or overflow minutes wrapping gracefully', () => {
    assert.equal(formatMinutesToTime(1440 + 60), '1:00 AM')
    assert.equal(formatMinutesToTime(-60), '11:00 PM')
  })
})

describe('FlowPulse Queue Engine - Wait Time & Service Calculations', () => {
  it('computes estimated wait accurately based on queue length and active resources', () => {
    const wait = calculateEstimatedWait({
      patientsAhead: 6,
      averageServiceMinutes: 15,
      activeResources: 2,
      operationalDelayMinutes: 5,
      resourcePenaltyMinutes: 0,
    })
    // (6 * 15) / 2 = 45 + 5 = 50
    assert.equal(wait, 50)
  })

  it('protects against division by zero when resources are 0', () => {
    const wait = calculateEstimatedWait({
      patientsAhead: 4,
      averageServiceMinutes: 10,
      activeResources: 0,
    })
    // (4 * 10) / max(0, 1) = 40
    assert.equal(wait, 40)
  })

  it('calculates expected service start time string correctly', () => {
    const serviceTime = calculateExpectedServiceTime('10:00 AM', 45)
    assert.equal(serviceTime, '10:45 AM')
  })
})

describe('FlowPulse Queue Engine - Adaptive Arrival Windows', () => {
  it('calculates standard arrival window when delay is nominal', () => {
    const window = calculateAdaptiveArrivalWindow('10:30 AM', 0, 15, 10)
    // 630 - 15 - 10 = 605 (10:05 AM), window: 10:00 - 10:10 AM
    assert.equal(window.isAdjusted, false)
    assert.ok(window.recommendedArrivalWindow.includes('10:00') || window.recommendedArrivalWindow.includes('10:10'))
  })

  it('adjusts arrival window dynamically when operational delay is elevated', () => {
    const window = calculateAdaptiveArrivalWindow('10:30 AM', 25, 15, 10)
    // 630 + 25 - 15 - 10 = 630 (10:30 AM)
    assert.equal(window.isAdjusted, true)
    assert.ok(window.explanation.includes('+25m delay'))
  })
})

describe('FlowPulse Queue Engine - Patient Journey & Timeline Forecasting', () => {
  it('generates a full patient journey estimation with all care stages', () => {
    const journey = calculatePatientJourneyEstimate({
      departmentId: 'general-opd',
      scheduledTime: '10:30 AM',
      currentQueueWait: 20,
      includeDiagnostics: true,
    })

    assert.ok(journey.totalDurationMinutes > 0)
    assert.ok(journey.stageBreakdown.registrationMinutes > 0)
    assert.ok(journey.stageBreakdown.consultationMinutes > 0)
    assert.ok(journey.stageBreakdown.diagnosticsMinutes > 0)
    assert.ok(journey.stageBreakdown.pharmacyMinutes > 0)
    assert.equal(typeof journey.expectedCompletionTime, 'string')
  })

  it('calculates cumulative visit completion accurately', () => {
    const completion = calculateVisitCompletion('09:00 AM', [10, 15, 20, 15])
    // 9:00 + 60m = 10:00 AM
    assert.equal(completion, '10:00 AM')
  })

  it('calculates timeline forecasts under bottleneck scenarios', () => {
    const forecast = calculateTimelineForecast({
      scheduledTime: '10:00 AM',
      baseDelayMinutes: 10,
      horizon: '60m',
      departmentId: 'laboratory',
      isLabFailure: true,
      isRecovered: false,
    })

    assert.ok(forecast.predictedDelayMinutes >= 30)
    assert.equal(forecast.predictedServiceTime, '10:33 AM')
  })
})
