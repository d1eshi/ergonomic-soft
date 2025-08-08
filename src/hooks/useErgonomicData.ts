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

            // 1) Landmarks: backend envía lista de puntos {x,y,z,visibility}
            //    El frontend espera { points: [...] }
            const lm = Array.isArray(data?.landmarks)
              ? { points: data.landmarks.map((p: any) => ({ x: Number(p.x), y: Number(p.y), z: p.z, visibility: p.visibility })) }
              : (data?.landmarks && data.landmarks.points ? data.landmarks : null);

            // 2) Estados por métrica desde backend (severity_by_metric)
            const sev = data?.severity_by_metric || {};
            const toStatus = (s: string | undefined): 'good' | 'warning' | 'critical' => {
              if (!s) return 'good';
              if (s === 'critical') return 'critical';
              if (s === 'warning') return 'warning';
              return 'good'; // optimal / acceptable -> good
            };

            // 3) Scores 1-10 aproximados a partir de severidad (sin usar ángulos aún)
            const sevScore = (s: string | undefined): number => {
              if (!s) return 8.5;
              if (s === 'critical') return 3.0;
              if (s === 'warning') return 6.0;
              if (s === 'acceptable') return 8.0;
              return 9.5; // optimal
            };

            const neckScore = sevScore(sev.neck_angle);
            const backScore = sevScore(sev.back_angle);
            const armsScore = sevScore(sev.elbow_angle);
            const overallScore = Math.round(((neckScore + backScore + armsScore) / 3) * 10) / 10;

            const analysis: ErgonomicAnalysis = {
              timestamp: Date.now(),
              landmarks: lm,
              scores: {
                neck: neckScore,
                back: backScore,
                arms: armsScore,
                overall: overallScore
              },
              statuses: {
                neck: toStatus(sev.neck_angle),
                back: toStatus(sev.back_angle),
                arms: toStatus(sev.elbow_angle),
                overall: toStatus(data?.overall_severity)
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


