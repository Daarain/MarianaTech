import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';

const colors = {
  pageBg: '#071827',
  panel: 'rgba(9, 27, 46, 0.82)',
  border: 'rgba(97, 163, 255, 0.28)',
  oceanBlue: '#0C447C',
  oceanBlueLight: '#378ADD',
  bioPurple: '#534AB7',
  bioPurpleLight: '#7F77DD',
  text: '#EAF6FF',
  muted: 'rgba(180, 215, 255, 0.78)',
  accent: '#7FD1FF',
  danger: '#FF8A80',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; form?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: 'identifier' | 'password', value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  const validate = () => {
    const nextErrors: { identifier?: string; password?: string } = {};

    if (!form.identifier.trim()) {
      nextErrors.identifier = 'Username or email is required.';
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.';
    }

    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const authUser = await login(form.identifier.trim(), form.password);
      navigate(authUser.role === 'admin' ? ROUTES.admin : ROUTES.dashboard);
    } catch (error: any) {
      setErrors({
        form: error?.message || 'Invalid username/email or password. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(circle at top, rgba(18, 85, 155, 0.55), transparent 38%), linear-gradient(135deg, ${colors.pageBg} 0%, #0b1d2c 35%, #091820 100%)`,
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: colors.panel,
          border: `1px solid ${colors.border}`,
          borderRadius: 24,
          boxShadow: '0 24px 80px rgba(7, 17, 30, 0.72)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '28px 28px 18px',
            borderBottom: `1px solid ${colors.border}`,
            background: 'linear-gradient(135deg, rgba(12,68,124,0.22), rgba(83,74,183,0.12))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${colors.oceanBlueLight}, ${colors.bioPurpleLight})`,
                fontSize: 20,
                boxShadow: '0 0 18px rgba(83,74,183,0.5)',
              }}
            >
              🌊
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Marine AI</div>
              <div style={{ color: colors.muted, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Login Portal
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ color: '#ffffff', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Welcome back</div>
            <div style={{ color: colors.muted, fontSize: 14, lineHeight: 1.6 }}>
              Sign in to continue monitoring mission activity and anomaly review.
            </div>
          </div>

          <div style={{ display: 'grid', gap: 18 }}>
            <div>
              <label htmlFor="identifier" style={{ display: 'block', color: '#EAF6FF', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Username or email
              </label>
              <input
                id="identifier"
                value={form.identifier}
                onChange={(event) => handleChange('identifier', event.target.value)}
                placeholder="Enter your username or email"
                autoComplete="username"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: 12,
                  border: `1px solid ${errors.identifier ? colors.danger : 'rgba(127, 209, 255, 0.25)'}`,
                  background: 'rgba(3, 16, 27, 0.7)',
                  color: '#fff',
                  padding: '12px 14px',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              {errors.identifier && <div style={{ color: colors.danger, fontSize: 12, marginTop: 6 }}>{errors.identifier}</div>}
            </div>

            <div>
              <label htmlFor="password" style={{ display: 'block', color: '#EAF6FF', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => handleChange('password', event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: 12,
                  border: `1px solid ${errors.password ? colors.danger : 'rgba(127, 209, 255, 0.25)'}`,
                  background: 'rgba(3, 16, 27, 0.7)',
                  color: '#fff',
                  padding: '12px 14px',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              {errors.password && <div style={{ color: colors.danger, fontSize: 12, marginTop: 6 }}>{errors.password}</div>}
            </div>
          </div>

          {errors.form && (
            <div
              style={{
                marginTop: 18,
                padding: '10px 12px',
                borderRadius: 10,
                background: 'rgba(255, 138, 128, 0.08)',
                border: '1px solid rgba(255, 138, 128, 0.26)',
                color: colors.danger,
                fontSize: 13,
              }}
            >
              {errors.form}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              marginTop: 24,
              border: 'none',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #0C447C 0%, #534AB7 100%)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              padding: '14px 16px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              boxShadow: '0 10px 30px rgba(12, 68, 124, 0.35)',
            }}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>

          <div style={{ marginTop: 22, textAlign: 'center', color: colors.muted, fontSize: 14 }}>
            Need an account?{' '}
            <Link to={ROUTES.signup} style={{ color: colors.accent, textDecoration: 'none', fontWeight: 600 }}>
              Sign up
            </Link>
          </div>

          <div style={{ marginTop: 10, textAlign: 'center' }}>
            <Link to={ROUTES.home} style={{ color: colors.muted, fontSize: 13, textDecoration: 'none' }}>
              Return to home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
