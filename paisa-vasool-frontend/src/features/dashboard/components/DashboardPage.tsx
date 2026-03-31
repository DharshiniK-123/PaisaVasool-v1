import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  type MatchStatus,
  type MatchRecord,
  type MatchPaymentDetail as PaymentDetail,
  type MatchInvoiceData as InvoiceData
} from '../../matching/types/Match';
import { type DashboardSummary } from '../types/index';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { ROUTES } from '../../../config/constants';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import {
  fetchDashboardSummaryThunk,
  fetchRecentMatchesThunk,
} from '../slices/dashboardSlice';
import {
  fetchUnmatchedPaymentsThunk,
  fetchUnmatchedInvoicesThunk,
} from '../../matching/slices/matchingSlice';
import { agingConfigService } from '../../matching/services/agingConfigService';


type Discrepancy = {
  id: number;
  match_status: 'FAILED' | 'DUPLICATE' | 'PARTIAL' | 'OVERPAYMENT';
  match_reason: string | null;
  payment_amount: number | null;
  currency: string | null;
  invoice_no: string | null;
  paid_date: string | null;
  payer_name: string | null;
  payer_email: string | null;
  created_at: string;
  is_resolved: boolean;
  resolved_reason: string | null;
};

const IconCheck      = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IconPartial    = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
const IconOver       = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>);
const IconFailed     = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IconUnmatched  = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>);
const IconArrowRight = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>);
const IconRefresh    = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>);
const IconInvoice    = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>);
const IconBell       = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>);
const IconChevLeft   = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>);
const IconChevRight  = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>);
const IconResolved   = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>);


