import { useEffect, useMemo, useState } from 'react';
import { useErgonomicStore } from '@/store/ergonomicStore';

/**
 * Panel de ajustes rápidos (tema, esqueleto, contraste, sensibilidad).
 * @example
 * <SettingsPanel />
 */
export function SettingsPanel() {
  const settings = useErgonomicStore(s => s.settings);
  const updateSettings = useErgonomicStore(s => s.updateSettings);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);

  // tema
  useEffect(() => {
    const root = document.documentElement;
    const apply = (mode: 'light' | 'dark') => root.classList.toggle('dark', mode === 'dark');
    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mq.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => apply(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
    apply(settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('hc', settings.highContrast);
  }, [settings.highContrast]);

  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices?.enumerateDevices?.().then(devs => {
      if (!mounted) return;
      setCameras(devs.filter(d => d.kind === 'videoinput'));
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const themeOptions = useMemo(() => ([
    { value: 'system', label: 'Sistema' },
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Oscuro' }
  ] as const), []);

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-sm">Cámara</label>
        <select
          className="rounded border border-black/10 bg-transparent p-2"
          value={settings.cameraDeviceId || ''}
          onChange={e => updateSettings({ cameraDeviceId: e.target.value || undefined })}
        >
          <option value="">Automática</option>
          {cameras.map(c => (
            <option key={c.deviceId} value={c.deviceId}>{c.label || `Cámara ${c.deviceId.slice(0,6)}`}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-sm">Tema</label>
        <select
          className="rounded border border-black/10 bg-transparent p-2"
          value={settings.theme}
          onChange={e => updateSettings({ theme: e.target.value as any })}
        >
          {themeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={settings.showSkeleton} onChange={e => updateSettings({ showSkeleton: e.target.checked })} />
        Mostrar esqueleto
      </label>

      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={settings.highContrast} onChange={e => updateSettings({ highContrast: e.target.checked })} />
        Alto contraste
      </label>

      <div className="grid gap-2">
        <label className="text-sm">Sensibilidad de alertas</label>
        <select
          className="rounded border border-black/10 bg-transparent p-2"
          value={settings.alertSensitivity}
          onChange={e => updateSettings({ alertSensitivity: e.target.value as any })}
        >
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
        </select>
      </div>
    </div>
  );
}


