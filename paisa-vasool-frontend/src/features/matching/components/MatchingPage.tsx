import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import {fetchMatchesThunk,fetchUnmatchedPaymentsThunk,fetchUnmatchedInvoicesThunk,setRefreshing,} from '../slices/matchingSlice';


type MatchStatus = 'FULL' | 'PARTIAL' | 'OVERPAYMENT' | 'DUPLICATE' | 'FAILED';

type MatchRecord = {
  id: number;
  payment_detail_id: number;
  invoice_id: number;
  match_status: MatchStatus;
  matched_amount?: number | null;
  discrepancy_amount?: number | null;
  match_notes?: string | null;
  created_at: string;
  [key: string]: unknown;
};

type PaymentDetail = {
  id: number;
  amount?: number | null;
  payer_name?: string | null;
  payment_date?: string | null;
  reference_number?: string | null;
  bank_name?: string | null;
  [key: string]: unknown;
};

type InvoiceData = {
  id: number;
  invoice_number?: string | null;
  customer_name?: string | null;
  total_amount?: number | null;
  due_date?: string | null;
  payment_status?: string | null;
  [key: string]: unknown;
};




const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconPartial = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconOver = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);
const IconDuplicate = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const IconFailed = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconClose = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconInvoice = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IconPayment = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IconUnmatched = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
  </svg>
);
const IconChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);




const STATUS_CONFIG: Record<MatchStatus, {
  label: string; icon: React.ReactNode;
  bg: string; text: string; border: string;
}> = {
  FULL:        { label: 'Fully Paid',  icon: <IconCheck />,     bg: 'rgba(52,211,153,0.1)',  text: '#34d399', border: 'rgba(52,211,153,0.25)'  },
  PARTIAL:     { label: 'Partial',     icon: <IconPartial />,   bg: 'rgba(251,191,36,0.1)',  text: '#fbbf24', border: 'rgba(251,191,36,0.25)'  },
  OVERPAYMENT: { label: 'Overpayment', icon: <IconOver />,      bg: 'rgba(139,92,246,0.1)',  text: '#a78bfa', border: 'rgba(139,92,246,0.25)'  },
  DUPLICATE:   { label: 'Duplicate',   icon: <IconDuplicate />, bg: 'rgba(251,146,60,0.1)',  text: '#fb923c', border: 'rgba(251,146,60,0.25)'  },
  FAILED:      { label: 'Failed',      icon: <IconFailed />,    bg: 'rgba(248,113,113,0.1)', text: '#f87171', border: 'rgba(248,113,113,0.25)' },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as MatchStatus[];

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

function StatusBadge({ status }: { status: MatchStatus }) {
  const c = STATUS_CONFIG[status];
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


function DetailDrawer({
  match, onClose,
}: {
  match: MatchRecord;
  onClose: () => void;
}) {
  const [invoice, setInvoice]   = useState<InvoiceData | null>(null);
  const [payment, setPayment]   = useState<PaymentDetail | null>(null);
  const [loading, setLoading]   = useState(true);

  const BASE = '/api/v1/payment_intake_matching';

  useEffect(() => {
  const fetchDetails = async () => {
    setLoading(true);
    try {
      const BASE = '/api/v1/payment_intake_matching/matching';
      const [invRes, payRes] = await Promise.all([
        fetch(`${BASE}/invoice-detail/${match.invoice_id}`, { credentials: 'include' }),
        fetch(`${BASE}/payment-detail/${match.payment_detail_id}`, { credentials: 'include' }),
      ]);

      if (invRes.ok) { const d = await invRes.json(); setInvoice(d); }
      if (payRes.ok) { const d = await payRes.json(); setPayment(d); }
    } catch {}
    finally { setLoading(false); }
  };
  fetchDetails();
}, [match.id]);

  const cfg = STATUS_CONFIG[match.match_status];

  const Row = ({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', padding: '0.6rem 0', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.78rem', fontWeight: 500, color: accent ? cfg.text : 'var(--color-text)', textAlign: 'right' }}>{value}</span>
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
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.text,
            }}>
              {cfg.icon}
            </div>
            <div>
              <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-muted)', marginBottom: '0.1rem' }}>Match #{match.id}</p>
              <h3 className="font-display" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                Match Detail
              </h3>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid var(--color-border)', borderRadius: 8,
            padding: '0.45rem', cursor: 'pointer', color: 'var(--color-muted)',
            display: 'flex', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border-hover)'; el.style.color = 'var(--color-text)'; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border)'; el.style.color = 'var(--color-muted)'; }}
          >
            <IconClose />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <section>
            <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: '0.75rem' }}>Match Summary</p>
            <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0.25rem 0.875rem' }}>
              <Row label="Status"    value={<StatusBadge status={match.match_status} />} />
              <Row label="Matched"   value={formatCurrency(match.matched_amount)} accent />
              {match.discrepancy_amount != null && match.discrepancy_amount !== 0 && (
                <Row label="Discrepancy" value={formatCurrency(match.discrepancy_amount)} accent />
              )}
              <Row label="Invoice #" value={`#${match.invoice_id}`} />
              <Row label="Payment #" value={`#${match.payment_detail_id}`} />
              <Row label="Matched"   value={timeAgo(match.created_at)} />
              {match.match_notes && (
                <div style={{ padding: '0.75rem 0' }}>
                  <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: '0.4rem' }}>Notes</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text)', lineHeight: 1.6, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.625rem 0.75rem' }}>
                    {match.match_notes}
                  </p>
                </div>
              )}
            </div>
          </section>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Spinner /></div>
          ) : (
            <>
              {invoice && (
                <section>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ color: 'var(--color-accent)' }}><IconInvoice /></span>
                    <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)' }}>Invoice Details</p>
                  </div>
                  <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0.25rem 0.875rem' }}>
                    {invoice.invoice_number && <Row label="Invoice No"  value={invoice.invoice_number} />}
                    {invoice.customer_name  && <Row label="Customer"    value={invoice.customer_name} />}
                    {invoice.total_amount   != null && <Row label="Total"    value={formatCurrency(invoice.total_amount)} accent />}
                    {invoice.due_date       && <Row label="Due Date"    value={formatDate(invoice.due_date)} />}
                    {invoice.payment_status && <Row label="Pay Status"  value={invoice.payment_status} />}
                  </div>
                </section>
              )}

              {payment && (
                <section>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ color: 'var(--color-accent)' }}><IconPayment /></span>
                    <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)' }}>Payment Details</p>
                  </div>
                  <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0.25rem 0.875rem' }}>
                    {payment.payer_name        && <Row label="Payer"      value={payment.payer_name} />}
                    {payment.amount            != null && <Row label="Amount"  value={formatCurrency(payment.amount)} accent />}
                    {payment.payment_date      && <Row label="Date"       value={formatDate(payment.payment_date)} />}
                    {payment.reference_number  && <Row label="Reference"  value={payment.reference_number} />}
                    {payment.bank_name         && <Row label="Bank"       value={payment.bank_name} />}
                  </div>
                </section>
              )}

              {!invoice && !payment && (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.78rem' }}>
                  Detailed invoice/payment records not available
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </>
  );
}


