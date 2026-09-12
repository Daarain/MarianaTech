import React from 'react';
import {
  Tag,
  Search,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Anchor,
  Fish,
  Layers,
  Mountain,
  Activity,
  Filter,
  ShieldCheck,
} from 'lucide-react';
import type { Anomaly } from '@/types/api';
import {
  getClassMetadata,
  calculateClassDistribution,
  SUPPORTED_CLASSES,
} from '@/utils/classificationUtils';
import { formatConfidenceLabel } from '@/utils/confidenceUtils';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';

interface ClassificationInspectorPanelProps {
  allAnomalies: Anomaly[];
  selectedClassFilter: string;
  setSelectedClassFilter: (cls: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedAnomaly: Anomaly | null;
  onClearSelection: () => void;
}

const CLASS_ICON_MAP: Record<string, React.ReactNode> = {
  HelpCircle: <HelpCircle className="h-4 w-4" />,
  Anchor: <Anchor className="h-4 w-4" />,
  Fish: <Fish className="h-4 w-4" />,
  Layers: <Layers className="h-4 w-4" />,
  Mountain: <Mountain className="h-4 w-4" />,
  Activity: <Activity className="h-4 w-4" />,
  AlertTriangle: <AlertTriangle className="h-4 w-4" />,
};

export const ClassificationInspectorPanel: React.FC<ClassificationInspectorPanelProps> = ({
  allAnomalies,
  selectedClassFilter,
  setSelectedClassFilter,
  searchQuery,
  setSearchQuery,
  selectedAnomaly,
  onClearSelection,
}) => {
  const distribution = calculateClassDistribution(allAnomalies);
  const selectedMeta = selectedAnomaly ? getClassMetadata(selectedAnomaly.class_name) : null;

  return (
    <Panel title="AI ANOMALY CLASSIFICATION ENGINE">
      <div className="space-y-5 font-mono text-xs text-slate-300">
        {/* Class Search & Filter Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
            <span className="flex items-center gap-1.5 uppercase">
              <Tag className="h-3.5 w-3.5 text-cyan-400" />
              FILTER BY CLASS
            </span>
            {selectedClassFilter !== 'ALL' && (
              <button
                onClick={() => setSelectedClassFilter('ALL')}
                className="text-[10px] text-cyan-400 underline font-semibold hover:text-cyan-200"
              >
                SHOW ALL CLASSES
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by class name, ID, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded bg-slate-900/80 border border-cyan-500/30 pl-8 pr-3 py-1.5 text-xs text-cyan-300 font-mono focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Quick Class Selector Chips */}
          <div className="flex flex-wrap gap-1 pt-1">
            <button
              onClick={() => setSelectedClassFilter('ALL')}
              className={`rounded px-2 py-1 text-[10px] font-bold transition-all ${
                selectedClassFilter === 'ALL'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              ALL CLASSES ({allAnomalies.length})
            </button>
            {distribution.map((item) => (
              <button
                key={item.classKey}
                onClick={() => setSelectedClassFilter(item.classKey)}
                className={`rounded px-2 py-1 text-[10px] font-bold transition-all ${
                  selectedClassFilter === item.classKey
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {item.label} ({item.count})
              </button>
            ))}
          </div>
        </div>

        {/* Selected Anomaly Classification Card */}
        {selectedAnomaly && selectedMeta && (
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/30 p-3.5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg border text-white shrink-0"
                  style={{ backgroundColor: `${selectedMeta.color}22`, borderColor: `${selectedMeta.color}66` }}
                >
                  {CLASS_ICON_MAP[selectedMeta.iconName] || <HelpCircle className="h-4 w-4" />}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">AI CLASSIFIED CATEGORY</span>
                  <h4 className="text-sm font-bold text-white uppercase">{selectedMeta.label}</h4>
                </div>
              </div>
              <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${selectedMeta.badgeStyle}`}>
                {selectedAnomaly.priority}
              </span>
            </div>

            <div className="rounded bg-slate-950/60 p-2.5 border border-slate-800 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Scientific Category:</span>
                <span className="text-cyan-300 font-bold">{selectedMeta.categoryLabel}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Model Confidence:</span>
                <span className="text-cyan-300 font-bold">{formatConfidenceLabel(selectedAnomaly.confidence)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Geospatial Coordinates:</span>
                <span className="text-cyan-300 font-mono font-bold">
                  {selectedAnomaly.latitude && selectedAnomaly.longitude
                    ? `${selectedAnomaly.latitude.toFixed(4)}°, ${selectedAnomaly.longitude.toFixed(4)}°`
                    : 'Location Unavailable'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Target Depth:</span>
                <span className="text-slate-300">{selectedAnomaly.depth_m || 4180} m</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Classification Engine:</span>
                <span className="text-slate-300">FastAPI OpenCV CV-Net v1.4</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded border border-slate-800 italic">
              "{selectedMeta.description}"
            </p>
          </div>
        )}

        {/* Classification Breakdown & Summary Chart */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
            <span>CLASSIFICATION BREAKDOWN</span>
            <span className="text-slate-400 font-normal">{allAnomalies.length} TOTAL CONTACTS</span>
          </div>

          <div className="space-y-2 bg-slate-950/40 p-3 rounded border border-slate-900">
            {distribution.length > 0 ? (
              distribution.map((item) => (
                <div key={item.classKey} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white font-semibold flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </span>
                    <span className="text-cyan-300 font-bold">
                      {item.count} contacts ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-2 text-center text-[10px] text-slate-500">
                No classified anomalies present in current dataset.
              </div>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
};

export default ClassificationInspectorPanel;
