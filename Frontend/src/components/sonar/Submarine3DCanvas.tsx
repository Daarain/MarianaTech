import React, { useRef, useEffect, useState } from 'react';
import { Radio, Gauge, Compass, Sparkles } from 'lucide-react';

interface Submarine3DCanvasProps {
  className?: string;
  depthMeters?: number;
  showHUD?: boolean;
}

export default function Submarine3DCanvas({
  className = '',
  depthMeters = 320,
  showHUD = true,
}: Submarine3DCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rotationAngle = 0;
    let sonarPulseRadius = 0;

    const resizeCanvas = () => {
      if (containerRef.current && canvas) {
        const rect = containerRef.current.getBoundingClientRect();
        canvas.width = rect.width * (window.devicePixelRatio || 1);
        canvas.height = rect.height * (window.devicePixelRatio || 1);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Marine snow particles
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * 0.8 + 0.2,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.5 + 0.2,
    }));

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) return;

      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.5;

      rotationAngle += 0.005;
      sonarPulseRadius = (sonarPulseRadius + 1.2) % (Math.min(w, h) * 0.5);

      // 1. Dynamic Sonar Acoustic Pulse Wave Rings
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx - 60, cy - 20, sonarPulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 242, 254, ${Math.max(0, 0.4 - sonarPulseRadius / (w * 0.5))})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.restore();

      // 2. Floating Subsea Marine Snow Particles
      particles.forEach((p) => {
        p.x -= (p.speed * 0.0008);
        if (p.x < 0) p.x = 1;
        const px = p.x * w;
        const py = (p.y * h + Math.sin(rotationAngle + p.z * 10) * 6) % h;

        ctx.beginPath();
        ctx.arc(px, py, p.size * p.z, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 242, 254, ${p.opacity * 0.6})`;
        ctx.fill();
      });

      // 3. Highlight Scanning Radar Line
      const sweepLineX = (rotationAngle * 200) % w;
      const grad = ctx.createLinearGradient(sweepLineX - 40, 0, sweepLineX, 0);
      grad.addColorStop(0, 'rgba(0, 242, 254, 0)');
      grad.addColorStop(1, 'rgba(0, 242, 254, 0.25)');
      ctx.fillStyle = grad;
      ctx.fillRect(sweepLineX - 40, 0, 40, h);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mousePos]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setMousePos({ x, y });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        setMousePos({ x: 0, y: 0 });
      }}
      className={`relative w-full h-full min-h-[320px] overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#040d1a]/90 backdrop-blur-xl shadow-[0_0_40px_rgba(0,240,255,0.2)] select-none ${className}`}
    >
      {/* Photorealistic ROV Image with Interactive 3D Parallax Tilt */}
      <div
        className="absolute inset-0 transition-transform duration-200 ease-out"
        style={{
          transform: `perspective(1000px) rotateX(${-mousePos.y * 8}deg) rotateY(${mousePos.x * 8}deg) scale(1.04)`,
        }}
      >
        <img
          src="/images/rov_pathfinder.png"
          alt="PATHFINDER 8K ROV Submersible"
          className="h-full w-full object-cover object-center filter brightness-105 contrast-110"
        />

        {/* Ambient Underwater Lighting Glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030a16] via-transparent to-cyan-500/10 pointer-events-none" />
      </div>

      {/* 2D Canvas Radar/Sonar Particle Overlay */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block pointer-events-none z-10" />

      {/* Futuristic Telemetry HUD Overlay */}
      {showHUD && (
        <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-20 select-none">
          {/* Top HUD Telemetry */}
          <div className="flex items-center justify-between font-mono text-[10px] text-cyan-300">
            <div className="flex items-center gap-2 bg-[#041022]/85 border border-cyan-500/40 px-3 py-1.5 rounded-lg backdrop-blur-md shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-white tracking-wider">ROV MODEL: PATHFINDER 8K</span>
            </div>
            <div className="flex items-center gap-2 bg-[#041022]/85 border border-cyan-500/40 px-3 py-1.5 rounded-lg backdrop-blur-md">
              <Gauge className="h-3.5 w-3.5 text-cyan-400" />
              <span className="font-bold">DEPTH: -{depthMeters}m</span>
            </div>
          </div>

          {/* Bottom HUD Corner Reticle */}
          <div className="flex items-end justify-between font-mono text-[10px] text-slate-300">
            <div className="bg-[#041022]/85 border border-cyan-500/40 p-2.5 rounded-xl backdrop-blur-md space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-300">
                <Radio className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
                <span className="font-bold">SONAR SCAN: 450kHz DUAL FREQ</span>
              </div>
              <div className="text-slate-400 text-[9px]">
                3D ORIENTATION: PITCH {mousePos.y > 0 ? `+${(mousePos.y * 8).toFixed(1)}°` : `${(mousePos.y * 8).toFixed(1)}°`} | YAW {mousePos.x > 0 ? `+${(mousePos.x * 8).toFixed(1)}°` : `${(mousePos.x * 8).toFixed(1)}°`}
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-[#041022]/85 border border-cyan-500/40 px-3 py-1.5 rounded-lg backdrop-blur-md text-cyan-300 font-bold">
              <Compass className="h-3.5 w-3.5 text-cyan-400" />
              <span>BEARING: 184° SSW</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
