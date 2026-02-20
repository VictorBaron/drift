export const URGENT_NOTIFICATION_GATEWAY = 'URGENT_NOTIFICATION_GATEWAY';

export interface UrgentNotificationPayload {
  messageId: string;
  text: string;
  score: number;
  reasoning: string;
  sender: {
    name: string | null;
    email: string;
  };
  channel: {
    name: string | null;
    type: string;
  };
  slackLink: string;
}

export interface UrgentNotificationGateway {
  notifyUrgentMessage(payload: UrgentNotificationPayload): Promise<void>;
}
