import { Link, Route, Routes } from 'react-router-dom';
import type { NotificationPayload, NotificationSettings, PostureAlert, PerformanceMetrics } from '#shared/types';
import { useEffect, useMemo } from 'react';
import { useNotifications } from './hooks/useNotifications';
import { Toast } from './components/Toast';
import { Dashboard } from '@/components/Dashboard';
import { DockMinibar } from '@/components/DockMinibar';
import { useErgonomicStore } from '@/store/ergonomicStore';
import { HeaderBar } from '@/components/HeaderBar';

function Nav() {
  return (
    <nav className="flex items-center justify-between p-4 border-b border-gray-800">
      <div className="font-semibold">Ergonomic App</div>
      <div className="flex gap-4">
        <Link to="/" className="hover:underline">Inicio</Link>
        <Link to="/live" className="hover:underline">En vivo</Link>
        <Link to="/settings" className="hover:underline">Ajustes</Link>
      </div>
    </nav>
  );
}

function Home() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Bienvenido</h1>
      <p className="text-gray-300">Estructura base lista. Backend Python se iniciará con la app. Salud: usa el botón para probar notificaciones.</p>
      <div className="mt-4">
        <button
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
          onClick={() => {
            const payload: NotificationPayload = { title: 'Prueba', body: 'Notificación informativa', severity: 'info' };
            window.api?.notify(payload);
          }}
        >
          Probar notificación
        </button>
      </div>
    </div>
  );
}

function Live() {
  const settings: NotificationSettings = useMemo(() => ({
    enabled: true,
    workingHours: { start: '07:00', end: '22:00' },
    dndDuringMeetings: true,
    alertSensitivity: 'medium',
    preferredDelivery: 'both',
    breakReminderInterval: 50,
    snoozeOptions: [5, 10, 15],
    customMessages: {}
  }), []);

  const { toasts, visualCue, processPostureAlert, dismissToast } = useNotifications(settings);

  useEffect(() => {
    // Conectar al stream de análisis y generar alertas básicas de ejemplo
    const portPromise = window.api?.getBackendPort?.() ?? Promise.resolve(5175);
    let ws: WebSocket | null = null;
    portPromise.then((port) => {
      ws = new WebSocket(`ws://127.0.0.1:${port}/api/cv/stream`);
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (!data?.severity_by_metric || !data?.angles) return;
          const sev = data.severity_by_metric as Record<string, string>;
          // Regla simple de demo: si cuello o espalda en warning/critical por tiempo acumulado, emitir alerta
          const duration = 60; // placeholder: en app real acumularíamos por métrica
          if (sev.neck_angle === 'warning' || sev.neck_angle === 'critical') {
            const alert: PostureAlert = {
              type: 'neck_forward',
              severity: sev.neck_angle === 'critical' ? 'critical' : 'warning',
              duration,
              message: 'Inclinas el cuello hacia adelante por tiempo prolongado',
              recommendation: 'Eleva la pantalla y retrae ligeramente la barbilla',
              dismissible: true
            };
            processPostureAlert(alert);
          }
          if (sev.back_angle === 'warning' || sev.back_angle === 'critical') {
            const alert: PostureAlert = {
              type: 'hunched_back',
              severity: sev.back_angle === 'critical' ? 'critical' : 'warning',
              duration,
              message: 'Espalda encorvada detectada por tiempo prolongado',
              recommendation: 'Reclina el respaldo a 95°–110° y apoya zona lumbar',
              dismissible: true
            };
            processPostureAlert(alert);
          }
        } catch { /* ignore */ }
      };
    });
    return () => { try { ws?.close(); } catch {} };
  }, [processPostureAlert]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-2">Monitoreo en vivo</h2>
      <p className="text-gray-300">Análisis en tiempo real y alertas inteligentes.</p>
      {visualCue && (
        <div className="mt-4 text-amber-300">Sugerencia visual activa: {visualCue.type}</div>
      )}
      {toasts.map(t => (
        <Toast key={t.id} notification={t} onDismiss={dismissToast} />
      ))}
    </div>
  );
}

function Settings() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-2">Ajustes</h2>
      <ul className="list-disc ml-6 text-gray-300">
        <li>Autoinicio del sistema</li>
        <li>Preferencias de notificaciones</li>
        <li>Privacidad (procesamiento 100% local)</li>
      </ul>
    </div>
  );
}

export default function App() {
  const isMinimized = useErgonomicStore(s => s.isMinimized);
  // Reporte simple de performance
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = () => {
      const now = performance.now();
      const uiRenderTime = now - last;
      last = now;
      const memory = (performance as any).memory?.usedJSHeapSize ? Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024)) : 0;
      const metrics: PerformanceMetrics = {
        frameProcessingTime: 0,
        uiRenderTime,
        memoryUsage: memory,
        cpuUsage: 0,
        batteryImpact: 'low'
      };
      window.api?.reportPerf?.(metrics);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  // Integración con bandeja del sistema para start/stop
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if ((e as any).data === 'tray-start') window.api?.startMonitoring?.();
      if ((e as any).data === 'tray-stop') window.api?.stopMonitoring?.();
    };
    window.addEventListener('message', handler as any);
    return () => window.removeEventListener('message', handler as any);
  }, []);
  return (
    <div className="h-full flex flex-col">
      <HeaderBar />
      <div className={`flex-1 ${isMinimized ? 'pointer-events-none opacity-50' : ''}`}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/live" element={<Live />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
      <DockMinibar />
    </div>
  );
}

declare global {
  interface Window {
    api?: {
      notify: (payload: NotificationPayload) => void;
      startMonitoring?: () => Promise<unknown>;
      stopMonitoring?: () => Promise<unknown>;
      getBackendPort?: () => Promise<number>;
      reportPerf?: (m: PerformanceMetrics) => void;
    };
  }
}



