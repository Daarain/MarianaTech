import { Bell } from 'lucide-react';
import { COLOURS } from '@/constants/colours';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { user } = useAuth();
  const initials = (user?.user ?? 'OP')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px 12px 68px', // 68px left padding to clear the hamburger button
        backgroundColor: 'rgba(10, 22, 40, 0.88)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 1px 0 rgba(55,138,221,0.08)',
      }}
    >
      {/* Page title */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: COLOURS.textPrimary, margin: 0 }}>
        {title}
      </h2>

      {/* Right side actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Notification bell */}
        <button
          style={{
            position: 'relative',
            width: 38,
            height: 38,
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: COLOURS.seafloor.light,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.color = COLOURS.seafloor.light;
          }}
        >
          <Bell size={18} />
          {/* Red dot */}
          <span style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: COLOURS.hazard.light,
            boxShadow: `0 0 6px ${COLOURS.hazard.light}`,
            border: '1.5px solid rgba(10,22,40,0.9)',
          }} />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)' }} />

        {/* User avatar + info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'default' }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${COLOURS.ocean.base}, ${COLOURS.ocean.light})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
            boxShadow: `0 0 12px ${COLOURS.ocean.base}66`,
            border: '1.5px solid rgba(55,138,221,0.3)',
            letterSpacing: '0.04em',
          }}>
            {initials}
          </div>
          <div style={{ display: 'none' }} className="sm-show">
            <div style={{ fontSize: 13, fontWeight: 600, color: COLOURS.textPrimary, lineHeight: 1.2 }}>
              {user?.user ?? 'Operator'}
            </div>
            <div style={{ fontSize: 11, color: COLOURS.seafloor.light, textTransform: 'capitalize', lineHeight: 1.2 }}>
              {user?.role ?? 'operator'}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 480px) {
          .sm-show { display: block !important; }
        }
      `}</style>
    </header>
  );
}
