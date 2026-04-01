import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../lib/axios';
import type { Payment } from '../../payments/types/Payment';
import type { FinanceUser } from '../../UserManagement/types';
import { adminService } from '../../UserManagement/services/adminService';
import { extractErrorMessage } from '../../../utils/errorUtils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface EnrichedPayment extends Payment {
  _user?: FinanceUser;
  match_status?: string | null;
  currency?: string | null;
  payment_amount?: number | null;
  invoice_no?: string | null;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconPayment = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IconRefresh = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const IconSearch  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Spinner({ size = 16, color = 'var(--color-accent)' }: { size?: number; color?: string }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${color}33`, borderTopColor: color, animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />;
}

function SkeletonRow() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr 1fr', gap: '1rem', padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--color-border)', alignItems: 'center' }}>
      {[180, 160, 100, 80, 80, 70].map((w, i) => (
        <div key={i} style={{ height: 12, width: w, borderRadius: 4, background: 'var(--color-surface-2)', animation: 'shimmer 1.4s ease infinite' }} />
      ))}
    </div>
  );
}

const MATCH_STATUS_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  FULL:        { color: '#15803d', bg: 'rgba(22,163,74,0.08)',   border: 'rgba(22,163,74,0.2)' },
  PARTIAL:     { color: '#92400e', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)' },
  OVERPAYMENT: { color: '#1e40af', bg: 'rgba(37,99,235,0.08)',   border: 'rgba(37,99,235,0.2)' },
  FAILED:      { color: '#b91c1c', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)' },
  DUPLICATE:   { color: '#6b21a8', bg: 'rgba(168,85,247,0.08)',  border: 'rgba(168,85,247,0.2)' },
  UNMATCHED:   { color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)' },
};

function MatchBadge({ status }: { status: string | null | undefined }) {
  const s = (status || 'UNMATCHED').toUpperCase();
  const style = MATCH_STATUS_STYLES[s] ?? MATCH_STATUS_STYLES['UNMATCHED'];
  return (
    <span style={{ padding: '0.18rem 0.6rem', borderRadius: 99, fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: style.color, background: style.bg, border: `1px solid ${style.border}`, whiteSpace: 'nowrap' }}>
      {s}
    </span>
  );
}

function fmt(amount: number | null | undefined, currency?: string | null) {
  if (amount == null) return '—';
  return `${currency ?? ''} ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim();
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Fetch ────────────────────────────────────────────────────────────────────
async function fetchAllPaymentsAdmin(users: FinanceUser[]): Promise<EnrichedPayment[]> {
  const BASE = '/api/v1/payment_intake_matching';
  const userMap: Record<number, FinanceUser> = {};
  users.forEach(u => { userMap[u.id] = u; });

  const { data: docs } = await axiosInstance.get(`${BASE}/documents/`);
  const paymentDocs = (Array.isArray(docs) ? docs : []).filter(
    (d: { document_type?: string }) => d.document_type === 'PAYMENT'
  );

  const allPayments: EnrichedPayment[] = [];
  await Promise.all(
    paymentDocs.map(async (doc: { id: number; user_id?: number }) => {
      try {
        const { data } = await axiosInstance.get(`${BASE}/documents/${doc.id}/payments`);
        if (Array.isArray(data)) {
          data.forEach((pay: EnrichedPayment) => {
            allPayments.push({ ...pay, _user: doc.user_id ? userMap[doc.user_id] : undefined });
          });
        }
      } catch { /* ignore */ }
    })
  );
  return allPayments;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminPaymentsPage() {
  const [payments,   setPayments]   = useState<EnrichedPayment[]>([]);
  const [users,      setUsers]      = useState<FinanceUser[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [userFilter,   setUserFilter]   = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const fetchedUsers = await adminService.listUsers();
      setUsers(fetchedUsers);
      const fetchedPayments = await fetchAllPaymentsAdmin(fetchedUsers);
      setPayments(fetchedPayments);
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

  const filtered = payments.filter(pay => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || (pay.payer_name ?? '').toLowerCase().includes(q)
      || (pay.payer_email ?? '').toLowerCase().includes(q)
      || (pay.invoice_no ?? '').toLowerCase().includes(q)
      || (pay.reference_number ?? '').toLowerCase().includes(q);
    const matchUser   = userFilter === 'all' || pay._user?.id === userFilter;
    const matchStatus = statusFilter === 'all' || (pay.match_status ?? 'UNMATCHED').toUpperCase() === statusFilter;
    return matchSearch && matchUser && matchStatus;
  });

  const statuses = ['all', 'FULL', 'PARTIAL', 'OVERPAYMENT', 'FAILED', 'UNMATCHED'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
              <IconPayment />
            </div>
            <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#60a5fa', fontWeight: 700 }}>Read Only</p>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
            {loading ? 'Loading…' : `${filtered.length} of ${payments.length} payments across all users`}
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

      {/* Filters */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.4rem 0.75rem', minWidth: 220, flex: 1, maxWidth: 320 }}>
          <IconSearch />
          <input
            type="text" placeholder="Search payer, invoice no, ref…"
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
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {statuses.map(s => {
            const style = s !== 'all' ? MATCH_STATUS_STYLES[s] : null;
            const isActive = statusFilter === s;
            return (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '0.32rem 0.75rem', borderRadius: 99, fontSize: '0.7rem', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s', border: isActive ? (style ? `1px solid ${style.border}` : '1px solid rgba(96,165,250,0.3)') : '1px solid var(--color-border)', background: isActive ? (style ? style.bg : 'rgba(96,165,250,0.08)') : 'transparent', color: isActive ? (style ? style.color : '#60a5fa') : 'var(--color-muted)' }}>
                {s === 'all' ? 'All' : s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr 1fr', gap: '1rem', padding: '0.6rem 1.25rem', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
          {['Uploaded By', 'Payer', 'Invoice No.', 'Amount', 'Paid Date'].map(h => (
            <p key={h} style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)' }}>{h}</p>
          ))}
        </div>

        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          : filtered.length === 0
            ? (
              <div style={{ padding: '3.5rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', fontWeight: 500 }}>
                  {payments.length === 0 ? 'No payments uploaded yet.' : 'No payments match your filters.'}
                </p>
              </div>
            )
            : filtered.map(pay => (
              <div
                key={pay.id}
                style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr 1fr', gap: '1rem', padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--color-border)', alignItems: 'center', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                {/* Uploaded by */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pay._user ? `${pay._user.first_name} ${pay._user.last_name}` : '—'}
                  </span>
                  {pay._user && <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pay._user.email}</span>}
                </div>

                {/* Payer */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pay.payer_name ?? '—'}
                  </span>
                  {pay.payer_email && <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pay.payer_email}</span>}
                </div>

                {/* Invoice no */}
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#60a5fa', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pay.invoice_no ?? '—'}
                </span>

                {/* Amount */}
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {fmt(pay.payment_amount ?? pay.amount, pay.currency)}
                </span>

                {/* Paid date */}
                <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                  {fmtDate(pay.payment_date)}
                </span>
              </div>
            ))
        }

        {!loading && filtered.length > 0 && (
          <div style={{ padding: '0.625rem 1.25rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-faint)' }}>
              Showing {filtered.length} of {payments.length} payments
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