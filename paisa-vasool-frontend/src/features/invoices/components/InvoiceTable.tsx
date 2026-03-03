import { useState } from 'react';
import { useInvoices } from '../hooks/useInvoices';
import type { Invoice, PaymentStatus } from '../types/Invoice';

// ─── Icons ────────────────────────────────────────────────────────────────────

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
const IconInvoice = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
);
const IconChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconUser = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconMail = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IconPhone = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IconHash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/>
    <line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
  </svg>
);
const IconCurrency = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Spinner({ size = 18, color = 'var(--color-accent)' }: { size?: number; color?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${color}22`, borderTopColor: color,
      animation: 'spin 0.65s linear infinite', flexShrink: 0,
    }} />
  );
}

function formatCurrency(val?: number | null) {
  if (val == null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
}

function formatDate(str?: string | null) {
  if (!str) return '—';
  const d = new Date(str);
  return isNaN(d.getTime()) ? str : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isOverdue(due?: string | null, status?: string | null) {
  if (!due || status === 'PAID') return false;
  return new Date(due) < new Date();
}

function daysOverdue(due?: string | null) {
  if (!due) return 0;
  const diff = Date.now() - new Date(due).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  PAID:    { label: 'Paid',     bg: 'rgba(52,211,153,0.1)',  text: '#34d399', border: 'rgba(52,211,153,0.25)'  },
  UNPAID:  { label: 'Unpaid',   bg: 'rgba(248,113,113,0.1)', text: '#f87171', border: 'rgba(248,113,113,0.25)' },
  PARTIAL: { label: 'Partial',  bg: 'rgba(251,191,36,0.1)',  text: '#fbbf24', border: 'rgba(251,191,36,0.25)'  },
  OVERPAID:{ label: 'Overpaid', bg: 'rgba(139,92,246,0.1)',  text: '#a78bfa', border: 'rgba(139,92,246,0.25)'  },
};

function StatusBadge({ status }: { status?: string | null }) {
  const s = (status ?? 'UNPAID').toUpperCase();
  const c = STATUS_CONFIG[s] ?? STATUS_CONFIG.UNPAID;
  return (
    <span style={{
      display: 'inline-block', padding: '0.18rem 0.6rem', borderRadius: 99,
      fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em',
      textTransform: 'uppercase', whiteSpace: 'nowrap',
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
    }}>
      {c.label}
    </span>
  );
}

function PaymentProgress({ paid, total }: { paid?: number | null; total?: number | null }) {
  if (!total) return <span style={{ color: 'var(--color-faint)', fontSize: '0.7rem' }}>—</span>;
  const pct = Math.min(100, Math.round(((paid ?? 0) / total) * 100));
  const color = pct === 100 ? '#34d399' : pct > 0 ? '#fbbf24' : '#f87171';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: 4, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden', minWidth: 60 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: '0.68rem', color, fontWeight: 600, flexShrink: 0 }}>{pct}%</span>
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function InvoiceDrawer({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const overdue = isOverdue(invoice.due_date, invoice.payment_status);
  const days = daysOverdue(invoice.due_date);

  const Row = ({ icon, label, value, accent, danger }: {
    icon: React.ReactNode; label: string; value: React.ReactNode; accent?: boolean; danger?: boolean;
  }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.7rem 0', borderBottom: '1px solid var(--color-border)',
    }}>
      <div style={{ color: 'var(--color-muted)', flexShrink: 0, width: 16, display: 'flex', justifyContent: 'center' }}>
        {icon}
      </div>
      <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', flex: '0 0 90px' }}>
        {label}
      </span>
      <span style={{
        fontSize: '0.8rem', fontWeight: 500, flex: 1,
        color: accent ? 'var(--color-accent)' : danger ? '#f87171' : 'var(--color-text)',
        textAlign: 'right',
      }}>
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
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--color-accent-soft)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
              <IconInvoice />
            </div>
            <div>
              <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-muted)', marginBottom: '0.1rem' }}>Invoice Detail</p>
              <h3 className="font-display" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>{invoice.invoice_number ?? `#${invoice.id}`}</h3>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.45rem', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', transition: 'all 0.15s' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border-hover)'; el.style.color = 'var(--color-text)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border)'; el.style.color = 'var(--color-muted)'; }}
          ><IconClose /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {overdue && (
            <div className="banner banner-error animate-fade-in">
              <span className="banner-icon">⚠</span>
              <p>This invoice is <strong>{days} day{days !== 1 ? 's' : ''} overdue</strong>. A reminder should be sent immediately.</p>
            </div>
          )}
          <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.125rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <StatusBadge status={invoice.payment_status} />
              <span className="font-display" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-accent)' }}>{formatCurrency(invoice.total_amount)}</span>
            </div>
            {(invoice.paid_amount != null || invoice.total_amount != null) && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>Payment progress</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>{formatCurrency(invoice.paid_amount)} of {formatCurrency(invoice.total_amount)}</span>
                </div>
                <PaymentProgress paid={invoice.paid_amount} total={invoice.total_amount} />
              </div>
            )}
          </div>
          <section>
            <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>Details</p>
            <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0 0.875rem' }}>
              <Row icon={<IconHash />}     label="Invoice #"  value={invoice.invoice_number ?? `#${invoice.id}`} />
              <Row icon={<IconUser />}     label="Customer"   value={invoice.customer_name ?? '—'} />
              {invoice.customer_email && <Row icon={<IconMail />}  label="Email"  value={invoice.customer_email} />}
              {invoice.customer_phone && <Row icon={<IconPhone />} label="Phone"  value={invoice.customer_phone} />}
              <Row icon={<IconCurrency />} label="Total"      value={formatCurrency(invoice.total_amount)} accent />
              {invoice.paid_amount != null && <Row icon={<IconCurrency />} label="Paid" value={formatCurrency(invoice.paid_amount)} accent />}
              <Row icon={<IconCalendar />} label="Invoice Dt" value={formatDate(invoice.invoice_date)} />
              <Row icon={<IconCalendar />} label="Due Date"   value={formatDate(invoice.due_date)} danger={overdue} />
              {invoice.document_id && <Row icon={<IconHash />} label="Doc ID" value={`#${invoice.document_id}`} />}
            </div>
          </section>
          {Object.entries(invoice).filter(([k]) =>
            !['id','invoice_number','customer_name','customer_email','customer_phone','total_amount','paid_amount','due_date','invoice_date','payment_status','document_id'].includes(k)
            && invoice[k] != null && String(invoice[k]).trim() !== ''
          ).length > 0 && (
            <section>
              <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>Additional Fields</p>
              <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0 0.875rem' }}>
                {Object.entries(invoice)
                  .filter(([k]) => !['id','invoice_number','customer_name','customer_email','customer_phone','total_amount','paid_amount','due_date','invoice_date','payment_status','document_id'].includes(k) && invoice[k] != null && String(invoice[k]).trim() !== '')
                  .map(([k, v]) => <Row key={k} icon={<IconHash />} label={k.replace(/_/g, ' ')} value={String(v)} />)
                }
              </div>
            </section>
          )}
        </div>
      </div>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </>
  );
}

