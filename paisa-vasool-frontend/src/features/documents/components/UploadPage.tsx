import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { documentService } from '../services/documentService';
import {
  uploadStarted,
  startPollingThunk,
  saveProgressRecordsThunk,
  updatePreviewRows,
  reset,
} from '../slices/Uploadprogresslice';
import type { DocumentType, InvoiceRecord, PaymentRecord } from '../types/Document';
import { ROUTES } from '../../../config/constants';

const IconUpload  = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const IconInvoice = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IconPayment = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IconCheck   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconClose   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconSpark   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;

function Spinner({ size = 18, color = '#000' }: { size?: number; color?: string }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${color}33`, borderTopColor: color, animation: 'spin 0.65s linear infinite', flexShrink: 0 }} />;
}
function formatBytes(b: number) { return b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`; }
const EXT_COLOR: Record<string, string> = { pdf: '#f87171', xlsx: '#34d399', xls: '#34d399', csv: '#fbbf24' };

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

function Step1({ docType, setDocType, file, setFile, onUpload, isProcessing, error }: {
  docType: DocumentType; setDocType: (t: DocumentType) => void;
  file: File | null; setFile: (f: File | null) => void;
  onUpload: () => void; isProcessing: boolean; error: string | null;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const ext = file?.name.split('.').pop()?.toLowerCase() ?? '';
  const extColor = EXT_COLOR[ext] ?? 'var(--color-muted)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
      <div>
        <p style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted)', marginBottom: '0.625rem' }}>File</p>
        {!file ? (
          <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }} onClick={() => inputRef.current?.click()} style={{ border: `2px dashed ${dragging ? 'var(--color-accent)' : 'var(--color-border)'}`, borderRadius: 12, padding: '2.5rem 1.5rem', textAlign: 'center', cursor: 'pointer', background: dragging ? 'var(--color-accent-soft)' : 'var(--color-surface-2)' }}>
            <div style={{ color: 'var(--color-muted)', display: 'flex', justifyContent: 'center', marginBottom: '0.875rem' }}><IconUpload /></div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text)', marginBottom: '0.3rem' }}>Drag & drop or <span style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>browse</span></p>
            <p style={{ fontSize: '0.68rem', color: 'var(--color-muted)' }}>PDF, XLSX, XLS or CSV — Max 10 MB</p>
            <input ref={inputRef} type="file" accept=".pdf,.xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem', borderRadius: 10, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 8, flexShrink: 0, background: `${extColor}18`, border: `1px solid ${extColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: extColor, fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase' }}>{ext}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--color-muted)', marginTop: '0.1rem' }}>{formatBytes(file.size)}</p>
            </div>
            <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', padding: '0.25rem' }}><IconClose /></button>
          </div>
        )}
      </div>
      {error && <div className="banner banner-error"><span className="banner-icon">⚠</span><p>{error}</p></div>}
      <button onClick={onUpload} disabled={!file || isProcessing} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: (!file || isProcessing) ? 0.5 : 1 }}>
        {isProcessing ? <><Spinner size={15} /> Uploading & Extracting…</> : <><IconSpark /> Upload & Extract Data</>}
      </button>
    </div>
  );
}

