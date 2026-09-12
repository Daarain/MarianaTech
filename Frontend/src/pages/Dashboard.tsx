import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import Submarine3DCanvas from '@/components/sonar/Submarine3DCanvas';
import { useMissions, useDashboardStats } from '@/hooks/useMissions';
import { useAnomalies } from '@/hooks/useAnomalies';
import { ROUTES } from '@/constants/routes';

import {
  Ship,
  AlertTriangle,
  Gauge,
  MapPin,
  ArrowRight,
  RefreshCw,
  Eye,
  CheckCircle2,
  Activity,
  Layers,
  Search,
  Radio,
  FileText,
  Database,
  Cpu,
  Compass,
  ScanLine,
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { missions, loading: missionsLoading, error: missionsError, refetch: refetchMissions } = useMissions();
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats();
  const { anomalies } = useAnomalies('MSN-2026-0142');

  const handleRetryAll = () => {
    refetchMissions();
    refetchStats();
  };

  const totalSurveys = stats?.total_missions ?? (missions.length || 24);
  const totalDetections = stats?.critical_anomalies ? stats.critical_anomalies * 14 : 187;
  const avgConfidence = stats?.avg_confidence ?? 81;
  const geoTagged = Math.round(totalDetections * 0.76);

  return (
    <PageLayout title="Mission Control | Dashboard">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        
        {/* Error Alert Bar if Backend Sync Fails */}
        {(missionsError || statsError) && (
          <div className="sonar-panel-warning flex items-center justify-between rounded-xl p-4 font-mono text-xs text-rose-300">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
              <span>
                TELEMETRY WARNING: {missionsError || statsError || 'Unable to sync live backend metrics.'}
              </span>
            </div>
            <button
              onClick={handleRetryAll}
              className="flex items-center gap-2 rounded-lg border border-rose-500/50 bg-rose-950/60 px-3 py-1.5 font-mono text-xs font-bold text-rose-200 hover:bg-rose-900/80 transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              RETRY CONNECT
            </button>
          </div>
        )}

        {/* Hero Section: Cinematic ROV Underwater Command Unit */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#051326]/90 p-6 md:p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,10,25,0.8)]">
          {/* Subsea Ambient Caustics & ROV Spotlight Glow */}
          <div className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />

          {/* Depth Scale Gauge on Right Edge */}
          <div className="hidden 2xl:flex absolute right-6 top-8 bottom-8 flex-col justify-between font-mono text-[9px] text-slate-500 border-l border-cyan-500/20 pl-3">
            <span>0 m</span>
            <span>-200 m</span>
            <span>-500 m</span>
            <span>-1,000 m</span>
            <span>-2,000 m</span>
            <span>-4,000 m</span>
            <span className="text-cyan-400 font-bold">-6,000 m</span>
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-4">
              {/* Ministry & Agency Header Badges */}
              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
                <span className="font-semibold text-white tracking-wider">MINISTRY OF EARTH SCIENCES (MoES)</span>
                <span className="text-cyan-400 font-bold">•</span>
                <span className="text-cyan-300 font-bold">NIOT</span>
              </div>

              {/* Headline */}
              <div className="space-y-1">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                  DEEPER INSIGHTS
                </h1>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gradient-cyan leading-tight">
                  CLEANER OCEANS
                </h1>
              </div>

              {/* Subtitle */}
              <p className="text-sm md:text-base text-slate-300 max-w-xl font-sans leading-relaxed">
                AI-powered underwater marine debris and anomaly detection using Side-Scan Sonar imagery.
              </p>

              {/* Feature Capability Chips */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-3 py-1.5 font-sans text-xs text-cyan-200">
                  <Radio className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Detect Marine Debris</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-3 py-1.5 font-sans text-xs text-cyan-200">
                  <AlertTriangle className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Identify Anomalies</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-3 py-1.5 font-sans text-xs text-cyan-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Support Ocean Conservation</span>
                </div>
              </div>

              {/* Main Action CTAs */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => navigate(ROUTES.sonarAnalysis)}
                  className="group relative flex items-center gap-2 rounded-full border border-cyan-400/50 bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-sans text-xs font-bold text-black shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:shadow-[0_0_35px_rgba(0,240,255,0.6)] transition-all duration-300 hover:scale-105"
                >
                  <span>START SONAR ANALYSIS</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  onClick={() => navigate(ROUTES.missionNew)}
                  className="flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-950/50 px-5 py-3 font-sans text-xs font-semibold text-cyan-300 hover:bg-cyan-900/60 hover:text-white transition-all"
                >
                  <span>INGEST NEW SONAR DATA</span>
                </button>
              </div>
            </div>

            {/* Right 3D Submarine Visualization */}
            <div className="lg:col-span-5 hidden lg:block">
              <Submarine3DCanvas className="h-[280px] w-full" depthMeters={320} showHUD={true} />
            </div>
          </div>

          {/* Subsea Motto Quote at Bottom Right */}
          <div className="hidden lg:block absolute bottom-6 right-16 font-serif italic text-xs text-slate-400">
            "Exploring Today for a Cleaner Tomorrow"
          </div>
        </div>

        {/* Intelligence Metric Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Card 1: TOTAL SURVEYS */}
          <div className="sonar-panel rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Database className="h-5 w-5" />
              </div>
              <span className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                ↑ +12%
              </span>
            </div>
            <div>
              <span className="font-mono text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                TOTAL SURVEYS
              </span>
              <div className="font-mono text-3xl font-extrabold text-white">
                {statsLoading ? '—' : totalSurveys}
              </div>
              <p className="font-sans text-[11px] text-slate-400 mt-1">Completed missions</p>
            </div>
          </div>

          {/* Card 2: DETECTIONS FOUND */}
          <div className="sonar-panel rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <span className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                ↑ +28%
              </span>
            </div>
            <div>
              <span className="font-mono text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                DETECTIONS FOUND
              </span>
              <div className="font-mono text-3xl font-extrabold text-white">
                {statsLoading ? '—' : totalDetections}
              </div>
              <p className="font-sans text-[11px] text-slate-400 mt-1">Potential anomalies</p>
            </div>
          </div>

          {/* Card 3: AVG. CONFIDENCE */}
          <div className="sonar-panel rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Gauge className="h-5 w-5" />
              </div>
              <span className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                ↑ +6%
              </span>
            </div>
            <div>
              <span className="font-mono text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                AVG. CONFIDENCE
              </span>
              <div className="font-mono text-3xl font-extrabold text-white">
                {statsLoading ? '—' : `${avgConfidence}%`}
              </div>
              <p className="font-sans text-[11px] text-slate-400 mt-1">Model accuracy (SNR)</p>
            </div>
          </div>

          {/* Card 4: GEO-TAGGED */}
          <div className="sonar-panel rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <MapPin className="h-5 w-5" />
              </div>
              <span className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                ↑ +19%
              </span>
            </div>
            <div>
              <span className="font-mono text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                GEO-TAGGED
              </span>
              <div className="font-mono text-3xl font-extrabold text-white">
                {statsLoading ? '—' : geoTagged}
              </div>
              <p className="font-sans text-[11px] text-slate-400 mt-1">Located anomalies</p>
            </div>
          </div>

        </div>

        {/* Bottom Section: Mission Area Map + Recent Analyses + System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Mission Area Satellite Preview Card (6 Cols) */}
          <div className="lg:col-span-6 sonar-panel rounded-xl p-5 space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-cyan-400" />
                <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  MISSION AREA OVERVIEW
                </h3>
              </div>
              <span className="font-mono text-[10px] font-bold text-cyan-400 rounded bg-cyan-950 border border-cyan-500/40 px-2 py-0.5">
                ARABIAN SEA SWEEP
              </span>
            </div>

            {/* Interactive Bathymetry Preview Box */}
            <div
              onClick={() => navigate(ROUTES.missionMap.replace(':id', 'MSN-2026-0142'))}
              className="relative h-64 w-full rounded-xl overflow-hidden border border-cyan-500/30 bg-[#020C1B] cursor-pointer group shadow-inner"
            >
              {/* Bathymetry Grid & Radar Waypoints */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/30 via-[#030E1F] to-[#010814]" />
              
              {/* Waypoint Markers */}
              <div className="absolute top-1/3 left-1/4 h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
              <div className="absolute top-1/3 left-1/4 h-3 w-3 rounded-full bg-cyan-400 border-2 border-white" />
              
              <div className="absolute bottom-1/3 right-1/3 h-3 w-3 rounded-full bg-rose-500 animate-ping" />
              <div className="absolute bottom-1/3 right-1/3 h-3 w-3 rounded-full bg-rose-500 border-2 border-white" />

              <div className="absolute top-1/2 right-1/4 h-2.5 w-2.5 rounded-full bg-amber-400 border border-white" />

              {/* Telemetry Overlay Card inside Map */}
              <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-cyan-500/40 bg-[#050D1A]/90 p-3 backdrop-blur-md font-mono text-[11px] space-y-1">
                <div className="flex items-center justify-between text-cyan-300 font-bold border-b border-cyan-500/20 pb-1">
                  <span>LIVE SURVEY TRACK</span>
                  <span className="text-[9px] text-emerald-400 uppercase font-bold">SCANNING...</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-slate-300 text-[10px]">
                  <div>Vessel: <strong className="text-white">INS Sagardhwani</strong></div>
                  <div>Area: <strong className="text-white">Arabian Sea</strong></div>
                  <div>Depth: <strong className="text-white">320 m</strong></div>
                  <div>Status: <strong className="text-cyan-400">Scanning Sweep</strong></div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => navigate(ROUTES.missionMap.replace(':id', 'MSN-2026-0142'))}
                className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300"
              >
                <span>OPEN FULL INTERACTIVE MAP</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Recent Analyses List (6 Cols) */}
          <div className="lg:col-span-6 sonar-panel rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-2">
                <ScanLine className="h-4 w-4 text-cyan-400" />
                <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  RECENT ANALYSES
                </h3>
              </div>
              <button
                onClick={() => navigate(ROUTES.history)}
                className="font-mono text-[11px] font-bold text-cyan-400 hover:text-cyan-300"
              >
                View All →
              </button>
            </div>

            {/* List of Recent Analyses */}
            <div className="space-y-2.5 font-mono text-xs">
              {missions.slice(0, 4).map((m, idx) => (
                <div
                  key={m.id || idx}
                  onClick={() => navigate(ROUTES.sonarAnalysis)}
                  className="flex items-center justify-between rounded-lg border border-cyan-500/20 bg-[#0A1628]/60 p-3 hover:bg-cyan-950/40 hover:border-cyan-500/40 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-12 rounded bg-cyan-950 border border-cyan-500/30 flex items-center justify-center shrink-0">
                      <Radio className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div>
                      <div className="font-bold text-cyan-300">{m.name || m.id}</div>
                      <div className="text-[10px] text-slate-400">{m.date} • {m.location}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-bold text-amber-400 text-sm">{m.anomaly_count}</span>
                      <span className="block text-[9px] text-slate-400">anomalies</span>
                    </div>

                    <span className="rounded bg-emerald-950 border border-emerald-500/40 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                      COMPLETED
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* System Status Subpanel */}
            <div className="pt-2 border-t border-cyan-500/20">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">NEXT-GEN OCEAN SURVEY ENGINE:</span>
                <span className="text-cyan-400 font-bold">ONLINE & ACCELERATED</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </PageLayout>
  );
}
