import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  variant?: 'cyan' | 'green' | 'hazard' | 'slate';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'cyan',
  className = '',
}) => {
  const borderMap = {
    cyan: 'border-cyan-500/30 text-cyan-400 bg-cyan-950/20',
    green: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20',
    hazard: 'border-rose-500/30 text-rose-400 bg-rose-950/20',
    slate: 'border-slate-700 text-slate-300 bg-slate-900/40',
  };

  return (
    <div
      className={`sonar-panel relative flex flex-col justify-between rounded-lg p-4 transition-all duration-200 hover:border-cyan-400/50 ${borderMap[variant]} ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>

      <div className="my-2 flex items-baseline justify-between gap-2">
        <span className="font-mono text-2xl font-bold tracking-tight text-white">{value}</span>
        {trend && (
          <span className="font-mono text-xs font-semibold text-emerald-400">{trend}</span>
        )}
      </div>

      {subtitle && <span className="font-mono text-[10px] text-slate-400">{subtitle}</span>}
    </div>
  );
};

export default MetricCard;
