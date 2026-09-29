// ============================================================================
// FlowPulse useRealtimeHospital Hook
// Centralized state & realtime sync across website incidents, Supabase, and demo scenarios.
// ============================================================================

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { addNotification } from '../lib/services/notification-service'
import { isSupabaseConfigured, supabase } from '../lib/supabase/client'
import type { DemoScenarioMode } from '../lib/types'

interface RealtimeHospitalContextType {
  scenarioMode: DemoScenarioMode
  setScenarioMode: (mode: DemoScenarioMode) => void
  isConnected: boolean
  isDemoMode: boolean
  triggerIncidentDemo: () => void
  triggerRecoveryDemo: () => void
  resetToNormalDemo: () => void
  simulateQueueAdvance: () => void
  queueProgressionStep: number
}

const RealtimeHospitalContext = createContext<RealtimeHospitalContextType | null>(null)

export function RealtimeHospitalProvider({ children }: { children: ReactNode }) {
  const [scenarioMode, setScenarioMode] = useState<DemoScenarioMode>('NORMAL')
  const [isConnected, setIsConnected] = useState<boolean>(isSupabaseConfigured)
  const [queueProgressionStep, setQueueProgressionStep] = useState<number>(3) // Default Arjun at #3

  // Handle Supabase Realtime Subscriptions if backend is live
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsConnected(false)
      return
    }

    try {
      const channel = supabase
        .channel('hospital-state-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'department_metrics' },
          (payload: any) => {
            if (payload?.new?.status === 'CRITICAL' || payload?.new?.status === 'WARNING') {
              setScenarioMode('LAB_INCIDENT')
            } else if (payload?.new?.status === 'RECOVERING' || payload?.new?.status === 'HEALTHY') {
              setScenarioMode('STAFF_RECOVERY')
            }
          },
        )
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED')
        })

      return () => {
        if (supabase) {
          supabase.removeChannel(channel)
        }
      }
    } catch {
      setIsConnected(false)
    }
  }, [])

  // Manual Demo Controls for live judge presentations
  const triggerIncidentDemo = async () => {
    setScenarioMode('LAB_INCIDENT')
    await addNotification({
      category: 'estimate',
      title: 'Visit Estimate Updated',
      message: 'Your expected completion changed from 12:00 PM → 12:16 PM because Diagnostic Laboratory analyzer LAB-AN-02 is experiencing temporary maintenance.',
      tone: 'warning',
      actionRoute: '/(tabs)/visit',
    })
  }

  const triggerRecoveryDemo = async () => {
    setScenarioMode('STAFF_RECOVERY')
    await addNotification({
      category: 'recovery',
      title: 'Hospital Flow Improving',
      message: 'Backup analyzer activated by hospital operations. Your expected completion is now 12:07 PM (9 minutes earlier than previous estimate).',
      tone: 'healthy',
      actionRoute: '/(tabs)/visit',
    })
  }

  const resetToNormalDemo = async () => {
    setScenarioMode('NORMAL')
    setQueueProgressionStep(3)
  }

  const simulateQueueAdvance = async () => {
    setQueueProgressionStep((prev) => {
      const next = prev > 1 ? prev - 1 : 1
      if (next === 2) {
        addNotification({
          category: 'queue',
          title: 'Queue Moving Faster',
          message: 'You are now #2 in line (Token C-023). Please proceed towards Suite 204.',
          tone: 'healthy',
          actionRoute: '/(tabs)/queue',
        })
      } else if (next === 1) {
        addNotification({
          category: 'queue',
          title: 'Now Serving: Token C-023',
          message: 'It is your turn! Please enter Consultation Suite 204 to meet Dr. Ananya Rao.',
          tone: 'healthy',
          actionRoute: '/(tabs)/queue',
        })
      }
      return next
    })
  }

  return (
    <RealtimeHospitalContext.Provider
      value={{
        scenarioMode,
        setScenarioMode,
        isConnected,
        isDemoMode: !isSupabaseConfigured,
        triggerIncidentDemo,
        triggerRecoveryDemo,
        resetToNormalDemo,
        simulateQueueAdvance,
        queueProgressionStep,
      }}
    >
      {children}
    </RealtimeHospitalContext.Provider>
  )
}

export function useRealtimeHospital() {
  const ctx = useContext(RealtimeHospitalContext)
  if (!ctx) {
    // Graceful fallback if rendered outside provider
    return {
      scenarioMode: 'NORMAL' as DemoScenarioMode,
      setScenarioMode: () => {},
      isConnected: false,
      isDemoMode: true,
      triggerIncidentDemo: () => {},
      triggerRecoveryDemo: () => {},
      resetToNormalDemo: () => {},
      simulateQueueAdvance: () => {},
      queueProgressionStep: 3,
    }
  }
  return ctx
}
