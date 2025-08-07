import { useEffect, useMemo, useRef } from 'react';
import { useErgonomicStore } from '@/store/ergonomicStore';
import { PoseVisualizer } from '@/components/PoseVisualizer';
import { ScoreCard } from '@/components/ScoreCard';
import { AlertPanel } from '@/components/AlertPanel';
import { SettingsPanel } from '@/components/SettingsPanel';
import { useErgonomicData } from '@/hooks/useErgonomicData';

export function Dashboard() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMonitoring = useErgonomicStore(s => s.isMonitoring);
  const start = useErgonomicStore(s => s.startMonitoring);
  const stop = useErgonomicStore(s => s.stopMonitoring);
  const analysis = useErgonomicStore(s => s.currentAnalysis);
  const alerts = useErgonomicStore(s => s.alerts);
  const dismissAlert = useErgonomicStore(s => s.dismissAlert);
  const snoozeAlert = useErgonomicStore(s => s.snoozeAlert);
  const settings = useErgonomicStore(s => s.settings);

  useErgonomicData();

  useEffect(() => {
    if (!videoRef.current) return;
    const constraints: MediaStreamConstraints = { video: { deviceId: settings.cameraDeviceId ? { exact: settings.cameraDeviceId } : undefined } };
    if (!isMonitoring) return;
    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      })
      .catch(() => {});
    return () => {
      const ms = videoRef.current?.srcObject as MediaStream | null;
      ms?.getTracks().forEach(t => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [isMonitoring, settings.cameraDeviceId]);

  const cards = useMemo(() => {
    const s = analysis?.scores;
    const st = analysis?.statuses;
    return [
      { category: 'neck', score: s?.neck ?? 0, status: st?.neck ?? 'good' },
      { category: 'back', score: s?.back ?? 0, status: st?.back ?? 'good' },
      { category: 'arms', score: s?.arms ?? 0, status: st?.arms ?? 'good' },
      { category: 'overall', score: s?.overall ?? 0, status: st?.overall ?? 'good' }
    ] as const;
  }, [analysis]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[2fr_3fr] gap-4">
      <section className="rounded-lg border border-black/5 bg-[var(--bg-secondary)] p-3 flex flex-col gap-3">
        <header className="flex items-center justify-between">
          <div className="font-semibold">Cámara en vivo</div>
          <div className="flex gap-2">
            {!isMonitoring ? (
              <button
                className="px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                onClick={() => { start(); window.api?.startMonitoring?.(); }}
              >
                Iniciar
              </button>
            ) : (
              <button
                className="px-3 py-1.5 rounded bg-rose-600 text-white hover:bg-rose-500"
                onClick={() => { stop(); window.api?.stopMonitoring?.(); }}
              >
                Detener
              </button>
            )}
          </div>
        </header>
        <div className="aspect-video">
          <PoseVisualizer videoRef={videoRef} landmarks={analysis?.landmarks ?? null} analysisOverlay={settings.showSkeleton} />
        </div>
      </section>

      <section className="rounded-lg border border-black/5 bg-[var(--bg-secondary)] p-3 grid grid-rows-[auto_auto_1fr] gap-3">
        <header className="flex items-center justify-between">
          <div className="font-semibold">Indicadores ergonómicos</div>
        </header>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map(c => (
            <ScoreCard key={c.category} category={c.category} score={c.score} status={c.status} />
          ))}
        </div>
        <AlertPanel alerts={alerts} onDismiss={dismissAlert} onSnooze={snoozeAlert} />
      </section>

      <section className="xl:col-span-2 rounded-lg border border-black/5 bg-[var(--bg-secondary)] p-4">
        <div className="font-semibold mb-3">Ajustes rápidos</div>
        <SettingsPanel />
      </section>
    </div>
  );
}


