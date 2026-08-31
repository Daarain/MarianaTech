import { Shield, Lock, Users, ServerCog, TrendingUp, Download, Eye } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import EmptyState from '@/components/ui/EmptyState';
import { COLOURS } from '@/constants/colours';
import { useAuth } from '@/hooks/useAuth';

type ModelRow = { id: string; version: string; type: string; status: 'active' | 'staged' | 'retired'; map: number; deployed: string };
type UserRow = { id: string; name: string; role: 'admin' | 'operator'; lastActive: string; enabled: boolean };

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const steps = Math.max(8, Math.round(duration / 40));
    const inc = target / steps;
    const iv = setInterval(() => {
      start += inc;
      if (start >= target) {
        setValue(target);
        clearInterval(iv);
      } else setValue(Math.round(start));
    }, duration / steps);
    return () => clearInterval(iv);
  }, [target, duration]);
  return value;
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role ?? 'operator';
  const isAdmin = role === 'admin';

  // mock metrics
  const metrics = useMemo(() => ({ missions: 1242, anomalies: 8421, uptime: 99.7, operators: 18 }), []);
  const missionsCount = useCountUp(metrics.missions);
  const anomaliesCount = useCountUp(metrics.anomalies);
  const uptimeCount = useCountUp(Math.round(metrics.uptime));
  const operatorsCount = useCountUp(metrics.operators);

  // Move these hook calls out of JSX to follow Rules of Hooks
  const accuracyCount = useCountUp(92);
  const falsePositiveCount = useCountUp(3);
  const processingCount = useCountUp(42);
  const inferencesCount = useCountUp(120304);

  const modelsInit: ModelRow[] = [
    { id: 'mdl-a1', version: '1.4.2', type: 'CNN', status: 'active', map: 0.87, deployed: '2026-07-02' },
    { id: 'mdl-b7', version: '2.0.0-rc', type: 'Transformer', status: 'staged', map: 0.81, deployed: '2026-08-10' },
    { id: 'mdl-x9', version: '0.9.8', type: 'Hybrid', status: 'retired', map: 0.74, deployed: '2025-12-01' },
  ];
  const [models] = useState<ModelRow[]>(modelsInit);

  const usersInit: UserRow[] = [
    { id: 'u1', name: 'Lt. R. Mehta', role: 'operator', lastActive: '2026-08-24T10:12:00Z', enabled: true },
    { id: 'u2', name: 'Cdr. A. Fernando', role: 'admin', lastActive: '2026-08-24T09:02:00Z', enabled: true },
    { id: 'u3', name: 'Lt. K. Pillai', role: 'operator', lastActive: '2026-08-20T14:22:00Z', enabled: false },
  ];
  const [users, setUsers] = useState<UserRow[]>(usersInit);

  function toggleUser(id: string) {
    setUsers((u) => u.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x)));
  }

  const effectiveRole = role;

  return (
    <PageLayout title="Admin">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform: translateY(8px);} to { opacity:1; transform: translateY(0);} }
        .section { animation: fadeUp .5s ease both; }
        .stagger-1 { animation-delay: 0ms; }
        .stagger-2 { animation-delay: 200ms; }
        .stagger-3 { animation-delay: 400ms; }
        .stagger-4 { animation-delay: 600ms; }
        .metric-card { transition: transform .18s ease, box-shadow .18s ease; }
        .metric-num { font-variant-numeric: tabular-nums; }
        .model-row { transform: translateX(-10px); opacity:0; animation: modelIn .4s forwards; }
        @keyframes modelIn { to { transform: translateX(0); opacity:1; } }
      `}</style>

      <div style={{ backgroundColor: COLOURS.background }} className="rounded-2xl border p-6">
        {effectiveRole !== 'admin' ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Lock size={56} style={{ color: COLOURS.seafloor.light }} />
            <h2 className="mt-4 text-xl font-semibold" style={{ color: COLOURS.textPrimary }}>Admin Access Required</h2>
            <p className="mt-2 text-sm" style={{ color: COLOURS.seafloor.light }}>You need administrator privileges to view this page</p>
            <div className="mt-4">
              <button onClick={() => navigate('/')} className="px-4 py-2 rounded" style={{ background: COLOURS.ocean.light, color: COLOURS.white }}>Go to Dashboard</button>
            </div>
          </div>
        ) : (
          <div>
            {/* Section 1 - System Status */}
            <div className="section stagger-1 mb-6">
              <div className="flex items-stretch gap-4">
                <div className="metric-card flex-1 rounded p-4 border" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-3"><ServerCog /><div className="metric-num text-2xl font-bold" style={{ color: COLOURS.textPrimary }}>{missionsCount}</div></div>
                  <div className="text-xs" style={{ color: COLOURS.seafloor.light }}>Total Missions Processed</div>
                </div>
                <div className="metric-card flex-1 rounded p-4 border" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-3"><TrendingUp /><div className="metric-num text-2xl font-bold" style={{ color: COLOURS.textPrimary }}>{anomaliesCount}</div></div>
                  <div className="text-xs" style={{ color: COLOURS.seafloor.light }}>Total Anomalies Detected</div>
                </div>
                <div className="metric-card flex-1 rounded p-4 border" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-3"><ServerCog /><div className="metric-num text-2xl font-bold" style={{ color: COLOURS.textPrimary }}>{uptimeCount}%</div></div>
                  <div className="text-xs" style={{ color: COLOURS.seafloor.light }}>Model Uptime</div>
                </div>
                <div className="metric-card flex-1 rounded p-4 border" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-3"><Users /><div className="metric-num text-2xl font-bold" style={{ color: COLOURS.textPrimary }}>{operatorsCount}</div></div>
                  <div className="text-xs" style={{ color: COLOURS.seafloor.light }}>Active Operators</div>
                </div>
              </div>
            </div>

            {/* Section 2 - Model Versions */}
            <div className="section stagger-2 mb-6">
              <h3 className="text-sm font-semibold mb-3" style={{ color: COLOURS.textPrimary }}>AI Model Versions</h3>
              <div className="rounded border" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ color: COLOURS.seafloor.light }}>
                      <th className="px-3 py-2">Model ID</th>
                      <th className="px-3 py-2">Version</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">mAP</th>
                      <th className="px-3 py-2">Deployed</th>
                      <th className="px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map((m, i) => (
                      <tr key={m.id} className="model-row" style={{ animationDelay: `${i*80}ms` }}>
                        <td className="px-3 py-2" style={{ color: COLOURS.textPrimary }}>{m.id}</td>
                        <td className="px-3 py-2" style={{ color: COLOURS.seafloor.light }}>{m.version}</td>
                        <td className="px-3 py-2" style={{ color: COLOURS.seafloor.light }}>{m.type}</td>
                        <td className="px-3 py-2">
                          <span style={{ padding:'4px 8px', borderRadius:999, background: m.status==='active'? 'rgba(15,110,86,0.08)': m.status==='staged'? 'rgba(83,74,183,0.08)': 'rgba(136,135,128,0.08)', color: m.status==='active'? COLOURS.reef.base: m.status==='staged'? COLOURS.bio.base: COLOURS.seafloor.light }}>{m.status}</span>
                        </td>
                        <td className="px-3 py-2" style={{ color: COLOURS.textPrimary }}>{Math.round(m.map*100)}%</td>
                        <td className="px-3 py-2" style={{ color: COLOURS.seafloor.light }}>{m.deployed}</td>
                        <td className="px-3 py-2">
                          {m.status === 'staged' && <button className="px-3 py-1 rounded" style={{ border:`1px solid ${COLOURS.bio.base}`, color: COLOURS.bio.base, background:'transparent' }}>Set Active</button>}
                          <button className="px-3 py-1 rounded ml-2" style={{ background:'transparent', border:`1px solid rgba(255,255,255,0.04)`, color: COLOURS.textPrimary }}><Eye size={14} /> View Metrics</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3 - Performance Metrics */}
            <div className="section stagger-3 mb-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="rounded p-4 border" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <div className="text-xs" style={{ color: COLOURS.seafloor.light }}>Detection Accuracy</div>
                  <div className="text-2xl font-bold" style={{ color: COLOURS.textPrimary }}>{accuracyCount}%</div>
                </div>
                <div className="rounded p-4 border" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <div className="text-xs" style={{ color: COLOURS.seafloor.light }}>False Positive Rate</div>
                  <div className="text-2xl font-bold" style={{ color: COLOURS.textPrimary }}>{falsePositiveCount}%</div>
                </div>
                <div className="rounded p-4 border" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <div className="text-xs" style={{ color: COLOURS.seafloor.light }}>Avg Processing Time</div>
                  <div className="text-2xl font-bold" style={{ color: COLOURS.textPrimary }}>{processingCount}s</div>
                </div>
                <div className="rounded p-4 border" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <div className="text-xs" style={{ color: COLOURS.seafloor.light }}>Total Inferences</div>
                  <div className="text-2xl font-bold" style={{ color: COLOURS.textPrimary }}>{inferencesCount}</div>
                </div>
              </div>
            </div>

            {/* Section 4 - User Management */}
            <div className="section stagger-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: COLOURS.textPrimary }}>User Management</h3>
              <div className="rounded border" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ color: COLOURS.seafloor.light }}>
                      <th className="px-3 py-2">User</th>
                      <th className="px-3 py-2">Role</th>
                      <th className="px-3 py-2">Last Active</th>
                      <th className="px-3 py-2">Enabled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u.id} className="" style={{ animation: 'fadeUp .4s both', animationDelay: `${i*80}ms` }}>
                        <td className="px-3 py-2" style={{ color: COLOURS.textPrimary }}><div className="inline-flex items-center gap-3"><div style={{ width:32,height:32,borderRadius:999,background:'rgba(255,255,255,0.03)',display:'flex',alignItems:'center',justifyContent:'center' }}>{u.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</div>{u.name}</div></td>
                        <td className="px-3 py-2"><span style={{ padding:'4px 8px', borderRadius:999, background: u.role==='admin' ? 'rgba(163,45,45,0.08)' : 'rgba(55,138,221,0.08)', color: u.role==='admin'? COLOURS.hazard.base: COLOURS.ocean.light }}>{u.role}</span></td>
                        <td className="px-3 py-2" style={{ color: COLOURS.seafloor.light }}>{new Date(u.lastActive).toLocaleString()}</td>
                        <td className="px-3 py-2">
                          <label style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                            <input type="checkbox" checked={u.enabled} onChange={() => toggleUser(u.id)} />
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
