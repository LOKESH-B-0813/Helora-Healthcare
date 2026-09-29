// ============================================================================
// FlowPulse AI — Patient SMS, WhatsApp & Push Notification Templates
// Clinical templates for appointment confirmations, adaptive arrival windows, and queue calling.
// ============================================================================

export type NotificationChannel = 'sms' | 'whatsapp' | 'push'

export interface PatientNotificationPayload {
  patientName: string
  appointmentId: string
  departmentName: string
  doctorName: string
  scheduledTime: string
  recommendedArrivalWindow: string
  currentToken?: string
  waitMinutes?: number
  hospitalName?: string
}

/**
 * Generates an appointment confirmation message formatted for SMS and WhatsApp.
 */
export function formatAppointmentConfirmationMessage(
  payload: PatientNotificationPayload,
  channel: NotificationChannel = 'whatsapp',
): string {
  const hospital = payload.hospitalName || 'Metro General Hospital'

  if (channel === 'whatsapp') {
    return (
      `🏥 *${hospital} — Appointment Confirmed*\n\n` +
      `Hello ${payload.patientName},\n` +
      `Your consultation with *${payload.doctorName}* (${payload.departmentName}) is confirmed.\n\n` +
      `📅 *Scheduled Time:* ${payload.scheduledTime}\n` +
      `🎯 *Recommended Arrival Window:* ${payload.recommendedArrivalWindow}\n` +
      `🆔 *Appointment ID:* ${payload.appointmentId}\n\n` +
      `⚡ *FlowPulse Tip:* Arrive during your recommended window to bypass waiting room congestion.\n` +
      `Track your live queue: https://flowpulse.health/track-visit?id=${payload.appointmentId}`
    )
  }

  // Standard SMS (concise)
  return (
    `${hospital}: Appointment confirmed with ${payload.doctorName} on ${payload.scheduledTime}. ` +
    `Recommended arrival: ${payload.recommendedArrivalWindow}. ID: ${payload.appointmentId}. Track: flowpulse.health/track`
  )
}

/**
 * Generates a dynamic queue delay alert notification.
 */
export function formatQueueDelayAlertMessage(
  payload: PatientNotificationPayload,
  delayMinutes: number,
): string {
  return (
    `⚠️ ${payload.hospitalName || 'Metro General'}: Notice regarding your ${payload.departmentName} appointment. ` +
    `Operational queue backlog has adjusted your estimated consult time (+${delayMinutes}m). ` +
    `Your updated recommended arrival window is ${payload.recommendedArrivalWindow}.`
  )
}

/**
 * Generates an urgent "Token Called" notification when the doctor is ready.
 */
export function formatTokenCalledMessage(payload: PatientNotificationPayload): string {
  return (
    `🔔 Token ${payload.currentToken || 'C-023'} CALLED for ${payload.patientName}! ` +
    `Please proceed directly to ${payload.departmentName} (Suite 204) with ${payload.doctorName}.`
  )
}
