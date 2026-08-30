import { mockMissions, mockDashboardStats, type Mission, type DashboardStats } from './mockData';
<<<<<<< HEAD
import { apiClient } from './client';
=======
import { BASE_URL } from '@/constants/config';
>>>>>>> 7c3109914c58eb0fd2cd188542afc46b97452ec0

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getMissions(): Promise<Mission[]> {
<<<<<<< HEAD
  try {
    const data = await apiClient.get<Mission[]>('/missions');
    if (Array.isArray(data)) {
      return data;
    }
  } catch (e) {
    console.warn('Failed to fetch real missions from backend, using fallback:', e);
=======
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/missions`);
    return res.json();
>>>>>>> 7c3109914c58eb0fd2cd188542afc46b97452ec0
  }
  await delay(300);
  return mockMissions;
}

export async function getMissionById(id: string): Promise<Mission | null> {
<<<<<<< HEAD
  try {
    const data = await apiClient.get<Mission>(`/missions/${id}`);
    if (data) {
      return data;
    }
  } catch (e) {
    console.warn('Failed to fetch real mission by ID from backend, using fallback:', e);
=======
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/missions/${id}`);
    return res.json();
>>>>>>> 7c3109914c58eb0fd2cd188542afc46b97452ec0
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
<<<<<<< HEAD
  try {
    const res = await apiClient.post<{ id: string }>('/missions', data);
    if (res && res.id) {
      return res;
    }
  } catch (e) {
    console.warn('Failed to create mission via backend, using fallback:', e);
    throw e;
=======
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/missions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
>>>>>>> 7c3109914c58eb0fd2cd188542afc46b97452ec0
  }
  await delay(1500);
  return { id: 'fake-id-001' };
}

export async function getDashboardStats(): Promise<DashboardStats> {
<<<<<<< HEAD
  try {
    const data = await apiClient.get<DashboardStats>('/missions/stats');
    if (data) {
      return data;
    }
  } catch (e) {
    console.warn('Failed to fetch dashboard stats from backend, using fallback:', e);
=======
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}/missions/stats`);
    return res.json();
>>>>>>> 7c3109914c58eb0fd2cd188542afc46b97452ec0
  }
  await delay(250);
  return mockDashboardStats;
}
<<<<<<< HEAD

export async function triggerProcessing(missionId: string): Promise<{ jobId: string }> {
  return apiClient.post<{ jobId: string }>(`/missions/${missionId}/process`);
}

export async function getJobStatus(jobId: string): Promise<{
  jobId: string;
  status: string;
  progress: number;
  currentStage: string;
}> {
  return apiClient.get(`/jobs/${jobId}`);
}
=======
>>>>>>> 7c3109914c58eb0fd2cd188542afc46b97452ec0
