import React from 'react';
import StatusIndicator from '@/components/ui/StatusIndicator';
import { BASE_URL } from '@/constants/config';
import { useMissionContext } from '@/context/MissionContext';
import { isValidCoordinate, formatCoordinate } from '@/utils/geolocationUtils';

export const SystemStatusBar: React.FC = () => {
  const { activeMission } = useMissionContext();

  const isScanning = activeMission?.status === 'processing';
  const missionLabel = isScanning ? 'ACTIVE MISSION: ' : 'MISSION: ';
  const missionId = activeMission?.id || '—';

  const hasCoords = isValidCoordinate(activeMission?.latitude, activeMission?.longitude);
  const coordDisplay = hasCoords
    ? formatCoordinate(activeMission!.latitude, activeMission!.longitude)
    : 'N/A';

  return (
    <footer className="shrink-0 z-20 flex flex-wrap items-center justify-between gap-2 border-t border-[#B9C0C8]/15 bg-[#121518]/95 px-4 py-1.5 font-sans text-xs text-[#B9C0C8]/80 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <StatusIndicator status="online" label="ENGINE ONLINE" showPulse />
        <span className="hidden sm:inline text-[#B9C0C8]/20">|</span>
        <span className="hidden sm:inline text-[11px]">
          SURVEY COORD:{' '}
          <strong className={`font-mono font-medium ${hasCoords ? 'text-[#D97732]' : 'text-[#B9C0C8]/60'}`}>
            {coordDisplay}
          </strong>
        </span>
        <span className="hidden md:inline text-[#B9C0C8]/20">|</span>
        <span className="hidden md:inline text-[11px]">
          {missionLabel}
          <strong className="font-mono font-medium text-[#E8E5DF]">{missionId}</strong>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span title={`Endpoint: ${BASE_URL}`} className="cursor-help text-[11px]">
          TELEMETRY FEED: <strong className="text-emerald-400 font-semibold">CONNECTED</strong>
        </span>
        <span className="rounded bg-[#242930] border border-[#B9C0C8]/20 px-2 py-0.5 font-mono text-[9px] font-medium text-[#E8E5DF]">
          SIH 2026 PS 26057
        </span>
      </div>
    </footer>
  );
};

export default SystemStatusBar;
