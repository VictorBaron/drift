import type {
  UrgentNotificationGateway,
  UrgentNotificationPayload,
} from '@/messages/domain/gateways/urgent-notification.gateway';

export class FakeUrgentNotificationGateway implements UrgentNotificationGateway {
  private calls: UrgentNotificationPayload[] = [];

  async notifyUrgentMessage(payload: UrgentNotificationPayload): Promise<void> {
    this.calls.push(payload);
  }

  getCallCount(): number {
    return this.calls.length;
  }

  getLastPayload(): UrgentNotificationPayload {
    if (this.calls.length === 0) throw new Error('notifyUrgentMessage has not been called');
    return this.calls[this.calls.length - 1];
  }

  reset(): void {
    this.calls = [];
  }
}
