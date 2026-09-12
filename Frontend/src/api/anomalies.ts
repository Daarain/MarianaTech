import { apiFetch } from './client';
import type { Anomaly } from '@/types/api';

export async function getAnomalies(missionId: string): Promise<Anomaly[]> {
  return await apiFetch<Anomaly[]>(`/missions/${missionId}/anomalies`);
}

export async function verifyAnomaly(anomalyId: string): Promise<Anomaly> {
  return await apiFetch<Anomaly>(`/anomalies/${anomalyId}/verify`, {
    method: 'POST',
  });
}

export async function rejectAnomaly(anomalyId: string): Promise<Anomaly> {
  return await apiFetch<Anomaly>(`/anomalies/${anomalyId}/reject`, {
    method: 'POST',
  });
}
