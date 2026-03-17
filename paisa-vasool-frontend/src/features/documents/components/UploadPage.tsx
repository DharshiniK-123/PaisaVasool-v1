import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentService, extractAxiosError } from '../services/documentService';
import type { DocumentType, InvoiceRecord, PaymentRecord } from '../types/Document';
import { ROUTES } from '../../../config/constants';

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconUpload  = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const IconInvoice = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IconPayment = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IconCheck   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconClose   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconSpark   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;

function Spinner({ size = 16, color = '#000' }: { size?: number; color?: string }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${color}33`, borderTopColor: color, animation: 'spin 0.65s linear infinite', flexShrink: 0 }} />;
}
function formatBytes(b: number) { return b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`; }
const EXT_COLOR: Record<string, string> = { pdf: '#f87171', xlsx: '#34d399', xls: '#34d399', csv: '#fbbf24' };

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = ['Select & Upload', 'Review & Edit', 'Saved'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: '2rem' }}>
      {steps.map((label, i) => {
        const num = i + 1; const done = current > num; const active = current === num;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'var(--color-accent)' : active ? 'var(--color-accent-soft)' : 'var(--color-surface-2)', border: done ? 'none' : active ? '2px solid var(--color-accent)' : '1px solid var(--color-border)', color: done ? '#000' : active ? 'var(--color-accent)' : 'var(--color-muted)', fontSize: '0.72rem', fontWeight: 700 }}>
                {done ? <IconCheck /> : num}
              </div>
              <span style={{ fontSize: '0.62rem', color: active ? 'var(--color-accent)' : done ? 'var(--color-text)' : 'var(--color-muted)', whiteSpace: 'nowrap' }}>{label}</span>
            </div>
            {i < steps.length - 1 && <div style={{ width: 60, height: 1, background: current > num ? 'var(--color-accent)' : 'var(--color-border)', margin: '0 0.5rem', marginBottom: '1.2rem' }} />}
          </div>
        );
      })}
    </div>
  );
}

// ── Per-file state ────────────────────────────────────────────────────────────
type FileStatus = 'idle' | 'uploading' | 'polling' | 'extracted' | 'saving' | 'saved' | 'failed';

interface FileEntry {
  id: string;
  file: File;
  status: FileStatus;
  jobId: string | null;
  documentId: number | null;
  previewRows: (InvoiceRecord | PaymentRecord)[];
  savedCount: number | null;
  error: string | null;
}

function makeEntry(file: File): FileEntry {
  return { id: crypto.randomUUID(), file, status: 'idle', jobId: null, documentId: null, previewRows: [], savedCount: null, error: null };
}

