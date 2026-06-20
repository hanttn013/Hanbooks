import { memo, useMemo, useState } from 'react';
import { includesSearchText } from '../../utils/searchText';

const ROW_HEIGHT = 46;
const VIRTUAL_THRESHOLD = 120;
const OVERSCAN = 8;

function flattenToc(items = [], depth = 0, rows = []) {
  items.forEach((item, index) => {
    rows.push({
      item,
      depth,
      key: `${depth}-${index}-${item.href || item.label || rows.length}`,
      label: item.label?.trim() || 'Untitled chapter',
    });
    if (item.subitems?.length) flattenToc(item.subitems, depth + 1, rows);
  });
  return rows;
}

const TocRow = memo(function TocRow({ row, currentChapter, onJumpTo }) {
  const isActive = row.label === currentChapter;

  return (
    <button
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        minHeight: ROW_HEIGHT,
        padding: '0 20px',
        paddingLeft: 20 + row.depth * 16,
        cursor: 'pointer',
        border: 'none',
        borderBottom: '1px solid var(--border)',
        background: isActive ? 'var(--bg-secondary)' : 'transparent',
        color: isActive ? 'var(--accent)' : 'var(--text-primary)',
        textAlign: 'left',
        font: 'inherit',
      }}
      onClick={() => row.item.href && onJumpTo(row.item.href)}
    >
      {isActive && (
        <span
          style={{
            width: 3,
            height: 16,
            background: 'var(--accent)',
            borderRadius: 2,
            marginRight: 10,
            flexShrink: 0,
          }}
        />
      )}
      <span
        style={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: row.depth === 0 ? 15 : 14,
          fontWeight: row.depth === 0 ? (isActive ? 700 : 550) : 450,
        }}
      >
        {row.label}
      </span>
    </button>
  );
});

export default function TOCModal({ toc, currentChapter, onJumpTo, onClose }) {
  const [query, setQuery] = useState('');
  const [scrollTop, setScrollTop] = useState(0);
  const rows = useMemo(() => flattenToc(toc), [toc]);
  const filteredRows = useMemo(() => {
    const needle = query.trim();
    if (!needle) return rows;
    return rows.filter(row => includesSearchText(row.label, needle));
  }, [query, rows]);

  const useVirtual = filteredRows.length > VIRTUAL_THRESHOLD;
  const viewportHeight = 520;
  const startIndex = useVirtual
    ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
    : 0;
  const visibleCount = useVirtual
    ? Math.ceil(viewportHeight / ROW_HEIGHT) + OVERSCAN * 2
    : filteredRows.length;
  const visibleRows = filteredRows.slice(startIndex, startIndex + visibleCount);
  const topSpacer = useVirtual ? startIndex * ROW_HEIGHT : 0;
  const bottomSpacer = useVirtual
    ? Math.max(0, (filteredRows.length - startIndex - visibleRows.length) * ROW_HEIGHT)
    : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" style={{ maxHeight: '86%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <span className="modal-title">Table of Contents</span>
          <button className="btn-icon" onClick={onClose} aria-label="Close table of contents">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {rows.length > 12 && (
          <div style={{ padding: '0 16px 12px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minHeight: 40,
                borderRadius: 12,
                background: 'var(--bg-secondary)',
                padding: '0 12px',
                color: 'var(--text-secondary)',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                value={query}
                onChange={event => { setQuery(event.target.value); setScrollTop(0); }}
                placeholder="Search chapters"
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  font: 'inherit',
                  fontSize: 14,
                }}
              />
              {query && (
                <button
                  onClick={() => { setQuery(''); setScrollTop(0); }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    font: 'inherit',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Clear
                </button>
              )}
            </label>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="modal-scroll">
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>No table of contents available</p>
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="modal-scroll">
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>No chapters found</p>
            </div>
          </div>
        ) : (
          <div
            className="modal-scroll"
            onScroll={event => setScrollTop(event.currentTarget.scrollTop)}
            style={{ minHeight: 0 }}
          >
            {topSpacer > 0 && <div style={{ height: topSpacer }} />}
            {visibleRows.map(row => (
              <TocRow
                key={row.key}
                row={row}
                currentChapter={currentChapter}
                onJumpTo={onJumpTo}
              />
            ))}
            {bottomSpacer > 0 && <div style={{ height: bottomSpacer }} />}
          </div>
        )}
      </div>
    </div>
  );
}
