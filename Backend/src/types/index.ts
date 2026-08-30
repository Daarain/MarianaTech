export interface HealthResponse {
  status: string;
  database: 'connected' | 'disconnected';
  timestamp: string;
  service: string;
}

export interface AppError extends Error {
  statusCode?: number;
}
