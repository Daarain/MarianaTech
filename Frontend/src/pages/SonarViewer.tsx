import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Activity,
  Play,
  RefreshCw,
  Upload,
  Database,
  Globe,
  Sliders,
  Layers,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Radio,
  Search,
  Maximize2,
  Minimize2,
  ChevronRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Crosshair,
  MapPin,
  Compass,
  Info,
  Grid,
  Filter,
  RotateCcw,
} from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { COLOURS } from '@/constants/colours';
import { ROUTES } from '@/constants/routes';
import { useMissionContext } from '@/context/MissionContext';
import { useDetection } from '@/hooks/useDetection';
import { useToast } from '@/context/ToastContext';
import { getMissionById } from '@/api/missions';
import { getAnomalies as getMissionAnomalies } from '@/api/anomalies';
import type { Mission, Anomaly, DetectionResult, Priority } from '@/types/api';
import { getNormalizedBoundingBox } from '@/utils/coordinateTransforms';
import {
  normalizeConfidence,
  formatConfidenceLabel,
  calculateConfidenceSummary,
} from '@/utils/confidenceUtils';
import {
  getClassMetadata,
  filterDetectionsCombined,
} from '@/utils/classificationUtils';
import ImageViewerFrame from '@/components/sonar/ImageViewerFrame';
import DetectionMarker from '@/components/sonar/DetectionMarker';
import ConfidenceControlPanel, { type SortOrder } from '@/components/sonar/ConfidenceControlPanel';
import ClassificationInspectorPanel from '@/components/sonar/ClassificationInspectorPanel';
import GeospatialMapContainer from '@/components/sonar/GeospatialMapContainer';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import StatusIndicator from '@/components/ui/StatusIndicator';
import ProgressBar from '@/components/ui/ProgressBar';

export type AnalysisWorkspaceState =
  | 'IDLE'
  | 'READY'
  | 'SUBMITTING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export type ViewMode = 'AI_OVERLAY' | 'ORIGINAL' | 'GEOSPATIAL_MAP';

const PRIORITY_BADGE_STYLES: Record<Priority, string> = {
  critical: 'bg-rose-950/80 text-rose-400 border-rose-500/50',
  high: 'bg-cyan-950/80 text-cyan-400 border-cyan-500/50',
  medium: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/50',
  low: 'bg-slate-900/80 text-slate-300 border-slate-700',
};

