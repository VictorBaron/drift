import { Controller, type MessageEvent, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SseUrgentNotificationGateway } from '../gateways/sse-urgent-notification.gateway';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly gateway: SseUrgentNotificationGateway) {}

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.gateway.getStream().pipe(map((payload) => ({ data: payload })));
  }
}
