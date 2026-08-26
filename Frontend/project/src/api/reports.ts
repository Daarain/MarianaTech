import { BASE_URL } from '@/constants/config';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function generateReport(missionId: string): Promise<{ url: string }> {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/missions/${missionId}/reports`, { method: 'POST' });
    return res.json();
  }
  await delay(500);
  return { url: '#' };
}

export async function downloadReport(missionId: string): Promise<{ url: string }> {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/missions/${missionId}/reports/download`);
    return res.json();
  }
  await delay(300);
  return { url: '#' };
}
