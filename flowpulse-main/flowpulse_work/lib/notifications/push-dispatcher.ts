// ============================================================================
// FlowPulse AI — Push Notification & Webhook Dispatch Engine
// Handles FCM / Expo Push tokens, batch queuing, and clinical webhook events.
// ============================================================================

export interface PushNotificationRecord {
  id: string
  recipientToken: string
  title: string
  body: string
  data: Record<string, string | number | boolean>
  priority: 'default' | 'high'
  timestamp: string
  status: 'queued' | 'sent' | 'failed'
}

export class PushNotificationDispatcher {
  private queue: PushNotificationRecord[] = []

  /**
   * Enqueues a notification for dispatch.
   */
  public enqueue(
    recipientToken: string,
    title: string,
    body: string,
    data: Record<string, string | number | boolean> = {},
    priority: 'default' | 'high' = 'default',
  ): PushNotificationRecord {
    const record: PushNotificationRecord = {
      id: `push-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      recipientToken,
      title,
      body,
      data,
      priority,
      timestamp: new Date().toISOString(),
      status: 'queued',
    }

    this.queue.push(record)
    return record
  }

  /**
   * Simulates processing and dispatching queued notifications.
   */
  public async dispatchAll(): Promise<{ sent: number; failed: number }> {
    let sent = 0
    let failed = 0

    for (const item of this.queue) {
      if (item.status === 'queued') {
        // Valid token check
        if (item.recipientToken && item.recipientToken.length > 5) {
          item.status = 'sent'
          sent++
        } else {
          item.status = 'failed'
          failed++
        }
      }
    }

    return { sent, failed }
  }

  public getPendingCount(): number {
    return this.queue.filter((q) => q.status === 'queued').length
  }

  public clear(): void {
    this.queue = []
  }
}
