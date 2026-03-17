import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import {
  fetchMatchesThunk,
  fetchUnmatchedPaymentsThunk,
  fetchUnmatchedInvoicesThunk,
  setRefreshing,
} from '../slices/matchingSlice';

type MatchStatus = 'FULL' | 'PARTIAL' | 'OVERPAYMENT' | 'FAILED';

type MatchRecord = {
  id: number;
  payment_detail_id: number;
  invoice_id: number;
  match_status: MatchStatus;
  matched_amount?: number | null;
  amount_pending?: number | null;
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
  payer_email?: string | null;
  payer_phone?: string | null;
  payment_mode?: string | null;
  notes?: string | null;
  [key: string]: unknown;
};

type InvoiceData = {
  id: number;
  invoice_number?: string | null;
  customer_name?: string | null;
  total_amount?: number | null;
  paid_amount?: number | null;
  due_date?: string | null;
  invoice_date?: string | null;
  payment_status?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  [key: string]: unknown;
};

type DetailCache = {
  invoices: Record<number, InvoiceData>;
  payments: Record<number, PaymentDetail>;
};

/* Icons */
const IconCheck       = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IconPartial     = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
const IconOver        = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>);
const IconFailed      = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IconClose       = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IconRefresh     = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>);
const IconSearch      = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const IconInvoice     = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>);
const IconPayment     = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>);
const IconChevronDown  = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>);
const IconChevronLeft  = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>);
const IconChevronRight = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>);
const IconTable       = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>);
const IconBucket      = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="6" height="18" rx="1"/><rect x="9" y="3" width="6" height="18" rx="1"/><rect x="16" y="3" width="6" height="18" rx="1"/></svg>);
const IconUser        = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IconMail        = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>);
const IconPhone       = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>);
const IconCalendar    = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const IconCurrency    = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const IconBank        = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>);
const IconHash        = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>);
const IconNote        = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>);
const IconMode        = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>);

/* Status / Mode configs */
const STATUS_CONFIG: Record<MatchStatus, { label: string; icon: React.ReactNode; bg: string; text: string; border: string; headerBg: string }> = {
  FULL:        { label: 'Fully Paid',  icon: <IconCheck />,   bg: 'rgba(52,211,153,0.08)',  text: '#34d399', border: 'rgba(52,211,153,0.25)',  headerBg: 'rgba(52,211,153,0.06)'  },
  PARTIAL:     { label: 'Partial',     icon: <IconPartial />, bg: 'rgba(251,191,36,0.08)',  text: '#fbbf24', border: 'rgba(251,191,36,0.25)',  headerBg: 'rgba(251,191,36,0.06)'  },
  OVERPAYMENT: { label: 'Overpayment', icon: <IconOver />,    bg: 'rgba(139,92,246,0.08)',  text: '#a78bfa', border: 'rgba(139,92,246,0.25)',  headerBg: 'rgba(139,92,246,0.06)'  },
  FAILED:      { label: 'Failed',      icon: <IconFailed />,  bg: 'rgba(248,113,113,0.08)', text: '#f87171', border: 'rgba(248,113,113,0.25)', headerBg: 'rgba(248,113,113,0.06)' },
};

const MODE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  UPI:    { label: 'UPI',    bg: 'rgba(52,211,153,0.1)',   text: '#34d399', border: 'rgba(52,211,153,0.25)'  },
  NEFT:   { label: 'NEFT',   bg: 'rgba(96,165,250,0.1)',   text: '#60a5fa', border: 'rgba(96,165,250,0.25)'  },
  RTGS:   { label: 'RTGS',   bg: 'rgba(139,92,246,0.1)',   text: '#a78bfa', border: 'rgba(139,92,246,0.25)'  },
  IMPS:   { label: 'IMPS',   bg: 'rgba(251,191,36,0.1)',   text: '#fbbf24', border: 'rgba(251,191,36,0.25)'  },
  CHEQUE: { label: 'Cheque', bg: 'rgba(251,146,60,0.1)',   text: '#fb923c', border: 'rgba(251,146,60,0.25)'  },
  CASH:   { label: 'Cash',   bg: 'rgba(52,211,153,0.08)',  text: '#6ee7b7', border: 'rgba(52,211,153,0.2)'   },
  OTHER:  { label: 'Other',  bg: 'rgba(100,116,139,0.08)', text: 'var(--color-muted)', border: 'var(--color-border)' },
};

