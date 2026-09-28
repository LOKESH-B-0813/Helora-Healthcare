'use client'

import React, { createContext, useContext, useEffect, useReducer, useMemo } from 'react'
import {
  createInitialState,
  flowPulseReducer,
  type FlowPulseAction,
  type FlowPulseState,
} from '@/lib/state/flowpulse-state'
import type {
  ScenarioId,
  ScenarioPhase,
  StaffRoleView,
  TimeHorizon,
  UserAppointment,
} from '@/lib/data/types'

interface FlowPulseContextValue {
  state: FlowPulseState
  dispatch: React.Dispatch<FlowPulseAction>
  setRoleView: (roleView: StaffRoleView) => void
  setScenario: (id: ScenarioId) => void
  setScenarioPhase: (phase: ScenarioPhase) => void
  setTimeHorizon: (horizon: TimeHorizon) => void
  startSimulation: () => void
  pauseSimulation: () => void
  resetScenario: () => void
  approveIntervention: (id: string) => void
  rejectIntervention: () => void
  startJudgeDemo: () => void
  advanceJudgeDemo: () => void
  setJudgeDemoStep: (step: number) => void
  resetJudgeDemo: () => void
  addAppointment: (apt: UserAppointment) => void
  markAlertRead: (id: string) => void
  markAllAlertsRead: () => void
}

const FlowPulseContext = createContext<FlowPulseContextValue | null>(null)

const STORAGE_KEY = 'flowpulse_state_v1'

export function FlowPulseProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(flowPulseReducer, undefined, () => {
    // Try to hydrate user appointments from localStorage if available in browser
    const initial = createInitialState()
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed.userAppointments && Array.isArray(parsed.userAppointments)) {
            initial.userAppointments = parsed.userAppointments
          }
        }
      } catch (e) {
        console.error('Error reading localStorage for FlowPulse', e)
      }
    }
    return initial
  })

  // Persist appointments on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ userAppointments: state.userAppointments }),
        )
      } catch (e) {
        console.error('Error persisting FlowPulse state', e)
      }
    }
  }, [state.userAppointments])

  // Simulation timer for automated failure-to-ripple demo
  useEffect(() => {
    if (!state.isSimulating) return

    const timer = setInterval(() => {
      if (state.activeScenario === 'lab-analyzer-failure') {
        if (state.scenarioPhase < 4) {
          dispatch({
            type: 'SET_SCENARIO_PHASE',
            phase: (state.scenarioPhase + 1) as ScenarioPhase,
          })
        } else {
          dispatch({ type: 'PAUSE_SIMULATION' })
        }
      }
    }, 4500)

    return () => clearInterval(timer)
  }, [state.isSimulating, state.activeScenario, state.scenarioPhase])

  const contextValue = useMemo<FlowPulseContextValue>(
    () => ({
      state,
      dispatch,
      setRoleView: (roleView) => dispatch({ type: 'SET_ROLE_VIEW', roleView }),
      setScenario: (scenarioId) => dispatch({ type: 'SET_SCENARIO', scenarioId }),
      setScenarioPhase: (phase) => dispatch({ type: 'SET_SCENARIO_PHASE', phase }),
      setTimeHorizon: (horizon) => dispatch({ type: 'SET_TIME_HORIZON', horizon }),
      startSimulation: () => dispatch({ type: 'START_SIMULATION' }),
      pauseSimulation: () => dispatch({ type: 'PAUSE_SIMULATION' }),
      resetScenario: () => dispatch({ type: 'RESET_SCENARIO' }),
      approveIntervention: (interventionId) =>
        dispatch({ type: 'APPROVE_INTERVENTION', interventionId }),
      rejectIntervention: () => dispatch({ type: 'REJECT_INTERVENTION' }),
      startJudgeDemo: () => dispatch({ type: 'START_JUDGE_DEMO' }),
      advanceJudgeDemo: () => dispatch({ type: 'ADVANCE_JUDGE_DEMO' }),
      setJudgeDemoStep: (step) => dispatch({ type: 'SET_JUDGE_DEMO_STEP', step }),
      resetJudgeDemo: () => dispatch({ type: 'RESET_JUDGE_DEMO' }),
      addAppointment: (appointment) => dispatch({ type: 'ADD_APPOINTMENT', appointment }),
      markAlertRead: (alertId) => dispatch({ type: 'MARK_ALERT_READ', alertId }),
      markAllAlertsRead: () => dispatch({ type: 'MARK_ALL_ALERTS_READ' }),
    }),
    [state],
  )

  return (
    <FlowPulseContext.Provider value={contextValue}>
      {children}
    </FlowPulseContext.Provider>
  )
}

export function useFlowPulse(): FlowPulseContextValue {
  const context = useContext(FlowPulseContext)
  if (!context) {
    throw new Error('useFlowPulse must be used within a FlowPulseProvider')
  }
  return context
}
