import { type ChangeEvent, type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, registerAdmin } from '@/api/auth';
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

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SignupMode = 'operator' | 'admin';

export default function SignupPage() {
  const navigate = useNavigate();
  const { login: authenticate } = useAuth();
  const [mode, setMode] = useState<SignupMode>('operator');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    licenseImage: null as File | null,
  });
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string; licenseImage?: string; form?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof typeof form, value: string | File | null) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    handleChange('licenseImage', file);
  };

  const validate = () => {
    const nextErrors: { name?: string; email?: string; password?: string; confirmPassword?: string; licenseImage?: string } = {};

    if (!form.name.trim()) {
      nextErrors.name = 'Full name is required.';
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
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

    if (mode === 'admin' && !form.licenseImage) {
      nextErrors.licenseImage = 'A ship license image is required for admin access.';
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
      if (mode === 'admin') {
        if (!form.licenseImage) {
          throw new Error('A ship license image is required for admin access.');
        }
        await registerAdmin(form.name.trim(), form.email.trim(), form.password, form.licenseImage);
      } else {
        await register(form.name.trim(), form.email.trim(), form.password, 'operator');
      }

      const authUser = await authenticate(form.email.trim(), form.password);
      navigate(authUser.role === 'admin' ? ROUTES.admin : ROUTES.dashboard);
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
          maxWidth: 560,
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
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: '#ffffff', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Join the platform</div>
            <div style={{ color: colors.muted, fontSize: 14, lineHeight: 1.6 }}>
              Register for operator access or submit a ship license for admin approval.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'rgba(7, 17, 28, 0.65)', borderRadius: 12, padding: 6, border: '1px solid rgba(127, 209, 255, 0.18)' }}>
            <button
              type="button"
              onClick={() => setMode('operator')}
              style={{
                flex: 1,
                border: 'none',
                borderRadius: 10,
                padding: '10px 12px',
                background: mode === 'operator' ? 'linear-gradient(135deg, #0C447C 0%, #534AB7 100%)' : 'transparent',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Operator
            </button>
            <button
              type="button"
              onClick={() => setMode('admin')}
              style={{
                flex: 1,
                border: 'none',
                borderRadius: 10,
                padding: '10px 12px',
                background: mode === 'admin' ? 'linear-gradient(135deg, #0C447C 0%, #534AB7 100%)' : 'transparent',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Admin
            </button>
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
              <label htmlFor="email" style={{ display: 'block', color: '#EAF6FF', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Email
              </label>
              <input
                id="email"
                value={form.email}
                onChange={(event) => handleChange('email', event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: 12,
                  border: `1px solid ${errors.email ? colors.danger : 'rgba(127, 209, 255, 0.25)'}`,
                  background: 'rgba(3, 16, 27, 0.7)',
                  color: '#fff',
                  padding: '12px 14px',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              {errors.email && <div style={{ color: colors.danger, fontSize: 12, marginTop: 6 }}>{errors.email}</div>}
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
                placeholder="Repeat your password"
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

            {mode === 'admin' && (
              <div>
                <label htmlFor="licenseImage" style={{ display: 'block', color: '#EAF6FF', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  Ship license image
                </label>
                <input
                  id="licenseImage"
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleFileChange}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    borderRadius: 12,
                    border: `1px solid ${errors.licenseImage ? colors.danger : 'rgba(127, 209, 255, 0.25)'}`,
                    background: 'rgba(3, 16, 27, 0.7)',
                    color: '#fff',
                    padding: '12px 14px',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
                {form.licenseImage && <div style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>{form.licenseImage.name}</div>}
                {errors.licenseImage && <div style={{ color: colors.danger, fontSize: 12, marginTop: 6 }}>{errors.licenseImage}</div>}
              </div>
            )}
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
            {isSubmitting ? (mode === 'admin' ? 'Creating admin...' : 'Creating account...') : mode === 'admin' ? 'Create admin account' : 'Create account'}
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
