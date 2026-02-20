interface NotificationPayload {
  text: string;
  reasoning: string;
  sender: { name: string | null; email: string };
  channel: { name: string | null; type: string };
  slackLink: string;
}

interface Window {
  electronAPI: {
    onNotification: (callback: (payload: NotificationPayload) => void) => () => void;
  };
  shouldertap: {
    listInterrupts: () => Promise<unknown>;
    markRead: (id: string) => Promise<{ success: boolean; id: string }>;
    snooze: (id: string, minutes: number) => Promise<{ success: boolean; id: string; minutes: number }>;
    setFocus: (minutes: number) => Promise<{ success: boolean; minutes: number }>;
    openSlackLink: (url: string) => Promise<{ success: boolean }>;
  };
}
