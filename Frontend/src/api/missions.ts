import { mockMissions, mockDashboardStats, type Mission, type DashboardStats } from './mockData';
import { apiClient } from './client';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getMissions(): Promise<Mission[]> {
  try {
    const data = await apiClient.get<Mission[]>('/missions');
    if (Array.isArray(data)) {
      return data;
    }
  } catch (e) {
    console.warn('Failed to fetch real missions from backend, using fallback:', e);
  }
  await delay(300);
  return mockMissions;
}

export async function getMissionById(id: string): Promise<Mission | null> {
  try {
    const data = await apiClient.get<Mission>(`/missions/${id}`);
    if (data) {
      return data;
    }
  } catch (e) {
    console.warn('Failed to fetch real mission by ID from backend, using fallback:', e);
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
  try {
    const res = await apiClient.post<{ id: string }>('/missions', data);
    if (res && res.id) {
      return res;
    }
  } catch (e) {
    console.warn('Failed to create mission via backend, using fallback:', e);
    throw e;
  }
  await delay(1500);
  return { id: 'fake-id-001' };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const data = await apiClient.get<DashboardStats>('/missions/stats');
    if (data) {
      return data;
    }
  } catch (e) {
    console.warn('Failed to fetch dashboard stats from backend, using fallback:', e);
  }
  await delay(250);
  return mockDashboardStats;
}

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
