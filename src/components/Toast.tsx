import type { ToastNotification } from '#shared/types';

interface ToastProps {
  notification: ToastNotification;
  onDismiss: (id: string) => void;
  onAction?: (id: string, action: string) => void;
  position?: 'top-right' | 'bottom-right' | 'center';
}

const colorByType = {
  success: 'bg-emerald-600',
  warning: 'bg-amber-600',
  error: 'bg-rose-600',
  info: 'bg-sky-600'
} as const;

export function Toast({ notification, onDismiss, onAction, position = 'top-right' }: ToastProps) {
  const pos = position === 'top-right' ? 'top-4 right-4' : position === 'bottom-right' ? 'bottom-4 right-4' : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
  return (
    <div className={`fixed ${pos} z-50 min-w-[260px] max-w-sm shadow-lg rounded text-white ${colorByType[notification.type]} animate-in fade-in slide-in-from-top-2` }>
      <div className="p-4">
        <div className="font-semibold">{notification.title}</div>
        <div className="text-sm opacity-90">{notification.message}</div>
        <div className="mt-2 flex gap-2 justify-end">
          {notification.actions?.map(a => (
            <button key={a.id} className="px-2 py-1 bg-black/20 rounded hover:bg-black/30 text-xs" onClick={() => onAction?.(notification.id, a.id)}>
              {a.label}
            </button>
          ))}
          <button className="px-2 py-1 bg-black/20 rounded hover:bg-black/30 text-xs" onClick={() => onDismiss(notification.id)}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}


