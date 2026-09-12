import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  UploadCloud,
  CheckCircle,
  Cpu,
  Eye,
  FileCheck,
  Check,
  AlertTriangle,
  Download,
  RefreshCw,
} from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { useMission } from '@/hooks/useMissions';
import { COLOURS } from '@/constants/colours';
import type { Mission } from '@/types/api';

const STAGES = [
  { key: 'upload', label: 'Upload', icon: UploadCloud },
  { key: 'validate', label: 'Validate', icon: FileCheck },
  { key: 'processing', label: 'Processing', icon: Cpu },
  { key: 'review', label: 'Review', icon: Eye },
  { key: 'complete', label: 'Complete', icon: CheckCircle },
];

export default function MissionMonitoring() {
  const { id } = useParams();
  const { mission, loading, error } = useMission(id);
  const [active, setActive] = useState(0);
  const [completed, setCompleted] = useState<boolean[]>(() => STAGES.map(() => false));
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  // Mock activity messages
  const mockMessages = [
    'Files uploaded successfully',
    'Files validated successfully',
    'AI model loaded',
    'Processing ping 1 of 247',
    'Processing ping 50 of 247',
    'Processing ping 124 of 247',
    'Processing ping 200 of 247',
    'Finalising outputs',
    'Results archived',
  ];

  // Start elapsed timer
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Advance pipeline every 3s and drive progress within that period
  useEffect(() => {
    if (!isRunning) return;
    setProgress(0);
    const progressTick = setInterval(() => {
      setProgress((p) => Math.min(100, +(p + 100 / 30).toFixed(2)));
    }, 100); // ~3s to reach 100

    const advance = setInterval(() => {
      setCompleted((c) => {
        const next = [...c];
        next[active] = true;
        return next;
      });
      setActive((a) => {
        const nxt = Math.min(STAGES.length - 1, a + 1);
        return nxt;
      });
      setProgress(0);
    }, 3000);

    return () => {
      clearInterval(progressTick);
      clearInterval(advance);
    };
  }, [active, isRunning]);

  // Reveal log messages one by one
  useEffect(() => {
    setLogs([]);
    let i = 0;
    const iv = setInterval(() => {
      setLogs((l) => [...l, `${new Date().toLocaleTimeString('en-GB')} — ${mockMessages[i % mockMessages.length]}`]);
      i += 1;
      if (i >= mockMessages.length) clearInterval(iv);
    }, 800);
    return () => clearInterval(iv);
  }, [id]);

  // Auto-scroll logs when appended
  useEffect(() => {
    if (!logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs.length]);

  // Reset/Retry handler
  function handleRetry() {
    setCompleted(STAGES.map(() => false));
    setActive(1);
    setIsRunning(true);
    setElapsed(0);
    setLogs([]);
  }

  // Derived values
  const pingsProcessed = Math.min(247, Math.floor((completed.filter(Boolean).length + progress / 100) * 60));
  const anomaliesFound = Math.max(0, mission?.anomaly_count ?? 0);

  // Simple error variant: if mission.status === 'failed'
  const isError = mission?.status === 'failed';

  return (
    <PageLayout title="Mission Monitoring">
      <div style={{ backgroundColor: COLOURS.background }} className="rounded-2xl border p-6" >
        <style>{`
          @keyframes bioGlowPulse { 0% { box-shadow: 0 0 0 0 rgba(83,74,183,0.4);} 70% { box-shadow: 0 0 0 14px rgba(83,74,183,0);} 100% { box-shadow: 0 0 0 0 rgba(83,74,183,0);} }
          @keyframes spinArc { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
          @keyframes bounce { 0% { transform: translateY(0);} 30% { transform: translateY(-6px);} 100% { transform: translateY(0);} }
          @keyframes shimmer { 0% { background-position: -200px 0 } 100% { background-position: 200px 0 } }
          .stage-circle { width:36px; height:36px; border-radius:9999px; display:inline-flex; align-items:center; justify-content:center; }
          .pulse-ring { animation: bioGlowPulse 1.8s infinite ease-in-out; }
          .spin-arc { position:absolute; width:48px; height:48px; border-radius:9999px; border:3px solid transparent; border-top-color: rgba(255,255,255,0.12); animation: spinArc 1.2s linear infinite; }
          .bounce { animation: bounce .6s cubic-bezier(.4,1.3,.6,1) forwards; }
          .progress-shimmer { background: linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 100%); background-size: 400px 100%; animation: shimmer 1.6s linear infinite; }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px);} to { opacity: 1; transform: translateY(0);} }
        `}</style>

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold" style={{ color: COLOURS.textPrimary }}>{mission?.name ?? 'Mission'}</h2>
            <p className="text-xs" style={{ color: COLOURS.seafloor.light }}>{mission?.id ?? id}</p>
          </div>
          <div className="text-right text-sm" style={{ color: COLOURS.seafloor.light }}>
            <div>AI Processing Pipeline</div>
            <div className="text-xs">Status: <span style={{ color: isError ? COLOURS.hazard.base : COLOURS.bio.base, fontWeight:600 }}>{mission?.status ?? 'processing'}</span></div>
          </div>
        </div>

        {isError && (
          <div className="mb-4 rounded p-3" style={{ backgroundColor: COLOURS.hazard.tint, border: `1px solid ${COLOURS.hazard.base}` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle style={{ color: COLOURS.hazard.base }} />
                <div>
                  <div className="font-semibold" style={{ color: COLOURS.hazard.base }}>Processing failed: insufficient sonar data quality</div>
                  <div className="text-xs" style={{ color: COLOURS.seafloor.light }}>Please retry or download raw logs for analysis.</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded px-3 py-1 text-sm font-semibold" style={{ color: COLOURS.hazard.base, border: `1px solid ${COLOURS.hazard.base}`, background: 'transparent' }} onClick={handleRetry}>
                  <RefreshCw size={14} /> Retry
                </button>
                <button className="rounded px-3 py-1 text-sm font-semibold" style={{ color: COLOURS.textPrimary, border: `1px solid ${COLOURS.seafloor.light}`, background: 'transparent' }}>
                  <Download size={14} /> Download Raw Log
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between w-full gap-4">
            {STAGES.map((s, i) => {
              const Icon = s.icon;
              const done = completed[i];
              const isActive = i === active && !isError;
              const isFailedActive = i === active && isError;
              return (
                <div key={s.key} className="flex-1 flex flex-col items-center text-center px-2">
                  <div className="relative mb-2">
                    <div className={`stage-circle ${isActive ? 'pulse-ring' : ''} ${done ? 'bounce' : ''}`} style={{ background: done ? COLOURS.reef.base : isFailedActive ? COLOURS.hazard.base : isActive ? COLOURS.bio.base : 'transparent', border: done || isActive || isFailedActive ? 'none' : `2px solid ${COLOURS.seafloor.light}` }}>
                      {done ? <Check size={16} color={COLOURS.white} /> : isFailedActive ? <AlertTriangle size={16} color={COLOURS.white} /> : <Icon size={16} color={isActive ? COLOURS.white : COLOURS.seafloor.light} />}
                    </div>
                    {isActive && !isError && <div className="spin-arc" style={{ borderTopColor: COLOURS.bio.light }} />}
                    {isFailedActive && <div className="spin-arc" style={{ borderTopColor: COLOURS.hazard.light }} />}
                  </div>
                  <div className="text-xs font-semibold" style={{ color: done || isActive ? COLOURS.textPrimary : COLOURS.seafloor.light }}>{s.label}</div>
                </div>
              );
            })}
          </div>

          {/* Progress bar under active stage */}
          <div className="mt-4 h-3 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: isError ? COLOURS.hazard.base : COLOURS.bio.base }} className={`relative transition-all duration-200 ${!isError ? 'progress-shimmer' : ''}`}>
              <div style={{ position: 'absolute', right: 8, top: -20, color: COLOURS.textPrimary, fontSize: 12 }}>{Math.floor(progress)}%</div>
            </div>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-2 rounded-md border p-3" style={{ borderColor: 'rgba(255,255,255,0.04)', maxHeight: 240, overflow: 'hidden' }}>
            <div className="text-sm font-semibold mb-2" style={{ color: COLOURS.textPrimary }}>Activity Log</div>
            <div ref={logRef} className="h-56 overflow-auto pr-2" style={{ background: 'transparent' }}>
              {logs.map((l, idx) => (
                <div key={idx} className="mb-2 transform transition-all duration-300" style={{ animation: 'fadeInUp .5s ease forwards' }}>
                  <div className="text-xs" style={{ color: COLOURS.seafloor.light }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border p-3" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            <div className="text-sm font-semibold mb-3" style={{ color: COLOURS.textPrimary }}>Stats</div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <div style={{ color: COLOURS.seafloor.light }}>Pings Processed</div>
                <div style={{ color: COLOURS.textPrimary, fontWeight:700 }}>{pingsProcessed}</div>
              </div>
              <div className="flex items-center justify-between">
                <div style={{ color: COLOURS.seafloor.light }}>Anomalies Found So Far</div>
                <div style={{ color: COLOURS.textPrimary, fontWeight:700 }}>{anomaliesFound}</div>
              </div>
              <div className="flex items-center justify-between">
                <div style={{ color: COLOURS.seafloor.light }}>Elapsed Time</div>
                <div style={{ color: COLOURS.textPrimary, fontWeight:700 }}>{new Date(elapsed * 1000).toISOString().substr(11, 8)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
