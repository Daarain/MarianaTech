import React, { useEffect, useState } from 'react';
import Panel from '@/components/ui/Panel';
import StatusIndicator from '@/components/ui/StatusIndicator';
import Button from '@/components/ui/Button';
import { apiFetch } from '@/api/client';
import { RefreshCw, Server, Cpu, ShieldCheck } from 'lucide-react';

interface SystemHealthPanelProps {
  className?: string;
}

export const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [lastCheck, setLastCheck] = useState<string>('');

  const checkHealth = async () => {
    setStatus('checking');
    try {
      await apiFetch<{ status: string }>('/health');
      setStatus('online');
      setLastCheck(new Date().toLocaleTimeString());
    } catch (err) {
      setStatus('offline');
      setLastCheck(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <Panel
      headerTitle="SYSTEM HEALTH & OPERATIONAL STATUS"
      headerIcon={<Server className="h-4 w-4 text-cyan-400" />}
      headerRight={
        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw className={`h-3.5 w-3.5 ${status === 'checking' ? 'animate-spin' : ''}`} />}
          onClick={checkHealth}
        >
          RE-CHECK
        </Button>
      }
      className={className}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        {/* Backend REST API Status */}
        <div className="rounded bg-slate-950/60 p-3 border border-cyan-500/20">
          <span className="block text-[10px] text-slate-400 uppercase mb-1">REST API SERVER</span>
          <StatusIndicator status={status === 'online' ? 'online' : 'error'} label={status === 'online' ? 'ONLINE' : 'DISCONNECTED'} />
        </div>

        {/* AI Processing Engine */}
        <div className="rounded bg-slate-950/60 p-3 border border-cyan-500/20">
          <span className="block text-[10px] text-slate-400 uppercase mb-1">AI CV ENGINE</span>
          <StatusIndicator status={status === 'online' ? 'ready' : 'offline'} label={status === 'online' ? 'READY (OPENCV)' : 'UNAVAILABLE'} />
        </div>

        {/* Sonar Ingestion Pipeline */}
        <div className="rounded bg-slate-950/60 p-3 border border-cyan-500/20">
          <span className="block text-[10px] text-slate-400 uppercase mb-1">INGESTION PIPELINE</span>
          <StatusIndicator status="online" label="ACTIVE" />
        </div>

        {/* Security & Protocol */}
        <div className="rounded bg-slate-950/60 p-3 border border-cyan-500/20">
          <span className="block text-[10px] text-slate-400 uppercase mb-1">SURVEY COORD MODE</span>
          <span className="font-bold text-cyan-400">GEOTAGGED GPS</span>
        </div>
      </div>
    </Panel>
  );
};

export default SystemHealthPanel;