function Spinner({ size = 18, color = 'var(--color-accent)' }: { size?: number; color?: string }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${color}22`, borderTopColor: color, animation: 'spin 0.65s linear infinite', flexShrink: 0 }} />;
}
function formatCurrency(val?: number | null, currency?: string | null) {
  if (val == null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency ?? 'INR', maximumFractionDigits: 0 }).format(val);
}
function formatDate(str?: string | null) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function timeAgo(str?: string | null) {
  if (!str) return '—';
  const diff = Date.now() - new Date(str).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
function isOverdue(dateStr?: string | null) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}


const thStyle: React.CSSProperties = {
  padding: '0.6rem 1rem', textAlign: 'left',
  fontSize: '0.6rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif',
  textTransform: 'uppercase', letterSpacing: '0.1em',
  color: 'var(--color-muted)', whiteSpace: 'nowrap',
  background: 'var(--color-surface)',
};
const tdStyle: React.CSSProperties = {
  padding: '0.65rem 1rem', color: 'var(--color-text)',
  whiteSpace: 'nowrap', maxWidth: 180,
  overflow: 'hidden', textOverflow: 'ellipsis',
};


const PAGE_SIZE = 8;

function MiniPagination({ total, page, onPage }: { total: number; page: number; onPage: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to   = Math.min(page * PAGE_SIZE, total);
  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 26, height: 26, borderRadius: 6,
    border: '1px solid var(--color-border)', background: 'var(--color-surface)',
    cursor: 'pointer', color: 'var(--color-muted)', flexShrink: 0,
  };
  return (
    <div style={{ padding: '0.625rem 1rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '0.68rem', color: 'var(--color-faint)' }}>
        {total === 0 ? '0 records' : `${from}–${to} of ${total}`}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          style={{ ...btnBase, opacity: page === 1 ? 0.35 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
          <IconChevLeft />
        </button>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', minWidth: 50, textAlign: 'center' }}>
          {page} / {totalPages}
        </span>
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
          style={{ ...btnBase, opacity: page === totalPages ? 0.35 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>
          <IconChevRight />
        </button>
      </div>
    </div>
  );
}


const DEFAULT_CONFIG = { label: 'Unknown', icon: <IconUnmatched />, bg: 'rgba(156,163,175,0.1)', text: '#9ca3af', border: 'rgba(156,163,175,0.25)', glow: 'rgba(156,163,175,0.06)' };

const STATUS_CONFIG: Record<MatchStatus, { label: string; icon: React.ReactNode; bg: string; text: string; border: string; glow: string }> = {
  FULL:            { label: 'Fully Paid',   icon: <IconCheck />,   bg: 'rgba(52,211,153,0.1)',  text: '#34d399', border: 'rgba(52,211,153,0.25)',  glow: 'rgba(52,211,153,0.08)'  },
  PARTIAL:         { label: 'Partial',      icon: <IconPartial />, bg: 'rgba(251,191,36,0.1)',  text: '#fbbf24', border: 'rgba(251,191,36,0.25)',  glow: 'rgba(251,191,36,0.06)'  },
  OVERPAYMENT:     { label: 'Overpayment',  icon: <IconOver />,    bg: 'rgba(139,92,246,0.1)',  text: '#a78bfa', border: 'rgba(139,92,246,0.25)',  glow: 'rgba(139,92,246,0.06)'  },
  DUPLICATE:       { label: 'Duplicate',    icon: <IconPartial />, bg: 'rgba(139,92,246,0.1)',  text: '#a78bfa', border: 'rgba(139,92,246,0.25)',  glow: 'rgba(139,92,246,0.06)'  },
  FAILED:          { label: 'Failed',       icon: <IconFailed />,  bg: 'rgba(248,113,113,0.1)', text: '#f87171', border: 'rgba(248,113,113,0.25)', glow: 'rgba(248,113,113,0.06)' },
  SUGGESTED:       { label: 'Suggested',    icon: <IconCheck />,   bg: 'rgba(96,165,250,0.1)',  text: '#60a5fa', border: 'rgba(96,165,250,0.25)',  glow: 'rgba(96,165,250,0.06)'  },
  MANUALLY_MATCHED:{ label: 'Manual Match', icon: <IconCheck />,   bg: 'rgba(52,211,153,0.1)',  text: '#34d399', border: 'rgba(52,211,153,0.25)',  glow: 'rgba(52,211,153,0.08)'  },
};

function StatusBadge({ status }: { status: MatchStatus }) {
  const c = STATUS_CONFIG[status] || DEFAULT_CONFIG;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.18rem 0.6rem', borderRadius: 99, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {c.icon} {c.label}
    </span>
  );
}


function SummaryCards({ summary, loading }: { summary: DashboardSummary | null; loading: boolean }) {
  const navigate = useNavigate();
  const total = summary ? Object.values(summary).reduce((acc, arr) => acc + arr.length, 0) : 0;
  const cards = [
    { key: 'FULL' as MatchStatus,        label: 'Fully Paid',     count: summary?.FULL?.length ?? 0,        amount: summary?.FULL?.reduce((s, m) => s + (m.matched_amount ?? 0), 0) ?? 0,        icon: <IconCheck /> },
    { key: 'PARTIAL' as MatchStatus,     label: 'Partially Paid', count: summary?.PARTIAL?.length ?? 0,     amount: summary?.PARTIAL?.reduce((s, m) => s + (m.matched_amount ?? 0), 0) ?? 0,     icon: <IconPartial /> },
    { key: 'OVERPAYMENT' as MatchStatus, label: 'Overpayment',    count: summary?.OVERPAYMENT?.length ?? 0, amount: summary?.OVERPAYMENT?.reduce((s, m) => s + (m.matched_amount ?? 0), 0) ?? 0, icon: <IconOver /> },
    { key: 'FAILED' as MatchStatus,      label: 'Failed',         count: summary?.FAILED?.length ?? 0,      amount: 0,                                                                           icon: <IconFailed /> },
  ];
  return (
    <div>
      <div style={{ padding: '1rem 1.375rem', marginBottom: '0.75rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: '0.2rem' }}>Total Matches</p>
          {loading ? <Spinner size={20} /> : <p className="font-display" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>{total}</p>}
        </div>
        {!loading && summary && total > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', height: 28 }}>
            {cards.filter(c => c.count > 0).map(c => {
              const cfg = STATUS_CONFIG[c.key] || DEFAULT_CONFIG;
              const pct = (c.count / total) * 100;
              return (
                <div key={c.key} title={`${c.label}: ${c.count}`}
                  style={{ width: Math.max(pct * 1.2, 18), height: '100%', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.text, fontSize: '0.6rem', fontWeight: 700, cursor: 'default', transition: 'all 0.2s' }}>
                  {c.count}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.625rem' }}>
        {cards.map((card, i) => {
          const cfg = STATUS_CONFIG[card.key] || DEFAULT_CONFIG;
          return (
            <div key={card.key} onClick={() => navigate(ROUTES.MATCHING)} className="stat-card"
              style={{ cursor: 'pointer', animation: `fadeSlideUp 0.4s var(--ease-out-expo) ${i * 0.06}s both`, background: `linear-gradient(135deg, var(--color-surface) 0%, ${cfg.glow} 100%)` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.text }}>{cfg.icon}</div>
                {loading ? <Spinner size={14} color={cfg.text} /> : <span style={{ fontSize: '0.6rem', color: 'var(--color-muted)' }}>→</span>}
              </div>
              <p className="font-display" style={{ fontSize: '1.5rem', fontWeight: 800, color: cfg.text, lineHeight: 1, marginBottom: '0.25rem' }}>{loading ? '—' : card.count}</p>
              <p style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.2rem' }}>{card.label}</p>
              {card.amount > 0 && <p style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>{formatCurrency(card.amount)}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UnmatchedSection({ unmatchedPayments, unmatchedInvoices, loading }: {
  unmatchedPayments: PaymentDetail[];
  unmatchedInvoices: InvoiceData[];
  loading: boolean;
}) {
  const [tab, setTab]   = useState<'payments' | 'invoices'>('payments');
  const [page, setPage] = useState(1);

  const handleTab = (t: 'payments' | 'invoices') => { setTab(t); setPage(1); };

  const rows    = tab === 'payments' ? unmatchedPayments : unmatchedInvoices;
  const paged   = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.45rem 0.875rem', borderRadius: 8, cursor: 'pointer', border: 'none',
    fontSize: '0.72rem', fontWeight: active ? 600 : 400, fontFamily: 'Outfit, sans-serif',
    background: active ? 'var(--color-accent-soft)' : 'transparent',
    color: active ? 'var(--color-accent)' : 'var(--color-muted)',
    transition: 'all 0.18s',
  });

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, overflow: 'hidden' }}>
     
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', background: 'var(--color-surface-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
            <IconUnmatched />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)' }}>Unmatched Records</p>
            <p style={{ fontSize: '0.62rem', color: 'var(--color-muted)' }}>Needs attention</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--color-surface)', borderRadius: 9, padding: '0.2rem' }}>
          <button style={tabStyle(tab === 'payments')} onClick={() => handleTab('payments')}>
            Payments {!loading && <span style={{ opacity: 0.7 }}>({unmatchedPayments.length})</span>}
          </button>
          <button style={tabStyle(tab === 'invoices')} onClick={() => handleTab('invoices')}>
            Invoices {!loading && <span style={{ opacity: 0.7 }}>({unmatchedInvoices.length})</span>}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem' }}><Spinner /></div>
      ) : rows.length === 0 ? (
        <div style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', margin: '0 auto 0.875rem', background: 'var(--color-accent-soft)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
            <IconCheck />
          </div>
          <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.3rem' }}>All {tab === 'payments' ? 'payments' : 'invoices'} matched!</p>
          <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>No unmatched records found</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {tab === 'payments' ? (
                    <><th style={thStyle}>ID</th><th style={thStyle}>Payer</th><th style={thStyle}>Amount</th><th style={thStyle}>Date</th><th style={thStyle}>Reference</th></>
                  ) : (
                    <><th style={thStyle}>Invoice #</th><th style={thStyle}>Customer</th><th style={thStyle}>Amount</th><th style={thStyle}>Due Date</th><th style={thStyle}>Status</th></>
                  )}
                </tr>
              </thead>
              <tbody>
                {paged.map((row, i) => (
                  <tr key={row.id}
                    style={{ borderBottom: i < paged.length - 1 ? '1px solid var(--color-border)' : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    {tab === 'payments' ? (
                      <>
                        <td style={tdStyle}><span style={{ color: 'var(--color-muted)' }}>#{row.id}</span></td>
                        <td style={tdStyle}>{(row as PaymentDetail).payer_name ?? '—'}</td>
                        <td style={{ ...tdStyle, color: 'var(--color-accent)', fontWeight: 600 }}>{formatCurrency((row as PaymentDetail).amount)}</td>
                        <td style={tdStyle}>{formatDate((row as PaymentDetail).payment_date)}</td>
                        <td style={{ ...tdStyle, color: 'var(--color-muted)', fontSize: '0.7rem' }}>{(row as PaymentDetail).reference_number ?? '—'}</td>
                      </>
                    ) : (
                      <>
                        <td style={tdStyle}><span style={{ color: 'var(--color-accent)', fontWeight: 500 }}>{(row as InvoiceData).invoice_number ?? `#${row.id}`}</span></td>
                        <td style={tdStyle}>{(row as InvoiceData).customer_name ?? '—'}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{formatCurrency((row as InvoiceData).total_amount)}</td>
                        <td style={{ ...tdStyle, color: isOverdue((row as InvoiceData).due_date) ? '#f87171' : 'var(--color-text)' }}>
                          {formatDate((row as InvoiceData).due_date)}
                          {isOverdue((row as InvoiceData).due_date) && <span style={{ fontSize: '0.6rem', marginLeft: '0.3rem', color: '#f87171' }}>overdue</span>}
                        </td>
                        <td style={tdStyle}>
                          <span style={{ padding: '0.15rem 0.5rem', borderRadius: 99, fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.06em', background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', textTransform: 'uppercase' }}>
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
          <MiniPagination total={rows.length} page={page} onPage={setPage} />
        </>
      )}
    </div>
  );
}

