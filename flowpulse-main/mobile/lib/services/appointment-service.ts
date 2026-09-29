// ============================================================================
// FlowPulse Appointment Service
// Handles booking validation, smart estimate generation, and appointment storage.
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage'
import { DEMO_ACTIVE_APPOINTMENT, DEMO_DOCTORS } from '../data/demo-data'
import { calculateExpectedCompletion, calculateRecommendedArrival } from '../engines/visit-time-engine'
import { supabase, isSupabaseConfigured } from '../supabase/client'
import type { DepartmentId, UserAppointment } from '../types'

const APPOINTMENTS_STORAGE_KEY = '@flowpulse_user_appointments'

export interface BookingPayload {
  patientId: string
  patientName: string
  departmentId: DepartmentId
  departmentName: string
  doctorId: string
  doctorName: string
  doctorQualification: string
  doctorImageUrl: string
  scheduledDate: string
  scheduledTime: string
}

export async function getAppointments(): Promise<UserAppointment[]> {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          patientId: item.patient_id || 'FP-P10023',
          patientName: item.patient_name || 'Arjun Kumar',
          departmentId: item.department_id || 'cardiology',
          departmentName: item.department_name || 'Cardiology',
          doctorId: item.doctor_id || 'DOC-101',
          doctorName: item.doctor_name || 'Dr. Ananya Rao',
          doctorQualification: item.doctor_qualification || 'Consultant',
          doctorImageUrl: item.doctor_image_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&h=800&q=80',
          scheduledDate: item.scheduled_date || 'Today',
          scheduledTime: item.scheduled_time || '10:30 AM',
          recommendedArrivalWindow: item.recommended_arrival_window || '10:40–10:45 AM',
          expectedQueueWaitMinutes: item.expected_queue_wait_minutes || 14,
          expectedConsultationTime: item.expected_consultation_time || '10:52 AM',
          estimatedVisitDuration: item.estimated_visit_duration || '1 hr 25 min',
          estimatedCompletionTime: item.estimated_completion_time || '12:05 PM',
          token: item.token || 'C-023',
          status: item.status || 'confirmed',
          createdAt: item.created_at || new Date().toISOString(),
        }))
      }
    }

    const cached = await AsyncStorage.getItem(APPOINTMENTS_STORAGE_KEY)
    if (cached) {
      return JSON.parse(cached)
    }

    const initial = [DEMO_ACTIVE_APPOINTMENT]
    await AsyncStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(initial))
    return initial
  } catch {
    return [DEMO_ACTIVE_APPOINTMENT]
  }
}

export async function getActiveAppointment(): Promise<UserAppointment | null> {
  const all = await getAppointments()
  return all.find((a) => a.status === 'confirmed' || a.status === 'in-progress') || all[0] || null
}

export async function bookAppointment(payload: BookingPayload): Promise<UserAppointment> {
  // 1. Validation
  if (!payload.patientName?.trim()) {
    throw new Error('Patient name is required.')
  }
  if (!payload.departmentId) {
    throw new Error('Please select a department.')
  }
  if (!payload.doctorId) {
    throw new Error('Please select a doctor.')
  }
  if (!payload.scheduledDate) {
    throw new Error('Please select an appointment date.')
  }
  if (!payload.scheduledTime) {
    throw new Error('Please select a time slot.')
  }

  // 2. Pure Engine Calculation
  const arrival = calculateRecommendedArrival(payload.scheduledTime, 0)
  const completion = calculateExpectedCompletion({
    departmentId: payload.departmentId,
    scheduledTime: payload.scheduledTime,
    queueWaitMinutes: 14,
    includeDiagnostics: true,
  })

  // 3. Generate token & reference
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  const appointmentId = `FP-2026-${randomSuffix}`
  const deptPrefix = payload.departmentId === 'cardiology' ? 'C' : payload.departmentId === 'emergency' ? 'E' : 'OP'
  const token = `${deptPrefix}-0${Math.floor(20 + Math.random() * 15)}`

  const newAppointment: UserAppointment = {
    id: appointmentId,
    patientId: payload.patientId || 'FP-P10023',
    patientName: payload.patientName,
    departmentId: payload.departmentId,
    departmentName: payload.departmentName,
    doctorId: payload.doctorId,
    doctorName: payload.doctorName,
    doctorQualification: payload.doctorQualification,
    doctorImageUrl: payload.doctorImageUrl,
    scheduledDate: payload.scheduledDate,
    scheduledTime: payload.scheduledTime,
    recommendedArrivalWindow: arrival.recommendedWindow,
    expectedQueueWaitMinutes: 14,
    expectedConsultationTime: arrival.targetArrivalTimeStr,
    estimatedVisitDuration: completion.formattedDuration,
    estimatedCompletionTime: completion.expectedCompletionTime,
    token,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  }

  // 4. Persistence
  const current = await getAppointments()
  const updated = [newAppointment, ...current]
  await AsyncStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(updated))

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('appointments').insert([
        {
          id: newAppointment.id,
          patient_id: newAppointment.patientId,
          patient_name: newAppointment.patientName,
          department_id: newAppointment.departmentId,
          department_name: newAppointment.departmentName,
          doctor_id: newAppointment.doctorId,
          doctor_name: newAppointment.doctorName,
          doctor_qualification: newAppointment.doctorQualification,
          doctor_image_url: newAppointment.doctorImageUrl,
          scheduled_date: newAppointment.scheduledDate,
          scheduled_time: newAppointment.scheduledTime,
          recommended_arrival_window: newAppointment.recommendedArrivalWindow,
          expected_queue_wait_minutes: newAppointment.expectedQueueWaitMinutes,
          expected_consultation_time: newAppointment.expectedConsultationTime,
          estimated_visit_duration: newAppointment.estimatedVisitDuration,
          estimated_completion_time: newAppointment.estimatedCompletionTime,
          token: newAppointment.token,
          status: newAppointment.status,
          created_at: newAppointment.createdAt,
        },
      ])
    } catch {
      // Offline fallback succeeded
    }
  }

  return newAppointment
}
