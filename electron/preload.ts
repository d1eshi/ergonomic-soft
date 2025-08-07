import { contextBridge, ipcRenderer } from 'electron';
import type { PerformanceMetrics } from '../shared/types';
import type { NotificationPayload } from '../shared/types';

contextBridge.exposeInMainWorld('api', {
  notify: (payload: NotificationPayload) => ipcRenderer.send('notify', payload),
  startMonitoring: () => ipcRenderer.invoke('start-monitoring'),
  stopMonitoring: () => ipcRenderer.invoke('stop-monitoring'),
  getBackendPort: () => ipcRenderer.invoke('get-backend-port'),
  logError: (error: { message: string; stack?: string; context?: string }) => ipcRenderer.send('log-error', error),
  reportPerf: (metrics: PerformanceMetrics) => ipcRenderer.send('perf-metrics', metrics)
});

// Puente de eventos de bandeja → renderer (aislado)
ipcRenderer.on('tray-start', () => {
  window.postMessage('tray-start', '*');
});
ipcRenderer.on('tray-stop', () => {
  window.postMessage('tray-stop', '*');
});
ipcRenderer.on('open-settings', () => {
  window.postMessage('open-settings', '*');
});


