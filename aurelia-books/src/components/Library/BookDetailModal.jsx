// src/components/Library/BookDetailModal.jsx
// Shows bookmarks and allows search access from outside the reader
import { motion } from 'framer-motion';
import BookCover from './BookCover';

function load(key, def) {
  try { return JSON.parse(localStorage.getItem(key)) || def; } catch { return def; }
}

export default function BookDetailModal({ book, onClose, onOpen }) {
  const allBookmarks = load('aurelia_bookmarks', {});
  const bookmarks = allBookmarks[book.id] || [];
  const allProgress = load('aurelia_progress', {});
  const progress = allProgress[book.id] || null;

  const pct = parseFloat(localStorage.getItem(`aurelia_pct_${book.id}`) || (book.status === 'finished' ? 100 : 0));

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
        style={{ maxHeight: '80%' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-handle" />

        {/* Book info header */}
        <div style={{ display: 'flex', gap: 16, padding: '12px 20px 16px', flexShrink: 0 }}>
          <BookCover book={book} size="medium" />
          <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
            <p style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: 20, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {book.title}
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{book.author}</p>
            {/* Progress */}
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div className="progress-track" style={{ flex: 1 }}>
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, minWidth: 32 }}>
                  {Math.round(pct)}%
                </span>
              </div>
              {progress?.chapterTitle && (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', opacity: 0.7 }}>
                  Last read: {progress.chapterTitle}
                </p>
              )}
            </div>
            {/* Open button */}
            <button
              onClick={() => { onOpen(book); onClose(); }}
              style={{
                marginTop: 12, width: '100%', padding: '10px', background: 'var(--accent-dark)',
                color: '#F5E6C0', border: 'none', borderRadius: 10, fontSize: 14,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {book.status === 'unread' ? 'Start Reading' : 'Continue Reading'}
            </button>
          </div>
        </div>

        <div className="divider" />

        {/* Bookmarks section */}
        <div className="modal-scroll">
          <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              Bookmarks
            </p>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {bookmarks.length} saved
            </span>
          </div>

          {bookmarks.length === 0 ? (
            <div style={{ padding: '20px 20px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔖</div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                No bookmarks yet. Open the book and tap the 🔖 icon while reading.
              </p>
            </div>
          ) : (
            bookmarks.slice().reverse().map((bm, i) => (
              <div key={bm.id}>
                <div
                  style={{ padding: '12px 20px', display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}
                  onClick={() => { onOpen(book); onClose(); }}
                >
                  <svg width="14" height="16" viewBox="0 0 24 24" fill="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }}>
                    <path d="M5 3h14v18l-7-4-7 4V3z"/>
                  </svg>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 2 }}>
                      {bm.chapterTitle || 'Chapter'}
                    </p>
                    {bm.excerpt && (
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        "{bm.excerpt}"
                      </p>
                    )}
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, opacity: 0.6 }}>
                      {new Date(bm.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {i < bookmarks.length - 1 && <div className="divider" />}
              </div>
            ))
          )}
          <div style={{ height: 24 }} />
        </div>
      </motion.div>
    </motion.div>
  );
}
