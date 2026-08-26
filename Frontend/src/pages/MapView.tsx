import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// ── Colour constants ─────────────────────────────────────────────
const C = {
  pageBg: '#0A1628',
  oceanBlue: '#0C447C',
  oceanBlueLight: '#378ADD',
  oceanBlueTint: '#E6F1FB',
  reefTeal: '#0F6E56',
  reefTealLight: '#1D9E75',
  reefTealTint: '#E1F5EE',
  bioPurple: '#534AB7',
  bioPurpleLight: '#7F77DD',
  bioPurpleTint: '#EEEDFE',
  hazardRed: '#A32D2D',
  hazardRedLight: '#E24B4A',
  hazardRedTint: '#FCEBEB',
  seafloorGray: '#444441',
  seafloorGrayLight: '#888780',
  seafloorGrayTint: '#F1EFE8',
};

// ── Mock anomaly data ────────────────────────────────────────────
const MOCK_ANOMALIES = [
  { id: 'A001', className: 'Ghost Net',   confidence: 93, lat: 10.45, lng: 72.82, priority: 'Critical', status: 'Unreviewed' },
  { id: 'A002', className: 'Shipwreck',   confidence: 87, lat: 9.80,  lng: 73.10, priority: 'High',     status: 'Confirmed'  },
  { id: 'A003', className: 'Container',   confidence: 74, lat: 11.20, lng: 71.95, priority: 'Medium',   status: 'Unreviewed' },
  { id: 'A004', className: 'Pipe',        confidence: 61, lat: 10.05, lng: 72.40, priority: 'Low',      status: 'Rejected'   },
  { id: 'A005', className: 'Metal Debris',confidence: 82, lat: 10.90, lng: 73.55, priority: 'High',     status: 'Confirmed'  },
  { id: 'A006', className: 'Ghost Net',   confidence: 95, lat: 9.55,  lng: 71.70, priority: 'Critical', status: 'Unreviewed' },
  { id: 'A007', className: 'Container',   confidence: 68, lat: 11.60, lng: 72.20, priority: 'Medium',   status: 'Unreviewed' },
  { id: 'A008', className: 'Debris',      confidence: 55, lat: 10.30, lng: 74.00, priority: 'Low',      status: 'Unreviewed' },
];

const PRIORITY_COLOUR: Record<string, string> = {
  Critical: C.hazardRedLight,
  High:     C.bioPurpleLight,
  Medium:   C.oceanBlueLight,
  Low:      C.seafloorGrayLight,
};

const CLASS_EMOJI: Record<string, string> = {
  'Ghost Net': '🕸️', Shipwreck: '🚢', Container: '📦',
  Pipe: '🔧', 'Metal Debris': '⚠️', Debris: '⚠️',
};

type Anomaly = typeof MOCK_ANOMALIES[0];

