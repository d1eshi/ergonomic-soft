import { app, BrowserWindow, ipcMain, Notification, Menu, Tray, nativeImage, dialog } from 'electron';
import path from 'node:path';
import { PythonManager } from './python-manager';
import type { NotificationPayload } from '../shared/types';
import fs from 'node:fs';

let mainWindow: BrowserWindow | null = null;
const pythonManager = new PythonManager();
let tray: Tray | null = null;
let monitoring = false;

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

  ipcMain.handle('start-monitoring', async () => {
    monitoring = true;
    try {
      await fetch(`http://127.0.0.1:${pythonManager.getPort()}/api/cv/start-session`, { method: 'POST' });
    } catch {}
    updateTrayMenu();
    return { monitoring };
  });
  ipcMain.handle('stop-monitoring', async () => {
    monitoring = false;
    try {
      await fetch(`http://127.0.0.1:${pythonManager.getPort()}/api/cv/stop-session`, { method: 'POST' });
    } catch {}
    updateTrayMenu();
    return { monitoring };
  });
  ipcMain.handle('get-backend-port', async () => pythonManager.getPort());
  ipcMain.on('log-error', (_e, error: { message: string; stack?: string; context?: string }) => {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        context: error.context,
        appVersion: app.getVersion(),
        platform: process.platform
      };
      const logPath = path.join(app.getPath('userData'), 'error.log');
      fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
    } catch {}
  });
  ipcMain.on('perf-metrics', (_e, metrics) => {
    try {
      const logPath = path.join(app.getPath('userData'), 'perf.log');
      fs.appendFileSync(logPath, JSON.stringify({ ts: Date.now(), metrics }) + '\n');
    } catch {}
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

function createTray() {
  const iconPath = path.join(app.getAppPath(), 'public', 'icons', 'iconTemplate.png');
  const image = fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : undefined;
  tray = new Tray(image || nativeImage.createEmpty());
  tray.setToolTip('Ergonomic Assistant');
  updateTrayMenu();
}

function updateTrayMenu() {
  if (!tray) return;
  const template: Electron.MenuItemConstructorOptions[] = [
    { label: 'Mostrar ventana', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } } },
    { label: `Estado actual: ${monitoring ? 'Monitoreando' : 'Inactivo'}`, enabled: false },
    { type: 'separator' },
    { label: monitoring ? 'Detener monitoreo' : 'Iniciar monitoreo', click: () => {
      if (monitoring) {
        mainWindow?.webContents.send('tray-stop');
      } else {
        mainWindow?.webContents.send('tray-start');
      }
    } },
    { label: 'Tomar descanso', click: () => mainWindow?.webContents.send('tray-break') },
    { type: 'separator' },
    { label: 'Ajustes', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.webContents.send('open-settings'); } } },
    { label: 'Salir', click: () => app.quit() }
  ];
  const menu = Menu.buildFromTemplate(template);
  tray.setContextMenu(menu);
}

app.whenReady().then(async () => {
  setupIPC();
  configureAutoLaunch(false);
  await pythonManager.start();
  createWindow();
  createTray();

  // Auto-updater (solo en producción con electron-builder)
  try {
    // Carga dinámica para evitar problemas en dev
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { autoUpdater } = require('electron-updater');
    autoUpdater.checkForUpdatesAndNotify();
    autoUpdater.on('update-available', () => {
      new Notification({ title: 'Actualización disponible', body: 'Descargando actualización…' }).show();
    });
    autoUpdater.on('update-downloaded', async () => {
      const res = await dialog.showMessageBox({
        type: 'info',
        buttons: ['Instalar y reiniciar', 'Más tarde'],
        message: 'Actualización descargada. ¿Instalar ahora?'
      });
      if (res.response === 0) autoUpdater.quitAndInstall();
    });
  } catch {}

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


