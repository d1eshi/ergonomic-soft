import { useErgonomicStore } from '@/store/ergonomicStore';

export function HeaderBar() {
  const isMinimized = useErgonomicStore(s => s.isMinimized);
  const toggle = useErgonomicStore(s => s.toggleMinimized);

  return (
    <div className="flex items-center justify-between p-3 border-b border-black/10 bg-[var(--bg-secondary)]">
      <div className="font-semibold">Ergonomic Monitor</div>
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-xs opacity-70">Estado: {isMinimized ? 'Minimizado' : 'Activo'}</span>
        <button className="px-2 py-1 rounded bg-black/5 hover:bg-black/10 text-sm" onClick={toggle}>
          {isMinimized ? 'Restaurar' : 'Minimizar'}
        </button>
      </div>
    </div>
  );
}


