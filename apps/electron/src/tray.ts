// apps/desktop/src/main/tray.ts
import { app, Menu, nativeImage, Tray } from 'electron';
import path from 'path';

export function createTray(toggleMainWindow: () => void) {
  const iconPath = path.join(__dirname, 'trayTemplate.png'); // template icon for macOS
  const tray = new Tray(nativeImage.createFromPath(iconPath));

  const menu = Menu.buildFromTemplate([
    { label: 'Open ShoulderTap', click: toggleMainWindow },
    { type: 'separator' },
    { label: 'Focus 30 min', click: () => tray.emit('focus', 30) },
    { label: 'Focus 60 min', click: () => tray.emit('focus', 60) },
    { label: 'Snooze 15 min', click: () => tray.emit('snooze', 15) },
    { type: 'separator' },
    { label: 'Settings', click: () => tray.emit('settings') },
    { label: 'Quit', click: () => app.quit() },
  ]);

  tray.setToolTip('ShoulderTap');
  tray.setContextMenu(menu);

  tray.on('click', toggleMainWindow);
  return tray;
}
