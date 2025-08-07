export type Severity = 'info' | 'warning' | 'critical';

export interface NotificationPayload {
  title: string;
  body: string;
  severity: Severity;
}

export interface HealthResponse {
  status: 'ok';
  service: 'fastapi';
  version: string;
}

// -------------------- Alerting & Notifications (compartido) --------------------

export type PostureAlertType = 'neck_forward' | 'hunched_back' | 'raised_shoulders' | 'poor_arm_position';
export type BreakType = 'micro_break' | 'stretch_break' | 'movement_break';
export type WorkspaceAlertType = 'monitor_height' | 'chair_adjustment' | 'lighting' | 'distance';

export interface PostureAlert {
  type: PostureAlertType;
  severity: Severity;
  duration: number; // segundos en mala postura
  message: string;
  recommendation: string;
  dismissible: boolean;
}

export interface BreakReminder {
  type: BreakType;
  timeWorked: number; // minutos
  suggestedDuration: number; // minutos
  exercises?: { name: string; duration: number }[];
  snoozeOptions: number[];
}

export interface WorkspaceAlert {
  type: WorkspaceAlertType;
  priority: 'low' | 'medium' | 'high';
  detectedIssue: string;
  solution: string;
  estimatedImpact: 'minor' | 'moderate' | 'significant';
}

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  duration: number;
  actions?: { id: string; label: string }[];
  persistent?: boolean;
}

export interface SystemNotification {
  title: string;
  body: string;
  icon?: string;
  urgent?: boolean;
  silent?: boolean;
}

export type VisualCueType = 'border_glow' | 'color_change' | 'pulse_animation';
export type VisualCueTarget = 'score_card' | 'pose_viewer' | 'entire_app';

export interface VisualCue {
  type: VisualCueType;
  intensity: 1 | 2 | 3;
  target: VisualCueTarget;
  color: string;
}

export interface NotificationSettings {
  enabled: boolean;
  workingHours: { start: string; end: string };
  dndDuringMeetings: boolean;
  alertSensitivity: 'low' | 'medium' | 'high';
  preferredDelivery: 'visual' | 'audio' | 'both';
  breakReminderInterval: number; // minutos
  snoozeOptions: number[];
  customMessages: Record<string, string>;
}

// -------------------- Ergonomic Dashboard Types --------------------

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'error' | 'denied';

export interface UserSettings {
  cameraDeviceId?: string;
  theme: 'light' | 'dark' | 'system';
  showSkeleton: boolean;
  highContrast: boolean;
  alertSensitivity: 'low' | 'medium' | 'high';
  autoStartMonitoring: boolean;
  notifications: NotificationSettings;
}

export interface PoseLandmarks {
  // Simplificado: pares [x, y] normalizados 0..1
  points: Array<{ x: number; y: number; z?: number; visibility?: number }>;
}

export interface ErgonomicScores {
  neck: number; // 1-10
  back: number; // 1-10
  arms: number; // 1-10
  overall: number; // 1-10
}

export interface ErgonomicAlert {
  id: string;
  kind: 'posture' | 'workspace' | 'break';
  title: string;
  message: string;
  severity: 'good' | 'warning' | 'critical';
  recommendation?: string;
  createdAt: number;
}

export interface ErgonomicAnalysis {
  timestamp: number;
  landmarks: PoseLandmarks | null;
  scores: ErgonomicScores;
  statuses: {
    neck: 'good' | 'warning' | 'critical';
    back: 'good' | 'warning' | 'critical';
    arms: 'good' | 'warning' | 'critical';
    overall: 'good' | 'warning' | 'critical';
  }
}

// -------------------- Métricas de rendimiento --------------------
export interface PerformanceMetrics {
  frameProcessingTime: number; // ms por frame desde backend (inference_ms)
  uiRenderTime: number; // tiempo de render React estimado
  memoryUsage: number; // MB
  cpuUsage: number; // porcentaje
  batteryImpact: 'low' | 'medium' | 'high';
}

// -------------------- Privacidad y cumplimiento --------------------
export interface PrivacyCompliance {
  dataRetention: {
    maxHistoryDays: number; // eliminación automática de datos antiguos
    aggregatedDataOnly: boolean; // sin almacenamiento de video/imagen cruda
    localStorageOnly: boolean; // nunca enviar datos externamente
  };
  userConsent: {
    cameraAccess: boolean;
    dataCollection: boolean;
    analytics: boolean;
  };
}



