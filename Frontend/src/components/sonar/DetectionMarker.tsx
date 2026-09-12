import React from 'react';
import type { BoundingBox, Priority } from '@/types/api';

interface DetectionMarkerProps {
  id?: string;
  classNameLabel?: string;
  confidence?: number;
  priority?: Priority;
  bbox?: BoundingBox;
  hasAcousticShadow?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export const DetectionMarker: React.FC<DetectionMarkerProps> = React.memo(({
  id = 'ANM-001',
  classNameLabel = 'unidentified_object',
  confidence = 0.92,
  priority = 'critical',
  bbox = { x: 30, y: 35, w: 15, h: 12 },
  hasAcousticShadow = true,
  selected = false,
  onClick,
}) => {
  const priorityBorderMap: Record<Priority, string> = {
    critical: 'border-rose-500 shadow-[0_0_16px_rgba(255,59,48,0.4)]',
    high: 'border-cyan-400 shadow-[0_0_16px_rgba(0,240,255,0.4)]',
    medium: 'border-indigo-400 shadow-[0_0_12px_rgba(127,119,221,0.3)]',
    low: 'border-slate-400 shadow-none',
  };

  const priorityTextMap: Record<Priority, string> = {
    critical: 'text-rose-400 bg-rose-950/80 border-rose-500/50',
    high: 'text-cyan-400 bg-cyan-950/80 border-cyan-500/50',
    medium: 'text-indigo-300 bg-indigo-950/80 border-indigo-500/50',
    low: 'text-slate-300 bg-slate-900/80 border-slate-700',
  };

  return (
    <div
      onClick={onClick}
      className={`absolute cursor-pointer transition-all duration-200 ${selected ? 'scale-[1.03] z-30' : 'z-20 hover:scale-105'}`}
      style={{
        left: `${bbox.x}%`,
        top: `${bbox.y}%`,
        width: `${bbox.w}%`,
        height: `${bbox.h}%`,
      }}
    >
      {/* Bounding Box Frame */}
      <div
        className={`relative h-full w-full rounded border-2 bg-cyan-500/10 ${priorityBorderMap[priority]}`}
      >
        {/* Tactical Crosshair Center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F0FF]" />
        </div>

        {/* Top-Left ID & Class Label Badge */}
        <div className="absolute -top-7 left-0 flex items-center gap-1.5 whitespace-nowrap">
          <span
            className={`rounded border px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${priorityTextMap[priority]}`}
          >
            {id} | {classNameLabel.replace(/_/g, ' ')}
          </span>
          <span className="rounded bg-cyan-500/20 border border-cyan-400/40 px-1 py-0.5 text-[9px] font-mono text-cyan-300 font-semibold">
            {Math.round(confidence * 100)}%
          </span>
        </div>

        {/* Bottom Acoustic Shadow Badge */}
        {hasAcousticShadow && (
          <div className="absolute -bottom-5 left-0 whitespace-nowrap">
            <span className="rounded bg-black/80 border border-amber-500/50 px-1 py-0.5 text-[8px] font-mono text-amber-400 font-semibold">
              ● SHADOW DETECTED
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

export default DetectionMarker;
