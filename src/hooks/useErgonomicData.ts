import { useCallback, useEffect, useRef } from 'react';
import type { ErgonomicAnalysis } from '@/types';
import { useErgonomicStore } from '@/store/ergonomicStore';

/**
 * Hook que gestiona la conexión WebSocket para recibir análisis ergonómico en tiempo real.
 * Envía updates al store global y maneja reconexiones.
 * @example
 * useErgonomicData(); // dentro del Dashboard para mantener análisis actualizados
 */
export function useErgonomicData() {
  const updateAnalysis = useErgonomicStore(s => s.updateAnalysis);
  const isMonitoring = useErgonomicStore(s => s.isMonitoring);
  const pushAlert = useErgonomicStore(s => s.pushAlert);
  const wsRef = useRef<WebSocket | null>(null);
  const retryTimer = useRef<number | null>(null);

  const connect = useCallback(() => {
    try {
      wsRef.current?.close();
      const portPromise: Promise<number> = (window.api as any)?.getBackendPort ? (window.api as any).getBackendPort() : Promise.resolve(5175);
      portPromise.then((port) => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}/api/cv/stream`);
        wsRef.current = ws;
        ws.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);
            // Adaptador mínimo de payload backend -> ErgonomicAnalysis
            const analysis: ErgonomicAnalysis = {
              timestamp: Date.now(),
              landmarks: data?.landmarks ?? null,
              scores: {
                neck: Number(data?.scores?.neck ?? 8),
                back: Number(data?.scores?.back ?? 7),
                arms: Number(data?.scores?.arms ?? 9),
                overall: Number(data?.scores?.overall ?? 7.5)
              },
              statuses: {
                neck: data?.statuses?.neck ?? 'good',
                back: data?.statuses?.back ?? 'good',
                arms: data?.statuses?.arms ?? 'good',
                overall: data?.statuses?.overall ?? 'good'
              }
            };
            updateAnalysis(analysis);
            // Generar alertas básicas
            const mk = (k: 'neck' | 'back' | 'arms') => {
              const status = analysis.statuses[k];
              if (status === 'good') return;
              const key = `erg-alert-${k}`;
              const last = Number(localStorage.getItem(key) || 0);
              if (Date.now() - last < 30_000) return; // 30s debounce
              localStorage.setItem(key, String(Date.now()));
              pushAlert({
                id: `${key}-${Date.now()}`,
                kind: 'posture',
                title: k === 'neck' ? 'Cuello adelantado' : k === 'back' ? 'Espalda encorvada' : 'Brazos en tensión',
                message: 'Se detectó postura subóptima. Ajusta tu posición para evitar fatiga.',
                severity: status,
                recommendation: k === 'neck' ? 'Eleva el monitor a la altura de los ojos.' : k === 'back' ? 'Apoya zona lumbar y reclina 95°–110°.' : 'Relaja hombros y acerca el ratón.',
                createdAt: Date.now()
              });
            };
            mk('neck'); mk('back'); mk('arms');
          } catch { /* ignore */ }
        };
        ws.onclose = () => {
          if (isMonitoring) scheduleReconnect();
        };
        ws.onerror = () => {
          ws.close();
        };
      });
    } catch {
      scheduleReconnect();
    }
  }, [isMonitoring, updateAnalysis]);

  const scheduleReconnect = useCallback(() => {
    if (retryTimer.current) window.clearTimeout(retryTimer.current);
    retryTimer.current = window.setTimeout(() => connect(), 1500);
  }, [connect]);

  useEffect(() => {
    if (!isMonitoring) return;
    connect();
    return () => wsRef.current?.close();
  }, [isMonitoring, connect]);
}


