import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  ScanLine,
  Upload,
  AlertTriangle,
  Globe,
  FileText,
  Archive,
  Cpu,
  ShieldCheck,
  Menu,
  X,
  Waves,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const NAV_ITEMS = [
  { to: ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/mission-control', label: 'Mission Control', icon: Compass },
  { to: ROUTES.sonarAnalysis, label: 'Sonar Analysis', icon: ScanLine },
  { to: ROUTES.missionNew, label: 'Sonar Data', icon: Upload },
  { to: ROUTES.missionAnomalies.replace(':id', 'MSN-2026-0142'), label: 'Detections', icon: AlertTriangle },
  { to: ROUTES.missionMap.replace(':id', 'MSN-2026-0142'), label: 'Anomaly Map', icon: Globe },
  { to: ROUTES.missionReports.replace(':id', 'MSN-2026-0142'), label: 'Reports', icon: FileText },
  { to: ROUTES.history, label: 'Mission Archive', icon: Archive },
  { to: ROUTES.models, label: 'Model Center', icon: Cpu },
  { to: ROUTES.admin, label: 'System Status', icon: ShieldCheck },
];

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-3 select-none">
      {/* Brand Header */}
      <div>
        <div className="mb-6 flex items-center gap-3 px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            <Waves className="h-5 w-5 animate-pulse" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-mono text-sm font-bold tracking-wider text-white">
                MARIANATECH
              </span>
              <span className="font-mono text-[9px] tracking-widest text-cyan-400 uppercase font-semibold">
                OCEAN INTELLIGENCE PLATFORM
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isMatch =
              location.pathname === item.to ||
              (item.to !== '/' && item.to !== ROUTES.dashboard && location.pathname.startsWith(item.to)) ||
              (item.to === '/mission-control' && location.pathname === ROUTES.dashboard);

            return (
              <NavLink
                key={item.to}
                to={item.to === '/mission-control' ? ROUTES.dashboard : item.to}
                onClick={() => setMobileOpen(false)}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) => {
                  const active = isMatch || isActive;
                  return `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 font-sans text-xs font-medium tracking-wide transition-all duration-200 ${
                    active
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,240,255,0.15)] font-semibold'
                      : 'text-slate-400 hover:bg-cyan-950/40 hover:text-cyan-300'
                  }`;
                }}
              >
                {/* Active left indicator pill */}
                {isMatch && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r bg-cyan-400 shadow-[0_0_8px_#00F0FF]" />
                )}
                <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Branding Info */}
      {!isCollapsed && (
        <div className="border-t border-cyan-500/20 pt-3 px-2">
          <div className="flex items-center gap-2 mb-1">
            <Waves className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="font-mono text-[10px] font-bold tracking-wider text-cyan-300 uppercase">
              CLEANER OCEANS
            </span>
          </div>
          <p className="font-mono text-[9px] text-slate-400">SAFER TOMORROW</p>
          <p className="mt-1 font-mono text-[9px] text-cyan-500/60">
            NIOT | MoES | SIH 2026 PS 26057
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-950/80 text-cyan-400 shadow-md backdrop-blur-md"
        aria-label="Open Navigation Menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 h-full bg-[#050D1A] border-r border-cyan-500/30 z-10">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-cyan-400"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop Navigation Rail */}
      <aside
        className={`hidden md:block shrink-0 h-screen sticky top-0 z-30 bg-[#050D1A]/90 border-r border-cyan-500/20 backdrop-blur-xl transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
