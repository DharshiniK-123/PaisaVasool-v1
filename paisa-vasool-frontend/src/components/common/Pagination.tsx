import React from 'react';

const IconChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const end = Math.min(currentPage * pageSize, totalItems);

  const getPages = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const btnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minWidth: 30, height: 30, borderRadius: 7, border: '1px solid var(--color-border)',
    background: 'transparent', cursor: 'pointer', fontSize: '0.72rem',
    fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
    color: 'var(--color-muted)', transition: 'all 0.15s', padding: '0 0.4rem',
  };

  const btnActive: React.CSSProperties = {
    ...btnBase,
    background: 'var(--color-accent)',
    borderColor: 'var(--color-accent)',
    color: '#fff',
    fontWeight: 700,
  };

  const btnDisabled: React.CSSProperties = {
    ...btnBase,
    opacity: 0.35,
    cursor: 'not-allowed',
  };

  return (
    <div style={{
      padding: '0.625rem 1rem',
      borderTop: '1px solid var(--color-border)',
      background: 'var(--color-surface-2)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: '0.75rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <p style={{ fontSize: '0.68rem', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
          {totalItems === 0 ? '0 results' : `${start}–${end} of ${totalItems}`}
        </p>
        {onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>Rows</span>
            <select
              value={pageSize}
              onChange={e => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
              style={{
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: 6, padding: '0.2rem 0.4rem', fontSize: '0.68rem',
                color: 'var(--color-text)', fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer', outline: 'none',
              }}
            >
              {pageSizeOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={currentPage === 1 ? btnDisabled : btnBase}
            title="Previous page"
          >
            <IconChevronLeft />
          </button>

          {getPages().map((p, i) =>
            p === '...'
              ? <span key={`ellipsis-${i}`} style={{ fontSize: '0.72rem', color: 'var(--color-muted)', padding: '0 0.25rem' }}>…</span>
              : (
                <button
                  key={p}
                  onClick={() => onPageChange(p as number)}
                  style={p === currentPage ? btnActive : btnBase}
                  onMouseEnter={e => { if (p !== currentPage) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-accent)'; } }}
                  onMouseLeave={e => { if (p !== currentPage) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-muted)'; } }}
                >
                  {p}
                </button>
              )
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={currentPage === totalPages ? btnDisabled : btnBase}
            title="Next page"
          >
            <IconChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}
