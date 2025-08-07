import { memo, useMemo } from 'react';

export interface ScoreCardProps {
  category: 'neck' | 'back' | 'arms' | 'overall';
  score: number; // 1-10
  status: 'good' | 'warning' | 'critical';
  trend?: 'improving' | 'stable' | 'declining';
}

/**
 * Muestra un puntaje y estado por categoría ergonómica.
 * @example
 * <ScoreCard category="neck" score={8.2} status="warning" />
 */
function ScoreCardBase({ category, score, status, trend = 'stable' }: ScoreCardProps) {
  const color = useMemo(() => {
    if (status === 'good') return 'text-emerald-600';
    if (status === 'warning') return 'text-amber-600';
    return 'text-rose-600';
  }, [status]);

  const chip = useMemo(() => {
    if (trend === 'improving') return '▲ Mejorando';
    if (trend === 'declining') return '▼ Empeorando';
    return '▪ Estable';
  }, [trend]);

  const label = { neck: 'Cuello', back: 'Espalda', arms: 'Brazos', overall: 'Global' }[category];

  return (
    <div
      role="status"
      aria-label={`Tarjeta ${label} puntaje ${score} estado ${status}`}
      className="rounded-lg border border-black/5 bg-[var(--bg-secondary)] p-4 shadow-sm transition-colors"
    >
      <div className="text-sm opacity-70">{label}</div>
      <div className={`text-2xl font-semibold ${color}`}>{score.toFixed(1)}/10</div>
      <div className="text-xs mt-1 opacity-70">{chip}</div>
    </div>
  );
}

export const ScoreCard = memo(ScoreCardBase);