function RecentMatches({ matches, loading }: { matches: MatchRecord[]; loading: boolean }) {
  const navigate  = useNavigate();
  const [page, setPage] = useState(1);
  const paged = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface-2)' }}>
        <div>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.1rem' }}>Recent Matches</p>
          <p style={{ fontSize: '0.62rem', color: 'var(--color-muted)' }}>Latest reconciliation activity</p>
        </div>
        <button onClick={() => navigate(ROUTES.MATCHING)}
          style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 7, padding: '0.35rem 0.75rem', cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.7rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s' }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(52,211,153,0.3)'; el.style.color = 'var(--color-accent)'; el.style.background = 'var(--color-accent-soft)'; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border)'; el.style.color = 'var(--color-muted)'; el.style.background = 'none'; }}
        >
          View all <IconArrowRight />
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem' }}><Spinner /></div>
      ) : matches.length === 0 ? (
        <div style={{ padding: '2.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>No matches yet</p>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-faint)', marginTop: '0.3rem' }}>Upload documents to start matching</p>
        </div>
      ) : (
        <>
          <div>
            {paged.map((m, i) => {
              const cfg = STATUS_CONFIG[m.match_status] || DEFAULT_CONFIG;
              return (
                <div key={m.id}
                  style={{ padding: '0.875rem 1.25rem', borderBottom: i < paged.length - 1 ? '1px solid var(--color-border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', transition: 'background 0.15s', animation: `fadeSlideUp 0.35s var(--ease-out-expo) ${i * 0.04}s both` }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.text }}>
                      {cfg.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text)' }}>Invoice #{m.invoice_id}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-faint)' }}>←→</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text)' }}>Payment #{m.payment_detail_id}</span>
                      </div>
                      <p style={{ fontSize: '0.65rem', color: 'var(--color-muted)', marginTop: '0.1rem' }}>
                        {timeAgo(m.created_at)}
                        {m.matched_amount ? <span style={{ marginLeft: '0.5rem', color: cfg.text, fontWeight: 500 }}>{formatCurrency(m.matched_amount)}</span> : null}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={m.match_status} />
                </div>
              );
            })}
          </div>
          <MiniPagination total={matches.length} page={page} onPage={setPage} />
        </>
      )}
    </div>
  );
}

