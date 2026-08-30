import { mockAnomalies, type Anomaly } from './mockData';
import { apiClient } from './client';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getAnomalies(missionId: string): Promise<Anomaly[]> {
  try {
    const data = await apiClient.get<Anomaly[]>(`/missions/${missionId}/anomalies`);
    if (Array.isArray(data)) {
      return data;
    }
  } catch (e) {
    console.warn('Failed to fetch real anomalies from backend, using fallback:', e);
  }
  await delay(300);
  return mockAnomalies[missionId] ?? [];
}

export async function verifyAnomaly(anomalyId: string): Promise<Anomaly> {
  try {
    const data = await apiClient.post<Anomaly>(`/anomalies/${anomalyId}/verify`);
    if (data) {
      return data;
    }
  } catch (e) {
    console.warn('Failed to verify anomaly via backend, using fallback:', e);
    throw e;
  }
  await delay(200);
  for (const key of Object.keys(mockAnomalies)) {
    const list = mockAnomalies[key];
    const idx = list.findIndex((a) => a.id === anomalyId);
    if (idx >= 0) {
      list[idx] = { ...list[idx], status: 'verified' };
      return list[idx];
    }
  }
  throw new Error('Anomaly not found');
}

export async function rejectAnomaly(anomalyId: string): Promise<Anomaly> {
  try {
    const data = await apiClient.post<Anomaly>(`/anomalies/${anomalyId}/reject`);
    if (data) {
      return data;
    }
  } catch (e) {
    console.warn('Failed to reject anomaly via backend, using fallback:', e);
    throw e;
  }
  await delay(200);
  for (const key of Object.keys(mockAnomalies)) {
    const list = mockAnomalies[key];
    const idx = list.findIndex((a) => a.id === anomalyId);
    if (idx >= 0) {
      list[idx] = { ...list[idx], status: 'rejected' };
      return list[idx];
    }
  }
  throw new Error('Anomaly not found');
}
