import React from 'react';

export type SystemStatus =
  | 'online'
  | 'processing'
  | 'ready'
  | 'offline'
  | 'warning'
  | 'complete'
  | 'error';

interface StatusIndicatorProps {
  status: SystemStatus;
  label?: string;
  showPulse?: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  showPulse = true,
  className = '',
}) => {
  const config: Record<
    SystemStatus,
    { dot: string; text: string; pulse: string; defaultLabel: string }
  > = {
    online: { dot: 'bg-slate-300', text: 'text-slate-300', pulse: 'bg-slate-300/20', defaultLabel: 'ONLINE' },
    processing: { dot: 'bg-orange-400', text: 'text-orange-400', pulse: 'bg-orange-400/20', defaultLabel: 'PROCESSING' },
    ready: { dot: 'bg-orange-400', text: 'text-orange-400', pulse: 'bg-orange-400/20', defaultLabel: 'READY' },
    offline: { dot: 'bg-slate-500', text: 'text-slate-400', pulse: 'bg-slate-500/20', defaultLabel: 'OFFLINE' },
    warning: { dot: 'bg-orange-400', text: 'text-orange-400', pulse: 'bg-orange-400/20', defaultLabel: 'WARNING' },
    complete: { dot: 'bg-slate-300', text: 'text-slate-300', pulse: 'bg-slate-300/20', defaultLabel: 'COMPLETE' },
    error: { dot: 'bg-rose-500', text: 'text-rose-400', pulse: 'bg-rose-500/20', defaultLabel: 'ERROR' },
  };

  const c = config[status] || config.online;
  const displayLabel = label || c.defaultLabel;

  return (
    <div className={`inline-flex items-center gap-2 font-sans text-xs ${className}`}>
      <span className="relative flex h-2.5 w-2.5 items-center justify-center">
        {showPulse && status !== 'offline' && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${c.pulse}`}
          />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${c.dot}`} />
      </span>
      <span className={`font-semibold tracking-wider ${c.text}`}>{displayLabel}</span>
    </div>
  );
};

export default StatusIndicator;
