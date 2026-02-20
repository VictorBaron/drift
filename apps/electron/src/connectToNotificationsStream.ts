import http from 'node:http';
import { BrowserWindow, Notification } from 'electron';

const API_URL = 'http://localhost:3000';
const RECONNECT_DELAY_MS = 5000;

export function connectToNotificationStream(mainWindow: BrowserWindow | null): void {
  const req = http.get(`${API_URL}/notifications/stream`, (res) => {
    let buffer = '';

    res.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const payload = JSON.parse(line.slice(6)) as { text?: string };
          new Notification({
            title: 'Urgent Slack message',
            body: payload.text ?? 'You have an urgent message',
            timeoutType: 'never',
          }).show();
          mainWindow?.webContents.send('notification', payload);
        } catch {
          // ignore malformed SSE data
        }
      }
    });

    res.on('end', () => {
      setTimeout(connectToNotificationStream, RECONNECT_DELAY_MS);
    });
  });

  req.on('error', () => {
    setTimeout(connectToNotificationStream, RECONNECT_DELAY_MS);
  });
}
