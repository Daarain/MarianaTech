import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ship, AlertTriangle, Gauge, ClipboardCheck, ChevronRight } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import StatCard from '@/components/ui/StatCard';
import StatusChip from '@/components/ui/StatusChip';
import Badge from '@/components/ui/Badge';
import OceanWave from '@/components/animations/OceanWave';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { COLOURS } from '@/constants/colours';
import { useMissions, useDashboardStats } from '@/hooks/useMissions';
import { formatDate, formatCoordinate } from '@/utils/formatters';
import type { Mission } from '@/api/mockData';

function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateStr = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="text-right">
      <p className="font-mono text-sm font-semibold" style={{ color: COLOURS.ocean.light }}>
        {dateStr}
      </p>
      <p className="font-mono text-lg font-bold tabular-nums" style={{ color: COLOURS.ocean.light }}>
        {timeStr}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { missions, loading, error } = useMissions();
  const { stats, loading: statsLoading } = useDashboardStats();

  return (
    <PageLayout title="Mission Dashboard">
      {/* Hero banner */}
      <div
        className="relative mb-6 overflow-hidden rounded-2xl border-b-2 pb-6 pt-6 pl-6 pr-6"
        style={{
          backgroundColor: 'rgba(12, 68, 124, 0.15)',
          borderBottomColor: 'rgba(55, 138, 221, 0.30)',
        }}
      >
        <div className="relative flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold" style={{ color: COLOURS.white }}>
              Marine Anomaly Intelligence
            </h3>
            <p className="mt-1 text-sm" style={{ color: COLOURS.seafloor.light }}>
              Real-time underwater debris detection and analysis
            </p>
          </div>
          <LiveClock />
        </div>

        <div className="pointer-events-none absolute -bottom-8 left-0 right-0 h-16 overflow-hidden">
          <OceanWave className="!top-0" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Ship}
          label="Total Missions"
          value={statsLoading ? '—' : stats?.total_missions ?? 0}
          colour={COLOURS.ocean}
          delay={0}
        />
        <StatCard
          icon={AlertTriangle}
          label="Critical Anomalies"
          value={statsLoading ? '—' : stats?.critical_anomalies ?? 0}
          colour={COLOURS.hazard}
          delay={100}
          pulse
        />
        <StatCard
          icon={Gauge}
          label="Avg Confidence"
          value={statsLoading ? '—' : `${stats?.avg_confidence ?? 0}%`}
          colour={COLOURS.reef}
          delay={200}
        />
        <StatCard
          icon={ClipboardCheck}
          label="Pending Review"
          value={statsLoading ? '—' : stats?.pending_review ?? 0}
          colour={COLOURS.bio}
          delay={300}
        />
      </div>

      <div className="mt-6 rounded-2xl border overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: COLOURS.seafloor.light }}>
            Active Missions
          </h3>
          <span className="text-xs" style={{ color: COLOURS.seafloor.light }}>
            {missions.length} missions
          </span>
        </div>

        {loading ? (
          <div className="p-5"><LoadingSkeleton rows={5} /></div>
        ) : error ? (
          <EmptyState variant="error" message={error} />
        ) : missions.length === 0 ? (
          <EmptyState variant="no_data" />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {['Mission ID', 'Date', 'Location', 'Status', 'Anomalies', 'Priority', 'Action'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: COLOURS.seafloor.light }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {missions.map((m: Mission) => (
                  <tr
                    key={m.id}
                    className="group relative border-b transition-colors duration-200 hover:bg-ocean/10"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                  >
                    
                    <td className="px-5 py-4">
                      <p className="font-mono text-sm font-bold" style={{ color: COLOURS.textPrimary }}>{m.id}</p>
                      <p className="text-xs" style={{ color: COLOURS.seafloor.light }}>{m.name}</p>
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: COLOURS.textPrimary }}>{formatDate(m.date)}</td>
                    <td className="px-5 py-4">
                      <p className="text-sm" style={{ color: COLOURS.textPrimary }}>{m.location}</p>
                      <p className="font-mono text-xs" style={{ color: COLOURS.seafloor.light }}>{formatCoordinate(m.latitude, m.longitude)}</p>
                    </td>
                    <td className="px-5 py-4"><StatusChip status={m.status} /></td>
                    <td className="px-5 py-4 text-center text-sm font-semibold tabular-nums" style={{ color: COLOURS.white }}>{m.anomaly_count}</td>
                    <td className="px-5 py-4"><Badge priority={m.priority} /></td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => navigate(`/missions/${m.id}/status`)}
                        className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-80"
                        style={{ color: COLOURS.ocean.light }}
                      >
                        View <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
