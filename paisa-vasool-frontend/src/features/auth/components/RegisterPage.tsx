import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../../../config/constants';

interface FormState { first_name: string; last_name: string; email: string; phone_no: string; password: string; }
type TouchedState = Record<keyof FormState, boolean>;

const PHONE_RE = /^[6-9]\d{9}$/;
const PASS_RE  = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>/?~]).{6,}$/;

function getStrength(p: string): { label: string; color: string; width: string } {
  if (!p) return { label: '', color: '', width: '0%' };
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  if (s <= 2) return { label: 'Weak',   color: '#f87171', width: '30%' };
  if (s <= 3) return { label: 'Fair',   color: '#fbbf24', width: '62%' };
  return           { label: 'Strong', color: 'var(--color-accent)', width: '100%' };
}

export default function RegisterPage() {
  const { register, isLoading, error, clearError } = useAuth();
  const [form, setForm]         = useState<FormState>({ first_name: '', last_name: '', email: '', phone_no: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [touched, setTouched]   = useState<TouchedState>({ first_name: false, last_name: false, email: false, phone_no: false, password: false });
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { clearError(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleBlur = (field: keyof TouchedState) =>
    setTouched(t => ({ ...t, [field]: true }));

  const errors = {
    first_name: !form.first_name.trim()            && touched.first_name ? 'First Name is required' : '',
    last_name:  !form.last_name.trim()             && touched.last_name  ? 'Last Name is required'  : '',
    email:      !form.email.includes('@')          && touched.email      ? 'Enter a valid email'    : '',
    phone_no:      !PHONE_RE.test(form.phone_no)         && touched.phone_no      ? 'Enter a valid 10-digit Indian mobile number' : '',
    password:   !PASS_RE.test(form.password)       && touched.password   ? 'Min 6 chars with uppercase, lowercase, number & special char' : '',
  };

  const isValid =
    form.first_name.trim().length > 0 &&
    form.last_name.trim().length  > 0 &&
    form.email.includes('@') &&
    PHONE_RE.test(form.phone_no) &&
    PASS_RE.test(form.password);

  const fieldState = (field: keyof typeof errors) => {
    if (errors[field]) return 'field-error';
    if (form[field] && touched[field]) return 'field-valid';
    return '';
  };

  const strength = getStrength(form.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    
    console.log('Submitting form data:', form);
    console.log('Form validation:', { isValid, errors });
    
    const success = await register({ first_name: form.first_name, last_name: form.last_name, email: form.email, phone_no: form.phone_no, password: form.password });
    if (success) setSuccessMsg('Account created! Redirecting to login…');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.625rem' }}>

      <div className="animate-slide-up stagger-1">
        <p style={{
          fontSize: '0.68rem', fontWeight: 500, textTransform: 'uppercase',
          letterSpacing: '0.2em', color: 'var(--color-accent)', marginBottom: '0.75rem',
        }}>
          Get started free
        </p>
        <h2 className="font-display" style={{
          fontSize: 'clamp(1.875rem, 4vw, 2.375rem)', fontWeight: 700,
          lineHeight: 1.15, letterSpacing: '-0.02em', color: 'var(--color-text)',
        }}>
          Create your<br />account
        </h2>
      </div>

      {error && (
        <div className="banner banner-error animate-slide-up">
          <span className="banner-icon">⚠</span>
          <p>{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="banner banner-success animate-slide-up">
          <span className="banner-icon">✓</span>
          <p>{successMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

        <div className="animate-slide-up stagger-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor="reg-first-name" className="field-label">First Name</label>
          <div className={`field-wrap ${fieldState('first_name')}`}>
            <input
              id="reg-first-name"
              className="field-input"
              type="text"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              onBlur={() => handleBlur('first_name')}
              placeholder="Rahul"
              autoComplete="given-name"
            />
            {form.first_name && touched.first_name && !errors.first_name && (
              <span className="field-check">✓</span>
            )}
          </div>
          {errors.first_name && <span className="field-error-msg"><span>⚠</span> {errors.first_name}</span>}
        </div>

        <div className="animate-slide-up stagger-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor="reg-last-name" className="field-label">Last Name</label>
          <div className={`field-wrap ${fieldState('last_name')}`}>
            <input
              id="reg-last-name"
              className="field-input"
              type="text"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              onBlur={() => handleBlur('last_name')}
              placeholder="Sharma"
              autoComplete="family-name"
            />
            {form.last_name && touched.last_name && !errors.last_name && (
              <span className="field-check">✓</span>
            )}
          </div>
          {errors.last_name && <span className="field-error-msg"><span>⚠</span> {errors.last_name}</span>}
        </div>

        <div className="animate-slide-up stagger-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor="reg-email" className="field-label">Email</label>
          <div className={`field-wrap ${fieldState('email')}`}>
            <input
              id="reg-email"
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
          {errors.email && <span className="field-error-msg"><span>⚠</span> {errors.email}</span>}
        </div>

        <div className="animate-slide-up stagger-3" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor="reg-phone" className="field-label">Mobile Number</label>
          <div className={`field-wrap ${fieldState('phone_no')}`}>
            <span className="phone-prefix">+91</span>
            <input
              id="reg-phone"
              className="field-input"
              type="tel"
              name="phone_no"
              value={form.phone_no}
              onChange={handleChange}
              onBlur={() => handleBlur('phone_no')}
              placeholder="9876543210"
              maxLength={10}
              autoComplete="tel"
              inputMode="numeric"
              style={{ paddingLeft: '0.75rem' }}
            />
          </div>
          {errors.phone_no && <span className="field-error-msg"><span>⚠</span> {errors.phone_no}</span>}
        </div>

        <div className="animate-slide-up stagger-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor="reg-password" className="field-label">Password</label>
          <div className={`field-wrap ${fieldState('password')}`}>
            <input
              id="reg-password"
              className="field-input"
              type={showPass ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              onBlur={() => handleBlur('password')}
              placeholder="Min 6 chars, uppercase, lowercase, number & special char"
              autoComplete="new-password"
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

          {form.password && (
            <div style={{ paddingTop: '0.125rem' }}>
              <div className="strength-track">
                <div className="strength-fill" style={{ width: strength.width, background: strength.color }} />
              </div>
              <p className="strength-text" style={{ marginTop: '0.3rem' }}>
                Strength:{' '}
                <strong style={{ color: strength.color, fontWeight: 600 }}>{strength.label}</strong>
              </p>
            </div>
          )}
          {errors.password && <span className="field-error-msg"><span>⚠</span> {errors.password}</span>}
        </div>

        <div className="animate-slide-up stagger-5" style={{ paddingTop: '0.5rem' }}>
          <button type="submit" className="btn-primary" disabled={isLoading || !isValid}>
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span className="spinner" style={{ borderColor: 'rgba(0,0,0,0.25)', borderTopColor: 'transparent' }} />
                Creating account…
              </span>
            ) : 'Create Account'}
          </button>
        </div>
      </form>

      <div className="auth-divider animate-slide-up stagger-5">
        <span>or</span>
      </div>

      <p className="animate-slide-up stagger-6" style={{
        textAlign: 'center', fontSize: '0.825rem', color: 'var(--color-muted)',
      }}>
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} style={{
          color: 'var(--color-accent)', fontWeight: 500,
          textDecoration: 'none', transition: 'opacity 0.15s',
        }}>
          Sign in →
        </Link>
      </p>
    </div>
  );
}