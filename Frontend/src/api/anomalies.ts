import { mockAnomalies, type Anomaly } from './mockData';
import { BASE_URL } from '@/constants/config';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getAnomalies(missionId: string): Promise<Anomaly[]> {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/missions/${missionId}/anomalies`);
    return res.json();
  }
  await delay(300);
  return mockAnomalies[missionId] ?? [];
}

export async function verifyAnomaly(anomalyId: string): Promise<Anomaly> {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/anomalies/${anomalyId}/verify`, { method: 'POST' });
    return res.json();
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
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/anomalies/${anomalyId}/reject`, { method: 'POST' });
    return res.json();
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
