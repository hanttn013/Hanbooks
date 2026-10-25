// src/components/Reader/SearchModal.jsx
import React, { useState, useCallback, useRef } from 'react';
import ReaderSheet from './ReaderSheet';
import Button from '../Common/Button';
import { useI18n } from '../../i18n/context';
import { cleanTocLabel } from '../../utils/cleanToc';
import styles from './SearchModal.module.css';

function highlightSnippet(text, query) {
  if (!text || !query) return text;
  const parts = [];
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <mark key={match.index} className={styles.highlight}>
        {match[0]}
      </mark>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export default function SearchModal({
  epubBook,
  currentCfi,
  toc = [],
  onJumpTo,
  onClose,
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('book'); // 'book' | 'chapter'
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const abortRef = useRef(false);

  const formatChapterTitle = (idref) => {
    if (!idref) return t('Chapter');
    if (/pg-header|front|preface|title/i.test(idref)) return t('Front matter') || 'Phần đầu sách';
    if (/tail|back|colophon|afterword/i.test(idref)) return t('Back matter') || 'Phần cuối sách';

    // Check if matching item in TOC
    const foundInToc = toc.find(item => item.href?.includes(idref));
    if (foundInToc) return cleanTocLabel(foundInToc.label);

    const cleaned = idref.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return cleanTocLabel(cleaned);
  };

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q || !epubBook) return;
    setSearching(true);
    setHasSearched(true);
    setResults([]);
    abortRef.current = false;

    try {
      const spineItems = scope === 'chapter' && currentCfi
        ? [epubBook.spine.get(currentCfi)].filter(Boolean)
        : epubBook.spine.spineItems;

      const allMatches = [];

      for (const item of spineItems) {
        if (abortRef.current) break;
        try {
          await item.load(epubBook.load.bind(epubBook));
          const found = item.find(q);
          const title = formatChapterTitle(item.idref);

          for (const f of found) {
            allMatches.push({
              cfi: f.cfi,
              excerpt: f.excerpt,
              chapterTitle: title,
            });
            if (allMatches.length >= 60) break;
          }
          item.unload();
          if (allMatches.length >= 60) break;
        } catch (err) {
          console.warn('Spine item search error:', err);
        }
      }

      setResults(allMatches);
    } catch (err) {
      console.error('Book search failed:', err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [query, epubBook, scope, currentCfi]);

  const handleCancel = () => {
    abortRef.current = true;
    setSearching(false);
  };

  return (
    <ReaderSheet title={t('Search document')} onClose={onClose}>
      <div className={styles.container}>
        {/* Search input bar + Search Button */}
        <form
          className={styles.searchForm}
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
        >
          <div className={styles.inputWrapper}>
            <span className={styles.searchIcon} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="search"
              className={styles.searchInput}
              placeholder={t('Search in book…')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              aria-label={t('Search document')}
            />
          </div>

          {searching ? (
            <Button variant="secondary" size="M" onPress={handleCancel}>
              {t('Cancel')}
            </Button>
          ) : (
            <Button
              variant="accent"
              size="M"
              onPress={handleSearch}
              isDisabled={!query.trim()}
            >
              {t('Search')}
            </Button>
          )}
        </form>

        {/* Scope SegmentedControl: Toàn sách | Trong chương này */}
        <div className={styles.segmentedControl} role="radiogroup" aria-label={t('Search scope')}>
          <button
            type="button"
            role="radio"
            aria-checked={scope === 'book'}
            className={`${styles.segmentBtn} ${scope === 'book' ? styles.segmentBtnActive : ''}`}
            onClick={() => setScope('book')}
          >
            {t('Entire book')}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={scope === 'chapter'}
            className={`${styles.segmentBtn} ${scope === 'chapter' ? styles.segmentBtnActive : ''}`}
            onClick={() => setScope('chapter')}
          >
            {t('Current chapter')}
          </button>
        </div>

        {/* Results Count / Searching Progress Indicator */}
        {searching && (
          <div className={styles.searchingStatus} role="status">
            <span className={styles.spinner} />
            <span>{t('Searching…')}</span>
          </div>
        )}

        {hasSearched && !searching && (
          <div className={styles.resultSummary} aria-live="polite">
            {results.length > 0 ? (
              <span>{results.length} {t('results found')}</span>
            ) : (
              <span>{t('No results found for')} "{query}"</span>
            )}
          </div>
        )}

        {/* Results List */}
        {results.length > 0 && (
          <div className={styles.resultsList}>
            {results.map((item, idx) => (
              <button
                key={idx}
                type="button"
                className={styles.resultCard}
                onClick={() => {
                  onJumpTo(item.cfi);
                  onClose();
                }}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.chapterBadge}>{item.chapterTitle}</span>
                </div>
                <p className={styles.cardSnippet}>
                  “{highlightSnippet(item.excerpt, query)}”
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </ReaderSheet>
  );
}