function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    { label: 'View Invoices',  sub: 'All invoice records',  icon: <IconInvoice />, to: ROUTES.INVOICES,  accent: false },
    { label: 'View Reminders', sub: 'Aging notifications',  icon: <IconBell />,    to: ROUTES.REMINDERS, accent: false },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: '0.25rem' }}>Quick Actions</p>
      {actions.map((a, i) => (
        <button key={a.label} onClick={() => navigate(a.to)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', borderRadius: 10, cursor: 'pointer', background: a.accent ? 'var(--color-accent-soft)' : 'var(--color-surface)', border: a.accent ? '1px solid rgba(52,211,153,0.25)' : '1px solid var(--color-border)', width: '100%', textAlign: 'left', fontFamily: 'Outfit, sans-serif', transition: 'all 0.18s var(--ease-in-out)', animation: `fadeSlideUp 0.4s var(--ease-out-expo) ${i * 0.07}s both` }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(52,211,153,0.35)'; el.style.background = 'var(--color-accent-soft)'; el.style.transform = 'translateX(2px)'; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = a.accent ? 'rgba(52,211,153,0.25)' : 'var(--color-border)'; el.style.background = a.accent ? 'var(--color-accent-soft)' : 'var(--color-surface)'; el.style.transform = 'translateX(0)'; }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: a.accent ? 'rgba(52,211,153,0.15)' : 'var(--color-surface-2)', border: `1px solid ${a.accent ? 'rgba(52,211,153,0.3)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.accent ? 'var(--color-accent)' : 'var(--color-muted)' }}>
            {a.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.1rem' }}>{a.label}</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>{a.sub}</p>
          </div>
          <span style={{ color: 'var(--color-accent)', opacity: 0.6, flexShrink: 0 }}><IconArrowRight /></span>
        </button>
      ))}
    </div>
  );
}
function DiscrepanciesPanel() {
  const [items, setItems]       = useState<Discrepancy[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [page, setPage]         = useState(1);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await agingConfigService.getDiscrepancies(false);
      setItems(data as unknown as Discrepancy[]);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCount = items.filter(d => !d.is_resolved).length;
  const paged     = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, overflow: 'hidden' }}>

      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.625rem', background: 'var(--color-surface-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', fontSize: '0.75rem' }}>⚠</div>
          <div>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)' }}>Discrepancies</p>
            <p style={{ fontSize: '0.62rem', color: 'var(--color-muted)' }}>Failed matches requiring review</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {!loading && openCount > 0 && (
            <span style={{ padding: '0.15rem 0.55rem', borderRadius: 99, fontSize: '0.62rem', fontWeight: 700, background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
              {openCount} open
            </span>
          )}
          <button onClick={() => load()}
            style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 7, padding: '0.35rem', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--color-text)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--color-muted)'}
          >
            <IconRefresh />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem' }}>
          <Spinner size={16} color="#f87171" />
          <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Loading…</span>
        </div>
      ) : error ? (
        <div style={{ padding: '1.25rem', color: '#f87171', fontSize: '0.8rem' }}>⚠ {error}</div>
      ) : items.length === 0 ? (
        <div style={{ padding: '2.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>✓</p>
          <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--color-text)' }}>No discrepancies</p>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>All matches resolved successfully</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {paged.map((item, i) => {
              const color  = item.match_status === 'FAILED' ? '#f87171' : '#fbbf24';
              const bg     = item.match_status === 'FAILED' ? 'rgba(248,113,113,0.06)' : 'rgba(251,191,36,0.06)';
              const border = item.match_status === 'FAILED' ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)';
              const isOpen = expanded === item.id;

              return (
                <div key={item.id} style={{ borderBottom: i < paged.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <div onClick={() => setExpanded(isOpen ? null : item.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1.25rem', cursor: 'pointer', background: isOpen ? bg : 'transparent', transition: 'background 0.15s' }}
                    onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: 99, fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: `${color}18`, color, border: `1px solid ${color}33`, flexShrink: 0 }}>
                      {item.match_status}
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.payer_name ?? item.payer_email ?? 'Unknown payer'}
                        {item.invoice_no && <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}> · {item.invoice_no}</span>}
                      </p>
                      <p style={{ fontSize: '0.68rem', color: 'var(--color-muted)', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.match_reason ?? '—'}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text)' }}>
                        {item.payment_amount != null ? formatCurrency(item.payment_amount, item.currency) : '—'}
                      </p>
                      <p style={{ fontSize: '0.62rem', color: 'var(--color-muted)', marginTop: '0.1rem' }}>
                        {item.paid_date ? new Date(item.paid_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                      </p>
                    </div>

                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ flexShrink: 0, color: 'var(--color-muted)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>

                  {isOpen && (
                    <div style={{ padding: '0.75rem 1.25rem 1.125rem', background: bg, borderTop: `1px solid ${border}` }}>
                      <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color, marginBottom: '0.4rem' }}>Reason</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--color-text)', lineHeight: 1.65 }}>
                        {item.match_reason ?? 'No reason recorded.'}
                      </p>
                      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.875rem', flexWrap: 'wrap' }}>
                        {item.payer_email && (
                          <div>
                            <p style={{ fontSize: '0.6rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email</p>
                            <p style={{ fontSize: '0.73rem', color: 'var(--color-text)' }}>{item.payer_email}</p>
                          </div>
                        )}
                        {item.invoice_no && (
                          <div>
                            <p style={{ fontSize: '0.6rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Invoice Ref</p>
                            <p style={{ fontSize: '0.73rem', color: 'var(--color-text)' }}>{item.invoice_no}</p>
                          </div>
                        )}
                        <div>
                          <p style={{ fontSize: '0.6rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Detected</p>
                          <p style={{ fontSize: '0.73rem', color: 'var(--color-text)' }}>
                            {new Date(item.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <MiniPagination total={items.length} page={page} onPage={p => { setPage(p); setExpanded(null); }} />
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { summary, recentMatches, loading, error } = useAppSelector(s => s.dashboard);
  const { unmatchedPayments, unmatchedInvoices }    = useAppSelector(s => s.matching);

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing]   = useState(false);

  const fetchAll = useCallback((silent = false) => {
    if (silent) setTimeout(() => setRefreshing(true), 0);
    dispatch(fetchDashboardSummaryThunk());
    dispatch(fetchRecentMatchesThunk());
    dispatch(fetchUnmatchedPaymentsThunk());
    dispatch(fetchUnmatchedInvoicesThunk());
    setTimeout(() => setLastRefresh(new Date()), 0);
    if (silent) setTimeout(() => setRefreshing(false), 1000);
  }, [dispatch]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    const t = setInterval(() => fetchAll(true), 60000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const totalUnmatched = unmatchedPayments.length + unmatchedInvoices.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1200 }}>
   
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-accent)', marginBottom: '0.35rem' }}>Overview</p>
          <h2 className="font-display" style={{ fontSize: 'clamp(1.375rem, 2.5vw, 1.75rem)', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Payment Operations</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {lastRefresh && !loading && <span style={{ fontSize: '0.65rem', color: 'var(--color-faint)' }}>Updated {timeAgo(lastRefresh.toISOString())}</span>}
          <button onClick={() => fetchAll(true)} disabled={refreshing || loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.875rem', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.72rem', fontWeight: 500, fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(52,211,153,0.3)'; el.style.color = 'var(--color-accent)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border)'; el.style.color = 'var(--color-muted)'; }}
          >
            {refreshing ? <Spinner size={13} /> : <IconRefresh />} Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="banner banner-error animate-fade-in">
          <span className="banner-icon">⚠</span>
          <p>{error} — <button onClick={() => fetchAll()} style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Outfit, sans-serif', fontSize: 'inherit', padding: 0 }}>Retry</button></p>
        </div>
      )}

      {!loading && totalUnmatched > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.125rem', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, animation: 'fadeSlideUp 0.3s var(--ease-out-expo) both' }}>
          <span style={{ fontSize: '0.85rem' }}>⚠️</span>
          <p style={{ fontSize: '0.78rem', color: '#fbbf24', flex: 1 }}>
            <strong>{totalUnmatched} unmatched record{totalUnmatched !== 1 ? 's' : ''}</strong> need attention — {unmatchedPayments.length} payment{unmatchedPayments.length !== 1 ? 's' : ''} and {unmatchedInvoices.length} invoice{unmatchedInvoices.length !== 1 ? 's' : ''} awaiting reconciliation.
          </p>
        </div>
      )}

      <SummaryCards summary={summary} loading={loading} />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: '1.25rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>
          <UnmatchedSection unmatchedPayments={unmatchedPayments} unmatchedInvoices={unmatchedInvoices} loading={loading} />
          <DiscrepanciesPanel />
          <RecentMatches matches={recentMatches} loading={loading} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <QuickActions />
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1rem 1.125rem' }}>
            <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: '0.75rem' }}>Status Legend</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(Object.entries(STATUS_CONFIG) as [MatchStatus, typeof STATUS_CONFIG[MatchStatus]][]).map(([key, cfg]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.text }}>{cfg.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--color-text)' }}>{cfg.label}</p>
                  </div>
                  {summary && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: cfg.text }}>{summary[key]?.length ?? 0}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
