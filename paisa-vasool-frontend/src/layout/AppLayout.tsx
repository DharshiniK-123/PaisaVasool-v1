import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';

import { ROUTES } from '../config/constants';
import { logoutThunk, logout } from '../features/auth';
import axiosInstance from '../lib/axios';

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>
  </svg>
);
const IconUpload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const IconMatching = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
  </svg>
);
const IconInvoice = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);
const IconPayment = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IconBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconMenu = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const IconClose = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Dashboard', to: ROUTES.DASHBOARD, icon: <IconDashboard /> },
  { label: 'Upload',    to: ROUTES.UPLOAD,    icon: <IconUpload /> },
  { label: 'Matching',  to: ROUTES.MATCHING,  icon: <IconMatching /> },
  { label: 'Invoices',  to: ROUTES.INVOICES,  icon: <IconInvoice /> },
  { label: 'Payments',  to: ROUTES.PAYMENTS,  icon: <IconPayment /> },
  { label: 'Reminders', to: ROUTES.REMINDERS, icon: <IconBell /> },
];

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  [ROUTES.DASHBOARD]: { title: 'Dashboard',        subtitle: 'Overview of your payment operations' },
  [ROUTES.UPLOAD]:    { title: 'Upload Documents',  subtitle: 'Upload invoices and payment files' },
  [ROUTES.MATCHING]:  { title: 'Matching',          subtitle: 'Invoice to payment reconciliation' },
  [ROUTES.INVOICES]:  { title: 'Invoices',          subtitle: 'All invoice records' },
  [ROUTES.PAYMENTS]:  { title: 'Payments',          subtitle: 'All incoming payment records' },
  [ROUTES.REMINDERS]: { title: 'Reminders',         subtitle: 'Aging reminders and notification log' },
};

const SEVERITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'SCHEDULER'] as const;
type Severity = typeof SEVERITY_OPTIONS[number];

