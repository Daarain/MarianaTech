import { apiFetch } from './client';
import { BASE_URL } from '@/constants/config';
import type { Anomaly } from '@/types/api';

export async function generateReport(missionId: string): Promise<{ url: string; status: string }> {
  return await apiFetch<{ url: string; status: string }>(`/missions/${missionId}/reports`, {
    method: 'POST',
  });
}

export async function downloadReportJSON(missionId: string): Promise<{ mission_id: string; anomalies: Anomaly[] }> {
  return await apiFetch<{ mission_id: string; anomalies: Anomaly[] }>(
    `/missions/${missionId}/reports/download?format=json`
  );
}

export async function downloadReportCSV(missionId: string, filename?: string): Promise<void> {
  const blob = await apiFetch<Blob>(`/missions/${missionId}/reports/download?format=csv`);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${missionId}_report.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
