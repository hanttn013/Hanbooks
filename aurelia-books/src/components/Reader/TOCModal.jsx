// src/components/Reader/TOCModal.jsx
import { memo, useMemo, useState, useEffect, useRef } from 'react';
import ReaderSheet from './ReaderSheet';
import { SearchBox } from '../UI/Controls';
import { useI18n } from '../../i18n/context';
import { includesSearchText } from '../../utils/searchText';
import { cleanTocLabel } from '../../utils/cleanToc';
import styles from './TOCModal.module.css';

const ROW_HEIGHT = 48;
const VIRTUAL_THRESHOLD = 120;
const OVERSCAN = 8;

function flattenToc(items = [], depth = 0, rows = []) {
  items.forEach((item, index) => {
    const rawLabel = item.label || 'Untitled chapter';
    const cleanedLabel = cleanTocLabel(rawLabel);
    rows.push({
      item,
      depth,
      key: `${depth}-${index}-${item.href || rawLabel || rows.length}`,
      label: cleanedLabel,
      rawLabel,
    });
    if (item.subitems?.length) flattenToc(item.subitems, depth + 1, rows);
  });
  return rows;
}

const TocRow = memo(function TocRow({ row, currentChapter, onJumpTo, activeRef }) {
  const isActive = row.label === currentChapter || row.rawLabel === currentChapter;

  return (
    <button
      ref={isActive ? activeRef : null}
      type="button"
      className={styles.tocRow}
      data-active={isActive}
      style={{
        paddingLeft: 16 + row.depth * 16,
      }}
      onClick={() => row.item.href && onJumpTo(row.item.href)}
    >
      {isActive && <span className={styles.activeIndicator} aria-hidden="true" />}
      <span className={styles.label}>
        {row.label}
      </span>
    </button>
  );
});

export default function TOCModal({ toc, currentChapter, onJumpTo, onClose }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [scrollTop, setScrollTop] = useState(0);
  const listRef = useRef(null);
  const activeRowRef = useRef(null);

  const rows = useMemo(() => flattenToc(toc), [toc]);
  const filteredRows = useMemo(() => {
    const needle = query.trim();
    if (!needle) return rows;
    return rows.filter(row => includesSearchText(row.label, needle));
  }, [query, rows]);

  // Auto-scroll to active chapter on mount
  useEffect(() => {
    if (activeRowRef.current) {
      activeRowRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [rows]);

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
    <ReaderSheet title={t('Table of contents')} onClose={onClose}>
      <div className={styles.container}>
        {rows.length > 8 && (
          <div className={styles.searchWrapper}>
            <SearchBox
              label={t('Search chapters')}
              value={query}
              onChange={value => { setQuery(value); setScrollTop(0); }}
            />
          </div>
        )}

        {!rows.length ? (
          <p className={styles.emptyState}>{t('No table of contents available')}</p>
        ) : (
          <div
            ref={listRef}
            className={styles.listWrapper}
            onScroll={event => setScrollTop(event.currentTarget.scrollTop)}
          >
            {topSpacer > 0 && <div style={{ height: topSpacer }} />}
            {visibleRows.map(row => (
              <TocRow
                key={row.key}
                row={row}
                currentChapter={currentChapter}
                activeRef={activeRowRef}
                onJumpTo={href => {
                  onJumpTo(href);
                  onClose();
                }}
              />
            ))}
            {bottomSpacer > 0 && <div style={{ height: bottomSpacer }} />}
          </div>
        )}
      </div>
    </ReaderSheet>
  );
}
