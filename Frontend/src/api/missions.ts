import { apiFetch } from './client';
import type { Mission, DashboardStats, CreateMissionPayload } from '@/types/api';
export type { CreateMissionPayload };

export async function getMissions(): Promise<Mission[]> {
  return await apiFetch<Mission[]>('/missions');
}

export async function getMissionById(id: string): Promise<Mission | null> {
  return await apiFetch<Mission>(`/missions/${id}`);
}

export async function createMission(data: CreateMissionPayload): Promise<{ id: string }> {
  return await apiFetch<{ id: string }>('/missions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return await apiFetch<DashboardStats>('/missions/stats');
}
