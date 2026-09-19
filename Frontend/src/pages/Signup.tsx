import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import OceanDepthBackground from '@/components/sonar/OceanDepthBackground';
import { Waves, Lock, User, Mail, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const { signup, isAuthenticated } = useAuth();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('operator');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.dashboard, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password) {
      setError('Please fill in Name, Username, and Password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signup({
        name: name.trim(),
        username: username.trim(),
        email: email.trim() || undefined,
        password,
        role,
      });

      setSuccessMessage('Registration successful! Redirecting to mission control...');
      navigate(ROUTES.dashboard, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Username may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OceanDepthBackground showGrid={true} enableParallax={false} intensity="high">
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 font-sans select-none text-white">
        
        {/* Signup Modal Container */}
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
              PERSONNEL REGISTRATION
            </p>
          </div>

          {/* Classification Banner */}
          <div className="flex items-center justify-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-950/40 py-2 px-3 text-[11px] font-mono text-slate-300">
            <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>Enroll Subsea Mission Operator</span>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 text-xs font-mono text-rose-200">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs font-mono text-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <Input
              label="Full Name / Rank"
              type="text"
              placeholder="e.g. Lt. Cmdr. Alex Chen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User className="h-4 w-4" />}
              required
            />

            <Input
              label="Operator Username"
              type="text"
              placeholder="e.g. alex.chen"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={<User className="h-4 w-4" />}
              autoComplete="username"
              required
            />

            <Input
              label="Official Email (Optional)"
              type="email"
              placeholder="e.g. alex.chen@niot.res.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="h-4 w-4" />}
              autoComplete="email"
            />

            <Input
              label="Security Clearance Key (Password)"
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="h-4 w-4" />}
              autoComplete="new-password"
              required
            />

            {/* Role Radio Pill */}
            <div className="flex flex-col gap-1.5 font-mono text-xs">
              <span className="uppercase tracking-wider text-slate-300 font-semibold">
                Operational Role
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('operator')}
                  className={`py-2 px-3 rounded border text-xs font-semibold transition-all ${
                    role === 'operator'
                      ? 'border-cyan-400 bg-cyan-950/80 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Operator
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2 px-3 rounded border text-xs font-semibold transition-all ${
                    role === 'admin'
                      ? 'border-cyan-400 bg-cyan-950/80 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              REGISTER PERSONNEL
            </Button>
          </form>

          {/* Switch to Login */}
          <div className="flex flex-col items-center gap-3 pt-4 border-t border-cyan-500/20 text-xs font-mono">
            <p className="text-slate-400">
              Already registered?{' '}
              <Link to={ROUTES.login} className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4">
                Sign in with existing credentials
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
