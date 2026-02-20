import { contextBridge, ipcRenderer } from 'electron';

export interface NotificationPayload {
  text: string;
  reasoning: string;
  sender: { name: string | null; email: string };
  channel: { name: string | null; type: string };
  slackLink: string;
}

contextBridge.exposeInMainWorld('electronAPI', {
  onNotification: (callback: (payload: NotificationPayload) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: NotificationPayload) => callback(payload);
    ipcRenderer.on('notification', handler);
    return () => ipcRenderer.removeListener('notification', handler);
  },
});

contextBridge.exposeInMainWorld('shouldertap', {
  listInterrupts: () => ipcRenderer.invoke('interrupts:list'),
  markRead: (id: string) => ipcRenderer.invoke('interrupts:markRead', { id }),
  snooze: (id: string, minutes: number) => ipcRenderer.invoke('interrupts:snooze', { id, minutes }),
  setFocus: (minutes: number) => ipcRenderer.invoke('focus:set', { minutes }),
  openSlackLink: (url: string) => ipcRenderer.invoke('open:slackLink', { url }),
});
