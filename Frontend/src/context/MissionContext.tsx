import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { type Mission, type Anomaly, type DetectionResult } from '@/types/api';
import { getMissions } from '@/api/missions';

interface MissionContextValue {
  activeMission: Mission | null;
  setActiveMission: (m: Mission | null) => void;
  selectedAnomaly: Anomaly | null;
  setSelectedAnomaly: (a: Anomaly | null) => void;

  // Staged Dataset & Detection Result handling across Phase 7 Upload & Phase 8 Analysis
  stagedFile: File | null;
  stagedPreviewUrl: string | null;
  stagedLatitude: number;
  stagedLongitude: number;
  stagedDetectionResult: DetectionResult | null;
  setStagedDataset: (file: File | null, url: string | null, lat?: number, lon?: number) => void;
  setStagedDetectionResult: (res: DetectionResult | null) => void;
  clearStagedDataset: () => void;
}

const MissionContext = createContext<MissionContextValue | null>(null);

export function MissionProvider({ children }: { children: ReactNode }) {
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);

  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedPreviewUrl, setStagedPreviewUrl] = useState<string | null>(null);
  const [stagedLatitude, setStagedLatitude] = useState<number>(-6.3000);
  const [stagedLongitude, setStagedLongitude] = useState<number>(71.2000);
  const [stagedDetectionResult, setStagedDetectionResultState] = useState<DetectionResult | null>(null);

  // Automatically load active mission from real backend missions if available
  useEffect(() => {
    let mounted = true;
    getMissions()
      .then((missions) => {
        if (!mounted || !missions || missions.length === 0) return;
        setActiveMission((current) => {
          if (current) return current;
          const active =
            missions.find((m) => m.status === 'processing') ||
            missions.find((m) => m.status === 'pending') ||
            missions[0];
          return active || null;
        });
      })
      .catch(() => {
        // Safe fail-silent if not yet logged in
      });
    return () => {
      mounted = false;
    };
  }, []);

  const setStagedDataset = useCallback((file: File | null, url: string | null, lat: number = -6.3000, lon: number = 71.2000) => {
    setStagedPreviewUrl((prevUrl) => {
      if (prevUrl && prevUrl.startsWith('blob:') && prevUrl !== url) {
        URL.revokeObjectURL(prevUrl);
      }
      return url;
    });
    setStagedFile(file);
    setStagedLatitude(lat);
    setStagedLongitude(lon);
  }, []);

  const setStagedDetectionResult = useCallback((res: DetectionResult | null) => {
    setStagedDetectionResultState(res);
  }, []);

  const clearStagedDataset = useCallback(() => {
    setStagedFile(null);
    if (stagedPreviewUrl) {
      URL.revokeObjectURL(stagedPreviewUrl);
    }
    setStagedPreviewUrl(null);
    setStagedDetectionResultState(null);
  }, [stagedPreviewUrl]);

  const value: MissionContextValue = {
    activeMission,
    setActiveMission,
    selectedAnomaly,
    setSelectedAnomaly,
    stagedFile,
    stagedPreviewUrl,
    stagedLatitude,
    stagedLongitude,
    stagedDetectionResult,
    setStagedDataset,
    setStagedDetectionResult,
    clearStagedDataset,
  };

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
}

export function useMissionContext(): MissionContextValue {
  const ctx = useContext(MissionContext);
  if (!ctx) throw new Error('useMissionContext must be used within MissionProvider');
  return ctx;
}
