import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../lib/axios';
import type { Invoice } from '../../invoices/types/Invoice';
import type { FinanceUser } from '../../UserManagement/types';
import { adminService } from '../../UserManagement/services/adminService';
import { extractErrorMessage } from '../../../utils/errorUtils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface EnrichedInvoice extends Invoice {
  _user?: FinanceUser;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconInvoice  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IconRefresh  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const IconSearch   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Spinner({ size = 16, color = 'var(--color-accent)' }: { size?: number; color?: string }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${color}33`, borderTopColor: color, animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />;
}

function SkeletonRow() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.2fr 1fr 1fr 1fr', gap: '1rem', padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--color-border)', alignItems: 'center' }}>
      {[180, 160, 100, 80, 80, 70].map((w, i) => (
        <div key={i} style={{ height: 12, width: w, borderRadius: 4, background: 'var(--color-surface-2)', animation: 'shimmer 1.4s ease infinite' }} />
      ))}
    </div>
  );
}

const STATUS_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  PAID:      { color: '#15803d', bg: 'rgba(22,163,74,0.08)',   border: 'rgba(22,163,74,0.2)' },
  UNPAID:    { color: '#b91c1c', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)' },
  PARTIAL:   { color: '#92400e', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)' },
  OVERPAID:  { color: '#1e40af', bg: 'rgba(37,99,235,0.08)',   border: 'rgba(37,99,235,0.2)' },
  PENDING:   { color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)' },
};

function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = (status || 'PENDING').toUpperCase();
  const style = STATUS_STYLES[s] ?? STATUS_STYLES['PENDING'];
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

// ─── Fetch all invoices across all users (admin) ──────────────────────────────
// Admin uses the same documents endpoint — it returns ALL documents across all users
// because the backend checks for admin role and returns everything.
async function fetchAllInvoicesAdmin(users: FinanceUser[]): Promise<EnrichedInvoice[]> {
  const BASE = '/api/v1/payment_intake_matching';

  // Build user lookup
  const userMap: Record<number, FinanceUser> = {};
  users.forEach(u => { userMap[u.id] = u; });

  // Fetch all documents (admin sees all)
  const { data: docs } = await axiosInstance.get(`${BASE}/documents/`);
  const invoiceDocs = (Array.isArray(docs) ? docs : []).filter(
    (d: { document_type?: string; user_id?: number }) => d.document_type === 'INVOICE'
  );

  const allInvoices: EnrichedInvoice[] = [];
  await Promise.all(
    invoiceDocs.map(async (doc: { id: number; user_id?: number }) => {
      try {
        const { data } = await axiosInstance.get(`${BASE}/documents/${doc.id}/invoices`);
        if (Array.isArray(data)) {
          data.forEach((inv: Invoice) => {
            allInvoices.push({ ...inv, _user: doc.user_id ? userMap[doc.user_id] : undefined });
          });
        }
      } catch { /* ignore */ }
    })
  );
  return allInvoices;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminInvoicesPage() {
  const [invoices,   setInvoices]   = useState<EnrichedInvoice[]>([]);
  const [users,      setUsers]      = useState<FinanceUser[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [userFilter, setUserFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const fetchedUsers = await adminService.listUsers();
      setUsers(fetchedUsers);
      const fetchedInvoices = await fetchAllInvoicesAdmin(fetchedUsers);
      setInvoices(fetchedInvoices);
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

  // Filtered list
  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || (inv.invoice_number ?? '').toLowerCase().includes(q)
      || (inv.customer_name ?? '').toLowerCase().includes(q)
      || (inv.customer_email ?? '').toLowerCase().includes(q);
    const matchUser   = userFilter === 'all' || inv._user?.id === userFilter;
    const matchStatus = statusFilter === 'all' || (inv.payment_status ?? 'PENDING').toUpperCase() === statusFilter;
    return matchSearch && matchUser && matchStatus;
  });

  const statuses = ['all', 'PAID', 'UNPAID', 'PARTIAL', 'OVERPAID'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--color-accent-soft)', border: '1px solid rgba(37,99,235,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
              <IconInvoice />
            </div>
            <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--color-accent)', fontWeight: 700 }}>Read Only</p>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
            {loading ? 'Loading…' : `${filtered.length} of ${invoices.length} invoices across all users`}
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
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.4rem 0.75rem', minWidth: 220, flex: 1, maxWidth: 320 }}>
          <IconSearch />
          <input
            type="text" placeholder="Search invoice no, customer…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--color-text)', fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif", flex: 1 }}
          />
        </div>

        {/* User filter */}
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

        {/* Status filter */}
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {statuses.map(s => {
            const style = s !== 'all' ? STATUS_STYLES[s] : null;
            const isActive = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '0.32rem 0.75rem', borderRadius: 99, fontSize: '0.7rem', fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', textTransform: 'capitalize',
                  transition: 'all 0.15s',
                  border: isActive ? (style ? `1px solid ${style.border}` : '1px solid rgba(37,99,235,0.3)') : '1px solid var(--color-border)',
                  background: isActive ? (style ? style.bg : 'var(--color-accent-soft)') : 'transparent',
                  color: isActive ? (style ? style.color : 'var(--color-accent)') : 'var(--color-muted)',
                }}
              >
                {s === 'all' ? 'All' : s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.2fr 1fr 1fr 1fr', gap: '1rem', padding: '0.6rem 1.25rem', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
          {['Uploaded By', 'Customer', 'Invoice No.', 'Amount', 'Due Date', 'Status'].map(h => (
            <p key={h} style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)' }}>{h}</p>
          ))}
        </div>

        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          : filtered.length === 0
            ? (
              <div style={{ padding: '3.5rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', fontWeight: 500 }}>
                  {invoices.length === 0 ? 'No invoices uploaded yet.' : 'No invoices match your filters.'}
                </p>
              </div>
            )
            : filtered.map(inv => (
              <div
                key={inv.id}
                style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.2fr 1fr 1fr 1fr', gap: '1rem', padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--color-border)', alignItems: 'center', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                {/* Uploaded by */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inv._user ? `${inv._user.first_name} ${inv._user.last_name}` : '—'}
                  </span>
                  {inv._user && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inv._user.email}
                    </span>
                  )}
                </div>

                {/* Customer */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inv.customer_name ?? '—'}
                  </span>
                  {inv.customer_email && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inv.customer_email}
                    </span>
                  )}
                </div>

                {/* Invoice no */}
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-accent)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {inv.invoice_number ?? '—'}
                </span>

                {/* Amount */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    {fmt(inv.total_amount)}
                  </span>
                  {inv.paid_amount != null && inv.paid_amount > 0 && (
                    <span style={{ fontSize: '0.62rem', color: '#15803d' }}>Paid: {fmt(inv.paid_amount)}</span>
                  )}
                </div>

                {/* Due date */}
                <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                  {fmtDate(inv.due_date)}
                </span>

                {/* Status */}
                <StatusBadge status={inv.payment_status} />
              </div>
            ))
        }

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: '0.625rem 1.25rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-faint)' }}>
              Showing {filtered.length} of {invoices.length} invoices
              {userFilter !== 'all' && ` · filtered by user`}
              {statusFilter !== 'all' && ` · status: ${statusFilter}`}
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