/**
 * InlineUploadPanel
 * ─────────────────
 * Upload flow mirrors UploadPage exactly:
 *   1. Upload file  → documentService.upload()
 *   2. Dispatch uploadStarted + startPollingThunk  → background extraction runs
 *   3. Process PAUSES at 'extracted' — user reviews / edits the table
 *   4. User clicks Save → dispatch saveProgressRecordsThunk
 *
 * Multiple files are supported; each gets its own entry that goes through
 * the same 4-step lifecycle independently.
 *
 * The global UploadProgressBanner is kept in sync via the uploadProgress
 * Redux slice so the user sees extraction progress from anywhere in the app.
 */

import { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import {
  uploadStarted,
  startPollingThunk,
  saveProgressRecordsThunk,
  clearReviewRequest,
} from '../slices/Uploadprogresslice';
import { documentService, extractAxiosError } from '../services/documentService';
import type { DocumentType, InvoiceRecord, PaymentRecord } from '../types/Document';

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconUpload    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const IconCheck     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconClose     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconSpark     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const IconChevronUp = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>;

function Spinner({ size = 16, color = 'var(--color-accent)' }: { size?: number; color?: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${color}22`, borderTopColor: color, animation: 'spin 0.65s linear infinite', flexShrink: 0 }} />
  );
}

function formatBytes(b: number) {
  return b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;
}

const EXT_COLOR: Record<string, string> = { pdf: '#f87171', xlsx: '#34d399', xls: '#34d399', csv: '#fbbf24' };

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current, accent }: { current: 1 | 2 | 3; accent: string }) {
  const steps = ['Select & Upload', 'Review & Edit', 'Saved'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: '1.5rem' }}>
      {steps.map((label, i) => {
        const num = i + 1; const done = current > num; const active = current === num;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? accent : active ? `${accent}18` : 'var(--color-surface-2)', border: done ? 'none' : active ? `2px solid ${accent}` : '1px solid var(--color-border)', color: done ? '#000' : active ? accent : 'var(--color-muted)', fontSize: '0.68rem', fontWeight: 700 }}>
                {done ? <IconCheck /> : num}
              </div>
              <span style={{ fontSize: '0.6rem', color: active ? accent : done ? 'var(--color-text)' : 'var(--color-muted)', whiteSpace: 'nowrap' }}>{label}</span>
            </div>
            {i < steps.length - 1 && <div style={{ width: 52, height: 1, background: current > num ? accent : 'var(--color-border)', margin: '0 0.4rem', marginBottom: '1.1rem' }} />}
          </div>
        );
      })}
    </div>
  );
}

// ── Per-file state ────────────────────────────────────────────────────────────
// Mirrors the statuses in UploadProgressState so the same language is used
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
  entry, docType, accent, onUpdateRows, onSave, onRemove,
}: {
  entry: FileEntry;
  docType: DocumentType;
  accent: string;
  onUpdateRows: (id: string, rows: (InvoiceRecord | PaymentRecord)[]) => void;
  onSave: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const ext      = entry.file.name.split('.').pop()?.toLowerCase() ?? '';
  const extColor = EXT_COLOR[ext] ?? 'var(--color-muted)';

  const isProcessing = entry.status === 'uploading' || entry.status === 'polling';
  const isReady      = entry.status === 'extracted';   // ← process pauses here
  const isSaving     = entry.status === 'saving';
  const isSaved      = entry.status === 'saved';
  const isFailed     = entry.status === 'failed';

  const columns = entry.previewRows.length > 0
    ? Object.keys(entry.previewRows[0]).filter(k => !['id', 'document_id', '_sa_instance_state'].includes(k))
    : [];

  const handleCell = (ri: number, col: string, val: string) =>
    onUpdateRows(entry.id, entry.previewRows.map((r, i) => i === ri ? { ...r, [col]: val } : r));

  return (
    <div style={{ background: 'var(--color-surface-2)', border: `1px solid ${isFailed ? 'rgba(248,113,113,0.35)' : isSaved ? `${accent}44` : 'var(--color-border)'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s' }}>

      {/* File header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: `${extColor}18`, border: `1px solid ${extColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: extColor, fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase' }}>{ext}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.file.name}</p>
          <p style={{ fontSize: '0.62rem', color: 'var(--color-muted)', marginTop: '0.1rem' }}>{formatBytes(entry.file.size)}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isProcessing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.68rem', color: accent }}>
              <Spinner size={13} color={accent} />
              {entry.status === 'uploading' ? 'Uploading…' : 'Extracting…'}
            </div>
          )}
          {/* When extracted, show a "ready to review" badge — process is paused waiting for user */}
          {isReady && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem', color: accent, fontWeight: 600, background: `${accent}14`, padding: '0.2rem 0.5rem', borderRadius: 6 }}>
              <IconCheck /> Ready to review
            </div>
          )}
          {isSaved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem', color: accent, fontWeight: 600 }}>
              <IconCheck /> {entry.savedCount} saved
            </div>
          )}
          {isFailed && <span style={{ fontSize: '0.65rem', color: '#f87171', fontWeight: 600 }}>Failed</span>}
          {!isSaved && (
            <button onClick={() => onRemove(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', padding: '0.2rem', borderRadius: 4 }}><IconClose /></button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {isFailed && entry.error && (
        <div style={{ padding: '0.625rem 1rem', background: 'rgba(248,113,113,0.06)', borderBottom: '1px solid rgba(248,113,113,0.2)', fontSize: '0.72rem', color: '#f87171', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          <span style={{ flexShrink: 0 }}>⚠</span><span>{entry.error}</span>
        </div>
      )}

      {/* Preview table — visible once extracted (process paused here) and during save/saved */}
      {(isReady || isSaving || isSaved) && entry.previewRows.length > 0 && (
        <div style={{ overflowX: 'auto', maxHeight: 220, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0 }}>
                {columns.map(col => (
                  <th key={col} style={{ padding: '0.45rem 0.75rem', textAlign: 'left', fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>{col.replace(/_/g, ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entry.previewRows.map((row, ri) => (
                <tr key={ri} style={{ borderBottom: ri < entry.previewRows.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  {columns.map(col => (
                    <td key={col} style={{ padding: '0.25rem 0.5rem' }}>
                      <input
                        value={row[col] != null ? String(row[col]) : ''}
                        onChange={e => handleCell(ri, col, e.target.value)}
                        disabled={isSaved}
                        style={{ width: '100%', minWidth: 70, padding: '0.28rem 0.45rem', background: 'transparent', border: '1px solid transparent', borderRadius: 4, color: 'var(--color-text)', fontSize: '0.72rem', outline: 'none', cursor: isSaved ? 'default' : 'text' }}
                        onFocus={e => { if (!isSaved) e.target.style.borderColor = accent; }}
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

      {/* Save button — only shown when status is 'extracted' (paused, waiting for user) */}
      {isReady && (
        <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={() => onSave(entry.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.125rem', borderRadius: 9, border: 'none', cursor: 'pointer', background: accent, color: '#000', fontWeight: 700, fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif" }}
          >
            <IconCheck /> Save {entry.previewRows.length} {docType === 'INVOICE' ? 'Invoice' : 'Payment'}{entry.previewRows.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      {isSaving && (
        <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: accent }}>
            <Spinner size={13} color={accent} /> Saving…
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function InlineUploadPanel({
  docType,
  onSuccess,
}: {
  docType: DocumentType;
  onSuccess: () => void;
}) {
  const accent   = docType === 'INVOICE' ? 'var(--color-accent)' : '#60a5fa';
  const label    = docType === 'INVOICE' ? 'Invoices' : 'Payments';
  const dispatch = useAppDispatch();
  const reviewRequested = useAppSelector(s => s.uploadProgress.reviewRequested);
  const uploadDocType   = useAppSelector(s => s.uploadProgress.documentType);
  const uploadProgress  = useAppSelector(s => s.uploadProgress);

  const [open, setOpen]         = useState(false);
  const [dragging, setDragging] = useState(false);
  const [entries, setEntries]   = useState<FileEntry[]>([]);
  const [step, setStep]         = useState<1 | 2 | 3>(1);
  const inputRef                = useRef<HTMLInputElement>(null);
  const panelRef                = useRef<HTMLDivElement>(null);

  // When the banner's "Click to review" is pressed, auto-open this panel
  // (only if it's the matching docType), hydrate the entry from Redux state
  // so the user lands directly on Step 2 with the extracted data visible,
  // then scroll it into view.
  useEffect(() => {
    if (!reviewRequested) return;
    if (uploadDocType !== docType) return;

    const { status, jobId, documentId, fileName, previewRows } = uploadProgress;

    // Only hydrate if extraction is done and we have data to show
    if (status === 'extracted' && documentId && fileName) {
      const syntheticEntry: FileEntry = {
        id:          'banner-review',
        file:        new File([], fileName),   // placeholder File — name is all we need
        status:      'extracted',
        jobId:       jobId,
        documentId:  documentId,
        previewRows: previewRows,
        savedCount:  null,
        error:       null,
      };
      setEntries([syntheticEntry]);
      setStep(2);
    }

    setOpen(true);
    dispatch(clearReviewRequest());

    setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [reviewRequested, uploadDocType, docType, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── helpers ────────────────────────────────────────────────────────────
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

  // ── Step 1: upload file, then kick off background extraction via Redux thunk
  //    Process pauses automatically at 'extracted' — Redux slice sets status
  //    to 'extracted' when startPollingThunk resolves, and nothing else runs
  //    until the user explicitly clicks Save.
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

    // Mirror UploadPage: dispatch uploadStarted first (feeds the global banner),
    // then dispatch startPollingThunk which handles the background polling loop.
    dispatch(uploadStarted({
      jobId:        uploadRes.job_id,
      documentId:   uploadRes.document_id,
      fileName:     file.name,
      documentType: docType,
    }));

    patchEntry(id, {
      jobId:      uploadRes.job_id,
      documentId: uploadRes.document_id,
      status:     'polling',
    });

    // startPollingThunk polls until EXTRACTED or FAILED — this is the same
    // thunk used by UploadPage. When it resolves, status becomes 'extracted'
    // in the global Redux slice. We mirror that into local entry state so the
    // card shows the review table + Save button and WAITS for the user.
    const pollResult = await dispatch(startPollingThunk({ jobId: uploadRes.job_id }));

    if (startPollingThunk.fulfilled.match(pollResult)) {
      // Extraction done — update local entry and STOP. Nothing happens until
      // the user reads the table and explicitly clicks the Save button.
      patchEntry(id, {
        status:      'extracted',
        previewRows: pollResult.payload.preview_data ?? [],
      });
    } else {
      patchEntry(id, {
        status: 'failed',
        error:  (pollResult.payload as string) ?? 'Extraction failed',
      });
    }
  };

  const handleUploadAll = async () => {
    const idle = entries.filter(e => e.status === 'idle');
    await Promise.all(idle.map(uploadAndPoll));
  };

  // ── Step 2 (user-initiated): save one file's records via Redux thunk
  //    Mirrors UploadPage's handleSave exactly.
  const handleSave = async (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry || !entry.documentId) return;

    patchEntry(id, { status: 'saving', error: null });

    const saveResult = await dispatch(saveProgressRecordsThunk({
      documentId:   entry.documentId,
      documentType: docType,
      records:      entry.previewRows,
    }));

    if (saveProgressRecordsThunk.fulfilled.match(saveResult)) {
      setEntries(prev => {
        const updated = prev.map(e =>
          e.id === id
            ? { ...e, status: 'saved' as FileStatus, savedCount: saveResult.payload.records_saved }
            : e,
        );
        const allDone = updated.every(e => e.status === 'saved' || e.status === 'failed');
        if (allDone) {
          setStep(3);
          onSuccess();
        }
        return updated;
      });
    } else {
      patchEntry(id, {
        status: 'failed',
        error:  (saveResult.payload as string) ?? 'Save failed',
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEntries([]);
    setStep(1);
    // Note: deliberately NOT resetting uploadProgress Redux state here —
    // the global banner manages its own async lifecycle independently.
  };

  const anyProcessing = entries.some(e => e.status === 'uploading' || e.status === 'polling' || e.status === 'saving');
  const anyIdle       = entries.some(e => e.status === 'idle');
  const totalSaved    = entries.reduce((s, e) => s + (e.savedCount ?? 0), 0);

  return (
    <div ref={panelRef}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 9, border: open ? `1.5px solid ${accent}66` : '1px solid var(--color-border)', background: open ? `${accent}12` : 'var(--color-surface)', cursor: 'pointer', color: open ? accent : 'var(--color-muted)', fontSize: '0.75rem', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' }}
        onMouseEnter={e => { if (!open) { (e.currentTarget as HTMLElement).style.borderColor = `${accent}44`; (e.currentTarget as HTMLElement).style.color = accent; } }}
        onMouseLeave={e => { if (!open) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-muted)'; } }}
      >
        {open ? <IconChevronUp /> : <IconUpload />}
        {open ? 'Close Upload' : `Upload ${label}`}
      </button>

      {open && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '1.5rem', animation: 'fadeSlideUp 0.25s var(--ease-out-expo) both' }}>

          <StepIndicator current={step} accent={accent} />

          {/* STEP 1 / 2 — drop zone + file cards */}
          {step !== 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}
                onClick={() => inputRef.current?.click()}
                style={{ border: `2px dashed ${dragging ? accent : 'var(--color-border)'}`, borderRadius: 12, padding: entries.length ? '1.25rem 1.5rem' : '2.5rem 1.5rem', textAlign: 'center', cursor: 'pointer', background: dragging ? `${accent}0a` : 'var(--color-surface-2)', transition: 'all 0.2s' }}
              >
                <div style={{ color: 'var(--color-muted)', display: 'flex', justifyContent: 'center', marginBottom: '0.6rem' }}><IconUpload /></div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                  Drag & drop or <span style={{ color: accent, textDecoration: 'underline' }}>browse</span>
                </p>
                <p style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>PDF, XLSX, XLS or CSV · Max 10 MB · Multiple files allowed</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.xlsx,.xls,.csv"
                  multiple
                  style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ''; }}
                />
              </div>

              {entries.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {entries.map(entry => (
                    <FileReviewCard
                      key={entry.id}
                      entry={entry}
                      docType={docType}
                      accent={accent}
                      onUpdateRows={updateRows}
                      onSave={handleSave}
                      onRemove={removeEntry}
                    />
                  ))}
                </div>
              )}

              {entries.length > 0 && (
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button onClick={handleClose} className="btn-secondary" style={{ padding: '0.55rem 1rem', fontSize: '0.78rem' }}>Cancel</button>
                  {anyIdle && (
                    <button
                      onClick={handleUploadAll}
                      disabled={anyProcessing}
                      className="btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.25rem', fontSize: '0.78rem', opacity: anyProcessing ? 0.5 : 1 }}
                    >
                      {anyProcessing
                        ? <><Spinner size={13} color="#000" /> Processing…</>
                        : <><IconSpark /> Upload & Extract {entries.filter(e => e.status === 'idle').length} File{entries.filter(e => e.status === 'idle').length !== 1 ? 's' : ''}</>
                      }
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — all saved */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '1.5rem 0', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${accent}18`, border: `2px solid ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
                <IconCheck />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.35rem', fontFamily: "'DM Sans', sans-serif" }}>
                  {totalSaved} {label.toLowerCase()} saved!
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                  {entries.length} file{entries.length !== 1 ? 's' : ''} processed · table refreshed
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => { setEntries([]); setStep(1); }} className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.55rem 1.25rem' }}>
                  Upload More
                </button>
                <button
                  onClick={handleClose}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.25rem', borderRadius: 9, border: 'none', cursor: 'pointer', background: accent, color: '#000', fontWeight: 700, fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}