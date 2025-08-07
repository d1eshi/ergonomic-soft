import { app, BrowserWindow, ipcMain, Notification, shell } from 'electron';
import path from 'node:path';
import { PythonManager } from './python-manager';
import type { NotificationPayload } from '../shared/types';

let mainWindow: BrowserWindow | null = null;
const pythonManager = new PythonManager();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(app.getAppPath(), 'dist-electron', 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  if (!app.isPackaged) {
    const url = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(url);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function setupIPC() {
  ipcMain.on('notify', (_event, payload: NotificationPayload) => {
    const n = new Notification({
      title: payload.title,
      body: payload.body,
      urgency: payload.severity === 'critical' ? 'critical' : payload.severity === 'warning' ? 'normal' : 'low'
    });
    n.show();
  });
}

function configureAutoLaunch(enabled: boolean) {
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: true
    });
  } catch (e) {
    console.warn('No se pudo configurar autoinicio:', e);
  }
}

app.whenReady().then(async () => {
  setupIPC();
  configureAutoLaunch(false);
  await pythonManager.start();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  pythonManager.stop();
});


