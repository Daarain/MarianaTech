import React from 'react';
import {
  Sliders,
  RotateCcw,
  BarChart3,
  ShieldCheck,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
} from 'lucide-react';
import type { Anomaly } from '@/types/api';
import {
  normalizeConfidence,
  formatConfidenceLabel,
  calculateConfidenceSummary,
  calculateConfidenceDistribution,
} from '@/utils/confidenceUtils';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';

export type SortOrder = 'CONFIDENCE_DESC' | 'CONFIDENCE_ASC' | 'ORIGINAL';

interface ConfidenceControlPanelProps {
  allAnomalies: Anomaly[];
  threshold: number;
  setThreshold: (val: number) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  onResetFilter: () => void;
}

const PRESETS = [
  { label: 'SHOW ALL', value: 0 },
  { label: 'LOW (50%)', value: 50 },
  { label: 'MEDIUM (70%)', value: 70 },
  { label: 'HIGH (85%)', value: 85 },
];

export const ConfidenceControlPanel: React.FC<ConfidenceControlPanelProps> = ({
  allAnomalies,
  threshold,
  setThreshold,
  sortOrder,
  setSortOrder,
  onResetFilter,
}) => {
  const summary = calculateConfidenceSummary(allAnomalies, threshold);
  const distribution = calculateConfidenceDistribution(allAnomalies);

  return (
    <Panel title="CONFIDENCE SCORING & NOISE FILTERING">
      <div className="space-y-5 font-mono text-xs text-slate-300">
        {/* Minimum Display Confidence Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold text-white uppercase text-[11px]">
              <Filter className="h-3.5 w-3.5 text-cyan-400" />
              DISPLAY THRESHOLD
            </span>
            <span className="font-bold text-cyan-400 text-sm bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
              ≥ {threshold}%
            </span>
          </div>

          <div className="relative flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              aria-label="Minimum display confidence threshold percentage"
              className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-cyan-500/30 focus:outline-none"
            />
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
            <div className="flex flex-wrap gap-1">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setThreshold(p.value)}
                  className={`rounded px-2 py-1 text-[10px] font-bold transition-all ${
                    threshold === p.value
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilter}
              className="text-[10px] py-1 px-2 border-slate-700 hover:border-cyan-500/40 text-slate-400"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              RESET
            </Button>
          </div>
        </div>

        {/* Detection Quality Panel */}
        <div className="rounded bg-slate-900/60 p-3 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-200 border-b border-cyan-500/10 pb-1.5">
            <span>DETECTION QUALITY SUMMARY</span>
            <span className="text-cyan-400">
              {summary.visibleCount} / {summary.totalCount} VISIBLE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex justify-between py-0.5 border-b border-slate-800">
              <span className="text-slate-400">Total Detections:</span>
              <span className="text-white font-bold">{summary.totalCount}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800">
              <span className="text-slate-400">Filtered Out:</span>
              <span className={summary.filteredCount > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                {summary.filteredCount}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400">Mean Confidence:</span>
              <span className="text-cyan-300 font-bold">{summary.meanConfidence}%</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400">Highest Confidence:</span>
              <span className="text-cyan-300 font-bold">{summary.highestConfidence}%</span>
            </div>
          </div>
        </div>

        {/* Confidence Distribution Histogram */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
              CONFIDENCE DISTRIBUTION
            </span>
            <span className="text-[10px] text-slate-500">REAL MODEL OUTPUT</span>
          </div>

          <div className="space-y-1.5 bg-slate-950/40 p-2.5 rounded border border-slate-900">
            {allAnomalies.length > 0 ? (
              distribution.map((bin) => (
                <div key={bin.label} className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{bin.label}</span>
                    <span className="text-cyan-300 font-semibold">
                      {bin.count} contacts ({bin.percentage}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                      style={{ width: `${bin.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-2 text-center text-[10px] text-slate-500">
                Insufficient detections for distribution chart.
              </div>
            )}
          </div>
        </div>

        {/* Sorting Controls */}
        <div className="flex items-center justify-between pt-1 border-t border-cyan-500/10 text-[11px]">
          <span className="flex items-center gap-1 text-slate-400">
            <ArrowUpDown className="h-3.5 w-3.5 text-cyan-400" />
            SORT ORDER:
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSortOrder('CONFIDENCE_DESC')}
              className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                sortOrder === 'CONFIDENCE_DESC'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900/60 text-slate-400'
              }`}
            >
              HIGH → LOW
            </button>
            <button
              onClick={() => setSortOrder('CONFIDENCE_ASC')}
              className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                sortOrder === 'CONFIDENCE_ASC'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900/60 text-slate-400'
              }`}
            >
              LOW → HIGH
            </button>
            <button
              onClick={() => setSortOrder('ORIGINAL')}
              className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                sortOrder === 'ORIGINAL'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900/60 text-slate-400'
              }`}
            >
              ORIGINAL
            </button>
          </div>
        </div>
      </div>
    </Panel>
  );
};

export default ConfidenceControlPanel;
