import React from 'react';
import { normalizeConfidence } from '@/utils/confidenceUtils';

interface ConfidenceBarProps {
  value: number | null | undefined;
  colour?: string;
  className?: string;
  showPercentage?: boolean;
}

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({
  value,
  colour,
  className = '',
  showPercentage = true,
}) => {
  const norm = normalizeConfidence(value);

  // Determine bar color if not explicitly provided
  const barColor = colour || (norm >= 75 ? '#B9C0C8' : norm >= 50 ? '#D97732' : '#B94A48');

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between font-mono text-xs mb-1">
        <span className="text-slate-400 text-[10px] uppercase tracking-wider">Confidence</span>
        {showPercentage && (
          <span className="font-semibold text-xs" style={{ color: barColor }}>
            {norm}%
          </span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80 p-0.5 border border-white/10">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${norm}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
};

export default ConfidenceBar;