function Step2({ previewRows, fileName, onSave, onBack, saving, saveError, onUpdateRows }: {
  previewRows: (InvoiceRecord | PaymentRecord)[]; fileName: string | null;
  onSave: () => void; onBack: () => void; saving: boolean; saveError: string | null;
  onUpdateRows: (rows: (InvoiceRecord | PaymentRecord)[]) => void;
}) {
  const columns = previewRows.length > 0
    ? Object.keys(previewRows[0]).filter(k => !['id', 'document_id', '_sa_instance_state'].includes(k))
    : [];
  const handleCell = (ri: number, col: string, val: string) =>
    onUpdateRows(previewRows.map((r, i) => i === ri ? { ...r, [col]: val } : r));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="banner banner-success"><span className="banner-icon">✓</span><p><strong>{fileName}</strong> — {previewRows.length} record{previewRows.length !== 1 ? 's' : ''} extracted. Click any cell to edit.</p></div>
      {saveError && <div className="banner banner-error"><span className="banner-icon">⚠</span><p>{saveError}</p></div>}
      <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>{columns.map(col => <th key={col} style={{ padding: '0.5rem 0.875rem', textAlign: 'left', fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>{col.replace(/_/g, ' ')}</th>)}</tr></thead>
            <tbody>{previewRows.map((row, i) => <tr key={i} style={{ borderBottom: i < previewRows.length - 1 ? '1px solid var(--color-border)' : 'none' }}>{columns.map(col => <td key={col} style={{ padding: '0.3rem 0.5rem' }}><input value={row[col] != null ? String(row[col]) : ''} onChange={e => handleCell(i, col, e.target.value)} style={{ width: '100%', minWidth: 80, padding: '0.3rem 0.5rem', background: 'transparent', border: '1px solid transparent', borderRadius: 4, color: 'var(--color-text)', fontSize: '0.75rem', outline: 'none' }} onFocus={e => e.target.style.borderColor = 'var(--color-accent)'} onBlur={e => e.target.style.borderColor = 'transparent'} /></td>)}</tr>)}</tbody>
          </table>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <button onClick={onBack} className="btn-secondary" disabled={saving}>← Back</button>
        <button onClick={onSave} className="btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: saving ? 0.5 : 1 }}>
          {saving ? <><Spinner size={15} /> Saving…</> : <>Save to Database →</>}
        </button>
      </div>
    </div>
  );
}

function Step3({ fileName, rowCount, onReset }: { fileName: string | null; rowCount: number; onReset: () => void }) {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '1.5rem 0', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-accent-soft)', border: '2px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}><IconCheck /></div>
      <div>
        <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.4rem' }}>Saved!</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}><strong style={{ color: 'var(--color-text)' }}>{fileName}</strong> saved successfully. Matching has run.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%' }}>
        <button onClick={onReset} className="btn-secondary">Upload Another</button>
        <button onClick={() => navigate(ROUTES.MATCHING)} className="btn-primary">View Matching →</button>
      </div>
    </div>
  );
}

export default function UploadDocument() {
  const dispatch = useAppDispatch();
  const progress = useAppSelector(s => s.uploadProgress);
  const [file, setFile]       = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentType>('INVOICE');

  const step: 1 | 2 | 3 =
    progress.status === 'saved' ? 3
    : (progress.status === 'extracted' || progress.status === 'saving' || (progress.status === 'failed' && progress.previewRows.length > 0)) ? 2
    : 1;

  const isProcessing = progress.status === 'uploading' || progress.status === 'polling';

  const handleUpload = async () => {
    if (!file) return;
    const uploadRes = await documentService.upload(file, docType);
    dispatch(uploadStarted({ jobId: uploadRes.job_id, documentId: uploadRes.document_id, fileName: uploadRes.file_name, documentType: docType }));
    dispatch(startPollingThunk({ jobId: uploadRes.job_id }));
  };

  const handleSave = () => {
    if (!progress.documentId || !progress.documentType) return;
    dispatch(saveProgressRecordsThunk({ documentId: progress.documentId, documentType: progress.documentType, records: progress.previewRows }));
  };

  const handleReset = () => { dispatch(reset()); setFile(null); setDocType('INVOICE'); };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-accent)', marginBottom: '0.35rem' }}>Documents</p>
        <h2 className="font-display" style={{ fontSize: 'clamp(1.375rem, 2.5vw, 1.75rem)', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>Upload</h2>
      </div>
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '2rem' }}>
        <StepIndicator current={step} />
        {step === 1 && <Step1 docType={docType} setDocType={setDocType} file={file} setFile={setFile} onUpload={handleUpload} isProcessing={isProcessing} error={progress.error} />}
        {step === 2 && <Step2 previewRows={progress.previewRows} fileName={progress.fileName} onSave={handleSave} onBack={handleReset} saving={progress.status === 'saving'} saveError={progress.status === 'failed' ? progress.error : null} onUpdateRows={rows => dispatch(updatePreviewRows(rows))} />}
        {step === 3 && <Step3 fileName={progress.fileName} rowCount={progress.savedCount ?? progress.previewRows.length} onReset={handleReset} />}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}