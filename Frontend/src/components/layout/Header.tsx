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
  LogOut,
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
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.login);
  };
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
    <header className="shrink-0 z-20 flex items-center justify-between border-b border-[#B9C0C8]/15 bg-[#121518]/95 px-4 py-2 select-none gap-4 backdrop-blur-md">
      {/* Left: Sidebar Toggle & Global Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl shrink">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-1.5 text-[#B9C0C8] hover:bg-[#181B1F] hover:text-[#D97732] transition-colors shrink-0"
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
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md min-w-[180px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#B9C0C8]/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search missions, telemetry, coordinates..."
            className="w-full rounded-lg border border-[#B9C0C8]/20 bg-[#181B1F] py-1.5 pl-9 pr-14 font-sans text-xs text-[#E8E5DF] placeholder-[#B9C0C8]/50 focus:border-[#D97732] focus:outline-none focus:ring-1 focus:ring-[#D97732]/30 transition-all truncate"
          />
          <span className="absolute right-2 top-2 hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono text-[#B9C0C8]/60 bg-[#101214] border border-[#B9C0C8]/15 rounded">
            Ctrl K
          </span>
        </form>
      </div>

      {/* Right: Operational Status Badges, Notifications & Operator Avatar */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Consolidated Operational Status Chip */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#B9C0C8]/20 bg-[#181B1F] px-3 py-1 shrink-0">
          <span className={`h-2 w-2 rounded-full ${backendStatus === 'online' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'bg-[#B94A48]'}`} />
          <span className="font-sans text-[11px] font-semibold tracking-wide text-[#E8E5DF]">
            {backendStatus === 'online' ? 'SYSTEM NOMINAL' : 'SERVER OFFLINE'}
          </span>
          <span className="text-[#B9C0C8]/30 hidden lg:inline">•</span>
          <span className="font-sans text-[10px] font-medium text-[#B9C0C8]/70 hidden lg:inline">
            TELEMETRY READY
          </span>
        </div>

        <div className="h-4 w-[1px] bg-[#B9C0C8]/15 hidden sm:block shrink-0" />

        {/* Notifications Icon with Badge */}
        <button
          onClick={() => navigate(ROUTES.history)}
          className="relative rounded-lg border border-[#B9C0C8]/15 bg-[#181B1F] p-1.5 text-[#B9C0C8] hover:text-[#E8E5DF] hover:bg-[#242930] transition-colors shrink-0"
          title="Notifications & Alerts"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 flex h-1.5 w-1.5 rounded-full bg-[#D97732]" />
        </button>

        {/* Operator Profile Avatar & Logout */}
        <div className="flex items-center gap-2 font-sans text-xs pl-1 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#242930] border border-[#B9C0C8]/25 text-[#D97732] font-bold shrink-0">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden sm:flex flex-col shrink-0 min-w-0">
            <span className="font-semibold text-[#E8E5DF] leading-tight truncate">{user?.user || 'Operator'}</span>
            <span className="font-sans text-[9px] text-[#D97732] uppercase font-semibold tracking-wider leading-tight truncate">{user?.role || 'Operator'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-1.5 text-[#B9C0C8] hover:text-[#B94A48] hover:bg-[#242930] transition-colors ml-0.5 shrink-0"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
