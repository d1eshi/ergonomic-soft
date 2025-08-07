import { create } from 'zustand';
import type { ErgonomicAlert, ErgonomicAnalysis, UserSettings, CameraStatus } from '@/types';

export interface ErgonomicStore {
  isMonitoring: boolean;
  isMinimized: boolean;
  currentAnalysis: ErgonomicAnalysis | null;
  cameraStatus: CameraStatus;
  alerts: ErgonomicAlert[];
  settings: UserSettings;

  startMonitoring: () => void;
  stopMonitoring: () => void;
  toggleMinimized: () => void;
  updateAnalysis: (analysis: ErgonomicAnalysis) => void;
  pushAlert: (alert: ErgonomicAlert) => void;
  dismissAlert: (id: string) => void;
  snoozeAlert: (id: string, duration: number) => void;
  setCameraStatus: (status: CameraStatus) => void;
  updateSettings: (partial: Partial<UserSettings>) => void;
}

const defaultSettings: UserSettings = {
  theme: 'system',
  showSkeleton: true,
  highContrast: false,
  alertSensitivity: 'medium',
  autoStartMonitoring: false,
  notifications: {
    enabled: true,
    workingHours: { start: '07:00', end: '22:00' },
    dndDuringMeetings: false,
    alertSensitivity: 'medium',
    preferredDelivery: 'both',
    breakReminderInterval: 50,
    snoozeOptions: [5, 10, 15],
    customMessages: {}
  }
};

export const useErgonomicStore = create<ErgonomicStore>((set, get) => ({
  isMonitoring: false,
  isMinimized: false,
  currentAnalysis: null,
  cameraStatus: 'idle',
  alerts: [],
  settings: defaultSettings,

  startMonitoring: () => set({ isMonitoring: true }),
  stopMonitoring: () => set({ isMonitoring: false }),
  toggleMinimized: () => set({ isMinimized: !get().isMinimized }),
  updateAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  pushAlert: (alert) => set({ alerts: [alert, ...get().alerts].slice(0, 50) }),
  dismissAlert: (id) => set({ alerts: get().alerts.filter(a => a.id !== id) }),
  snoozeAlert: (id, duration) => {
    // simple snooze: remove and remember timestamp
    const key = `alert-snooze-${id}`;
    localStorage.setItem(key, String(Date.now() + duration * 60 * 1000));
    set({ alerts: get().alerts.filter(a => a.id !== id) });
  },
  setCameraStatus: (status) => set({ cameraStatus: status }),
  updateSettings: (partial) => set({ settings: { ...get().settings, ...partial } })
}));


