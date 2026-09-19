import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import OceanDepthBackground from '@/components/sonar/OceanDepthBackground';
import { Waves, Lock, User, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rawFrom = (location.state as any)?.from?.pathname;
  const from = (rawFrom && rawFrom !== ROUTES.landing && rawFrom !== ROUTES.login && rawFrom !== ROUTES.signup)
    ? rawFrom
    : ROUTES.dashboard;

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please enter both username/email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(identifier, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OceanDepthBackground showGrid={true} enableParallax={false} intensity="high">
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 font-sans select-none text-white">
        
        {/* Login Modal Container */}
        <div className="w-full max-w-md rounded-2xl border border-cyan-500/30 bg-[#050D1A]/95 p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,240,255,0.18)] space-y-6">
          
          {/* Header Brand */}
          <div className="flex flex-col items-center text-center space-y-2">
            <Link to={ROUTES.landing} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-950/90 border border-cyan-400/50 text-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-105 transition-transform mb-2">
              <Waves className="h-7 w-7 animate-pulse" />
            </Link>
            <h1 className="font-mono text-xl font-black tracking-wider text-white">
              MARIANATECH
            </h1>
            <p className="font-mono text-xs tracking-widest text-cyan-400 font-semibold uppercase">
              OPERATOR ACCESS CONTROL
            </p>
          </div>

          {/* Classification Banner */}
          <div className="flex items-center justify-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-950/40 py-2 px-3 text-[11px] font-mono text-slate-300">
            <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>Secure Mission Telemetry Authorization</span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 text-xs font-mono text-rose-200">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Operator Identifier"
              type="text"
              placeholder="Username or email address"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              icon={<User className="h-4 w-4" />}
              autoComplete="username"
              required
            />

            <Input
              label="Security Clearance Key"
              type="password"
              placeholder="Enter clearance password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="h-4 w-4" />}
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              AUTHENTICATE & ENTER
            </Button>
          </form>

          {/* Register / Sign Up Option */}
          <div className="flex flex-col items-center gap-3 pt-4 border-t border-cyan-500/20 text-xs font-mono">
            <p className="text-slate-400">
              New personnel?{' '}
              <Link to={ROUTES.signup} className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4">
                Register credentials
              </Link>
            </p>

            <Link to={ROUTES.landing} className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors">
              ← Return to Platform Overview
            </Link>
          </div>

        </div>

      </div>
    </OceanDepthBackground>
  );
}
