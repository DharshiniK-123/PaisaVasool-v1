import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentUpload } from '../hooks/usedocumentupload';
import type { DocumentType } from '../types/Document';
import { ROUTES } from '../../../config/constants';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconUpload = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const IconInvoice = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IconPayment = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconSpark = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Spinner({ size = 18, color = '#000' }: { size?: number; color?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${color}33`, borderTopColor: color,
      animation: 'spin 0.65s linear infinite', flexShrink: 0,
    }} />
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const EXT_COLOR: Record<string, string> = {
  pdf: '#f87171', xlsx: '#34d399', xls: '#34d399', csv: '#fbbf24',
};

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = ['Select & Upload', 'Preview', 'Confirm'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: '2rem' }}>
      {steps.map((label, i) => {
        const num = i + 1;
        const done = current > num;
        const active = current === num;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? 'var(--color-accent)' : active ? 'var(--color-accent-soft)' : 'var(--color-surface-2)',
                border: done ? 'none' : active ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                color: done ? '#000' : active ? 'var(--color-accent)' : 'var(--color-muted)',
                fontSize: '0.72rem', fontWeight: 700, transition: 'all 0.3s',
              }}>
                {done ? <IconCheck /> : num}
              </div>
              <span style={{ fontSize: '0.62rem', color: active ? 'var(--color-accent)' : done ? 'var(--color-text)' : 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 60, height: 1, background: current > num ? 'var(--color-accent)' : 'var(--color-border)', margin: '0 0.5rem', marginBottom: '1.2rem', transition: 'background 0.3s' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function Step1({
  docType, setDocType, file, setFile, onUpload, uploading, uploadError,
}: {
  docType: DocumentType;
  setDocType: (t: DocumentType) => void;
  file: File | null;
  setFile: (f: File | null) => void;
  onUpload: () => void;
  uploading: boolean;
  uploadError: string | null;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const ext = file?.name.split('.').pop()?.toLowerCase() ?? '';
  const extColor = EXT_COLOR[ext] ?? 'var(--color-muted)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeSlideUp 0.3s var(--ease-out-expo) both' }}>

      {/* Doc type selector */}
      <div>
        <p style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted)', marginBottom: '0.625rem' }}>
          Document Type
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {(['INVOICE', 'PAYMENT'] as DocumentType[]).map((type) => {
            const active = docType === type;
            return (
              <button key={type} onClick={() => setDocType(type)} style={{
                padding: '1rem', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                background: active ? 'var(--color-accent-soft)' : 'var(--color-surface-2)',
                border: active ? '1.5px solid rgba(52,211,153,0.4)' : '1px solid var(--color-border)',
                transition: 'all 0.18s', position: 'relative',
              }}>
                {active && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8, width: 18, height: 18,
                    borderRadius: '50%', background: 'var(--color-accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <IconCheck />
                  </div>
                )}
                <div style={{ color: active ? 'var(--color-accent)' : 'var(--color-muted)', marginBottom: '0.5rem' }}>
                  {type === 'INVOICE' ? <IconInvoice /> : <IconPayment />}
                </div>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: active ? 'var(--color-accent)' : 'var(--color-text)' }}>{type === 'INVOICE' ? 'Invoice' : 'Payment'}</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--color-muted)', marginTop: '0.2rem' }}>
                  {type === 'INVOICE' ? 'Bills issued to customers' : 'Incoming bank payments'}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Drop zone */}
      <div>
        <p style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted)', marginBottom: '0.625rem' }}>
          File
        </p>
        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? 'var(--color-accent)' : 'var(--color-border)'}`,
              borderRadius: 12, padding: '2.5rem 1.5rem', textAlign: 'center', cursor: 'pointer',
              background: dragging ? 'var(--color-accent-soft)' : 'var(--color-surface-2)',
              transition: 'all 0.18s', transform: dragging ? 'scale(1.01)' : 'none',
            }}
          >
            <div style={{ color: dragging ? 'var(--color-accent)' : 'var(--color-muted)', display: 'flex', justifyContent: 'center', marginBottom: '0.875rem' }}>
              <IconUpload />
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text)', marginBottom: '0.3rem' }}>
              Drag & drop or <span style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>browse</span>
            </p>
            <p style={{ fontSize: '0.68rem', color: 'var(--color-muted)', marginBottom: '0.875rem' }}>PDF, XLSX, XLS or CSV — Max 10 MB
