// ============================================================================
// FlowPulse useQueue Hook
// Manages live queue telemetry, patient token position, and progression.
// ============================================================================

import { useCallback, useEffect, useState } from 'react'
import { getLiveQueue } from '../lib/services/queue-service'
import type { DepartmentId, PatientLiveQueue } from '../lib/types'
import { useRealtimeHospital } from './useRealtimeHospital'

export function useQueue(departmentId: DepartmentId = 'cardiology', token: string = 'C-023') {
  const { queueProgressionStep, simulateQueueAdvance } = useRealtimeHospital()
  const [queue, setQueue] = useState<PatientLiveQueue | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)

  const fetchQueue = useCallback(async () => {
    try {
      const data = await getLiveQueue(departmentId, token, queueProgressionStep)
      setQueue(data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [departmentId, token, queueProgressionStep])

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchQueue()
  }

  return {
    queue,
    loading,
    refreshing,
    onRefresh,
    advanceQueue: simulateQueueAdvance,
  }
}
