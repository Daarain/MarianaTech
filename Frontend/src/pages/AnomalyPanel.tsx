import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, X, HelpCircle, AlertTriangle, ChevronDown } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import EmptyState from '@/components/ui/EmptyState';
import ConfidenceBar from '@/components/ui/ConfidenceBar';
import Badge from '@/components/ui/Badge';
import { COLOURS } from '@/constants/colours';
import { getAnomalies, verifyAnomaly, rejectAnomaly } from '@/api/anomalies';
import { useMissionContext } from '@/context/MissionContext';
import type { Anomaly } from '@/api/mockData';

const CLASS_EMOJI: Record<string, string> = {
  unidentified_object: '👻',
  shipwreck: '⛵',
  pipeline_damage: '🛠️',
  debris_field: '🧰',
  marine_life_cluster: '🐟',
  mine_like_contact: '💣',
  geological_formation: '🪨',
};

type PriorityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';
type StatusFilter = 'all' | 'verified' | 'rejected' | 'pending_review' | 'unreviewed';

export default function AnomalyPanel() {
  const { id } = useParams();
  const { setSelectedAnomaly } = useMissionContext();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<'confidence' | 'priority' | 'date'>('confidence');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    getAnomalies(id)
      .then((data) => {
        if (!mounted) return;
        setAnomalies(data);
        setError(null);
      })
      .catch(() => setError('Failed to load anomalies'))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [id]);

  // Filters & sorting
  const filtered = useMemo(() => {
    let list = anomalies.slice();
    if (priorityFilter !== 'all') list = list.filter((a) => a.priority === priorityFilter);
    if (statusFilter !== 'all') {
      if (statusFilter === 'unreviewed') list = list.filter((a) => a.status === 'pending_review');
      else list = list.filter((a) => a.status === statusFilter);
    }
    if (sortBy === 'confidence') list.sort((a, b) => b.confidence - a.confidence);
    if (sortBy === 'priority') {
      const rank = { critical: 0, high: 1, medium: 2, low: 3 } as Record<string, number>;
      list.sort((a, b) => rank[a.priority] - rank[b.priority]);
    }
    if (sortBy === 'date') list.sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
    return list;
  }, [anomalies, priorityFilter, statusFilter, sortBy]);

  function optimisticUpdate(anomalyId: string, newStatus: Anomaly['status']) {
    setAnomalies((prev) => prev.map((a) => (a.id === anomalyId ? { ...a, status: newStatus } : a)));
  }

  async function handleConfirm(a: Anomaly) {
    optimisticUpdate(a.id, 'verified');
    try {
      await verifyAnomaly(a.id);
    } catch (e) {
      // rollback on failure
      optimisticUpdate(a.id, a.status);
    }
  }

  async function handleReject(a: Anomaly) {
    optimisticUpdate(a.id, 'rejected');
    try {
      await rejectAnomaly(a.id);
    } catch (e) {
      optimisticUpdate(a.id, a.status);
    }
  }

  function handleUnsure(a: Anomaly) {
    optimisticUpdate(a.id, 'pending_review');
  }

  function handleSelect(a: Anomaly) {
    setSelectedId(a.id);
    setSelectedAnomaly(a);
  }

  // Empty state variants
  if (!loading && anomalies.length === 0) {
    return (
      <PageLayout title="Anomaly Review">
        <div style={{ backgroundColor: COLOURS.background }} className="rounded-2xl border p-8">
          <EmptyState variant="no_data" title="No anomalies detected in this mission" message="" />
        </div>
      </PageLayout>
    );
  }

  if (loading) {
    return (
      <PageLayout title="Anomaly Review">
        <div style={{ backgroundColor: COLOURS.background }} className="rounded-2xl border p-8">
          <EmptyState variant="processing" title="Mission is still processing — check back soon" message="" />
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Anomaly Review">
        <div style={{ backgroundColor: COLOURS.background }} className="rounded-2xl border p-8">
          <EmptyState variant="error" title="Sonar quality insufficient for reliable detection" message={error} />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Anomaly Review">
      <div style={{ backgroundColor: COLOURS.background }} className="w-full">
        <style>{`
          @keyframes fadeUpStagger { from { opacity: 0; transform: translateY(8px); } to { opacity:1; transform: translateY(0);} }
          .card-enter { animation: fadeUpStagger 420ms ease both; }
          .selected-glow { box-shadow: 0 0 12px ${COLOURS.ocean.light}; border-left: 4px solid ${COLOURS.ocean.light}; }
          .hazard-pulse { box-shadow: 0 0 12px ${COLOURS.hazard.base}; }
        `}</style>

        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: COLOURS.textPrimary }}>Anomaly Review</h1>
            <p className="text-xs" style={{ color: COLOURS.seafloor.light }}>Mission {id}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'rgba(15,110,86,0.08)', color: COLOURS.reef.base }}>Confirmed {anomalies.filter(a => a.status === 'verified').length}</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'rgba(163,45,45,0.08)', color: COLOURS.hazard.base }}>Rejected {anomalies.filter(a => a.status === 'rejected').length}</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'rgba(83,74,183,0.08)', color: COLOURS.bio.base }}>Unsure {anomalies.filter(a => a.status === 'pending_review').length}</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs" style={{ backgroundColor: 'rgba(136,135,128,0.08)', color: COLOURS.seafloor.light }}>Unreviewed {anomalies.filter(a => a.status === 'pending_review').length}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button className={`px-3 py-1 rounded-full text-xs ${priorityFilter === 'all' ? 'font-semibold' : ''}`} style={{ color: COLOURS.textPrimary, background: 'transparent' }} onClick={() => setPriorityFilter('all')}>All</button>
              <button className={`px-3 py-1 rounded-full text-xs ${priorityFilter === 'critical' ? 'font-semibold' : ''}`} onClick={() => setPriorityFilter('critical')} style={{ color: COLOURS.hazard.base }}>Critical</button>
              <button className={`px-3 py-1 rounded-full text-xs ${priorityFilter === 'high' ? 'font-semibold' : ''}`} onClick={() => setPriorityFilter('high')} style={{ color: COLOURS.ocean.light }}>High</button>
              <button className={`px-3 py-1 rounded-full text-xs ${priorityFilter === 'medium' ? 'font-semibold' : ''}`} onClick={() => setPriorityFilter('medium')} style={{ color: COLOURS.bio.base }}>Medium</button>
              <button className={`px-3 py-1 rounded-full text-xs ${priorityFilter === 'low' ? 'font-semibold' : ''}`} onClick={() => setPriorityFilter('low')} style={{ color: COLOURS.seafloor.light }}>Low</button>
            </div>
            <div className="flex items-center gap-2">
              <button className={`px-3 py-1 rounded-full text-xs ${statusFilter === 'all' ? 'font-semibold' : ''}`} onClick={() => setStatusFilter('all')} style={{ color: COLOURS.textPrimary }}>All</button>
              <button className={`px-3 py-1 rounded-full text-xs ${statusFilter === 'verified' ? 'font-semibold' : ''}`} onClick={() => setStatusFilter('verified')} style={{ color: COLOURS.reef.base }}>Confirmed</button>
              <button className={`px-3 py-1 rounded-full text-xs ${statusFilter === 'rejected' ? 'font-semibold' : ''}`} onClick={() => setStatusFilter('rejected')} style={{ color: COLOURS.hazard.base }}>Rejected</button>
              <button className={`px-3 py-1 rounded-full text-xs ${statusFilter === 'pending_review' ? 'font-semibold' : ''}`} onClick={() => setStatusFilter('pending_review')} style={{ color: COLOURS.bio.base }}>Unsure</button>
              <button className={`px-3 py-1 rounded-full text-xs ${statusFilter === 'unreviewed' ? 'font-semibold' : ''}`} onClick={() => setStatusFilter('unreviewed')} style={{ color: COLOURS.seafloor.light }}>Unreviewed</button>
            </div>
            <div className="relative">
              <select className="px-3 py-1 rounded text-sm bg-transparent" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} style={{ color: COLOURS.textPrimary, border: '1px solid rgba(255,255,255,0.04)' }}>
                <option value="confidence">By Confidence (high → low)</option>
                <option value="priority">By Priority</option>
                <option value="date">By Date</option>
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: 8, top: 8, color: COLOURS.seafloor.light }} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((a, idx) => {
            const isSelected = selectedId === a.id;
            const delay = `${idx * 60}ms`;
            const sonarLow = a.confidence < 0.5;
            return (
              <div
                key={a.id}
                onClick={() => handleSelect(a)}
                className={`card-enter flex items-center justify-between gap-4 p-4 rounded-lg border`} 
                style={{
                  borderColor: 'rgba(255,255,255,0.04)',
                  background: 'rgba(255,255,255,0.01)',
                  animationDelay: delay,
                  ...(isSelected ? { boxShadow: `0 0 12px ${COLOURS.ocean.light}`, borderLeft: `4px solid ${COLOURS.ocean.light}` } : {}),
                }}
              >
                <div className="flex items-start gap-3" style={{ minWidth: 260 }}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-md text-2xl" style={{ background: 'rgba(255,255,255,0.02)' }}>{CLASS_EMOJI[a.class_name] ?? '❓'}</div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: COLOURS.textPrimary }}>{a.class_name.replace(/_/g, ' ')}</div>
                    <div className="text-xs" style={{ color: COLOURS.seafloor.light }}>{a.latitude !== null && a.longitude !== null ? `${a.latitude.toFixed(4)}, ${a.longitude.toFixed(4)}` : 'Coordinates unavailable'}</div>
                    <div className="text-xs" style={{ color: COLOURS.seafloor.light }}>Ping ref: {a.id.split('-').slice(-1)[0]}</div>
                  </div>
                </div>

                <div className="flex-1 px-4">
                  <ConfidenceBar value={a.confidence} colour={COLOURS.ocean.light} />
                </div>

                <div className="flex flex-col items-end gap-2" style={{ minWidth: 180 }}>
                  <Badge priority={a.priority} />
                  <div className="text-lg font-bold" style={{ color: COLOURS.ocean.light }}>{Math.round(a.confidence * 100)}%</div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleConfirm(a); }} className="px-3 py-1 rounded text-sm font-semibold" style={{ background: COLOURS.reef.base, color: COLOURS.white }}>
                      <Check size={14} /> Confirm
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleReject(a); }} className="px-3 py-1 rounded text-sm font-semibold" style={{ background: COLOURS.hazard.base, color: COLOURS.white }}>
                      <X size={14} /> Reject
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleUnsure(a); }} className="px-3 py-1 rounded text-sm font-semibold" style={{ background: COLOURS.bio.base, color: COLOURS.white }}>
                      <HelpCircle size={14} /> Unsure
                    </button>
                  </div>
                </div>

                {sonarLow && (
                  <div className="absolute left-4 right-4 bottom-2 rounded-b-md px-3 py-1 text-xs" style={{ background: 'rgba(255,165,0,0.08)', color: '#E07B00' }}>
                    Low sonar quality — result reliability reduced
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}
