import path from 'node:path';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { connectToNotificationStream } from './connectToNotificationsStream';
import { createTray } from './tray';

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
const API_URL = process.env['API_URL'] ?? 'http://localhost:3000';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 640,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist-renderer', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerIpcHandlers(): void {
  ipcMain.handle('interrupts:list', () => []);

  ipcMain.handle('interrupts:markRead', (_event, { id }: { id: string }) => ({
    success: true,
    id,
  }));

  ipcMain.handle('interrupts:snooze', (_event, { id, minutes }: { id: string; minutes: number }) => ({
    success: true,
    id,
    minutes,
  }));

  ipcMain.handle('focus:set', async (_event, { minutes }: { minutes: number }) => {
    try {
      await fetch(`${API_URL}/notifications/focus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes }),
      });
    } catch {
      // swallow — focus continues locally in the UI
    }
    return { success: true, minutes };
  });

  ipcMain.handle('open:slackLink', (_event, { url }: { url: string }) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'https:' && parsed.hostname.endsWith('slack.com')) {
        shell.openExternal(url);
        return { success: true };
      }
    } catch {}
    return { success: false };
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();
  connectToNotificationStream(mainWindow);

  createTray(() => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) mainWindow.hide();
    else mainWindow.show();
  });

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
