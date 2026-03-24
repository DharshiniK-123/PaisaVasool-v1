import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/adminService';
import type { FinanceUser, CreateUserPayload } from '../types';


const IconUsers = () => (
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconClose = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconPower = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
    <line x1="12" y1="2" x2="12" y2="12"/>
  </svg>
);

function Spinner({ size = 18, color = 'var(--color-accent)' }: { size?: number; color?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${color}`, borderTopColor: 'transparent',
      animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  );
}

function ConfirmDialog({
  user,
  onConfirm,
  onCancel,
  loading,
}: {
  user: FinanceUser;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const isActive = user.is_active === 'active';
  const action = isActive ? 'Deactivate' : 'Activate';
  const accentColor = isActive ? '#ef4444' : '#16a34a';
  const bgColor = isActive ? 'rgba(239,68,68,0.06)' : 'rgba(22,163,74,0.06)';
  const borderColor = isActive ? 'rgba(239,68,68,0.2)' : 'rgba(22,163,74,0.2)';

  return (
    <>
      <div
        onClick={onCancel}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)',
          backdropFilter: 'blur(4px)', zIndex: 60,
          animation: 'fadeIn 0.15s ease both',
        }}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%', maxWidth: 420,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 16, zIndex: 70, padding: '1.75rem',
        boxShadow: '0 24px 64px rgba(15,40,90,0.18)',
        animation: 'popIn 0.2s var(--ease-out-expo, cubic-bezier(0.16,1,0.3,1)) both',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, marginBottom: '1.25rem',
          background: bgColor, border: `1px solid ${borderColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accentColor,
        }}>
          <IconPower />
        </div>

        <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
          {action} User?
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          {isActive
            ? <>Are you sure you want to deactivate <strong style={{ color: 'var(--color-text)' }}>{user.first_name} {user.last_name}</strong>? They will no longer be able to log in.</>
            : <>Are you sure you want to re-activate <strong style={{ color: 'var(--color-text)' }}>{user.first_name} {user.last_name}</strong>? They will regain access to the platform.</>
          }
        </p>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1, padding: '0.7rem', borderRadius: 9,
              border: '1px solid var(--color-border)', background: 'transparent',
              color: 'var(--color-muted)', fontSize: '0.875rem', fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: '0.7rem', borderRadius: 9,
              border: `1px solid ${borderColor}`,
              background: bgColor,
              color: accentColor, fontSize: '0.875rem', fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif", cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '0.5rem',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? <Spinner size={14} color={accentColor} /> : <IconPower />}
            {loading ? 'Updating...' : action}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.95); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  );
}

type FormErrors = Partial<Record<keyof CreateUserPayload, string>>;
const emptyForm: CreateUserPayload = { first_name: '', last_name: '', email: '', phone_no: '', password: '' };

function validateForm(form: CreateUserPayload): FormErrors {
  const errs: FormErrors = {};
  if (!form.first_name.trim()) errs.first_name = 'First name is required';
  if (!form.last_name.trim()) errs.last_name = 'Last name is required';
  if (!form.email.trim()) errs.email = 'Email is required';
  else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';
  if (!form.phone_no.trim()) errs.phone_no = 'Phone is required';
  else if (!/^[6-9]\d{9}$/.test(form.phone_no)) errs.phone_no = 'Must be a valid 10-digit Indian mobile number';
  if (!form.password) errs.password = 'Password is required';
  else if (form.password.length < 6) errs.password = 'At least 6 characters';
  else if (!/[a-z]/.test(form.password)) errs.password = 'Must contain a lowercase letter';
  else if (!/[A-Z]/.test(form.password)) errs.password = 'Must contain an uppercase letter';
  else if (!/[0-9]/.test(form.password)) errs.password = 'Must contain a number';
  else if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>/?~]/.test(form.password)) errs.password = 'Must contain a special character';
  return errs;
}

