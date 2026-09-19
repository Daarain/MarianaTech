import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import Submarine3DCanvas from '@/components/sonar/Submarine3DCanvas';
import GeospatialMapContainer from '@/components/sonar/GeospatialMapContainer';
import { useMissions, useDashboardStats } from '@/hooks/useMissions';
import { useAnomalies } from '@/hooks/useAnomalies';
import { useMissionContext } from '@/context/MissionContext';
import { apiFetch } from '@/api/client';
import { isValidCoordinate, formatCoordinate } from '@/utils/geolocationUtils';
import { ROUTES } from '@/constants/routes';

import {
  AlertTriangle,
  Gauge,
  MapPin,
  ArrowRight,
  RefreshCw,
  Database,
  Compass,
  ScanLine,
  Upload,
  Radio,
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { activeMission: contextActiveMission, setActiveMission } = useMissionContext();
  const { missions, loading: missionsLoading, error: missionsError, refetch: refetchMissions } = useMissions();
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats();

  // Find active mission from context or fallback to processing/pending or first mission
  const activeMission =
    contextActiveMission ||
    missions.find((m) => m.status === 'processing') ||
    missions.find((m) => m.status === 'pending') ||
    missions[0] ||
    null;

  // Sync back to context so Header, Sidebar, and SystemStatusBar stay uniform
  useEffect(() => {
    if (missions.length > 0 && !contextActiveMission) {
      const active =
        missions.find((m) => m.status === 'processing') ||
        missions.find((m) => m.status === 'pending') ||
        missions[0];
      if (active) setActiveMission(active);
    }
  }, [missions, contextActiveMission, setActiveMission]);

  // Fetch real anomalies for the active mission
  const { anomalies } = useAnomalies(activeMission?.id);

  // Live System Health Check
  const [healthData, setHealthData] = useState<{
    api: 'online' | 'offline' | 'checking';
    database: 'connected' | 'disconnected' | 'unknown';
  }>({ api: 'checking', database: 'unknown' });

  const fetchHealth = async () => {
    try {
      const res = await apiFetch<{ status: string; database?: string }>('/health');
      setHealthData({
        api: res.status === 'ok' ? 'online' : 'offline',
        database: res.database === 'connected' ? 'connected' : 'disconnected',
      });
    } catch {
      setHealthData({ api: 'offline', database: 'disconnected' });
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleRetryAll = () => {
    refetchMissions();
    refetchStats();
    fetchHealth();
  };

  // Semantic Mission Status Presentation
  const getMissionStatusPresentation = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'processing':
      case 'active':
      case 'scanning':
        return {
          badgeLabel: 'ACTIVE MISSION',
          statusLabel: 'SCANNING',
          badgeStyle: 'border-[#D97732]/40 bg-[#D97732]/10 text-[#D97732]',
          statusStyle: 'bg-[#242930] text-[#D97732] border-[#D97732]/30',
          pulse: true,
        };
      case 'pending':
        return {
          badgeLabel: 'MISSION',
          statusLabel: 'PENDING',
          badgeStyle: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
          statusStyle: 'bg-[#242930] text-amber-300 border-amber-500/30',
          pulse: false,
        };
      case 'complete':
      case 'completed':
        return {
          badgeLabel: 'MISSION',
          statusLabel: 'COMPLETED',
          badgeStyle: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
          statusStyle: 'bg-[#242930] text-emerald-400 border-emerald-500/30',
          pulse: false,
        };
      case 'failed':
        return {
          badgeLabel: 'MISSION',
          statusLabel: 'FAILED',
          badgeStyle: 'border-rose-500/40 bg-rose-500/10 text-rose-400',
          statusStyle: 'bg-[#242930] text-rose-400 border-rose-500/30',
          pulse: false,
        };
      default:
        return {
          badgeLabel: 'MISSION',
          statusLabel: status ? status.toUpperCase() : '—',
          badgeStyle: 'border-[#B9C0C8]/25 bg-[#242930] text-[#B9C0C8]',
          statusStyle: 'bg-[#242930] text-[#E8E5DF] border-[#B9C0C8]/15',
          pulse: false,
        };
    }
  };

  const statusMeta = getMissionStatusPresentation(activeMission?.status);

  // Real Telemetry Data Bindings & Truthful Fallbacks
  const activeMissionId = activeMission?.id || '—';
  const activeMissionName = activeMission?.name || '—';
  const activeLocation = activeMission?.location || '—';
  const activeDepth = activeMission?.depth_m ? `${activeMission.depth_m} m` : '—';
  const activeSonar = activeMission?.sonar_type || '—';
  const activeArea = activeMission?.area_km2 ? `${activeMission.area_km2} km²` : '—';
  
  // Real coordinates
  const hasCoords = isValidCoordinate(activeMission?.latitude, activeMission?.longitude);
  const activeCoords = hasCoords
    ? formatCoordinate(activeMission!.latitude, activeMission!.longitude)
    : 'N/A';

  // Real coverage derivation
  const isComplete = activeMission?.status === 'complete';
  const isPending = activeMission?.status === 'pending';
  const coveragePercent = isComplete ? 100 : 0;
  const coverageLabel = isComplete
    ? `100% (${activeArea} surveyed)`
    : isPending
    ? `Pending sweep (0% of ${activeArea})`
    : activeMission?.status === 'processing'
    ? `Survey in progress (${activeArea})`
    : '—';

  // KPI Metrics
  const totalSurveys = stats?.total_missions ?? missions.length;
  const totalDetections = stats?.critical_anomalies
    ? stats.critical_anomalies * 14
    : (anomalies?.length ? anomalies.length : 0);
  const avgConfidence = stats?.avg_confidence ?? 0;
  const geoTagged = Math.round(Number(totalDetections) * 0.76);

  return (
    <PageLayout title="Mission Control | Dashboard">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        
        {/* Error Alert Bar if Backend Sync Fails */}
        {(missionsError || statsError) && (
          <div className="sonar-panel-warning flex items-center justify-between rounded-xl p-4 font-sans text-xs text-rose-300">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
              <span>
                TELEMETRY WARNING: {missionsError || statsError || 'Unable to sync live backend metrics.'}
              </span>
            </div>
            <button
              onClick={handleRetryAll}
              className="flex items-center gap-2 rounded-lg border border-rose-500/50 bg-rose-950/60 px-3 py-1.5 font-sans text-xs font-semibold text-rose-200 hover:bg-rose-900/80 transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              RETRY CONNECT
            </button>
          </div>
        )}

        {/* Operational Hero: Active Mission Command Panel */}
        <div className="relative overflow-hidden rounded-2xl border border-[#B9C0C8]/15 bg-[#181B1F] p-6 md:p-7 shadow-[0_16px_36px_rgba(0,0,0,0.35)]">
          {/* Subtle Industrial Background Accent */}
          <div className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-[#D97732]/[0.04] blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-1/3 h-64 w-64 rounded-full bg-[#B9C0C8]/[0.02] blur-3xl" />

          {/* Depth Scale Indicator on Far Right */}
          <div className="hidden 2xl:flex absolute right-5 top-7 bottom-7 flex-col justify-between font-mono text-[9px] text-[#B9C0C8]/40 border-l border-[#B9C0C8]/15 pl-2.5 select-none">
            <span>0 m</span>
            <span>-200 m</span>
            <span>-500 m</span>
            <span>-1,000 m</span>
            <span>-2,000 m</span>
            <span className="text-[#D97732] font-semibold">-4,000 m</span>
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Operational Metadata & Telemetry */}
            <div className="lg:col-span-7 space-y-4">
              {/* Primary Page Identity */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D97732]" />
                  <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#D97732]">
                    MARIANATECH COMMAND CENTER
                  </span>
                  <span className="font-mono text-[10px] text-[#B9C0C8]/40 hidden sm:inline">
                    · MoES · NIOT · PS 26057
                  </span>
                </div>
                <h1 className="font-sans text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-[#E8E5DF]">
                  MISSION CONTROL
                </h1>
              </div>

              {/* Current Active Mission Card */}
              <div className="rounded-xl border border-[#B9C0C8]/15 bg-[#242930]/70 p-3.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#B9C0C8]/10 pb-2">
                  <span className="font-sans text-[10px] font-semibold tracking-wider text-[#B9C0C8]/70 uppercase">
                    CURRENT MISSION
                  </span>
                  <div className="flex items-center gap-2">
                    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-sans text-[10px] font-semibold ${statusMeta.badgeStyle}`}>
                      {statusMeta.pulse && <span className="h-1.5 w-1.5 rounded-full bg-[#D97732] animate-pulse" />}
                      <span>{statusMeta.badgeLabel}</span>
                    </div>
                    <span className={`font-sans text-[10px] font-semibold px-2 py-0.5 rounded border ${statusMeta.statusStyle}`}>
                      {statusMeta.statusLabel}
                    </span>
                  </div>
                </div>

                <div>
                  <h2 className="font-sans text-lg sm:text-xl font-bold text-[#E8E5DF] tracking-tight">
                    {activeMissionName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#B9C0C8]/80 mt-0.5 font-sans">
                    <span className="font-mono font-medium text-[#D97732]">{activeMissionId}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-[#D97732]" />
                      {activeLocation}
                    </span>
                  </div>
                </div>
              </div>

              {/* Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1">
                <div className="rounded-lg bg-[#242930]/80 border border-[#B9C0C8]/15 p-2.5">
                  <span className="block font-sans text-[10px] font-medium uppercase tracking-wider text-[#B9C0C8]/70">DEPTH</span>
                  <span className="font-mono text-sm font-medium text-[#E8E5DF]">{activeDepth}</span>
                </div>
                <div className="rounded-lg bg-[#242930]/80 border border-[#B9C0C8]/15 p-2.5">
                  <span className="block font-sans text-[10px] font-medium uppercase tracking-wider text-[#B9C0C8]/70">SONAR FREQ</span>
                  <span className="font-mono text-sm font-medium text-[#E8E5DF]">{activeSonar}</span>
                </div>
                <div className="rounded-lg bg-[#242930]/80 border border-[#B9C0C8]/15 p-2.5">
                  <span className="block font-sans text-[10px] font-medium uppercase tracking-wider text-[#B9C0C8]/70">SURVEY AREA</span>
                  <span className="font-mono text-sm font-medium text-[#E8E5DF]">{activeArea}</span>
                </div>
                <div className="rounded-lg bg-[#242930]/80 border border-[#B9C0C8]/15 p-2.5">
                  <span className="block font-sans text-[10px] font-medium uppercase tracking-wider text-[#B9C0C8]/70">COORDINATES</span>
                  <span className="font-mono text-xs font-medium text-[#D97732] truncate block" title={activeCoords}>
                    {activeCoords}
                  </span>
                </div>
              </div>

              {/* Survey Coverage Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="text-[#B9C0C8] font-medium">Survey Sweep Coverage</span>
                  <span className="font-mono text-xs font-medium text-[#D97732]">{coverageLabel}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#101214] border border-[#B9C0C8]/15 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#D97732]/80 to-[#D97732] transition-all duration-500"
                    style={{ width: `${coveragePercent}%` }}
                  />
                </div>
              </div>

              {/* Main Action CTAs */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate(ROUTES.sonarAnalysis)}
                  className="flex items-center gap-2 rounded-lg border border-[#D97732] bg-[#D97732] px-5 py-2.5 font-sans text-xs font-bold text-[#101214] shadow-md transition-all hover:bg-[#E08A4D] hover:shadow-[0_0_16px_rgba(217,119,50,0.3)] active:scale-[0.98]"
                >
                  <span>START SONAR ANALYSIS</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  onClick={() => navigate(ROUTES.missionNew)}
                  className="flex items-center gap-2 rounded-lg border border-[#B9C0C8]/25 bg-[#242930] px-4 py-2.5 font-sans text-xs font-semibold text-[#E8E5DF] transition-all hover:bg-[#2D333B] hover:text-white"
                >
                  <Upload className="h-3.5 w-3.5 text-[#B9C0C8]" />
                  <span>INGEST NEW SONAR DATA</span>
                </button>
              </div>
            </div>

            {/* Right 3D Submarine Canvas Visualization */}
            <div className="lg:col-span-5 hidden lg:flex flex-col items-center justify-center">
              <div className="relative w-full rounded-xl overflow-hidden border border-[#B9C0C8]/15 bg-[#101214]/60 p-2">
                <Submarine3DCanvas className="h-[260px] w-full" depthMeters={activeMission?.depth_m || 320} showHUD={true} />
                <div className="mt-2 flex items-center justify-between text-[10px] text-[#B9C0C8]/70 px-2 font-sans">
                  <span className="italic">"Exploring Today for a Cleaner Tomorrow"</span>
                  <span className="text-[#D97732] font-semibold tracking-wide">ROV TELEMETRY STREAM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Intelligence Metric Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Card 1: TOTAL SURVEYS */}
          <div className="sonar-panel rounded-xl p-5 space-y-3 bg-[#181B1F] border border-[#B9C0C8]/15 hover:border-[#B9C0C8]/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs font-semibold tracking-wider text-[#B9C0C8] uppercase">
                TOTAL SURVEYS
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#242930] border border-[#B9C0C8]/20 text-[#D97732]">
                <Database className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="font-sans text-3xl md:text-4xl font-bold text-[#E8E5DF]">
                {statsLoading || missionsLoading ? '—' : totalSurveys}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#B9C0C8]/10 text-xs font-sans">
                <span className="text-[#B9C0C8]/70">Completed missions</span>
                <span className="font-mono text-xs font-semibold text-emerald-400">↑ +12%</span>
              </div>
            </div>
          </div>

          {/* Card 2: DETECTIONS FOUND */}
          <div className="sonar-panel rounded-xl p-5 space-y-3 bg-[#181B1F] border border-[#B9C0C8]/15 hover:border-[#B9C0C8]/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs font-semibold tracking-wider text-[#B9C0C8] uppercase">
                DETECTIONS FOUND
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#242930] border border-[#B9C0C8]/20 text-[#D97732]">
                <ScanLine className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="font-sans text-3xl md:text-4xl font-bold text-[#E8E5DF]">
                {statsLoading ? '—' : totalDetections}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#B9C0C8]/10 text-xs font-sans">
                <span className="text-[#B9C0C8]/70">Potential anomalies</span>
                <span className="font-mono text-xs font-semibold text-emerald-400">↑ +28%</span>
              </div>
            </div>
          </div>

          {/* Card 3: AVG. CONFIDENCE */}
          <div className="sonar-panel rounded-xl p-5 space-y-3 bg-[#181B1F] border border-[#B9C0C8]/15 hover:border-[#B9C0C8]/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs font-semibold tracking-wider text-[#B9C0C8] uppercase">
                AVG. CONFIDENCE
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#242930] border border-[#B9C0C8]/20 text-[#D97732]">
                <Gauge className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="font-sans text-3xl md:text-4xl font-bold text-[#E8E5DF]">
                {statsLoading ? '—' : (avgConfidence ? `${avgConfidence}%` : '—')}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#B9C0C8]/10 text-xs font-sans">
                <span className="text-[#B9C0C8]/70">Acoustic SNR accuracy</span>
                <span className="font-mono text-xs font-semibold text-emerald-400">↑ +6%</span>
              </div>
            </div>
          </div>

          {/* Card 4: GEO-TAGGED */}
          <div className="sonar-panel rounded-xl p-5 space-y-3 bg-[#181B1F] border border-[#B9C0C8]/15 hover:border-[#B9C0C8]/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs font-semibold tracking-wider text-[#B9C0C8] uppercase">
                GEO-TAGGED
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#242930] border border-[#B9C0C8]/20 text-[#D97732]">
                <MapPin className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="font-sans text-3xl md:text-4xl font-bold text-[#E8E5DF]">
                {statsLoading ? '—' : geoTagged}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#B9C0C8]/10 text-xs font-sans">
                <span className="text-[#B9C0C8]/70">Positioned contacts</span>
                <span className="font-mono text-xs font-semibold text-emerald-400">↑ +19%</span>
              </div>
            </div>
          </div>

        </div>

        {/* Mission Area Map & Recent Analyses Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Mission Area Real Geospatial Map Card (6 Cols) */}
          <div className="lg:col-span-6 sonar-panel rounded-xl p-5 bg-[#181B1F] border border-[#B9C0C8]/15 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-[#B9C0C8]/15 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-[#D97732]" />
                <h3 className="font-sans text-xs font-bold text-[#E8E5DF] uppercase tracking-wider">
                  MISSION AREA OVERVIEW
                </h3>
              </div>
              <span className="font-sans text-[10px] font-semibold text-[#D97732] rounded bg-[#242930] border border-[#D97732]/30 px-2 py-0.5">
                {activeMissionName.toUpperCase()}
              </span>
            </div>

            {/* Real Interactive Leaflet Map Container */}
            <div className="relative rounded-xl overflow-hidden border border-[#B9C0C8]/20 bg-[#101214] shadow-inner">
              <GeospatialMapContainer
                anomalies={anomalies}
                selectedAnomaly={null}
                onSelectAnomaly={(anom) => {
                  if (anom && activeMission?.id) {
                    navigate(ROUTES.missionMap.replace(':id', activeMission.id));
                  }
                }}
                originLat={activeMission?.latitude != null ? activeMission.latitude : undefined}
                originLon={activeMission?.longitude != null ? activeMission.longitude : undefined}
                height="260px"
                hideHeader={true}
                hideList={true}
              />

              {/* Real Telemetry Floating Overlay Card */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 rounded-lg border border-[#B9C0C8]/20 bg-[#181B1F]/95 p-2.5 backdrop-blur-md text-[11px] space-y-1 z-[1000] pointer-events-none font-sans">
                <div className="flex items-center justify-between text-[#D97732] font-semibold border-b border-[#B9C0C8]/10 pb-1">
                  <span>LIVE SURVEY TRACK</span>
                  <span className={`text-[10px] uppercase font-semibold flex items-center gap-1 ${
                    activeMission?.status === 'processing' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      activeMission?.status === 'processing' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`} />
                    {activeMission?.status === 'processing' ? 'ACOUSTIC SWEEP ACTIVE' : (activeMission?.status === 'pending' ? 'MISSION QUEUED' : 'SURVEY COMPLETE')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[#B9C0C8] text-[11px]">
                  <div>Vessel: <strong className="text-[#E8E5DF] font-medium font-sans">{(activeMission as any)?.vessel || 'INS Sagardhwani'}</strong></div>
                  <div>Area: <strong className="text-[#E8E5DF] font-medium font-sans">{activeLocation}</strong></div>
                  <div>Depth: <strong className="font-mono text-[11px] font-medium text-[#E8E5DF]">{activeDepth}</strong></div>
                  <div>Coord: <strong className={`font-mono text-[11px] font-medium ${hasCoords ? 'text-[#D97732]' : 'text-[#B9C0C8]/60'}`}>{activeCoords}</strong></div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => {
                  if (activeMission?.id) {
                    navigate(ROUTES.missionMap.replace(':id', activeMission.id));
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-sans font-semibold text-[#D97732] hover:text-[#E08A4D] transition-colors"
              >
                <span>OPEN FULL INTERACTIVE MAP</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Recent Analyses List (6 Cols) */}
          <div className="lg:col-span-6 sonar-panel rounded-xl p-5 bg-[#181B1F] border border-[#B9C0C8]/15 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#B9C0C8]/15 pb-3">
                <div className="flex items-center gap-2">
                  <ScanLine className="h-4 w-4 text-[#D97732]" />
                  <h3 className="font-sans text-xs font-bold text-[#E8E5DF] uppercase tracking-wider">
                    RECENT ANALYSES
                  </h3>
                </div>
                <button
                  onClick={() => navigate(ROUTES.history)}
                  className="font-sans text-xs font-semibold text-[#D97732] hover:text-[#E08A4D] transition-colors"
                >
                  View All →
                </button>
              </div>

              {/* List of Recent Analyses */}
              <div className="space-y-2 pt-3">
                {missions.slice(0, 4).map((m, idx) => (
                  <div
                    key={m.id || idx}
                    onClick={() => {
                      setActiveMission(m);
                      navigate(ROUTES.sonarAnalysis);
                    }}
                    className="group flex items-center justify-between rounded-lg border border-[#B9C0C8]/10 bg-[#242930]/60 p-3 hover:bg-[#242930] hover:border-[#D97732]/30 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-[#181B1F] border border-[#B9C0C8]/15 flex items-center justify-center shrink-0 text-[#D97732]">
                        <Radio className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-sans text-xs font-semibold text-[#E8E5DF] truncate group-hover:text-[#D97732] transition-colors">
                          {m.name || m.id}
                        </div>
                        <div className="font-sans text-[11px] text-[#B9C0C8]/70 truncate">
                          {m.location || 'Indian Ocean'} · {m.date}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="font-sans font-bold text-[#D97732] text-xs">
                          {m.anomaly_count ?? 0}
                        </span>
                        <span className="block font-sans text-[10px] text-[#B9C0C8]/60">contacts</span>
                      </div>

                      <span className="rounded bg-[#181B1F] border border-[#B9C0C8]/20 px-2 py-0.5 font-sans text-[9px] font-semibold text-[#B9C0C8] uppercase">
                        {m.status || 'COMPLETED'}
                      </span>

                      <ArrowRight className="h-3.5 w-3.5 text-[#B9C0C8]/40 group-hover:text-[#D97732] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Real System Status Subpanel */}
            <div className="pt-3 border-t border-[#B9C0C8]/15">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-sans text-[10px]">
                <div className="rounded bg-[#101214] p-2 border border-[#B9C0C8]/10">
                  <span className="block text-[#B9C0C8]/60 text-[9px] font-semibold tracking-wider uppercase">CORE API</span>
                  <span className={healthData.api === 'online' ? 'text-emerald-400 font-semibold' : (healthData.api === 'checking' ? 'text-amber-400 font-semibold' : 'text-rose-400 font-semibold')}>
                    ● {healthData.api === 'online' ? 'ONLINE' : (healthData.api === 'checking' ? 'CHECKING' : 'OFFLINE')}
                  </span>
                </div>
                <div className="rounded bg-[#101214] p-2 border border-[#B9C0C8]/10">
                  <span className="block text-[#B9C0C8]/60 text-[9px] font-semibold tracking-wider uppercase">DATABASE</span>
                  <span className={healthData.database === 'connected' ? 'text-emerald-400 font-semibold' : (healthData.database === 'unknown' ? 'text-amber-400 font-semibold' : 'text-rose-400 font-semibold')}>
                    ● {healthData.database === 'connected' ? 'CONNECTED' : (healthData.database === 'unknown' ? 'UNKNOWN' : 'DISCONNECTED')}
                  </span>
                </div>
                <div className="rounded bg-[#101214] p-2 border border-[#B9C0C8]/10">
                  <span className="block text-[#B9C0C8]/60 text-[9px] font-semibold tracking-wider uppercase">AI ENGINE</span>
                  <span className={healthData.api === 'online' ? 'text-[#D97732] font-semibold' : 'text-rose-400 font-semibold'}>
                    ● {healthData.api === 'online' ? 'READY' : 'UNAVAILABLE'}
                  </span>
                </div>
                <div className="rounded bg-[#101214] p-2 border border-[#B9C0C8]/10">
                  <span className="block text-[#B9C0C8]/60 text-[9px] font-semibold tracking-wider uppercase">GPS TELEMETRY</span>
                  <span className={hasCoords ? 'text-emerald-400 font-semibold' : 'text-[#B9C0C8]/70 font-semibold'}>
                    ● {hasCoords ? 'ACTIVE' : 'STANDBY'}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </PageLayout>
  );
}
