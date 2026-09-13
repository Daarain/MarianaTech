import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  details?: string | null;
  onRetry?: () => void;
  actionLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'SERVICE UNAVAILABLE',
  message = 'Unable to complete the requested operation.',
  details = null,
  onRetry,
  actionLabel = 'RETRY CONNECTION',
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={`rounded-lg border border-rose-500/40 bg-rose-950/20 p-6 text-center font-mono ${className}`}>
      <AlertTriangle className="mx-auto h-9 w-9 text-rose-400 mb-3" />
      <h3 className="text-sm font-bold text-rose-300 uppercase tracking-wider">{title}</h3>
      <p className="mt-1 text-xs text-rose-200/90 max-w-md mx-auto">{message}</p>

      {details && (
        <div className="mt-3 max-w-md mx-auto">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 hover:text-rose-300 transition-colors"
          >
            {showDetails ? 'HIDE DIAGNOSTICS' : 'VIEW TECHNICAL DIAGNOSTICS'}
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {showDetails && (
            <div className="mt-2 rounded border border-rose-500/30 bg-rose-950/40 p-2.5 text-left text-[10px] text-rose-300 overflow-x-auto max-h-28">
              {details}
            </div>
          )}
        </div>
      )}

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded border border-rose-500/50 bg-rose-900/40 px-4 py-1.5 font-mono text-xs font-bold text-rose-200 hover:bg-rose-800/40 transition-colors shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default ErrorState;