function CreateUserDrawer({ onClose, onCreated }: { onClose: () => void; onCreated: (user: FinanceUser) => void }) {
  const [form, setForm] = useState<CreateUserPayload>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field: keyof CreateUserPayload, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async () => {
    const errs = validateForm(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true); setApiError('');
    try {
      const created = await adminService.createUser(form);
      onCreated(created);
      onClose();
    } catch (err: any) {
      setApiError(err?.response?.data?.detail ?? 'Failed to create user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inp = (hasError: boolean): React.CSSProperties => ({
    width: '100%', background: 'var(--color-surface)',
    border: `1px solid ${hasError ? '#ef4444' : 'var(--color-border)'}`,
    borderRadius: 8, padding: '0.625rem 0.75rem',
    color: 'var(--color-text)', fontSize: '0.9rem',
    fontFamily: "'DM Sans', sans-serif", outline: 'none',
    transition: 'border-color 0.2s', boxSizing: 'border-box' as const,
  });
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: '0.7rem', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.12em',
    color: 'var(--color-muted)', marginBottom: '0.35rem',
  };
  const err: React.CSSProperties = { fontSize: '0.72rem', color: '#ef4444', marginTop: '0.25rem' };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(3px)', zIndex: 40, animation: 'fadeIn 0.2s ease both' }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '100%', maxWidth: 460, background: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-border)', zIndex: 50,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-12px 0 48px rgba(15,40,90,0.12)',
        animation: 'slideInRight 0.32s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--color-accent-soft)', border: '1px solid rgba(37,99,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
              <IconUsers />
            </div>
            <div>
              <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-muted)', marginBottom: '0.15rem' }}>Admin</p>
              <h2 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)' }}>Create User</h2>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.45rem', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconClose />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {apiError && (
            <div className="banner banner-error animate-fade-in">
              <span className="banner-icon">⚠</span><p>{apiError}</p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={lbl}>First Name *</label>
              <input type="text" placeholder="e.g. Priya" style={inp(!!errors.first_name)} value={form.first_name} onChange={e => handleChange('first_name', e.target.value)} />
              {errors.first_name && <p style={err}>{errors.first_name}</p>}
            </div>
            <div>
              <label style={lbl}>Last Name *</label>
              <input type="text" placeholder="e.g. Sharma" style={inp(!!errors.last_name)} value={form.last_name} onChange={e => handleChange('last_name', e.target.value)} />
              {errors.last_name && <p style={err}>{errors.last_name}</p>}
            </div>
          </div>
          <div>
            <label style={lbl}>Email *</label>
            <input type="email" placeholder="e.g. priya@company.com" style={inp(!!errors.email)} value={form.email} onChange={e => handleChange('email', e.target.value)} />
            {errors.email && <p style={err}>{errors.email}</p>}
          </div>
          <div>
            <label style={lbl}>Phone Number *</label>
            <input type="tel" placeholder="10-digit Indian mobile" style={inp(!!errors.phone_no)} value={form.phone_no} onChange={e => handleChange('phone_no', e.target.value)} />
            {errors.phone_no && <p style={err}>{errors.phone_no}</p>}
          </div>
          <div>
            <label style={lbl}>Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 chars, upper, lower, number, symbol"
                style={{ ...inp(!!errors.password), paddingRight: '3rem' }}
                value={form.password}
                onChange={e => handleChange('password', e.target.value)}
              />
              <button type="button" onClick={() => setShowPassword(s => !s)} style={{ position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.68rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <p style={err}>{errors.password}</p>}
          </div>
          <div style={{ padding: '0.75rem', borderRadius: 8, background: 'var(--color-accent-soft)', border: '1px solid rgba(37,99,235,0.12)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-accent)', lineHeight: 1.55 }}>
              This user will be created as a <strong>Finance Associate</strong> with full dashboard access.
            </p>
          </div>
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-2)', display: 'flex', gap: '0.75rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.65rem', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: '0.875rem', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {saving ? <Spinner size={15} color="#fff" /> : <IconPlus />}
            {saving ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

function UserRow({
  user,
  onToggle,
  toggling,
}: {
  user: FinanceUser;
  onToggle: (user: FinanceUser) => void;
  toggling: boolean;
}) {
  const initials = `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase();
  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
  const isActive = user.is_active === 'active';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2.5fr 1.8fr 1.2fr 1.2fr auto',
        gap: '1rem',
        padding: '0.9rem 1.25rem',
        alignItems: 'center',
        borderBottom: '1px solid var(--color-border)',
        transition: 'background 0.15s',
        opacity: isActive ? 1 : 0.65,
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: isActive ? 'var(--color-accent-soft)' : 'rgba(100,116,139,0.1)',
          border: `1px solid ${isActive ? 'rgba(37,99,235,0.18)' : 'rgba(100,116,139,0.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: isActive ? 'var(--color-accent)' : 'var(--color-muted)' }}>{initials}</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.first_name} {user.last_name}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.email}
          </p>
        </div>
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)', fontWeight: 500 }}>{user.phone_no}</p>

      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
        padding: '0.2rem 0.65rem', borderRadius: 99,
        fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
        textTransform: 'uppercase',
        background: isActive ? 'rgba(22,163,74,0.08)' : 'rgba(239,68,68,0.08)',
        color: isActive ? '#15803d' : '#b91c1c',
        border: `1px solid ${isActive ? 'rgba(22,163,74,0.2)' : 'rgba(239,68,68,0.2)'}`,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? '#16a34a' : '#ef4444', flexShrink: 0 }} />
        {isActive ? 'Active' : 'Inactive'}
      </span>

      <p style={{ fontSize: '0.75rem', color: 'var(--color-faint)', textAlign: 'right' }}>{joinedDate}</p>

      <button
        onClick={() => onToggle(user)}
        disabled={toggling}
        title={isActive ? 'Deactivate user' : 'Activate user'}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.45rem 0.75rem', borderRadius: 8, cursor: toggling ? 'not-allowed' : 'pointer',
          fontSize: '0.72rem', fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
          border: `1px solid ${isActive ? 'rgba(239,68,68,0.2)' : 'rgba(22,163,74,0.2)'}`,
          background: isActive ? 'rgba(239,68,68,0.06)' : 'rgba(22,163,74,0.06)',
          color: isActive ? '#b91c1c' : '#15803d',
          opacity: toggling ? 0.6 : 1,
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          if (!toggling) {
            const el = e.currentTarget as HTMLElement;
            el.style.background = isActive ? 'rgba(239,68,68,0.12)' : 'rgba(22,163,74,0.12)';
          }
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = isActive ? 'rgba(239,68,68,0.06)' : 'rgba(22,163,74,0.06)';
        }}
      >
        {toggling ? <Spinner size={12} color={isActive ? '#b91c1c' : '#15803d'} /> : <IconPower />}
        {isActive ? 'Deactivate' : 'Activate'}
      </button>
    </div>
  );
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<FinanceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmUser, setConfirmUser] = useState<FinanceUser | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await adminService.listUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreated = (user: FinanceUser) => {
    setUsers(u => [user, ...u]);
    setSuccessMsg(`User ${user.first_name} ${user.last_name} created successfully.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleToggleConfirm = async () => {
    if (!confirmUser) return;
    setToggling(confirmUser.id);
    try {
      const updated = await adminService.toggleUserStatus(confirmUser.id);
      setUsers(u => u.map(x => x.id === updated.id ? updated : x));
      const action = updated.is_active === 'active' ? 'activated' : 'deactivated';
      setSuccessMsg(`${updated.first_name} ${updated.last_name} has been ${action}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Failed to update user status.');
    } finally {
      setToggling(null);
      setConfirmUser(null);
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch =
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone_no.includes(q);
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.is_active === 'active') ||
      (statusFilter === 'inactive' && u.is_active !== 'active');
    return matchSearch && matchStatus;
  });

  const activeCount   = users.filter(u => u.is_active === 'active').length;
  const inactiveCount = users.filter(u => u.is_active !== 'active').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Users',  value: loading ? '—' : users.length,   accent: false },
          { label: 'Active',       value: loading ? '—' : activeCount,     accent: true  },
          { label: 'Inactive',     value: loading ? '—' : inactiveCount,   accent: false, warn: inactiveCount > 0 },
        ].map(stat => (
          <div key={stat.label} style={{
            padding: '1rem 1.25rem', borderRadius: 12, minWidth: 130,
            background: stat.accent ? 'var(--color-accent-soft)' : stat.warn && inactiveCount > 0 ? 'rgba(239,68,68,0.05)' : 'var(--color-surface)',
            border: `1px solid ${stat.accent ? 'rgba(37,99,235,0.15)' : stat.warn && inactiveCount > 0 ? 'rgba(239,68,68,0.15)' : 'var(--color-border)'}`,
          }}>
            <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.3rem', color: stat.accent ? 'var(--color-accent)' : stat.warn && inactiveCount > 0 ? '#b91c1c' : 'var(--color-muted)' }}>
              {stat.label}
            </p>
            <p className="font-display" style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1, color: stat.accent ? 'var(--color-accent)' : stat.warn && inactiveCount > 0 ? '#b91c1c' : 'var(--color-text)' }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
      {error && <div className="banner banner-error animate-fade-in"><span className="banner-icon">⚠</span><p>{error}</p></div>}
      {successMsg && <div className="banner banner-success animate-fade-in"><span className="banner-icon">✓</span><p>{successMsg}</p></div>}

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>

        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', background: 'var(--color-surface-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, flexWrap: 'wrap' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.45rem 0.75rem', minWidth: 220 }}>
              <span style={{ color: 'var(--color-muted)', display: 'flex' }}><IconSearch /></span>
              <input
                type="text" placeholder="Search by name, email, phone…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--color-text)', fontSize: '0.82rem', fontFamily: "'DM Sans', sans-serif", flex: 1, minWidth: 0 }}
              />
              {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex' }}><IconClose /></button>}
            </div>

            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {(['all', 'active', 'inactive'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  style={{
                    padding: '0.35rem 0.8rem', borderRadius: 99, fontSize: '0.72rem',
                    fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                    textTransform: 'capitalize', transition: 'all 0.15s',
                    border: statusFilter === f
                      ? f === 'active' ? '1px solid rgba(22,163,74,0.3)' : f === 'inactive' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(37,99,235,0.3)'
                      : '1px solid var(--color-border)',
                    background: statusFilter === f
                      ? f === 'active' ? 'rgba(22,163,74,0.08)' : f === 'inactive' ? 'rgba(239,68,68,0.08)' : 'var(--color-accent-soft)'
                      : 'transparent',
                    color: statusFilter === f
                      ? f === 'active' ? '#15803d' : f === 'inactive' ? '#b91c1c' : 'var(--color-accent)'
                      : 'var(--color-muted)',
                  }}
                >
                  {f === 'all' ? `All (${users.length})` : f === 'active' ? `Active (${activeCount})` : `Inactive (${inactiveCount})`}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => setDrawerOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
            <IconPlus /> Add User
          </button>
        </div>

        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.8fr 1.2fr 1.2fr auto', gap: '1rem', padding: '0.6rem 1.25rem', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
          {['User', 'Phone', 'Status', 'Joined', ''].map((h, i) => (
            <p key={i} style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', textAlign: i === 3 ? 'right' : 'left' }}>{h}</p>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>
              <IconUsers />
            </div>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
              {search || statusFilter !== 'all' ? 'No users match your filters' : 'No finance associates yet'}
            </p>
            {!search && statusFilter === 'all' && (
              <p style={{ color: 'var(--color-faint)', fontSize: '0.78rem' }}>Click "Add User" to create the first one</p>
            )}
          </div>
        ) : (
          filtered.map(user => (
            <UserRow
              key={user.id}
              user={user}
              onToggle={u => setConfirmUser(u)}
              toggling={toggling === user.id}
            />
          ))
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-faint)' }}>
              Showing {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {drawerOpen && <CreateUserDrawer onClose={() => setDrawerOpen(false)} onCreated={handleCreated} />}
      {confirmUser && (
        <ConfirmDialog
          user={confirmUser}
          onConfirm={handleToggleConfirm}
          onCancel={() => setConfirmUser(null)}
          loading={toggling === confirmUser.id}
        />
      )}
    </div>
  );
}