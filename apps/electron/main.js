const { app, BrowserWindow, Notification } = require('electron/main');
const http = require('http');

const API_URL = 'http://localhost:3000';

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
  });

  win.loadFile('index.html');
};

function connectToNotificationStream() {
  const req = http.get(`${API_URL}/notifications/stream`, (res) => {
    let buffer = '';

    res.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const payload = JSON.parse(line.slice(6));
          new Notification({
            title: 'Urgent Slack message',
            body: payload.text ?? 'You have an urgent message',
          }).show();
        } catch {
          // ignore malformed SSE data
        }
      }
    });

    res.on('end', () => {
      setTimeout(connectToNotificationStream, 5000);
    });
  });

  req.on('error', () => {
    setTimeout(connectToNotificationStream, 5000);
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
