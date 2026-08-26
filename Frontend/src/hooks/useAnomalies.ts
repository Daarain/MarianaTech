import { useState, useEffect } from 'react';
import { getAnomalies, verifyAnomaly, rejectAnomaly } from '@/api/anomalies';
import { type Anomaly } from '@/api/mockData';

export function useAnomalies(missionId: string | undefined) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!missionId) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    getAnomalies(missionId)
      .then((data) => {
        if (active) {
          setAnomalies(data);
          setError(null);
        }
      })
      .catch(() => {
        if (active) setError('Failed to load anomalies');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [missionId]);

  const verify = async (anomalyId: string) => {
    await verifyAnomaly(anomalyId);
    setAnomalies((prev) =>
      prev.map((a) => (a.id === anomalyId ? { ...a, status: 'verified' } : a))
    );
  };

  const reject = async (anomalyId: string) => {
    await rejectAnomaly(anomalyId);
    setAnomalies((prev) =>
      prev.map((a) => (a.id === anomalyId ? { ...a, status: 'rejected' } : a))
    );
  };

  return { anomalies, loading, error, verify, reject };
}