// ─── Main Invoice Table ───────────────────────────────────────────────────────

const ALL_STATUSES: PaymentStatus[] = ['PAID', 'UNPAID', 'PARTIAL', 'OVERPAID'];

export default function InvoiceTable() {
  const { invoices, loading, refreshing, error, refresh, clearError } = useInvoices();

  const [selected, setSelected]           = useState<Invoice | null>(null);
  const [search, setSearch]               = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<PaymentStatus>>(new Set());
  const [sortKey, setSortKey]             = useState<'due_date' | 'total_amount' | 'invoice_date' | 'id'>('id');
  const [sortDir, setSortDir]             = useState<'asc' | 'desc'>('desc');
  const [overdueOnly, setOverdueOnly]     = useState(false);

  const toggleFilter = (s: PaymentStatus) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = invoices.filter(i => (i.payment_status ?? 'UNPAID').toUpperCase() === s).length;
    return acc;
  }, {} as Record<PaymentStatus, number>);

  const overdueCount = invoices.filter(i => isOverdue(i.due_date, i.payment_status)).length;

  const filtered = invoices
    .filter(i => {
      if (activeFilters.size > 0 && !activeFilters.has((i.payment_status ?? 'UNPAID').toUpperCase() as PaymentStatus)) return false;
      if (overdueOnly && !isOverdue(i.due_date, i.payment_status)) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          String(i.id).includes(s) ||
          (i.invoice_number ?? '').toLowerCase().includes(s) ||
          (i.customer_name ?? '').toLowerCase().includes(s) ||
          (i.customer_email ?? '').toLowerCase().includes(s)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let va: number, vb: number;
      if (sortKey === 'total_amount') { va = a.total_amount ?? 0; vb = b.total_amount ?? 0; }
      else if (sortKey === 'due_date') { va = new Date(a.due_date ?? 0).getTime(); vb = new Date(b.due_date ?? 0).getTime(); }
      else if (sortKey === 'invoice_date') { va = new Date(a.invoice_date ?? 0).getTime(); vb = new Date(b.invoice_date ?? 0).getTime(); }
      else { va = a.id; vb = b.id; }
      return sortDir === 'desc' ? vb - va : va - vb;
    });

  const SortTh = ({ col, label }: { col: typeof sortKey; label: string }) => (
    <th onClick={() => toggleSort(col)} style={{ padding: '0.6rem 1rem', textAlign: 'left', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: sortKey === col ? 'var(--color-accent)' : 'var(--color-muted)', whiteSpace: 'nowrap', background: 'var(--color-surface-2)', userSelect: 'none', transition: 'color 0.15s' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
        {label}
        {sortKey === col && <span style={{ transform: sortDir === 'asc' ? 'rotate(180deg)' : 'none', display: 'inline-flex', transition: 'transform 0.2s' }}><IconChevronDown /></span>}
      </span>
    </th>
  );

  const thStyle: React.CSSProperties = { padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.6rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted)', whiteSpace: 'nowrap', background: 'var(--color-surface-2)' };

  const totalAmount = invoices.reduce((s, i) => s + (i.total_amount ?? 0), 0);
  const totalPaid   = invoices.reduce((s, i) => s + (i.paid_amount ?? 0), 0);
  const totalUnpaid = totalAmount - totalPaid;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1200 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-accent)', marginBottom: '0.35rem' }}>Receivables</p>
          <h2 className="font-display" style={{ fontSize: 'clamp(1.375rem, 2.5vw, 1.75rem)', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>Invoices</h2>
        </div>
        <button onClick={refresh} disabled={refreshing || loading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.875rem', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.72rem', fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s' }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(52,211,153,0.3)'; el.style.color = 'var(--color-accent)'; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border)'; el.style.color = 'var(--color-muted)'; }}
        >
          {refreshing ? <Spinner size={13} /> : <IconRefresh />} Refresh
        </button>
      </div>

      {!loading && invoices.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.625rem' }}>
          {[
            { label: 'Total Invoices', value: invoices.length,  color: 'var(--color-text)',   fmt: false },
            { label: 'Total Value',    value: totalAmount,       color: 'var(--color-accent)',  fmt: true  },
            { label: 'Collected',      value: totalPaid,         color: '#34d399',              fmt: true  },
            { label: 'Outstanding',    value: totalUnpaid,       color: '#f87171',              fmt: true  },
            { label: 'Overdue',        value: overdueCount,      color: '#fbbf24',              fmt: false },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ animation: 'fadeSlideUp 0.4s var(--ease-out-expo) both' }}>
              <p className="font-display" style={{ fontSize: '1.35rem', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: '0.3rem' }}>
                {s.fmt ? formatCurrency(s.value as number) : s.value}
              </p>
              <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="banner banner-error animate-fade-in">
          <span className="banner-icon">⚠</span>
          <p>{error} — <button onClick={() => { clearError(); refresh(); }} style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Outfit, sans-serif', fontSize: 'inherit', padding: 0 }}>Retry</button></p>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 9, padding: '0.55rem 0.875rem', flex: '1 1 200px', maxWidth: 300 }}>
          <span style={{ color: 'var(--color-muted)', flexShrink: 0 }}><IconSearch /></span>
          <input type="text" placeholder="Search invoice, customer…" value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--color-text)', fontSize: '0.78rem', fontFamily: 'Outfit, sans-serif', flex: 1, minWidth: 0 }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', padding: 0 }}><IconClose /></button>}
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {ALL_STATUSES.map(s => {
            const cfg = STATUS_CONFIG[s];
            const active = activeFilters.has(s);
            return (
              <button key={s} onClick={() => toggleFilter(s)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem', borderRadius: 99, cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif', border: active ? `1px solid ${cfg.border}` : '1px solid var(--color-border)', background: active ? cfg.bg : 'transparent', color: active ? cfg.text : 'var(--color-muted)', transition: 'all 0.15s' }}>
                {cfg.label} <span style={{ opacity: 0.7 }}>({counts[s]})</span>
              </button>
            );
          })}
        </div>
        <button onClick={() => setOverdueOnly(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.75rem', borderRadius: 99, cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif', border: overdueOnly ? '1px solid rgba(251,191,36,0.4)' : '1px solid var(--color-border)', background: overdueOnly ? 'rgba(251,191,36,0.1)' : 'transparent', color: overdueOnly ? '#fbbf24' : 'var(--color-muted)', transition: 'all 0.15s' }}>
          ⚠ Overdue <span style={{ opacity: 0.7 }}>({overdueCount})</span>
        </button>
      </div>

      {(activeFilters.size > 0 || overdueOnly) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)' }}>Active filters:</span>
          {Array.from(activeFilters).map(s => (
            <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0.5rem', borderRadius: 99, fontSize: '0.65rem', background: STATUS_CONFIG[s].bg, color: STATUS_CONFIG[s].text, border: `1px solid ${STATUS_CONFIG[s].border}` }}>
              {STATUS_CONFIG[s].label}
              <button onClick={() => toggleFilter(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0, opacity: 0.7 }}><IconClose /></button>
            </span>
          ))}
          {overdueOnly && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0.5rem', borderRadius: 99, fontSize: '0.65rem', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
              Overdue only
              <button onClick={() => setOverdueOnly(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0, opacity: 0.7 }}><IconClose /></button>
            </span>
          )}
          <button onClick={() => { setActiveFilters(new Set()); setOverdueOnly(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.68rem', fontFamily: 'Outfit, sans-serif', textDecoration: 'underline', padding: 0 }}>Clear all</button>
        </div>
      )}

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '0.4rem' }}>{search || activeFilters.size > 0 || overdueOnly ? 'No invoices match your filters' : 'No invoices yet'}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-faint)' }}>{!search && activeFilters.size === 0 && !overdueOnly && 'Upload an invoice document to get started'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={thStyle}>Invoice #</th>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Status</th>
                  <SortTh col="total_amount" label="Amount" />
                  <th style={thStyle}>Progress</th>
                  <SortTh col="invoice_date" label="Invoice Date" />
                  <SortTh col="due_date" label="Due Date" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, i) => {
                  const overdue = isOverdue(inv.due_date, inv.payment_status);
                  return (
                    <tr key={inv.id} onClick={() => setSelected(inv)} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--color-border)' : 'none', cursor: 'pointer', transition: 'background 0.15s', animation: `fadeSlideUp 0.3s var(--ease-out-expo) ${Math.min(i, 15) * 0.025}s both`, background: overdue ? 'rgba(248,113,113,0.02)' : 'transparent' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = overdue ? 'rgba(248,113,113,0.02)' : 'transparent'}
                    >
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-accent)' }}>{inv.invoice_number ?? `#${inv.id}`}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--color-text)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.customer_name ?? '—'}</td>
                      <td style={{ padding: '0.75rem 1rem' }}><StatusBadge status={inv.payment_status} /></td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>{formatCurrency(inv.total_amount)}</td>
                      <td style={{ padding: '0.75rem 1rem', minWidth: 120 }}><PaymentProgress paid={inv.paid_amount} total={inv.total_amount} /></td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>{formatDate(inv.invoice_date)}</td>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.75rem', color: overdue ? '#f87171' : 'var(--color-muted)', fontWeight: overdue ? 600 : 400 }}>{formatDate(inv.due_date)}</span>
                        {overdue && <span style={{ marginLeft: '0.4rem', fontSize: '0.6rem', color: '#f87171', fontWeight: 700 }}>+{daysOverdue(inv.due_date)}d</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: '0.625rem 1rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '0.68rem', color: 'var(--color-muted)' }}>{filtered.length} invoice{filtered.length !== 1 ? 's' : ''}{(activeFilters.size > 0 || overdueOnly || search) && ` (filtered from ${invoices.length})`}</p>
            <p style={{ fontSize: '0.68rem', color: 'var(--color-muted)' }}>Click any row to view details</p>
          </div>
        )}
      </div>

      {selected && <InvoiceDrawer invoice={selected} onClose={() => setSelected(null)} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
