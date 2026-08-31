import { BASE_URL } from '@/constants/config';
import { apiClient } from './client';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type SupportedReportFormat = 'csv' | 'json';

export async function generateReport(
  missionId: string,
  format: SupportedReportFormat
): Promise<{ url: string }> {
  try {
    const data = await apiClient.post<{ url: string }>(`/missions/${missionId}/reports`, {
      format,
    });
    if (data?.url) {
      if (!data.url.startsWith('http')) {
        data.url = `${BASE_URL.replace(/\/$/, '')}${data.url.startsWith('/') ? '' : '/'}${data.url}`;
      }
      return data;
    }
  } catch (e) {
    console.warn('Failed to generate report via backend, using fallback:', e);
    throw e;
  }
  await delay(500);
  return { url: '#' };
}

export async function downloadReport(missionId: string): Promise<{ url: string }> {
  try {
    const data = await apiClient.get<{ url: string }>(`/missions/${missionId}/reports/download`);
    if (data?.url) {
      if (!data.url.startsWith('http')) {
        data.url = `${BASE_URL.replace(/\/$/, '')}${data.url.startsWith('/') ? '' : '/'}${data.url}`;
      }
      return data;
    }
  } catch (e) {
    console.warn('Failed to download report from backend, using fallback:', e);
    throw e;
  }
  await delay(300);
  return { url: '#' };
}
