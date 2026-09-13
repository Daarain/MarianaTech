import { apiFetch } from './client';
import type {
  AnalysisHistoryItem,
  AnalysisHistoryStats,
  AnalysisListResponse,
} from '@/types/api';

const MOCK_ANALYSES_FALLBACK: AnalysisHistoryItem[] = [
  {
    id: 'ANL-2026-0142',
    dataset_id: 'MSN-2026-0142',
    filename: 'chagos_trench_sweep_900khz.sonar',
    name: 'Chagos Trench Survey',
    status: 'completed',
    created_at: '2026-08-22T14:30:00Z',
    completed_at: '2026-08-22T14:32:00Z',
    model: 'Bilateral CLAHE Contour CV-Net v1.4',
    detection_count: 7,
    geolocated_count: 7,
    priority: 'critical',
    latitude: -6.3,
    longitude: 71.2,
    depth_m: 4200,
    operator: 'Lt. R. Mehta',
    sonar_type: 'Side-scan 900 kHz',
    error: null,
  },
  {
    id: 'ANL-2026-0141',
    dataset_id: 'MSN-2026-0141',
    filename: 'carlsberg_ridge_multibeam.sonar',
    name: 'Carlsberg Ridge Sweep',
    status: 'completed',
    created_at: '2026-08-20T10:15:00Z',
    completed_at: '2026-08-20T10:18:00Z',
    model: 'Bilateral CLAHE Contour CV-Net v1.4',
    detection_count: 12,
    geolocated_count: 12,
    priority: 'high',
    latitude: 3.8,
    longitude: 64.5,
    depth_m: 3100,
    operator: 'Cdr. A. Fernando',
    sonar_type: 'Multibeam EM 302',
    error: null,
  },
  {
    id: 'ANL-2026-0140',
    dataset_id: 'MSN-2026-0140',
    filename: 'bay_of_bengal_deep_shelf.sonar',
    name: 'Bay of Bengal Survey',
    status: 'processing',
    created_at: '2026-09-08T18:45:00Z',
    completed_at: null,
    model: 'Bilateral CLAHE Contour CV-Net v1.4',
    detection_count: 0,
    geolocated_count: 0,
    priority: 'medium',
    latitude: 13.0,
    longitude: 84.2,
    depth_m: 2800,
    operator: 'Dr. S. Raman',
    sonar_type: 'Side-scan 454 kHz',
    error: null,
  },
  {
    id: 'ANL-2026-0139',
    dataset_id: 'MSN-2026-0139',
    filename: 'corrupted_hdr_signal.sonar',
    name: 'Andaman Trench Test',
    status: 'failed',
    created_at: '2026-09-07T09:12:00Z',
    completed_at: null,
    model: 'Bilateral CLAHE Contour CV-Net v1.4',
    detection_count: 0,
    geolocated_count: 0,
    priority: 'low',
    latitude: 11.5,
    longitude: 92.7,
    depth_m: 3400,
    operator: 'Operator Baseline',
    sonar_type: 'Side-scan 900 kHz',
    error: 'Acoustic telemetry frame header corrupted - CRC mismatch',
  },
];

export interface GetAnalysesParams {
  status?: string;
  search?: string;
  sortBy?: string;
  order?: string;
  page?: number;
  limit?: number;
}

export async function getAnalysisHistory(params?: GetAnalysesParams): Promise<AnalysisListResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.search) query.append('search', params.search);
  if (params?.sortBy) query.append('sort_by', params.sortBy);
  if (params?.order) query.append('order', params.order);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());

  const queryString = query.toString();
  const endpoint = `/analyses${queryString ? `?${queryString}` : ''}`;
  return await apiFetch<AnalysisListResponse>(endpoint);
}

export async function getAnalysisStats(): Promise<AnalysisHistoryStats> {
  return await apiFetch<AnalysisHistoryStats>('/analyses/stats');
}

export async function getAnalysisById(id: string): Promise<AnalysisHistoryItem | null> {
  return await apiFetch<AnalysisHistoryItem>(`/analyses/${id}`);
}

export async function deleteAnalysis(id: string): Promise<boolean> {
  const res = await apiFetch<{ id: string; status: string }>(`/analyses/${id}`, {
    method: 'DELETE',
  });
  return res.status === 'deleted';
}

export async function retryAnalysis(id: string): Promise<AnalysisHistoryItem | null> {
  return await apiFetch<AnalysisHistoryItem>(`/analyses/${id}/retry`, {
    method: 'POST',
  });
}
