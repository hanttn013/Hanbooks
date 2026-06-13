import { useRef, useState } from 'react';
import BookCover from './BookCover';
import styles from './LibraryScreen.module.css';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'reading', label: 'Reading' },
  { id: 'unread', label: 'Unread' },
  { id: 'finished', label: 'Finished' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'bookmarked', label: 'Has Bookmarks' },
];

const SORT_OPTIONS = [
  { value: 'lastOpenedAt', label: 'Recently Opened' },
  { value: 'addedAt', label: 'Recently Added' },
  { value: 'title', label: 'Title A-Z' },
  { value: 'author', label: 'Author A-Z' },
  { value: 'progress', label: 'Progress' },
];

function progressFor(book) {
  return parseFloat(localStorage.getItem(`aurelia_pct_${book.id}`) || (book.status === 'finished' ? 100 : 0));
}

function SelectionBadge({ checked }) {
  return (
    <span className={`${styles.selectionBadge} ${checked ? styles.selectionChecked : ''}`}>
      {checked && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </span>
  );
}

export default function LibraryScreen({ library, onOpenBook, onOpenBookInfo }) {
  const [viewMode, setViewMode] = useState('grid');
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [targetListId, setTargetListId] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileRef = useRef(null);
  const holdTimerRef = useRef(null);
  const holdTriggeredRef = useRef(false);

  const {
    books,
    addBook,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filterBy,
    setFilterBy,
    lists,
    addBooksToList,
  } = library;

  const toggleSelected = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const clearSelection = () => {
    setSelecting(false);
    setSelectedIds([]);
  };

  const handleBookTap = (book) => {
    if (holdTriggeredRef.current) {
      holdTriggeredRef.current = false;
      return;
    }
    if (selecting) {
      toggleSelected(book.id);
      return;
    }
    onOpenBook(book);
  };

  const startHold = (book) => {
    holdTriggeredRef.current = false;
    window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = window.setTimeout(() => {
      holdTriggeredRef.current = true;
      onOpenBookInfo?.(book);
    }, 450);
  };

  const cancelHold = () => {
    window.clearTimeout(holdTimerRef.current);
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      await addBook(file);
    } catch (err) {
      console.error('Failed to import EPUB:', err);
      alert('Failed to parse EPUB file. Please ensure it is a valid, unencrypted EPUB.');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleAddSelectedToList = async () => {
    if (!targetListId || selectedIds.length === 0) return;
    await addBooksToList(targetListId, selectedIds);
    clearSelection();
  };

  return (
    <div className={styles.screen}>
      {isImporting && (
        <div className={styles.importingOverlay}>
          <div className={styles.spinner} />
          <p>Importing EPUB...</p>
          <small>Extracting metadata, cover, and preview</small>
        </div>
      )}

      <header className={`${styles.header} safe-top`}>
        <div>
          <p className="aurelia-wordmark">AURELIA</p>
          <h1 className="screen-title">Library</h1>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.importBtn} onClick={() => fileRef.current?.click()} title="Import EPUB">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <input ref={fileRef} type="file" accept=".epub" hidden onChange={handleFileImport} />
          <button className={styles.iconBtn} onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} title="Toggle view">
            {viewMode === 'grid' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="4" width="6" height="6" stroke="currentColor" strokeWidth="1.8"/>
                <rect x="14" y="4" width="6" height="6" stroke="currentColor" strokeWidth="1.8"/>
                <rect x="4" y="14" width="6" height="6" stroke="currentColor" strokeWidth="1.8"/>
                <rect x="14" y="14" width="6" height="6" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
            )}
          </button>
        </div>
      </header>

      <div className={styles.searchWrap}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
          <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search title, author, genre, lists"
        />
        {searchQuery && <button onClick={() => setSearchQuery('')}>Clear</button>}
      </div>

      <div className={styles.filterRail}>
        {FILTERS.map(item => (
          <button
            key={item.id}
            className={filterBy === item.id ? styles.activeChip : ''}
            onClick={() => setFilterBy(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={styles.libraryTools}>
        <span>{books.length} {books.length === 1 ? 'book' : 'books'}</span>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <button onClick={() => selecting ? clearSelection() : setSelecting(true)}>
          {selecting ? 'Done' : 'Select'}
        </button>
      </div>

      <div className="screen-scroll">
        {books.length === 0 ? (
          <div className={styles.empty}>
            <strong>No books found</strong>
            <span>Try another search, clear filters, or import an EPUB.</span>
          </div>
        ) : viewMode === 'grid' ? (
          <div className={styles.denseGrid}>
            {books.map(book => {
              const selected = selectedIds.includes(book.id);
              return (
                <button
                  key={book.id}
                  className={styles.gridItem}
                  onClick={() => handleBookTap(book)}
                  onPointerDown={() => startHold(book)}
                  onPointerUp={cancelHold}
                  onPointerLeave={cancelHold}
                  onContextMenu={e => { e.preventDefault(); onOpenBookInfo?.(book); }}
                >
                  <span className={styles.coverWrap}>
                    <BookCover book={book} size="large" style={{ width: '100%', height: '100%' }} />
                    {selecting && <SelectionBadge checked={selected} />}
                    <span className={styles.coverBookmark}>{book.isFavorite ? '★' : ''}</span>
                  </span>
                  <span className={styles.bookTitle}>{book.title}</span>
                  <span className={styles.bookAuthor}>{book.author}</span>
                  <span className={styles.bookMeta}>{book.genre || 'Fiction'} · {Math.round(progressFor(book))}%</span>
                </button>
              );
            })}
          </div>
        ) : (
          <ul className={styles.listView}>
            {books.map(book => {
              const selected = selectedIds.includes(book.id);
              return (
                <li key={book.id}>
                  <button
                    className={styles.listItem}
                    onClick={() => selecting ? toggleSelected(book.id) : onOpenBook(book)}
                    onContextMenu={e => { e.preventDefault(); onOpenBookInfo?.(book); }}
                  >
                    <BookCover book={book} size="small" />
                    <span className={styles.listInfo}>
                      <strong>{book.title}</strong>
                      <small>{book.author}</small>
                      <small>{book.genre || 'Fiction'} · {book.estimatedPages || 0} pages · {Math.round(progressFor(book))}%</small>
                    </span>
                    {selecting && <SelectionBadge checked={selected} />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selecting && selectedIds.length > 0 && (
        <div className={styles.selectionBar}>
          <span>{selectedIds.length} selected</span>
          <select value={targetListId} onChange={e => setTargetListId(e.target.value)}>
            <option value="">Choose list</option>
            {lists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}
          </select>
          <button disabled={!targetListId} onClick={handleAddSelectedToList}>Add</button>
        </div>
      )}
    </div>
  );
}
