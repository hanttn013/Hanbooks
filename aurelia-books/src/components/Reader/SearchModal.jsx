// src/components/Reader/SearchModal.jsx
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

export default function SearchModal({ epubBook, onJumpTo, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || !epubBook) return;
    setSearching(true);
    setResults([]);

    try {
      const searchResults = await Promise.all(
        epubBook.spine.spineItems.map(item =>
          item.load(epubBook.load.bind(epubBook))
            .then(() => {
              const doc = item.document;
              if (!doc) return [];
              const text = doc.body?.innerText || doc.body?.textContent || '';
              const found = [];
              let idx = text.toLowerCase().indexOf(query.toLowerCase());
              while (idx !== -1 && found.length < 3) {
                found.push({
                  cfi: item.cfiFromElement(doc.body) || '',
                  excerpt: text.slice(Math.max(0, idx - 40), idx + query.length + 40).trim(),
                  chapterHref: item.href,
                  chapterTitle: item.label || item.href,
                });
                idx = text.toLowerCase().indexOf(query.toLowerCase(), idx + 1);
              }
              return found;
            })
            .catch(() => [])
        )
      );
      const flat = searchResults.flat().slice(0, 20);
      setResults(flat);
    } catch (e) {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [query, epubBook]);

  const highlightQuery = (text) => {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: 'rgba(139, 105, 20, 0.3)', borderRadius: 2, padding: '0 1px' }}>
          {text.slice(idx, idx + query.length)}
        </mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-sheet"
        style={{ maxHeight: '85%' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-handle" />
        <div className="modal-header">
          <span className="modal-title">Search in Book</span>
          <button className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Search input */}
        <div style={{ padding: '0 16px 12px', flexShrink: 0 }}>
          <div style={{
            display: 'flex',
            gap: 10,
            background: 'var(--bg-secondary)',
            borderRadius: 12,
            padding: '10px 14px',
            alignItems: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search…"
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                font: 'inherit',
                fontSize: 16,
                color: 'var(--text-primary)',
              }}
            />
            {query && (
              <button
                onClick={handleSearch}
                style={{
                  border: 'none', background: 'var(--accent)', color: '#FFF8EC',
                  borderRadius: 8, padding: '4px 10px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Go
              </button>
            )}
          </div>
        </div>

        <div className="divider" />

        <div className="modal-scroll">
          {searching && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
              Searching…
            </div>
          )}
          {!searching && results.length === 0 && query && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
              <p>No results found for "{query}"</p>
            </div>
          )}
          {results.map((result, i) => (
            <div key={i}>
              <div
                style={{ padding: '14px 20px', cursor: 'pointer' }}
                onClick={() => result.cfi && onJumpTo(result.cfi)}
              >
                <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>
                  {result.chapterTitle}
                </p>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  …{highlightQuery(result.excerpt)}…
                </p>
              </div>
              {i < results.length - 1 && <div className="divider" />}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
