export const URGENT_NOTIFICATION_GATEWAY = 'URGENT_NOTIFICATION_GATEWAY';

export interface UrgentNotificationPayload {
  messageId: string;
  text: string;
  score: number;
  reasoning: string;
}

export interface UrgentNotificationGateway {
  notifyUrgentMessage(payload: UrgentNotificationPayload): Promise<void>;
}