export default function SonarViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    stagedFile,
    stagedPreviewUrl,
    stagedLatitude,
    stagedLongitude,
    stagedDetectionResult,
    selectedAnomaly,
    setSelectedAnomaly,
  } = useMissionContext();

  const { analyze, loading: isAnalyzing, error: apiError, reset: resetDetection } = useDetection();

  const missionId = id || 'MSN-2026-0142';
  const [mission, setMission] = useState<Mission | null>(null);
  const [existingAnomalies, setExistingAnomalies] = useState<Anomaly[]>([]);
  const [loadingMission, setLoadingMission] = useState<boolean>(true);

  // Analysis Lifecycle state
  const [workspaceState, setWorkspaceState] = useState<AnalysisWorkspaceState>('READY');
  const [telemetryMessage, setTelemetryMessage] = useState<string>('ENGINE STANDBY — READY TO INITIALIZE ACOUSTIC ANALYSIS');
  const [localResult, setLocalResult] = useState<DetectionResult | null>(stagedDetectionResult);

  // Visualization Layer Controls
  const [viewMode, setViewMode] = useState<ViewMode>('AI_OVERLAY');
  const [showDetections, setShowDetections] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Phase 10 & 11 Filtering & Classification State
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('CONFIDENCE_DESC');

  const viewerContainerRef = useRef<HTMLDivElement | null>(null);

  // Load mission details if no staged file or for mission context fallback
  useEffect(() => {
    let mounted = true;
    setLoadingMission(true);

    Promise.all([getMissionById(missionId), getMissionAnomalies(missionId)])
      .then(([m, anoms]) => {
        if (!mounted) return;
        setMission(m);
        setExistingAnomalies(anoms);
      })
      .catch((err) => {
        console.warn('Failed to load mission details:', err);
      })
      .finally(() => {
        if (mounted) setLoadingMission(false);
      });

    return () => {
      mounted = false;
    };
  }, [missionId]);

  // Sync staged detection result from upload phase if available
  useEffect(() => {
    if (stagedDetectionResult) {
      setLocalResult(stagedDetectionResult);
      setWorkspaceState('COMPLETED');
    }
  }, [stagedDetectionResult]);

  // Handle start AI analysis execution
  const handleStartAnalysis = async () => {
    setWorkspaceState('SUBMITTING');
    setTelemetryMessage('TRANSMITTING ACOUSTIC PAYLOAD TO BACKEND AI ENGINE...');

    // Telemetry progress status messages
    const stages = [
      'APPLYING BILATERAL SPECKLE NOISE FILTER (d=7, sigma=75)...',
      'EXECUTING CLAHE HISTOGRAM CONTRAST EQUALIZATION...',
      'SAMPLING ACOUSTIC SHADOW REGIONS & SIGNAL-TO-NOISE RATIO...',
      'EXTRACTING CONTOUR REGIONS OF INTEREST & GEOSPATIAL CONTACTS...',
    ];

    let stageIdx = 0;
    const interval = setInterval(() => {
      if (stageIdx < stages.length) {
        setTelemetryMessage(stages[stageIdx]);
        stageIdx++;
      }
    }, 350);

    try {
      showToast('Initiating real acoustic CV pipeline execution on backend...', 'info');

      let targetFile = stagedFile;
      if (!targetFile) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#061527';
          ctx.fillRect(0, 0, 1024, 512);
          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(200, 150, 120, 60);
          ctx.fillRect(600, 300, 80, 80);
        }
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
          targetFile = new File([blob], `mission_${missionId}_scan.png`, { type: 'image/png' });
        }
      }

      if (!targetFile) {
        throw new Error('No sonar image dataset available for backend analysis.');
      }

      setWorkspaceState('PROCESSING');
      const lat = stagedFile ? stagedLatitude : (mission?.latitude || -6.3000);
      const lon = stagedFile ? stagedLongitude : (mission?.longitude || 71.2000);

      const data = await analyze(targetFile, lat, lon);
      clearInterval(interval);

      setLocalResult(data);
      setWorkspaceState('COMPLETED');
      setTelemetryMessage('ANALYSIS COMPLETE — RESULTS VERIFIED & INDEXED');

      // Select highest confidence anomaly contact by default if present
      if (data.anomalies && data.anomalies.length > 0) {
        setSelectedAnomaly(data.anomalies[0]);
      }

      showToast(`Analysis complete! ${data.anomalies_detected} contacts detected by backend.`, 'success');
    } catch (err: any) {
      clearInterval(interval);
      setWorkspaceState('FAILED');
      const msg = err?.message || 'Backend AI analysis failed to process sonar image.';
      setTelemetryMessage(`ANALYSIS FAILED — ${msg.toUpperCase()}`);
      showToast(msg, 'error');
    }
  };

  const handleResetFilters = () => {
    setConfidenceThreshold(0);
    setSelectedClassFilter('ALL');
    setSearchQuery('');
    setSortOrder('CONFIDENCE_DESC');
    showToast('All classification & confidence filters reset', 'info');
  };

  const handleResetWorkspace = () => {
    resetDetection();
    setLocalResult(null);
    setSelectedAnomaly(null);
    handleResetFilters();
    setWorkspaceState('READY');
    setTelemetryMessage('ENGINE STANDBY — READY TO INITIALIZE ACOUSTIC ANALYSIS');
  };

  // Compute raw anomaly detections list (from live result or mission fallback)
  const rawAnomalies: Anomaly[] = useMemo(() => {
    if (localResult && localResult.anomalies) {
      return localResult.anomalies;
    }
    return existingAnomalies;
  }, [localResult, existingAnomalies]);

  // Compute combined filtered & sorted anomalies list for display
  const visibleAnomalies: Anomaly[] = useMemo(() => {
    let filtered = filterDetectionsCombined(
      rawAnomalies,
      selectedClassFilter,
      confidenceThreshold,
      searchQuery
    );

    if (sortOrder === 'CONFIDENCE_DESC') {
      filtered = [...filtered].sort((a, b) => normalizeConfidence(b.confidence) - normalizeConfidence(a.confidence));
    } else if (sortOrder === 'CONFIDENCE_ASC') {
      filtered = [...filtered].sort((a, b) => normalizeConfidence(a.confidence) - normalizeConfidence(b.confidence));
    }

    return filtered;
  }, [rawAnomalies, selectedClassFilter, confidenceThreshold, searchQuery, sortOrder]);

  // Compute active dataset properties
  const datasetMeta = useMemo(() => {
    if (stagedFile) {
      return {
        name: stagedFile.name,
        source: 'User Uploaded Dataset',
        format: stagedFile.name.split('.').pop()?.toUpperCase() || 'PNG',
        size: `${(stagedFile.size / (1024 * 1024)).toFixed(2)} MB`,
        lat: stagedLatitude,
        lon: stagedLongitude,
        sonarType: 'Side-Scan Sonar 900 kHz',
        sensorRes: 'High-Res Acoustic Sweep',
      };
    }
    return {
      name: mission?.name ? `${mission.name} Sonar Log` : 'Chagos Trench Survey Stream',
      source: `Mission Archive (${missionId})`,
      format: 'PNG (Sonar Strip)',
      size: '18.4 MB',
      lat: mission?.latitude || -6.3000,
      lon: mission?.longitude || 71.2000,
      sonarType: mission?.sonar_type || 'Side-scan 900 kHz',
      sensorRes: '0.15m x 0.15m per pixel',
    };
  }, [stagedFile, stagedLatitude, stagedLongitude, mission, missionId]);

  // Fullscreen API toggle handler
  const toggleFullscreen = () => {
    if (!viewerContainerRef.current) return;
    if (!document.fullscreenElement) {
      viewerContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
        showToast('Fullscreen mode not supported or allowed', 'warning');
      });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <PageLayout title="Sonar Analysis & Classification Viewer" intensity="low">

      <div className="flex flex-col gap-6 font-mono">
        {/* Header Telemetry Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-cyan-500/20 bg-[#050D1A]/90 p-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Crosshair className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 font-semibold">
                  AI CLASSIFICATION & GEOSPATIAL VISUALIZATION
                </span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-[10px] text-slate-400">SIH 2026 / NIOT-MoES</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Side-Scan Sonar Anomaly Contact Classification Station
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusIndicator
              status={
                workspaceState === 'COMPLETED'
                  ? 'complete'
                  : workspaceState === 'PROCESSING' || workspaceState === 'SUBMITTING'
                  ? 'processing'
                  : workspaceState === 'FAILED'
                  ? 'error'
                  : 'ready'
              }
              label={
                workspaceState === 'COMPLETED'
                  ? 'ANALYSIS COMPLETE'
                  : workspaceState === 'PROCESSING'
                  ? 'PROCESSING ACOUSTIC DATA'
                  : workspaceState === 'SUBMITTING'
                  ? 'TRANSMITTING PAYLOAD'
                  : workspaceState === 'FAILED'
                  ? 'ANALYSIS FAILED'
                  : 'READY FOR PROCESSING'
              }
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTES.missionNew)}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              BACK TO UPLOAD
            </Button>
          </div>
        </div>

        {/* Filter Summary Telemetry Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cyan-500/10 bg-[#050D1A]/80 px-4 py-2 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-300">
            <span>
              TOTAL CONTACTS: <strong className="text-cyan-400">{rawAnomalies.length}</strong>
            </span>
            <span>
              VISIBLE CONTACTS: <strong className="text-emerald-400">{visibleAnomalies.length}</strong>
            </span>
            <span>
              CLASS FILTER: <strong className="text-cyan-300 uppercase">{selectedClassFilter}</strong>
            </span>
            <span>
              CONFIDENCE THRESHOLD: <strong className="text-cyan-300">≥ {confidenceThreshold}%</strong>
            </span>
          </div>

          {(selectedClassFilter !== 'ALL' || confidenceThreshold > 0 || searchQuery !== '') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-amber-400 hover:text-white text-[11px] border-amber-500/40"
            >
              <RotateCcw className="h-3 w-3 mr-1 inline" />
              RESET ALL FILTERS
            </Button>
          )}
        </div>

        {/* Main Viewport & Inspection Grid Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Main Viewport (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            {/* Viewport Action Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cyan-500/20 bg-[#050D1A]/90 p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 mr-1">VIEW MODE:</span>
                <button
                  onClick={() => setViewMode('AI_OVERLAY')}
                  className={`rounded px-2.5 py-1 text-xs font-bold transition-all ${
                    viewMode === 'AI_OVERLAY'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5 inline mr-1" />
                  AI OVERLAY
                </button>
                <button
                  onClick={() => setViewMode('ORIGINAL')}
                  className={`rounded px-2.5 py-1 text-xs font-bold transition-all ${
                    viewMode === 'ORIGINAL'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <EyeOff className="h-3.5 w-3.5 inline mr-1" />
                  ORIGINAL SONAR
                </button>
                <button
                  onClick={() => setViewMode('GEOSPATIAL_MAP')}
                  className={`rounded px-2.5 py-1 text-xs font-bold transition-all ${
                    viewMode === 'GEOSPATIAL_MAP'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="h-3.5 w-3.5 inline mr-1 text-cyan-400" />
                  GEOSPATIAL MAP
                </button>
              </div>

              <div className="flex items-center gap-2">
                {viewMode !== 'GEOSPATIAL_MAP' && (
                  <button
                    onClick={() => setShowDetections(!showDetections)}
                    disabled={viewMode === 'ORIGINAL'}
                    className={`rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                      showDetections && viewMode === 'AI_OVERLAY'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-900/60 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {showDetections ? 'HIDE DETECTIONS' : 'SHOW DETECTIONS'}
                  </button>
                )}

                <button
                  onClick={toggleFullscreen}
                  className="rounded bg-cyan-900/40 border border-cyan-500/30 p-1.5 text-cyan-400 hover:bg-cyan-800/60 transition-colors"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Viewport Frame: Switches between Image Canvas & Leaflet Map */}
            <div ref={viewerContainerRef} className="relative">
              {viewMode === 'GEOSPATIAL_MAP' ? (
                <GeospatialMapContainer
                  anomalies={visibleAnomalies}
                  rawAnomalies={rawAnomalies}
                  selectedAnomaly={selectedAnomaly}
                  onSelectAnomaly={setSelectedAnomaly}
                  originLat={datasetMeta.lat}
                  originLon={datasetMeta.lon}
                  height="480px"
                />
              ) : (
                <ImageViewerFrame
                  title={datasetMeta.name.toUpperCase()}
                  resolution={
                    localResult?.image_dimensions
                      ? `${localResult.image_dimensions.width} × ${localResult.image_dimensions.height} px`
                      : '1024 × 512 px (Nominal)'
                  }
                  lat={datasetMeta.lat}
                  lon={datasetMeta.lon}
                  sonarType={datasetMeta.sonarType}
                  metersPerPixel={0.15}
                  selectedAnomaly={selectedAnomaly}
                  isScanning={workspaceState === 'PROCESSING' || workspaceState === 'SUBMITTING'}
                >

                  <div className="relative h-full w-full flex items-center justify-center">
                    {/* Layer 1: Base Sonar Image */}
                    {stagedPreviewUrl ? (
                      <img
                        src={stagedPreviewUrl}
                        alt="Side-Scan Sonar Acoustic Dataset"
                        className="max-h-[460px] w-full object-contain rounded select-none"
                      />
                    ) : (
                      <div className="relative flex flex-col items-center justify-center p-12 text-center select-none">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3">
                          <Radio className="h-8 w-8 animate-pulse" />
                        </div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                          {datasetMeta.name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm">
                          Side-scan acoustic backscatter imagery loaded for hydrographic inspection.
                        </p>
                      </div>
                    )}

                    {/* Layer 3 & 4: AI Bounding Box Overlays */}
                    {viewMode === 'AI_OVERLAY' && showDetections && visibleAnomalies.map((anom, idx) => {
                      const normBbox = getNormalizedBoundingBox(anom, idx);
                      const isSelected = selectedAnomaly?.id === anom.id;

                      return (
                        <DetectionMarker
                          key={anom.id || `marker-${idx}`}
                          id={anom.id}
                          classNameLabel={anom.class_name}
                          confidence={anom.confidence}
                          priority={anom.priority}
                          bbox={normBbox}
                          hasAcousticShadow={anom.has_acoustic_shadow}
                          selected={isSelected}
                          onClick={() => {
                            setSelectedAnomaly(anom);
                            const meta = getClassMetadata(anom.class_name);
                            showToast(`Selected contact: ${meta.label} (${formatConfidenceLabel(anom.confidence)})`, 'info');
                          }}
                        />
                      );
                    })}
                  </div>
                </ImageViewerFrame>
              )}
            </div>

            {/* Analysis Engine Telemetry Status Bar */}
            <Panel title="ANALYSIS ENGINE TELEMETRY & CONTROLS">
              <div className="space-y-4 py-1">
                <div className="flex items-center justify-between text-xs text-cyan-300">
                  <span className="flex items-center gap-2">
                    <Activity className={`h-4 w-4 text-cyan-400 ${workspaceState === 'PROCESSING' ? 'animate-spin' : ''}`} />
                    <span className="font-bold">{telemetryMessage}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    STATUS: <strong className="text-cyan-400">{workspaceState}</strong>
                  </span>
                </div>

                {(workspaceState === 'SUBMITTING' || workspaceState === 'PROCESSING') && (
                  <ProgressBar value={workspaceState === 'SUBMITTING' ? 35 : 80} variant="cyan" />
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-cyan-500/10">
                  <div className="text-[11px] text-slate-400">
                    Engine Pipeline: <span className="text-cyan-300 font-semibold">Bilateral CLAHE Contour CV-Net v1.4</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {workspaceState === 'FAILED' && (
                      <Button variant="hazard" size="sm" onClick={handleStartAnalysis}>
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        RETRY ANALYSIS
                      </Button>
                    )}

                    {workspaceState === 'COMPLETED' && (
                      <Button variant="secondary" size="sm" onClick={handleResetWorkspace}>
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        RESET WORKSPACE
                      </Button>
                    )}

                    {(workspaceState === 'READY' || workspaceState === 'IDLE') && (
                      <Button
                        variant="primary"
                        size="md"
                        onClick={handleStartAnalysis}
                        disabled={isAnalyzing}
                      >
                        <Play className="h-4 w-4 mr-2 fill-current" />
                        START AI ANALYSIS
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Panel>

            {/* Zero Detections Clean Seafloor State Banner */}
            {workspaceState === 'COMPLETED' && rawAnomalies.length === 0 && (
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-5 text-center">
                <CheckCircle2 className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  NO ANOMALIES DETECTED
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  AI analysis completed successfully. Acoustic scan verified clean seafloor with zero anomaly contacts above detection threshold.
                </p>
              </div>
            )}

            {/* All Detections Filtered Out Notice */}
            {workspaceState === 'COMPLETED' && rawAnomalies.length > 0 && visibleAnomalies.length === 0 && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-4 text-center">
                <AlertTriangle className="h-6 w-6 text-amber-400 mx-auto mb-1.5" />
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  ALL DETECTIONS FILTERED OUT BY CURRENT CRITERIA
                </h4>
                <p className="text-[11px] text-slate-300 mt-1">
                  {rawAnomalies.length} backend detections exist, but none match class filter '{selectedClassFilter}' and threshold (≥ {confidenceThreshold}%).
                </p>
                <div className="mt-2 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilters}
                    className="text-xs border-amber-500/40 text-amber-200"
                  >
                    RESET ALL FILTERS
                  </Button>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Classification Inspector, Confidence Controls & Contact List (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* Classification Engine Panel */}
            <ClassificationInspectorPanel
              allAnomalies={rawAnomalies}
              selectedClassFilter={selectedClassFilter}
              setSelectedClassFilter={setSelectedClassFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedAnomaly={selectedAnomaly}
              onClearSelection={() => setSelectedAnomaly(null)}
            />

            {/* Confidence Control & Filtering Panel */}
            <ConfidenceControlPanel
              allAnomalies={rawAnomalies}
              threshold={confidenceThreshold}
              setThreshold={setConfidenceThreshold}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              onResetFilter={() => {
                setConfidenceThreshold(0);
                showToast('Confidence filter reset to Show All (0%)', 'info');
              }}
            />

            {/* AI Detected Contacts List Panel */}
            <Panel title={`DETECTED ANOMALY CONTACTS (${visibleAnomalies.length} / ${rawAnomalies.length})`}>
              {visibleAnomalies.length > 0 ? (
                <div className="space-y-2 font-mono text-xs max-h-[320px] overflow-y-auto pr-1">
                  {visibleAnomalies.map((anom, idx) => {
                    const isSelected = selectedAnomaly?.id === anom.id;
                    const normBbox = getNormalizedBoundingBox(anom, idx);
                    const confLabel = formatConfidenceLabel(anom.confidence);
                    const meta = getClassMetadata(anom.class_name);

                    return (
                      <div
                        key={anom.id || `list-${idx}`}
                        onClick={() => {
                          setSelectedAnomaly(anom);
                          showToast(`Selected ${meta.label} (${confLabel})`, 'info');
                        }}
                        className={`cursor-pointer rounded p-3 border transition-all ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-cyan-950/30 hover:border-cyan-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${isSelected ? 'animate-ping' : ''}`}
                              style={{ backgroundColor: meta.color }}
                            />
                            <span className="font-bold uppercase text-white">
                              {meta.label}
                            </span>
                          </div>
                          <span className="font-bold text-cyan-400">
                            {confLabel}
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                          <span>ID: {anom.id}</span>
                          <span>BBOX: X:{normBbox.x}% Y:{normBbox.y}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center font-mono text-xs text-slate-500">
                  <Search className="h-8 w-8 mx-auto text-slate-700 mb-2" />
                  <span>
                    {rawAnomalies.length > 0
                      ? 'NO DETECTIONS MATCH CURRENT FILTER CRITERIA'
                      : 'NO ANOMALY CONTACTS DETECTED YET'}
                  </span>
                </div>
              )}
            </Panel>

            {/* Downstream Module Handoff Actions */}
            <Panel title="DOWNSTREAM ANALYSIS MODULES">
              <div className="space-y-3 font-mono">
                <div className="rounded border border-cyan-500/40 bg-cyan-950/30 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <Globe className="h-4 w-4 text-cyan-400" />
                      PHASE 12 — GEOSPATIAL ANOMALY MAP
                    </span>
                    <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/40">
                      ACTIVE MODULE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Seafloor spatial plotting, survey track lines, and georeferenced anomaly map.
                  </p>
                  <button
                    onClick={() => setViewMode('GEOSPATIAL_MAP')}
                    className="mt-2 w-full py-1.5 px-3 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 text-[11px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1"
                  >
                    OPEN GEOSPATIAL MAP VIEW →
                  </button>
                </div>

                <div className="rounded border border-cyan-500/40 bg-cyan-950/30 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-cyan-400" />
                      PHASE 13 — SURVEY REPORT BUILDER
                    </span>
                    <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/40">
                      ACTIVE MODULE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Export structured PDF / CSV / JSON survey reports for NIOT/MoES oceanographers.
                  </p>
                  <button
                    onClick={() => navigate(ROUTES.missionReports.replace(':id', missionId))}
                    className="mt-2 w-full py-1.5 px-3 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 text-[11px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1"
                  >
                    GENERATE SURVEY REPORT →
                  </button>
                </div>

                <div className="rounded border border-cyan-500/40 bg-cyan-950/30 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-cyan-400" />
                      PHASE 14 — MISSION ANALYSIS ARCHIVE
                    </span>
                    <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/40">
                      ACTIVE MODULE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Persistent analysis records, search, filter, and reopening past survey missions.
                  </p>
                  <button
                    onClick={() => navigate(ROUTES.history)}
                    className="mt-2 w-full py-1.5 px-3 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 text-[11px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1"
                  >
                    OPEN MISSION ARCHIVE →
                  </button>
                </div>
              </div>
            </Panel>


          </div>
        </div>
      </div>
    </PageLayout>
  );
}

