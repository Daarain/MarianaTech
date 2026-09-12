import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  showPercentage?: boolean;
  variant?: 'cyan' | 'green' | 'hazard';
  size?: 'sm' | 'md';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showPercentage = true,
  variant = 'cyan',
  size = 'md',
  className = '',
}) => {
  const boundedValue = Math.min(100, Math.max(0, value));

  const barColors = {
    cyan: 'bg-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.5)]',
    green: 'bg-emerald-400 shadow-[0_0_12px_rgba(0,255,157,0.5)]',
    hazard: 'bg-rose-500 shadow-[0_0_12px_rgba(255,59,48,0.5)]',
  };

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="mb-1.5 flex items-center justify-between font-mono text-xs text-slate-300">
          {label && <span className="uppercase tracking-wider text-slate-400">{label}</span>}
          {showPercentage && (
            <span className="font-semibold text-cyan-400">{Math.round(boundedValue)}%</span>
          )}
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-slate-900/80 p-0.5 border border-cyan-500/20 ${heightClasses[size]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColors[variant]}`}
          style={{ width: `${boundedValue}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
