import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OceanDepthBackground from '@/components/sonar/OceanDepthBackground';
import Submarine3DCanvas from '@/components/sonar/Submarine3DCanvas';
import DemoVideoPlayer from '@/components/sonar/DemoVideoPlayer';
import {
  Waves,
  ArrowRight,
  ShieldCheck,
  Radio,
  Globe,
  FileText,
  Play,
  Menu,
  X,
  Cpu,
  Database,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'features' | 'about' | 'contact'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoVideoOpen, setDemoVideoOpen] = useState(false);

  const handleNavClick = (sectionId: 'home' | 'features' | 'about' | 'contact') => {
    setActiveTab(sectionId);
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <OceanDepthBackground showGrid={true} enableParallax={true} intensity="high">
      <div className="relative flex min-h-screen flex-col justify-between px-4 sm:px-6 py-6 md:px-12 max-w-7xl mx-auto font-sans select-none page-fade-in text-white">
        
        {/* Top Entry Navigation Bar */}
        <header className="sticky top-4 z-50 flex items-center justify-between border border-cyan-500/30 bg-[#050D1A]/90 px-5 py-3.5 backdrop-blur-2xl rounded-2xl shadow-[0_10px_30px_rgba(0,240,255,0.15)]">
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.35)] group-hover:scale-105 transition-transform">
              <Waves className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h1 className="font-mono text-base font-extrabold tracking-wider text-white group-hover:text-cyan-300 transition-colors">
                MARIANATECH
              </h1>
              <span className="font-mono text-[9px] tracking-widest text-cyan-400 font-semibold uppercase block">
                OCEAN INTELLIGENCE PLATFORM
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <button
              onClick={() => handleNavClick('home')}
              className={`transition-all ${
                activeTab === 'home'
                  ? 'text-cyan-300 font-bold border-b-2 border-cyan-400 pb-0.5'
                  : 'hover:text-cyan-300'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('features')}
              className={`transition-all ${
                activeTab === 'features'
                  ? 'text-cyan-300 font-bold border-b-2 border-cyan-400 pb-0.5'
                  : 'hover:text-cyan-300'
              }`}
            >
              Features
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className={`transition-all ${
                activeTab === 'about'
                  ? 'text-cyan-300 font-bold border-b-2 border-cyan-400 pb-0.5'
                  : 'hover:text-cyan-300'
              }`}
            >
              About
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className={`transition-all ${
                activeTab === 'contact'
                  ? 'text-cyan-300 font-bold border-b-2 border-cyan-400 pb-0.5'
                  : 'hover:text-cyan-300'
              }`}
            >
              Contact
            </button>
          </nav>

          {/* Action CTAs & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(ROUTES.dashboard)}
              className="hidden sm:flex items-center gap-2 rounded-full border border-cyan-400/50 bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-black shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:scale-105 transition-all"
            >
              <span>Enter Platform</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-cyan-500/30 bg-cyan-950/60 text-cyan-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </header>

        {/* Mobile Slide-down Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed top-20 left-4 right-4 z-50 rounded-2xl border border-cyan-500/40 bg-[#051326]/95 p-6 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,10,25,0.9)] space-y-4 animate-in slide-in-from-top-4">
            <div className="flex flex-col gap-3 font-mono text-sm">
              <button
                onClick={() => handleNavClick('home')}
                className="text-left px-4 py-2.5 rounded-xl border border-cyan-500/20 bg-cyan-950/40 text-cyan-300 font-bold"
              >
                Home
              </button>
              <button
                onClick={() => handleNavClick('features')}
                className="text-left px-4 py-2.5 rounded-xl border border-cyan-500/20 bg-cyan-950/40 text-slate-200 hover:text-cyan-300"
              >
                Features
              </button>
              <button
                onClick={() => handleNavClick('about')}
                className="text-left px-4 py-2.5 rounded-xl border border-cyan-500/20 bg-cyan-950/40 text-slate-200 hover:text-cyan-300"
              >
                About
              </button>
              <button
                onClick={() => handleNavClick('contact')}
                className="text-left px-4 py-2.5 rounded-xl border border-cyan-500/20 bg-cyan-950/40 text-slate-200 hover:text-cyan-300"
              >
                Contact
              </button>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate(ROUTES.dashboard);
              }}
              className="w-full flex items-center justify-center gap-2 rounded-full border border-cyan-400/50 bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-xs font-bold text-black"
            >
              <span>Enter Platform</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Section 1: Hero (#home) */}
        <section id="home" className="pt-8 pb-16 my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/50 px-4 py-1.5 font-mono text-xs text-cyan-300">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span>MINISTRY OF EARTH SCIENCES (MoES) | NIOT | SIH 2026 PS 26057</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-none">
                DEEPER INSIGHTS
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-gradient-cyan leading-none">
                CLEANER OCEANS
              </h1>
            </div>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-sans leading-relaxed">
              AI-Powered Automated Underwater Marine Debris and Anomaly Detection using Side-Scan Sonar Imagery.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => navigate(ROUTES.sonarAnalysis)}
                className="group flex items-center gap-2.5 rounded-full border border-cyan-400/60 bg-cyan-500 px-7 py-3.5 text-xs font-extrabold text-black shadow-[0_0_30px_rgba(0,240,255,0.5)] hover:bg-cyan-400 hover:scale-105 transition-all"
              >
                <span>Start Analysis</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => setDemoVideoOpen(true)}
                className="flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-950/60 px-6 py-3.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/60 hover:text-white transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:scale-105"
              >
                <Play className="h-3.5 w-3.5 fill-current text-cyan-400" />
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Capability Feature Capsules */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 border-t border-cyan-500/20 text-xs text-slate-300">
              <div
                onClick={() => handleNavClick('features')}
                className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-950/30 p-3 hover:border-cyan-400/50 cursor-pointer transition-colors"
              >
                <Radio className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>Sonar Analysis</span>
              </div>
              <div
                onClick={() => handleNavClick('features')}
                className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-950/30 p-3 hover:border-cyan-400/50 cursor-pointer transition-colors"
              >
                <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>AI Detection</span>
              </div>
              <div
                onClick={() => handleNavClick('features')}
                className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-950/30 p-3 hover:border-cyan-400/50 cursor-pointer transition-colors"
              >
                <Globe className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>Geospatial Mapping</span>
              </div>
              <div
                onClick={() => handleNavClick('features')}
                className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-950/30 p-3 hover:border-cyan-400/50 cursor-pointer transition-colors"
              >
                <FileText className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>Scientific Reports</span>
              </div>
            </div>
          </div>

          {/* Interactive 3D Submarine ROV Canvas Hero Visualization */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <Submarine3DCanvas className="h-[380px] w-full" depthMeters={320} showHUD={true} />
            <div className="mt-3 flex items-center justify-between w-full font-mono text-[10px] text-slate-400 px-1">
              <span className="italic">"Exploring Today for a Cleaner Tomorrow"</span>
              <span className="font-bold text-cyan-400">— NIOT | MoES</span>
            </div>
          </div>
        </section>

        {/* Section 2: Features (#features) */}
        <section id="features" className="py-16 border-t border-cyan-500/20 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/50 px-3.5 py-1 font-mono text-xs text-cyan-300">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>ADVANCED UNDERWATER INTELLIGENCE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Platform Features & Capabilities
            </h2>
            <p className="text-sm text-slate-300">
              Automated end-to-end processing pipeline for marine survey teams, oceanographic research, and hydrographic analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="sonar-panel rounded-2xl p-6 space-y-4 hover:border-cyan-400/50 transition-all group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 group-hover:scale-110 transition-transform">
                <Radio className="h-6 w-6" />
              </div>
              <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                Sonar Data Ingestion
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Parse raw Side-Scan Sonar files (.tif, .png, .jpg) with automated speckle noise removal and gain normalization.
              </p>
              <button
                onClick={() => navigate(ROUTES.missionNew)}
                className="font-mono text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>Ingest Sonar</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Feature 2 */}
            <div className="sonar-panel rounded-2xl p-6 space-y-4 hover:border-cyan-400/50 transition-all group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-950 border border-cyan-400/40 text-cyan-300 group-hover:scale-110 transition-transform">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                AI Anomaly Detection
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                YOLOv8 deep learning neural network specifically trained to classify marine debris, shipwrecks, cables, and seafloor anomalies.
              </p>
              <button
                onClick={() => navigate(ROUTES.admin)}
                className="font-mono text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>Inspect Model</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Feature 3 */}
            <div className="sonar-panel rounded-2xl p-6 space-y-4 hover:border-cyan-400/50 transition-all group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-950 border border-cyan-400/40 text-cyan-300 group-hover:scale-110 transition-transform">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                Geospatial Mapping
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Map detections directly to real-world bathymetric survey tracks with exact latitude, longitude, and depth geotagging.
              </p>
              <button
                onClick={() => navigate(ROUTES.dashboard)}
                className="font-mono text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>View Map</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Feature 4 */}
            <div className="sonar-panel rounded-2xl p-6 space-y-4 hover:border-cyan-400/50 transition-all group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-950 border border-cyan-400/40 text-cyan-300 group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                Scientific Reports
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Generate standardized hydrographic survey analysis reports with printable light modes, PDF downloads, and CSV data exports.
              </p>
              <button
                onClick={() => navigate(ROUTES.dashboard)}
                className="font-mono text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>Generate Report</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </section>

        {/* Section 3: About NIOT & MoES (#about) */}
        <section id="about" className="py-16 border-t border-cyan-500/20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/50 px-3.5 py-1 font-mono text-xs text-cyan-300">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
              <span>NATIONAL INSTITUTE OF OCEAN TECHNOLOGY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Pioneering Marine Survey & Ecosystem Preservation
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Developed under the Ministry of Earth Sciences (MoES) for Smart India Hackathon 2026 (Problem Statement 26057), MarianaTech empowers researchers and naval hydrographers to map ocean floor anomalies with sub-meter spatial accuracy.
            </p>

            <div className="grid grid-cols-2 gap-4 font-mono text-xs pt-2">
              <div className="sonar-panel p-4 rounded-xl space-y-1">
                <div className="text-xl font-extrabold text-cyan-400">&lt; 1.2s</div>
                <div className="text-slate-400">AI Inference Speed</div>
              </div>
              <div className="sonar-panel p-4 rounded-xl space-y-1">
                <div className="text-xl font-extrabold text-cyan-400">0.87+</div>
                <div className="text-slate-400">Model Accuracy (mAP)</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 sonar-panel rounded-2xl p-6 space-y-4 border border-cyan-500/30">
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-cyan-500/20 pb-3">
              <Database className="h-4 w-4 text-cyan-400" />
              <span>System Verification & Security</span>
            </h3>

            <div className="space-y-3 font-sans text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>On-premise / edge deployment compatibility for naval research vessels.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Zero fabricated data policy — raw sonar signals strictly preserved.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Compatible with standard GeoTIFF and hydrographic Sonar log formats.</span>
              </div>
            </div>

            <button
              onClick={() => navigate(ROUTES.dashboard)}
              className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl border border-cyan-400/50 bg-cyan-950/60 py-3 font-mono text-xs font-bold text-cyan-300 hover:bg-cyan-900/60 hover:text-white transition-all"
            >
              <span>Explore Platform Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* Section 4: Contact & Support (#contact) */}
        <section id="contact" className="py-16 border-t border-cyan-500/20 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-white">Contact & Support</h2>
            <p className="text-sm text-slate-300">
              Operational inquiries, hydrographic survey team onboarding, and technical assistance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto font-mono text-xs">
            <div className="sonar-panel rounded-2xl p-6 text-center space-y-3">
              <MapPin className="h-6 w-6 text-cyan-400 mx-auto" />
              <div className="font-bold text-white uppercase">Headquarters</div>
              <div className="text-slate-400 text-[11px]">NIOT Campus, Velachery-Tambaram Main Road, Pallikaranai, Chennai, India</div>
            </div>

            <div className="sonar-panel rounded-2xl p-6 text-center space-y-3">
              <Mail className="h-6 w-6 text-cyan-400 mx-auto" />
              <div className="font-bold text-white uppercase">Official Email</div>
              <div className="text-slate-400 text-[11px]">support@marianatech.niot.res.in</div>
            </div>

            <div className="sonar-panel rounded-2xl p-6 text-center space-y-3">
              <Phone className="h-6 w-6 text-cyan-400 mx-auto" />
              <div className="font-bold text-white uppercase">Telemetry Hotline</div>
              <div className="text-slate-400 text-[11px]">+91 (44) 6678-3300 (Ext 402)</div>
            </div>
          </div>
        </section>

        {/* Demo Video Interactive Player Modal */}
        {demoVideoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
            <div className="w-full max-w-4xl">
              <DemoVideoPlayer onClose={() => setDemoVideoOpen(false)} />
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-cyan-500/20 pt-6 pb-2 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-slate-400">
          <span>MARIANATECH PLATFORM • SIH 2026 PS 26057</span>
          <span>NATIONAL INSTITUTE OF OCEAN TECHNOLOGY (NIOT) | MoES</span>
        </footer>
      </div>
    </OceanDepthBackground>
  );
}
