import React from 'react';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import StatusIndicator from '@/components/ui/StatusIndicator';
import { ArrowRight, ScanLine, Layers, MapPin, Gauge } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ActiveAnalysisPanelProps {
  missionId?: string;
  missionName?: string;
  location?: string;
  sonarType?: string;
  anomalyCount?: number;
}

export const ActiveAnalysisPanel: React.FC<ActiveAnalysisPanelProps> = ({
  missionId = 'MSN-2026-0142',
  missionName = 'Chagos Trench Survey',
  location = 'Chagos Trench, Indian Ocean (-6.30° S, 71.20° E)',
  sonarType = 'Side-scan 900 kHz',
  anomalyCount = 7,
}) => {
  const navigate = useNavigate();

  return (
    <Panel
      variant="analysis"
      hasCornerNotch
      headerTitle="CURRENT SONAR SURVEY TELEMETRY"
      headerIcon={<ScanLine className="h-4 w-4 text-cyan-400" />}
      headerRight={<StatusIndicator status="processing" label="SWEEP IN PROGRESS" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Survey Meta Info */}
        <div className="md:col-span-8 space-y-3 font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="rounded bg-cyan-950 px-2 py-0.5 font-bold text-cyan-400 border border-cyan-500/40">
              {missionId}
            </span>
            <h4 className="text-base font-bold text-slate-100">{missionName}</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-300">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span>{sonarType}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span>DEPTH: <strong>4,200m</strong></span>
            </div>
          </div>

          <p className="text-slate-400 text-[11px]">
            High acoustic return contact sweep running automated speckle bilateral noise filtering & CLAHE contrast boost.
          </p>
        </div>

        {/* Action Button CTA */}
        <div className="md:col-span-4 flex flex-col items-start md:items-end justify-center gap-2 border-t md:border-t-0 md:border-l border-cyan-500/20 pt-4 md:pt-0 md:pl-6">
          <span className="font-mono text-xs text-slate-400">
            CONTACTS DETECTED: <strong className="text-cyan-400 font-bold">{anomalyCount}</strong>
          </span>
          <Button
            variant="primary"
            icon={<ArrowRight className="h-4 w-4" />}
            onClick={() => navigate(`/missions/${missionId}/viewer`)}
          >
            OPEN SONAR CANVAS
          </Button>
        </div>
      </div>
    </Panel>
  );
};

export default ActiveAnalysisPanel;
