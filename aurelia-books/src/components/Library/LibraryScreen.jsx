// src/components/Library/LibraryScreen.jsx
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ePub from 'epubjs';
import BookCover from './BookCover';
import BookDetailModal from './BookDetailModal';
import styles from './LibraryScreen.module.css';

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

function BookContextMenu({ book, position, onClose, onOpen, onDelete, onRename, onToggleFavorite, onToggleStatus, onViewDetail }) {
  return (
    <div
      className="context-menu"
      style={{ top: position.y, left: Math.min(position.x, 180) }}
      onClick={e => e.stopPropagation()}
    >
      <button className="context-menu-item" onClick={() => { onOpen(book); onClose(); }}>
        <span>📖</span> Open Book
      </button>
      <button className="context-menu-item" onClick={() => { onRename(book); onClose(); }}>
        <span>✏️</span> Rename Book
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

function RenameModal({ book, onClose, onSave }) {
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ zIndex: 1000 }}
    >
      <motion.div
        className="modal-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{ padding: '20px 24px 32px' }}
      >
        <div className="modal-handle" />
        <div className="modal-header" style={{ marginBottom: 20 }}>
          <span className="modal-title">Rename Book</span>
          <button className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 8,
                border: '1.5px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: 15,
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Author</label>
            <input
              type="text"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 8,
                border: '1.5px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: 15,
              }}
            />
          </div>
          <button
            onClick={() => onSave(title, author)}
            style={{
              marginTop: 12,
              padding: '14px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--accent-dark)',
              color: '#F5E6C0',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(139, 105, 20, 0.2)',
            }}
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function BookshelfSection({ title, books, onOpenBook, onContextMenu }) {
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

export default function LibraryScreen({ library, onOpenBook }) {
  const [viewMode, setViewMode] = useState('bookshelf');
  const [showSort, setShowSort] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [detailBook, setDetailBook] = useState(null);
  const [renamingBook, setRenamingBook] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileRef = useRef(null);

  const { books, allBooksRaw, addBook, deleteBook, updateBook, sortBy, setSortBy, filterBy, setFilterBy } = library;

  const handleContextMenu = (e, book) => {
    e.preventDefault();
    const rect = e.currentTarget.closest('#phone-frame')?.getBoundingClientRect() || { left: 0, top: 0 };
    setContextMenu({ book, x: e.clientX - rect.left - 20, y: e.clientY - rect.top - 20 });
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const epubBook = ePub(arrayBuffer);
      await epubBook.ready;
      
      const meta = await epubBook.loaded.metadata;
      const title = meta.title || file.name.replace(/\.epub$/i, '');
      const author = meta.creator || 'Unknown Author';
      
      let coverUrl = null;
      try {
        const coverPath = await epubBook.coverUrl();
        if (coverPath) {
          const res = await fetch(coverPath);
          const blob = await res.blob();
          coverUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        }
      } catch (coverErr) {
        console.warn("Cover extraction failed:", coverErr);
      }
      
      const coverColors = [
        { bg: '#2D4A6E', accent: '#C4A35A' },
        { bg: '#1E4D3A', accent: '#C4A35A' },
        { bg: '#6B2D5E', accent: '#F0D080' },
        { bg: '#4A3B32', accent: '#D2B48C' },
        { bg: '#1C2E3D', accent: '#A0B2C6' },
      ];
      const randomColor = coverColors[Math.floor(Math.random() * coverColors.length)];

      await addBook(file, {
        title,
        author,
        coverUrl,
        coverColor: randomColor.bg,
        coverAccent: randomColor.accent
      });
    } catch (err) {
      console.error("Failed to parse EPUB:", err);
      alert("Failed to parse EPUB file. Please ensure it is a valid, unencrypted EPUB.");
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleToggleFavorite = (book) => updateBook(book.id, { isFavorite: !book.isFavorite });
  const handleViewDetail = (book) => setDetailBook(book);
  const handleToggleStatus = (book) =>
    updateBook(book.id, { status: book.status === 'finished' ? 'reading' : 'finished' });

  // Get recently read/opened book for the continue reading card
  const continueBook = allBooksRaw.length > 0 ? allBooksRaw.reduce((last, current) => {
    if (!last.lastOpenedAt) return current;
    if (!current.lastOpenedAt) return last;
    return current.lastOpenedAt > last.lastOpenedAt ? current : last;
  }) : null;
  const showContinueCard = continueBook && continueBook.status !== 'finished';

  const oneWeekAgo = Date.now() - 86400000 * 7;
  const sections = [
    { title: 'Currently Reading', books: books.filter(b => b.status === 'reading') },
    { title: 'Favorites', books: books.filter(b => b.isFavorite) },
    { title: 'Recently Added', books: books.filter(b => b.addedAt > oneWeekAgo) },
    { title: 'Finished', books: books.filter(b => b.status === 'finished') },
  ].filter(s => s.books.length > 0);

  // Fallback flat list if we just filtered/sorted and none matches section templates
  const hasSections = sections.length > 0;

  const ViewSection = viewMode === 'bookshelf' ? BookshelfSection
    : viewMode === 'grid' ? GridSection
    : ListSection;

  return (
    <div className={styles.screen} onClick={() => contextMenu && setContextMenu(null)}>
      {/* Importing Loader overlay */}
      {isImporting && (
        <div className={styles.importingOverlay}>
          <div className={styles.spinner} />
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Importing EPUB...</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Extracting book metadata & cover</p>
        </div>
      )}

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

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 8px', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
        {[
          { id: 'all', label: 'All' },
          { id: 'reading', label: 'Reading' },
          { id: 'unread', label: 'Unread' },
          { id: 'finished', label: 'Finished' },
          { id: 'favorites', label: 'Favorites' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterBy(tab.id)}
            style={{
              padding: '6px 12px',
              borderRadius: 14,
              border: 'none',
              background: filterBy === tab.id ? 'var(--accent-dark)' : 'var(--bg-secondary)',
              color: filterBy === tab.id ? '#F5E6C0' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 150ms ease'
            }}
          >
            {tab.label}
          </button>
        ))}
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
        {/* Continue Reading Card */}
        {showContinueCard && filterBy === 'all' && (
          <div className={styles.continueCard}>
            <BookCover book={continueBook} size="hero" />
            <div className={styles.continueInfo}>
              <div className={styles.continueMeta}>
                <span className={styles.continueLabel}>Continue Reading</span>
                <h3 className={styles.continueTitle}>{continueBook.title}</h3>
                <p className={styles.continueAuthor}>{continueBook.author}</p>
              </div>
              <div className={styles.continueProgress}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <ProgressBar bookId={continueBook.id} status={continueBook.status} />
                  <span className="text-xs text-secondary" style={{ fontSize: 11 }}>
                    {Math.round(parseFloat(localStorage.getItem(`aurelia_pct_${continueBook.id}`) || 0))}%
                  </span>
                </div>
                <button className={styles.continueBtn} onClick={() => onOpenBook(continueBook)}>
                  <span>📖</span> Resume Book
                </button>
              </div>
            </div>
          </div>
        )}

        {books.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📚</div>
            <p>No books in this view</p>
            <p className="text-secondary text-sm" style={{ marginTop: 8 }}>Try clearing filters or import an EPUB</p>
          </div>
        ) : hasSections && filterBy === 'all' ? (
          sections.map(section => (
            <ViewSection
              key={section.title}
              title={section.title}
              books={section.books}
              onOpenBook={onOpenBook}
              onContextMenu={handleContextMenu}
            />
          ))
        ) : (
          <ViewSection
            title={filterBy.charAt(0).toUpperCase() + filterBy.slice(1) + " Books"}
            books={books}
            onOpenBook={onOpenBook}
            onContextMenu={handleContextMenu}
          />
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
                onRename={setRenamingBook}
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

      {/* Rename Modal */}
      <AnimatePresence>
        {renamingBook && (
          <RenameModal
            book={renamingBook}
            onClose={() => setRenamingBook(null)}
            onSave={(title, author) => {
              updateBook(renamingBook.id, { title, author });
              setRenamingBook(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
