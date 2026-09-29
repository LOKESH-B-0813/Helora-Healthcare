// ============================================================================
// FlowPulse usePatientJourney Hook
// Manages the multi-stage care pathway with dynamic delay and recovery calculations.
// ============================================================================

import { useCallback, useEffect, useState } from 'react'
import { getPatientJourney } from '../lib/services/journey-service'
import type { PatientVisitJourney } from '../lib/types'
import { useRealtimeHospital } from './useRealtimeHospital'

export function usePatientJourney(patientId: string = 'FP-P10023') {
  const { scenarioMode } = useRealtimeHospital()
  const [journey, setJourney] = useState<PatientVisitJourney | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)

  const fetchJourney = useCallback(async () => {
    try {
      const data = await getPatientJourney(patientId, scenarioMode)
      setJourney(data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [patientId, scenarioMode])

  useEffect(() => {
    fetchJourney()
  }, [fetchJourney])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchJourney()
  }

  return {
    journey,
    loading,
    refreshing,
    onRefresh,
    scenarioMode,
  }
}
