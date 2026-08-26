import { createContext, useContext, useState, type ReactNode } from 'react';
import { type Mission, type Anomaly } from '@/api/mockData';

interface MissionContextValue {
  activeMission: Mission | null;
  setActiveMission: (m: Mission | null) => void;
  selectedAnomaly: Anomaly | null;
  setSelectedAnomaly: (a: Anomaly | null) => void;
}

const MissionContext = createContext<MissionContextValue | null>(null);

export function MissionProvider({ children }: { children: ReactNode }) {
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);

  const value: MissionContextValue = {
    activeMission,
    setActiveMission,
    selectedAnomaly,
    setSelectedAnomaly,
  };

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
}

export function useMissionContext(): MissionContextValue {
  const ctx = useContext(MissionContext);
  if (!ctx) throw new Error('useMissionContext must be used within MissionProvider');
  return ctx;
}
