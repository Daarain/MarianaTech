import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MarianaTech Global ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetState = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#030712] p-6 text-slate-100 font-mono select-none">
          <div className="max-w-lg w-full rounded-lg border border-rose-500/40 bg-[#050D1A] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-rose-500/30 pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-950 border border-rose-500/40 text-rose-400">
                <AlertTriangle className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <span className="font-mono text-[10px] font-bold tracking-widest text-rose-400 uppercase">
                  UNHANDLED APPLICATION RUNTIME EXCEPTION
                </span>
                <h2 className="font-mono text-base font-bold text-white uppercase">
                  APPLICATION RECOVERY MODE
                </h2>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-300">
                The MarianaTech interface encountered an unexpected runtime error during component execution.
              </p>
              <div className="rounded border border-rose-500/30 bg-rose-950/30 p-3 text-[11px] text-rose-300 overflow-x-auto max-h-32">
                <span className="font-bold block uppercase text-rose-400 mb-1">TECHNICAL ERROR REASON:</span>
                {this.state.error?.message || 'Unknown execution failure.'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-rose-500/20">
              <button
                onClick={this.handleResetState}
                className="flex items-center gap-2 rounded border border-slate-700 bg-slate-900 px-4 py-2 font-mono text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                RETURN TO DASHBOARD
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 rounded border border-rose-500/50 bg-rose-950 px-4 py-2 font-mono text-xs font-bold text-rose-200 hover:bg-rose-900/80 transition-colors shadow-[0_0_12px_rgba(244,63,94,0.25)]"
              >
                <RefreshCw className="h-4 w-4" />
                RELOAD APPLICATION
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
