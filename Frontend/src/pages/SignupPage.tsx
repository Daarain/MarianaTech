import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, register } from '@/api/auth';
import { ROUTES } from '@/constants/routes';

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

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{ name?: string; username?: string; password?: string; confirmPassword?: string; form?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  const validate = () => {
    const nextErrors: { name?: string; username?: string; password?: string; confirmPassword?: string } = {};

    if (!form.name.trim()) {
      nextErrors.name = 'Full name is required.';
    }

    if (!form.username.trim()) {
      nextErrors.username = 'Username is required.';
    } else if (form.username.trim().length < 3) {
      nextErrors.username = 'Username must be at least 3 characters.';
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.';
    } else if (form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
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
      await register(form.name.trim(), form.username.trim(), form.password);
      await login(form.username.trim(), form.password);
      navigate(ROUTES.dashboard);
    } catch (error: any) {
      const message = error?.message || 'Unable to create your account. Please try again.';
      setErrors({ form: message });
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
          maxWidth: 500,
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
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Create account</div>
              <div style={{ color: colors.muted, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                MarianaTech access
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ color: '#ffffff', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Join the platform</div>
            <div style={{ color: colors.muted, fontSize: 14, lineHeight: 1.6 }}>
              Register to begin sonar review, anomaly triage, and mission tracking.
            </div>
          </div>

          <div style={{ display: 'grid', gap: 18 }}>
            <div>
              <label htmlFor="name" style={{ display: 'block', color: '#EAF6FF', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Full name
              </label>
              <input
                id="name"
                value={form.name}
                onChange={(event) => handleChange('name', event.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: 12,
                  border: `1px solid ${errors.name ? colors.danger : 'rgba(127, 209, 255, 0.25)'}`,
                  background: 'rgba(3, 16, 27, 0.7)',
                  color: '#fff',
                  padding: '12px 14px',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              {errors.name && <div style={{ color: colors.danger, fontSize: 12, marginTop: 6 }}>{errors.name}</div>}
            </div>

            <div>
              <label htmlFor="username" style={{ display: 'block', color: '#EAF6FF', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Username
              </label>
              <input
                id="username"
                value={form.username}
                onChange={(event) => handleChange('username', event.target.value)}
                placeholder="Choose a username"
                autoComplete="username"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: 12,
                  border: `1px solid ${errors.username ? colors.danger : 'rgba(127, 209, 255, 0.25)'}`,
                  background: 'rgba(3, 16, 27, 0.7)',
                  color: '#fff',
                  padding: '12px 14px',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              {errors.username && <div style={{ color: colors.danger, fontSize: 12, marginTop: 6 }}>{errors.username}</div>}
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
                placeholder="Create a password"
                autoComplete="new-password"
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

            <div>
              <label htmlFor="confirmPassword" style={{ display: 'block', color: '#EAF6FF', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(event) => handleChange('confirmPassword', event.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: 12,
                  border: `1px solid ${errors.confirmPassword ? colors.danger : 'rgba(127, 209, 255, 0.25)'}`,
                  background: 'rgba(3, 16, 27, 0.7)',
                  color: '#fff',
                  padding: '12px 14px',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              {errors.confirmPassword && <div style={{ color: colors.danger, fontSize: 12, marginTop: 6 }}>{errors.confirmPassword}</div>}
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
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>

          <div style={{ marginTop: 22, textAlign: 'center', color: colors.muted, fontSize: 14 }}>
            Already have an account?{' '}
            <Link to={ROUTES.login} style={{ color: colors.accent, textDecoration: 'none', fontWeight: 600 }}>
              Login
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
