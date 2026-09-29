import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { DOCTOR_SCHEDULES, getDoctorsByRoster } from '../lib/data/doctor-schedules'

describe('FlowPulse Doctor Shift & On-Call Roster', () => {
  it('defines comprehensive doctor shifts with consulting times and capacities', () => {
    assert.ok(DOCTOR_SCHEDULES.length >= 4)
    assert.ok(DOCTOR_SCHEDULES.some((s) => s.doctorId === 'DOC-101'))
    assert.ok(DOCTOR_SCHEDULES.some((s) => s.shift === 'night-oncall'))
  })

  it('filters roster schedules by department and day accurately', () => {
    const cardDocs = getDoctorsByRoster('cardiology', 'Monday')
    assert.ok(cardDocs.length >= 1)
    assert.equal(cardDocs[0].doctorName, 'Dr. Ananya Rao')
    assert.equal(cardDocs[0].roomNumber, 'Suite 204')
  })
})
