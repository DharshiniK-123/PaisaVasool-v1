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

function Spinner({ size = 18, color = 'var(--color-accent)' }: { size?: number; color?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${color}`, borderTopColor: 'transparent',
      animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  );
}

type FormErrors = Partial<Record<keyof CreateUserPayload, string>>;

const emptyForm: CreateUserPayload = {
  first_name: '', last_name: '', email: '', phone_no: '', password: '',
};

function validateForm(form: CreateUserPayload): FormErrors {
  const errs: FormErrors = {};
  if (!form.first_name.trim()) errs.first_name = 'First name is required';
  if (!form.last_name.trim()) errs.last_name = 'Last name is required';
  if (!form.email.trim()) errs.email = 'Email is required';
  else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';
  if (!form.phone_no.trim()) errs.phone_no = 'Phone is required';
  else if (!/^[6-9]\d{9}$/.test(form.phone_no)) errs.phone_no = 'Must be a valid 10-digit Indian mobile number';
  if (!form.password) errs.password = 'Password is required';
  else {
    if (form.password.length < 6) errs.password = 'At least 6 characters';
    else if (!/[a-z]/.test(form.password)) errs.password = 'Must contain a lowercase letter';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Must contain an uppercase letter';
    else if (!/[0-9]/.test(form.password)) errs.password = 'Must contain a number';
    else if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>/?~]/.test(form.password)) errs.password = 'Must contain a special character';
  }
  return errs;
}

function CreateUserDrawer({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (user: FinanceUser) => void;
}) {
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

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    background: 'var(--color-surface)',
    border: `1px solid ${hasError ? '#ef4444' : 'var(--color-border)'}`,
    borderRadius: 8, padding: '0.625rem 0.75rem',
    color: 'var(--color-text)', fontSize: '0.8rem',
    fontFamily: "'DM Sans', sans-serif", outline: 'none',
    transition: 'border-color 0.2s', boxSizing: 'border-box',
  });

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.62rem', fontWeight: 500,
    textTransform: 'uppercase', letterSpacing: '0.12em',
    color: 'var(--color-muted)', marginBottom: '0.35rem',
  };

  const errStyle: React.CSSProperties = {
    fontSize: '0.65rem', color: '#ef4444', marginTop: '0.25rem',
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)',
          backdropFilter: 'blur(3px)', zIndex: 40,
          animation: 'fadeIn 0.2s ease both',
        }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '100%', maxWidth: 460,
        background: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-border)',
        zIndex: 50, display: 'flex', flexDirection: 'column',
        boxShadow: '-12px 0 48px rgba(15,40,90,0.12)',
        animation: 'slideInRight 0.32s var(--ease-out-expo, cubic-bezier(0.16,1,0.3,1)) both',
      }}>
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
              border: '1px solid rgba(37,99,235,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-accent)',
            }}>
              <IconUsers />
            </div>
            <div>
              <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-muted)', marginBottom: '0.15rem' }}>
                Admin
              </p>
              <h2 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
                Create User
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid var(--color-border)',
              borderRadius: 8, padding: '0.45rem', cursor: 'pointer',
              color: 'var(--color-muted)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
            }}
          >
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
              <label style={labelStyle}>First Name *</label>
              <input
                type="text" placeholder="e.g. Priya"
                style={inputStyle(!!errors.first_name)}
                value={form.first_name}
                onChange={e => handleChange('first_name', e.target.value)}
              />
              {errors.first_name && <p style={errStyle}>{errors.first_name}</p>}
            </div>
            <div>
              <label style={labelStyle}>Last Name *</label>
              <input
                type="text" placeholder="e.g. Sharma"
                style={inputStyle(!!errors.last_name)}
                value={form.last_name}
                onChange={e => handleChange('last_name', e.target.value)}
              />
              {errors.last_name && <p style={errStyle}>{errors.last_name}</p>}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email *</label>
            <input
              type="email" placeholder="e.g. priya@company.com"
              style={inputStyle(!!errors.email)}
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
            />
            {errors.email && <p style={errStyle}>{errors.email}</p>}
          </div>

          <div>
            <label style={labelStyle}>Phone Number *</label>
            <input
              type="tel" placeholder="10-digit Indian mobile"
              style={inputStyle(!!errors.phone_no)}
              value={form.phone_no}
              onChange={e => handleChange('phone_no', e.target.value)}
            />
            {errors.phone_no && <p style={errStyle}>{errors.phone_no}</p>}
          </div>

          <div>
            <label style={labelStyle}>Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 chars, upper, lower, number, symbol"
                style={{ ...inputStyle(!!errors.password), paddingRight: '2.5rem' }}
                value={form.password}
                onChange={e => handleChange('password', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                style={{
                  position: 'absolute', right: '0.625rem', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', padding: '0.2rem',
                  color: 'var(--color-muted)', fontSize: '0.65rem',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <p style={errStyle}>{errors.password}</p>}
          </div>

          <div style={{
            padding: '0.75rem', borderRadius: 8,
            background: 'var(--color-accent-soft)',
            border: '1px solid rgba(37,99,235,0.12)',
          }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-accent)', lineHeight: 1.55 }}>
              This user will be created as a <strong>Finance Associate</strong> and will have access to
              the full dashboard including upload, matching, invoices, payments, and reminders.
            </p>
          </div>
        </div>

        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-surface-2)',
          display: 'flex', gap: '0.75rem',
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '0.65rem', borderRadius: 8,
              border: '1px solid var(--color-border)', background: 'transparent',
              color: 'var(--color-muted)', fontSize: '0.82rem',
              fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary"
            style={{
              flex: 2, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '0.5rem',
            }}
          >
            {saving ? <Spinner size={15} color="#fff" /> : <IconPlus />}
            {saving ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

function UserRow({ user }: { user: FinanceUser }) {
  const initials = `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase();
  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '2.5fr 2fr 1.5fr 1.2fr',
      gap: '1rem',
      padding: '0.875rem 1.25rem',
      alignItems: 'center',
      borderBottom: '1px solid var(--color-border)',
      transition: 'background 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'var(--color-accent-soft)',
          border: '1px solid rgba(37,99,235,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-accent)' }}>{initials}</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.first_name} {user.last_name}
          </p>
          <p style={{ fontSize: '0.68rem', color: 'var(--color-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.email}
          </p>
        </div>
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>{user.phone_no}</p>

      <span style={{
        display: 'inline-block', padding: '0.15rem 0.6rem', borderRadius: 99,
        fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase',
        background: 'rgba(22,163,74,0.08)', color: '#15803d',
        border: '1px solid rgba(22,163,74,0.2)',
      }}>
        Finance Associate
      </span>

      <p style={{ fontSize: '0.72rem', color: 'var(--color-faint)', textAlign: 'right' }}>{joinedDate}</p>
    </div>
  );
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<FinanceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone_no.includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Users', value: loading ? '—' : users.length, accent: false },
          { label: 'Finance Associates', value: loading ? '—' : users.filter(u => u.role === 'finance_associate').length, accent: true },
        ].map(stat => (
          <div key={stat.label} style={{
            padding: '1rem 1.25rem', borderRadius: 12,
            background: stat.accent ? 'var(--color-accent-soft)' : 'var(--color-surface)',
            border: `1px solid ${stat.accent ? 'rgba(37,99,235,0.15)' : 'var(--color-border)'}`,
            minWidth: 140,
          }}>
            <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: stat.accent ? 'var(--color-accent)' : 'var(--color-muted)', marginBottom: '0.3rem' }}>
              {stat.label}
            </p>
            <p className="font-display" style={{ fontSize: '1.6rem', fontWeight: 700, color: stat.accent ? 'var(--color-accent)' : 'var(--color-text)', lineHeight: 1 }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <div className="banner banner-error animate-fade-in">
          <span className="banner-icon">⚠</span><p>{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="banner banner-success animate-fade-in">
          <span className="banner-icon">✓</span><p>{successMsg}</p>
        </div>
      )}

      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 14, overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap',
          background: 'var(--color-surface-2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 200 }}>
            <span style={{ color: 'var(--color-muted)', display: 'flex' }}><IconSearch /></span>
            <input
              type="text"
              placeholder="Search by name, email, or phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: 'none', border: 'none', outline: 'none',
                color: 'var(--color-text)', fontSize: '0.8rem',
                fontFamily: "'DM Sans', sans-serif", flex: 1,
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex' }}>
                <IconClose />
              </button>
            )}
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
          >
            <IconPlus />
            Add User
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '2.5fr 2fr 1.5fr 1.2fr',
          gap: '1rem',
          padding: '0.6rem 1.25rem',
          background: 'var(--color-surface-2)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          {['User', 'Phone', 'Role', 'Joined'].map((h, i) => (
            <p key={h} style={{
              fontSize: '0.6rem', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              color: 'var(--color-muted)',
              textAlign: i === 3 ? 'right' : 'left',
            }}>{h}</p>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            padding: '3rem', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-muted)', marginBottom: '0.5rem',
            }}>
              <IconUsers />
            </div>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>
              {search ? 'No users match your search' : 'No finance associates yet'}
            </p>
            {!search && (
              <p style={{ color: 'var(--color-faint)', fontSize: '0.72rem' }}>
                Click "Add User" to create the first one
              </p>
            )}
          </div>
        ) : (
          filtered.map(user => <UserRow key={user.id} user={user} />)
        )}

        {!loading && filtered.length > 0 && (
          <div style={{
            padding: '0.75rem 1.25rem',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface-2)',
          }}>
            <p style={{ fontSize: '0.68rem', color: 'var(--color-faint)' }}>
              Showing {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {drawerOpen && (
        <CreateUserDrawer
          onClose={() => setDrawerOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
