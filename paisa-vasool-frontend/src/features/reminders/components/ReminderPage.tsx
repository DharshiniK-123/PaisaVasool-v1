import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import {fetchRemindersThunk,runAgingJobThunk,clearReminderError,clearJobSuccess,setRefreshing,} from '../slices/reminderSlice';
import Pagination from '../../../components/common/Pagination';

type ReminderStatus = 'SENT' | 'FAILED' | 'PENDING';

type Reminder = {
  id: number;
  invoice_id?: number | null;
  customer_id?: number | null;
  customer_name?: string | null;
  customer_email?: string | null;
  status?: ReminderStatus | string | null;
  sent_at?: string | null;
  error_message?: string | null;
  aging_config_id?: number | null;
  severity?: string | null;
  subject?: string | null;
  body?: string | null;
  [key: string]: unknown;
};


const IconBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const IconPlay = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const IconClose = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconAlertTriangle = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconClock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IconUser = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconHash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/>
    <line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconZap = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);


function Spinner({ size = 18, color = 'var(--color-accent)' }: { size?: number; color?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${color}22`, borderTopColor: color,
      animation: 'spin 0.65s linear infinite', flexShrink: 0,
    }} />
  );
}

function formatDate(str?: string | null) {
  if (!str) return '—';
  const d = new Date(str);
  return isNaN(d.getTime()) ? str : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(str?: string | null) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(str?: string | null) {
  if (!str) return '—';
  const diff = Date.now() - new Date(str).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}


const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  SENT:    { label: 'Sent',    icon: <IconCheck />,         bg: 'rgba(52,211,153,0.1)',  text: '#34d399', border: 'rgba(52,211,153,0.25)'  },
  FAILED:  { label: 'Failed',  icon: <IconAlertTriangle />, bg: 'rgba(248,113,113,0.1)', text: '#f87171', border: 'rgba(248,113,113,0.25)' },
  PENDING: { label: 'Pending', icon: <IconClock />,         bg: 'rgba(251,191,36,0.1)',  text: '#fbbf24', border: 'rgba(251,191,36,0.25)'  },
};

const SEVERITY_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  LOW:       { bg: 'rgba(52,211,153,0.08)',  text: '#34d399', border: 'rgba(52,211,153,0.2)'  },
  MEDIUM:    { bg: 'rgba(251,191,36,0.08)',  text: '#fbbf24', border: 'rgba(251,191,36,0.2)'  },
  HIGH:      { bg: 'rgba(248,113,113,0.08)', text: '#f87171', border: 'rgba(248,113,113,0.2)' },
  SCHEDULER: { bg: 'rgba(139,92,246,0.08)',  text: '#a78bfa', border: 'rgba(139,92,246,0.2)'  },
};

function StatusBadge({ status }: { status?: string | null }) {
  const key = (status ?? 'PENDING').toUpperCase();
  const c = STATUS_CONFIG[key] ?? STATUS_CONFIG.PENDING;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.2rem 0.6rem', borderRadius: 99,
      fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em',
      textTransform: 'uppercase', whiteSpace: 'nowrap',
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
    }}>
      {c.icon} {c.label}
    </span>
  );
}

function SeverityBadge({ severity }: { severity?: string | null }) {
  if (!severity) return null;
  const key = severity.toUpperCase();
  const c = SEVERITY_CONFIG[key] ?? SEVERITY_CONFIG.LOW;
  return (
    <span style={{
      display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: 99,
      fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em',
      textTransform: 'uppercase', whiteSpace: 'nowrap',
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
    }}>
      {severity}
    </span>
  );
}


function ReminderDrawer({ reminder, onClose }: { reminder: Reminder; onClose: () => void }) {
  const statusKey = (reminder.status ?? 'PENDING').toString().toUpperCase();
  const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.PENDING;

  const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
      padding: '0.65rem 0', borderBottom: '1px solid var(--color-border)',
    }}>
      <div style={{ color: 'var(--color-muted)', flexShrink: 0, width: 16, display: 'flex', justifyContent: 'center', marginTop: '0.1rem' }}>
        {icon}
      </div>
      <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', flex: '0 0 90px', marginTop: '0.1rem' }}>
        {label}
      </span>
      <span style={{ fontSize: '0.78rem', fontWeight: 500, flex: 1, color: 'var(--color-text)', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', zIndex: 40, animation: 'fadeIn 0.2s ease both' }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 460,
        background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)',
        zIndex: 50, display: 'flex', flexDirection: 'column',
        boxShadow: '-12px 0 48px rgba(0,0,0,0.55)',
        animation: 'slideInRight 0.3s var(--ease-out-expo) both',
      }}>
        <div style={{
          padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: cfg.bg, border: `1px solid ${cfg.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: cfg.text,
            }}>
              <IconBell />
            </div>
            <div>
              <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-muted)', marginBottom: '0.1rem' }}>
                Reminder #{reminder.id}
              </p>
              <h3 className="font-display" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                {reminder.customer_name ?? `Customer #${reminder.customer_id}`}
              </h3>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid var(--color-border)', borderRadius: 8,
            padding: '0.45rem', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border-hover)'; el.style.color = 'var(--color-text)'; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border)'; el.style.color = 'var(--color-muted)'; }}
          >
            <IconClose />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-surface-2), var(--color-surface-3))',
            border: `1px solid ${cfg.border}`,
            borderRadius: 12, padding: '1.125rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: '0.35rem' }}>
                Reminder Status
              </p>
              <StatusBadge status={reminder.status} />
              <p style={{ fontSize: '0.68rem', color: 'var(--color-muted)', marginTop: '0.5rem' }}>
                {timeAgo(reminder.sent_at)}
              </p>
            </div>
            
          </div>

          {statusKey === 'FAILED' && reminder.error_message && (
            <div className="banner banner-error animate-fade-in">
              <span className="banner-icon">⚠</span>
              <div>
                <p style={{ fontWeight: 600, marginBottom: '0.2rem' }}>Delivery Failed</p>
                <p>{reminder.error_message}</p>
              </div>
            </div>
          )}
          <section>
            <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>
              Details
            </p>
            <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0 0.875rem' }}>
              {reminder.customer_name  && <Row icon={<IconUser />}     label="Customer"    value={reminder.customer_name} />}
              {reminder.customer_email && <Row icon={<IconMail />}     label="Email"       value={reminder.customer_email} />}
              {reminder.sent_at        && <Row icon={<IconCalendar />} label="Sent At"     value={formatDateTime(reminder.sent_at)} />}
              {reminder.severity       && <Row icon={<IconZap />}      label="Severity"    value={<SeverityBadge severity={reminder.severity} />} />}
               </div>
          </section>

          {reminder.subject && (
            <section>
              <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>
                Subject
              </p>
              <div style={{
                background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                borderRadius: 10, padding: '0.875rem 1rem',
                fontSize: '0.82rem', fontWeight: 500, color: 'var(--color-text)',
              }}>
                {reminder.subject}
              </div>
            </section>
          )}

          {reminder.body && (
            <section>
              <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>
                Message Body
              </p>
              <div style={{
                background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                borderRadius: 10, padding: '1rem',
                fontSize: '0.78rem', color: 'var(--color-text)', lineHeight: 1.7,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {reminder.body}
              </div>
            </section>
          )}
        </div>
      </div>
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </>
  );
}

