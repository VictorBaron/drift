import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  onNotification: (callback: (payload: { text: string }) => void) => {
    ipcRenderer.on('notification', (_event, payload) => callback(payload as { text: string }));
  },
});