const INVOICE_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  PAID:     { label: 'Paid',     bg: 'rgba(52,211,153,0.1)',  text: '#34d399', border: 'rgba(52,211,153,0.25)'  },
  UNPAID:   { label: 'Unpaid',   bg: 'rgba(248,113,113,0.1)', text: '#f87171', border: 'rgba(248,113,113,0.25)' },
  PARTIAL:  { label: 'Partial',  bg: 'rgba(251,191,36,0.1)',  text: '#fbbf24', border: 'rgba(251,191,36,0.25)'  },
  OVERPAID: { label: 'Overpaid', bg: 'rgba(139,92,246,0.1)',  text: '#a78bfa', border: 'rgba(139,92,246,0.25)'  },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as MatchStatus[];
const PAGE_SIZE_OPTIONS = [10, 25, 50];

/* Helpers */
function Spinner({ size = 18, color = 'var(--color-accent)' }: { size?: number; color?: string }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${color}22`, borderTopColor: color, animation: 'spin 0.65s linear infinite', flexShrink: 0 }} />;
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
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: 99, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {c.icon} {c.label}
    </span>
  );
}
function InvoiceStatusBadge({ status }: { status?: string | null }) {
  const s = (status ?? 'UNPAID').toUpperCase();
  const c = INVOICE_STATUS_CONFIG[s] ?? INVOICE_STATUS_CONFIG.UNPAID;
  return <span style={{ display: 'inline-block', padding: '0.18rem 0.6rem', borderRadius: 99, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{c.label}</span>;
}
function ModeBadge({ mode }: { mode?: string | null }) {
  if (!mode) return <span style={{ color: 'var(--color-faint)', fontSize: '0.72rem' }}>—</span>;
  const c = MODE_CONFIG[mode.toUpperCase()] ?? MODE_CONFIG.OTHER;
  return <span style={{ display: 'inline-block', padding: '0.18rem 0.6rem', borderRadius: 99, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{c.label}</span>;
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
      <span style={{ fontSize: '0.65rem', color, fontWeight: 600, flexShrink: 0 }}>{pct}%</span>
    </div>
  );
}

/* Pagination */
function Pagination({ total, page, pageSize, onPage, onPageSize }: {
  total: number; page: number; pageSize: number;
  onPage: (p: number) => void; onPageSize: (s: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 30, height: 30, borderRadius: 7, border: '1px solid var(--color-border)',
    background: 'var(--color-surface)', cursor: 'pointer', color: 'var(--color-muted)',
    fontSize: '0.72rem', fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s',
  };

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--color-faint)' }}>
          {total === 0 ? '0 records' : `${from}–${to} of ${total}`}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>Rows</span>
          <select value={pageSize} onChange={e => { onPageSize(Number(e.target.value)); onPage(1); }}
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '0.2rem 0.4rem', fontSize: '0.68rem', color: 'var(--color-text)', fontFamily: 'Outfit, sans-serif', cursor: 'pointer', outline: 'none' }}>
            {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          style={{ ...btnBase, opacity: page === 1 ? 0.35 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
          <IconChevronLeft />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} style={{ width: 30, textAlign: 'center', fontSize: '0.72rem', color: 'var(--color-faint)' }}>…</span>
          ) : (
            <button key={p} onClick={() => onPage(p as number)} style={{
              ...btnBase,
              background: p === page ? 'var(--color-accent)' : 'var(--color-surface)',
              color: p === page ? '#fff' : 'var(--color-muted)',
              border: p === page ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
              fontWeight: p === page ? 700 : 400,
            }}>{p}</button>
          )
        )}
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
          style={{ ...btnBase, opacity: page === totalPages ? 0.35 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>
          <IconChevronRight />
        </button>
      </div>
    </div>
  );
}

/* Detail Drawer — portaled to document.body so it always covers full viewport */
function DetailDrawer({ match, onClose }: { match: MatchRecord; onClose: () => void }) {
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);

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

  const Row = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent?: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ color: 'var(--color-muted)', flexShrink: 0, width: 16, display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', flex: '0 0 90px' }}>{label}</span>
      <span style={{ fontSize: '0.8rem', fontWeight: 500, flex: 1, color: accent ? 'var(--color-accent)' : 'var(--color-text)', textAlign: 'right' }}>{value}</span>
    </div>
  );

  const SectionLabel = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.625rem' }}>
      <span style={{ color: 'var(--color-muted)' }}>{icon}</span>
      <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', fontWeight: 600 }}>{text}</p>
    </div>
  );

  const drawerTitle = loading
    ? 'Match Detail'
    : (invoice?.invoice_number ?? invoice?.customer_name ?? payment?.payer_name ?? 'Match Detail');

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', zIndex: 40 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 500,
        background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)',
        zIndex: 50, display: 'flex', flexDirection: 'column',
        boxShadow: '-16px 0 48px rgba(0,0,0,0.35)',
        animation: 'slideInRight 0.28s var(--ease-out-expo) both',
      }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.bg, border: `1.5px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.text }}>{cfg.icon}</div>
            <div>
              <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-muted)', marginBottom: '0.15rem' }}>MATCH DETAIL</p>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>{drawerTitle}</h3>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-text)'; el.style.color = 'var(--color-text)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border)'; el.style.color = 'var(--color-muted)'; }}
          ><IconClose /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* Match status card */}
          <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: '0.45rem' }}>MATCH STATUS</p>
              <StatusBadge status={match.match_status} />
              <p style={{ fontSize: '0.68rem', color: 'var(--color-muted)', marginTop: '0.5rem' }}>{timeAgo(match.created_at)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted)', marginBottom: '0.3rem' }}>MATCHED AMOUNT</p>
              <p className="font-display" style={{ fontSize: '1.75rem', fontWeight: 800, color: cfg.text, lineHeight: 1 }}>{formatCurrency(match.matched_amount)}</p>
              {match.amount_pending != null && match.amount_pending !== 0 && (
                <p style={{ fontSize: '0.68rem', color: '#f87171', marginTop: '0.3rem', fontWeight: 600 }}>Δ {formatCurrency(match.amount_pending)} discrepancy</p>
              )}
            </div>
          </div>

          {match.match_notes && (
            <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0.875rem 1rem', display: 'flex', gap: '0.625rem' }}>
              <span style={{ color: 'var(--color-muted)', flexShrink: 0, marginTop: '0.1rem' }}><IconNote /></span>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text)', lineHeight: 1.65 }}>{match.match_notes}</p>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Spinner /></div>
          ) : (
            <>
              {invoice && (
                <section>
                  <SectionLabel icon={<IconInvoice />} text="Invoice Details" />
                  <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div>
                      <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: '0.45rem' }}>INVOICE AMOUNT</p>
                      <p className="font-display" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1 }}>{formatCurrency(invoice.total_amount)}</p>
                      {invoice.invoice_date && <p style={{ fontSize: '0.68rem', color: 'var(--color-muted)', marginTop: '0.4rem' }}>issued {formatDate(invoice.invoice_date)}</p>}
                    </div>
                    <InvoiceStatusBadge status={invoice.payment_status} />
                  </div>
                  {invoice.paid_amount != null && invoice.total_amount != null && (
                    <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>Payment progress</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>{formatCurrency(invoice.paid_amount)} / {formatCurrency(invoice.total_amount)}</span>
                      </div>
                      <PaymentProgress paid={invoice.paid_amount} total={invoice.total_amount} />
                    </div>
                  )}
                  <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0 0.875rem' }}>
                    {invoice.invoice_number && <Row icon={<IconHash />}     label="Invoice No" value={invoice.invoice_number} />}
                    {invoice.customer_name  && <Row icon={<IconUser />}     label="Customer"   value={invoice.customer_name} />}
                    {invoice.customer_email && <Row icon={<IconMail />}     label="Email"      value={invoice.customer_email} />}
                    {invoice.customer_phone && <Row icon={<IconPhone />}    label="Phone"      value={invoice.customer_phone} />}
                    {invoice.total_amount   != null && <Row icon={<IconCurrency />} label="Total"  value={formatCurrency(invoice.total_amount)} accent />}
                    {invoice.paid_amount    != null && <Row icon={<IconCurrency />} label="Paid"   value={formatCurrency(invoice.paid_amount)} accent />}
                    {invoice.due_date       && <Row icon={<IconCalendar />} label="Due Date"   value={formatDate(invoice.due_date)} />}
                  </div>
                </section>
              )}

              {payment && (
                <section>
                  <SectionLabel icon={<IconPayment />} text="Payment Details" />
                  <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div>
                      <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: '0.45rem' }}>AMOUNT RECEIVED</p>
                      <p className="font-display" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1 }}>{formatCurrency(payment.amount)}</p>
                      {payment.payment_date && <p style={{ fontSize: '0.68rem', color: 'var(--color-muted)', marginTop: '0.4rem' }}>on {formatDate(payment.payment_date)}</p>}
                    </div>
                    <ModeBadge mode={payment.payment_mode} />
                  </div>
                  {(payment.payer_name || payment.payer_email || payment.payer_phone) && (
                    <>
                      <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: '0.5rem', marginTop: '0.25rem' }}>PAYER INFORMATION</p>
                      <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0 0.875rem', marginBottom: '0.5rem' }}>
                        {payment.payer_name  && <Row icon={<IconUser />}  label="Payer" value={payment.payer_name} />}
                        {payment.payer_email && <Row icon={<IconMail />}  label="Email" value={payment.payer_email} />}
                        {payment.payer_phone && <Row icon={<IconPhone />} label="Phone" value={payment.payer_phone} />}
                      </div>
                    </>
                  )}
                  <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>TRANSACTION</p>
                  <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0 0.875rem' }}>
                    {payment.amount           != null && <Row icon={<IconCurrency />} label="Amount"    value={formatCurrency(payment.amount)} accent />}
                    {payment.payment_date     && <Row icon={<IconCalendar />} label="Date"      value={formatDate(payment.payment_date)} />}
                    {payment.reference_number && <Row icon={<IconHash />}     label="Reference" value={payment.reference_number} />}
                    {payment.bank_name        && <Row icon={<IconBank />}     label="Bank"      value={payment.bank_name} />}
                    {payment.payment_mode     && <Row icon={<IconMode />}     label="Mode"      value={<ModeBadge mode={payment.payment_mode} />} />}
                  </div>
                  {payment.notes && (
                    <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0.875rem 1rem', display: 'flex', gap: '0.625rem', marginTop: '0.5rem' }}>
                      <span style={{ color: 'var(--color-muted)', flexShrink: 0, marginTop: '0.1rem' }}><IconNote /></span>
                      <p style={{ fontSize: '0.78rem', color: 'var(--color-text)', lineHeight: 1.65 }}>{payment.notes}</p>
                    </div>
                  )}
                </section>
              )}

              {!invoice && !payment && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.78rem' }}>Detailed records not available</div>
              )}
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </>,
    document.body
  );
}