const SEVERITY_STYLE: Record<Severity, { bg: string; text: string; border: string }> = {
  LOW:       { bg: 'rgba(52,211,153,0.1)',   text: '#34d399', border: 'rgba(52,211,153,0.25)'  },
  MEDIUM:    { bg: 'rgba(251,191,36,0.1)',   text: '#fbbf24', border: 'rgba(251,191,36,0.25)'  },
  HIGH:      { bg: 'rgba(248,113,113,0.1)',  text: '#f87171', border: 'rgba(248,113,113,0.25)' },
  SCHEDULER: { bg: 'rgba(139,92,246,0.1)',   text: '#a78bfa', border: 'rgba(139,92,246,0.25)'  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type AgingRule = {
  id: number;
  due_days_from: number;
  due_days_to: number | null;
  severity: string;
  run_hour: number | null;
  run_minute: number | null;
  message_template: string;
};

type FormState = {
  due_days_from: string;
  due_days_to: string;
  severity: Severity;
  run_hour: string;
  run_minute: string;
  message_template: string;
};

// ─── Shared mini-components ───────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const s = SEVERITY_STYLE[severity as Severity] ?? SEVERITY_STYLE.LOW;
  return (
    <span style={{
      display: 'inline-block', padding: '0.15rem 0.6rem', borderRadius: 99,
      fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', background: s.bg, color: s.text,
      border: `1px solid ${s.border}`,
    }}>
      {severity}
    </span>
  );
}

function Spinner({ size = 18, color = 'var(--color-accent)' }: { size?: number; color?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${color}`, borderTopColor: 'transparent',
      animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  );
}

// ─── Settings Drawer ──────────────────────────────────────────────────────────

function SettingsDrawer({ onClose }: { onClose: () => void }) {
  const [rules, setRules]     = useState<AgingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm]       = useState<FormState>({
    due_days_from: '', due_days_to: '', severity: 'MEDIUM',
    run_hour: '', run_minute: '', message_template: '',
  });

  const BASE = '/api/v1/payment_intake_matching/aging-config';

  const fetchRules = async () => {
    setLoading(true);
    setError('');
    try {
      // FIX 2: use axiosInstance instead of raw fetch — ensures correct baseURL + auth token
      const res = await axiosInstance.get<AgingRule[]>(BASE + '/');
      setRules(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Failed to load aging config. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // FIX 1: useEffect (not useState) so fetchRules actually runs on mount
  useEffect(() => { fetchRules(); }, []);

  const flash = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 3000); }
    else { setError(msg); setSuccess(''); }
  };

  const handleAdd = async () => {
    if (!form.due_days_from) return flash('Days From is required', 'error');
    if (!form.message_template.trim()) return flash('Message template is required', 'error');
    if (form.severity === 'SCHEDULER' && !form.run_hour) return flash('Run hour is required for SCHEDULER', 'error');

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        due_days_from:    Number(form.due_days_from),
        severity:         form.severity,
        message_template: form.message_template.trim(),
      };
      if (form.due_days_to) body.due_days_to = Number(form.due_days_to);
      if (form.run_hour)    body.run_hour    = Number(form.run_hour);
      if (form.run_minute)  body.run_minute  = Number(form.run_minute);

      // FIX 2: use axiosInstance instead of raw fetch
      await axiosInstance.post(BASE + '/', body);

      flash('Aging rule added successfully', 'success');
      setForm({ due_days_from: '', due_days_to: '', severity: 'MEDIUM', run_hour: '', run_minute: '', message_template: '' });
      fetchRules();
    } catch {
      flash('Failed to add rule', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      // FIX 2: use axiosInstance instead of raw fetch
      await axiosInstance.delete(`${BASE}/${id}`);
      setRules(r => r.filter(x => x.id !== id));
      flash('Rule deleted', 'success');
    } catch {
      flash('Failed to delete rule', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)', borderRadius: 8,
    padding: '0.625rem 0.75rem', color: 'var(--color-text)',
    fontSize: '0.8rem', fontFamily: 'Outfit, sans-serif', outline: 'none',
    transition: 'border-color 0.2s',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.62rem', fontWeight: 500,
    textTransform: 'uppercase', letterSpacing: '0.12em',
    color: 'var(--color-muted)', marginBottom: '0.35rem',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(3px)', zIndex: 40,
          animation: 'fadeIn 0.2s ease both',
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '100%', maxWidth: 500,
        background: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-border)',
        zIndex: 50, display: 'flex', flexDirection: 'column',
        boxShadow: '-12px 0 48px rgba(0,0,0,0.55)',
        animation: 'slideInRight 0.32s var(--ease-out-expo) both',
      }}>

        {/* Drawer header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--color-surface-2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'var(--color-accent-soft)',
              border: '1px solid rgba(52,211,153,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-accent)',
            }}>
              <IconSettings />
            </div>
            <div>
              <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-muted)', marginBottom: '0.15rem' }}>
                Configuration
              </p>
              <h2 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
                Aging Rules
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid var(--color-border)',
              borderRadius: 8, padding: '0.45rem', cursor: 'pointer',
              color: 'var(--color-muted)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border-hover)'; el.style.color = 'var(--color-text)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border)'; el.style.color = 'var(--color-muted)'; }}
          >
            <IconClose />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Banners */}
          {error && (
            <div className="banner banner-error animate-fade-in">
              <span className="banner-icon">⚠</span><p>{error}</p>
            </div>
          )}
          {success && (
            <div className="banner banner-success animate-fade-in">
              <span className="banner-icon">✓</span><p>{success}</p>
            </div>
          )}

          {/* ── Active Rules ── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)' }}>
                Active Rules
              </p>
              {!loading && (
                <span style={{
                  padding: '0.15rem 0.55rem', borderRadius: 99, fontSize: '0.65rem',
                  background: 'var(--color-accent-soft)', color: 'var(--color-accent)',
                  border: '1px solid rgba(52,211,153,0.2)', fontWeight: 600,
                }}>
                  {rules.length}
                </span>
              )}
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem 0' }}>
                <Spinner />
              </div>
            ) : rules.length === 0 ? (
              <div style={{
                padding: '1.75rem', border: '1px dashed var(--color-border)',
                borderRadius: 12, textAlign: 'center',
              }}>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>No aging rules yet</p>
                <p style={{ color: 'var(--color-faint)', fontSize: '0.72rem', marginTop: '0.3rem' }}>Add your first rule below</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {rules.map(rule => (
                  <div
                    key={rule.id}
                    style={{
                      background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 10, padding: '0.875rem 1rem',
                      display: 'flex', alignItems: 'flex-start',
                      justifyContent: 'space-between', gap: '0.75rem',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-hover)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                        <SeverityBadge severity={rule.severity} />
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text)', fontWeight: 500 }}>
                          {rule.due_days_from}–{rule.due_days_to ?? '∞'} days overdue
                        </span>
                      </div>
                      {rule.message_template && (
                        <p style={{
                          fontSize: '0.73rem', color: 'var(--color-muted)',
                          lineHeight: 1.55, wordBreak: 'break-word',
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {rule.message_template}
                        </p>
                      )}
                      {rule.severity === 'SCHEDULER' && rule.run_hour != null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.4rem' }}>
                          <span style={{ fontSize: '0.65rem', color: '#a78bfa' }}>
                            ⏰ Runs daily at {String(rule.run_hour).padStart(2, '0')}:{String(rule.run_minute ?? 0).padStart(2, '0')}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      disabled={deleting === rule.id}
                      style={{
                        background: 'none', border: '1px solid transparent',
                        borderRadius: 7, padding: '0.4rem', cursor: 'pointer',
                        color: 'var(--color-muted)', display: 'flex',
                        alignItems: 'center', flexShrink: 0, transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(248,113,113,0.3)'; el.style.color = '#f87171'; el.style.background = 'rgba(248,113,113,0.07)'; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'transparent'; el.style.color = 'var(--color-muted)'; el.style.background = 'none'; }}
                    >
                      {deleting === rule.id ? <Spinner size={13} color="#f87171" /> : <IconTrash />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Divider ── */}
          <div style={{ height: 1, background: 'linear-gradient(to right, transparent, var(--color-border), transparent)' }} />

          {/* ── Add New Rule ── */}
          <section>
            <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: '1rem' }}>
              Add New Rule
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

              {/* Days range */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Days From *</label>
                  <input
                    type="number" min="0" placeholder="e.g. 30"
                    style={inputStyle} value={form.due_days_from}
                    onChange={e => setForm(f => ({ ...f, due_days_from: e.target.value }))}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--color-border-focus)'}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--color-border)'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Days To <span style={{ opacity: 0.5 }}>(optional)</span></label>
                  <input
                    type="number" min="0" placeholder="e.g. 60"
                    style={inputStyle} value={form.due_days_to}
                    onChange={e => setForm(f => ({ ...f, due_days_to: e.target.value }))}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--color-border-focus)'}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--color-border)'}
                  />
                </div>
              </div>

              {/* Severity */}
              <div>
                <label style={labelStyle}>Severity *</label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {SEVERITY_OPTIONS.map(s => {
                    const active = form.severity === s;
                    const ss = SEVERITY_STYLE[s];
                    return (
                      <button
                        key={s}
                        onClick={() => setForm(f => ({ ...f, severity: s }))}
                        style={{
                          padding: '0.35rem 0.85rem', borderRadius: 99,
                          fontSize: '0.67rem', fontWeight: 600,
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                          cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                          border: active ? `1px solid ${ss.border}` : '1px solid var(--color-border)',
                          background: active ? ss.bg : 'transparent',
                          color: active ? ss.text : 'var(--color-muted)',
                          transition: 'all 0.15s',
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scheduler fields (conditional) */}
              {form.severity === 'SCHEDULER' && (
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem',
                  padding: '0.875rem', background: 'rgba(139,92,246,0.05)',
                  border: '1px solid rgba(139,92,246,0.15)', borderRadius: 10,
                  animation: 'fadeSlideUp 0.2s var(--ease-out-expo) both',
                }}>
                  <div>
                    <label style={{ ...labelStyle, color: '#a78bfa' }}>Run Hour (0–23) *</label>
                    <input
                      type="number" min="0" max="23" placeholder="e.g. 9"
                      style={{ ...inputStyle, borderColor: 'rgba(139,92,246,0.2)' }}
                      value={form.run_hour}
                      onChange={e => setForm(f => ({ ...f, run_hour: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, color: '#a78bfa' }}>Run Minute (0–59)</label>
                    <input
                      type="number" min="0" max="59" placeholder="e.g. 0"
                      style={{ ...inputStyle, borderColor: 'rgba(139,92,246,0.2)' }}
                      value={form.run_minute}
                      onChange={e => setForm(f => ({ ...f, run_minute: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Message template */}
              <div>
                <label style={labelStyle}>Message Template *</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Invoice #{invoice_id} is {days} days overdue. Please settle ₹{amount} immediately."
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                  value={form.message_template}
                  onChange={e => setForm(f => ({ ...f, message_template: e.target.value }))}
                  onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--color-border-focus)'}
                  onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--color-border)'}
                />
                <p style={{ fontSize: '0.65rem', color: 'var(--color-faint)', marginTop: '0.35rem' }}>
                  Use <code style={{ color: 'var(--color-accent)', fontSize: '0.65rem' }}>{'{invoice_id}'}</code>, <code style={{ color: 'var(--color-accent)', fontSize: '0.65rem' }}>{'{days}'}</code>, <code style={{ color: 'var(--color-accent)', fontSize: '0.65rem' }}>{'{amount}'}</code> as placeholders
                </p>
              </div>

              {/* Submit */}
              <button
                onClick={handleAdd}
                disabled={saving}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {saving ? <Spinner size={15} color="#000" /> : <IconPlus />}
                {saving ? 'Adding Rule...' : 'Add Aging Rule'}
              </button>
            </div>
          </section>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(s => s.auth.user);

  const handleLogout = async () => {
    // Immediately clear auth state so refresh can't restore the session
    dispatch(logout());
    navigate(ROUTES.LOGIN);
    // Fire-and-forget: tell backend to clear the cookie
    dispatch(logoutThunk());
  };

  return (
    <>
      <aside style={{
        width: collapsed ? 60 : 220,
        minHeight: '100vh',
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.3s var(--ease-out-expo)',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 30, overflow: 'hidden', flexShrink: 0,
      }}>

        {/* ── Logo row ── */}
        <div style={{
          padding: collapsed ? '0 0' : '0 1.125rem',
          height: 60, borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: '0.5rem', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
            <div style={{
              width: 32, height: 32, flexShrink: 0, borderRadius: 9,
              background: 'var(--color-surface-2)',
              border: '1px solid rgba(52,211,153,0.28)',
              boxShadow: '0 0 14px rgba(52,211,153,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="font-display" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1 }}>₹</span>
            </div>
            {!collapsed && (
              <span className="font-display" style={{
                fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)',
                letterSpacing: '-0.01em', whiteSpace: 'nowrap',
                animation: 'fadeIn 0.2s ease both',
              }}>
                PaisaVasool
              </span>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={onToggle}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-muted)', padding: '0.3rem',
                display: 'flex', borderRadius: 6, flexShrink: 0,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--color-text)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--color-muted)'}
              title="Collapse sidebar"
            >
              <IconMenu />
            </button>
          )}
        </div>

        {/* ── Expand button (when collapsed) ── */}
        {collapsed && (
          <button
            onClick={onToggle}
            style={{
              margin: '0.625rem auto 0', background: 'none',
              border: '1px solid var(--color-border)', borderRadius: 8,
              padding: '0.4rem', cursor: 'pointer', color: 'var(--color-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--color-text)'; el.style.borderColor = 'var(--color-border-hover)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--color-muted)'; el.style.borderColor = 'var(--color-border)'; }}
            title="Expand sidebar"
          >
            <IconChevronRight />
          </button>
        )}

        {/* ── Nav links ── */}
        <nav style={{
          flex: 1, padding: '0.75rem 0.5rem',
          display: 'flex', flexDirection: 'column', gap: '0.1rem',
          overflowY: 'auto', overflowX: 'hidden',
        }}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: collapsed ? '0.65rem' : '0.6rem 0.875rem',
                borderRadius: 9, textDecoration: 'none', cursor: 'pointer',
                justifyContent: collapsed ? 'center' : 'flex-start',
                fontSize: '0.82rem', fontWeight: isActive ? 600 : 400,
                fontFamily: 'Outfit, sans-serif',
                color: isActive ? 'var(--color-accent)' : 'var(--color-muted)',
                background: isActive ? 'var(--color-accent-soft)' : 'transparent',
                border: isActive ? '1px solid rgba(52,211,153,0.15)' : '1px solid transparent',
                transition: 'all 0.18s var(--ease-in-out)',
                whiteSpace: 'nowrap', overflow: 'hidden',
              })}
            >
              <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
              {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* ── Bottom section ── */}
        <div style={{
          padding: '0.625rem 0.5rem',
          borderTop: '1px solid var(--color-border)',
          display: 'flex', flexDirection: 'column', gap: '0.1rem',
        }}>

          {/* User info (expanded only) */}
          {!collapsed && user && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.6rem 0.875rem', borderRadius: 9,
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              marginBottom: '0.25rem',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(52,211,153,0.12)',
                border: '1px solid rgba(52,211,153,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                  {((user as any).email?.[0] ?? 'U').toUpperCase()}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '0.72rem', fontWeight: 500,
                  color: 'var(--color-text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {(user as any).email}
                </p>
                <p style={{ fontSize: '0.62rem', color: 'var(--color-muted)' }}>Operator</p>
              </div>
            </div>
          )}

          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
            title={collapsed ? 'Settings' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: collapsed ? '0.65rem' : '0.6rem 0.875rem',
              borderRadius: 9, cursor: 'pointer',
              border: '1px solid transparent', background: 'transparent',
              color: 'var(--color-muted)', fontSize: '0.82rem',
              fontWeight: 400, fontFamily: 'Outfit, sans-serif',
              transition: 'all 0.18s', justifyContent: collapsed ? 'center' : 'flex-start',
              whiteSpace: 'nowrap', overflow: 'hidden', width: '100%',
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.03)'; el.style.color = 'var(--color-text)'; el.style.borderColor = 'var(--color-border)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--color-muted)'; el.style.borderColor = 'transparent'; }}
          >
            <span style={{ flexShrink: 0, display: 'flex' }}><IconSettings /></span>
            {!collapsed && <span>Settings</span>}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: collapsed ? '0.65rem' : '0.6rem 0.875rem',
              borderRadius: 9, cursor: 'pointer',
              border: '1px solid transparent', background: 'transparent',
              color: 'var(--color-muted)', fontSize: '0.82rem',
              fontWeight: 400, fontFamily: 'Outfit, sans-serif',
              transition: 'all 0.18s', justifyContent: collapsed ? 'center' : 'flex-start',
              whiteSpace: 'nowrap', width: '100%',
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#f87171'; el.style.borderColor = 'rgba(248,113,113,0.15)'; el.style.background = 'rgba(248,113,113,0.05)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--color-muted)'; el.style.borderColor = 'transparent'; el.style.background = 'transparent'; }}
          >
            <span style={{ flexShrink: 0, display: 'flex' }}><IconLogout /></span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {settingsOpen && <SettingsDrawer onClose={() => setSettingsOpen(false)} />}
    </>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────

function TopBar() {
  const location = useLocation();
  const page = PAGE_TITLES[location.pathname] ?? { title: 'Paisa Vasool', subtitle: '' };
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <header className="dashboard-header">
      <div>
        <h1 className="font-display" style={{
          fontSize: '1.1rem', fontWeight: 700,
          color: 'var(--color-text)', letterSpacing: '-0.01em', lineHeight: 1.2,
        }}>
          {page.title}
        </h1>
        <p style={{ fontSize: '0.68rem', color: 'var(--color-muted)', marginTop: '0.1rem' }}>
          {page.subtitle || dateStr}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)', display: 'none' }} className="sm:block">
          {dateStr}
        </span>
        <div className="session-badge">
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--color-accent)', display: 'inline-block',
            boxShadow: '0 0 6px var(--color-accent)',
            animation: 'pulseSlow 2s ease-in-out infinite',
          }} />
          Live
        </div>
      </div>
    </header>
  );
}

// ─── App Layout (default export) ─────────────────────────────────────────────

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const SIDEBAR_W = collapsed ? 60 : 220;

  return (
    <div
      className="noise-overlay"
      style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex' }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: 350, height: 350,
        pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 0% 0%, rgba(52,211,153,0.04), transparent 70%)',
      }} />

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      {/* Page content */}
      <div style={{
        marginLeft: SIDEBAR_W,
        flex: 1, minWidth: 0,
        display: 'flex', flexDirection: 'column',
        minHeight: '100vh',
        transition: 'margin-left 0.3s var(--ease-out-expo)',
        position: 'relative', zIndex: 1,
      }}>
        <TopBar />
        <main style={{ flex: 1, padding: '1.75rem 2rem', overflowX: 'hidden' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}