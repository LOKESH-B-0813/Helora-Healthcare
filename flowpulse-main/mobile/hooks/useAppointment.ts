// ============================================================================
// FlowPulse useAppointment Hook
// Manages appointments listing, active appointment, and booking state.
// ============================================================================

import { useCallback, useEffect, useState } from 'react'
import { bookAppointment, getActiveAppointment, getAppointments, type BookingPayload } from '../lib/services/appointment-service'
import type { UserAppointment } from '../lib/types'

export function useAppointment() {
  const [appointments, setAppointments] = useState<UserAppointment[]>([])
  const [activeAppointment, setActiveAppointment] = useState<UserAppointment | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [bookingLoading, setBookingLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const refreshAppointments = useCallback(async () => {
    try {
      setLoading(true)
      const list = await getAppointments()
      setAppointments(list)
      const active = await getActiveAppointment()
      setActiveAppointment(active)
      setError(null)
    } catch (err: any) {
      setError(err?.message || 'Failed to load appointments.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshAppointments()
  }, [refreshAppointments])

  const createBooking = async (payload: BookingPayload): Promise<UserAppointment> => {
    try {
      setBookingLoading(true)
      setError(null)
      const newAppt = await bookAppointment(payload)
      await refreshAppointments()
      return newAppt
    } catch (err: any) {
      setError(err?.message || 'Failed to book appointment.')
      throw err
    } finally {
      setBookingLoading(false)
    }
  }

  return {
    appointments,
    activeAppointment,
    loading,
    bookingLoading,
    error,
    refreshAppointments,
    createBooking,
  }
}