// ── File review card ──────────────────────────────────────────────────────────
function FileReviewCard({
  entry, docType, onUpdateRows, onSave, onRemove,
}: {
  entry: FileEntry;
  docType: DocumentType;
  onUpdateRows: (id: string, rows: (InvoiceRecord | PaymentRecord)[]) => void;
  onSave: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const ext      = entry.file.name.split('.').pop()?.toLowerCase() ?? '';
  const extColor = EXT_COLOR[ext] ?? 'var(--color-muted)';
  const accent   = 'var(--color-accent)';

  const isProcessing = entry.status === 'uploading' || entry.status === 'polling';
  const isReady      = entry.status === 'extracted';
  const isSaving     = entry.status === 'saving';
  const isSaved      = entry.status === 'saved';
  const isFailed     = entry.status === 'failed';

  const columns = entry.previewRows.length > 0
    ? Object.keys(entry.previewRows[0]).filter(k => !['id', 'document_id', '_sa_instance_state'].includes(k))
    : [];

  const handleCell = (ri: number, col: string, val: string) =>
    onUpdateRows(entry.id, entry.previewRows.map((r, i) => i === ri ? { ...r, [col]: val } : r));

  return (
    <div style={{ background: 'var(--color-surface-2)', border: `1px solid ${isFailed ? 'rgba(248,113,113,0.35)' : isSaved ? 'rgba(52,211,153,0.4)' : 'var(--color-border)'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: `${extColor}18`, border: `1px solid ${extColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: extColor, fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase' }}>{ext}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.file.name}</p>
          <p style={{ fontSize: '0.62rem', color: 'var(--color-muted)', marginTop: '0.1rem' }}>{formatBytes(entry.file.size)}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isProcessing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.68rem', color: accent }}>
              <Spinner size={13} color="var(--color-accent)" />
              {entry.status === 'uploading' ? 'Uploading…' : 'Extracting…'}
            </div>
          )}
          {isSaved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem', color: accent, fontWeight: 600 }}>
              <IconCheck /> {entry.savedCount} saved
            </div>
          )}
          {isFailed && <span style={{ fontSize: '0.65rem', color: '#f87171', fontWeight: 600 }}>Failed</span>}
          {!isSaved && (
            <button onClick={() => onRemove(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', padding: '0.2rem' }}><IconClose /></button>
          )}
        </div>
      </div>

      {isFailed && entry.error && (
        <div style={{ padding: '0.625rem 1rem', background: 'rgba(248,113,113,0.06)', borderBottom: '1px solid rgba(248,113,113,0.2)', fontSize: '0.72rem', color: '#f87171', display: 'flex', gap: '0.5rem' }}>
          <span style={{ flexShrink: 0 }}>⚠</span><span>{entry.error}</span>
        </div>
      )}

      {(isReady || isSaving || isSaved) && entry.previewRows.length > 0 && (
        <div style={{ overflowX: 'auto', maxHeight: 240, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', position: 'sticky', top: 0 }}>
                {columns.map(col => <th key={col} style={{ padding: '0.5rem 0.875rem', textAlign: 'left', fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>{col.replace(/_/g, ' ')}</th>)}
              </tr>
            </thead>
            <tbody>
              {entry.previewRows.map((row, ri) => (
                <tr key={ri} style={{ borderBottom: ri < entry.previewRows.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  {columns.map(col => (
                    <td key={col} style={{ padding: '0.3rem 0.5rem' }}>
                      <input
                        value={row[col] != null ? String(row[col]) : ''}
                        onChange={e => handleCell(ri, col, e.target.value)}
                        disabled={isSaved}
                        style={{ width: '100%', minWidth: 80, padding: '0.3rem 0.5rem', background: 'transparent', border: '1px solid transparent', borderRadius: 4, color: 'var(--color-text)', fontSize: '0.75rem', outline: 'none' }}
                        onFocus={e => { if (!isSaved) e.target.style.borderColor = 'var(--color-accent)'; }}
                        onBlur={e => { e.target.style.borderColor = 'transparent'; }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isReady && (
        <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)' }}>
          <button onClick={() => onSave(entry.id)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.125rem', fontSize: '0.78rem' }}>
            <IconCheck /> Save {entry.previewRows.length} {docType === 'INVOICE' ? 'Invoice' : 'Payment'}{entry.previewRows.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}
      {isSaving && (
        <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: accent }}>
            <Spinner size={13} /> Saving…
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function UploadDocument() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [docType, setDocType]   = useState<DocumentType>('INVOICE');
  const [dragging, setDragging] = useState(false);
  const [entries, setEntries]   = useState<FileEntry[]>([]);
  const [step, setStep]         = useState<1 | 2 | 3>(1);

  const patchEntry = (id: string, patch: Partial<FileEntry>) =>
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));

  const addFiles = (files: FileList | File[]) => {
    const newEntries = Array.from(files).map(makeEntry);
    setEntries(prev => [...prev, ...newEntries]);
    if (step === 1) setStep(2);
  };

  const removeEntry = (id: string) => {
    setEntries(prev => {
      const next = prev.filter(e => e.id !== id);
      if (next.length === 0) setStep(1);
      return next;
    });
  };

  const updateRows = (id: string, rows: (InvoiceRecord | PaymentRecord)[]) =>
    patchEntry(id, { previewRows: rows });

  const uploadAndPoll = async (entry: FileEntry) => {
    const { id, file } = entry;
    patchEntry(id, { status: 'uploading', error: null });

    let uploadRes;
    try {
      uploadRes = await documentService.upload(file, docType);
    } catch (err) {
      patchEntry(id, { status: 'failed', error: extractAxiosError(err) });
      return;
    }

    patchEntry(id, { jobId: uploadRes.job_id, documentId: uploadRes.document_id, status: 'polling' });

    try {
      const pollRes = await documentService.pollJobStatus(uploadRes.job_id);
      patchEntry(id, { status: 'extracted', previewRows: pollRes.preview_data ?? [] });
    } catch (err) {
      patchEntry(id, { status: 'failed', error: err instanceof Error ? err.message : extractAxiosError(err) });
    }
  };

  const handleUploadAll = async () => {
    const idle = entries.filter(e => e.status === 'idle');
    await Promise.all(idle.map(uploadAndPoll));
  };

  const handleSave = async (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry || !entry.documentId) return;
    patchEntry(id, { status: 'saving', error: null });

    try {
      const res = await documentService.saveRecords(entry.documentId, docType, entry.previewRows);
      setEntries(prev => {
        const updated = prev.map(e =>
          e.id === id ? { ...e, status: 'saved' as FileStatus, savedCount: res.records_saved } : e,
        );
        const allDone = updated.every(e => e.status === 'saved' || e.status === 'failed');
        if (allDone) setStep(3);
        return updated;
      });
    } catch (err) {
      patchEntry(id, { status: 'failed', error: extractAxiosError(err) });
    }
  };

  const handleReset = () => { setEntries([]); setStep(1); };

  const anyProcessing = entries.some(e => e.status === 'uploading' || e.status === 'polling' || e.status === 'saving');
  const anyIdle       = entries.some(e => e.status === 'idle');
  const totalSaved    = entries.reduce((s, e) => s + (e.savedCount ?? 0), 0);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-accent)', marginBottom: '0.35rem' }}>Documents</p>
        <h2 className="font-display" style={{ fontSize: 'clamp(1.375rem, 2.5vw, 1.75rem)', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>Upload</h2>
      </div>

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '2rem' }}>
        <StepIndicator current={step} />

        {step !== 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Doc type selector — only on step 1 before files are added */}
            {step === 1 && (
              <div>
                <p style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted)', marginBottom: '0.625rem' }}>Document Type</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {(['INVOICE', 'PAYMENT'] as DocumentType[]).map(type => {
                    const active = docType === type;
                    return (
                      <button key={type} onClick={() => setDocType(type)} style={{ padding: '1rem', borderRadius: 12, cursor: 'pointer', textAlign: 'left', background: active ? 'var(--color-accent-soft)' : 'var(--color-surface-2)', border: active ? '1.5px solid rgba(52,211,153,0.4)' : '1px solid var(--color-border)', position: 'relative' }}>
                        {active && <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: '50%', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconCheck /></div>}
                        <div style={{ color: active ? 'var(--color-accent)' : 'var(--color-muted)', marginBottom: '0.5rem' }}>{type === 'INVOICE' ? <IconInvoice /> : <IconPayment />}</div>
                        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: active ? 'var(--color-accent)' : 'var(--color-text)' }}>{type === 'INVOICE' ? 'Invoice' : 'Payment'}</p>
                        <p style={{ fontSize: '0.65rem', color: 'var(--color-muted)', marginTop: '0.2rem' }}>{type === 'INVOICE' ? 'Bills issued to customers' : 'Incoming bank payments'}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}
              onClick={() => inputRef.current?.click()}
              style={{ border: `2px dashed ${dragging ? 'var(--color-accent)' : 'var(--color-border)'}`, borderRadius: 12, padding: entries.length ? '1.25rem 1.5rem' : '2.5rem 1.5rem', textAlign: 'center', cursor: 'pointer', background: dragging ? 'var(--color-accent-soft)' : 'var(--color-surface-2)', transition: 'all 0.2s' }}
            >
              <div style={{ color: 'var(--color-muted)', display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}><IconUpload /></div>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text)', marginBottom: '0.3rem' }}>Drag & drop or <span style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>browse</span></p>
              <p style={{ fontSize: '0.68rem', color: 'var(--color-muted)' }}>PDF, XLSX, XLS or CSV · Max 10 MB · Multiple files allowed</p>
              <input ref={inputRef} type="file" accept=".pdf,.xlsx,.xls,.csv" multiple style={{ display: 'none' }} onChange={e => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ''; }} />
            </div>

            {/* File cards */}
            {entries.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {entries.map(entry => (
                  <FileReviewCard
                    key={entry.id}
                    entry={entry}
                    docType={docType}
                    onUpdateRows={updateRows}
                    onSave={handleSave}
                    onRemove={removeEntry}
                  />
                ))}
              </div>
            )}

            {entries.length > 0 && anyIdle && (
              <button
                onClick={handleUploadAll}
                disabled={anyProcessing}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: anyProcessing ? 0.5 : 1 }}
              >
                {anyProcessing
                  ? <><Spinner size={15} /> Processing…</>
                  : <><IconSpark /> Upload & Extract {entries.filter(e => e.status === 'idle').length} File{entries.filter(e => e.status === 'idle').length !== 1 ? 's' : ''}</>
                }
              </button>
            )}
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '1.5rem 0', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-accent-soft)', border: '2px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}><IconCheck /></div>
            <div>
              <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.4rem' }}>Saved!</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                <strong style={{ color: 'var(--color-text)' }}>{totalSaved} record{totalSaved !== 1 ? 's' : ''}</strong> from {entries.length} file{entries.length !== 1 ? 's' : ''} saved successfully. Matching has run.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%' }}>
              <button onClick={handleReset} className="btn-secondary">Upload More</button>
              <button onClick={() => navigate(ROUTES.MATCHING)} className="btn-primary">View Matching →</button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
