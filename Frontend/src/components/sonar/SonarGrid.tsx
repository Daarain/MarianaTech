import React from 'react';

interface SonarGridProps {
  className?: string;
  maxRangeMeters?: number;
  showTicks?: boolean;
  opacity?: number;
}

export const SonarGrid: React.FC<SonarGridProps> = ({
  className = '',
  maxRangeMeters = 200,
  showTicks = true,
  opacity = 0.25,
}) => {
  return (
    <div
      className={`pointer-events-none relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ opacity }}
    >
      {/* Outer Circle Ring */}
      <div className="absolute h-[90%] w-[90%] rounded-full border border-cyan-500/40" />
      <div className="absolute h-[67.5%] w-[67.5%] rounded-full border border-dashed border-cyan-500/30" />
      <div className="absolute h-[45%] w-[45%] rounded-full border border-cyan-500/30" />
      <div className="absolute h-[22.5%] w-[22.5%] rounded-full border border-dashed border-cyan-500/30" />

      {/* Axis Crosshairs */}
      <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-cyan-500/40 to-transparent" />
      <div className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      {/* Diagonal Bearing Lines */}
      <div className="absolute h-full w-[1px] rotate-45 bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />
      <div className="absolute h-full w-[1px] -rotate-45 bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />

      {/* Range Meter Labels */}
      {showTicks && (
        <>
          <span className="absolute top-[6%] text-[10px] font-mono font-semibold tracking-wider text-cyan-400">
            {maxRangeMeters}m N
          </span>
          <span className="absolute bottom-[6%] text-[10px] font-mono font-semibold tracking-wider text-cyan-400">
            {maxRangeMeters}m S
          </span>
          <span className="absolute left-[6%] text-[10px] font-mono font-semibold tracking-wider text-cyan-400">
            {maxRangeMeters}m W
          </span>
          <span className="absolute right-[6%] text-[10px] font-mono font-semibold tracking-wider text-cyan-400">
            {maxRangeMeters}m E
          </span>
          <span className="absolute top-[28%] right-[50%] translate-x-[12px] text-[9px] font-mono text-cyan-500/70">
            {Math.round(maxRangeMeters * 0.5)}m
          </span>
        </>
      )}
    </div>
  );
};

export default SonarGrid;
