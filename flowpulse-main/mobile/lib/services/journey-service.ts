// ============================================================================
// FlowPulse Patient Journey Service
// Provides stage-by-stage care timeline, dynamic delay calculations, and recovery sync.
// ============================================================================

import { getDemoPatientJourney } from '../data/demo-data'
import { supabase, isSupabaseConfigured } from '../supabase/client'
import type { DemoScenarioMode, PatientVisitJourney } from '../types'

export async function getPatientJourney(
  patientId: string = 'FP-P10023',
  scenarioMode: DemoScenarioMode = 'NORMAL',
): Promise<PatientVisitJourney> {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('patient_journeys')
        .select('*')
        .eq('patient_id', patientId)
        .single()

      if (!error && data) {
        return {
          patientId: data.patient_id || patientId,
          patientName: data.patient_name || 'Arjun Kumar',
          appointmentId: data.appointment_id || 'FP-2026-10482',
          departmentName: data.department_name || 'Cardiology',
          doctorName: data.doctor_name || 'Dr. Ananya Rao',
          doctorImageUrl: data.doctor_image_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&h=800&q=80',
          appointmentTime: data.appointment_time || '10:30 AM',
          recommendedArrival: data.recommended_arrival || '10:40 AM',
          currentQueuePosition: data.current_queue_position || 3,
          patientsAhead: data.patients_ahead || 2,
          currentWaitMinutes: data.current_wait_minutes || 14,
          estimatedCompletionTime: data.estimated_completion_time || '12:07 PM',
          remainingVisitTime: data.remaining_visit_time || '1 hr 13 min',
          alertMessage: data.alert_message || null,
          hasDiagnosticDelay: Boolean(data.has_diagnostic_delay),
          diagnosticDelayMinutes: data.diagnostic_delay_minutes || 0,
          isRecovered: Boolean(data.is_recovered),
          recoveredMinutes: data.recovered_minutes || 0,
          stages: data.stages || getDemoPatientJourney(scenarioMode).stages,
        }
      }
    }

    return getDemoPatientJourney(scenarioMode)
  } catch {
    return getDemoPatientJourney(scenarioMode)
  }
}
