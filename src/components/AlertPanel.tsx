import { memo } from 'react';
import type { ErgonomicAlert } from '@/types';

export interface AlertPanelProps {
  alerts: ErgonomicAlert[];
  onDismiss: (alertId: string) => void;
  onSnooze: (alertId: string, duration: number) => void;
}

/**
 * Lista de alertas con acciones de posponer y descartar.
 * @example
 * <AlertPanel alerts={alerts} onDismiss={dismiss} onSnooze={snooze} />
 */
function AlertPanelBase({ alerts, onDismiss, onSnooze }: AlertPanelProps) {
  return (
    <section aria-label="Alertas actuales" className="rounded-lg border border-black/5 bg-[var(--bg-secondary)] p-4">
      <div className="font-semibold mb-2">Alertas</div>
      <ul className="space-y-2">
        {alerts.length === 0 && <li className="text-sm opacity-70">Sin alertas activas</li>}
        {alerts.map(a => (
          <li key={a.id} className="flex items-start justify-between gap-2 rounded-md bg-white/40 dark:bg-white/5 p-3">
            <div>
              <div className="text-sm font-medium">{a.title}</div>
              <div className="text-xs opacity-80">{a.message}</div>
              {a.recommendation && (<div className="text-xs mt-1 text-emerald-600">💡 {a.recommendation}</div>)}
            </div>
            <div className="flex gap-2">
              <button className="text-xs px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30" onClick={() => onSnooze(a.id, 10)}>Posponer 10m</button>
              <button className="text-xs px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30" onClick={() => onDismiss(a.id)}>Descartar</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export const AlertPanel = memo(AlertPanelBase);


