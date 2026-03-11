import { useState } from 'react';
import { usePayments } from '../hooks/usePayments';
import { paymentService } from '../services/paymentService';
import type { Payment } from '../types/Payment';
import Pagination from '../../../components/common/Pagination';

const IconSearch = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const IconRefresh = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>);
const IconClose = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IconPayment = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>);
const IconChevronDown = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>);
const IconUser = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IconMail = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>);
const IconPhone = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>);
const IconHash = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>);
const IconCurrency = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const IconCalendar = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const IconBank = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>);
const IconMode = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>);
const IconNote = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>);
const IconTrash = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>);

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

const MODE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  UPI:    { label: 'UPI',    bg: 'rgba(52,211,153,0.1)',   text: '#34d399', border: 'rgba(52,211,153,0.25)'  },
  NEFT:   { label: 'NEFT',   bg: 'rgba(96,165,250,0.1)',   text: '#60a5fa', border: 'rgba(96,165,250,0.25)'  },
  RTGS:   { label: 'RTGS',   bg: 'rgba(139,92,246,0.1)',   text: '#a78bfa', border: 'rgba(139,92,246,0.25)'  },
  IMPS:   { label: 'IMPS',   bg: 'rgba(251,191,36,0.1)',   text: '#fbbf24', border: 'rgba(251,191,36,0.25)'  },
  CHEQUE: { label: 'Cheque', bg: 'rgba(251,146,60,0.1)',   text: '#fb923c', border: 'rgba(251,146,60,0.25)'  },
  CASH:   { label: 'Cash',   bg: 'rgba(52,211,153,0.08)',  text: '#6ee7b7', border: 'rgba(52,211,153,0.2)'   },
  OTHER:  { label: 'Other',  bg: 'rgba(100,116,139,0.08)', text: 'var(--color-muted)', border: 'var(--color-border)' },
};

function ModeBadge({ mode }: { mode?: string | null }) {
  if (!mode) return <span style={{ color: 'var(--color-faint)', fontSize: '0.72rem' }}>—</span>;
  const key = mode.toUpperCase();
  const c = MODE_CONFIG[key] ?? MODE_CONFIG.OTHER;
  return <span style={{ display: 'inline-block', padding: '0.18rem 0.6rem', borderRadius: 99, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{c.label}</span>;
}

function DeleteConfirmModal({ label, onConfirm, onCancel, deleting }: {
  label: string; onConfirm: () => void; onCancel: () => void; deleting: boolean;
}) {
  return (
    <>
      <div onClick={!deleting ? onCancel : undefined} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', zIndex: 40, animation: 'fadeIn 0.2s ease both' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '100%', maxWidth: 400, zIndex: 50, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '2rem', boxShadow: 'var(--shadow-lg)', animation: 'popIn 0.25s var(--ease-bounce) both' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
            <IconTrash />
          </div>
          <div>
            <h3 className="font-display" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>Delete {label}?</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-muted)', lineHeight: 1.65 }}>Do you wnat to delete the payment details?</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%' }}>
            <button onClick={onCancel} disabled={deleting} className="btn-secondary" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cancel</button>
            <button onClick={onConfirm} disabled={deleting} style={{ padding: '0.75rem', borderRadius: 10, border: 'none', cursor: deleting ? 'not-allowed' : 'pointer', background: '#ef4444', color: '#fff', fontWeight: 600, fontSize: '0.82rem', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', opacity: deleting ? 0.6 : 1, transition: 'opacity 0.15s' }}>
              {deleting ? <Spinner size={14} color="#fff" /> : <IconTrash />}
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function PaymentDrawer({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const KNOWN_KEYS = ['id','payer_name','payer_email','payer_phone','amount','payment_date','reference_number','bank_name','payment_mode','notes','document_id','customer_id','is_deleted','isdeleted','updated_at','created_at'];
  const Row = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent?: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ color: 'var(--color-muted)', flexShrink: 0, width: 16, display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', flex: '0 0 90px' }}>{label}</span>
      <span style={{ fontSize: '0.8rem', fontWeight: 500, flex: 1, color: accent ? 'var(--color-accent)' : 'var(--color-text)', textAlign: 'right' }}>{value}</span>
    </div>
  );
  const extraFields = Object.entries(payment).filter(([k]) => !KNOWN_KEYS.includes(k) && payment[k] != null && String(payment[k]).trim() !== '');
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 460, background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)', zIndex: 50, display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 48px rgba(0,0,0,0.55)', animation: 'slideInRight 0.3s var(--ease-out-expo) both' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--color-accent-soft)', border: '1px solid rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}><IconPayment /></div>
            <div>
              <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-muted)', marginBottom: '0.1rem' }}>Payment Detail</p>
              <h3 className="font-display" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>{payment.reference_number ?? `Payment #${payment.id}`}</h3>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.45rem', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', transition: 'all 0.15s' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border-hover)'; el.style.color = 'var(--color-text)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border)'; el.style.color = 'var(--color-muted)'; }}
          ><IconClose /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--color-surface-2), var(--color-surface-3))', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 12, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: '0.35rem' }}>Amount Received</p>
              <p className="font-display" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1 }}>{formatCurrency(payment.amount)}</p>
              {payment.payment_date && <p style={{ fontSize: '0.7rem', color: 'var(--color-muted)', marginTop: '0.4rem' }}>on {formatDate(payment.payment_date)}</p>}
            </div>
            <ModeBadge mode={payment.payment_mode} />
          </div>
          <section>
            <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>Payer Information</p>
            <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0 0.875rem' }}>
              <Row icon={<IconUser />} label="Payer" value={payment.payer_name ?? '—'} />
              {payment.payer_email && <Row icon={<IconMail />} label="Email" value={payment.payer_email} />}
              {payment.payer_phone && <Row icon={<IconPhone />} label="Phone" value={payment.payer_phone} />}
            </div>
          </section>
          <section>
            <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>Transaction</p>
            <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0 0.875rem' }}>
              <Row icon={<IconCurrency />} label="Amount" value={formatCurrency(payment.amount)} accent />
              <Row icon={<IconCalendar />} label="Date" value={formatDate(payment.payment_date)} />
              {payment.reference_number && <Row icon={<IconHash />} label="Reference" value={payment.reference_number} />}
              {payment.bank_name && <Row icon={<IconBank />} label="Bank" value={payment.bank_name} />}
              {payment.payment_mode && <Row icon={<IconMode />} label="Mode" value={<ModeBadge mode={payment.payment_mode} />} />}

            </div>
          </section>
          {payment.notes && (
            <section>
              <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>Notes</p>
              <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0.875rem', display: 'flex', gap: '0.625rem' }}>
                <span style={{ color: 'var(--color-muted)', flexShrink: 0, marginTop: '0.1rem' }}><IconNote /></span>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text)', lineHeight: 1.6 }}>{payment.notes}</p>
              </div>
            </section>
          )}
          {extraFields.length > 0 && (
            <section>
              <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>Additional Fields</p>
              <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0 0.875rem' }}>
                {extraFields.map(([k, v]) => <Row key={k} icon={<IconHash />} label={k.replace(/_/g, ' ')} value={String(v)} />)}
              </div>
            </section>
          )}
        </div>
      </div>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </>
  );
}

