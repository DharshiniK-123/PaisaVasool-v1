import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { reset as resetProgress, requestReview } from '../slices/UploadProgressSlice';
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

const AUTO_DISMISS_MS = 6000; 

export default function UploadProgressBanner() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const dispatch  = useAppDispatch();
  const progress  = useAppSelector(s => s.uploadProgress);
  const { status, fileName, documentType, savedCount } = progress;

  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTimeout(() => {
      if (status === 'idle') {
        setFadeOut(false);
        setVisible(false);
      } else {
        setFadeOut(false);
        setVisible(true);
      }
    }, 0);

    if (status === 'idle') return;

    if (timerRef.current) clearTimeout(timerRef.current);

    if (status === 'saved') {
      timerRef.current = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          dispatch(resetProgress());
          setVisible(false);
          setFadeOut(false);
        }, 400);
      }, AUTO_DISMISS_MS);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [status, dispatch]);

  if (!visible) return null;

  const isWorking  = status === 'uploading' || status === 'polling';
  const isReady    = status === 'extracted';
  const isSaving   = status === 'saving';
  const isSaved    = status === 'saved';
  const isFailed   = status === 'failed';

  const label = isWorking ? 'Extracting document…'
              : isReady   ? 'Extraction complete — ready to review'
              : isSaving  ? 'Saving to database…'
              : isSaved   ? `${savedCount ?? ''} records saved successfully`
              : isFailed  ? 'Processing failed'
              : '';

  const bg          = isFailed ? 'rgba(248,113,113,0.12)' : 'rgba(52,211,153,0.08)';
  const border      = isFailed ? 'rgba(248,113,113,0.25)' : 'rgba(52,211,153,0.2)';
  const color       = isFailed ? '#f87171' : 'var(--color-accent)';
  const isClickable = isReady || isFailed;
  const targetRoute = documentType === 'PAYMENT' ? ROUTES.PAYMENTS : ROUTES.INVOICES;

  const handleClick = () => {
    if (!isClickable) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    dispatch(requestReview());

    if (location.pathname !== targetRoute) {
      navigate(targetRoute);
    }

  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (timerRef.current) clearTimeout(timerRef.current);
    dispatch(resetProgress());
    setVisible(false);
  };

  return (
    <>
      <div
        onClick={handleClick}
        style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem',
          zIndex: 100,
          display: 'flex', alignItems: 'center', gap: '0.625rem',
          padding: '0.75rem 1rem',
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          cursor: isClickable ? 'pointer' : 'default',
          maxWidth: 320,
          backdropFilter: 'blur(8px)',
          animation: fadeOut ? 'slideDownOut 0.4s ease forwards' : 'slideUpIn 0.3s ease both',
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

        {isClickable && (
          <span style={{ fontSize: '0.62rem', color: 'var(--color-muted)', flexShrink: 0 }}>
            Click to review →
          </span>
        )}

        {isSaved && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: 2, borderRadius: '0 0 12px 12px', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              background: color,
              animation: `shrinkBar ${AUTO_DISMISS_MS}ms linear forwards`,
            }} />
          </div>
        )}

        <button
          onClick={handleDismiss}
          style={{
            flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-muted)', fontSize: '1rem', lineHeight: 1,
            padding: '0 0 0 0.25rem', opacity: 0.5,
          }}
          title="Dismiss"
        >
          ×
        </button>
      </div>

      <style>{`
        @keyframes slideUpIn {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes slideDownOut {
          from { transform: translateY(0);    opacity: 1; }
          to   { transform: translateY(16px); opacity: 0; }
        }
        @keyframes shrinkBar {
          from { width: 100%; }
          to   { width: 0%;   }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}