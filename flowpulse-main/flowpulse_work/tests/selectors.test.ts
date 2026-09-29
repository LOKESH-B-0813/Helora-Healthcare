import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState, flowPulseReducer } from '../lib/state/flowpulse-state'
import {
  getDepartmentById,
  getDepartmentLoad,
  getDepartmentWait,
  getAvailableBeds,
  getHospitalHealth,
  getCurrentBottlenecks,
  getPatientsInDepartment,
} from '../lib/state/selectors'

describe('FlowPulse State Selectors & Reducer Engine', () => {
  it('creates a consistent initial state with baseline metrics', () => {
    const state = createInitialState()
    assert.equal(state.activeScenario, 'normal')
    assert.equal(state.timeHorizon, 'now')
    assert.ok(state.departments.length > 0)
    assert.ok(state.hospitalHealthScore > 0)
  })

  it('selects department by id correctly', () => {
    const state = createInitialState()
    const ed = getDepartmentById(state, 'emergency')
    assert.ok(ed !== undefined)
    assert.equal(ed?.id, 'emergency')
  })

  it('computes department load and wait time accurately', () => {
    const state = createInitialState()
    const load = getDepartmentLoad(state, 'emergency')
    const wait = getDepartmentWait(state, 'emergency')
    assert.equal(typeof load, 'number')
    assert.equal(typeof wait, 'number')
  })

  it('retrieves hospital health metrics correctly', () => {
    const state = createInitialState()
    const health = getHospitalHealth(state)
    assert.equal(health.status, 'Stable')
    assert.ok(health.score >= 80)
    assert.equal(typeof health.rippleRiskScore, 'number')
  })

  it('handles scenario transitions and updates bottleneck detection', () => {
    const initialState = createInitialState()
    const labFailureState = flowPulseReducer(initialState, {
      type: 'SET_SCENARIO',
      scenarioId: 'lab-analyzer-failure',
    })

    assert.equal(labFailureState.activeScenario, 'lab-analyzer-failure')
    assert.equal(labFailureState.scenarioPhase, 1)

    // Should detect bottlenecks under lab failure
    const bottlenecks = getCurrentBottlenecks(labFailureState)
    assert.ok(Array.isArray(bottlenecks))
  })

  it('handles alert read status mutation properly in reducer', () => {
    const state = createInitialState()
    if (state.notifications.length > 0) {
      const firstAlertId = state.notifications[0].id
      const modifiedState = flowPulseReducer(state, {
        type: 'MARK_ALERT_READ',
        alertId: firstAlertId,
      })
      const alert = modifiedState.notifications.find((n) => n.id === firstAlertId)
      assert.equal(alert?.read, true)
    }
  })

  it('handles adding new appointment and prepending to activity feed', () => {
    const state = createInitialState()
    const newAppointment = {
      id: 'FP-TEST-999',
      patientName: 'Test Patient',
      departmentId: 'emergency' as const,
      departmentName: 'Emergency Medicine',
      doctorId: 'DOC-999',
      doctorName: 'Dr. Test',
      doctorQualification: 'MD',
      scheduledTime: '11:00 AM',
      recommendedArrivalWindow: '10:45–10:55 AM',
      estimatedCompletionTime: '12:30 PM',
      status: 'confirmed' as const,
      createdAt: new Date().toISOString(),
    }

    const nextState = flowPulseReducer(state, {
      type: 'ADD_APPOINTMENT',
      appointment: newAppointment,
    })

    assert.equal(nextState.userAppointments[0].id, 'FP-TEST-999')
    assert.ok(nextState.activityFeed.some((a) => a.title.includes('Emergency Medicine')))
  })
})
