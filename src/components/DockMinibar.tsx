import { useMemo } from 'react';
import { useErgonomicStore } from '@/store/ergonomicStore';

/**
 * Barra compacta para estado rápido (modo minimizado).
 */
export function DockMinibar() {
  const isMinimized = useErgonomicStore(s => s.isMinimized);
  const toggle = useErgonomicStore(s => s.toggleMinimized);
  const analysis = useErgonomicStore(s => s.currentAnalysis);

  const summary = useMemo(() => {
    const s = analysis?.scores;
    if (!s) return '—';
    return `${s.neck.toFixed(0)}/${s.back.toFixed(0)}/${s.arms.toFixed(0)} | ${s.overall.toFixed(1)}`;
  }, [analysis]);

  if (!isMinimized) return null;
  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 rounded-full bg-[var(--bg-secondary)] border border-black/5 shadow px-3 py-1.5 text-sm">
      <button className="mr-2 opacity-70" aria-label="Restaurar" onClick={toggle}>▣</button>
      <span className="font-mono">{summary}</span>
    </div>
  );
}


