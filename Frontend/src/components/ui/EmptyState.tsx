import React from 'react';
import { AlertTriangle, RefreshCw, Radar } from 'lucide-react';

interface EmptyStateProps {
  variant?: 'no_data' | 'processing' | 'error' | 'empty' | string;
  title?: string;
  message?: string;
  className?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'no_data',
  title = 'No Data Available',
  message = '',
  className = '',
  action,
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'processing':
        return <RefreshCw className="h-10 w-10 text-cyan-400 animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-10 w-10 text-rose-400" />;
      case 'no_data':
      default:
        return <Radar className="h-10 w-10 text-slate-500" />;
    }
  };

  const getBorderAndBg = () => {
    switch (variant) {
      case 'processing':
        return 'border-cyan-500/30 bg-cyan-950/20';
      case 'error':
        return 'border-rose-500/30 bg-rose-950/20';
      case 'no_data':
      default:
        return 'border-slate-800 bg-slate-900/30';
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border p-8 text-center font-mono ${getBorderAndBg()} ${className}`}
    >
      <div className="mb-3">{getIcon()}</div>
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">{title}</h3>
      {message && <p className="mt-1.5 max-w-md text-xs text-slate-400">{message}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-lg border border-cyan-500/40 bg-cyan-950/60 px-4 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/50 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
