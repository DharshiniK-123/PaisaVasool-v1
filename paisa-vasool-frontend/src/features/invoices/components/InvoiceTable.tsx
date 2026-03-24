import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useInvoices } from '../hooks/useInvoices';
import { invoiceService } from '../services/invoiceService';
import InlineUploadPanel from '../../documents/components/InlineUploadPanel';
import type { Invoice, InvoiceMatch, PaymentStatus } from '../types/Invoice';
import Pagination from '../../../components/common/Pagination';

const IconSearch      = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const IconRefresh     = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>);
const IconClose       = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IconInvoice     = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>);
const IconChevronDown = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>);
const IconCalendar    = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const IconUser        = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IconMail        = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>);
const IconPhone       = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>);
const IconHash        = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>);
const IconCurrency    = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const IconCheck       = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IconLink        = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>);
const IconWarning     = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const IconVoid        = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>);
const IconClock       = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);


function Spinner({ size = 18, color = 'var(--color-accent)' }: { size?: number; color?: string }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${color}22`, borderTopColor: color, animation: 'spin 0.65s linear infinite', flexShrink: 0 }} />;
}
function formatCurrency(val?: number | null, currency?: string | null) {
  if (val == null) return '—';
  const cur = (currency ?? 'INR').toUpperCase().trim();
  const locale = cur === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: cur, maximumFractionDigits: 2 }).format(val);
}
function formatCompact(val?: number | null, currency?: string | null) {
  if (val == null) return '—';
  const cur = (currency ?? 'INR').toUpperCase().trim();
  const symbol = cur === 'INR' ? '₹' : cur === 'USD' ? '$' : cur === 'EUR' ? '€' : cur === 'GBP' ? '£' : cur + ' ';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (cur === 'INR') {
    if (abs >= 1_00_00_000) return `${sign}${symbol}${(abs / 1_00_00_000).toFixed(1)}Cr`;
    if (abs >= 1_00_000)    return `${sign}${symbol}${(abs / 1_00_000).toFixed(1)}L`;
    if (abs >= 1_000)       return `${sign}${symbol}${(abs / 1_000).toFixed(1)}K`;
  } else {
    if (abs >= 1_000_000_000) return `${sign}${symbol}${(abs / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000)     return `${sign}${symbol}${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000)         return `${sign}${symbol}${(abs / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(val, currency);
}
function formatDate(str?: string | null) {
  if (!str) return '—';
  const d = new Date(str);
  return isNaN(d.getTime()) ? str : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function timeAgo(str?: string | null) {
  if (!str) return '';
  const diff = Date.now() - new Date(str).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function isOverdue(due?: string | null, status?: string | null) {
  if (!due || normaliseStatus(status) === 'PAID') return false;
  return new Date(due) < new Date();
}
function daysOverdue(due?: string | null) {
  if (!due) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(due).getTime()) / 86400000));
}


const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  PAID:     { label: 'Paid',     bg: 'rgba(52,211,153,0.1)',  text: '#34d399', border: 'rgba(52,211,153,0.25)'  },
  UNPAID:   { label: 'Unpaid',   bg: 'rgba(248,113,113,0.1)', text: '#f87171', border: 'rgba(248,113,113,0.25)' },
  PARTIAL:  { label: 'Partial',  bg: 'rgba(251,191,36,0.1)',  text: '#fbbf24', border: 'rgba(251,191,36,0.25)'  },
  OVERPAID: { label: 'Overpaid', bg: 'rgba(139,92,246,0.1)',  text: '#a78bfa', border: 'rgba(139,92,246,0.25)'  },
};
const MATCH_STATUS_CONFIG = {
  FULL:        { label: 'Fully Matched', color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.25)'  },
  PARTIAL:     { label: 'Partial Match', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)'  },
  OVERPAYMENT: { label: 'Overpayment',   color: '#a78bfa', bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.25)'  },
  FAILED:      { label: 'Match Failed',  color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)' },
};

function normaliseStatus(raw?: string | null): PaymentStatus {
  const s = (raw ?? '').toUpperCase().trim();
  if (s === 'PAID' || s === 'FULLY_PAID' || s === 'FULL') return 'PAID';
  if (s === 'OVERPAID' || s === 'OVERPAYMENT' || s === 'OVER_PAID') return 'OVERPAID';
  if (s === 'PARTIAL' || s === 'PARTIALLY_PAID' || s === 'PARTIAL_PAYMENT' || s === 'PARTIALLY PAID') return 'PARTIAL';
  return 'UNPAID';
}
function StatusBadge({ status }: { status?: string | null }) {
  const s = normaliseStatus(status);
  const c = STATUS_CONFIG[s];
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
      <span style={{ fontSize: '0.68rem', color, fontWeight: 600, flexShrink: 0 }}>{pct}%</span>
    </div>
  );
}


