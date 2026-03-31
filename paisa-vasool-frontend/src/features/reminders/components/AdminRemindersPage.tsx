import { useState, useEffect, useCallback } from 'react';
import { reminderService } from '../../reminders/services/reminderService';
import type { Reminder } from '../../reminders/types/Reminder';
import type { FinanceUser } from '../../UserManagement/types';
import { adminService } from '../../UserManagement/services/adminService';
import { extractErrorMessage } from '../../../utils/errorUtils';

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconReminder = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const IconRefresh  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const IconSearch   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconChevron  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr 1fr', gap: '1rem', padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--color-border)', alignItems: 'center' }}>
      {[160, 160, 80, 80, 80, 70].map((w, i) => (
        <div key={i} style={{ height: 12, width: w, borderRadius: 4, background: 'var(--color-surface-2)', animation: 'shimmer 1.4s ease infinite' }} />
      ))}
    </div>
  );
}

const STATUS_STYLES: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  SENT:    { color: '#15803d', bg: 'rgba(22,163,74,0.08)',   border: 'rgba(22,163,74,0.2)',   dot: '#16a34a' },
  FAILED:  { color: '#b91c1c', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   dot: '#ef4444' },
  PENDING: { color: '#92400e', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  dot: '#f59e0b' },
};

function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = (status || 'PENDING').toUpperCase();
  const style = STATUS_STYLES[s] ?? STATUS_STYLES['PENDING'];
  return (
    <span style={{ padding: '0.18rem 0.6rem', borderRadius: 99, fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: style.color, background: style.bg, border: `1px solid ${style.border}`, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: style.dot, flexShrink: 0 }} />
      {s}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string | null | undefined }) {
  if (!severity) return <span style={{ color: 'var(--color-faint)', fontSize: '0.72rem' }}>—</span>;
  const s = severity.toUpperCase();
  const map: Record<string, { color: string; bg: string }> = {
    HIGH:   { color: '#b91c1c', bg: 'rgba(239,68,68,0.08)' },
    MEDIUM: { color: '#92400e', bg: 'rgba(245,158,11,0.08)' },
    LOW:    { color: '#15803d', bg: 'rgba(22,163,74,0.08)' },
  };
  const style = map[s] ?? { color: 'var(--color-muted)', bg: 'var(--color-surface-2)' };
  return <span style={{ fontSize: '0.7rem', fontWeight: 700, color: style.color, background: style.bg, padding: '0.15rem 0.5rem', borderRadius: 6 }}>{s}</span>;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Expanded row for error message / body ────────────────────────────────────
function ExpandedRow({ reminder }: { reminder: Reminder }) {
  return (
    <div style={{ padding: '0.75rem 1.25rem 1rem 2.5rem', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {reminder.subject && (
        <div>
          <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted)', fontWeight: 600, marginBottom: '0.2rem' }}>Subject</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text)' }}>{reminder.subject}</p>
        </div>
      )}
      {reminder.message && (
        <div>
          <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted)', fontWeight: 600, marginBottom: '0.2rem' }}>Message</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text)', lineHeight: 1.6 }}>{reminder.message}</p>
        </div>
      )}
      {reminder.error_message && (
        <div>
          <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#b91c1c', fontWeight: 600, marginBottom: '0.2rem' }}>Error</p>
          <p style={{ fontSize: '0.78rem', color: '#b91c1c', fontFamily: 'monospace' }}>{reminder.error_message}</p>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminRemindersPage() {
  const [reminders,  setReminders]  = useState<Reminder[]>([]);
  const [users,      setUsers]      = useState<FinanceUser[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [userFilter,   setUserFilter]   = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId,   setExpandedId]   = useState<number | null>(null);

  // Note: reminderService.fetchAll() — admin backend returns ALL reminders when called by admin role
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [fetchedReminders, fetchedUsers] = await Promise.all([
        reminderService.fetchAll(),
        adminService.listUsers(),
      ]);
      setReminders(fetchedReminders);
      setUsers(fetchedUsers);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  // Summary counts
  const sentCount    = reminders.filter(r => (r.status ?? '').toUpperCase() === 'SENT').length;
  const failedCount  = reminders.filter(r => (r.status ?? '').toUpperCase() === 'FAILED').length;
  const pendingCount = reminders.filter(r => (r.status ?? '').toUpperCase() === 'PENDING').length;

  // Filtered list
  // Note: reminders don't have user_id directly — we match via customer_email if needed
  // For user filter, we match reminders by customer_email against users list
  const userEmailMap: Record<number, Set<string>> = {};
  users.forEach(u => { userEmailMap[u.id] = new Set([u.email.toLowerCase()]); });

  const filtered = reminders.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || (r.customer_name ?? '').toLowerCase().includes(q)
      || (r.customer_email ?? '').toLowerCase().includes(q)
      || (r.subject ?? '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || (r.status ?? 'PENDING').toUpperCase() === statusFilter;
    // User filter — match reminder's customer_email to the emails of users' customers
    // Since reminders don't carry user_id, filter is best-effort via customer_email substring
    const matchUser = userFilter === 'all' || (() => {
      const u = users.find(u => u.id === userFilter);
      if (!u) return false;
      // Try to match if this reminder belongs to a customer managed by this user
      // This is approximate — a proper solution needs user_id on reminder from backend
      return (r.customer_email ?? '').toLowerCase().includes(u.email.split('@')[1] ?? '___NOMATCH___');
    })();
    return matchSearch && matchStatus && matchUser;
  });

  const statuses = ['all', 'SENT', 'FAILED', 'PENDING'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
              <IconReminder />
            </div>
            <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#a855f7', fontWeight: 700 }}>Read Only</p>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
            {loading ? 'Loading…' : `${filtered.length} of ${reminders.length} reminders across all users`}
          </p>
        </div>
        <button
          onClick={handleRefresh} disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', borderRadius: 9, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif", cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.6 : 1 }}
        >
          <span style={{ display: 'flex', animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }}><IconRefresh /></span>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && <div className="banner banner-error animate-fade-in"><span className="banner-icon">⚠</span><p>{error}</p></div>}

      {/* Summary stat cards */}
      {!loading && (
        <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Sent',    value: sentCount,    color: '#15803d', bg: 'rgba(22,163,74,0.06)',   border: 'rgba(22,163,74,0.15)' },
            { label: 'Failed',  value: failedCount,  color: '#b91c1c', bg: 'rgba(239,68,68,0.06)',   border: 'rgba(239,68,68,0.15)' },
            { label: 'Pending', value: pendingCount, color: '#92400e', bg: 'rgba(245,158,11,0.06)',  border: 'rgba(245,158,11,0.15)' },
            { label: 'Total',   value: reminders.length, color: 'var(--color-accent)', bg: 'var(--color-accent-soft)', border: 'rgba(37,99,235,0.15)' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, minWidth: 100, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '0.875rem 1.25rem' }}>
              <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: s.color, fontWeight: 700, marginBottom: '0.4rem' }}>{s.label}</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, lineHeight: 1 }} className="font-display">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.4rem 0.75rem', minWidth: 220, flex: 1, maxWidth: 320 }}>
          <IconSearch />
          <input
            type="text" placeholder="Search customer, subject…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--color-text)', fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif", flex: 1 }}
          />
        </div>

        <select
          value={userFilter}
          onChange={e => setUserFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', outline: 'none' }}
        >
          <option value="all">All Users</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
        </select>

        <div style={{ display: 'flex', gap: '0.3rem' }}>
          {statuses.map(s => {
            const style = s !== 'all' ? STATUS_STYLES[s] : null;
            const isActive = statusFilter === s;
            return (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '0.32rem 0.75rem', borderRadius: 99, fontSize: '0.7rem', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', transition: 'all 0.15s', border: isActive ? (style ? `1px solid ${style.border}` : '1px solid rgba(168,85,247,0.3)') : '1px solid var(--color-border)', background: isActive ? (style ? style.bg : 'rgba(168,85,247,0.08)') : 'transparent', color: isActive ? (style ? style.color : '#a855f7') : 'var(--color-muted)' }}>
                {s === 'all' ? 'All' : s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '24px 1.5fr 1.5fr 1fr 1fr 1fr', gap: '1rem', padding: '0.6rem 1.25rem', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
          {['', 'Customer', 'Subject', 'Severity', 'Sent At', 'Status'].map((h, i) => (
            <p key={i} style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)' }}>{h}</p>
          ))}
        </div>

        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          : filtered.length === 0
            ? (
              <div style={{ padding: '3.5rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', fontWeight: 500 }}>
                  {reminders.length === 0 ? 'No reminders sent yet.' : 'No reminders match your filters.'}
                </p>
              </div>
            )
            : filtered.map(r => (
              <div key={r.id}>
                <div
                  style={{ display: 'grid', gridTemplateColumns: '24px 1.5fr 1.5fr 1fr 1fr 1fr', gap: '1rem', padding: '0.875rem 1.25rem', borderBottom: expandedId === r.id ? 'none' : '1px solid var(--color-border)', alignItems: 'center', transition: 'background 0.15s', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                >
                  {/* Expand chevron */}
                  <span style={{ color: 'var(--color-muted)', display: 'flex', transition: 'transform 0.2s', transform: expandedId === r.id ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                    <IconChevron />
                  </span>

                  {/* Customer */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.customer_name ?? '—'}
                    </span>
                    {r.customer_email && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.customer_email}</span>
                    )}
                  </div>

                  {/* Subject */}
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.subject ?? r.message?.slice(0, 50) ?? '—'}
                  </span>

                  {/* Severity */}
                  <SeverityBadge severity={r.severity} />

                  {/* Sent at */}
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                    {fmtDate(r.sent_at)}
                  </span>

                  {/* Status */}
                  <StatusBadge status={r.status} />
                </div>

                {/* Expanded detail */}
                {expandedId === r.id && <ExpandedRow reminder={r} />}
              </div>
            ))
        }

        {!loading && filtered.length > 0 && (
          <div style={{ padding: '0.625rem 1.25rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-faint)' }}>
              Showing {filtered.length} of {reminders.length} reminders · Click a row to expand details
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}