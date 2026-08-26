import { mockMissions, mockDashboardStats, type Mission, type DashboardStats } from './mockData';
import { BASE_URL } from '@/constants/config';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getMissions(): Promise<Mission[]> {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/missions`);
    return res.json();
  }
  await delay(300);
  return mockMissions;
}

export async function getMissionById(id: string): Promise<Mission | null> {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/missions/${id}`);
    return res.json();
  }
  await delay(200);
  return mockMissions.find((m) => m.id === id) ?? null;
}

export interface CreateMissionPayload {
  missionName: string;
  date: string;
  vessel: string;
  location: string;
  depthMin: number;
  depthMax: number;
  sonarType: string;
  notes: string;
  operatorName: string;
  files: { name: string; size: number }[];
}

export async function createMission(data: CreateMissionPayload): Promise<{ id: string }> {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/missions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }
  await delay(1500);
  return { id: 'fake-id-001' };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/missions/stats`);
    return res.json();
  }
  await delay(250);
  return mockDashboardStats;
}
