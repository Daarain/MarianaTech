import { useState, useEffect, useCallback } from 'react';
import { getMissions, getMissionById, getDashboardStats } from '@/api/missions';
import type { Mission, DashboardStats } from '@/types/api';

export function useMissions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMissionsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMissions();
      setMissions(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load survey missions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMissionsData();
  }, [fetchMissionsData]);

  return { missions, loading, error, refetch: fetchMissionsData };
}

export function useMission(id: string | undefined) {
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMission = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getMissionById(id);
      setMission(data);
    } catch (err: any) {
      setError(err?.message || `Failed to load mission ${id}`);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMission();
  }, [fetchMission]);

  return { mission, loading, error, refetch: fetchMission };
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load mission statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