/* Match Card (Bucket) */
function MatchCard({ match, onSelect, index, cache }: { match: MatchRecord; onSelect: (m: MatchRecord) => void; index: number; cache: DetailCache }) {
  const cfg = STATUS_CONFIG[match.match_status];
  const [hovered, setHovered] = useState(false);
  const invoice = cache.invoices[match.invoice_id];
  const payment = cache.payments[match.payment_detail_id];
  const invoiceLabel = invoice ? (invoice.invoice_number ?? invoice.customer_name ?? '—') : '—';
  const invoiceSub   = invoice?.customer_name && invoice?.invoice_number ? invoice.customer_name : null;
  const payerLabel   = payment ? (payment.payer_name ?? '—') : '—';
  const payerSub     = payment?.reference_number ?? null;
  return (
    <div onClick={() => onSelect(match)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? 'var(--color-surface-2)' : 'var(--color-surface)', border: `1px solid ${hovered ? cfg.border : 'var(--color-border)'}`, borderRadius: 10, padding: '0.75rem 0.875rem', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: '0.55rem', animation: `fadeSlideUp 0.3s var(--ease-out-expo) ${Math.min(index, 12) * 0.04}s both` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.63rem', color: 'var(--color-muted)', fontFamily: 'Outfit, sans-serif' }}>{formatDate(match.created_at)}</span>
        <span style={{ fontSize: '0.62rem', color: 'var(--color-faint)', fontFamily: 'Outfit, sans-serif' }}>{timeAgo(match.created_at)}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 7, padding: '0.35rem 0.6rem' }}>
        <span style={{ color: 'var(--color-muted)', display: 'flex', marginTop: '0.1rem', flexShrink: 0 }}><IconInvoice /></span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text)', fontFamily: 'Outfit, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{invoiceLabel}</div>
          {invoiceSub && <div style={{ fontSize: '0.65rem', color: 'var(--color-muted)', fontFamily: 'Outfit, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{invoiceSub}</div>}
        </div>
      </div>
      <div style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--color-faint)', lineHeight: 1 }}>↓</div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 7, padding: '0.35rem 0.6rem' }}>
        <span style={{ color: 'var(--color-muted)', display: 'flex', marginTop: '0.1rem', flexShrink: 0 }}><IconPayment /></span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text)', fontFamily: 'Outfit, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{payerLabel}</div>
          {payerSub && <div style={{ fontSize: '0.65rem', color: 'var(--color-muted)', fontFamily: 'Outfit, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Ref: {payerSub}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.1rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-accent)', fontFamily: 'Outfit, sans-serif' }}>{formatCurrency(match.matched_amount)}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {match.amount_pending != null && match.amount_pending !== 0 && (
            <span style={{ fontSize: '0.63rem', color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 99, padding: '0.1rem 0.45rem', fontFamily: 'Outfit, sans-serif' }}>Δ {formatCurrency(match.amount_pending)}</span>
          )}
          <span style={{ fontSize: '0.63rem', color: cfg.text, fontWeight: 600, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 99, padding: '0.1rem 0.55rem', fontFamily: 'Outfit, sans-serif' }}>View →</span>
        </div>
      </div>
    </div>
  );
}

