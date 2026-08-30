import { isDatabaseConnected } from '../config/database';
import { config } from '../config/env';
import { HealthResponse } from '../types';

export function getHealthStatus(): HealthResponse {
  const connected = isDatabaseConnected();
  return {
    status: 'ok',
    database: connected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    service: config.serviceName,
  };
}
