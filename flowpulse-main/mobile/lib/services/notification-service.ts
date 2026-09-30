// ============================================================================
// FlowPulse Notification Service
// Manages patient notifications, unread badges, and cross-platform alert delivery.
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage'
import { INITIAL_NOTIFICATIONS } from '../data/demo-data'
import { supabase, isSupabaseConfigured } from '../supabase/client'
import type { MobileNotification } from '../types'

const NOTIFICATIONS_STORAGE_KEY = '@flowpulse_patient_notifications'

export async function getNotifications(): Promise<MobileNotification[]> {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        return data.map((n: any) => ({
          id: n.id,
          category: n.category || 'system',
          title: n.title,
          message: n.message || n.detail,
          timestamp: n.timestamp || 'Just now',
          read: Boolean(n.read),
          tone: n.tone || 'healthy',
          actionRoute: n.action_route || '/(tabs)/notifications',
        }))
      }
    }

    const cached = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
    if (cached) {
      return JSON.parse(cached)
    }

    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS))
    return INITIAL_NOTIFICATIONS
  } catch {
    return INITIAL_NOTIFICATIONS
  }
}

export async function markAsRead(id: string): Promise<MobileNotification[]> {
  const all = await getNotifications()
  const updated = all.map((n) => (n.id === id ? { ...n, read: true } : n))
  await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated))
  return updated
}

export async function markAllAsRead(): Promise<MobileNotification[]> {
  const all = await getNotifications()
  const updated = all.map((n) => ({ ...n, read: true }))
  await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated))
  return updated
}

export async function addNotification(
  notification: Omit<MobileNotification, 'id' | 'timestamp' | 'read'>,
): Promise<MobileNotification[]> {
  const all = await getNotifications()
  const newNotif: MobileNotification = {
    ...notification,
    id: `notif-${Date.now()}`,
    timestamp: 'Just now',
    read: false,
  }
  const updated = [newNotif, ...all]
  await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated))
  return updated
}
