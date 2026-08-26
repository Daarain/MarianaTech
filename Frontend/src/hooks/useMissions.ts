import { useState, useEffect } from 'react';
import { getMissions, getMissionById, getDashboardStats } from '@/api/missions';
import { type Mission, type DashboardStats } from '@/api/mockData';

export function useMissions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMissions()
      .then((data) => {
        if (active) {
          setMissions(data);
          setError(null);
        }
      })
      .catch(() => {
        if (active) setError('Failed to load missions');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { missions, loading, error };
}

export function useMission(id: string | undefined) {
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    getMissionById(id)
      .then((data) => {
        if (active) {
          setMission(data);
          setError(null);
        }
      })
      .catch(() => {
        if (active) setError('Failed to load mission');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  return { mission, loading, error };
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getDashboardStats()
      .then((data) => {
        if (active) {
          setStats(data);
          setError(null);
        }
      })
      .catch(() => {
        if (active) setError('Failed to load stats');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { stats, loading, error };
}
