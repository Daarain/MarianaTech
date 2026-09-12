import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  Maximize2,
  Minimize2,
  RotateCcw,
  Radio,
  ArrowRight,
  Sparkles,
  Mic,
  MicOff,
  ChevronRight,
  Volume2,
  Download,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

interface DemoVideoPlayerProps {
  onClose?: () => void;
}

export default function DemoVideoPlayer({ onClose }: DemoVideoPlayerProps) {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(true);
  const [voiceOverEnabled, setVoiceOverEnabled] = useState(true);
  const [currentScene, setCurrentScene] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.85); // Calm, documentary pace (0.85x)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const scenes = [
    {
      id: 1,
      title: '01. Submersible ROV Deployment',
      subtitle: 'SURVEY INITIATION & TELEMETRY',
      image: '/images/demo/scene1.png',
      badge: 'ROV TELEMETRY ONLINE',
      narration:
        'Welcome to MarianaTech. Developed for the Ministry of Earth Sciences and NIOT, our system deploys deep-sea ROV submersibles to survey ocean floor anomalies at depths down to 320 meters.',
      details: [
        'Depth: -320.4 meters | Zone: Arabian Sea Survey Track',
        'Dual Transducer Arrays active at 450 kilohertz',
        'Real-time vehicle pitch, roll, and bathymetric tracking',
      ],
    },
    {
      id: 2,
      title: '02. Dual-Frequency Sonar Ingestion',
      subtitle: 'SIGNAL DESPECKLING & NORMALIZATION',
      image: '/images/demo/scene2.png',
      badge: 'SPECKLE DENOISING ACTIVE',
      narration:
        'Raw side-scan sonar signals are ingested into our processing pipeline. Adaptive bilateral filtering removes acoustic speckle noise while gain normalization enhances seabed shadow contrast.',
      details: [
        'Supported Formats: GeoTIFF, PNG, and hydrographic logs',
        'Bilateral speckle noise removal & gain normalization',
        'Waterfall acoustic signal scan feed',
      ],
    },
    {
      id: 3,
      title: '03. YOLOv8 Deep Learning Inference',
      subtitle: 'NEURAL NETWORK TARGET CLASSIFICATION',
      image: '/images/demo/scene3.png',
      badge: 'AI MODEL ACCURACY: 92.4%',
      narration:
        'Our custom YOLOv8 deep learning model scans the imagery in real time, automatically identifying and classifying shipwrecks, marine debris, cables, and seafloor anomalies with high precision.',
      details: [
        'Classifications: Shipwrecks, Marine Debris, Pipelines',
        'Sub-meter spatial bounding box accuracy (< 0.5m)',
        'Inference latency under 1.2 seconds per sonar tile',
      ],
    },
    {
      id: 4,
      title: '04. Geospatial Bathymetric Mapping',
      subtitle: 'GPS COORDINATE & SURVEY TRACK GEOTAGGING',
      image: '/images/demo/scene4.png',
      badge: 'GEOTAG COMPLETE (18.9542° N)',
      narration:
        'Detections are instantly geotagged with exact latitude, longitude, and depth telemetry, plotting anomaly clusters directly onto dark ocean bathymetric survey maps.',
      details: [
        'GeoJSON integration with Leaflet bathymetric basemaps',
        'Target Coordinates: 18.9542° N, 72.1234° E',
        'Historical survey tracks & anomaly density heatmaps',
      ],
    },
    {
      id: 5,
      title: '05. Automated Scientific PDF Reports',
      subtitle: 'STANDARDIZED SURVEY REPORT GENERATION',
      image: '/images/demo/scene5.png',
      badge: 'REPORT GENERATED (PDF/CSV)',
      narration:
        'Finally, MarianaTech compiles standardized hydrographic survey reports complete with high-resolution sonar evidence crops, statistical breakdowns, and instant PDF exports.',
      details: [
        'MoES and NIOT standardized hydrographic format',
        'Printable light-mode inspection report previews',
        'Instant download: PDF summaries & CSV raw metrics',
      ],
    },
  ];

  const activeSceneObj = scenes[currentScene] || scenes[0];

  // Subtle High-Tech Sonar Chime Sound Effect via Web Audio API
  const playSonarChime = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Ignore audio context autoplay restrictions
    }
  };

  // AI Voice-Over Speech Engine (Synchronized, Never Cut Off)
  const speakSceneNarration = (sceneIndex: number) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Clear queued speech

    if (!voiceOverEnabled || !isPlaying) {
      setIsSpeaking(false);
      return;
    }

    const scene = scenes[sceneIndex];
    if (!scene) return;

    const utterance = new SpeechSynthesisUtterance(scene.narration);
    utterance.rate = speechRate; // Calm documentary pace (default 0.85x)
    utterance.pitch = 1.0;

    // Pick best natural English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(
      (v) =>
        v.lang.includes('en') &&
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Microsoft') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel'))
    ) || voices[0];

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    // WHEN VOICE NARRATOR FINISHES THE SENTENCE NATURALLY:
    utterance.onend = () => {
      setIsSpeaking(false);
      if (isPlaying) {
        // Wait 1.5 seconds smoothly before advancing to next scene
        setTimeout(() => {
          if (isPlaying) {
            playSonarChime();
            setCurrentScene((prev) => {
              const next = (prev + 1) % scenes.length;
              return next;
            });
          }
        }, 1500);
      }
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Trigger speech when scene or speech parameters change
  useEffect(() => {
    speakSceneNarration(currentScene);
  }, [currentScene, isPlaying, voiceOverEnabled, speechRate]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Animated 2D Canvas Radar/Sonar Sweep Overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let sweepLineX = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) return;

      ctx.clearRect(0, 0, w, h);

      if (isPlaying) {
        sweepLineX = (sweepLineX + 2) % w;

        // Animated Vertical Sonar Sweep Line
        const grad = ctx.createLinearGradient(sweepLineX - 45, 0, sweepLineX, 0);
        grad.addColorStop(0, 'rgba(0, 242, 254, 0)');
        grad.addColorStop(1, 'rgba(0, 242, 254, 0.4)');
        ctx.fillStyle = grad;
        ctx.fillRect(sweepLineX - 45, 0, 45, h);

        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sweepLineX, 0);
        ctx.lineTo(sweepLineX, h);
        ctx.stroke();

        // Render AI target reticle on Scene 3
        if (currentScene === 2) {
          const bx = w * 0.45;
          const by = h * 0.32;
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(bx, by, 160, 100);
          ctx.setLineDash([]);

          ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
          ctx.fillRect(bx, by - 24, 150, 22);

          ctx.font = 'bold 11px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.fillText('POSSIBLE WRECK 0.92', bx + 6, by - 8);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, currentScene]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const handleSceneClick = (index: number) => {
    playSonarChime();
    setCurrentScene(index);
    setIsPlaying(true);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-cyan-500/40 bg-[#030a16] shadow-[0_25px_60px_rgba(0,240,255,0.3)] select-none"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-cyan-500/30 bg-[#051326]/95 px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-cyan-300 font-bold">
            <Radio className="h-4 w-4 text-cyan-400 animate-pulse" />
            <span className="text-white tracking-wider">MARIANATECH SYSTEM DEMONSTRATION</span>
          </div>
          <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950 px-2.5 py-1 rounded-md border border-cyan-500/40">
            {activeSceneObj.badge}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-slate-300">
          {/* AI Voice-Over Narrator Toggle */}
          <button
            onClick={() => setVoiceOverEnabled(!voiceOverEnabled)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[11px] font-bold transition-all ${
              voiceOverEnabled
                ? 'border-emerald-400/60 bg-emerald-950/80 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'border-slate-600 bg-slate-900/60 text-slate-400'
            }`}
            title="Toggle AI Voice-Over Narration"
          >
            {voiceOverEnabled ? (
              <Mic className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            ) : (
              <MicOff className="h-3.5 w-3.5" />
            )}
            <span>AI NARRATOR: {voiceOverEnabled ? 'ON (DOCUMENTARY VOICE)' : 'OFF'}</span>
          </button>

          {onClose && (
            <button
              onClick={() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                onClose();
              }}
              className="text-slate-400 hover:text-white font-bold text-sm pl-2"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Video Viewport Canvas */}
      <div className="relative aspect-video w-full overflow-hidden bg-black flex items-center justify-center">
        {/* Photorealistic Scene Image with Smooth Fade */}
        <img
          key={activeSceneObj.id}
          src={activeSceneObj.image}
          alt={activeSceneObj.title}
          className="absolute inset-0 h-full w-full object-cover animate-in fade-in duration-700"
        />

        {/* 2D Canvas Radar/Sonar Sweep Overlay */}
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="absolute inset-0 h-full w-full pointer-events-none"
        />

        {/* Active AI Voice Narrator Status Badge */}
        {voiceOverEnabled && isSpeaking && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-cyan-950/90 border border-cyan-500/50 px-3.5 py-1.5 rounded-full backdrop-blur-md font-mono text-[10px] text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            <Volume2 className="h-3.5 w-3.5 text-emerald-400 animate-bounce" />
            <span className="font-bold">VOICE-OVER NARRATION: SPEAKING...</span>
          </div>
        )}

        {/* Subtitles & Narration Caption Box (Bottom Center) */}
        <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-col items-center">
          <div className="max-w-3xl w-full bg-[#041022]/90 border border-cyan-500/40 p-4 rounded-2xl backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,10,25,0.9)] space-y-2">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span>{activeSceneObj.title}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">{activeSceneObj.subtitle}</span>
            </div>

            {/* Synchronized Subtitle Caption */}
            <p className="text-xs sm:text-sm text-white font-sans leading-relaxed border-t border-cyan-500/20 pt-2 font-medium">
              "{activeSceneObj.narration}"
            </p>

            {/* Scene Specifications Chips */}
            <div className="hidden sm:flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px] text-cyan-200/80">
              {activeSceneObj.details.map((detail, idx) => (
                <div key={idx} className="flex items-center gap-1 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/20">
                  <ChevronRight className="h-3 w-3 text-cyan-400" />
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Pause/Play Overlay Button */}
        {!isPlaying && (
          <button
            onClick={() => setIsPlaying(true)}
            className="z-30 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/90 text-black shadow-[0_0_50px_rgba(0,240,255,0.8)] hover:scale-110 transition-transform"
          >
            <Play className="h-10 w-10 fill-current ml-1" />
          </button>
        )}
      </div>

      {/* 5-Scene Step Selector Ribbon */}
      <div className="grid grid-cols-5 border-t border-cyan-500/20 bg-[#051326] font-mono text-[11px]">
        {scenes.map((scene, idx) => (
          <button
            key={scene.id}
            onClick={() => handleSceneClick(idx)}
            className={`p-3 text-center border-r border-cyan-500/10 transition-all ${
              currentScene === idx
                ? 'bg-cyan-950/90 text-cyan-300 font-bold border-b-2 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                : 'text-slate-400 hover:text-cyan-200 hover:bg-cyan-950/40'
            }`}
          >
            <div className="truncate font-bold">{scene.title}</div>
          </button>
        ))}
      </div>

      {/* Controls Bar & Speech Pace Settings */}
      <div className="p-4 bg-[#040d1a] border-t border-cyan-500/30 space-y-3">
        {/* Progress Bar Indicator */}
        <div className="relative h-2 w-full rounded-full bg-cyan-950 border border-cyan-500/30 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 transition-all duration-300 shadow-[0_0_15px_rgba(0,240,255,0.7)]"
            style={{ width: `${((currentScene + 1) / scenes.length) * 100}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          {/* Left Player Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-950/80 text-cyan-300 hover:bg-cyan-900 transition-colors shadow-[0_0_10px_rgba(0,240,255,0.2)]"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => {
                setCurrentScene(0);
                setIsPlaying(true);
              }}
              className="p-2 text-slate-400 hover:text-cyan-300"
              title="Restart Demo Video"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* Speech Rate Controls */}
            <div className="flex items-center gap-1 bg-cyan-950/60 p-1 rounded-lg border border-cyan-500/30 text-[10px]">
              <span className="text-slate-400 px-1 font-semibold">VOICE PACE:</span>
              <button
                onClick={() => setSpeechRate(0.75)}
                className={`px-2 py-0.5 rounded font-bold transition-all ${
                  speechRate === 0.75 ? 'bg-cyan-500 text-black' : 'text-cyan-300 hover:bg-cyan-900'
                }`}
              >
                0.75x (SLOW)
              </button>
              <button
                onClick={() => setSpeechRate(0.85)}
                className={`px-2 py-0.5 rounded font-bold transition-all ${
                  speechRate === 0.85 ? 'bg-cyan-500 text-black' : 'text-cyan-300 hover:bg-cyan-900'
                }`}
              >
                0.85x (CALM)
              </button>
              <button
                onClick={() => setSpeechRate(1.0)}
                className={`px-2 py-0.5 rounded font-bold transition-all ${
                  speechRate === 1.0 ? 'bg-cyan-500 text-black' : 'text-cyan-300 hover:bg-cyan-900'
                }`}
              >
                1.0x (STD)
              </button>
            </div>

            <span className="text-[11px] text-cyan-300 font-bold">
              SCENE {currentScene + 1} / 5
            </span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Download Demo Video Button */}
            <button
              onClick={() => {
                // Trigger video blob download
                const link = document.createElement('a');
                link.href = activeSceneObj.image;
                link.download = `MarianaTech_Demo_Scene_${currentScene + 1}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/60 font-mono text-[11px] font-bold text-cyan-300 hover:bg-cyan-900 hover:text-white transition-all shadow-[0_0_10px_rgba(0,240,255,0.2)]"
              title="Download Scene Presentation Frame & Telemetry"
            >
              <Download className="h-3.5 w-3.5 text-cyan-400" />
              <span>Download Scene Image</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 text-slate-400 hover:text-cyan-300"
              title="Fullscreen Mode"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            <button
              onClick={() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                if (onClose) onClose();
                navigate(ROUTES.sonarAnalysis);
              }}
              className="flex items-center gap-2 rounded-full border border-cyan-400/60 bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-bold text-black shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-105 transition-all"
            >
              <span>Launch Live Workstation</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
