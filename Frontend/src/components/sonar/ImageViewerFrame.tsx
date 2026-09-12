import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Grid,
  Layers,
  MousePointer,
  Move,
  Ruler,
  Trash2,
  HelpCircle,
  Crosshair,
  Info,
} from 'lucide-react';
import SonarGrid from './SonarGrid';
import ScanLine from './ScanLine';
import type { Anomaly } from '@/types/api';

export type WorkstationTool = 'SELECT' | 'PAN' | 'MEASURE';

export interface MeasurementLine {
  id: string;
  startX: number; // In canvas percentage or pixel coords
  startY: number;
  endX: number;
  endY: number;
  distancePx: number;
  distanceM: number | null;
}

interface ImageViewerFrameProps {
  title?: string;
  resolution?: string;
  lat?: number;
  lon?: number;
  sonarType?: string;
  metersPerPixel?: number | null; // e.g. 0.15 meters per pixel
  selectedAnomaly?: Anomaly | null;
  children?: React.ReactNode;
  isScanning?: boolean;
}

export const ImageViewerFrame: React.FC<ImageViewerFrameProps> = ({
  title = 'SIDE-SCAN SONAR WORKSTATION',
  resolution = '1024 × 512 px',
  lat = -6.3,
  lon = 71.2,
  sonarType = 'Dual-Freq 900 kHz',
  metersPerPixel = 0.15, // Default calibrated 0.15m/px if available
  selectedAnomaly = null,
  children,
  isScanning = false,
}) => {
  // Navigation & Tool States
  const [activeTool, setActiveTool] = useState<WorkstationTool>('SELECT');
  const [zoom, setZoom] = useState<number>(100);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(true);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState<boolean>(false);

  // Pan interaction state
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Measurement state
  const [measurements, setMeasurements] = useState<MeasurementLine[]>([]);
  const [activeDrawingLine, setActiveDrawingLine] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);

  // Cursor position telemetry state (image relative pixels)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);

  // Parse width & height from resolution string (e.g. "1024 × 512 px")
  const [imageWidth, imageHeight] = React.useMemo(() => {
    const parts = resolution.match(/(\d+)\s*×\s*(\d+)/);
    if (parts) {
      return [parseInt(parts[1], 10), parseInt(parts[2], 10)];
    }
    return [1024, 512];
  }, [resolution]);

  // Zoom handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 500));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleResetZoom = () => {
    setZoom(100);
    setPanOffset({ x: 0, y: 0 });
  };
  const handleFitToView = () => {
    setZoom(100);
    setPanOffset({ x: 0, y: 0 });
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      switch (e.key.toLowerCase()) {
        case 'v':
          setActiveTool('SELECT');
          break;
        case 'p':
          setActiveTool('PAN');
          break;
        case 'm':
          setActiveTool('MEASURE');
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
        case '_':
          handleZoomOut();
          break;
        case 'r':
          handleResetZoom();
          break;
        case 'c':
          setMeasurements([]);
          setActiveDrawingLine(null);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(prev + 15, 500));
    } else {
      setZoom((prev) => Math.max(prev - 15, 50));
    }
  };

  // Calculate mouse position relative to image viewport
  const getRelativeCoords = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageWrapperRef.current) return { x: 0, y: 0, pctX: 0, pctY: 0 };
    const rect = imageWrapperRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    
    // Normalize percentage [0, 100]
    const pctX = Math.max(0, Math.min(100, (clientX / rect.width) * 100));
    const pctY = Math.max(0, Math.min(100, (clientY / rect.height) * 100));
    
    // Map to pixel dimensions
    const pxX = Math.round((pctX / 100) * imageWidth);
    const pxY = Math.round((pctY / 100) * imageHeight);

    return { x: pxX, y: pxY, pctX, pctY, rawWidth: rect.width, rawHeight: rect.height };
  }, [imageWidth, imageHeight]);

  // Pointer movement tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const coords = getRelativeCoords(e);
    setCursorPos({ x: coords.x, y: coords.y });

    // Handle Pan dragging
    if (isPanning && activeTool === 'PAN') {
      const deltaX = e.clientX - panStartRef.current.x;
      const deltaY = e.clientY - panStartRef.current.y;
      setPanOffset((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      panStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Handle Measurement drawing
    if (activeDrawingLine && activeTool === 'MEASURE') {
      setActiveDrawingLine((prev) => (prev ? { ...prev, endX: coords.pctX, endY: coords.pctY } : null));
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'PAN' || e.button === 1) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (activeTool === 'MEASURE' && e.button === 0) {
      const coords = getRelativeCoords(e);
      if (!activeDrawingLine) {
        // Start drawing measurement line
        setActiveDrawingLine({
          startX: coords.pctX,
          startY: coords.pctY,
          endX: coords.pctX,
          endY: coords.pctY,
        });
      } else {
        // Finish measurement line
        const startPxX = (activeDrawingLine.startX / 100) * imageWidth;
        const startPxY = (activeDrawingLine.startY / 100) * imageHeight;
        const endPxX = (coords.pctX / 100) * imageWidth;
        const endPxY = (coords.pctY / 100) * imageHeight;

        const distancePx = Math.round(Math.hypot(endPxX - startPxX, endPxY - startPxY));
        const distanceM = metersPerPixel != null && metersPerPixel > 0 ? Number((distancePx * metersPerPixel).toFixed(1)) : null;

        const newLine: MeasurementLine = {
          id: `MSR-${Date.now().toString().slice(-4)}`,
          startX: activeDrawingLine.startX,
          startY: activeDrawingLine.startY,
          endX: coords.pctX,
          endY: coords.pctY,
          distancePx,
          distanceM,
        };

        setMeasurements((prev) => [...prev, newLine]);
        setActiveDrawingLine(null);
      }
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
  };

  // Selected anomaly dimensions calculation
  const anomalyDimensions = React.useMemo(() => {
    if (!selectedAnomaly || !selectedAnomaly.bbox) return null;
    const { w, h } = selectedAnomaly.bbox;
    // Bbox values are percentages
    const widthPx = Math.round((w / 100) * imageWidth);
    const heightPx = Math.round((h / 100) * imageHeight);
    const widthM = metersPerPixel ? (widthPx * metersPerPixel).toFixed(1) : null;
    const heightM = metersPerPixel ? (heightPx * metersPerPixel).toFixed(1) : null;

    return {
      widthPx,
      heightPx,
      widthM,
      heightM,
    };
  }, [selectedAnomaly, imageWidth, imageHeight, metersPerPixel]);

  return (
    <div
      ref={containerRef}
      className="sonar-panel corner-notch relative flex flex-col overflow-hidden rounded-lg border border-cyan-500/30 bg-[#050D1A]/90 select-none shadow-xl"
    >
      {/* Workstation Header Telemetry & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/20 bg-cyan-950/40 px-3 py-2 text-xs font-mono text-cyan-300">
        <div className="flex items-center gap-3 font-semibold">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Layers className="h-3.5 w-3.5" />
            {title}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 text-[11px]">{sonarType}</span>
        </div>

        {/* Investigation Tool Selector */}
        <div className="flex items-center gap-1 bg-[#0A1628] p-1 rounded border border-cyan-500/30">
          <button
            onClick={() => setActiveTool('SELECT')}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-bold transition-all ${
              activeTool === 'SELECT'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.25)]'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
            title="Select AI Contact (V)"
          >
            <MousePointer className="h-3.5 w-3.5" />
            SELECT
          </button>

          <button
            onClick={() => setActiveTool('PAN')}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-bold transition-all ${
              activeTool === 'PAN'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.25)]'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
            title="Pan Sonar Canvas (P)"
          >
            <Move className="h-3.5 w-3.5" />
            PAN
          </button>

          <button
            onClick={() => setActiveTool('MEASURE')}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-bold transition-all ${
              activeTool === 'MEASURE'
                ? 'bg-amber-500/30 text-amber-200 border border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                : 'text-slate-400 hover:text-amber-300'
            }`}
            title="Distance Measurement Tool (M)"
          >
            <Ruler className="h-3.5 w-3.5" />
            MEASURE
          </button>
        </div>

        {/* Telemetry Status Items */}
        <div className="flex items-center gap-4 text-[11px] text-slate-300">
          <span>
            LAT: <strong className="text-cyan-400">{lat.toFixed(4)}°</strong>
          </span>
          <span>
            LON: <strong className="text-cyan-400">{lon.toFixed(4)}°</strong>
          </span>
          <span>
            RES: <strong className="text-slate-200">{resolution}</strong>
          </span>
          <span>
            ZOOM: <strong className="text-cyan-400">{zoom}%</strong>
          </span>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div
        className={`relative min-h-[440px] w-full flex-1 overflow-hidden bg-black/90 ${
          activeTool === 'PAN' ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : activeTool === 'MEASURE' ? 'cursor-crosshair' : 'cursor-default'
        }`}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setCursorPos(null)}
      >
        {/* Sonar Grid Overlay */}
        {showGridOverlay && <SonarGrid className="absolute inset-0 z-10 pointer-events-none" opacity={0.25} />}

        {/* ScanLine Beam when active */}
        {isScanning && <ScanLine direction="horizontal" className="z-10 pointer-events-none" />}

        {/* Canvas & Image Container with Pan + Zoom transform */}
        <div
          ref={imageWrapperRef}
          className="relative h-full w-full flex items-center justify-center transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100})`,
            transformOrigin: 'center center',
          }}
        >
          {children || (
            <div className="flex flex-col items-center justify-center gap-2 p-12 text-slate-500">
              <span className="font-mono text-xs">NO SONAR IMAGE LOADED</span>
            </div>
          )}

          {/* SVG Layer for Temporary Measurements */}
          <svg className="absolute inset-0 h-full w-full pointer-events-none z-20 overflow-visible">
            {measurements.map((m) => (
              <g key={m.id}>
                {/* Measurement Line */}
                <line
                  x1={`${m.startX}%`}
                  y1={`${m.startY}%`}
                  x2={`${m.endX}%`}
                  y2={`${m.endY}%`}
                  stroke="#F59E0B"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
                {/* End Point Circles */}
                <circle cx={`${m.startX}%`} cy={`${m.startY}%`} r="4" fill="#F59E0B" stroke="#000" strokeWidth="1" />
                <circle cx={`${m.endX}%`} cy={`${m.endY}%`} r="4" fill="#F59E0B" stroke="#000" strokeWidth="1" />
                {/* Distance Badge */}
                <foreignObject
                  x={`${(m.startX + m.endX) / 2 - 30}%`}
                  y={`${(m.startY + m.endY) / 2 - 2}%`}
                  width="120"
                  height="30"
                  className="overflow-visible"
                >
                  <div className="inline-block rounded bg-amber-950/90 border border-amber-500/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-300 shadow-md">
                    {m.distanceM != null ? `${m.distanceM} m` : `${m.distancePx} px`}
                  </div>
                </foreignObject>
              </g>
            ))}

            {/* Active Drawing Measurement Line */}
            {activeDrawingLine && (
              <g>
                <line
                  x1={`${activeDrawingLine.startX}%`}
                  y1={`${activeDrawingLine.startY}%`}
                  x2={`${activeDrawingLine.endX}%`}
                  y2={`${activeDrawingLine.endY}%`}
                  stroke="#00F0FF"
                  strokeWidth="2"
                />
                <circle cx={`${activeDrawingLine.startX}%`} cy={`${activeDrawingLine.startY}%`} r="4" fill="#00F0FF" />
                <circle cx={`${activeDrawingLine.endX}%`} cy={`${activeDrawingLine.endY}%`} r="4" fill="#00F0FF" />
              </g>
            )}
          </svg>
        </div>

        {/* Live Cursor Pixel Inspector Overlay (Top Left) */}
        {cursorPos && (
          <div className="absolute top-3 left-3 z-30 flex items-center gap-3 rounded border border-cyan-500/30 bg-[#050D1A]/85 px-3 py-1.5 font-mono text-[11px] text-cyan-300 backdrop-blur-md shadow-md">
            <div className="flex items-center gap-1 text-cyan-400 font-bold">
              <Crosshair className="h-3.5 w-3.5" />
              CURSOR:
            </div>
            <span>
              X: <strong className="text-white">{cursorPos.x}</strong> px
            </span>
            <span>
              Y: <strong className="text-white">{cursorPos.y}</strong> px
            </span>
          </div>
        )}

        {/* Scientific Scale Bar Overlay (Bottom Left) */}
        <div className="absolute bottom-3 left-3 z-30 flex flex-col gap-1 rounded border border-cyan-500/30 bg-[#050D1A]/85 p-2.5 font-mono text-[10px] backdrop-blur-md shadow-md">
          <div className="flex items-center justify-between text-slate-400 font-bold">
            <span>
              {metersPerPixel != null
                ? `CALIBRATED SCALE (${metersPerPixel} m/px)`
                : 'PIXEL SCALE (UNCALIBRATED)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">0</span>
            <div className="relative h-2 w-28 border-b-2 border-l-2 border-r-2 border-cyan-400">
              <div className="absolute inset-0 bg-cyan-400/20" />
            </div>
            <span className="font-bold text-cyan-300">
              {metersPerPixel != null
                ? `${(100 * metersPerPixel).toFixed(1)} m`
                : '100 px'}
            </span>
          </div>
        </div>

        {/* Selected Anomaly Bounding Box Dimensions Inspector Overlay (Top Right) */}
        {selectedAnomaly && anomalyDimensions && (
          <div className="absolute top-3 right-3 z-30 max-w-xs rounded border border-cyan-500/40 bg-[#050D1A]/90 p-3 font-mono text-xs text-cyan-300 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5 mb-2">
              <span className="font-bold text-cyan-400 uppercase text-[11px] flex items-center gap-1">
                <Info className="h-3.5 w-3.5" />
                IMAGE-BASED EXTENT
              </span>
              <span className="text-[10px] text-slate-400">{selectedAnomaly.id}</span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">PIXEL SIZE:</span>
                <span className="font-bold text-white">
                  {anomalyDimensions.widthPx} × {anomalyDimensions.heightPx} px
                </span>
              </div>

              {anomalyDimensions.widthM != null ? (
                <div className="flex justify-between border-t border-cyan-500/10 pt-1">
                  <span className="text-emerald-400 font-bold">ESTIMATED PHYSICAL:</span>
                  <span className="font-bold text-emerald-300">
                    {anomalyDimensions.widthM} × {anomalyDimensions.heightM} m
                  </span>
                </div>
              ) : (
                <div className="text-[10px] text-amber-400/80 border-t border-cyan-500/10 pt-1">
                  Physical dimensions uncalibrated (no m/px scale).
                </div>
              )}
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Help Overlay */}
        {showShortcutsHelp && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="max-w-sm w-full rounded border border-cyan-500/40 bg-[#050D1A] p-5 font-mono text-xs text-cyan-300 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
                <span className="font-bold text-cyan-400 uppercase flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  WORKSTATION SHORTCUTS
                </span>
                <button
                  onClick={() => setShowShortcutsHelp(false)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between border-b border-cyan-500/10 pb-1">
                  <span className="text-slate-400">V</span>
                  <span className="font-bold text-white">Select AI Contact Tool</span>
                </div>
                <div className="flex justify-between border-b border-cyan-500/10 pb-1">
                  <span className="text-slate-400">P</span>
                  <span className="font-bold text-white">Pan Canvas Tool</span>
                </div>
                <div className="flex justify-between border-b border-cyan-500/10 pb-1">
                  <span className="text-slate-400">M</span>
                  <span className="font-bold text-white">Distance Measurement Tool</span>
                </div>
                <div className="flex justify-between border-b border-cyan-500/10 pb-1">
                  <span className="text-slate-400">+ / -</span>
                  <span className="font-bold text-white">Zoom In / Zoom Out</span>
                </div>
                <div className="flex justify-between border-b border-cyan-500/10 pb-1">
                  <span className="text-slate-400">R</span>
                  <span className="font-bold text-white">Reset View & Pan</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">C</span>
                  <span className="font-bold text-white">Clear Temporary Measurements</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls & Measurement Manager Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cyan-500/20 bg-cyan-950/40 px-3 py-2 text-xs text-slate-300">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomIn}
            className="flex items-center gap-1 rounded bg-cyan-900/40 border border-cyan-500/30 px-2 py-1 hover:bg-cyan-800/60 hover:text-cyan-300 transition-colors"
            title="Zoom In (+)"
          >
            <ZoomIn className="h-3.5 w-3.5 text-cyan-400" />
          </button>
          <button
            onClick={handleZoomOut}
            className="flex items-center gap-1 rounded bg-cyan-900/40 border border-cyan-500/30 px-2 py-1 hover:bg-cyan-800/60 hover:text-cyan-300 transition-colors"
            title="Zoom Out (-)"
          >
            <ZoomOut className="h-3.5 w-3.5 text-cyan-400" />
          </button>
          <button
            onClick={handleResetZoom}
            className="flex items-center gap-1 rounded bg-cyan-900/40 border border-cyan-500/30 px-2.5 py-1 font-mono text-[11px] text-cyan-300 hover:bg-cyan-800/60 transition-colors"
            title="Reset View (R)"
          >
            <RefreshCw className="h-3.5 w-3.5 text-cyan-400 mr-1" />
            RESET
          </button>
          <button
            onClick={handleFitToView}
            className="flex items-center gap-1 rounded bg-cyan-900/40 border border-cyan-500/30 px-2.5 py-1 font-mono text-[11px] text-cyan-300 hover:bg-cyan-800/60 transition-colors"
            title="Fit to Viewport"
          >
            <Maximize2 className="h-3.5 w-3.5 text-cyan-400 mr-1" />
            FIT
          </button>
        </div>

        {/* Temporary Measurements Telemetry & Clear */}
        <div className="flex items-center gap-3">
          {measurements.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-amber-300 font-bold">
                {measurements.length} MEASUREMENT{measurements.length > 1 ? 'S' : ''} ACTIVE
              </span>
              <button
                onClick={() => setMeasurements([])}
                className="flex items-center gap-1 rounded bg-rose-950/60 border border-rose-500/40 px-2 py-0.5 font-mono text-[10px] text-rose-300 hover:bg-rose-900/80 transition-colors"
                title="Clear Measurements (C)"
              >
                <Trash2 className="h-3 w-3" />
                CLEAR ALL
              </button>
            </div>
          )}

          <button
            onClick={() => setShowGridOverlay(!showGridOverlay)}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-[11px] transition-colors ${
              showGridOverlay
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800/60 text-slate-400'
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            GRID
          </button>

          <button
            onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
            className="rounded p-1 text-slate-400 hover:text-cyan-300 transition-colors"
            title="Workstation Keyboard Shortcuts"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageViewerFrame;
