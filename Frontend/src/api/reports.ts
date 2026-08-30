import { BASE_URL } from '@/constants/config';
<<<<<<< HEAD
import { apiClient } from './client';
=======
>>>>>>> 7c3109914c58eb0fd2cd188542afc46b97452ec0

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function generateReport(missionId: string): Promise<{ url: string }> {
<<<<<<< HEAD
  try {
    const data = await apiClient.post<{ url: string }>(`/missions/${missionId}/reports`, {
      format: 'csv',
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
=======
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/missions/${missionId}/reports`, { method: 'POST' });
    return res.json();
>>>>>>> 7c3109914c58eb0fd2cd188542afc46b97452ec0
  }
  await delay(500);
  return { url: '#' };
}

export async function downloadReport(missionId: string): Promise<{ url: string }> {
<<<<<<< HEAD
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
=======
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/missions/${missionId}/reports/download`);
    return res.json();
>>>>>>> 7c3109914c58eb0fd2cd188542afc46b97452ec0
  }
  await delay(300);
  return { url: '#' };
}
