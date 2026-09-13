import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Database,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/api/client';
import { ROUTES } from '@/constants/routes';

interface HeaderProps {
  title?: string;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isSidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline'>('online');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let active = true;
    apiFetch<{ status: string }>('/health')
      .then(() => {
        if (active) setBackendStatus('online');
      })
      .catch(() => {
        if (active) setBackendStatus('offline');
      });
    return () => {
      active = false;
    };
  }, [location.pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${ROUTES.history}?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-cyan-500/20 bg-[#050D1A]/90 px-4 py-2.5 backdrop-blur-xl select-none gap-4">
      {/* Left: Sidebar Toggle & Global Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl shrink">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-1.5 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors shrink-0"
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        )}

        {/* Global Command Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md min-w-[160px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search missions, analyses, or detections..."
            className="w-full rounded-lg border border-cyan-500/30 bg-[#0A1628]/80 py-1.5 pl-9 pr-3 font-sans text-xs text-cyan-200 placeholder-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/40 transition-all truncate"
          />
        </form>
      </div>

      {/* Right: Operational Status Badges, Notifications & Operator Avatar */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Backend Online Status Pill */}
        <div className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-3 py-1 font-mono text-[10px] font-bold text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)] shrink-0">
          <span className={`h-2 w-2 rounded-full ${backendStatus === 'online' ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
          {backendStatus === 'online' ? 'SYSTEM ONLINE' : 'SERVER OFFLINE'}
        </div>

        {/* Ocean Data Status Pill */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 font-mono text-[10px] font-semibold text-cyan-300 shrink-0">
          <Database className="h-3 w-3 text-cyan-400 shrink-0" />
          <span>OCEAN DATA READY</span>
        </div>

        {/* AI Model Ready Pill */}
        <div className="hidden xl:flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 font-mono text-[10px] font-semibold text-cyan-300 shrink-0">
          <Cpu className="h-3 w-3 text-cyan-400 shrink-0" />
          <span>AI MODEL READY</span>
        </div>

        <div className="h-4 w-[1px] bg-cyan-500/20 hidden sm:block shrink-0" />

        {/* Notifications Icon with Badge */}
        <button
          onClick={() => navigate(ROUTES.history)}
          className="relative rounded-lg border border-cyan-500/20 bg-cyan-950/30 p-1.5 text-cyan-300 hover:bg-cyan-900/40 hover:text-white transition-colors shrink-0"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 font-mono text-[9px] font-bold text-white">
            1
          </span>
        </button>

        {/* Operator Profile Avatar */}
        <div className="flex items-center gap-2 font-mono text-xs pl-1 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-400/40 text-cyan-300 font-bold shadow-[0_0_10px_rgba(0,240,255,0.2)] shrink-0">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden sm:flex flex-col shrink-0">
            <span className="font-bold text-slate-100 leading-tight truncate">{user?.user || 'Lt. R. Mehta'}</span>
            <span className="text-[9px] text-cyan-400 uppercase font-semibold leading-tight truncate">{user?.role || 'Operator'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
