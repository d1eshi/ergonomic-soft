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



