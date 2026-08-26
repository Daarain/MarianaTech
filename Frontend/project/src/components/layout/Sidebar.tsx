import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Upload, Activity, ScanLine,
  Map, AlertTriangle, FileText, Shield, X, Menu,
} from 'lucide-react';
import { COLOURS } from '@/constants/colours';
import { ROUTES } from '@/constants/routes';
import SonarRipple from '@/components/animations/SonarRipple';

const NAV_ITEMS = [
  { to: ROUTES.dashboard,        label: 'Dashboard',    icon: LayoutDashboard },
  { to: ROUTES.missionNew,       label: 'New Mission',  icon: Upload },
  { to: ROUTES.missionStatus,    label: 'Monitoring',   icon: Activity },
  { to: ROUTES.missionViewer,    label: 'Sonar Viewer', icon: ScanLine },
  { to: ROUTES.missionMap,       label: 'Map View',     icon: Map },
  { to: ROUTES.missionAnomalies, label: 'Anomalies',    icon: AlertTriangle },
  { to: ROUTES.missionReports,   label: 'Reports',      icon: FileText },
  { to: ROUTES.admin,            label: 'Admin',        icon: Shield },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <style>{`
        @keyframes slideInSidebar {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        @keyframes slideOutSidebar {
          from { transform: translateX(0);     opacity: 1; }
          to   { transform: translateX(-100%); opacity: 0; }
        }
        .sidebar-panel {
          animation: slideInSidebar 0.28s cubic-bezier(.4,0,.2,1) both;
        }
        .sidebar-overlay {
          animation: fadeIn 0.22s ease both;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .nav-item-icon {
          transition: transform 0.2s ease;
        }
        .nav-item:hover .nav-item-icon {
          transform: scale(1.15);
        }
      `}</style>

      {/* ── Hamburger toggle button — always visible ── */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        style={{
          position: 'fixed',
          top: 14,
          left: 16,
          zIndex: 60,
          width: 40,
          height: 40,
          borderRadius: 10,
          border: '1px solid rgba(55,138,221,0.25)',
          background: 'rgba(12,68,124,0.55)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          boxShadow: '0 2px 12px rgba(12,68,124,0.4)',
          transition: 'background 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(55,138,221,0.4)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(12,68,124,0.55)')}
      >
        <Menu size={20} strokeWidth={2} />
      </button>

      {/* ── Backdrop overlay ── */}
      {open && (
        <div
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 49,
            background: 'rgba(2,10,24,0.65)',
            backdropFilter: 'blur(3px)',
          }}
        />
      )}

      {/* ── Sidebar panel ── */}
      {open && (
        <aside
          className="sidebar-panel"
          style={{
            position: 'fixed',
            inset: '0 auto 0 0',
            zIndex: 50,
            width: 248,
            display: 'flex',
            flexDirection: 'column',
            background: `linear-gradient(180deg, #0a1e3d 0%, #091628 60%, #060f1e 100%)`,
            borderRight: '1px solid rgba(55,138,221,0.15)',
            boxShadow: '4px 0 32px rgba(12,68,124,0.45)',
          }}
        >
          {/* Header row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 16px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <SonarRipple size={34} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>
                  Marine AI
                </div>
                <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                  Anomaly Detection
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.5)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
              }}
            >
              <X size={15} strokeWidth={2} />
            </button>
          </div>

          {/* Nav items */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to.replace(':id', 'MSN-2026-0142')}
                  className="nav-item"
                  onClick={() => setOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    padding: '10px 12px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'all 0.18s ease',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                    background: isActive
                      ? `linear-gradient(90deg, ${COLOURS.bio.base}cc, ${COLOURS.bio.base}88)`
                      : 'transparent',
                    boxShadow: isActive
                      ? `0 0 18px ${COLOURS.bio.base}44, inset 0 0 12px rgba(255,255,255,0.04)`
                      : 'none',
                    borderLeft: isActive
                      ? `3px solid ${COLOURS.bio.light ?? COLOURS.bio.base}`
                      : '3px solid transparent',
                  })}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    if (!el.dataset.active) {
                      el.style.background = 'rgba(255,255,255,0.05)';
                      el.style.color = '#fff';
                    }
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    if (!el.dataset.active) {
                      el.style.background = 'transparent';
                      el.style.color = 'rgba(255,255,255,0.55)';
                    }
                  }}
                >
                  {({ isActive }) => (
                    <>
                      <span className="nav-item-icon" style={{ opacity: isActive ? 1 : 0.7 }}>
                        <Icon size={17} strokeWidth={2} />
                      </span>
                      {item.label}
                      {isActive && (
                        <span style={{
                          marginLeft: 'auto',
                          width: 6, height: 6,
                          borderRadius: '50%',
                          background: COLOURS.bio.light ?? '#fff',
                          boxShadow: `0 0 6px ${COLOURS.bio.base}`,
                        }} />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Footer status */}
          <div style={{
            padding: '14px 16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>
              System Status
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: COLOURS.reef.light,
                boxShadow: `0 0 6px ${COLOURS.reef.light}`,
                display: 'inline-block',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                All systems operational
              </span>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
