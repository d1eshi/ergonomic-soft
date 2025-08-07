import { contextBridge, ipcRenderer } from 'electron';
import type { NotificationPayload } from '../shared/types';

contextBridge.exposeInMainWorld('api', {
  notify: (payload: NotificationPayload) => ipcRenderer.send('notify', payload)
});


