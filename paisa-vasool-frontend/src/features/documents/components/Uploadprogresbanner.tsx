import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../hooks/redux';
import { ROUTES } from '../../../config/constants';

function Spinner() {
  return (
    <div style={{
      width: 14, height: 14, borderRadius: '50%',
      border: '2px solid rgba(52,211,153,0.3)',
      borderTopColor: 'var(--color-accent)',
      animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  );
}

export default function UploadProgressBanner() {
  const navigate  = useNavigate();
  const progress  = useAppSelector(s => s.uploadProgress);
  const { status, fileName } = progress;
  if (status === 'idle' || status === 'saved') return null;
  const isWorking  = status === 'uploading' || status === 'polling';
  const isReady    = status === 'extracted';
  const isSaving   = status === 'saving';
  const isFailed   = status === 'failed';
  const label = isWorking  ? 'Extracting document…'
              : isReady    ? 'Extraction complete — ready to review'
              : isSaving   ? 'Saving to database…'
              : isFailed   ? 'Processing failed'
              : '';
  const bg     = isFailed ? 'rgba(248,113,113,0.12)' : 'rgba(52,211,153,0.08)';
  const border = isFailed ? 'rgba(248,113,113,0.25)' : 'rgba(52,211,153,0.2)';
  const color  = isFailed ? '#f87171' : 'var(--color-accent)';

  return (
    <>
      <div
        onClick={isReady || isFailed ? () => navigate(ROUTES.UPLOAD) : undefined}
        style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem',
          zIndex: 100,
          display: 'flex', alignItems: 'center', gap: '0.625rem',
          padding: '0.75rem 1rem',
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          cursor: isReady || isFailed ? 'pointer' : 'default',
          maxWidth: 320,
          backdropFilter: 'blur(8px)',
          animation: 'slideUpIn 0.3s ease both',
          transition: 'box-shadow 0.2s',
        }}
      >
        <div style={{ flexShrink: 0, color }}>
          {isWorking || isSaving ? <Spinner /> : isFailed ? '⚠' : '✓'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {fileName ?? 'Document'}
          </p>
          <p style={{ fontSize: '0.65rem', color, marginTop: '0.1rem' }}>{label}</p>
        </div>
        {(isReady || isFailed) && (
          <span style={{ fontSize: '0.62rem', color: 'var(--color-muted)', flexShrink: 0 }}>
            Click to review →
          </span>
        )}
      </div>

      <style>{`
        @keyframes slideUpIn {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}