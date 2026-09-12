import { useState, useCallback } from 'react';
import { detectSonarImage } from '@/api/detect';
import type { DetectionResult } from '@/types/api';

export function useDetection() {
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (file: File, latitude: number = -6.3, longitude: number = 71.2) => {
    setLoading(true);
    setError(null);
    try {
      const data = await detectSonarImage(file, latitude, longitude);
      setResult(data);
      return data;
    } catch (err: any) {
      const msg = err?.message || 'Failed to process sonar imagery';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setLoading(false);
    setError(null);
  }, []);

  return { result, loading, error, analyze, reset };
}
