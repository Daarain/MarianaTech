import React, { useState, useRef, useCallback, useEffect, type DragEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  File as FileIcon,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Globe,
  Sliders,
  Radio,
  Layers,
  ArrowRight,
  Database,
  Activity,
  FileText,
  Maximize2,
  Trash2,
  Zap,
} from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { COLOURS } from '@/constants/colours';
import { ROUTES } from '@/constants/routes';
import { useDetection } from '@/hooks/useDetection';
import { useToast } from '@/context/ToastContext';
import { useMissionContext } from '@/context/MissionContext';
import ImageViewerFrame from '@/components/sonar/ImageViewerFrame';
import SonarGrid from '@/components/sonar/SonarGrid';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import StatusIndicator from '@/components/ui/StatusIndicator';
import ProgressBar from '@/components/ui/ProgressBar';

export type IngestionState =
  | 'IDLE'
  | 'SELECTED'
  | 'VALIDATING'
  | 'UPLOADING'
  | 'SUCCESS'
  | 'FAILED'
  | 'INVALID';

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.tiff', '.bmp'];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB limit


const LOCATION_PRESETS = [
  { label: 'Chagos Trench (Indian Ocean)', lat: -6.3000, lon: 71.2000 },
  { label: 'Carlsberg Ridge (Arabian Sea)', lat: 3.8000, lon: 64.5000 },
  { label: 'Andaman Basin (Bay of Bengal)', lat: 10.2000, lon: 93.8000 },
];

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 Bytes';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function MissionUpload() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { setStagedDataset, setStagedDetectionResult } = useMissionContext();
  const { analyze, loading: isAnalyzing, error: apiError, result: detectionResult, reset: resetDetection } = useDetection();

  const [state, setState] = useState<IngestionState>('IDLE');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Geographic coordinates
  const [latitude, setLatitude] = useState<number>(-6.3000);
  const [longitude, setLongitude] = useState<number>(71.2000);
  const [latInput, setLatInput] = useState<string>('-6.3000');
  const [lonInput, setLonInput] = useState<string>('71.2000');
  const [locationName, setLocationName] = useState<string>('Chagos Trench, Indian Ocean');

  // Real image dimensions extracted locally
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
    aspectRatio: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Client-side file validation & preview generation
  const handleFileSelection = useCallback((file: File) => {
    // 1. Reset state
    resetDetection();
    setValidationError(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    // 2. Validate Extension
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setSelectedFile(null);
      setImageDimensions(null);
      setValidationError(
        `Unsupported file extension '${ext}'. Accepted formats: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()}`
      );
      setState('INVALID');
      showToast(`Invalid file format '${ext}'`, 'error');
      return;
    }

    // 3. Validate Size
    if (file.size === 0) {
      setSelectedFile(null);
      setImageDimensions(null);
      setValidationError('Selected sonar file is empty (0 bytes).');
      setState('INVALID');
      showToast('Uploaded file is empty', 'error');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSelectedFile(null);
      setImageDimensions(null);
      setValidationError(`File size (${formatBytes(file.size)}) exceeds maximum ingestion limit (500 MB).`);
      setState('INVALID');
      showToast('File size limit exceeded', 'error');
      return;
    }

    // 4. File is valid on client
    setSelectedFile(file);
    setState('VALIDATING');

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setStagedDataset(file, url, latitude, longitude);

    // 5. Read image dimensions
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const ar = h > 0 ? parseFloat((w / h).toFixed(3)) : 1;
      setImageDimensions({ width: w, height: h, aspectRatio: ar });
      setState('SELECTED');
      showToast(`Sonar image validated (${w}x${h}px)`, 'success');
    };
    img.onerror = () => {
      setState('INVALID');
      setValidationError('Failed to decode image data. File may be corrupted or unreadable.');
      showToast('Image decoding failed', 'error');
    };
    img.src = url;
  }, [previewUrl, resetDetection, setStagedDataset, latitude, longitude, showToast]);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleBrowse = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleLatitudeChange = (val: string) => {
    setLatInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= -90 && parsed <= 90) {
      setLatitude(parsed);
      if (selectedFile && previewUrl) {
        setStagedDataset(selectedFile, previewUrl, parsed, longitude);
      }
    }
  };

  const handleLongitudeChange = (val: string) => {
    setLonInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= -180 && parsed <= 180) {
      setLongitude(parsed);
      if (selectedFile && previewUrl) {
        setStagedDataset(selectedFile, previewUrl, latitude, parsed);
      }
    }
  };

  const handleSelectPreset = (preset: typeof LOCATION_PRESETS[0]) => {
    setLatitude(preset.lat);
    setLongitude(preset.lon);
    setLatInput(preset.lat.toFixed(4));
    setLonInput(preset.lon.toFixed(4));
    setLocationName(preset.label);
    if (selectedFile && previewUrl) {
      setStagedDataset(selectedFile, previewUrl, preset.lat, preset.lon);
    }
    showToast(`Coordinates updated to ${preset.label}`, 'info');
  };

  const handleClearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setImageDimensions(null);
    setValidationError(null);
    resetDetection();
    setStagedDataset(null, null);
    setStagedDetectionResult(null);
    setState('IDLE');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartIngestion = async () => {
    if (!selectedFile) return;

    setState('UPLOADING');
    setUploadProgress(15);
    const progressTimer = setInterval(() => {
      setUploadProgress((prev) => (prev < 85 ? prev + 15 : prev));
    }, 250);

    try {
      showToast('Submitting sonar dataset to backend processing engine...', 'info');
      const data = await analyze(selectedFile, latitude, longitude);
      clearInterval(progressTimer);
      setUploadProgress(100);
      setState('SUCCESS');
      setStagedDetectionResult(data);
      showToast(`Ingestion complete! ${data.anomalies_detected} contacts detected.`, 'success');
    } catch (err: any) {
      clearInterval(progressTimer);
      setUploadProgress(0);
      setState('FAILED');
      showToast(err?.message || 'Ingestion request failed', 'error');
    }
  };

  return (
    <PageLayout title="Sonar Data Ingestion">
      <div className="flex flex-col gap-6">
        {/* Header telemetry banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-cyan-500/20 bg-[#050D1A]/90 p-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 font-semibold">
                  ACQUISITION STATION
                </span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-[10px] text-slate-400">SIH 2026 / NIOT-MoES</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Side-Scan Sonar Data Ingestion Workflow
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusIndicator
              status={
                state === 'SUCCESS'
                  ? 'online'
                  : state === 'UPLOADING' || state === 'VALIDATING'
                  ? 'warning'
                  : state === 'FAILED' || state === 'INVALID'
                  ? 'error'
                  : state === 'SELECTED'
                  ? 'ready'
                  : 'offline'
              }
              label={
                state === 'SUCCESS'
                  ? 'DATASET READY'
                  : state === 'UPLOADING'
                  ? 'INGESTING DATA...'
                  : state === 'VALIDATING'
                  ? 'VALIDATING FILE'
                  : state === 'FAILED'
                  ? 'INGESTION FAILED'
                  : state === 'INVALID'
                  ? 'INVALID INPUT'
                  : state === 'SELECTED'
                  ? 'FILE STAGED'
                  : 'AWAITING INPUT'
              }
            />
          </div>
        </div>

        {/* Main Grid: Left Column Ingestion / Preview (60%), Right Column Metadata / Coordinates (40%) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            {/* Tactical Dropzone if NO file selected or file invalid */}
            {(state === 'IDLE' || state === 'INVALID') && (
              <Panel title="SONAR DATA INGESTION ZONE">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative cursor-pointer overflow-hidden rounded-lg border-2 border-dashed p-10 text-center transition-all duration-300 ${
                    isDragOver
                      ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_25px_rgba(6,182,212,0.25)]'
                      : state === 'INVALID'
                      ? 'border-rose-500/40 bg-rose-950/20 hover:border-rose-500/60'
                      : 'border-cyan-500/30 bg-[#050D1A]/80 hover:border-cyan-400/60 hover:bg-cyan-950/20'
                  }`}
                >
                  <SonarGrid className="absolute inset-0 z-0 opacity-20 pointer-events-none" />

                  <div className="relative z-10 flex flex-col items-center justify-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                      <Upload className="h-8 w-8 animate-pulse" />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white">
                        {isDragOver ? 'DROP SONAR DATA FILE HERE' : 'IMPORT SIDE-SCAN SONAR DATA'}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
                        Drag and drop supported acoustic sonar imagery or select a file from your computer to initialize ingestion pipeline.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-cyan-300">
                      <span className="rounded bg-cyan-950/60 px-2 py-1 border border-cyan-500/30">.PNG</span>
                      <span className="rounded bg-cyan-950/60 px-2 py-1 border border-cyan-500/30">.JPG / .JPEG</span>
                      <span className="rounded bg-cyan-950/60 px-2 py-1 border border-cyan-500/30">.TIFF</span>
                      <span className="rounded bg-cyan-950/60 px-2 py-1 border border-cyan-500/30">.BMP</span>
                      <span className="text-slate-400">| Max limit: 500 MB</span>
                    </div>

                    <Button variant="outline" size="sm" className="mt-2">
                      <FileIcon className="h-4 w-4 mr-2" />
                      SELECT FROM COMPUTER
                    </Button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.tiff,.bmp"
                    onChange={handleBrowse}
                    className="hidden"
                  />
                </div>
              </Panel>
            )}

            {/* Invalid File Banner */}
            {state === 'INVALID' && validationError && (
              <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-4 font-mono text-xs text-rose-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <h4 className="font-bold uppercase tracking-wider text-rose-300">
                      INVALID SONAR INPUT
                    </h4>
                    <p className="text-slate-300 text-xs">{validationError}</p>
                    <div className="pt-2 flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleClearFile}
                        className="border-rose-500/30 text-rose-200 hover:bg-rose-900/40"
                      >
                        <RefreshCw className="h-3 w-3 mr-1.5" />
                        SELECT ANOTHER FILE
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sonar Image Preview Frame when File is Staged or Processed */}
            {previewUrl && selectedFile && state !== 'INVALID' && (
              <div className="flex flex-col gap-3">
                <ImageViewerFrame
                  title={selectedFile.name.toUpperCase()}
                  resolution={
                    imageDimensions
                      ? `${imageDimensions.width} x ${imageDimensions.height} px`
                      : 'DECODING...'
                  }
                  lat={latitude}
                  lon={longitude}
                  sonarType="Side-Scan Sonar 900 kHz"
                  isScanning={state === 'UPLOADING' || state === 'VALIDATING'}
                >
                  <img
                    src={previewUrl}
                    alt="Side-Scan Sonar Preview"
                    className="max-h-[480px] w-full object-contain rounded"
                  />
                </ImageViewerFrame>

                {/* Staged File Action Control Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cyan-500/20 bg-[#050D1A]/90 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-cyan-900/40 text-cyan-400">
                      <FileIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-mono text-xs font-bold text-white truncate max-w-xs">
                        {selectedFile.name}
                      </p>
                      <p className="font-mono text-[10px] text-slate-400">
                        Size: {formatBytes(selectedFile.size)} • Type: {selectedFile.type || 'image/raw'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearFile}
                      disabled={state === 'UPLOADING'}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      REMOVE
                    </Button>

                    {state === 'SELECTED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleStartIngestion}
                        disabled={isAnalyzing}
                      >
                        <Zap className="h-4 w-4 mr-1.5" />
                        INGEST & ANALYZE SONAR DATA
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Upload In-Progress State */}
            {state === 'UPLOADING' && (
              <Panel title="INGESTION STREAM IN PROGRESS">
                <div className="space-y-4 py-2 font-mono">
                  <div className="flex items-center justify-between text-xs text-cyan-300">
                    <span className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-cyan-400 animate-spin" />
                      TRANSMITTING MULTIPART SONAR PAYLOAD TO BACKEND...
                    </span>
                    <span className="font-bold text-cyan-400">{uploadProgress}%</span>
                  </div>

                  <ProgressBar value={uploadProgress} variant="cyan" />

                  <p className="text-[11px] text-slate-400">
                    Executing backend preprocessing, spatial registration, and noise filter verification on target host.
                  </p>
                </div>
              </Panel>
            )}

            {/* Success State Panel */}
            {state === 'SUCCESS' && (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-5 font-mono">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-emerald-300 tracking-wide">
                        SONAR DATA RECEIVED & VERIFIED
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">
                        File successfully processed by the MarianaTech ingestion engine. Preprocessing metrics and anomaly candidates registered.
                      </p>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => navigate(ROUTES.missionViewer.replace(':id', 'MSN-2026-0142'))}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                      >
                        CONTINUE TO ANALYSIS WORKSPACE
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleClearFile}
                        className="border-emerald-500/30 text-emerald-200"
                      >
                        INGEST ANOTHER DATASET
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ingestion Failure State Panel */}
            {state === 'FAILED' && (
              <div className="rounded-lg border border-rose-500/40 bg-rose-950/30 p-5 font-mono">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="h-6 w-6 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-rose-300 tracking-wide">
                        INGESTION FAILED
                      </h4>
                      <p className="text-xs text-rose-200 mt-1">
                        {apiError || 'Backend ingestion endpoint returned an error or network request failed.'}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleStartIngestion}
                        className="bg-rose-600 hover:bg-rose-500 text-white"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        RETRY UPLOAD
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleClearFile}
                        className="border-rose-500/30 text-rose-200"
                      >
                        REMOVE FILE
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Metadata & Geospatial Configuration (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* Geographic Coordinates Configuration Panel */}
            <Panel title="GEOSPATIAL COORDINATES">
              <div className="space-y-4 font-mono text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Globe className="h-4 w-4 text-cyan-400" />
                  <span className="font-semibold text-white">Survey Location Origin</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">LATITUDE (°N/S)</label>
                    <input
                      type="number"
                      step="0.0001"
                      min="-90"
                      max="90"
                      value={latInput}
                      onChange={(e) => handleLatitudeChange(e.target.value)}
                      disabled={state === 'UPLOADING'}
                      className="w-full rounded bg-cyan-950/40 border border-cyan-500/30 px-3 py-2 text-cyan-300 font-mono focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">LONGITUDE (°E/W)</label>
                    <input
                      type="number"
                      step="0.0001"
                      min="-180"
                      max="180"
                      value={lonInput}
                      onChange={(e) => handleLongitudeChange(e.target.value)}
                      disabled={state === 'UPLOADING'}
                      className="w-full rounded bg-cyan-950/40 border border-cyan-500/30 px-3 py-2 text-cyan-300 font-mono focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1.5">LOCATION PRESETS</label>
                  <div className="flex flex-col gap-1.5">
                    {LOCATION_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        disabled={state === 'UPLOADING'}
                        className={`flex items-center justify-between rounded px-2.5 py-1.5 text-left text-[11px] transition-colors ${
                          latitude === preset.lat && longitude === preset.lon
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-900/60 text-slate-400 hover:bg-cyan-950/30 hover:text-slate-200'
                        }`}
                      >
                        <span>{preset.label}</span>
                        <span className="text-[10px] text-cyan-500 font-mono">
                          [{preset.lat}, {preset.lon}]
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded bg-slate-900/60 p-3 border border-slate-800 text-[11px] text-slate-400">
                  <span className="text-slate-300 font-semibold">GEOLOCATION SUMMARY:</span>
                  <div className="mt-1 flex items-center justify-between text-cyan-400 font-bold">
                    <span>{locationName}</span>
                    <span>{latitude.toFixed(4)}°, {longitude.toFixed(4)}°</span>
                  </div>
                </div>
              </div>
            </Panel>

            {/* File & Image Technical Information */}
            <Panel title="FILE TECHNICAL METADATA">
              {selectedFile && imageDimensions ? (
                <div className="space-y-3 font-mono text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-cyan-500/10">
                    <span className="text-slate-400">Filename:</span>
                    <span className="text-white font-semibold truncate max-w-[200px]" title={selectedFile.name}>
                      {selectedFile.name}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-cyan-500/10">
                    <span className="text-slate-400">File Size:</span>
                    <span className="text-cyan-300">{formatBytes(selectedFile.size)}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-cyan-500/10">
                    <span className="text-slate-400">MIME / Extension:</span>
                    <span className="text-cyan-300">
                      {selectedFile.type || `.${selectedFile.name.split('.').pop()}`}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-cyan-500/10">
                    <span className="text-slate-400">Dimensions:</span>
                    <span className="text-cyan-300 font-bold">
                      {imageDimensions.width} × {imageDimensions.height} px
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-cyan-500/10">
                    <span className="text-slate-400">Aspect Ratio:</span>
                    <span className="text-cyan-300">{imageDimensions.aspectRatio} : 1</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Local Object URL:</span>
                    <span className="text-emerald-400 font-semibold">STAGED</span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center font-mono text-xs text-slate-500">
                  <FileText className="h-8 w-8 mx-auto text-slate-700 mb-2" />
                  <span>NO FILE SELECTED FOR METADATA EXTRACTION</span>
                </div>
              )}
            </Panel>

            {/* Backend Extraction & Preprocessing Metrics */}
            <Panel title="BACKEND EXTRACTION METRICS">
              {detectionResult ? (
                <div className="space-y-3 font-mono text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-cyan-500/10">
                    <span className="text-slate-400">Engine Status:</span>
                    <span className="text-emerald-400 font-bold uppercase">{detectionResult.status}</span>
                  </div>

                  {detectionResult.metadata && (
                    <>
                      <div className="flex justify-between py-1 border-b border-cyan-500/10">
                        <span className="text-slate-400">Image Format:</span>
                        <span className="text-cyan-300">{detectionResult.metadata.format}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-cyan-500/10">
                        <span className="text-slate-400">Color Mode:</span>
                        <span className="text-cyan-300">{detectionResult.metadata.mode}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-cyan-500/10">
                        <span className="text-slate-400">EXIF Data Present:</span>
                        <span className={detectionResult.metadata.has_exif ? 'text-emerald-400' : 'text-slate-400'}>
                          {detectionResult.metadata.has_exif ? 'YES' : 'NO'}
                        </span>
                      </div>
                    </>
                  )}

                  {detectionResult.preprocessing_metrics && (
                    <>
                      <div className="flex justify-between py-1 border-b border-cyan-500/10">
                        <span className="text-slate-400">Raw SNR:</span>
                        <span className="text-cyan-300 font-semibold">
                          {detectionResult.preprocessing_metrics.raw_snr} dB
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-cyan-500/10">
                        <span className="text-slate-400">Mean Intensity:</span>
                        <span className="text-cyan-300 font-semibold">
                          {detectionResult.preprocessing_metrics.mean_intensity}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-cyan-500/10">
                        <span className="text-slate-400">Noise Reduction Factor:</span>
                        <span className="text-cyan-300 font-semibold">
                          {detectionResult.preprocessing_metrics.noise_reduction_factor}x
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between py-1 pt-1">
                    <span className="text-slate-400">Detected Anomaly Contacts:</span>
                    <span className="text-cyan-400 font-bold text-sm">
                      {detectionResult.anomalies_detected} contacts
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center font-mono text-xs text-slate-500">
                  <Activity className="h-8 w-8 mx-auto text-slate-700 mb-2" />
                  <span>AWAITING BACKEND INGESTION FOR PREPROCESSING METRICS</span>
                </div>
              )}
            </Panel>

          </div>
        </div>
      </div>
    </PageLayout>
  );
}
