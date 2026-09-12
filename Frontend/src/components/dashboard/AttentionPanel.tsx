import React from 'react';
import Panel from '@/components/ui/Panel';
import StatusIndicator from '@/components/ui/StatusIndicator';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface AttentionPanelProps {
  pendingCount?: number;
  hasErrors?: boolean;
}

export const AttentionPanel: React.FC<AttentionPanelProps> = ({
  pendingCount = 3,
  hasErrors = false,
}) => {
  return (
    <Panel
      variant={hasErrors ? 'warning' : 'standard'}
      headerTitle="SYSTEM STATUS & ALERTS"
      headerIcon={hasErrors ? <AlertTriangle className="h-4 w-4 text-rose-400" /> : <ShieldCheck className="h-4 w-4 text-emerald-400" />}
    >
      <div className="flex flex-col gap-2 font-mono text-xs">
        {hasErrors ? (
          <div className="flex items-center justify-between text-rose-400">
            <span>BACKEND DISCONNECTED</span>
            <StatusIndicator status="error" label="RECONNECTING" />
          </div>
        ) : (
          <div className="flex items-center justify-between text-emerald-400">
            <span>SYSTEM NOMINAL — ALL SUBSYSTEMS ONLINE</span>
            <StatusIndicator status="online" label="NOMINAL" />
          </div>
        )}

        {pendingCount > 0 && (
          <p className="text-slate-400 text-[11px]">
            Notice: <strong className="text-cyan-400">{pendingCount} contacts</strong> pending hydrographer verification.
          </p>
        )}
      </div>
    </Panel>
  );
};

export default AttentionPanel;
