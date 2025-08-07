import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  BreakReminder,
  NotificationSettings,
  PostureAlert,
  SystemNotification,
  ToastNotification,
  VisualCue
} from '#shared/types';

type DeliveryMethod = 'visual' | 'system' | 'toast';

interface NotificationContext {
  isInMeeting: boolean;
  isTypingIntensively: boolean;
  systemIdleTime: number;
  currentHour: number;
  userFocusLevel: 'high' | 'medium' | 'low';
}

function nowSec() { return Math.floor(Date.now() / 1000); }

export function useNotifications(settings: NotificationSettings) {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [visualCue, setVisualCue] = useState<VisualCue | null>(null);
  const lastShownAtRef = useRef<Record<string, number>>({});
  const rateLimitPerHour = 20; // simple rate limit

  const context: NotificationContext = useMemo(() => ({
    isInMeeting: false,
    isTypingIntensively: false,
    systemIdleTime: 0,
    currentHour: new Date().getHours(),
    userFocusLevel: 'medium'
  }), []);

  const withinWorkingHours = useCallback(() => {
    const [sh, sm] = settings.workingHours.start.split(':').map(Number);
    const [eh, em] = settings.workingHours.end.split(':').map(Number);
    const ms = d => d.getHours() * 60 + d.getMinutes();
    const nowM = ms(new Date());
    return nowM >= sh * 60 + sm && nowM <= eh * 60 + em;
  }, [settings.workingHours]);

  const underRateLimit = useCallback((key: string) => {
    const hourKey = `${key}-${new Date().getHours()}`;
    const counts = JSON.parse(localStorage.getItem('notif_counts') || '{}');
    counts[hourKey] = (counts[hourKey] || 0) + 1;
    localStorage.setItem('notif_counts', JSON.stringify(counts));
    return counts[hourKey] <= rateLimitPerHour;
  }, []);

  const showSystem = useCallback((n: SystemNotification) => {
    window.api?.notify({ title: n.title, body: n.body, severity: n.urgent ? 'critical' : 'info' });
  }, []);

  const showToast = useCallback((toast: ToastNotification) => {
    setToasts((prev) => [...prev.filter(t => t.id !== toast.id), toast]);
    if (!toast.persistent) {
      setTimeout(() => setToasts((prev) => prev.filter(t => t.id !== toast.id)), toast.duration);
    }
  }, []);

  const showVisual = useCallback((cue: VisualCue) => {
    setVisualCue(cue);
    setTimeout(() => setVisualCue(null), cue.intensity * 2000);
  }, []);

  const shouldShow = useCallback((key: string) => {
    if (!settings.enabled || !withinWorkingHours()) return false;
    if (settings.dndDuringMeetings && context.isInMeeting) return false;
    const last = lastShownAtRef.current[key] || 0;
    const tooSoon = nowSec() - last < 15; // debounced window
    return !tooSoon && underRateLimit(key);
  }, [context.isInMeeting, settings.dndDuringMeetings, settings.enabled, withinWorkingHours, underRateLimit]);

  const processPostureAlert = useCallback((alert: PostureAlert) => {
    const key = `posture-${alert.type}`;
    if (!shouldShow(key)) return;

    // progresión simple según duración
    if (alert.duration >= 300 && alert.severity === 'critical') {
      showSystem({ title: 'Postura crítica', body: alert.message, urgent: true });
    } else if (alert.duration >= 120) {
      showToast({ id: key, title: 'Atención a la postura', message: alert.message, type: 'warning', duration: 6000 });
    } else if (alert.duration >= 60) {
      showToast({ id: key, title: 'Consejo rápido', message: alert.recommendation, type: 'info', duration: 4000 });
    } else if (alert.duration >= 30) {
      showVisual({ type: 'border_glow', intensity: 1, target: 'entire_app', color: '#f59e0b' });
    }
    lastShownAtRef.current[key] = nowSec();
  }, [shouldShow, showSystem, showToast, showVisual]);

  const processBreakReminder = useCallback((rem: BreakReminder) => {
    const key = `break-${rem.type}`;
    if (!shouldShow(key)) return;
    const msg = `Trabajaste ${rem.timeWorked} min. Toma ${rem.suggestedDuration} min de pausa.`;
    if (settings.preferredDelivery !== 'visual') {
      showSystem({ title: 'Recordatorio de pausa', body: msg, urgent: false });
    }
    showToast({ id: key, title: 'Pausa sugerida', message: msg, type: 'info', duration: 8000, persistent: true });
    lastShownAtRef.current[key] = nowSec();
  }, [settings.preferredDelivery, shouldShow, showSystem, showToast]);

  const dismissToast = useCallback((id: string) => setToasts((prev) => prev.filter(t => t.id !== id)), []);

  return {
    toasts,
    visualCue,
    processPostureAlert,
    processBreakReminder,
    dismissToast
  };
}


