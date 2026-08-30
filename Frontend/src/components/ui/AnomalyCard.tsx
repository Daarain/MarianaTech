import { Check, X } from 'lucide-react';
import { COLOURS } from '@/constants/colours';
import { formatAnomalyClass, formatConfidence, formatCoordinate, formatDepth } from '@/utils/formatters';
import ConfidenceBar from './ConfidenceBar';
import Badge from './Badge';
import type { Anomaly } from '@/api/mockData';

interface AnomalyCardProps {
  anomaly: Anomaly;
  onVerify?: (id: string) => void;
  onReject?: (id: string) => void;
}

export default function AnomalyCard({ anomaly, onVerify, onReject }: AnomalyCardProps) {
  return (
    <div
      className="rounded-xl border p-4 transition-all duration-300 hover:border-ocean-light/40"
      style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-sm font-semibold" style={{ color: COLOURS.textPrimary }}>
              {formatAnomalyClass(anomaly.class_name)}
            </h4>
            <Badge priority={anomaly.priority} />
          </div>
          <p className="mt-0.5 font-mono text-xs" style={{ color: COLOURS.seafloor.light }}>
            {anomaly.id}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <ConfidenceBar value={anomaly.confidence} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span style={{ color: COLOURS.seafloor.light }}>Position: </span>
          <span className="font-mono" style={{ color: COLOURS.textPrimary }}>
            {formatCoordinate(anomaly.latitude, anomaly.longitude)}
          </span>
        </div>
        <div>
          <span style={{ color: COLOURS.seafloor.light }}>Depth: </span>
          <span style={{ color: COLOURS.textPrimary }}>{formatDepth(anomaly.depth_m)}</span>
        </div>
      </div>

      <p className="mt-2 text-xs leading-relaxed" style={{ color: COLOURS.seafloor.light }}>
        {anomaly.description}
      </p>

      {anomaly.status === 'pending_review' && (onVerify || onReject) && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onVerify?.(anomaly.id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{ backgroundColor: `${COLOURS.reef.base}22`, color: COLOURS.reef.light }}
          >
            <Check size={14} /> Verify
          </button>
          <button
            onClick={() => onReject?.(anomaly.id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{ backgroundColor: `${COLOURS.hazard.base}22`, color: COLOURS.hazard.light }}
          >
            <X size={14} /> Reject
          </button>
        </div>
      )}
      {anomaly.status !== 'pending_review' && (
        <div className="mt-3 text-xs font-semibold" style={{ color: COLOURS.seafloor.light }}>
          Status: {anomaly.status.replace('_', ' ')}
        </div>
      )}
    </div>
  );
}
