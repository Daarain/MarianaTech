import { useState, useCallback } from 'react';
import { generateReport, downloadReportCSV, downloadReportJSON } from '@/api/reports';

export function useReports() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestGenerateReport = useCallback(async (missionId: string) => {
    setLoading(true);
    setError(null);
    try {
      return await generateReport(missionId);
    } catch (err: any) {
      const msg = err?.message || 'Failed to generate survey report';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadCSV = useCallback(async (missionId: string, filename?: string) => {
    setLoading(true);
    setError(null);
    try {
      await downloadReportCSV(missionId, filename);
    } catch (err: any) {
      const msg = err?.message || 'Failed to download CSV survey report';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchJSON = useCallback(async (missionId: string) => {
    setLoading(true);
    setError(null);
    try {
      return await downloadReportJSON(missionId);
    } catch (err: any) {
      const msg = err?.message || 'Failed to fetch JSON survey report';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { requestGenerateReport, downloadCSV, fetchJSON, loading, error };
}
