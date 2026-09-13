import { useState, useEffect, useCallback } from 'react';
import { getAnomalies, verifyAnomaly, rejectAnomaly } from '@/api/anomalies';
import type { Anomaly } from '@/types/api';

export function useAnomalies(missionId: string | undefined) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnomaliesData = useCallback(async () => {
    if (!missionId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getAnomalies(missionId);
      setAnomalies(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load anomalies');
    } finally {
      setLoading(false);
    }
  }, [missionId]);

  useEffect(() => {
    fetchAnomaliesData();
  }, [fetchAnomaliesData]);

  const verify = async (anomalyId: string) => {
    try {
      await verifyAnomaly(anomalyId);
      setAnomalies((prev) =>
        prev.map((a) => (a.id === anomalyId ? { ...a, status: 'verified' } : a))
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to verify anomaly');
    }
  };

  const reject = async (anomalyId: string) => {
    try {
      await rejectAnomaly(anomalyId);
      setAnomalies((prev) =>
        prev.map((a) => (a.id === anomalyId ? { ...a, status: 'rejected' } : a))
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to reject anomaly');
    }
  };

  return { anomalies, loading, error, verify, reject, refetch: fetchAnomaliesData };
}