function UnmatchedTab({ type }: { type: 'payments' | 'invoices' }) {
  const dispatch = useAppDispatch();
  const { unmatchedPayments, unmatchedInvoices, unmatchedPaymentsLoading, unmatchedInvoicesLoading } = useAppSelector(s => s.matching);
  const rows = type === 'payments' ? unmatchedPayments : unmatchedInvoices;
  const loading = type === 'payments' ? unmatchedPaymentsLoading : unmatchedInvoicesLoading;
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (type === 'payments') dispatch(fetchUnmatchedPaymentsThunk());
    else dispatch(fetchUnmatchedInvoicesThunk());
  }, [type, dispatch]);

  const filtered = rows.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return Object.values(r).some(v => String(v ?? '').toLowerCase().includes(s));
  });

  const thStyle: React.CSSProperties = {
    padding: '0.6rem 1rem', textAlign: 'left',
    fontSize: '0.6rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif',
    textTransform: 'uppercase', letterSpacing: '0.1em',
    color: 'var(--color-muted)', whiteSpace: 'nowrap',
    background: 'var(--color-surface-2)',
  };
  const tdStyle: React.CSSProperties = {
    padding: '0.7rem 1rem', color: 'var(--color-text)',
    fontSize: '0.78rem', whiteSpace: 'nowrap',
    maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.625rem',
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 9, padding: '0.6rem 0.875rem',
        maxWidth: 340,
      }}>
        <span style={{ color: 'var(--color-muted)', flexShrink: 0 }}><IconSearch /></span>
        <input
          type="text" placeholder={`Search ${type}…`} value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--color-text)', fontSize: '0.8rem', fontFamily: 'Outfit, sans-serif', flex: 1, minWidth: 0 }}
        />
      </div>

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>{search ? 'No results found' : `All ${type} matched!`}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {type === 'payments' ? (
                    <><th style={thStyle}>ID</th><th style={thStyle}>Payer</th><th style={thStyle}>Amount</th><th style={thStyle}>Date</th><th style={thStyle}>Reference</th></>
                  ) : (
                    <><th style={thStyle}>Invoice #</th><th style={thStyle}>Customer</th><th style={thStyle}>Amount</th><th style={thStyle}>Due Date</th><th style={thStyle}>Status</th></>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.id}
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--color-border)' : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    {type === 'payments' ? (
                      <>
                        <td style={tdStyle}><span style={{ color: 'var(--color-muted)' }}>#{row.id}</span></td>
                        <td style={tdStyle}>{(row as PaymentDetail).payer_name ?? '—'}</td>
                        <td style={{ ...tdStyle, color: 'var(--color-accent)', fontWeight: 600 }}>{formatCurrency((row as PaymentDetail).amount)}</td>
                        <td style={tdStyle}>{formatDate((row as PaymentDetail).payment_date)}</td>
                        <td style={{ ...tdStyle, color: 'var(--color-muted)', fontSize: '0.7rem' }}>{(row as PaymentDetail).reference_number ?? '—'}</td>
                      </>
                    ) : (
                      <>
                        <td style={{ ...tdStyle, color: 'var(--color-accent)', fontWeight: 500 }}>{(row as InvoiceData).invoice_number ?? `#${row.id}`}</td>
                        <td style={tdStyle}>{(row as InvoiceData).customer_name ?? '—'}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{formatCurrency((row as InvoiceData).total_amount)}</td>
                        <td style={{ ...tdStyle, color: new Date((row as InvoiceData).due_date ?? '') < new Date() ? '#f87171' : 'var(--color-text)' }}>
                          {formatDate((row as InvoiceData).due_date)}
                        </td>
                        <td style={tdStyle}>
                          <span style={{ padding: '0.15rem 0.5rem', borderRadius: 99, fontSize: '0.62rem', fontWeight: 700, background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', textTransform: 'uppercase' }}>
                            {(row as InvoiceData).payment_status ?? 'UNPAID'}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p style={{ fontSize: '0.68rem', color: 'var(--color-faint)' }}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  );
}


function AllMatchesTab() {
  const dispatch = useAppDispatch();
  const { matches, loading, refreshing } = useAppSelector(s => s.matching);
  const [selected, setSelected]       = useState<MatchRecord | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<MatchStatus>>(new Set());
  const [search, setSearch]           = useState('');
  const [sortDir, setSortDir]         = useState<'asc' | 'desc'>('desc');

  const fetchMatches = (silent = false) => {
    if (silent) dispatch(setRefreshing(true));
    dispatch(fetchMatchesThunk());
  };

  useEffect(() => { dispatch(fetchMatchesThunk()); }, [dispatch]);

  const toggleFilter = (s: MatchStatus) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = matches.filter(m => m.match_status === s).length;
    return acc;
  }, {} as Record<MatchStatus, number>);

  const filtered = matches
    .filter(m => activeFilters.size === 0 || activeFilters.has(m.match_status))
    .filter(m => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        String(m.id).includes(s) ||
        String(m.invoice_id).includes(s) ||
        String(m.payment_detail_id).includes(s) ||
        m.match_status.toLowerCase().includes(s)
      );
    })
    .sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sortDir === 'desc' ? tb - ta : ta - tb;
    });

  const thStyle: React.CSSProperties = {
    padding: '0.6rem 1rem', textAlign: 'left',
    fontSize: '0.6rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif',
    textTransform: 'uppercase', letterSpacing: '0.1em',
    color: 'var(--color-muted)', whiteSpace: 'nowrap',
    background: 'var(--color-surface-2)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 9, padding: '0.55rem 0.875rem', flex: '1 1 200px', maxWidth: 280,
        }}>
          <span style={{ color: 'var(--color-muted)', flexShrink: 0 }}><IconSearch /></span>
          <input
            type="text" placeholder="Search by ID, invoice, payment…" value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--color-text)', fontSize: '0.78rem', fontFamily: 'Outfit, sans-serif', flex: 1, minWidth: 0 }}
          />
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
                textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif',
                border: active ? `1px solid ${cfg.border}` : '1px solid var(--color-border)',
                background: active ? cfg.bg : 'transparent',
                color: active ? cfg.text : 'var(--color-muted)',
                transition: 'all 0.15s',
              }}>
                {cfg.icon}
                {cfg.label}
                <span style={{ opacity: 0.7 }}>({counts[s]})</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto' }}>
          <button onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')} style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.75rem',
            borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)',
            cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.7rem', fontFamily: 'Outfit, sans-serif',
            transition: 'all 0.15s',
          }}>
            <IconChevronDown /> {sortDir === 'desc' ? 'Newest' : 'Oldest'}
          </button>
          <button onClick={() => fetchMatches(true)} style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.75rem',
            borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)',
            cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.7rem', fontFamily: 'Outfit, sans-serif',
            transition: 'all 0.15s',
          }}>
            {refreshing ? <Spinner size={13} /> : <IconRefresh />}
          </button>
        </div>
      </div>

      {activeFilters.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
          <button onClick={() => setActiveFilters(new Set())} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-muted)', fontSize: '0.68rem', fontFamily: 'Outfit, sans-serif',
            textDecoration: 'underline', padding: 0,
          }}>
            Clear all
          </button>
        </div>
      )}

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3.5rem' }}><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)', marginBottom: '0.3rem' }}>No matches found</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-faint)' }}>
              {activeFilters.size > 0 ? 'Try removing some filters' : 'Upload documents to start matching'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={thStyle}>Match ID</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Invoice</th>
                  <th style={thStyle}>Payment</th>
                  <th style={thStyle}>Matched Amt</th>
                  <th style={thStyle}>Discrepancy</th>
                  <th style={thStyle}>When</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid var(--color-border)' : 'none',
                      cursor: 'pointer', transition: 'background 0.15s',
                      animation: `fadeSlideUp 0.3s var(--ease-out-expo) ${Math.min(i, 10) * 0.03}s both`,
                    }}
                    onClick={() => setSelected(m)}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <td style={{ padding: '0.7rem 1rem', fontSize: '0.72rem', color: 'var(--color-muted)' }}>
                      #{m.id}
                    </td>
                    <td style={{ padding: '0.7rem 1rem' }}>
                      <StatusBadge status={m.match_status} />
                    </td>
                    <td style={{ padding: '0.7rem 1rem', fontSize: '0.78rem', color: 'var(--color-text)', fontWeight: 500 }}>
                      #{m.invoice_id}
                    </td>
                    <td style={{ padding: '0.7rem 1rem', fontSize: '0.78rem', color: 'var(--color-text)', fontWeight: 500 }}>
                      #{m.payment_detail_id}
                    </td>
                    <td style={{ padding: '0.7rem 1rem', fontSize: '0.78rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                      {formatCurrency(m.matched_amount)}
                    </td>
                    <td style={{ padding: '0.7rem 1rem', fontSize: '0.78rem', color: m.discrepancy_amount ? '#f87171' : 'var(--color-faint)' }}>
                      {m.discrepancy_amount ? formatCurrency(m.discrepancy_amount) : '—'}
                    </td>
                    <td style={{ padding: '0.7rem 1rem', fontSize: '0.72rem', color: 'var(--color-muted)' }}>
                      {timeAgo(m.created_at)}
                    </td>
                    <td style={{ padding: '0.7rem 1rem', textAlign: 'right' }}>
                      <span style={{
                        fontSize: '0.68rem', color: 'var(--color-accent)', fontWeight: 500,
                        background: 'var(--color-accent-soft)', border: '1px solid rgba(52,211,153,0.2)',
                        padding: '0.15rem 0.55rem', borderRadius: 99,
                      }}>
                        View →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p style={{ fontSize: '0.68rem', color: 'var(--color-faint)' }}>
        {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        {activeFilters.size > 0 && ` (filtered from ${matches.length})`}
      </p>

      {selected && <DetailDrawer match={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

type TabKey = 'all' | 'unmatched-payments' | 'unmatched-invoices';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'all',                label: 'All Matches',         icon: <IconCheck /> },
  { key: 'unmatched-payments', label: 'Unmatched Payments',  icon: <IconPayment /> },
  { key: 'unmatched-invoices', label: 'Unmatched Invoices',  icon: <IconInvoice /> },
];

export default function MatchingPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const tabStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '0.45rem',
    padding: '0.6rem 1rem', borderRadius: 9, cursor: 'pointer',
    border: active ? '1px solid rgba(52,211,153,0.25)' : '1px solid transparent',
    background: active ? 'var(--color-accent-soft)' : 'transparent',
    color: active ? 'var(--color-accent)' : 'var(--color-muted)',
    fontSize: '0.78rem', fontWeight: active ? 600 : 400,
    fontFamily: 'Outfit, sans-serif', transition: 'all 0.18s',
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1100 }}>

      <div>
        <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-accent)', marginBottom: '0.4rem' }}>
          Reconciliation
        </p>
        <h2 className="font-display" style={{ fontSize: 'clamp(1.375rem, 2.5vw, 1.75rem)', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
          Matching
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
          Full audit trail of all invoice-to-payment matches. Click any row to drill down.
        </p>
      </div>

      <div style={{
        display: 'flex', gap: '0.25rem', flexWrap: 'wrap',
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 11, padding: '0.3rem',
        width: 'fit-content',
      }}>
        {TABS.map(t => (
          <button key={t.key} style={tabStyle(activeTab === t.key)} onClick={() => setActiveTab(t.key)}>
            <span style={{ display: 'flex' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div key={activeTab} style={{ animation: 'fadeSlideUp 0.3s var(--ease-out-expo) both' }}>
        {activeTab === 'all'                && <AllMatchesTab />}
        {activeTab === 'unmatched-payments' && <UnmatchedTab type="payments" />}
        {activeTab === 'unmatched-invoices' && <UnmatchedTab type="invoices" />}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}