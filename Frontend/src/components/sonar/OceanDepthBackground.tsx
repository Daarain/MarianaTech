import React, { useEffect, useState } from 'react';

export type EnvironmentIntensity = 'high' | 'medium' | 'low' | 'minimal';

interface OceanDepthBackgroundProps {
  children?: React.ReactNode;
  showGrid?: boolean;
  enableParallax?: boolean;
  intensity?: EnvironmentIntensity;
}

export const OceanDepthBackground: React.FC<OceanDepthBackgroundProps> = ({
  children,
  showGrid = true,
  enableParallax = true,
  intensity = 'medium',
}) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  const rafRef = React.useRef<number | null>(null);
  const mousePosRef = React.useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = () => setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableParallax || reducedMotion || intensity === 'minimal') return;
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    
    // Scale parallax factor based on intensity
    const maxOffset = intensity === 'high' ? 25 : intensity === 'medium' ? 12 : 4;
    mousePosRef.current = {
      x: (clientX / innerWidth - 0.5) * maxOffset,
      y: (clientY / innerHeight - 0.5) * maxOffset,
    };

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        setOffset(mousePosRef.current);
        rafRef.current = null;
      });
    }
  };

  // Determine particle count based on intensity
  const particleCount = intensity === 'high' ? 14 : intensity === 'medium' ? 8 : intensity === 'low' ? 4 : 0;
  const showCaustics = (intensity === 'high' || intensity === 'medium') && !reducedMotion;

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full overflow-hidden bg-[#030712] text-slate-100 selection:bg-cyan-500 selection:text-black page-fade-in"
    >
      {/* Layer 0: Deep Ocean Gradient Backdrop */}
      <div
        className="pointer-events-none absolute inset-0 transition-transform duration-700 ease-out z-0"
        style={{
          transform: reducedMotion || intensity === 'minimal'
            ? 'none'
            : `translate3d(${offset.x * -0.4}px, ${offset.y * -0.4}px, 0)`,
          background:
            intensity === 'high'
              ? 'radial-gradient(circle at 50% 25%, rgba(15, 45, 80, 0.55) 0%, rgba(5, 15, 30, 0.92) 65%, rgba(3, 7, 18, 1) 100%)'
              : intensity === 'medium'
              ? 'radial-gradient(circle at 50% 30%, rgba(10, 32, 60, 0.45) 0%, rgba(5, 13, 26, 0.9) 65%, rgba(3, 7, 18, 1) 100%)'
              : 'radial-gradient(circle at 50% 40%, rgba(6, 20, 38, 0.35) 0%, rgba(4, 10, 20, 0.95) 70%, rgba(3, 7, 18, 1) 100%)',
        }}
      />

      {/* Layer 1: Subsea Light Caustics / Ray Projection */}
      {showCaustics && (
        <div
          className="pointer-events-none absolute top-[-20%] left-[10%] right-[10%] h-[70vh] bg-gradient-to-b from-cyan-400/10 via-cyan-500/5 to-transparent blur-3xl opacity-30 animate-caustics z-0"
          style={{
            transform: reducedMotion
              ? 'none'
              : `translate3d(${offset.x * 0.2}px, ${offset.y * 0.2}px, 0)`,
          }}
        />
      )}

      {/* Layer 2: Subtle Tactical Sonar Radial Grid */}
      {showGrid && intensity !== 'minimal' && (
        <div
          className={`pointer-events-none absolute inset-0 transition-transform duration-500 ease-out z-0 ${
            intensity === 'high' ? 'opacity-25' : intensity === 'medium' ? 'opacity-15' : 'opacity-10'
          }`}
          style={{
            transform: reducedMotion
              ? 'none'
              : `translate3d(${offset.x * 0.3}px, ${offset.y * 0.3}px, 0)`,
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.15) 1px, transparent 1px),
              linear-gradient(to right, rgba(0, 240, 255, 0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 240, 255, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: '120px 120px, 40px 40px, 40px 40px',
          }}
        />
      )}

      {/* Layer 3: Floating Micro Particulate Snow */}
      {!reducedMotion && particleCount > 0 && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          {[...Array(particleCount)].map((_, i) => (
            <div
              key={i}
              className="animate-particle absolute rounded-full bg-cyan-300/25 blur-[0.8px]"
              style={{
                width: `${(i % 3) + 2}px`,
                height: `${(i % 3) + 2}px`,
                left: `${(i * 11) % 100}%`,
                bottom: `${(i * 14) % 85}%`,
                '--duration': `${8 + (i % 5)}s`,
                '--delay': `${i * 0.7}s`,
                '--drift': `${(i % 2 === 0 ? 1 : -1) * (12 + (i * 4))}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Content Layer */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default OceanDepthBackground;
