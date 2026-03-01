import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../../../config/constants';

export default function LoginPage() {
  const { login, isLoading, error, clearError } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  useEffect(() => { clearError(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(t => ({ ...t, [field]: true }));
  };

  const errors = {
    email:    !form.email.includes('@') && touched.email    ? 'Enter a valid email address' : '',
    password: form.password.length < 6  && touched.password ? 'Password must be at least 6 characters' : '',
  };

  const isValid = form.email.includes('@') && form.password.length >= 6;

  const fieldState = (field: 'email' | 'password') => {
    if (errors[field]) return 'field-error';
    if (form[field] && touched[field]) return 'field-valid';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    await login({ email: form.email, password: form.password });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.875rem' }}>
      <div className="animate-slide-up stagger-1">
        <p style={{
          fontSize: '0.68rem', fontWeight: 500, textTransform: 'uppercase',
          letterSpacing: '0.2em', color: 'var(--color-accent)', marginBottom: '0.75rem',
        }}>
          Welcome back
        </p>
        <h2 className="font-display" style={{
          fontSize: 'clamp(1.875rem, 4vw, 2.375rem)', fontWeight: 700,
          lineHeight: 1.15, letterSpacing: '-0.02em', color: 'var(--color-text)',
        }}>
          Sign in to your<br />account
        </h2>
      </div>

      {error && (
        <div className="banner banner-error animate-slide-up">
          <span className="banner-icon">⚠</span>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        <div className="animate-slide-up stagger-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor="login-email" className="field-label">Email</label>
          <div className={`field-wrap ${fieldState('email')}`}>
            <input
              id="login-email"
              className="field-input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              onBlur={() => handleBlur('email')}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {form.email && touched.email && !errors.email && (
              <span className="field-check">✓</span>
            )}
          </div>
          {errors.email && (
            <span className="field-error-msg"><span>⚠</span> {errors.email}</span>
          )}
        </div>

        <div className="animate-slide-up stagger-3" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          
          <div className={`field-wrap ${fieldState('password')}`}>
            <input
              id="login-password"
              className="field-input"
              type={showPass ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              onBlur={() => handleBlur('password')}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{ paddingRight: '3.5rem' }}
            />
            <button
              type="button"
              className="toggle-btn"
              onClick={() => setShowPass(p => !p)}
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && (
            <span className="field-error-msg"><span>⚠</span> {errors.password}</span>
          )}
        </div>

        <div className="animate-slide-up stagger-4" style={{ paddingTop: '0.375rem' }}>
          <button type="submit" className="btn-primary" disabled={isLoading || !isValid}>
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span className="spinner" style={{ borderColor: 'rgba(0,0,0,0.25)', borderTopColor: 'transparent' }} />
                Signing in…
              </span>
            ) : 'Sign In'}
          </button>
        </div>
      </form>

      <div className="auth-divider animate-slide-up stagger-5">
        <span>or</span>
      </div>

      <p className="animate-slide-up stagger-6" style={{
        textAlign: 'center', fontSize: '0.825rem', color: 'var(--color-muted)',
      }}>
        Don't have an account?{' '}
        <Link to={ROUTES.REGISTER} style={{
          color: 'var(--color-accent)', fontWeight: 500,
          textDecoration: 'none', transition: 'opacity 0.15s',
        }}>
          Create one free →
        </Link>
      </p>
    </div>
  );
}