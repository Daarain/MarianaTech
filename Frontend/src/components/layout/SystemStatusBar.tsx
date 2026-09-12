import React from 'react';
import StatusIndicator from '@/components/ui/StatusIndicator';
import { BASE_URL } from '@/constants/config';

export const SystemStatusBar: React.FC = () => {
  return (
    <footer className="sticky bottom-0 z-30 flex flex-wrap items-center justify-between gap-2 border-t border-cyan-500/20 bg-[#030712]/95 px-4 py-1.5 font-mono text-[10px] text-slate-400 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <StatusIndicator status="online" label="ENGINE ONLINE" showPulse />
        <span className="hidden sm:inline text-slate-600">|</span>
        <span className="hidden sm:inline">
          SURVEY COORD: <strong className="text-cyan-400">6.3000° S, 71.2000° E</strong>
        </span>
        <span className="hidden md:inline text-slate-600">|</span>
        <span className="hidden md:inline">
          ACTIVE MISSION: <strong className="text-slate-200">MSN-2026-0142</strong>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span>
          ENDPOINT: <strong className="text-slate-400">{BASE_URL.replace('http://', '')}</strong>
        </span>
        <span className="rounded bg-cyan-950/80 border border-cyan-500/40 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300">
          SIH 2026 PS 26057
        </span>
      </div>
    </footer>
  );
};

export default SystemStatusBar;
