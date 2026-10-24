import { memo, useMemo, useState } from 'react';
import Sheet from '../UI/Sheet';
import { SearchBox } from '../UI/Controls';
import { useI18n } from '../../i18n/context';
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
  const { t } = useI18n();
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

  return <Sheet title="Table of contents" onClose={onClose}>
    {rows.length > 12 && <SearchBox label="Search chapters" value={query} onChange={value => { setQuery(value); setScrollTop(0); }} />}
    {!rows.length ? <p>{t('No table of contents available')}</p> : <div onScroll={event => setScrollTop(event.currentTarget.scrollTop)} style={{ maxHeight: 520, overflowY: 'auto' }}>
      {topSpacer > 0 && <div style={{ height: topSpacer }} />}
      {visibleRows.map(row => <TocRow key={row.key} row={row} currentChapter={currentChapter} onJumpTo={href => { onJumpTo(href); onClose(); }} />)}
      {bottomSpacer > 0 && <div style={{ height: bottomSpacer }} />}
    </div>}
  </Sheet>;
}
