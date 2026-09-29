import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { PushNotificationDispatcher } from '../lib/notifications/push-dispatcher'

describe('FlowPulse Push Notification Dispatch Engine', () => {
  it('enqueues push notifications with clinical payloads and timestamps', () => {
    const dispatcher = new PushNotificationDispatcher()
    const item = dispatcher.enqueue(
      'ExponentPushToken[xxxx-yyyy]',
      'Token Called: C-023',
      'Please proceed to Room 204',
      { appointmentId: 'FP-101' },
      'high',
    )

    assert.ok(item.id.startsWith('push-'))
    assert.equal(item.priority, 'high')
    assert.equal(item.status, 'queued')
    assert.equal(dispatcher.getPendingCount(), 1)
  })

  it('dispatches queued notifications successfully', async () => {
    const dispatcher = new PushNotificationDispatcher()
    dispatcher.enqueue('ExponentPushToken[valid-token]', 'Test Title', 'Test Body')
    dispatcher.enqueue('', 'Invalid Token', 'Failed body')

    const result = await dispatcher.dispatchAll()
    assert.equal(result.sent, 1)
    assert.equal(result.failed, 1)
    assert.equal(dispatcher.getPendingCount(), 0)
  })
})
