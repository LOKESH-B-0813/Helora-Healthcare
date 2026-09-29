import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  formatAppointmentConfirmationMessage,
  formatQueueDelayAlertMessage,
  formatTokenCalledMessage,
} from '../lib/notifications/sms-templates'

describe('FlowPulse Patient Notification Templates', () => {
  const dummyPayload = {
    patientName: 'Arjun Kumar',
    appointmentId: 'FP-2026-10482',
    departmentName: 'Cardiology',
    doctorName: 'Dr. Ananya Rao',
    scheduledTime: '10:30 AM',
    recommendedArrivalWindow: '10:35–10:45 AM',
    currentToken: 'CARD-042',
    waitMinutes: 14,
  }

  it('generates rich formatted WhatsApp confirmation message', () => {
    const msg = formatAppointmentConfirmationMessage(dummyPayload, 'whatsapp')
    assert.ok(msg.includes('Arjun Kumar'))
    assert.ok(msg.includes('Dr. Ananya Rao'))
    assert.ok(msg.includes('10:35–10:45 AM'))
    assert.ok(msg.includes('FP-2026-10482'))
  })

  it('generates concise SMS message within character limits', () => {
    const msg = formatAppointmentConfirmationMessage(dummyPayload, 'sms')
    assert.ok(msg.length < 200)
    assert.ok(msg.includes('Metro General Hospital'))
  })

  it('generates token called alert with room and token id', () => {
    const msg = formatTokenCalledMessage(dummyPayload)
    assert.ok(msg.includes('CARD-042'))
    assert.ok(msg.includes('Suite 204'))
  })
})
