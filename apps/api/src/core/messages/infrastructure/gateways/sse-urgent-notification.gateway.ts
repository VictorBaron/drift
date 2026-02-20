import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import type {
  UrgentNotificationGateway,
  UrgentNotificationPayload,
} from '@/messages/domain/gateways/urgent-notification.gateway';

@Injectable()
export class SseUrgentNotificationGateway implements UrgentNotificationGateway {
  private readonly events$ = new Subject<UrgentNotificationPayload>();

  async notifyUrgentMessage(payload: UrgentNotificationPayload): Promise<void> {
    this.events$.next(payload);
  }

  getStream(): Observable<UrgentNotificationPayload> {
    return this.events$.asObservable();
  }
}