export default function PaymentTable() {
  const { payments, loading, refreshing, error, refresh, clearError } = usePayments();

  const [selected, setSelected]         = useState<Payment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [search, setSearch]             = useState('');
  const [modeFilter, setModeFilter]     = useState<string | null>(null);
  const [sortKey, setSortKey]           = useState<'amount' | 'payment_date' | 'id'>('id');
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage]   = useState(1);
  const [pageSize, setPageSize]         = useState(25);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await paymentService.delete(deleteTarget.id);
      refresh();
      setDeleteTarget(null);
    } catch {
    } finally {
      setDeleting(false);
    }
  };

  const modes = Array.from(new Set(payments.map(p => p.payment_mode?.toUpperCase()).filter(Boolean) as string[]));

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = payments
    .filter(p => {
      if (modeFilter && (p.payment_mode ?? '').toUpperCase() !== modeFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (String(p.id).includes(s) || (p.payer_name ?? '').toLowerCase().includes(s) || (p.reference_number ?? '').toLowerCase().includes(s) || (p.bank_name ?? '').toLowerCase().includes(s) || (p.payer_email ?? '').toLowerCase().includes(s));
      }
      return true;
    })
    .sort((a, b) => {
      let va: number, vb: number;
      if (sortKey === 'amount') { va = a.amount ?? 0; vb = b.amount ?? 0; }
      else if (sortKey === 'payment_date') { va = new Date(a.payment_date ?? 0).getTime(); vb = new Date(b.payment_date ?? 0).getTime(); }
      else { va = a.id; vb = b.id; }
      return sortDir === 'desc' ? vb - va : va - vb;
    });

  const filteredTotal = filtered.length;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalReceived = payments.reduce((s, p) => s + (p.amount ?? 0), 0);
  const avgPayment    = payments.length ? totalReceived / payments.length : 0;
  const maxPayment    = payments.reduce((m, p) => Math.max(m, p.amount ?? 0), 0);

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
          <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-accent)', marginBottom: '0.35rem' }}>Incoming</p>
          <h2 className="font-display" style={{ fontSize: 'clamp(1.375rem, 2.5vw, 1.75rem)', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>Payments</h2>
        </div>
        <button onClick={refresh} disabled={refreshing || loading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.875rem', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.72rem', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(37,99,235,0.3)'; el.style.color = 'var(--color-accent)'; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--color-border)'; el.style.color = 'var(--color-muted)'; }}
        >{refreshing ? <Spinner size={13} /> : <IconRefresh />} Refresh</button>
      </div>

      {!loading && payments.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.625rem' }}>
          {[
            { label: 'Total Payments', value: payments.length, color: 'var(--color-text)',  fmt: false },
            { label: 'Total Received', value: totalReceived,   color: 'var(--color-accent)', fmt: true  },
            { label: 'Avg Payment',    value: avgPayment,       color: '#2563eb',             fmt: true  },
            { label: 'Largest',        value: maxPayment,       color: '#7c3aed',             fmt: true  },
          ].map((s, i) => (
            <div key={s.label} className="stat-card" style={{ animation: `fadeSlideUp 0.4s var(--ease-out-expo) ${i * 0.06}s both` }}>
              <p className="font-display" style={{ fontSize: '1.35rem', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: '0.3rem' }}>{s.fmt ? formatCurrency(s.value as number) : s.value}</p>
              <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted)' }}>{s.label}</p>
            </div>
          ))}
          {modes.length > 0 && (
            <div className="stat-card" style={{ animation: 'fadeSlideUp 0.4s var(--ease-out-expo) 0.24s both' }}>
              <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>By Mode</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {modes.slice(0, 3).map(m => {
                  const cnt = payments.filter(p => (p.payment_mode ?? '').toUpperCase() === m).length;
                  const cfg = MODE_CONFIG[m] ?? MODE_CONFIG.OTHER;
                  return <div key={m} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ fontSize: '0.65rem', color: cfg.text, fontWeight: 600 }}>{m}</span><span style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>{cnt}</span></div>;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="banner banner-error animate-fade-in">
          <span className="banner-icon">⚠</span>
          <p>{error} — <button onClick={() => { clearError(); refresh(); }} style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', textDecoration: 'underline', fontFamily: "'DM Sans', sans-serif", fontSize: 'inherit', padding: 0 }}>Retry</button></p>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 9, padding: '0.55rem 0.875rem', flex: '1 1 200px', maxWidth: 300 }}>
          <span style={{ color: 'var(--color-muted)', flexShrink: 0 }}><IconSearch /></span>
          <input type="text" placeholder="Search payer, reference, bank…" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--color-text)', fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif", flex: 1, minWidth: 0 }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', padding: 0 }}><IconClose /></button>}
        </div>
        {modes.length > 0 && (
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {modes.map(m => {
              const cfg = MODE_CONFIG[m] ?? MODE_CONFIG.OTHER;
              const active = modeFilter === m;
              const cnt = payments.filter(p => (p.payment_mode ?? '').toUpperCase() === m).length;
              return <button key={m} onClick={() => setModeFilter(active ? null : m)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem', borderRadius: 99, cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif", border: active ? `1px solid ${cfg.border}` : '1px solid var(--color-border)', background: active ? cfg.bg : 'transparent', color: active ? cfg.text : 'var(--color-muted)', transition: 'all 0.15s' }}>{cfg.label} <span style={{ opacity: 0.7 }}>({cnt})</span></button>;
            })}
            {modeFilter && <button onClick={() => setModeFilter(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.68rem', fontFamily: "'DM Sans', sans-serif", textDecoration: 'underline', padding: '0 0.25rem' }}>Clear</button>}
          </div>
        )}
      </div>

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '0.4rem' }}>{search || modeFilter ? 'No payments match your filters' : 'No payments yet'}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-faint)' }}>{!search && !modeFilter && 'Upload a payment document to get started'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={thStyle}>Ref / ID</th>
                  <th style={thStyle}>Payer</th>
                  <SortTh col="amount" label="Amount" />
                  <SortTh col="payment_date" label="Date" />
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p, i) => (
                  <tr key={p.id} onClick={() => setSelected(p)} style={{ borderBottom: i < paginated.length - 1 ? '1px solid var(--color-border)' : 'none', cursor: 'pointer', transition: 'background 0.15s', animation: `fadeSlideUp 0.3s var(--ease-out-expo) ${Math.min(i, 15) * 0.025}s both` }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <td style={{ padding: '0.75rem 1rem' }}>{p.reference_number ? <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-accent)', fontFamily: 'monospace' }}>{p.reference_number}</span> : <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>#{p.id}</span>}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div>
                        <p style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>{p.payer_name ?? '—'}</p>
                        {p.payer_email && <p style={{ fontSize: '0.65rem', color: 'var(--color-muted)', marginTop: '0.1rem', whiteSpace: 'nowrap' }}>{p.payer_email}</p>}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-accent)', whiteSpace: 'nowrap' }}>{formatCurrency(p.amount)}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>{formatDate(p.payment_date)}</td>
                    <td style={{ padding: '0.5rem 1rem' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        title="Delete payment"
                        style={{ background: 'none', border: '1px solid transparent', borderRadius: 7, padding: '0.35rem', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', transition: 'all 0.15s' }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(239,68,68,0.25)'; el.style.color = '#ef4444'; el.style.background = 'rgba(239,68,68,0.06)'; }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'transparent'; el.style.color = 'var(--color-muted)'; el.style.background = 'none'; }}
                      >
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                ))}
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

      {selected && <PaymentDrawer payment={selected} onClose={() => setSelected(null)} />}
      {deleteTarget && (
        <DeleteConfirmModal
          label={`Payment ${deleteTarget.reference_number ?? `#${deleteTarget.id}`}`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}