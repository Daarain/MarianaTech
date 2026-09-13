import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Globe,
  MapPin,
  Compass,
  Crosshair,
  Maximize2,
  Minimize2,
  Eye,
  Info,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import type { Anomaly } from '@/types/api';
import {
  isValidCoordinate,
  formatCoordinate,
  partitionByGeolocation,
  calculateMapCenterAndBounds,
  deriveSurveyTrack,
} from '@/utils/geolocationUtils';
import { getClassMetadata } from '@/utils/classificationUtils';
import { formatConfidenceLabel, normalizeConfidence } from '@/utils/confidenceUtils';
import Button from '@/components/ui/Button';

interface GeospatialMapContainerProps {
  anomalies: Anomaly[];
  rawAnomalies?: Anomaly[];
  selectedAnomaly: Anomaly | null;
  onSelectAnomaly: (anomaly: Anomaly | null) => void;
  onNavigateToSonar?: (anomaly: Anomaly) => void;
  originLat?: number;
  originLon?: number;
  height?: string;
}

export default function GeospatialMapContainer({
  anomalies,
  rawAnomalies = [],
  selectedAnomaly,
  onSelectAnomaly,
  onNavigateToSonar,
  originLat = -6.3000,
  originLon = 71.2000,
  height = '520px',
}: GeospatialMapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const trackLineRef = useRef<any>(null);

  const [mapReady, setMapReady] = useState(false);
  const [showTrack, setShowTrack] = useState(true);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);

  // Partition current visible anomalies into geolocated vs unlocated
  const partition = useMemo(() => partitionByGeolocation(anomalies), [anomalies]);
  const rawPartition = useMemo(
    () => partitionByGeolocation(rawAnomalies.length > 0 ? rawAnomalies : anomalies),
    [rawAnomalies, anomalies]
  );

  // Calculate center & bounds
  const mapBounds = useMemo(
    () => calculateMapCenterAndBounds(partition.geolocated, originLat, originLon),
    [partition.geolocated, originLat, originLon]
  );

  // Dynamic Leaflet Injection
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    let mounted = true;

    // Inject Leaflet CSS if not already present
    if (!document.getElementById('leaflet-css-cdn')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css-cdn';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initMap = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current || !mounted) return;

      try {
        if (leafletMapRef.current) return;

        const map = L.map(mapRef.current, {
          center: mapBounds.center,
          zoom: mapBounds.zoom,
          zoomControl: true,
          attributionControl: true,
        });

        // Dark nautical tile layer with satellite/ocean vibe
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap | NIOT-MoES Sonar Engine',
          className: 'dark-nautical-tiles',
          maxZoom: 18,
        }).addTo(map);

        leafletMapRef.current = map;
        setMapReady(true);
      } catch (err: any) {
        console.error('Leaflet initialization error:', err);
        if (mounted) setMapLoadError(err?.message || 'Failed to initialize Leaflet tile engine');
      }
    };

    const existingScript = document.getElementById('leaflet-js-cdn');
    if (existingScript) {
      if ((window as any).L) {
        initMap();
      } else {
        existingScript.addEventListener('load', initMap);
      }
    } else {
      const script = document.createElement('script');
      script.id = 'leaflet-js-cdn';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      script.onerror = () => {
        if (mounted) setMapLoadError('Network error loading Leaflet mapping library');
      };
      document.head.appendChild(script);
    }

    return () => {
      mounted = false;
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.remove();
        } catch (_) {}
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update Markers & Survey Track Line whenever geolocated anomalies or map ready state changes
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !leafletMapRef.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (trackLineRef.current) {
      trackLineRef.current.remove();
      trackLineRef.current = null;
    }

    if (!partition.hasGeolocatedPoints) return;

    // Draw survey track line if toggled
    if (showTrack) {
      const trackPoints = deriveSurveyTrack(originLat, originLon, partition.geolocated);
      if (trackPoints.length >= 2) {
        const polyline = L.polyline(trackPoints, {
          color: '#00f0ff',
          weight: 2,
          opacity: 0.6,
          dashArray: '6, 8',
        }).addTo(leafletMapRef.current);
        trackLineRef.current = polyline;
      }
    }

    // Render Markers for each geolocated anomaly
    partition.geolocated.forEach((anomaly) => {
      const isSelected = selectedAnomaly?.id === anomaly.id;
      const classMeta = getClassMetadata(anomaly.class_name);
      const confValue = normalizeConfidence(anomaly.confidence);

      const markerRadius =
        anomaly.priority === 'critical'
          ? 14
          : anomaly.priority === 'high'
          ? 11
          : anomaly.priority === 'medium'
          ? 9
          : 7;

      const circleMarker = L.circleMarker([anomaly.latitude, anomaly.longitude], {
        radius: isSelected ? markerRadius + 3 : markerRadius,
        fillColor: classMeta.color,
        color: isSelected ? '#ffffff' : classMeta.color,
        weight: isSelected ? 3 : 2,
        opacity: 0.95,
        fillOpacity: 0.85,
      }).addTo(leafletMapRef.current);

      // Create rich HTML popup
      const popupContent = document.createElement('div');
      popupContent.className = 'font-mono text-xs text-slate-100 p-1 min-w-[220px]';
      popupContent.innerHTML = `
        <div style="display:flex; align-items:center; justify-between; gap:8px; margin-bottom:8px; border-bottom:1px solid rgba(0,240,255,0.2); padding-bottom:6px;">
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${classMeta.color}; border:1px solid #fff;"></span>
            <strong style="color:#ffffff; font-size:13px; text-transform:uppercase;">${classMeta.label}</strong>
          </div>
          <span style="background:${classMeta.color}33; color:${classMeta.color}; border:1px solid ${classMeta.color}88; border-radius:4px; padding:2px 6px; font-size:10px; font-weight:bold;">
            ${formatConfidenceLabel(anomaly.confidence)}
          </span>
        </div>
        <div style="margin-bottom:6px; color:#94a3b8; font-size:11px;">
          <div><strong style="color:#e2e8f0;">CONTACT ID:</strong> ${anomaly.id}</div>
          <div><strong style="color:#e2e8f0;">LAT/LON:</strong> ${formatCoordinate(anomaly.latitude, anomaly.longitude)}</div>
          <div><strong style="color:#e2e8f0;">DEPTH:</strong> ${anomaly.depth_m || 4180} meters</div>
          <div><strong style="color:#e2e8f0;">PRIORITY:</strong> <span style="text-transform:uppercase; color:#00f0ff;">${anomaly.priority}</span></div>
          <div><strong style="color:#e2e8f0;">GEO SOURCE:</strong> GPS / Ping Metadata</div>
        </div>
      `;

      // Add "VIEW IN SONAR" button inside popup
      const btn = document.createElement('button');
      btn.className =
        'w-full mt-2 py-1.5 px-3 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 text-[11px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1';
      btn.innerText = 'VIEW IN SONAR ENGINE →';
      btn.onclick = () => {
        onSelectAnomaly(anomaly);
        if (onNavigateToSonar) {
          onNavigateToSonar(anomaly);
        }
      };
      popupContent.appendChild(btn);

      circleMarker.bindPopup(popupContent, {
        className: 'dark-nautical-popup',
      });

      circleMarker.on('click', () => {
        onSelectAnomaly(anomaly);
      });

      // Pulse animation for critical priority contacts
      if (anomaly.priority === 'critical') {
        const pulseMarker = L.circleMarker([anomaly.latitude, anomaly.longitude], {
          radius: markerRadius + 6,
          fillColor: 'transparent',
          color: classMeta.color,
          weight: 1.5,
          opacity: 0.5,
          className: 'pulse-ping-marker',
        }).addTo(leafletMapRef.current);
        markersRef.current.push(pulseMarker);
      }

      markersRef.current.push(circleMarker);
    });

    // Auto-fit bounds if bounds exist
    if (mapBounds.bounds) {
      try {
        leafletMapRef.current.fitBounds(mapBounds.bounds, { padding: [30, 30] });
      } catch (_) {}
    } else {
      leafletMapRef.current.setView(mapBounds.center, mapBounds.zoom);
    }
  }, [mapReady, partition.geolocated, selectedAnomaly, showTrack, mapBounds]);

  // Center map on selected anomaly if selection changes
  useEffect(() => {
    if (!leafletMapRef.current || !selectedAnomaly) return;
    if (isValidCoordinate(selectedAnomaly.latitude, selectedAnomaly.longitude)) {
      leafletMapRef.current.setView([selectedAnomaly.latitude, selectedAnomaly.longitude], 12, {
        animate: true,
      });
    }
  }, [selectedAnomaly]);

  const handleFitAll = () => {
    if (!leafletMapRef.current) return;
    if (mapBounds.bounds) {
      leafletMapRef.current.fitBounds(mapBounds.bounds, { padding: [30, 30] });
    } else {
      leafletMapRef.current.setView(mapBounds.center, mapBounds.zoom);
    }
  };

  return (
    <div className="flex flex-col gap-3 font-mono">
      {/* Map Control Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cyan-500/20 bg-[#050D1A]/90 p-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Globe className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wider flex items-center gap-2">
              GEOSPATIAL ANOMALY MAP
              <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] text-cyan-400 border border-cyan-500/30">
                WGS 84 / LAT-LON
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {partition.hasGeolocatedPoints ? (
                <span>
                  Showing <strong className="text-cyan-300">{partition.geolocatedCount}</strong> of{' '}
                  <strong className="text-slate-200">{partition.totalCount}</strong> contacts with valid GPS coordinates
                </span>
              ) : (
                <span className="text-amber-400 font-semibold">GEOLOCATION DATA UNAVAILABLE</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {partition.hasGeolocatedPoints && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTrack(!showTrack)}
                className={`text-[11px] ${showTrack ? 'border-cyan-500/40 text-cyan-300' : 'text-slate-400'}`}
              >
                <Compass className="h-3 w-3 mr-1 inline" />
                {showTrack ? 'HIDE TRACK' : 'SHOW TRACK'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleFitAll}
                className="text-[11px] border-cyan-500/40 text-cyan-300"
              >
                <Maximize2 className="h-3 w-3 mr-1 inline" />
                FIT ALL MARKERS
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Leaflet Map Viewport Frame */}
      <div
        className="relative rounded-lg border border-cyan-500/20 bg-[#061527] overflow-hidden"
        style={{ height }}
      >
        <style>{`
          .dark-nautical-tiles { filter: invert(0.9) hue-rotate(180deg) brightness(0.7) saturate(1.4); }
          .leaflet-container { background: #061527; font-family: monospace; }
          .leaflet-control-zoom a { background: #050D1A !important; color: #00f0ff !important; border-color: rgba(0,240,255,0.3) !important; }
          .leaflet-control-attribution { background: rgba(5,13,26,0.85) !important; color: #64748b !important; font-size: 9px !important; }
          .dark-nautical-popup .leaflet-popup-content-wrapper { background: #07192e; color: #ffffff; border: 1px solid rgba(0,240,255,0.4); border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.8), 0 0 16px rgba(0,240,255,0.2); }
          .dark-nautical-popup .leaflet-popup-tip { background: #07192e; border: 1px solid rgba(0,240,255,0.4); }
          @keyframes pulseRing { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(2.4);opacity:0} }
          .pulse-ping-marker { animation: pulseRing 2s linear infinite; }
        `}</style>

        {/* Loading Overlay */}
        {!mapReady && !mapLoadError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#061527] text-cyan-400">
            <Globe className="h-10 w-10 animate-spin mb-3 text-cyan-400" />
            <span className="text-xs font-bold tracking-wider uppercase">Loading Nautical Map Tiles...</span>
          </div>
        )}

        {/* Error Overlay */}
        {mapLoadError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#061527] p-6 text-center text-rose-400">
            <AlertTriangle className="h-10 w-10 mb-2" />
            <h4 className="text-sm font-bold uppercase tracking-wider">MAP TILE ENGINE FAILURE</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">{mapLoadError}</p>
          </div>
        )}

        {/* Geolocation Unavailable State */}
        {!partition.hasGeolocatedPoints && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#061527]/95 p-8 text-center backdrop-blur-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3">
              <Compass className="h-7 w-7" />
            </div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              GEOLOCATION UNAVAILABLE
            </h4>
            <p className="text-xs text-slate-400 mt-1.5 max-w-md">
              Geographic coordinates are not available for this sonar dataset. The AI detection and classification pipeline remains fully operational.
            </p>
            <div className="mt-4 rounded border border-amber-500/20 bg-amber-950/20 px-3 py-2 text-[11px] text-amber-300">
              Total Detections: {partition.totalCount} • Unlocated Contacts: {partition.unlocatedCount}
            </div>
          </div>
        )}

        {/* Leaflet Mount Element */}
        <div ref={mapRef} className="h-full w-full" />

        {/* Map Legend Overlay */}
        {partition.hasGeolocatedPoints && (
          <div className="absolute bottom-3 right-3 z-[1000] rounded-lg border border-cyan-500/30 bg-[#050D1A]/90 p-3 backdrop-blur-md text-[10px] text-slate-300">
            <div className="font-bold text-white uppercase tracking-wider mb-2 border-b border-cyan-500/20 pb-1">
              GEOSPATIAL LEGEND
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span>Critical Priority (Pulse)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                <span>High / Medium Priority</span>
              </div>
              {showTrack && (
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                  <span className="h-0.5 w-4 bg-cyan-400 border-dashed" />
                  <span>Survey Track Line</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Partition & Accessibility Summary List */}
      <div className="rounded-lg border border-cyan-500/15 bg-[#050D1A]/80 p-3 text-xs">
        <div className="flex items-center justify-between text-slate-300 mb-2">
          <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-cyan-400" />
            GEOLOCATED ANOMALY CONTACTS LIST ({partition.geolocatedCount})
          </span>
          {rawPartition.unlocatedCount > 0 && (
            <span className="text-[11px] text-amber-400">
              ({rawPartition.unlocatedCount} contacts location unavailable)
            </span>
          )}
        </div>

        {partition.hasGeolocatedPoints ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {partition.geolocated.map((anom) => {
              const isSelected = selectedAnomaly?.id === anom.id;
              const classMeta = getClassMetadata(anom.class_name);

              return (
                <div
                  key={anom.id}
                  onClick={() => onSelectAnomaly(anom)}
                  className={`cursor-pointer rounded p-2.5 border transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-cyan-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase text-[11px]">
                      {classMeta.label}
                    </span>
                    <span className="text-cyan-400 font-bold text-[11px]">
                      {formatConfidenceLabel(anom.confidence)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                    <span>ID: {anom.id}</span>
                    <span>{formatCoordinate(anom.latitude, anom.longitude, 3)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-2 text-center text-slate-500 text-[11px]">
            No geolocated contacts in current view selection.
          </div>
        )}
      </div>
    </div>
  );
}
