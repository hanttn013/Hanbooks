// src/components/Library/LibraryScreen.jsx
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BookCover from './BookCover';
import BookDetailModal from './BookDetailModal';
import styles from './LibraryScreen.module.css';

const VIEW_MODES = ['bookshelf', 'grid', 'list'];

const SORT_OPTIONS = [
  { value: 'lastOpenedAt', label: 'Recently Opened' },
  { value: 'addedAt', label: 'Recently Added' },
  { value: 'title', label: 'Title' },
  { value: 'author', label: 'Author' },
  { value: 'progress', label: 'Progress' },
];

function ProgressBar({ bookId, status }) {
  const pct = parseFloat(localStorage.getItem(`aurelia_pct_${bookId}`) || (status === 'finished' ? 100 : 0));
  return (
    <div className="progress-track" style={{ flex: 1 }}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

function BookContextMenu({ book, position, onClose, onOpen, onDelete, onToggleFavorite, onToggleStatus, onViewDetail }) {
  return (
    <div
      className="context-menu"
      style={{ top: position.y, left: Math.min(position.x, 180) }}
      onClick={e => e.stopPropagation()}
    >
      <button className="context-menu-item" onClick={() => { onOpen(book); onClose(); }}>
        <span>📖</span> Open Book
      </button>
      <button className="context-menu-item" onClick={() => { onViewDetail(book); onClose(); }}>
        <span>🔖</span> Bookmarks
      </button>
      <button className="context-menu-item" onClick={() => { onToggleFavorite(book); onClose(); }}>
        <span>{book.isFavorite ? '💛' : '🤍'}</span>
        {book.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
      </button>
      <button className="context-menu-item" onClick={() => { onToggleStatus(book); onClose(); }}>
        <span>{book.status === 'finished' ? '📚' : '✅'}</span>
        {book.status === 'finished' ? 'Mark as Reading' : 'Mark as Finished'}
      </button>
      <div className="context-menu-separator" />
      <button className="context-menu-item danger" onClick={() => { onDelete(book.id); onClose(); }}>
        <span>🗑️</span> Delete Book
      </button>
    </div>
  );
}

function BookshelfSection({ title, books, onOpenBook, onContextMenu, progress }) {
  if (!books.length) return null;
  return (
    <div className={styles.section}>
      <h2 className={`section-title ${styles.sectionTitle}`}>{title}</h2>
      <div className={styles.shelfWrapper}>
        <div className={styles.shelfBooks}>
          {books.map(book => (
            <motion.div
              key={book.id}
              className={styles.shelfBook}
              whileHover={{ y: -8, scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => onOpenBook(book)}
              onContextMenu={e => { e.preventDefault(); onContextMenu(e, book); }}
              onLongPress={() => {}}
            >
              <BookCover book={book} size="shelf" />
            </motion.div>
          ))}
        </div>
        <div className={styles.shelfBase}>
          <div className={styles.shelfEdge} />
        </div>
      </div>
    </div>
  );
}

function GridSection({ title, books, onOpenBook, onContextMenu }) {
  if (!books.length) return null;
  return (
    <div className={styles.section}>
      <h2 className={`section-title ${styles.sectionTitle}`}>{title}</h2>
      <div className={styles.gridBooks}>
        {books.map(book => (
          <div
            key={book.id}
            className={styles.gridBook}
            onClick={() => onOpenBook(book)}
            onContextMenu={e => { e.preventDefault(); onContextMenu(e, book); }}
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>
              <BookCover book={book} size="large" />
            </motion.div>
            <p className={styles.gridTitle}>{book.title}</p>
            <p className={`${styles.gridAuthor} text-secondary text-sm`}>{book.author}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListSection({ title, books, onOpenBook, onContextMenu }) {
  if (!books.length) return null;
  return (
    <div className={styles.section}>
      <h2 className={`section-title ${styles.sectionTitle}`}>{title}</h2>
      <div className="card" style={{ overflow: 'visible' }}>
        {books.map((book, i) => {
          const pct = parseFloat(localStorage.getItem(`aurelia_pct_${book.id}`) || (book.status === 'finished' ? 100 : 0));
          return (
            <div key={book.id}>
              <div
                className={styles.listBook}
                onClick={() => onOpenBook(book)}
                onContextMenu={e => { e.preventDefault(); onContextMenu(e, book); }}
              >
                <BookCover book={book} size="small" />
                <div className={styles.listInfo}>
                  <p className={styles.listTitle}>{book.title}</p>
                  <p className={`text-secondary text-sm`} style={{ marginTop: 2 }}>{book.author}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <div className="progress-track" style={{ flex: 1 }}>
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-secondary">{Math.round(pct)}%</span>
                  </div>
                </div>
              </div>
              {i < books.length - 1 && <div className="divider" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LibraryScreen({ library, onOpenBook, settings }) {
  const [viewMode, setViewMode] = useState('bookshelf');
  const [showSort, setShowSort] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [detailBook, setDetailBook] = useState(null);
  const fileRef = useRef(null);
  const longPressRef = useRef(null);

  const { currentlyReading, favorites, recentlyAdded, finished, addBook, deleteBook, updateBook, sortBy, setSortBy, getSorted } = library;

  const handleContextMenu = (e, book) => {
    e.preventDefault();
    const rect = e.currentTarget.closest('#phone-frame')?.getBoundingClientRect() || { left: 0, top: 0 };
    setContextMenu({ book, x: e.clientX - rect.left - 20, y: e.clientY - rect.top - 20 });
  };

  const handleLongPress = (book) => {
    // Simulated via onContextMenu
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await addBook(file);
    e.target.value = '';
  };

  const handleToggleFavorite = (book) => updateBook(book.id, { isFavorite: !book.isFavorite });
  const handleViewDetail = (book) => setDetailBook(book);
  const handleToggleStatus = (book) =>
    updateBook(book.id, { status: book.status === 'finished' ? 'reading' : 'finished' });

  const sections = [
    { title: 'Currently Reading', books: currentlyReading },
    { title: 'Favorites', books: favorites },
    { title: 'Recently Added', books: recentlyAdded },
    { title: 'Finished', books: finished },
  ].filter(s => s.books.length > 0);

  const ViewSection = viewMode === 'bookshelf' ? BookshelfSection
    : viewMode === 'grid' ? GridSection
    : ListSection;

  return (
    <div className={styles.screen} onClick={() => contextMenu && setContextMenu(null)}>
      {/* Header */}
      <div className={`${styles.header} safe-top`}>
        <div>
          <p className="aurelia-wordmark">AURELIA</p>
          <h1 className="screen-title">Library</h1>
        </div>
        <div className={styles.headerActions}>
          {/* Import */}
          <motion.button
            className={styles.importBtn}
            whileTap={{ scale: 0.88 }}
            onClick={() => fileRef.current?.click()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </motion.button>
          <input ref={fileRef} type="file" accept=".epub" style={{ display: 'none' }} onChange={handleFileImport} />

          {/* View toggles */}
          <div className={styles.viewToggle}>
            {[
              { mode: 'bookshelf', icon: '▤' },
              { mode: 'grid', icon: '⊞' },
              { mode: 'list', icon: '☰' },
            ].map(({ mode, icon }) => (
              <button
                key={mode}
                className={`${styles.toggleBtn} ${viewMode === mode ? styles.toggleActive : ''}`}
                onClick={() => setViewMode(mode)}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sort bar */}
      <div className={styles.sortBar}>
        <button className={styles.sortBtn} onClick={() => setShowSort(!showSort)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M6 12h12M9 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ transform: showSort ? 'rotate(180deg)' : 'none', transition: '200ms' }}>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <AnimatePresence>
          {showSort && (
            <motion.div
              className={styles.sortDropdown}
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`${styles.sortOption} ${sortBy === opt.value ? styles.sortActive : ''}`}
                  onClick={() => { setSortBy(opt.value); setShowSort(false); }}
                >
                  {opt.label}
                  {sortBy === opt.value && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="screen-scroll" style={{ padding: '0 16px 24px' }}>
        {sections.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📚</div>
            <p>Your library is empty</p>
            <p className="text-secondary text-sm" style={{ marginTop: 8 }}>Tap + to import an EPUB file</p>
          </div>
        ) : (
          sections.map(section => (
            <ViewSection
              key={section.title}
              title={section.title}
              books={section.books}
              onOpenBook={onOpenBook}
              onContextMenu={handleContextMenu}
            />
          ))
        )}
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div style={{ position: 'absolute', inset: 0, zIndex: 250 }} onClick={() => setContextMenu(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              style={{ position: 'absolute', top: contextMenu.y, left: contextMenu.x, zIndex: 300 }}
            >
              <BookContextMenu
                book={contextMenu.book}
                position={contextMenu}
                onClose={() => setContextMenu(null)}
                onOpen={onOpenBook}
                onDelete={deleteBook}
                onToggleFavorite={handleToggleFavorite}
                onToggleStatus={handleToggleStatus}
                onViewDetail={handleViewDetail}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Book Detail Modal (bookmarks from outside reader) */}
      <AnimatePresence>
        {detailBook && (
          <BookDetailModal
            book={detailBook}
            onClose={() => setDetailBook(null)}
            onOpen={onOpenBook}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
