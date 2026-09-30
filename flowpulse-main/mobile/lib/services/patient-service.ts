// ============================================================================
// FlowPulse Patient Service
// Manages patient profile, persistence, and profile preferences.
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage'
import { DEMO_PATIENT } from '../data/demo-data'
import { supabase, isSupabaseConfigured } from '../supabase/client'
import type { PatientProfile } from '../types'

const PATIENT_STORAGE_KEY = '@flowpulse_patient_profile'

export async function getPatientProfile(): Promise<PatientProfile> {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', DEMO_PATIENT.id)
        .single()

      if (!error && data) {
        return {
          id: data.id,
          name: data.name || DEMO_PATIENT.name,
          age: data.age || DEMO_PATIENT.age,
          gender: data.gender || DEMO_PATIENT.gender,
          phone: data.phone || DEMO_PATIENT.phone,
          email: data.email || DEMO_PATIENT.email,
          bloodGroup: data.blood_group || DEMO_PATIENT.bloodGroup,
          emergencyContact: data.emergency_contact || DEMO_PATIENT.emergencyContact,
          notificationPreferences: data.notification_preferences || DEMO_PATIENT.notificationPreferences,
        }
      }
    }

    const cached = await AsyncStorage.getItem(PATIENT_STORAGE_KEY)
    if (cached) {
      return JSON.parse(cached)
    }

    await AsyncStorage.setItem(PATIENT_STORAGE_KEY, JSON.stringify(DEMO_PATIENT))
    return DEMO_PATIENT
  } catch {
    return DEMO_PATIENT
  }
}

export async function updatePatientPreferences(
  preferences: PatientProfile['notificationPreferences'],
): Promise<PatientProfile> {
  const current = await getPatientProfile()
  const updated: PatientProfile = {
    ...current,
    notificationPreferences: preferences,
  }

  await AsyncStorage.setItem(PATIENT_STORAGE_KEY, JSON.stringify(updated))

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('patients')
        .update({ notification_preferences: preferences })
        .eq('id', updated.id)
    } catch {
      // offline fallback handled
    }
  }

  return updated
}