// ── Popup card component ─────────────────────────────────────────
function AnomalyPopup({ anomaly, onClose, screenX, screenY }: {
  anomaly: Anomaly; onClose: () => void; screenX: number; screenY: number;
}) {
  return (
    <div style={{
      position: 'absolute',
      left: screenX + 16,
      top: screenY - 60,
      zIndex: 1000,
      background: '#0d1f3c',
      border: `1px solid ${PRIORITY_COLOUR[anomaly.priority]}`,
      borderRadius: 12,
      padding: '14px 16px',
      minWidth: 220,
      boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 16px ${PRIORITY_COLOUR[anomaly.priority]}44`,
      animation: 'popupFadeIn 0.2s ease-out',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{CLASS_EMOJI[anomaly.className] || '🔍'}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{anomaly.className}</div>
            <div style={{ fontSize: 10, color: C.seafloorGrayLight, marginTop: 1 }}>{anomaly.id}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.seafloorGrayLight, cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }}>✕</button>
      </div>
      {/* Priority badge */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 100, background: `${PRIORITY_COLOUR[anomaly.priority]}22`, color: PRIORITY_COLOUR[anomaly.priority] }}>
          ● {anomaly.priority}
        </span>
        <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 100, background: '#1a3050', color: C.seafloorGrayLight }}>
          {anomaly.status}
        </span>
      </div>
      {/* Confidence bar */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: C.seafloorGrayLight }}>Confidence</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.oceanBlueLight }}>{anomaly.confidence}%</span>
        </div>
        <div style={{ height: 4, background: '#1a3050', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${anomaly.confidence}%`, background: anomaly.confidence > 80 ? C.reefTeal : C.oceanBlueLight, borderRadius: 2, transition: 'width 0.6s ease' }} />
        </div>
      </div>
      {/* Coordinates */}
      <div style={{ fontSize: 10, color: C.seafloorGrayLight, fontFamily: 'monospace', marginBottom: 10 }}>
        {anomaly.lat.toFixed(4)}° N, {anomaly.lng.toFixed(4)}° E
      </div>
      <a
        href={`#/anomalies`}
        onClick={onClose}
        style={{ fontSize: 11, color: C.oceanBlueLight, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
      >
        View in Anomaly Panel →
      </a>
    </div>
  );
}

// ── Main MapView component ───────────────────────────────────────
export default function MapView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [filters, setFilters] = useState({
    Critical: true, High: true, Medium: true, Low: true,
    'Ghost Net': true, Shipwreck: true, Container: true, Pipe: true, 'Metal Debris': true, Debris: true,
    Confirmed: true, Unreviewed: true, Rejected: true,
  });
  const [mapReady, setMapReady] = useState(false);

  const filteredAnomalies = MOCK_ANOMALIES.filter(a =>
    filters[a.priority as keyof typeof filters] &&
    filters[a.className as keyof typeof filters] &&
    filters[a.status as keyof typeof filters]
  );

  // ── Load Leaflet dynamically to avoid SSR/context issues ──────
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet script dynamically
    const existingScript = document.getElementById('leaflet-js');
    const initMap = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current || leafletMapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [10.5, 72.8],
        zoom: 7,
        zoomControl: true,
      });

      // Dark nautical tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        className: 'dark-tiles',
      }).addTo(map);

      leafletMapRef.current = map;
      setMapReady(true);
    };

    if (existingScript) {
      if ((window as any).L) initMap();
      else existingScript.addEventListener('load', initMap);
    } else {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // ── Add/update markers when filters or map readiness changes ──
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !leafletMapRef.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    filteredAnomalies.forEach((anomaly) => {
      const colour = PRIORITY_COLOUR[anomaly.priority];
      const radius = anomaly.priority === 'Critical' ? 14 : anomaly.priority === 'High' ? 11 : anomaly.priority === 'Medium' ? 9 : 7;

      const marker = L.circleMarker([anomaly.lat, anomaly.lng], {
        radius,
        fillColor: colour,
        color: '#fff',
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.85,
      }).addTo(leafletMapRef.current);

      marker.on('click', (e: any) => {
        const containerPoint = leafletMapRef.current.latLngToContainerPoint([anomaly.lat, anomaly.lng]);
        setPopupPos({ x: containerPoint.x, y: containerPoint.y });
        setSelectedAnomaly(anomaly);
      });

      // Pulse animation for critical
      if (anomaly.priority === 'Critical') {
        const pulseMarker = L.circleMarker([anomaly.lat, anomaly.lng], {
          radius: radius + 6,
          fillColor: 'transparent',
          color: colour,
          weight: 1.5,
          opacity: 0.5,
          fillOpacity: 0,
          className: 'pulse-marker',
        }).addTo(leafletMapRef.current);
        markersRef.current.push(pulseMarker);
      }

      markersRef.current.push(marker);
    });
  }, [mapReady, filters]);

  const toggleFilter = (key: string) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const resetFilters = () => {
    setFilters({
      Critical: true, High: true, Medium: true, Low: true,
      'Ghost Net': true, Shipwreck: true, Container: true, Pipe: true, 'Metal Debris': true, Debris: true,
      Confirmed: true, Unreviewed: true, Rejected: true,
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: C.pageBg, color: '#fff', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .dark-tiles { filter: invert(0.85) hue-rotate(180deg) brightness(0.75) saturate(1.2); }
        .leaflet-container { background: ${C.pageBg}; }
        .leaflet-control-zoom a { background: #0d1f3c !important; color: ${C.oceanBlueLight} !important; border-color: ${C.oceanBlue}88 !important; }
        .leaflet-control-attribution { background: rgba(10,22,40,0.8) !important; color: ${C.seafloorGrayLight} !important; font-size: 9px !important; }
        @keyframes popupFadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rippleOut { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.5);opacity:0} }
        .pulse-marker { animation: rippleOut 2s ease-out infinite; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Page header */}
      <div style={{ padding: '24px 24px 0' }}>
        <div style={{ fontSize: 22, fontWeight: 500 }}>Map View</div>
        <div style={{ fontSize: 12, color: C.seafloorGrayLight, marginTop: 3 }}>
          Mission {id} · {filteredAnomalies.length} anomalies visible
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: 0, margin: '16px 0 0', height: 'calc(100vh - 120px)' }}>

        {/* ── Filter Sidebar ───────────────────────────── */}
        <div style={{
          width: 260,
          background: '#0d1f3c',
          borderRight: `0.5px solid ${C.oceanBlue}55`,
          padding: '16px 14px',
          overflowY: 'auto',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}>

          {/* Visible count */}
          <div style={{ background: `${C.oceanBlue}22`, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 500, color: C.oceanBlueLight }}>{filteredAnomalies.length}</div>
            <div style={{ fontSize: 11, color: C.seafloorGrayLight }}>anomalies visible</div>
          </div>

          {/* Priority filter */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: C.seafloorGrayLight, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Priority</div>
            {(['Critical', 'High', 'Medium', 'Low'] as const).map(p => (
              <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', cursor: 'pointer' }}>
                <input type="checkbox" checked={filters[p]} onChange={() => toggleFilter(p)}
                  style={{ accentColor: PRIORITY_COLOUR[p], width: 14, height: 14, cursor: 'pointer' }} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLOUR[p], display: 'inline-block' }} />
                <span style={{ fontSize: 12, color: '#fff' }}>{p}</span>
                <span style={{ fontSize: 11, color: C.seafloorGrayLight, marginLeft: 'auto' }}>
                  {MOCK_ANOMALIES.filter(a => a.priority === p).length}
                </span>
              </label>
            ))}
          </div>

          {/* Class filter */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: C.seafloorGrayLight, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Class</div>
            {(['Ghost Net', 'Shipwreck', 'Container', 'Pipe', 'Metal Debris', 'Debris'] as const).map(cls => (
              <label key={cls} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!filters[cls as keyof typeof filters]} onChange={() => toggleFilter(cls)}
                  style={{ accentColor: C.oceanBlueLight, width: 14, height: 14, cursor: 'pointer' }} />
                <span style={{ fontSize: 12 }}>{CLASS_EMOJI[cls]}</span>
                <span style={{ fontSize: 12, color: '#fff' }}>{cls}</span>
              </label>
            ))}
          </div>

          {/* Status filter */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: C.seafloorGrayLight, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Status</div>
            {(['Confirmed', 'Unreviewed', 'Rejected'] as const).map(s => {
              const col = s === 'Confirmed' ? C.reefTeal : s === 'Rejected' ? C.hazardRed : C.seafloorGrayLight;
              return (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={filters[s]} onChange={() => toggleFilter(s)}
                    style={{ accentColor: col, width: 14, height: 14, cursor: 'pointer' }} />
                  <span style={{ fontSize: 12, color: '#fff' }}>{s}</span>
                </label>
              );
            })}
          </div>

          {/* Reset */}
          <button onClick={resetFilters} style={{
            padding: '9px 0', borderRadius: 8,
            border: `0.5px solid ${C.oceanBlue}88`,
            background: 'transparent', color: C.oceanBlueLight,
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            Reset Filters
          </button>
        </div>

        {/* ── Map Container ─────────────────────────────── */}
        <div style={{ flex: 1, position: 'relative' }}>

          {/* Loading state */}
          {!mapReady && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', background: C.pageBg, zIndex: 10,
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🌊</div>
              <div style={{ fontSize: 14, color: C.oceanBlueLight }}>Loading nautical chart...</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%', background: C.bioPurpleLight,
                    animation: `popupFadeIn 1s ease-in-out ${i * 0.2}s infinite alternate`,
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* Leaflet map div */}
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

          {/* Popup */}
          {selectedAnomaly && (
            <AnomalyPopup
              anomaly={selectedAnomaly}
              onClose={() => setSelectedAnomaly(null)}
              screenX={popupPos.x}
              screenY={popupPos.y}
            />
          )}

          {/* Legend */}
          <div style={{
            position: 'absolute', bottom: 20, right: 16, zIndex: 999,
            background: 'rgba(13,31,60,0.92)',
            border: `0.5px solid ${C.oceanBlue}66`,
            borderRadius: 10, padding: '10px 14px',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: C.seafloorGrayLight, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Priority Legend</div>
            {[['Critical', C.hazardRedLight, 14], ['High', C.bioPurpleLight, 11], ['Medium', C.oceanBlueLight, 9], ['Low', C.seafloorGrayLight, 7]].map(([label, col, size]) => (
              <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <div style={{ width: size as number, height: size as number, borderRadius: '50%', background: col as string, border: '1.5px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#fff' }}>{label as string}</span>
              </div>
            ))}
          </div>

          {/* Mission nav bar at top of map */}
          <div style={{
            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
            zIndex: 999, display: 'flex', gap: 8,
          }}>
            {[
              { label: 'Anomalies', path: `/missions/${id}/anomalies` },
              { label: 'Sonar Viewer', path: `/missions/${id}/viewer` },
              { label: 'Reports', path: `/missions/${id}/reports` },
            ].map(btn => (
              <button key={btn.label} onClick={() => navigate(btn.path)} style={{
                padding: '6px 14px', borderRadius: 20,
                background: 'rgba(13,31,60,0.9)',
                border: `0.5px solid ${C.oceanBlue}88`,
                color: C.oceanBlueLight, fontSize: 12, fontWeight: 500,
                cursor: 'pointer', backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
              }}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
