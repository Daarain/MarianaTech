import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Colour constants ─────────────────────────────────────────────
const C = {
  pageBg: '#0A1628',
  oceanBlue: '#0C447C',
  oceanBlueLight: '#378ADD',
  oceanBlueTint: '#E6F1FB',
  reefTeal: '#0F6E56',
  reefTealLight: '#1D9E75',
  bioPurple: '#534AB7',
  bioPurpleLight: '#7F77DD',
  bioPurpleTint: '#EEEDFE',
  hazardRed: '#A32D2D',
  seafloorGray: '#444441',
  seafloorGrayLight: '#888780',
};

// ── SVG Fish components ──────────────────────────────────────────
function SvgFish({ x, y, scale = 1, colour = '#FF8C42', speed = 1, direction = 1, depth = 0 }: {
  x: number; y: number; scale?: number; colour?: string; speed?: number; direction?: number; depth?: number;
}) {
  const [pos, setPos] = useState({ x, y });
  const [flip, setFlip] = useState(direction === -1);
  const animRef = useRef<number>();
  const posRef = useRef({ x, y, vx: speed * direction * 0.4, vy: 0, time: Math.random() * 100 });

  useEffect(() => {
    const animate = () => {
      const p = posRef.current;
      p.time += 0.02;
      p.x += p.vx;
      p.y += Math.sin(p.time * 1.5) * 0.3;

      if (p.x > 110) { p.x = -10; p.vx = Math.abs(p.vx); setFlip(false); }
      if (p.x < -10) { p.x = 110; p.vx = -Math.abs(p.vx); setFlip(true); }

      setPos({ x: p.x, y: p.y });
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  return (
    <div style={{
      position: 'absolute',
      left: `${pos.x}%`,
      top: `${pos.y}%`,
      transform: `scaleX(${flip ? -1 : 1}) scale(${scale})`,
      transformOrigin: 'center',
      pointerEvents: 'none',
      zIndex: 3 + depth,
      filter: `drop-shadow(0 0 ${4 * scale}px ${colour}88)`,
      transition: 'filter 0.3s',
    }}>
      <svg width={48 * scale} height={28 * scale} viewBox="0 0 48 28">
        {/* Tail */}
        <path d="M38,14 L48,6 L46,14 L48,22 Z" fill={colour} opacity="0.9" />
        {/* Body */}
        <ellipse cx="22" cy="14" rx="18" ry="9" fill={colour} />
        {/* Belly */}
        <ellipse cx="20" cy="16" rx="14" ry="6" fill={`${colour}bb`} />
        {/* Stripe */}
        <line x1="16" y1="6" x2="16" y2="22" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
        {/* Dorsal fin */}
        <path d="M10,6 Q18,0 26,5" stroke={colour} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8" />
        {/* Eye */}
        <circle cx="8" cy="12" r="3" fill="rgba(0,0,0,0.7)" />
        <circle cx="7" cy="11" r="1" fill="rgba(255,255,255,0.9)" />
        {/* Pectoral fin */}
        <path d="M18,14 Q22,18 20,22" stroke={colour} strokeWidth="2" fill="none" opacity="0.7" />
      </svg>
    </div>
  );
}

function SvgJellyfish({ x, y }: { x: number; y: number }) {
  const [pos, setPos] = useState({ x, y });
  const animRef = useRef<number>();
  const stateRef = useRef({ x, y, time: Math.random() * 100 });

  useEffect(() => {
    const animate = () => {
      const s = stateRef.current;
      s.time += 0.008;
      s.y -= 0.04;
      s.x += Math.sin(s.time) * 0.05;
      if (s.y < -15) { s.y = 105; s.x = 10 + Math.random() * 80; }
      setPos({ x: s.x, y: s.y });
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  return (
    <div style={{
      position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`,
      pointerEvents: 'none', zIndex: 4,
      filter: 'drop-shadow(0 0 8px rgba(127,119,221,0.7))',
    }}>
      <svg width="44" height="60" viewBox="0 0 44 60">
        <defs>
          <radialGradient id="jbg" cx="50%" cy="40%">
            <stop offset="0%" stopColor="rgba(163,74,183,0.7)" />
            <stop offset="100%" stopColor="rgba(83,74,183,0.2)" />
          </radialGradient>
        </defs>
        <ellipse cx="22" cy="18" rx="18" ry="14" fill="url(#jbg)" stroke="rgba(163,74,183,0.6)" strokeWidth="1" />
        <ellipse cx="22" cy="22" rx="12" ry="8" fill="rgba(200,180,255,0.15)" />
        {[8,14,20,26,32,36].map((tx, i) => (
          <path key={i} d={`M${tx},30 Q${tx + (i%2===0?-4:4)},${42+i*2} ${tx},${50+i*2}`}
            stroke="rgba(163,74,183,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        ))}
      </svg>
    </div>
  );
}

// ── Bubble component ─────────────────────────────────────────────
function Bubbles() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${5 + Math.random() * 90}%`,
          bottom: `${Math.random() * 30}%`,
          width: `${3 + Math.random() * 8}px`,
          height: `${3 + Math.random() * 8}px`,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, rgba(200,240,255,0.6), rgba(100,200,255,0.15))',
          border: '0.5px solid rgba(150,220,255,0.4)',
          animation: `bubbleRise ${5 + Math.random() * 8}s ease-in ${Math.random() * 8}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ── Treasure Chest ───────────────────────────────────────────────
function TreasureChest({ onOpen }: { onOpen: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [coins, setCoins] = useState<Array<{ id: number; x: number; y: number; r: number }>>([]);
  const [glowing, setGlowing] = useState(false);

  const handleClick = () => {
    if (isOpen) { onOpen(); return; }
    setIsOpen(true);
    setGlowing(true);

    const newCoins = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 200,
      y: -(60 + Math.random() * 120),
      r: (Math.random() - 0.5) * 540,
    }));
    setCoins(newCoins);
    setTimeout(() => setCoins([]), 1400);
    setTimeout(() => onOpen(), 1600);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Coins */}
      {coins.map(coin => (
        <div key={coin.id} style={{
          position: 'absolute', top: '30%', left: '50%',
          width: 20, height: 20, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #FFE566, #CC8800)',
          border: '2px solid #FFD700',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, color: '#7a5200', fontWeight: 700,
          boxShadow: '0 0 10px #FFD70099',
          pointerEvents: 'none', zIndex: 20,
          animation: 'coinFly 1.2s cubic-bezier(.25,.46,.45,.94) forwards',
          '--cx': `${coin.x}px`, '--cy': `${coin.y}px`, '--cr': `${coin.r}deg`,
        } as React.CSSProperties}>$</div>
      ))}

      <button onClick={handleClick} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        filter: glowing
          ? 'drop-shadow(0 0 30px rgba(255,215,0,1)) drop-shadow(0 0 60px rgba(255,180,0,0.8))'
          : 'drop-shadow(0 0 18px rgba(255,180,0,0.7))',
        transition: 'filter 0.4s, transform 0.2s',
        transform: isOpen ? 'scale(1.1)' : 'scale(1)',
      }}>
        <svg width="110" height="90" viewBox="0 0 110 90">
          <defs>
            <linearGradient id="lidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A0522D" />
              <stop offset="100%" stopColor="#5C2D0A" />
            </linearGradient>
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6B3410" />
              <stop offset="100%" stopColor="#3D1A05" />
            </linearGradient>
            <linearGradient id="bandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#DAA520" />
              <stop offset="100%" stopColor="#B8860B" />
            </linearGradient>
          </defs>

          {/* Glow base */}
          {isOpen && <ellipse cx="55" cy="85" rx="40" ry="6" fill="rgba(255,215,0,0.25)" />}

          {/* Chest body */}
          <rect x="8" y="46" width="94" height="42" rx="6" fill="url(#bodyGrad)" />
          <rect x="8" y="46" width="94" height="8" rx="2" fill="url(#bandGrad)" />
          <rect x="8" y="78" width="94" height="10" rx="4" fill="url(#bandGrad)" />

          {/* Body rivets */}
          {[18, 35, 75, 92].map(rx => (
            <circle key={rx} cx={rx} cy="50" r="3" fill="#FFD700" opacity="0.9" />
          ))}
          {[18, 35, 75, 92].map(rx => (
            <circle key={rx} cx={rx} cy="82" r="3" fill="#FFD700" opacity="0.9" />
          ))}

          {/* Vertical bands */}
          <rect x="30" y="46" width="6" height="42" fill="url(#bandGrad)" opacity="0.7" />
          <rect x="74" y="46" width="6" height="42" fill="url(#bandGrad)" opacity="0.7" />

          {/* Lock */}
          <rect x="46" y="58" width="18" height="14" rx="3" fill="url(#bandGrad)" />
          <circle cx="55" cy="56" r="6" fill="none" stroke="#DAA520" strokeWidth="3" />
          <circle cx="55" cy="63" r="2.5" fill="#3D1A05" />

          {/* Glowing gems inside when open */}
          {isOpen && (
            <>
              <circle cx="30" cy="62" r="6" fill="#E24B4A" opacity="0.9" />
              <circle cx="55" cy="58" r="8" fill="#378ADD" opacity="0.9" />
              <circle cx="80" cy="62" r="6" fill="#1D9E75" opacity="0.9" />
              <polygon points="55,50 58,56 64,56 59,60 61,66 55,62 49,66 51,60 46,56 52,56"
                fill="#FFD700" opacity="0.95" />
            </>
          )}

          {/* Lid */}
          <g style={{
            transformOrigin: '55px 46px',
            transform: isOpen ? 'rotateX(-115deg)' : 'rotateX(0deg)',
            transition: 'transform 0.6s cubic-bezier(.34,1.2,.64,1)',
          }}>
            <rect x="8" y="16" width="94" height="32" rx="6" fill="url(#lidGrad)" />
            <rect x="8" y="16" width="94" height="8" rx="4" fill="url(#bandGrad)" />
            <rect x="8" y="38" width="94" height="8" rx="2" fill="url(#bandGrad)" />
            <rect x="30" y="16" width="6" height="32" fill="url(#bandGrad)" opacity="0.7" />
            <rect x="74" y="16" width="6" height="32" fill="url(#bandGrad)" opacity="0.7" />
            {/* Lid rivets */}
            {[18, 35, 75, 92].map(rx => (
              <circle key={rx} cx={rx} cy="20" r="3" fill="#FFD700" opacity="0.9" />
            ))}
            {/* Lid curved top */}
            <path d="M8,28 Q55,8 102,28" fill="url(#lidGrad)" stroke="url(#bandGrad)" strokeWidth="1" />
          </g>
        </svg>
      </button>

      <div style={{
        textAlign: 'center', marginTop: 6,
        fontSize: 12, fontWeight: 600,
        color: isOpen ? '#7F77DD' : '#FFD700',
        letterSpacing: '0.1em',
        textShadow: `0 0 12px ${isOpen ? '#7F77DD' : '#FFD700'}`,
        transition: 'all 0.4s',
        animation: isOpen ? 'none' : 'labelPulse 2s ease-in-out infinite',
      }}>
        {isOpen ? '✦ ENTERING PLATFORM ✦' : '✦ OPEN TO GET STARTED ✦'}
      </div>
    </div>
  );
}

// ── Feature cards ────────────────────────────────────────────────
const FEATURES = [
  { icon: '🎯', title: 'AI Anomaly Detection', desc: 'YOLO-powered detection across 24 underwater debris classes with 93% average confidence', colour: C.oceanBlueLight },
  { icon: '🗺️', title: 'Real-time Geotagging', desc: 'Every detection automatically geotagged and plotted on an interactive nautical chart', colour: C.reefTealLight },
  { icon: '👁️', title: 'Operator Verification', desc: 'Human-in-the-loop review with Confirm, Reject and Unsure workflow for every anomaly', colour: C.bioPurpleLight },
  { icon: '📊', title: 'Instant Reports', desc: 'One-click export of mission reports in CSV, JSON and PDF formats for stakeholders', colour: '#E24B4A' },
];

const HOW_IT_WORKS = [
  { step: '01', icon: '📡', title: 'Upload Sonar', desc: 'Drop your side-scan sonar files (.xtf, .jsf, .png, .tiff) and fill in mission metadata' },
  { step: '02', icon: '🤖', title: 'AI Analyzes', desc: 'Our YOLO model processes every sonar ping, detecting anomalies and scoring confidence' },
  { step: '03', icon: '✅', title: 'Review & Export', desc: 'Operators verify detections on the sonar viewer and map, then export the final report' },
];

const STATS = [
  { value: 24, suffix: '', label: 'Anomaly Classes' },
  { value: 93, suffix: '%', label: 'Avg Confidence' },
  { value: 500, suffix: 'MB', label: 'Max File Size' },
  { value: 247, suffix: '+', label: 'Pings Per Mission' },
];

// ── Counting number animation ────────────────────────────────────
function CountUp({ target, suffix }: { target: number; suffix: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = target / 60;
        const interval = setInterval(() => {
          start += step;
          if (start >= target) { setVal(target); clearInterval(interval); }
          else setVal(Math.floor(start));
        }, 16);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <div ref={ref} style={{ fontSize: 42, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{val}{suffix}</div>;
}

// ── Main LandingPage ─────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const fishData = [
    { x: 10, y: 30, scale: 0.9,  colour: '#FF8C42', speed: 0.25, direction: 1,  depth: 0 },
    { x: 60, y: 18, scale: 0.7,  colour: '#FFD700', speed: 0.18, direction: -1, depth: 1 },
    { x: 30, y: 55, scale: 1.1,  colour: '#FF6B6B', speed: 0.30, direction: 1,  depth: 0 },
    { x: 80, y: 42, scale: 0.6,  colour: '#4ECDC4', speed: 0.22, direction: -1, depth: 2 },
    { x: 5,  y: 68, scale: 0.8,  colour: '#A8E6CF', speed: 0.15, direction: 1,  depth: 1 },
    { x: 45, y: 72, scale: 0.65, colour: '#FFB347', speed: 0.28, direction: -1, depth: 0 },
    { x: 70, y: 25, scale: 0.75, colour: '#FF8C42', speed: 0.20, direction: 1,  depth: 2 },
  ];

  return (
    <div style={{ background: C.pageBg, fontFamily: 'Inter, sans-serif', color: '#fff', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        @keyframes bubbleRise {
          0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10%  { opacity: 0.8; }
          90%  { opacity: 0.5; }
          100% { transform: translateY(-100vh) translateX(30px) scale(0.5); opacity: 0; }
        }
        @keyframes coinFly {
          0%   { transform: translate(0,0) rotate(0deg) scale(1); opacity: 1; }
          60%  { opacity: 1; }
          100% { transform: translate(var(--cx), var(--cy)) rotate(var(--cr)) scale(0.3); opacity: 0; }
        }
        @keyframes labelPulse {
          0%,100% { opacity: 0.8; text-shadow: 0 0 8px #FFD700; }
          50%      { opacity: 1;   text-shadow: 0 0 20px #FFD700, 0 0 40px #FFD70088; }
        }
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lightRayAnim {
          0%,100% { opacity: 0.15; transform: rotate(-6deg) scaleX(1); }
          50%      { opacity: 0.35; transform: rotate(6deg) scaleX(1.4); }
        }
        @keyframes particleDrift {
          0%   { transform: translateY(0) translateX(0); opacity: 0.2; }
          50%  { opacity: 0.8; }
          100% { transform: translateY(-80px) translateX(20px); opacity: 0; }
        }
        @keyframes scanLine {
          0%   { top: 0%;   opacity: 0.6; }
          95%  { opacity: 0.4; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes sonarPing {
          0%   { transform: scale(0); opacity: 0.8; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes waveScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes featureFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glowPulse {
          0%,100% { box-shadow: 0 0 20px rgba(83,74,183,0.3); }
          50%      { box-shadow: 0 0 40px rgba(83,74,183,0.7), 0 0 80px rgba(83,74,183,0.3); }
        }
        @keyframes floatY {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-12px); }
        }
        .feature-card:hover {
          transform: translateY(-6px) scale(1.02) !important;
          border-color: rgba(55,138,221,0.5) !important;
        }
        .nav-link:hover { color: #fff !important; }
        .cta-btn:hover  { transform: scale(1.05) !important; box-shadow: 0 8px 32px rgba(12,68,124,0.6) !important; }
      `}</style>

      {/* ── HERO SECTION ─────────────────────────────────────────── */}
      <section style={{ position: 'relative', height: '100vh', overflow: 'hidden', minHeight: 600 }}>

        {/* Video background */}
        <video autoPlay muted loop playsInline style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', zIndex: 0,
        }}>
          <source src="/videos/underwater.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(180deg, rgba(2,14,30,0.72) 0%, rgba(2,20,45,0.55) 40%, rgba(5,25,55,0.65) 70%, rgba(2,14,30,0.88) 100%)',
        }} />

        {/* Light rays */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
          {[10, 22, 35, 50, 65, 78, 90].map((left, i) => (
            <div key={i} style={{
              position: 'absolute', top: 0, left: `${left}%`,
              width: `${30 + i * 8}px`, height: '70%',
              background: 'linear-gradient(180deg, rgba(100,200,255,0.10) 0%, transparent 100%)',
              borderRadius: '0 0 50% 50%',
              transformOrigin: 'top center',
              animation: `lightRayAnim ${4 + i * 0.6}s ease-in-out ${i * 0.5}s infinite`,
            }} />
          ))}
        </div>

        {/* Bioluminescent particles */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: `${20 + Math.random() * 70}%`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${i % 3 === 0 ? 'rgba(127,119,221,0.9)' : i % 3 === 1 ? 'rgba(55,138,221,0.8)' : 'rgba(29,158,117,0.8)'}, transparent)`,
              animation: `particleDrift ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 4}s infinite`,
            }} />
          ))}
        </div>

        {/* SVG Fish */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
          {fishData.map((f, i) => <SvgFish key={i} {...f} />)}
        </div>

        {/* Jellyfish */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>
          <SvgJellyfish x={15} y={60} />
          <SvgJellyfish x={82} y={45} />
          <SvgJellyfish x={50} y={70} />
        </div>

        {/* Bubbles */}
        <Bubbles />

        {/* Sonar scan line */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 2, zIndex: 4,
          background: 'linear-gradient(90deg, transparent, rgba(55,138,221,0.6), rgba(83,74,183,0.4), transparent)',
          animation: 'scanLine 8s linear infinite',
          pointerEvents: 'none',
        }} />

        {/* ── NAVBAR ── */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 28px',
          background: scrolled ? 'rgba(2,14,30,0.92)' : 'linear-gradient(180deg, rgba(2,14,30,0.7), transparent)',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '0.5px solid rgba(55,138,221,0.2)' : 'none',
          transition: 'all 0.4s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${C.oceanBlue}, ${C.bioPurple})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, boxShadow: '0 0 16px rgba(83,74,183,0.5)',
              animation: 'glowPulse 3s ease-in-out infinite',
            }}>🌊</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1 }}>Marine AI</div>
              <div style={{ fontSize: 10, color: C.oceanBlueLight, letterSpacing: '0.1em' }}>ANOMALY DETECTION</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {['Features', 'How It Works', 'Stats'].map(link => (
              <a key={link} className="nav-link" href={`#${link.toLowerCase().replace(/ /g, '-')}`}
                style={{ fontSize: 13, color: 'rgba(180,210,255,0.8)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}>
                {link}
              </a>
            ))}
            <button onClick={() => navigate('/dashboard')} style={{
              padding: '8px 20px', borderRadius: 20,
              border: '1px solid rgba(55,138,221,0.5)',
              background: 'rgba(12,68,124,0.4)',
              color: '#85B7EB', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', backdropFilter: 'blur(8px)',
              transition: 'all 0.2s',
            }}>
              Login →
            </button>
          </div>
        </nav>

        {/* ── HERO CONTENT ── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '0 24px',
          paddingTop: 80,
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 20,
            border: '1px solid rgba(83,74,183,0.5)',
            background: 'rgba(83,74,183,0.15)',
            backdropFilter: 'blur(8px)',
            fontSize: 11, color: C.bioPurpleLight,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: 20,
            animation: 'heroFadeUp 0.8s ease-out 0.1s both',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.bioPurpleLight, animation: 'sonarPing 2s ease-out infinite', display: 'inline-block' }} />
            AI-Powered Sonar Analysis Platform
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 6vw, 68px)', fontWeight: 800,
            lineHeight: 1.1, marginBottom: 20, maxWidth: 800,
            background: 'linear-gradient(135deg, #ffffff 0%, #85B7EB 40%, #7F77DD 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'heroFadeUp 0.8s ease-out 0.3s both',
          }}>
            Discover What Lies<br />Beneath the Surface
          </h1>

          <p style={{
            fontSize: 'clamp(14px, 2vw, 18px)', color: 'rgba(160,210,255,0.85)',
            maxWidth: 560, lineHeight: 1.7, marginBottom: 48,
            animation: 'heroFadeUp 0.8s ease-out 0.5s both',
          }}>
            AI-powered side-scan sonar analysis to detect ghost nets, shipwrecks,
            containers and marine debris — in real time, at depth.
          </p>

          <div style={{ animation: 'heroFadeUp 0.8s ease-out 0.7s both, floatY 4s ease-in-out 1.5s infinite' }}>
            <TreasureChest onOpen={() => navigate('/dashboard')} />
          </div>
        </div>

        {/* Wave transition at bottom */}
            <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            zIndex: 5, height: 160, pointerEvents: 'none',
            }}>
            {/* Gradient fade — removes the hard line */}
            <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(to bottom,
                transparent 0%,
                rgba(10,22,40,0.4) 40%,
                rgba(10,22,40,0.85) 70%,
                #0A1628 100%)`,
                zIndex: 1,
            }} />

            {/* Wave */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0, overflow: 'hidden', zIndex: 2 }}>
                <svg viewBox="0 0 1440 60" preserveAspectRatio="none"
                style={{ width: '200%', height: 60, animation: 'waveScroll 12s linear infinite', display: 'block' }}>
                <path d="M0,30 Q180,60 360,30 Q540,0 720,30 Q900,60 1080,30 Q1260,0 1440,30 L1440,60 L0,60 Z" fill="#0A1628" />
                <path d="M0,30 Q180,60 360,30 Q540,0 720,30 Q900,60 1080,30 Q1260,0 1440,30 L1440,60 L0,60 Z" fill="#0A1628" transform="translate(1440,0)" />
                </svg>
            </div>
            </div>
      </section>

      {/* ── FEATURES SECTION ─────────────────────────────────────── */}
      <section id="features" style={{ padding: '80px 24px', background: C.pageBg, position: 'relative' }}>
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 400, borderRadius: '50%',
          background: `radial-gradient(ellipse, ${C.oceanBlue}22, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 11, color: C.bioPurpleLight, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              ✦ Platform Capabilities
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700, color: '#fff', marginBottom: 14 }}>
              Everything you need to detect<br />underwater threats
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(160,200,255,0.7)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
              From raw sonar upload to verified report — Marine AI handles the full detection pipeline
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card" style={{
                background: 'linear-gradient(135deg, rgba(13,31,60,0.9), rgba(8,20,40,0.95))',
                border: '0.5px solid rgba(55,138,221,0.2)',
                borderRadius: 16, padding: '28px 24px',
                transition: 'all 0.35s ease',
                animation: `featureFadeUp 0.6s ease-out ${0.1 + i * 0.12}s both`,
                cursor: 'default',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: -30, right: -30,
                  width: 100, height: 100, borderRadius: '50%',
                  background: `radial-gradient(circle, ${f.colour}18, transparent)`,
                  pointerEvents: 'none',
                }} />
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: `linear-gradient(135deg, ${f.colour}22, ${f.colour}11)`,
                  border: `1px solid ${f.colour}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, marginBottom: 18,
                  boxShadow: `0 0 16px ${f.colour}33`,
                }}>
                  {f.icon}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 10 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(160,200,255,0.7)', lineHeight: 1.7 }}>{f.desc}</div>
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, transparent, ${f.colour}66, transparent)`,
                }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section id="how-it-works" style={{
        padding: '80px 24px',
        background: 'linear-gradient(180deg, #0A1628 0%, #0d1f3c 50%, #0A1628 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
          {[200, 350, 500].map((size, i) => (
            <div key={i} style={{
              position: 'absolute', top: '50%', left: '50%',
              width: size, height: size, borderRadius: '50%',
              border: `1px solid rgba(55,138,221,${0.08 - i * 0.02})`,
              transform: 'translate(-50%,-50%)',
              animation: `sonarPing ${4 + i * 2}s ease-out ${i * 1.5}s infinite`,
            }} />
          ))}
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 11, color: C.reefTealLight, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              ✦ Simple 3-Step Workflow
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700, color: '#fff' }}>How It Works</h2>
          </div>

          <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start', position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 36, left: '16%', right: '16%', height: 1,
              background: `linear-gradient(90deg, ${C.oceanBlue}44, ${C.bioPurple}44, ${C.reefTeal}44)`,
              zIndex: 0,
            }} />
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', padding: '0 20px', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${C.oceanBlue}, ${C.bioPurple})`,
                  border: '2px solid rgba(55,138,221,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, margin: '0 auto 20px',
                  boxShadow: `0 0 24px rgba(83,74,183,0.4)`,
                  animation: `glowPulse ${3 + i}s ease-in-out ${i * 0.5}s infinite`,
                }}>
                  {step.icon}
                </div>
                <div style={{ fontSize: 11, color: C.bioPurpleLight, letterSpacing: '0.1em', marginBottom: 8 }}>STEP {step.step}</div>
                <div style={{ fontSize: 17, fontWeight: 600, color: '#fff', marginBottom: 10 }}>{step.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(160,200,255,0.7)', lineHeight: 1.7 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS SECTION ────────────────────────────────────────── */}
      <section id="stats" style={{ padding: '80px 24px', background: C.pageBg }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 11, color: C.oceanBlueLight, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              ✦ Platform Numbers
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700, color: '#fff' }}>
              Built for real marine operations
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {STATS.map((stat, i) => (
              <div key={i} style={{
                background: 'linear-gradient(135deg, rgba(13,31,60,0.9), rgba(8,20,40,0.95))',
                border: '0.5px solid rgba(55,138,221,0.2)',
                borderRadius: 16, padding: '28px 20px', textAlign: 'center',
                animation: `featureFadeUp 0.6s ease-out ${0.1 + i * 0.1}s both`,
              }}>
                <CountUp target={stat.value} suffix={stat.suffix} />
                <div style={{ fontSize: 13, color: 'rgba(160,200,255,0.7)', marginTop: 8 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section style={{
        padding: '80px 24px 100px', textAlign: 'center',
        background: `linear-gradient(180deg, ${C.pageBg}, #0d1f3c)`,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, lineHeight: 0, overflow: 'hidden' }}>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width: '200%', height: 60, animation: 'waveScroll 10s linear infinite reverse' }}>
            <path d="M0,30 Q180,60 360,30 Q540,0 720,30 Q900,60 1080,30 Q1260,0 1440,30 L1440,0 L0,0 Z" fill={C.pageBg} />
            <path d="M0,30 Q180,60 360,30 Q540,0 720,30 Q900,60 1080,30 Q1260,0 1440,30 L1440,0 L0,0 Z" fill={C.pageBg} transform="translate(1440,0)" />
          </svg>
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: C.bioPurpleLight, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            ✦ Ready to dive in?
          </div>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 42px)', fontWeight: 800, color: '#fff', marginBottom: 16, lineHeight: 1.2 }}>
            Start your first<br />sonar mission today
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(160,200,255,0.7)', marginBottom: 40, lineHeight: 1.7 }}>
            Upload your side-scan sonar files and let our AI find what's hiding on the ocean floor
          </p>
          <button className="cta-btn" onClick={() => navigate('/dashboard')} style={{
            padding: '16px 40px', borderRadius: 50,
            background: `linear-gradient(135deg, ${C.oceanBlue}, ${C.bioPurple})`,
            border: 'none', color: '#fff', fontSize: 16, fontWeight: 600,
            cursor: 'pointer', letterSpacing: '0.04em',
            boxShadow: '0 4px 20px rgba(83,74,183,0.4)',
            transition: 'all 0.3s ease',
          }}>
            🚀 Launch Platform
          </button>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer style={{
        padding: '24px 28px', background: '#020E1E',
        borderTop: '0.5px solid rgba(55,138,221,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🌊</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Marine AI</span>
          <span style={{ fontSize: 12, color: C.seafloorGrayLight, marginLeft: 4 }}>— Anomaly Detection Platform</span>
        </div>
        <div style={{ fontSize: 12, color: C.seafloorGrayLight }}>SIH 2026 · Team Project</div>
      </footer>
    </div>
  );
}
