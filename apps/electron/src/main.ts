import http from 'node:http';
import path from 'node:path';
import { app, BrowserWindow, Notification } from 'electron';

const API_URL = 'http://localhost:3000';
const RECONNECT_DELAY_MS = 5000;

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function connectToNotificationStream(): void {
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

app.whenReady().then(() => {
  createWindow();
  connectToNotificationStream();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
