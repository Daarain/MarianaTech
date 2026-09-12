import React from 'react';
import Panel from '@/components/ui/Panel';
import ProgressBar from '@/components/ui/ProgressBar';
import type { Anomaly } from '@/types/api';
import { Target, PieChart } from 'lucide-react';

interface DetectionSummaryPanelProps {
  anomalies: Anomaly[];
  loading?: boolean;
  className?: string;
}

export const DetectionSummaryPanel: React.FC<DetectionSummaryPanelProps> = ({
  anomalies,
  loading = false,
  className = '',
}) => {
  // Count real returned anomaly classes
  const classCounts: Record<string, number> = {};
  let highConf = 0;
  let medConf = 0;
  let lowConf = 0;

  anomalies.forEach((a) => {
    classCounts[a.class_name] = (classCounts[a.class_name] || 0) + 1;
    if (a.confidence >= 0.85) highConf++;
    else if (a.confidence >= 0.65) medConf++;
    else lowConf++;
  });

  const total = anomalies.length || 1;
  const highPct = Math.round((highConf / total) * 100);
  const medPct = Math.round((medConf / total) * 100);
  const lowPct = Math.round((lowConf / total) * 100);

  return (
    <Panel
      headerTitle="DETECTION SUMMARY & CONFIDENCE"
      headerIcon={<PieChart className="h-4 w-4 text-cyan-400" />}
      className={className}
    >
      {loading ? (
        <div className="py-8 font-mono text-xs text-center text-cyan-400">
          CALCULATING CONFIDENCE METRICS...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Class Breakdown List */}
          <div>
            <h4 className="font-mono text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              DETECTED CONTACT TYPES ({anomalies.length})
            </h4>
            {Object.keys(classCounts).length === 0 ? (
              <p className="font-mono text-xs text-slate-500">No anomaly contacts analyzed yet.</p>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {Object.entries(classCounts).map(([cls, count]) => (
                  <div key={cls} className="flex items-center justify-between border-b border-cyan-500/10 pb-1">
                    <span className="text-slate-200 capitalize">{cls.replace(/_/g, ' ')}</span>
                    <span className="rounded bg-cyan-950 px-2 py-0.5 font-bold text-cyan-400">
                      {count} {count === 1 ? 'contact' : 'contacts'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confidence Distribution */}
          <div className="border-t border-cyan-500/20 pt-4">
            <h4 className="font-mono text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              CONFIDENCE DISTRIBUTION
            </h4>
            <div className="space-y-3">
              <ProgressBar value={highPct} label="HIGH CONFIDENCE (≥ 85%)" variant="cyan" />
              <ProgressBar value={medPct} label="MEDIUM CONFIDENCE (65-84%)" variant="green" />
              <ProgressBar value={lowPct} label="LOW CONFIDENCE (< 65%)" variant="hazard" />
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
};

export default DetectionSummaryPanel;
