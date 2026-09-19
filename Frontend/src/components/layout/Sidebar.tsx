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
import { useMissionContext } from '@/context/MissionContext';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavGroup {
  title: string;
  items: {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { activeMission } = useMissionContext();
  const currentMissionId = activeMission?.id || 'MSN-2026-0145';

  const navGroups: NavGroup[] = [
    {
      title: 'OVERVIEW',
      items: [
        { to: ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'MISSIONS',
      items: [
        { to: '/mission-control', label: 'Mission Control', icon: Compass },
        { to: ROUTES.history, label: 'Mission Archive', icon: Archive },
      ],
    },
    {
      title: 'SONAR',
      items: [
        { to: ROUTES.sonarAnalysis, label: 'Sonar Analysis', icon: ScanLine },
        { to: ROUTES.missionNew, label: 'Sonar Data', icon: Upload },
      ],
    },
    {
      title: 'ANALYSIS',
      items: [
        { to: ROUTES.missionAnomalies.replace(':id', currentMissionId), label: 'Detections', icon: AlertTriangle },
        { to: ROUTES.missionMap.replace(':id', currentMissionId), label: 'Anomaly Map', icon: Globe },
        { to: ROUTES.missionReports.replace(':id', currentMissionId), label: 'Reports', icon: FileText },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { to: ROUTES.models, label: 'Model Center', icon: Cpu },
        { to: ROUTES.admin, label: 'System Status', icon: ShieldCheck },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-3 select-none overflow-y-auto scrollbar-thin">
      {/* Brand Header */}
      <div>
        <div className="mb-4 flex items-center gap-3 px-2 py-2.5 rounded-xl border border-[#B9C0C8]/15 bg-[#181B1F]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#242930] border border-[#B9C0C8]/30 text-[#D97732] shadow-sm">
            <Waves className="h-4 w-4 animate-pulse" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-sans text-xs font-black tracking-wider text-[#E8E5DF] truncate">
                MARIANATECH
              </span>
              <span className="font-sans text-[8.5px] tracking-widest text-[#B9C0C8]/70 uppercase font-bold truncate">
                OCEAN INTELLIGENCE
              </span>
            </div>
          )}
        </div>

        {/* Grouped Navigation Items */}
        <nav className="space-y-4">
          {navGroups.map((group, groupIdx) => (
            <div key={group.title} className={groupIdx > 0 ? 'pt-1' : ''}>
              {/* Category Heading */}
              {!isCollapsed ? (
                <div className="px-3 pb-1 font-sans text-[10px] font-semibold tracking-wider text-[#B9C0C8]/60 uppercase">
                  {group.title}
                </div>
              ) : (
                groupIdx > 0 && <div className="mx-2 my-2 border-t border-[#B9C0C8]/10" />
              )}

              <div className="space-y-0.5">
                {group.items.map((item) => {
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
                        return `group relative flex items-center gap-3 rounded-lg px-3 py-2 font-sans text-xs transition-all duration-150 ${
                          active
                            ? 'bg-[#242930] text-[#E8E5DF] border border-[#D97732]/40 font-semibold shadow-sm'
                            : 'text-[#B9C0C8] hover:bg-[#181B1F] hover:text-[#E8E5DF]'
                        }`;
                      }}
                    >
                      {/* Active left indicator bar */}
                      {isMatch && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r bg-[#D97732]" />
                      )}
                      <Icon className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-105 ${
                        isMatch ? 'text-[#D97732]' : 'text-[#B9C0C8]'
                      }`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Branding Info */}
      {!isCollapsed && (
        <div className="border-t border-[#B9C0C8]/15 pt-3 px-2 mt-auto">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[#D97732] animate-pulse" />
            <span className="font-sans text-[9.5px] font-semibold tracking-wider text-[#E8E5DF] uppercase">
              SUBSEA FLEET ACTIVE
            </span>
          </div>
          <p className="font-mono text-[8.5px] text-[#B9C0C8]/70">MoES · NIOT · PS 26057</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 flex h-9 w-9 items-center justify-center rounded-lg border border-[#B9C0C8]/30 bg-[#181B1F]/90 text-[#D97732] shadow-md backdrop-blur-md"
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
          <aside className="relative w-64 h-full bg-[#121518] border-r border-[#B9C0C8]/20 z-10">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 text-[#B9C0C8] hover:text-[#E8E5DF]"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop Navigation Rail */}
      <aside
        className={`hidden md:flex flex-col shrink-0 h-full z-30 bg-[#121518] border-r border-[#B9C0C8]/15 backdrop-blur-xl transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