/* Bucket Column */
function BucketColumn({ status, matches, onSelect, cache }: { status: MatchStatus; matches: MatchRecord[]; onSelect: (m: MatchRecord) => void; cache: DetailCache }) {
  const cfg = STATUS_CONFIG[status];
  const totalAmount = matches.reduce((sum, m) => sum + (m.matched_amount ?? 0), 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 255, flex: '1 1 255px', background: 'var(--color-surface)', border: `1px solid var(--color-border)`, borderRadius: 14, overflow: 'hidden', maxHeight: 'calc(100vh - 320px)' }}>
      <div style={{ padding: '0.875rem 1rem', background: cfg.headerBg, borderBottom: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.text }}>{cfg.icon}</div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: cfg.text, fontFamily: 'Outfit, sans-serif' }}>{cfg.label}</span>
        </div>
        <span style={{ fontSize: '0.65rem', fontWeight: 600, background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`, borderRadius: 99, padding: '0.15rem 0.55rem', fontFamily: 'Outfit, sans-serif' }}>{matches.length}</span>
      </div>
      {matches.length > 0 && (
        <div style={{ padding: '0.45rem 1rem', borderBottom: '1px solid var(--color-border)', fontSize: '0.67rem', color: 'var(--color-muted)', fontFamily: 'Outfit, sans-serif', display: 'flex', justifyContent: 'space-between', flexShrink: 0, background: 'var(--color-surface-2)' }}>
          <span>Total matched</span><span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{formatCurrency(totalAmount)}</span>
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {matches.length === 0
          ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', textAlign: 'center', minHeight: 80 }}><p style={{ fontSize: '0.72rem', color: 'var(--color-faint)', fontFamily: 'Outfit, sans-serif' }}>No records</p></div>
          : matches.map((m, i) => <MatchCard key={m.id} match={m} onSelect={onSelect} index={i} cache={cache} />)}
      </div>
    </div>
  );
}

/* Table Row */
function MatchTableRow({ match, onSelect, index, cache }: { match: MatchRecord; onSelect: (m: MatchRecord) => void; index: number; cache: DetailCache }) {
  const cfg = STATUS_CONFIG[match.match_status];
  const invoice = cache.invoices[match.invoice_id];
  const payment = cache.payments[match.payment_detail_id];
  const invoiceLabel = invoice?.invoice_number ?? invoice?.customer_name ?? '—';
  const customerName = invoice?.customer_name;
  const payerLabel   = payment?.payer_name ?? '—';
  const payerRef     = payment?.reference_number;
  const tdStyle: React.CSSProperties = { padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--color-text)', whiteSpace: 'nowrap' };
  return (
    <tr onClick={() => onSelect(match)}
      style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.15s', animation: `fadeSlideUp 0.3s var(--ease-out-expo) ${Math.min(index, 15) * 0.025}s both` }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
    >
      <td style={tdStyle}><StatusBadge status={match.match_status} /></td>
      <td style={tdStyle}>
        <div>
          <p style={{ fontWeight: 500, color: 'var(--color-accent)' }}>{invoiceLabel}</p>
          {invoice?.invoice_number && customerName && <p style={{ fontSize: '0.65rem', color: 'var(--color-muted)', marginTop: '0.1rem' }}>{customerName}</p>}
        </div>
      </td>
      <td style={tdStyle}>
        <div>
          <p style={{ fontWeight: 500 }}>{payerLabel}</p>
          {payerRef && <p style={{ fontSize: '0.65rem', color: 'var(--color-muted)', marginTop: '0.1rem', fontFamily: 'monospace' }}>Ref: {payerRef}</p>}
        </div>
      </td>
      <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--color-accent)' }}>{formatCurrency(match.matched_amount)}</td>
      
      <td style={{ ...tdStyle, color: 'var(--color-muted)' }}>
        <div>
          <p>{timeAgo(match.created_at)}</p>
          <p style={{ fontSize: '0.62rem', color: 'var(--color-faint)' }}>{formatDate(match.created_at)}</p>
        </div>
      </td>
      <td style={{ padding: '0.75rem 1rem' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem', fontWeight: 600, color: cfg.text, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 99, padding: '0.2rem 0.6rem', cursor: 'pointer' }}>View →</span>
      </td>
    </tr>
  );
}

/* All Matches Tab */
function AllMatchesTab() {
  const dispatch = useAppDispatch();
  const { matches, loading, refreshing } = useAppSelector(s => s.matching);
  const [selected, setSelected]           = useState<MatchRecord | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<MatchStatus>>(new Set());
  const [search, setSearch]               = useState('');
  const [sortDir, setSortDir]             = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode]           = useState<'bucket' | 'table'>('bucket');
  const [cache, setCache]                 = useState<DetailCache>({ invoices: {}, payments: {} });
  const [page, setPage]                   = useState(1);
  const [pageSize, setPageSize]           = useState(25);

  const fetchMatches = (silent = false) => {
    if (silent) dispatch(setRefreshing(true));
    dispatch(fetchMatchesThunk());
  };

  useEffect(() => { dispatch(fetchMatchesThunk()); }, [dispatch]);

  useEffect(() => {
    if (matches.length === 0) return;
    const BASE = '/api/v1/payment_intake_matching/matching';
    const uniqueInvoiceIds = [...new Set(matches.map(m => m.invoice_id))];
    const uniquePaymentIds = [...new Set(matches.map(m => m.payment_detail_id))];
    const invoiceReqs = uniqueInvoiceIds.map(id => fetch(`${BASE}/invoice-detail/${id}`, { credentials: 'include' }).then(r => r.ok ? r.json() : null).catch(() => null));
    const paymentReqs = uniquePaymentIds.map(id => fetch(`${BASE}/payment-detail/${id}`, { credentials: 'include' }).then(r => r.ok ? r.json() : null).catch(() => null));
    Promise.all([...invoiceReqs, ...paymentReqs]).then(results => {
      const invoiceResults = results.slice(0, uniqueInvoiceIds.length);
      const paymentResults = results.slice(uniqueInvoiceIds.length);
      const invoices: Record<number, InvoiceData> = {};
      const payments: Record<number, PaymentDetail> = {};
      uniqueInvoiceIds.forEach((id, i) => { if (invoiceResults[i]) invoices[id] = invoiceResults[i]; });
      uniquePaymentIds.forEach((id, i) => { if (paymentResults[i]) payments[id] = paymentResults[i]; });
      setCache({ invoices, payments });
    });
  }, [matches]);

  /* Reset page on filter/search/sort/view changes */
  useEffect(() => { setPage(1); }, [search, activeFilters, sortDir, viewMode]);

  const toggleFilter = (s: MatchStatus) => {
    setActiveFilters(prev => { const next = new Set(prev); next.has(s) ? next.delete(s) : next.add(s); return next; });
  };

  const counts = ALL_STATUSES.reduce((acc, s) => { acc[s] = matches.filter(m => m.match_status === s).length; return acc; }, {} as Record<MatchStatus, number>);

  const filtered = matches
    .filter(m => activeFilters.size === 0 || activeFilters.has(m.match_status))
    .filter(m => {
      if (!search) return true;
      const s = search.toLowerCase();
      const invoice = cache.invoices[m.invoice_id];
      const payment = cache.payments[m.payment_detail_id];
      return (
        m.match_status.toLowerCase().includes(s) ||
        (invoice?.invoice_number  ?? '').toLowerCase().includes(s) ||
        (invoice?.customer_name   ?? '').toLowerCase().includes(s) ||
        (payment?.payer_name      ?? '').toLowerCase().includes(s) ||
        (payment?.reference_number ?? '').toLowerCase().includes(s)
      );
    })
    .sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sortDir === 'desc' ? tb - ta : ta - tb;
    });

  const paginated       = filtered.slice((page - 1) * pageSize, page * pageSize);
  const visibleStatuses = activeFilters.size > 0 ? ALL_STATUSES.filter(s => activeFilters.has(s)) : ALL_STATUSES;

  const thStyle: React.CSSProperties = {
    padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.6rem', fontWeight: 600,
    fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em',
    color: 'var(--color-muted)', whiteSpace: 'nowrap', background: 'var(--color-surface-2)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 9, padding: '0.55rem 0.875rem', flex: '1 1 200px', maxWidth: 280 }}>
          <span style={{ color: 'var(--color-muted)', flexShrink: 0 }}><IconSearch /></span>
          <input type="text" placeholder="Search invoice, customer, payer…" value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--color-text)', fontSize: '0.78rem', fontFamily: 'Outfit, sans-serif', flex: 1, minWidth: 0 }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', padding: 0 }}><IconClose /></button>}
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {ALL_STATUSES.map(s => {
            const cfg = STATUS_CONFIG[s];
            const active = activeFilters.has(s);
            return (
              <button key={s} onClick={() => toggleFilter(s)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem', borderRadius: 99, cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif', border: active ? `1px solid ${cfg.border}` : '1px solid var(--color-border)', background: active ? cfg.bg : 'transparent', color: active ? cfg.text : 'var(--color-muted)', transition: 'all 0.15s' }}>
                {cfg.icon} {cfg.label}<span style={{ opacity: 0.7 }}>({counts[s]})</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 9, padding: '0.2rem', gap: '0.15rem' }}>
            <button onClick={() => setViewMode('bucket')} title="Bucket view" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.65rem', borderRadius: 7, cursor: 'pointer', border: 'none', fontFamily: 'Outfit, sans-serif', fontSize: '0.7rem', background: viewMode === 'bucket' ? 'var(--color-surface-2)' : 'transparent', color: viewMode === 'bucket' ? 'var(--color-accent)' : 'var(--color-muted)', fontWeight: viewMode === 'bucket' ? 600 : 400, transition: 'all 0.15s' }}>
              <IconBucket /> Bucket
            </button>
            <button onClick={() => setViewMode('table')} title="Table view" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.65rem', borderRadius: 7, cursor: 'pointer', border: 'none', fontFamily: 'Outfit, sans-serif', fontSize: '0.7rem', background: viewMode === 'table' ? 'var(--color-surface-2)' : 'transparent', color: viewMode === 'table' ? 'var(--color-accent)' : 'var(--color-muted)', fontWeight: viewMode === 'table' ? 600 : 400, transition: 'all 0.15s' }}>
              <IconTable /> Table
            </button>
          </div>
          <button onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.75rem', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.7rem', fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s' }}>
            <IconChevronDown /> {sortDir === 'desc' ? 'Newest' : 'Oldest'}
          </button>
          <button onClick={() => fetchMatches(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.75rem', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.7rem', fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s' }}>
            {refreshing ? <Spinner size={13} /> : <IconRefresh />}
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)' }}>Filtering:</span>
          {Array.from(activeFilters).map(s => (
            <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0.5rem', borderRadius: 99, fontSize: '0.65rem', background: STATUS_CONFIG[s].bg, color: STATUS_CONFIG[s].text, border: `1px solid ${STATUS_CONFIG[s].border}` }}>
              {STATUS_CONFIG[s].label}
              <button onClick={() => toggleFilter(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0, opacity: 0.7 }}><IconClose /></button>
            </span>
          ))}
          <button onClick={() => setActiveFilters(new Set())} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.68rem', fontFamily: 'Outfit, sans-serif', textDecoration: 'underline', padding: 0 }}>Clear all</button>
        </div>
      )}

      {/* Main content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3.5rem' }}><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '3.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)', marginBottom: '0.3rem' }}>No matches found</p>
          <p style={{ fontSize: '0.72rem', color: 'var(--color-faint)' }}>{activeFilters.size > 0 ? 'Try removing some filters' : 'Upload documents to start matching'}</p>
        </div>
      ) : viewMode === 'bucket' ? (
        <div style={{ display: 'flex', gap: '0.875rem', overflowX: 'auto', paddingBottom: '0.75rem', alignItems: 'flex-start' }}>
          {visibleStatuses.map(status => (
            <BucketColumn key={status} status={status} matches={filtered.filter(m => m.match_status === status)} onSelect={setSelected} cache={cache} />
          ))}
        </div>
      ) : (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Invoice</th>
                  <th style={thStyle}>Payer</th>
                  <th style={thStyle}>Matched Amount</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((m, i) => (
                  <MatchTableRow key={m.id} match={m} onSelect={setSelected} index={i} cache={cache} />
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div style={{ padding: '0.875rem 1rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
            <Pagination total={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
          </div>
        </div>
      )}

      {selected && <DetailDrawer match={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function UnmatchedTab({ type }: { type: 'payments' | 'invoices' }) {
  const dispatch = useAppDispatch();
  const { unmatchedPayments, unmatchedInvoices, unmatchedPaymentsLoading, unmatchedInvoicesLoading } = useAppSelector(s => s.matching);
  const rows    = type === 'payments' ? unmatchedPayments : unmatchedInvoices;
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

  const thStyle: React.CSSProperties = { padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.6rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted)', whiteSpace: 'nowrap', background: 'var(--color-surface-2)' };
  const tdStyle: React.CSSProperties = { padding: '0.7rem 1rem', color: 'var(--color-text)', fontSize: '0.78rem', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 9, padding: '0.6rem 0.875rem', maxWidth: 340 }}>
        <span style={{ color: 'var(--color-muted)', flexShrink: 0 }}><IconSearch /></span>
        <input type="text" placeholder={`Search ${type}…`} value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--color-text)', fontSize: '0.8rem', fontFamily: 'Outfit, sans-serif', flex: 1, minWidth: 0 }} />
        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', padding: 0 }}><IconClose /></button>}
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
                  {type === 'payments'
                    ? <><th style={thStyle}>Payer</th><th style={thStyle}>Amount</th><th style={thStyle}>Date</th><th style={thStyle}>Reference</th></>
                    : <><th style={thStyle}>Invoice #</th><th style={thStyle}>Customer</th><th style={thStyle}>Amount</th><th style={thStyle}>Due Date</th><th style={thStyle}>Status</th></>
                  }
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
                        <td style={tdStyle}>{(row as PaymentDetail).payer_name ?? '—'}</td>
                        <td style={{ ...tdStyle, color: 'var(--color-accent)', fontWeight: 600 }}>{formatCurrency((row as PaymentDetail).amount)}</td>
                        <td style={tdStyle}>{formatDate((row as PaymentDetail).payment_date)}</td>
                        <td style={{ ...tdStyle, color: 'var(--color-muted)', fontSize: '0.7rem', fontFamily: 'monospace' }}>{(row as PaymentDetail).reference_number ?? '—'}</td>
                      </>
                    ) : (
                      <>
                        <td style={{ ...tdStyle, color: 'var(--color-accent)', fontWeight: 500 }}>{(row as InvoiceData).invoice_number ?? '—'}</td>
                        <td style={tdStyle}>{(row as InvoiceData).customer_name ?? '—'}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{formatCurrency((row as InvoiceData).total_amount)}</td>
                        <td style={{ ...tdStyle, color: new Date((row as InvoiceData).due_date ?? '') < new Date() ? '#f87171' : 'var(--color-text)' }}>{formatDate((row as InvoiceData).due_date)}</td>
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

/* Root */
type TabKey = 'all' | 'unmatched-payments' | 'unmatched-invoices';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'all',                label: 'All Matches',        icon: <IconCheck /> },
  { key: 'unmatched-payments', label: 'Unmatched Payments', icon: <IconPayment /> },
  { key: 'unmatched-invoices', label: 'Unmatched Invoices', icon: <IconInvoice /> },
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
    fontFamily: 'Outfit, sans-serif', transition: 'all 0.18s', whiteSpace: 'nowrap',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1200 }}>
      <div>
        <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-accent)', marginBottom: '0.4rem' }}>Reconciliation</p>
        <h2 className="font-display" style={{ fontSize: 'clamp(1.375rem, 2.5vw, 1.75rem)', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>Matching</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Invoice-to-payment matches. Switch between bucket and table view, click any record to drill down.</p>
      </div>

      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 11, padding: '0.3rem', width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.key} style={tabStyle(activeTab === t.key)} onClick={() => setActiveTab(t.key)}>
            <span style={{ display: 'flex' }}>{t.icon}</span>{t.label}
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