function RunJobModal({ onConfirm, onCancel, running }: {
  onConfirm: () => void; onCancel: () => void; running: boolean;
}) {
  return (
    <>
      <div onClick={!running ? onCancel : undefined} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 40, animation: 'fadeIn 0.2s ease both' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '100%', maxWidth: 420, zIndex: 50,
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 16, padding: '2rem',
        boxShadow: 'var(--shadow-lg)',
        animation: 'popIn 0.25s var(--ease-bounce) both',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', textAlign: 'center' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(251,191,36,0.1)', border: '2px solid rgba(251,191,36,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fbbf24', fontSize: '1.25rem',
          }}>
            <IconPlay />
          </div>
          <div>
            <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
              Run Aging Job Now?
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-muted)', lineHeight: 1.65 }}>
              This will scan all overdue invoices, evaluate your aging rules, and dispatch reminder notifications immediately. This action cannot be undone.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%' }}>
            <button
              onClick={onCancel} disabled={running}
              className="btn-secondary"
              style={{ padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm} disabled={running}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {running ? <><Spinner size={14} color="#fff" /> Running…</> : <><IconPlay /> Run Now</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
const ALL_STATUSES: ReminderStatus[] = ['SENT', 'FAILED', 'PENDING'];

export default function RemindersPage() {
  const dispatch = useAppDispatch();
  const { reminders, loading, refreshing, runningJob, error, jobSuccess } = useAppSelector(s => s.reminders);

  const [selected, setSelected]           = useState<Reminder | null>(null);
  const [showRunModal, setShowRunModal]   = useState(false);
  const [search, setSearch]               = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<ReminderStatus>>(new Set());
  const [sortDir, setSortDir]             = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage]     = useState(1);
  const [pageSize, setPageSize]           = useState(25);

  useEffect(() => { dispatch(fetchRemindersThunk()); }, [dispatch]);
  useEffect(() => {
    if (!jobSuccess) return;
    const t = setTimeout(() => dispatch(clearJobSuccess()), 5000);
    return () => clearTimeout(t);
  }, [jobSuccess, dispatch]);

  const fetchReminders = (silent = false) => {
    if (silent) dispatch(setRefreshing(true));
    dispatch(fetchRemindersThunk());
  };

  const handleRunJob = () => {
    dispatch(runAgingJobThunk());
    setShowRunModal(false);
  };

  const toggleFilter = (s: ReminderStatus) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
    setCurrentPage(1);
  };

  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = reminders.filter(r => (r.status ?? 'PENDING').toString().toUpperCase() === s).length;
    return acc;
  }, {} as Record<ReminderStatus, number>);

  const filtered = reminders
    .filter(r => {
      const statusKey = (r.status ?? 'PENDING').toString().toUpperCase() as ReminderStatus;
      if (activeFilters.size > 0 && !activeFilters.has(statusKey)) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          String(r.id).includes(s) ||
          (r.customer_name ?? '').toLowerCase().includes(s) ||
          (r.customer_email ?? '').toLowerCase().includes(s) ||
          String(r.invoice_id ?? '').includes(s)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const ta = new Date(a.sent_at ?? 0).getTime();
      const tb = new Date(b.sent_at ?? 0).getTime();
      return sortDir === 'desc' ? tb - ta : ta - tb;
    });

  const sentCount    = counts.SENT ?? 0;
  const filteredTotal = filtered.length;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const failedCount  = counts.FAILED ?? 0;
  const pendingCount = counts.PENDING ?? 0;
  const deliveryRate = reminders.length > 0
    ? Math.round((sentCount / reminders.length) * 100)
    : 0;

  const thStyle: React.CSSProperties = {
    padding: '0.6rem 1rem', textAlign: 'left',
    fontSize: '0.6rem', fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
    textTransform: 'uppercase', letterSpacing: '0.1em',
    color: 'var(--color-muted)', whiteSpace: 'nowrap',
    background: 'var(--color-surface-2)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1100 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-accent)', marginBottom: '0.35rem' }}>
            Aging & Notifications
          </p>
          <h2 className="font-display" style={{ fontSize: 'clamp(1.375rem, 2.5vw, 1.75rem)', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
            Reminders
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => fetchReminders(true)} disabled={refreshing || loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.45rem 0.875rem', borderRadius: 8,
              border: '1px solid var(--color-border)', background: 'var(--color-surface)',
              cursor: 'pointer', color: 'var(--color-muted)',
              fontSize: '0.72rem', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(37,99,235,0.3)'; el.style.color = 'var(--color-accent)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border)'; el.style.color = 'var(--color-muted)'; }}
          >
            {refreshing ? <Spinner size={13} /> : <IconRefresh />} Refresh
          </button>

          <button
            onClick={() => setShowRunModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1.125rem', borderRadius: 8, cursor: 'pointer',
              background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-dim))',
              border: 'none', color: '#fff',
              fontSize: '0.78rem', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif",
              letterSpacing: '0.03em', transition: 'all 0.2s',
              boxShadow: '0 2px 12px rgba(37,99,235,0.2)',
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-1px)'; el.style.boxShadow = '0 4px 20px rgba(37,99,235,0.35)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'none'; el.style.boxShadow = '0 2px 12px rgba(37,99,235,0.2)'; }}
          >
            <IconPlay /> Run Aging Job
          </button>
        </div>
      </div>

      {error && (
        <div className="banner banner-error animate-fade-in">
          <span className="banner-icon">⚠</span>
          <p>{error} — <button onClick={() => fetchReminders()} style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', textDecoration: 'underline', fontFamily: "'DM Sans', sans-serif", fontSize: 'inherit', padding: 0 }}>Retry</button></p>
        </div>
      )}
      {jobSuccess && (
        <div className="banner banner-success animate-fade-in">
          <span className="banner-icon">✓</span><p>{jobSuccess}</p>
        </div>
      )}

      {!loading && reminders.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '0.625rem' }}>
          {[
            { label: 'Total',         value: reminders.length,  color: 'var(--color-text)' },
            { label: 'Delivered',     value: sentCount,          color: '#16a34a'           },
            { label: 'Failed',        value: failedCount,        color: '#ef4444'           },
            { label: 'Pending',       value: pendingCount,       color: '#ca8a04'           },
            { label: 'Delivery Rate', value: `${deliveryRate}%`, color: deliveryRate > 80 ? '#16a34a' : deliveryRate > 50 ? '#ca8a04' : '#ef4444' },
          ].map((s, i) => (
            <div key={s.label} className="stat-card" style={{ animation: `fadeSlideUp 0.4s var(--ease-out-expo) ${i * 0.06}s both` }}>
              <p className="font-display" style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: '0.3rem' }}>
                {s.value}
              </p>
              <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted)' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {!loading && reminders.length > 0 && (
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 10, padding: '0.875rem 1.125rem',
          display: 'flex', alignItems: 'center', gap: '1rem',
        }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-muted)', flexShrink: 0 }}>Delivery</p>
          <div style={{ flex: 1, height: 6, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${deliveryRate}%`,
              background: deliveryRate > 80 ? '#16a34a' : deliveryRate > 50 ? '#ca8a04' : '#ef4444',
              transition: 'width 0.6s var(--ease-out-expo)',
            }} />
          </div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: deliveryRate > 80 ? '#16a34a' : deliveryRate > 50 ? '#ca8a04' : '#ef4444', flexShrink: 0 }}>
            {deliveryRate}%
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
            {[
              { label: 'Sent',    value: sentCount,    color: '#16a34a' },
              { label: 'Failed',  value: failedCount,  color: '#ef4444' },
              { label: 'Pending', value: pendingCount, color: '#ca8a04' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>{s.label} {s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 9, padding: '0.55rem 0.875rem', flex: '1 1 200px', maxWidth: 300,
        }}>
          <span style={{ color: 'var(--color-muted)', flexShrink: 0 }}><IconSearch /></span>
          <input
            type="text" placeholder="Search customer, invoice" value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--color-text)', fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif", flex: 1, minWidth: 0 }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', padding: 0 }}>
              <IconClose />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {ALL_STATUSES.map(s => {
            const cfg = STATUS_CONFIG[s];
            const active = activeFilters.has(s);
            return (
              <button key={s} onClick={() => toggleFilter(s)} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.3rem 0.7rem', borderRadius: 99, cursor: 'pointer',
                fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.07em',
                textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif",
                border: active ? `1px solid ${cfg.border}` : '1px solid var(--color-border)',
                background: active ? cfg.bg : 'transparent',
                color: active ? cfg.text : 'var(--color-muted)',
                transition: 'all 0.15s',
              }}>
                {cfg.icon} {cfg.label} <span style={{ opacity: 0.7 }}>({counts[s]})</span>
              </button>
            );
          })}
        </div>

        <button onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')} style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.75rem',
          borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)',
          cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.7rem',
          fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s', marginLeft: 'auto',
        }}>
          <IconChevronDown /> {sortDir === 'desc' ? 'Newest first' : 'Oldest first'}
        </button>
      </div>

      {activeFilters.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)' }}>Filtering:</span>
          {Array.from(activeFilters).map(s => (
            <span key={s} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.15rem 0.5rem', borderRadius: 99, fontSize: '0.65rem',
              background: STATUS_CONFIG[s].bg, color: STATUS_CONFIG[s].text,
              border: `1px solid ${STATUS_CONFIG[s].border}`,
            }}>
              {STATUS_CONFIG[s].label}
              <button onClick={() => toggleFilter(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0, opacity: 0.7 }}>
                <IconClose />
              </button>
            </span>
          ))}
          <button onClick={() => setActiveFilters(new Set())} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.68rem', fontFamily: "'DM Sans', sans-serif", textDecoration: 'underline', padding: 0 }}>
            Clear all
          </button>
        </div>
      )}

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', margin: '0 auto 1rem',
              background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-muted)',
            }}>
              <IconBell />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '0.4rem' }}>
              {search || activeFilters.size > 0 ? 'No reminders match your filters' : 'No reminders sent yet'}
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-faint)' }}>
              {!search && activeFilters.size === 0 && 'Run the aging job to dispatch reminders for overdue invoices'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Invoice</th>
                  <th style={thStyle}>Severity</th>
                  <th style={thStyle}>Sent</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r, i) => {
                  const statusKey = (r.status ?? 'PENDING').toString().toUpperCase();
                  const isFailed = statusKey === 'FAILED';
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelected(r)}
                      style={{
                        borderBottom: i < paginated.length - 1 ? '1px solid var(--color-border)' : 'none',
                        cursor: 'pointer', transition: 'background 0.15s',
                        background: isFailed ? 'rgba(239,68,68,0.02)' : 'transparent',
                        animation: `fadeSlideUp 0.3s var(--ease-out-expo) ${Math.min(i, 15) * 0.025}s both`,
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = isFailed ? 'rgba(239,68,68,0.02)' : 'transparent'}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}><StatusBadge status={r.status} /></td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div>
                          <p style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                            {r.customer_name ?? '—'}
                          </p>
                          {r.customer_email && (
                            <p style={{ fontSize: '0.65rem', color: 'var(--color-muted)', marginTop: '0.1rem' }}>{r.customer_email}</p>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--color-accent)', fontWeight: 500 }}>
                        {(r.invoice_number as string) ?? (r.invoice_id ? `INV-${r.invoice_id}` : '—')}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <SeverityBadge severity={r.severity} />
                      </td>
                      
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                        {r.sent_at ? (
                          <div>
                            <p>{timeAgo(r.sent_at)}</p>
                            <p style={{ fontSize: '0.62rem', color: 'var(--color-faint)' }}>{formatDate(r.sent_at)}</p>
                          </div>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredTotal > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredTotal}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={size => { setPageSize(size); setCurrentPage(1); }}
          />
        )}
      </div>

      {showRunModal && (
        <RunJobModal
          onConfirm={handleRunJob}
          onCancel={() => setShowRunModal(false)}
          running={runningJob}
        />
      )}
      {selected && <ReminderDrawer reminder={selected} onClose={() => setSelected(null)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}