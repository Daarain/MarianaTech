import { useEffect, useState } from 'react';
import { COLOURS } from '@/constants/colours';

interface ConfidenceBarProps {
  value: number;
  colour?: string;
  showLabel?: boolean;
}

export default function ConfidenceBar({
  value,
  colour = COLOURS.reef.light,
  showLabel = true,
}: ConfidenceBarProps) {
  const pct = Math.round(value * 100);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 100);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full transition-all duration-[1200ms] ease-out"
          style={{
            width: `${width}%`,
            backgroundColor: colour,
            boxShadow: `0 0 8px ${colour}66`,
          }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold tabular-nums" style={{ color: colour }}>
          {pct}%
        </span>
      )}
    </div>
  );
}