</p>
            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {['PDF', 'XLSX', 'XLS', 'CSV'].map(f => (
                <span key={f} style={{ padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>{f}</span>
              ))}
            </div>
            <input ref={inputRef} type="file" accept=".pdf,.xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.875rem',
            padding: '0.875rem 1rem', borderRadius: 10,
            background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 8, flexShrink: 0,
              background: `${extColor}18`, border: `1px solid ${extColor}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: extColor, fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase',
            }}>
              {ext}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--color-muted)', marginTop: '0.1rem' }}>{formatBytes(file.size)}</p>
            </div>
            <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', padding: '0.25rem' }}>
              <IconClose />
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {uploadError && (
        <div className="banner banner-error animate-fade-in">
          <span className="banner-icon">⚠</span><p>{uploadError}</p>
        </div>
      )}

      {/* Upload button */}
      <button
        onClick={onUpload}
        disabled={!file || uploading}
        className="btn-primary"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: (!file || uploading) ? 0.5 : 1 }}
      >
        {uploading ? <><Spinner size={15} /> Uploading & Extracting…</> : <><IconSpark /> Upload & Extract Data</>}
      </button>
    </div>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function Step2({
  docType, previewRows, previewLoading, previewError, fileName,
  onConfirm, onBack,
}: {
  docType: DocumentType;
  previewRows: Record<string, unknown>[];
  previewLoading: boolean;
  previewError: string | null;
  fileName: string | null;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const columns = previewRows.length > 0 ? Object.keys(previewRows[0]).filter(k => k !== 'document_id') : [];
  const displayRows = previewRows.slice(0, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeSlideUp 0.3s var(--ease-out-expo) both' }}>

      <div className="banner banner-success animate-fade-in">
        <span className="banner-icon">✓</span>
        <p><strong>{fileName}</strong> uploaded. Data extracted successfully.</p>
      </div>

      {previewLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(52,211,153,0.2)', borderTopColor: 'var(--color-accent)', animation: 'spin 0.65s linear infinite' }} />
        </div>
      ) : previewError ? (
        <div className="banner banner-error"><span className="banner-icon">⚠</span><p>{previewError}</p></div>
      ) : (
        <>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-accent-soft)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
              {docType === 'INVOICE' ? <IconInvoice /> : <IconPayment />}
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)' }}>
                Extracted {docType === 'INVOICE' ? 'Invoice' : 'Payment'} Records
              </p>
              <p style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>{previewRows.length} row{previewRows.length !== 1 ? 's' : ''} found</p>
            </div>
          </div>

          {/* Table */}
          <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                    {columns.map(col => (
                      <th key={col} style={{ padding: '0.5rem 0.875rem', textAlign: 'left', fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted)', whiteSpace: 'nowrap', fontFamily: 'Outfit, sans-serif' }}>
                        {col.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row, i) => (
                    <tr key={i} style={{ borderBottom: i < displayRows.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                      {columns.map(col => (
                        <td key={col} style={{ padding: '0.55rem 0.875rem', color: row[col] != null ? 'var(--color-text)' : 'var(--color-faint)', whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row[col] != null ? String(row[col]) : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewRows.length > 10 && (
              <div style={{ padding: '0.5rem 0.875rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '0.65rem', color: 'var(--color-muted)' }}>
                +{previewRows.length - 10} more rows
              </div>
            )}
          </div>
        </>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <button onClick={onBack} className="btn-secondary">← Back</button>
        <button onClick={onConfirm} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          Save & Run Matching →
        </button>
      </div>
    </div>
  );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────

function Step3({ docType, fileName, rowCount, onReset }: {
  docType: DocumentType; fileName: string | null; rowCount: number; onReset: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '1.5rem 0', animation: 'fadeSlideUp 0.4s var(--ease-out-expo) both', textAlign: 'center' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'var(--color-accent-soft)', border: '2px solid rgba(52,211,153,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-accent)', animation: 'popIn 0.4s var(--ease-bounce) 0.1s both',
      }}>
        <IconCheck />
      </div>
      <div>
        <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.4rem' }}>All done!</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--color-text)' }}>{fileName}</strong> was saved and matching has run automatically.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem', width: '100%' }}>
        {[
          { label: 'Records', value: rowCount },
          { label: 'Type', value: docType === 'INVOICE' ? 'Invoice' : 'Payment' },
          { label: 'Status', value: 'Matched' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ textAlign: 'center' }}>
            <p className="font-display" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-accent)', marginBottom: '0.25rem' }}>{s.value}</p>
            <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%' }}>
        <button onClick={onReset} className="btn-secondary">Upload Another</button>
        <button onClick={() => navigate(ROUTES.MATCHING)} className="btn-primary">View Matching →</button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UploadDocument() {
  const [step, setStep]       = useState<1 | 2 | 3>(1);
  const [docType, setDocType] = useState<DocumentType>('INVOICE');
  const [file, setFile]       = useState<File | null>(null);

  const {
    uploading, uploadError, uploadedFileName,
    previewRows, previewLoading, previewError,
    upload, reset,
  } = useDocumentUpload();

  const handleUpload = async () => {
    if (!file) return;
    const ok = await upload(file, docType);
    if (ok) setStep(2);
  };

  const handleConfirm = () => setStep(3);

  const handleReset = () => {
    reset();
    setFile(null);
    setDocType('INVOICE');
    setStep(1);
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-accent)', marginBottom: '0.35rem' }}>
          Documents
        </p>
        <h2 className="font-display" style={{ fontSize: 'clamp(1.375rem, 2.5vw, 1.75rem)', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
          Upload
        </h2>
      </div>

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '2rem' }}>
        <StepIndicator current={step} />

        {step === 1 && (
          <Step1
            docType={docType} setDocType={setDocType}
            file={file} setFile={setFile}
            onUpload={handleUpload}
            uploading={uploading}
            uploadError={uploadError}
          />
        )}
        {step === 2 && (
          <Step2
            docType={docType}
            previewRows={previewRows as Record<string, unknown>[]}
            previewLoading={previewLoading}
            previewError={previewError}
            fileName={uploadedFileName}
            onConfirm={handleConfirm}
            onBack={handleReset}
          />
        )}
        {step === 3 && (
          <Step3
            docType={docType}
            fileName={uploadedFileName}
            rowCount={previewRows.length}
            onReset={handleReset}
          />
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}