import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import EmptyState from '@/components/ui/EmptyState';
import { COLOURS } from '@/constants/colours';
import { getAnomalies } from '@/api/anomalies';
import { useMissionContext } from '@/context/MissionContext';
import type { Anomaly } from '@/api/mockData';

const PRIORITY_BORDER: Record<string, string> = {
  critical: COLOURS.hazard.light,
  high: COLOURS.bio.light,
  medium: COLOURS.ocean.light,
  low: COLOURS.seafloor.light,
};

export default function SonarViewer() {
  const { id } = useParams();
  const { selectedAnomaly, setSelectedAnomaly } = useMissionContext();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // pan/zoom
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const dragging = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

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

  // Generate mock bounding boxes based on anomaly index (percentages)
  const boxes = useMemo(() => {
    return anomalies.map((a, i) => {
      const x = 6 + (i * 17) % 70;
      const y = 4 + (i * 23) % 70;
      const w = 8 + (i * 13) % 20;
      const h = 6 + (i * 11) % 24;
      return { id: a.id, x, y, w, h, priority: a.priority, confidence: a.confidence, class_name: a.class_name };
    });
  }, [anomalies]);

  // pan handlers
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    function onDown(e: PointerEvent) {
      dragging.current = true;
      vp.setPointerCapture(e.pointerId);
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
    function onMove(e: PointerEvent) {
      if (!dragging.current || !lastPos.current) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      setTx((t) => t + dx);
      setTy((t) => t + dy);
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
    function onUp(e: PointerEvent) {
      dragging.current = false;
      lastPos.current = null;
    }

    vp.addEventListener('pointerdown', onDown as any);
    window.addEventListener('pointermove', onMove as any);
    window.addEventListener('pointerup', onUp as any);
    return () => {
      vp.removeEventListener('pointerdown', onDown as any);
      window.removeEventListener('pointermove', onMove as any);
      window.removeEventListener('pointerup', onUp as any);
    };
  }, []);

  // zoom handler
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const delta = -e.deltaY;
      const zoomFactor = delta > 0 ? 1.08 : 0.92;
      setScale((s) => {
        const next = Math.min(4, Math.max(0.5, +(s * zoomFactor).toFixed(3)));
        return next;
      });
    }
    vp.addEventListener('wheel', onWheel as any, { passive: false });
    return () => vp.removeEventListener('wheel', onWheel as any);
  }, []);

  function focusBox(boxId: string) {
    const box = boxes.find((b) => b.id === boxId);
    const vp = viewportRef.current;
    const content = contentRef.current;
    if (!box || !vp || !content) return;
    const vpRect = vp.getBoundingClientRect();
    const contentW = content.clientWidth;
    const contentH = content.clientHeight;
    // compute center of box in content coordinates (percent -> px)
    const cx = (box.x + box.w / 2) / 100 * contentW;
    const cy = (box.y + box.h / 2) / 100 * contentH;
    // target translate so that (cx,cy) lands at center of viewport
    const targetTx = vpRect.width / 2 - cx * scale;
    const targetTy = vpRect.height / 2 - cy * scale;
    setTx(targetTx);
    setTy(targetTy);
    // set selected anomaly in context
    const anomaly = anomalies.find((a) => a.id === boxId);
    if (anomaly) setSelectedAnomaly(anomaly);
  }

  const qualityScore = useMemo(() => {
    if (anomalies.length === 0) return 100;
    return Math.round(anomalies.reduce((s, a) => s + a.confidence * 100, 0) / anomalies.length);
  }, [anomalies]);

  if (!loading && anomalies.length === 0) {
    return (
      <PageLayout title="Sonar Viewer">
        <div style={{ backgroundColor: COLOURS.background }} className="rounded-2xl border p-6">
          <EmptyState variant="no_data" title="No anomalies" message="No sonar detections for this mission." />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Sonar Viewer">
      <div style={{ backgroundColor: COLOURS.background }} className="rounded-2xl border p-4">
        <style>{`
          @keyframes sonarSweep { 0% { transform: translateY(-100%);} 100% { transform: translateY(100%);} }
          @keyframes glowPulse { 0% { box-shadow: 0 0 6px rgba(55,138,221,0.8);} 50% { box-shadow: 0 0 16px rgba(55,138,221,0.95);} 100% { box-shadow: 0 0 6px rgba(55,138,221,0.8);} }
        `}</style>

        <div className="flex gap-4">
          {/* Left panel: canvas + thumbnails */}
          <div style={{ flex: '0 0 70%' }}>
            <div className="relative overflow-hidden rounded" style={{ height: 560, background: '#0d1f3c' }}>
              {qualityScore < 60 && (
                <div className="absolute top-3 left-3 right-3 z-20 rounded px-3 py-2 text-sm" style={{ background: 'linear-gradient(90deg,#FFC10722,#7F77DD22)', color: '#E07B00' }}>
                  Low sonar quality detected — detections may be unreliable
                </div>
              )}

              <div ref={viewportRef} className="absolute inset-0" style={{ touchAction: 'none', cursor: 'grab' }}>
                <div ref={contentRef} style={{ transform: `translate(${tx}px, ${ty}px) scale(${scale})`, transformOrigin: '0 0', width: '1200px', height: '800px', position: 'absolute', left: '50%', top: '50%', translate: '-50% -50%' }}>
                  {/* sonar image placeholder */}
                  <div style={{ width: '100%', height: '100%', background: '#0d1f3c', position: 'relative' }}>
                    {/* scan line */}
                    <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: COLOURS.ocean.light, opacity: 0.4, animation: 'sonarSweep 8s linear infinite' }} />

                    {/* bounding boxes */}
                    {boxes.map((b) => {
                      const left = `${b.x}%`;
                      const top = `${b.y}%`;
                      const width = `${b.w}%`;
                      const height = `${b.h}%`;
                      const color = PRIORITY_BORDER[b.priority] ?? COLOURS.seafloor.light;
                      const isSelected = selectedAnomaly?.id === b.id;
                      return (
                        <div key={b.id} style={{ position: 'absolute', left, top, width, height, border: `2px solid ${color}`, boxSizing: 'border-box', pointerEvents: 'auto', transition: 'box-shadow 200ms' }}>
                          <div style={{ position: 'absolute', top: -22, left: 0 }}>
                            <div style={{ padding: '2px 6px', borderRadius: 999, background: 'transparent', color, fontSize: 12, fontWeight: 700, border: `1px solid ${color}` }}>{`${b.class_name.replace(/_/g, ' ')} ${Math.round(b.confidence * 100)}%`}</div>
                          </div>
                          {isSelected && <div style={{ position: 'absolute', inset: -4, border: `3px solid ${COLOURS.ocean.light}`, boxShadow: `0 0 12px ${COLOURS.ocean.light}`, animation: 'glowPulse 1.6s ease-in-out infinite' }} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* thumbnail strip */}
              <div className="absolute left-0 right-0 bottom-0 px-3 py-2 flex gap-2 overflow-x-auto" style={{ background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.2))' }}>
                {boxes.map((b, i) => (
                  <div key={b.id} onClick={() => focusBox(b.id)} style={{ width: 80, height: 40, background: '#0b253f', border: `1px solid ${PRIORITY_BORDER[b.priority]}`, borderRadius: 6, flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
                    <div style={{ fontSize: 12 }}>{Math.round(b.confidence * 100)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel: list */}
          <div style={{ flex: '0 0 30%' }}>
            <div className="p-3 rounded border" style={{ height: 560, overflowY: 'auto', borderColor: 'rgba(255,255,255,0.04)' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: COLOURS.textPrimary }}>Anomalies</h3>
              <div className="space-y-2">
                {boxes.map((b) => {
                  const color = PRIORITY_BORDER[b.priority];
                  const isSelected = selectedAnomaly?.id === b.id;
                  return (
                    <div key={b.id} onClick={() => focusBox(b.id)} className="flex items-center justify-between p-2 rounded" style={{ background: isSelected ? 'rgba(55,138,221,0.06)' : 'transparent', borderLeft: isSelected ? `3px solid ${COLOURS.ocean.light}` : '3px solid transparent', cursor: 'pointer' }}>
                      <div>
                        <div style={{ color: COLOURS.textPrimary, fontWeight: 700, fontSize: 13 }}>{b.class_name.replace(/_/g, ' ')}</div>
                        <div style={{ color: COLOURS.seafloor.light, fontSize: 12 }}>{Math.round(b.confidence * 100)}% • {b.priority}</div>
                      </div>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