function VoidConfirmModal({ label, onConfirm, onCancel, voiding }: {
  label: string; onConfirm: () => void; onCancel: () => void; voiding: boolean;
}) {
  return createPortal(
    <>
      <div onClick={!voiding ? onCancel : undefined} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 60 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '100%', maxWidth: 420, zIndex: 70, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '2rem', boxShadow: 'var(--shadow-lg)', animation: 'popIn 0.25s var(--ease-bounce) both' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}><IconVoid /></div>
          <div>
            <h3 className="font-display" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>Void {label}?</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-muted)', lineHeight: 1.65 }}>
              This will mark the invoice as voided. Any existing payment matches will be flagged as discrepancies and require re-matching.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%' }}>
            <button onClick={onCancel} disabled={voiding} className="btn-secondary" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cancel</button>
            <button onClick={onConfirm} disabled={voiding}
              style={{ padding: '0.75rem', borderRadius: 10, border: 'none', cursor: voiding ? 'not-allowed' : 'pointer', background: '#ef4444', color: '#fff', fontWeight: 600, fontSize: '0.82rem', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', opacity: voiding ? 0.6 : 1, transition: 'opacity 0.15s' }}>
              {voiding ? <Spinner size={14} color="#fff" /> : <IconVoid />}
              {voiding ? 'Voiding…' : 'Void Invoice'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}


function InvoiceHistoryDrawer({
  current,
  allVersions,
  onClose,
  onVoid,
}: {
  current: Invoice;
  allVersions: Invoice[];         
  onClose: () => void;
  onVoid: (inv: Invoice) => void;
}) {
  const [activeId, setActiveId] = useState<number>(current.id);
  const activeInv = allVersions.find(i => i.id === activeId) ?? current;
  const tab_state = useState<'details' | 'matching'>('details');
  const [tab, setTab] = tab_state;

  const overdue      = isOverdue(activeInv.due_date, activeInv.payment_status);
  const days         = daysOverdue(activeInv.due_date);
  const isVoided     = activeInv.is_deleted === true;
  const invMatches: InvoiceMatch[] = activeInv.matches ?? [];

  const Row = ({ icon, label, value, accent, danger }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent?: boolean; danger?: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ color: 'var(--color-muted)', flexShrink: 0, width: 16, display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', flex: '0 0 90px' }}>{label}</span>
      <span style={{ fontSize: '0.8rem', fontWeight: 500, flex: 1, color: accent ? 'var(--color-accent)' : danger ? '#f87171' : 'var(--color-text)', textAlign: 'right' }}>{value}</span>
    </div>
  );

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 500, background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)', zIndex: 50, display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 48px rgba(0,0,0,0.55)', animation: 'slideInRight 0.3s var(--ease-out-expo) both' }}>

        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--color-accent-soft)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}><IconInvoice /></div>
            <div>
              <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-muted)', marginBottom: '0.1rem' }}>Invoice Detail</p>
              <h3 className="font-display" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                {current.invoice_number ?? `#${current.id}`}
                {allVersions.length > 1 && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--color-muted)', marginLeft: '0.5rem' }}>
                    · {allVersions.length} versions
                  </span>
                )}
              </h3>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.45rem', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', transition: 'all 0.15s' }}><IconClose /></button>
        </div>

        {allVersions.length > 1 && (
          <div style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', padding: '0.75rem 1.5rem', flexShrink: 0 }}>
            <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>
              History — newest first
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {allVersions.map((v, idx) => {
                const isActive  = v.id === activeId;
                const isVoidedV = v.is_deleted === true;
                const isCurrent = idx === 0 && !isVoidedV;
                return (
                  <button
                    key={v.id}
                    onClick={() => { setActiveId(v.id); setTab('details'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.75rem', borderRadius: 8, border: isActive ? '1px solid var(--color-accent)' : '1px solid var(--color-border)', background: isActive ? 'var(--color-accent-soft)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%' }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: isVoidedV ? '#64748b' : STATUS_CONFIG[normaliseStatus(v.payment_status)].text, opacity: isActive ? 1 : 0.6 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--color-accent)' : 'var(--color-text)', textDecoration: isVoidedV ? 'line-through' : 'none' }}>
                          {v.invoice_number ?? `#${v.id}`}
                        </span>
                        {isVoidedV ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.1rem 0.4rem', borderRadius: 99, fontSize: '0.58rem', fontWeight: 700, background: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.2)' }}>
                            <IconVoid /> Voided
                          </span>
                        ) : (
                          <>
                            <StatusBadge status={v.payment_status} />
                            {isCurrent && <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 99, padding: '0.1rem 0.4rem' }}>Current</span>}
                          </>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
                        <span style={{ color: 'var(--color-faint)', display: 'flex' }}><IconClock /></span>
                        <span style={{ fontSize: '0.62rem', color: 'var(--color-faint)' }}>
                          {formatDate(v.invoice_date)}
                          {v.invoice_date && <span style={{ marginLeft: '0.3rem' }}>· {timeAgo(v.invoice_date)}</span>}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: isActive ? 'var(--color-accent)' : 'var(--color-muted)', fontWeight: 600, marginLeft: 'auto' }}>{formatCurrency(v.total_amount, v.currency)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)', padding: '0 1.5rem', flexShrink: 0 }}>
          {(['details', 'matching'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: tab === t ? 700 : 500, fontFamily: "'DM Sans', sans-serif", color: tab === t ? 'var(--color-accent)' : 'var(--color-muted)', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--color-accent)' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s', marginBottom: '-1px', whiteSpace: 'nowrap' }}>
              {t === 'details' ? 'Details' : `Matching${invMatches.length > 0 ? ` (${invMatches.length})` : ''}`}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {tab === 'details' && (
            <>
              {isVoided && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.875rem 1rem', background: 'rgba(100,116,139,0.06)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 10 }}>
                  <span style={{ color: '#94a3b8' }}><IconVoid /></span>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>This invoice has been voided and is no longer active.</p>
                </div>
              )}
              {overdue && !isVoided && (
                <div className="banner banner-error animate-fade-in">
                  <span className="banner-icon">⚠</span>
                  <p>This invoice is <strong>{days} day{days !== 1 ? 's' : ''} overdue</strong>. A reminder should be sent immediately.</p>
                </div>
              )}
              <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.125rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {isVoided
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.18rem 0.6rem', borderRadius: 99, fontSize: '0.62rem', fontWeight: 700, background: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.25)', textTransform: 'uppercase' }}><IconVoid /> Voided</span>
                    : <StatusBadge status={activeInv.payment_status} />
                  }
                  <span className="font-display" style={{ fontSize: '1.25rem', fontWeight: 800, color: isVoided ? 'var(--color-muted)' : 'var(--color-accent)', textDecoration: isVoided ? 'line-through' : 'none' }}>{formatCurrency(activeInv.total_amount, activeInv.currency)}</span>
                </div>
                {!isVoided && (activeInv.paid_amount != null || activeInv.total_amount != null) && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>Payment progress</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>{formatCurrency(activeInv.paid_amount, activeInv.currency)} of {formatCurrency(activeInv.total_amount, activeInv.currency)}</span>
                    </div>
                    <PaymentProgress paid={activeInv.paid_amount} total={activeInv.total_amount} />
                  </div>
                )}
              </div>
              <section>
                <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>Details</p>
                <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0 0.875rem' }}>
                  <Row icon={<IconHash />}     label="Invoice #"  value={activeInv.invoice_number ?? `#${activeInv.id}`} />
                  <Row icon={<IconUser />}     label="Customer"   value={activeInv.customer_name ?? '—'} />
                  {activeInv.customer_email && <Row icon={<IconMail />}  label="Email" value={activeInv.customer_email} />}
                  {activeInv.customer_phone && <Row icon={<IconPhone />} label="Phone" value={activeInv.customer_phone} />}
                  <Row icon={<IconCurrency />} label="Total"      value={formatCurrency(activeInv.total_amount, activeInv.currency)} accent />
                  {activeInv.paid_amount != null && <Row icon={<IconCurrency />} label="Paid" value={formatCurrency(activeInv.paid_amount, activeInv.currency)} accent />}
                  <Row icon={<IconCalendar />} label="Invoice Dt" value={formatDate(activeInv.invoice_date)} />
                  <Row icon={<IconCalendar />} label="Due Date"   value={formatDate(activeInv.due_date)} danger={overdue && !isVoided} />
                </div>
              </section>
              {!isVoided && (
                <button
                  onClick={() => onVoid(activeInv)}
                  style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.875rem', borderRadius: 8, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)', cursor: 'pointer', color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(239,68,68,0.1)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(239,68,68,0.06)'; }}
                >
                  <IconVoid /> Void this invoice
                </button>
              )}
            </>
          )}

          {tab === 'matching' && (
            <>
              {invMatches.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '2.5rem 1rem', textAlign: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}><IconLink /></div>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)' }}>No matches yet</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', lineHeight: 1.6, maxWidth: 260 }}>When payments are matched to this invoice, results will appear here.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                    {[
                      { label: 'Matched Amount', value: formatCurrency(invMatches.reduce((s, m) => s + (m.matched_amount ?? 0), 0), activeInv.currency), color: 'var(--color-accent)' },
                      { label: 'Amount Pending', value: formatCurrency(invMatches.reduce((s, m) => s + (m.amount_pending ?? 0), 0), activeInv.currency), color: invMatches.some(m => (m.amount_pending ?? 0) > 0) ? '#f87171' : 'var(--color-muted)' },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0.875rem' }}>
                        <p className="font-display" style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color, marginBottom: '0.25rem' }}>{s.value}</p>
                        <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)' }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {invMatches.map((match, idx) => {
                    const cfg = MATCH_STATUS_CONFIG[match.match_status as keyof typeof MATCH_STATUS_CONFIG] ?? MATCH_STATUS_CONFIG.FAILED;
                    return (
                      <div key={match.match_id ?? idx} style={{ background: 'var(--color-surface-2)', border: `1px solid ${cfg.border}`, borderRadius: 12, overflow: 'hidden' }}>
                        <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: cfg.bg, borderBottom: `1px solid ${cfg.border}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: cfg.color }}><IconLink /></span>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                          </div>
                          {match.payment_detail_id && <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>Payment #{match.payment_detail_id}</span>}
                        </div>
                        <div style={{ padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)' }}>Matched Amount</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-accent)' }}>{formatCurrency(match.matched_amount, activeInv.currency)}</span>
                          </div>
                          {(match.amount_pending ?? 0) > 0 && match.match_status !== 'FULL' && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)' }}>Amount Pending</span>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f87171' }}>{formatCurrency(match.amount_pending, activeInv.currency)}</span>
                            </div>
                          )}
                          {match.match_status !== 'FULL' && match.match_reason && (
                            <div style={{ marginTop: '0.25rem', padding: '0.625rem 0.75rem', borderRadius: 8, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <span style={{ color: cfg.color, flexShrink: 0, marginTop: '0.1rem' }}><IconWarning /></span>
                                <p style={{ fontSize: '0.68rem', color: 'var(--color-text)', lineHeight: 1.6 }}>{match.match_reason}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
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

const ALL_STATUSES: PaymentStatus[] = ['PAID', 'UNPAID', 'PARTIAL', 'OVERPAID'];

export default function InvoiceTable() {
  const { invoices, loading, refreshing, error, refresh, clearError } = useInvoices();

  const activeInvoices = invoices.filter(i => !i.is_deleted);

  const [selected, setSelected]           = useState<Invoice | null>(null);
  const [voidTarget, setVoidTarget]       = useState<Invoice | null>(null);
  const [voiding, setVoiding]             = useState(false);
  const [search, setSearch]               = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<PaymentStatus>>(new Set());
  const [sortKey, setSortKey]             = useState<'due_date' | 'total_amount' | 'invoice_date' | 'id'>('id');
  const [sortDir, setSortDir]             = useState<'asc' | 'desc'>('desc');
  const [overdueOnly, setOverdueOnly]     = useState(false);
  const [currentPage, setCurrentPage]     = useState(1);
  const [pageSize, setPageSize]           = useState(25);

  const getVersionHistory = (inv: Invoice): Invoice[] => {
    const num = (inv.invoice_number ?? '').trim().toLowerCase();
    if (!num) return [inv];
    const versions = invoices.filter(i =>
      (i.invoice_number ?? '').trim().toLowerCase() === num
    );
    return versions.sort((a, b) => {
      const ta = a.invoice_date ? new Date(a.invoice_date).getTime() : a.id;
      const tb = b.invoice_date ? new Date(b.invoice_date).getTime() : b.id;
      return tb - ta;
    });
  };

  const handleVoid = async () => {
    if (!voidTarget) return;
    setVoiding(true);
    try {
      await invoiceService.delete(voidTarget.id);
      refresh();
      setVoidTarget(null);
      setSelected(null);
    } catch {}
    finally { setVoiding(false); }
  };

  const toggleFilter = (s: PaymentStatus) => {
    setActiveFilters(prev => { const next = new Set(prev); next.has(s) ? next.delete(s) : next.add(s); return next; });
    setCurrentPage(1);
  };
  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = activeInvoices.filter(i => normaliseStatus(i.payment_status) === s).length;
    return acc;
  }, {} as Record<PaymentStatus, number>);
  const overdueCount = activeInvoices.filter(i => isOverdue(i.due_date, i.payment_status)).length;

  const filtered = activeInvoices
    .filter(i => {
      if (activeFilters.size > 0 && !activeFilters.has(normaliseStatus(i.payment_status))) return false;
      if (overdueOnly && !isOverdue(i.due_date, i.payment_status)) return false;
      if (search) {
        const s = search.toLowerCase();
        return String(i.id).includes(s) || (i.invoice_number ?? '').toLowerCase().includes(s) || (i.customer_name ?? '').toLowerCase().includes(s) || (i.customer_email ?? '').toLowerCase().includes(s);
      }
      return true;
    })
    .sort((a, b) => {
      let va: number, vb: number;
      if (sortKey === 'total_amount')      { va = a.total_amount ?? 0; vb = b.total_amount ?? 0; }
      else if (sortKey === 'due_date')     { va = new Date(a.due_date ?? 0).getTime(); vb = new Date(b.due_date ?? 0).getTime(); }
      else if (sortKey === 'invoice_date') { va = new Date(a.invoice_date ?? 0).getTime(); vb = new Date(b.invoice_date ?? 0).getTime(); }
      else { va = a.id; vb = b.id; }
      return sortDir === 'desc' ? vb - va : va - vb;
    });

  const filteredTotal = filtered.length;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  // Group totals by currency so mixed-currency invoices are not summed together
  const currencyTotals = activeInvoices.reduce((acc, i) => {
    const c = (i.currency ?? 'INR').toUpperCase();
    if (!acc[c]) acc[c] = { total: 0, paid: 0 };
    acc[c].total += i.total_amount ?? 0;
    acc[c].paid  += i.paid_amount  ?? 0;
    return acc;
  }, {} as Record<string, { total: number; paid: number }>);

  const currencies = Object.keys(currencyTotals);
  const dominantCurrency = currencies.sort((a, b) => currencyTotals[b].total - currencyTotals[a].total)[0] ?? 'INR';
  const mixedCurrencies  = currencies.length > 1;

  // For stat cards — use dominant currency totals only
  const totalAmount = currencyTotals[dominantCurrency]?.total ?? 0;
  const totalPaid   = currencyTotals[dominantCurrency]?.paid  ?? 0;

  const SortTh = ({ col, label }: { col: typeof sortKey; label: string }) => (
    <th onClick={() => toggleSort(col)} style={{ padding: '0.6rem 1rem', textAlign: 'left', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em', color: sortKey === col ? 'var(--color-accent)' : 'var(--color-muted)', whiteSpace: 'nowrap', background: 'var(--color-surface-2)', userSelect: 'none', transition: 'color 0.15s' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
        {label}
        {sortKey === col && <span style={{ transform: sortDir === 'asc' ? 'rotate(180deg)' : 'none', display: 'inline-flex', transition: 'transform 0.2s' }}><IconChevronDown /></span>}
      </span>
    </th>
  );
  const thStyle: React.CSSProperties = { padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.6rem', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted)', whiteSpace: 'nowrap', background: 'var(--color-surface-2)' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1200 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-accent)', marginBottom: '0.35rem' }}>Receivables</p>
          <h2 className="font-display" style={{ fontSize: 'clamp(1.375rem, 2.5vw, 1.75rem)', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>Invoices</h2>
        </div>
        <button onClick={refresh} disabled={refreshing || loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.875rem', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.72rem', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(37,99,235,0.3)'; el.style.color = 'var(--color-accent)'; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border)'; el.style.color = 'var(--color-muted)'; }}
        >{refreshing ? <Spinner size={13} /> : <IconRefresh />} Refresh</button>
      </div>

      {!loading && activeInvoices.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.625rem' }}>
          {[
            { label: 'Total Invoices', value: activeInvoices.length,            color: 'var(--color-text)',   fmt: false },
            { label: `Total Value${mixedCurrencies ? ` (${dominantCurrency})` : ''}`,    value: totalAmount,                       color: 'var(--color-accent)', fmt: true  },
            { label: `Collected${mixedCurrencies ? ` (${dominantCurrency})` : ''}`,      value: totalPaid,                         color: '#16a34a',             fmt: true  },
            { label: `Outstanding${mixedCurrencies ? ` (${dominantCurrency})` : ''}`,    value: totalAmount - totalPaid,           color: '#ef4444',             fmt: true  },
            { label: 'Overdue',        value: overdueCount,                      color: '#ca8a04',             fmt: false },
          ].map(s => (
            <div key={s.label} className="stat-card" title={s.fmt ? formatCurrency(s.value as number, dominantCurrency) : String(s.value)} style={{ animation: 'fadeSlideUp 0.4s var(--ease-out-expo) both', overflow: 'hidden', minWidth: 0 }}>
              <p className="font-display" style={{ fontSize: 'clamp(0.95rem, 2vw, 1.35rem)', fontWeight: 800, color: s.color, lineHeight: 1.1, marginBottom: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.fmt ? formatCompact(s.value as number, dominantCurrency) : s.value}
              </p>
              <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <InlineUploadPanel docType="INVOICE" onSuccess={refresh} />

      {error && (
        <div className="banner banner-error animate-fade-in">
          <span className="banner-icon">⚠</span>
          <p>{error} — <button onClick={() => { clearError(); refresh(); }} style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', textDecoration: 'underline', fontFamily: "'DM Sans', sans-serif", fontSize: 'inherit', padding: 0 }}>Retry</button></p>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 9, padding: '0.55rem 0.875rem', flex: '1 1 200px', maxWidth: 300 }}>
          <span style={{ color: 'var(--color-muted)', flexShrink: 0 }}><IconSearch /></span>
          <input type="text" placeholder="Search invoice, customer…" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--color-text)', fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif", flex: 1, minWidth: 0 }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', padding: 0 }}><IconClose /></button>}
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {ALL_STATUSES.map(s => {
            const cfg = STATUS_CONFIG[s]; const active = activeFilters.has(s);
            return (
              <button key={s} onClick={() => toggleFilter(s)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem', borderRadius: 99, cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif", border: active ? `1px solid ${cfg.border}` : '1px solid var(--color-border)', background: active ? cfg.bg : 'transparent', color: active ? cfg.text : 'var(--color-muted)', transition: 'all 0.15s' }}>
                {cfg.label} <span style={{ opacity: 0.7 }}>({counts[s]})</span>
              </button>
            );
          })}
        </div>
        <button onClick={() => setOverdueOnly(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.75rem', borderRadius: 99, cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif", border: overdueOnly ? '1px solid rgba(202,138,4,0.4)' : '1px solid var(--color-border)', background: overdueOnly ? 'rgba(202,138,4,0.08)' : 'transparent', color: overdueOnly ? '#ca8a04' : 'var(--color-muted)', transition: 'all 0.15s' }}>
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
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0.5rem', borderRadius: 99, fontSize: '0.65rem', background: 'rgba(202,138,4,0.08)', color: '#ca8a04', border: '1px solid rgba(202,138,4,0.3)' }}>
              Overdue only
              <button onClick={() => setOverdueOnly(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0, opacity: 0.7 }}><IconClose /></button>
            </span>
          )}
          <button onClick={() => { setActiveFilters(new Set()); setOverdueOnly(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.68rem', fontFamily: "'DM Sans', sans-serif", textDecoration: 'underline', padding: 0 }}>Clear all</button>
        </div>
      )}

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '0.4rem' }}>{search || activeFilters.size > 0 || overdueOnly ? 'No invoices match your filters' : 'No invoices yet'}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-faint)' }}>{!search && activeFilters.size === 0 && !overdueOnly && 'Use the upload panel above to import invoices'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={thStyle}>Invoice #</th>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Status</th>
                  <SortTh col="total_amount"  label="Amount" />
                  <th style={thStyle}>Progress</th>
                  <SortTh col="invoice_date" label="Invoice Date" />
                  <SortTh col="due_date"     label="Due Date" />
                  <th style={thStyle}>Matched</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((inv, i) => {
                  const overdue     = isOverdue(inv.due_date, inv.payment_status);
                  const invMatches: InvoiceMatch[] = inv.matches ?? [];
                  const hasDiscrepancy = invMatches.some(m => (m.amount_pending ?? 0) > 0 && m.match_status !== 'FULL');
                  const historyCount = invoices.filter(x => (x.invoice_number ?? '').trim().toLowerCase() === (inv.invoice_number ?? '').trim().toLowerCase()).length;

                  return (
                    <tr key={inv.id}
                      onClick={() => setSelected(inv)}
                      style={{ borderBottom: i < paginated.length - 1 ? '1px solid var(--color-border)' : 'none', cursor: 'pointer', transition: 'background 0.15s', animation: `fadeSlideUp 0.3s var(--ease-out-expo) ${Math.min(i, 15) * 0.025}s both`, background: overdue ? 'rgba(239,68,68,0.02)' : 'transparent' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = overdue ? 'rgba(239,68,68,0.02)' : 'transparent'}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-accent)' }}>{inv.invoice_number ?? `#${inv.id}`}</span>
                          {historyCount > 1 && (
                            <span style={{ marginLeft: '0.4rem', fontSize: '0.58rem', fontWeight: 700, color: '#94a3b8', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 99, padding: '0.05rem 0.35rem' }}>
                              {historyCount - 1} past
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--color-text)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.customer_name ?? '—'}</td>
                      <td style={{ padding: '0.75rem 1rem' }}><StatusBadge status={inv.payment_status} /></td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>{formatCurrency(inv.total_amount, inv.currency)}</td>
                      <td style={{ padding: '0.75rem 1rem', minWidth: 120 }}><PaymentProgress paid={inv.paid_amount} total={inv.total_amount} /></td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>{formatDate(inv.invoice_date)}</td>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.75rem', color: overdue ? '#ef4444' : 'var(--color-muted)', fontWeight: overdue ? 600 : 400 }}>{formatDate(inv.due_date)}</span>
                        {overdue && <span style={{ marginLeft: '0.4rem', fontSize: '0.6rem', color: '#ef4444', fontWeight: 700 }}>+{daysOverdue(inv.due_date)}d</span>}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {invMatches.length === 0 ? (
                          <span style={{ fontSize: '0.65rem', color: 'var(--color-faint)' }}>—</span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0.55rem', borderRadius: 99, fontSize: '0.62rem', fontWeight: 700, background: hasDiscrepancy ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.08)', color: hasDiscrepancy ? '#f87171' : '#34d399', border: `1px solid ${hasDiscrepancy ? 'rgba(248,113,113,0.25)' : 'rgba(52,211,153,0.25)'}`, whiteSpace: 'nowrap' }}>
                            {hasDiscrepancy ? <IconWarning /> : <IconCheck />}
                            {invMatches.length} match{invMatches.length !== 1 ? 'es' : ''}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 1rem' }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setVoidTarget(inv)}
                          title="Void invoice"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: '1px solid transparent', borderRadius: 7, padding: '0.3rem 0.55rem', cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.65rem', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(239,68,68,0.3)'; el.style.color = '#ef4444'; el.style.background = 'rgba(239,68,68,0.06)'; }}
                          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'transparent'; el.style.color = 'var(--color-muted)'; el.style.background = 'none'; }}
                        >
                          <IconVoid /> Void
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filteredTotal > 0 && (
          <Pagination currentPage={currentPage} totalItems={filteredTotal} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={size => { setPageSize(size); setCurrentPage(1); }} />
        )}
      </div>

      {selected && (
        <InvoiceHistoryDrawer
          current={selected}
          allVersions={getVersionHistory(selected)}
          onClose={() => setSelected(null)}
          onVoid={inv => { setVoidTarget(inv); }}
        />
      )}

      {voidTarget && (
        <VoidConfirmModal
          label={`Invoice ${voidTarget.invoice_number ?? `#${voidTarget.id}`}`}
          onConfirm={handleVoid}
          onCancel={() => setVoidTarget(null)}
          voiding={voiding}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}