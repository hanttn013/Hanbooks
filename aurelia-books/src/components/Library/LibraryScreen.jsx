import { memo, useMemo, useRef, useState } from 'react';
import BookCover from './BookCover';
import styles from './LibraryScreen.module.css';
import { extractEpubsFromArchive, isArchiveFile, isSupportedImportFile } from '../../utils/archiveImport';

const GRID_COLUMNS = 3;
const GRID_ROW_HEIGHT = 250;
const LIST_ROW_HEIGHT = 104;
const VIEWPORT_HEIGHT = 720;
const OVERSCAN_ROWS = 3;

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

const BookGridItem = memo(function BookGridItem({
  book,
  selected,
  selecting,
  pct,
  onTap,
  onHoldStart,
  onHoldCancel,
  onOpenInfo,
}) {
  return (
    <button
      className={styles.gridItem}
      onClick={() => onTap(book)}
      onPointerDown={() => onHoldStart(book)}
      onPointerUp={onHoldCancel}
      onPointerLeave={onHoldCancel}
      onContextMenu={e => onOpenInfo?.(e, book)}
    >
      <span className={styles.coverWrap}>
        <BookCover book={book} size="large" style={{ width: '100%', height: '100%' }} />
        {selecting && <SelectionBadge checked={selected} />}
        {book.isFavorite && (
          <span className={styles.coverBookmark} aria-label="Favorite">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17.3l-5.2 3 1.4-5.8-4.5-3.9 6-.5L12 4.6l2.3 5.5 6 .5-4.5 3.9 1.4 5.8-5.2-3z"/>
            </svg>
          </span>
        )}
        {!selecting && (
          <span
            role="button"
            tabIndex={0}
            className={styles.cardMenuBtn}
            onClick={event => onOpenInfo(event, book)}
            onPointerDown={event => event.stopPropagation()}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') onOpenInfo(event, book);
            }}
            title="Book info"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h.01M12 12h.01M19 12h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </span>
        )}
      </span>
      <span className={styles.bookTitle}>{book.title}</span>
      <span className={styles.bookAuthor}>{book.author}</span>
      <span className={styles.bookMeta}>{pct}% complete</span>
    </button>
  );
});

const BookListItem = memo(function BookListItem({ book, selected, selecting, pct, onTap, onToggleSelected, onOpenInfo }) {
  return (
    <li>
      <button
        className={styles.listItem}
        onClick={() => selecting ? onToggleSelected(book.id) : onTap(book)}
        onContextMenu={e => { e.preventDefault(); onOpenInfo?.(book); }}
      >
        <BookCover book={book} size="small" />
        <span className={styles.listInfo}>
          <strong>{book.title}</strong>
          <small>{book.author}</small>
          <small>{book.genre || 'Fiction'} - {book.estimatedPages || 0} pages - {pct}%</small>
        </span>
        {selecting && <SelectionBadge checked={selected} />}
      </button>
    </li>
  );
});

export default function LibraryScreen({ library, onOpenBook, onOpenBookInfo, onGoLists }) {
  const [viewMode, setViewMode] = useState('grid');
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [targetListId, setTargetListId] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [importSummary, setImportSummary] = useState(null);
  const [scrollTop, setScrollTop] = useState(0);
  const fileRef = useRef(null);
  const scrollRef = useRef(null);
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
    createList,
    addBooksToList,
  } = library;

  const resetScroll = () => {
    setScrollTop(0);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const virtual = useMemo(() => {
    const rowHeight = viewMode === 'grid' ? GRID_ROW_HEIGHT : LIST_ROW_HEIGHT;
    const itemCount = books.length;
    const rowCount = viewMode === 'grid'
      ? Math.ceil(itemCount / GRID_COLUMNS)
      : itemCount;
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN_ROWS);
    const visibleRows = Math.ceil(VIEWPORT_HEIGHT / rowHeight) + OVERSCAN_ROWS * 2;
    const endRow = Math.min(rowCount, startRow + visibleRows);
    const startIndex = viewMode === 'grid' ? startRow * GRID_COLUMNS : startRow;
    const endIndex = viewMode === 'grid' ? Math.min(itemCount, endRow * GRID_COLUMNS) : endRow;
    return {
      startIndex,
      visibleBooks: books.slice(startIndex, endIndex),
      topSpacer: startRow * rowHeight,
      bottomSpacer: Math.max(0, (rowCount - endRow) * rowHeight),
    };
  }, [books, scrollTop, viewMode]);

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
    const files = Array.from(e.target.files || []).filter(isSupportedImportFile);
    if (files.length === 0) return;

    setIsImporting(true);
    setImportStatus('Preparing import...');
    let totalEpubs = 0;
    let importedCount = 0;
    let skippedCount = 0;
    let listsCreated = 0;
    let errorCount = 0;

    try {
      for (const file of files) {
        if (isArchiveFile(file)) {
          setImportStatus(`Extracting ${file.name}...`);
          const archive = await extractEpubsFromArchive(file);
          if (archive.files.length === 0) {
            errorCount++;
            continue;
          }
          let processed = 0;
          for (const group of archive.groups || [{ name: archive.listName, files: archive.files }]) {
            const importedIds = [];
            for (let index = 0; index < group.files.length; index += 1) {
              const epubFile = group.files[index];
              processed += 1;
              totalEpubs += 1;
              setImportStatus(`Importing ${processed}/${archive.files.length} from ${archive.sourceName}...`);
              try {
                const book = await addBook(epubFile, null, { fastMetadata: true });
                if (book.skippedDuplicate) skippedCount += 1;
                else {
                  importedCount += 1;
                  importedIds.push(book.id);
                }
              } catch (e) {
                errorCount++;
              }
              await new Promise(resolve => window.setTimeout(resolve, 0));
            }
            if (importedIds.length > 0) {
              await createList({
                name: group.name || archive.listName,
                description: `${importedIds.length} books imported from ${archive.sourceName}`,
                coverStyle: 'forest',
                bookIds: importedIds,
              });
              listsCreated += 1;
              await new Promise(resolve => window.setTimeout(resolve, 0));
            }
          }
        } else {
          setImportStatus(`Importing ${file.name}...`);
          totalEpubs += 1;
          try {
            const book = await addBook(file, null, { fastMetadata: true });
            if (book.skippedDuplicate) skippedCount += 1;
            else importedCount += 1;
          } catch (e) {
            errorCount++;
          }
          await new Promise(resolve => window.setTimeout(resolve, 0));
        }
      }
      setImportSummary({
        totalEpubs,
        importedCount,
        skippedCount,
        listsCreated,
        errorCount,
        pendingCount: importedCount,
      });
    } catch (err) {
      console.error('Failed to import EPUB:', err);
      alert(err.message || 'Failed to import. Please use valid EPUB, ZIP, or RAR files.');
    } finally {
      window.setTimeout(() => {
        setIsImporting(false);
        setImportStatus('');
      }, 350);
      if (fileRef.current) {
        fileRef.current.value = '';
      }
    }
  };

  const handleAddSelectedToList = async () => {
    if (!targetListId || selectedIds.length === 0) return;
    await addBooksToList(targetListId, selectedIds);
    clearSelection();
  };

  const openInfo = (event, book) => {
    event.preventDefault();
    event.stopPropagation();
    cancelHold();
    holdTriggeredRef.current = true;
    onOpenBookInfo?.(book);
  };

  return (
    <div className={styles.screen}>
      {isImporting && (
        <div className={styles.importingOverlay}>
          <div className={styles.spinner} />
          <p>{importStatus || 'Importing...'}</p>
          <small>EPUB, ZIP, and RAR archives are supported</small>
        </div>
      )}

      {importSummary && (
        <div className="modal-overlay" onClick={() => setImportSummary(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-header">
              <span className="modal-title">Import Summary</span>
              <button className="btn-icon" onClick={() => setImportSummary(null)}>x</button>
            </div>
            <div className="modal-scroll" style={{ padding: '0 20px 24px' }}>
              <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                Đã import {importSummary.totalEpubs} sách
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary)' }}>
                <li style={{ marginBottom: 6 }}>- {importSummary.importedCount} sách mới</li>
                <li style={{ marginBottom: 6 }}>- {importSummary.skippedCount} sách trùng đã bỏ qua</li>
                {importSummary.errorCount > 0 && <li style={{ marginBottom: 6, color: '#D33' }}>- {importSummary.errorCount} sách lỗi</li>}
                {importSummary.listsCreated > 0 && <li style={{ marginBottom: 6 }}>- {importSummary.listsCreated} list được tạo</li>}
                {importSummary.pendingCount > 0 && <li style={{ marginBottom: 6 }}>- {importSummary.pendingCount} sách đang chờ cập nhật thông tin</li>}
              </ul>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button className="btn-primary" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', boxShadow: 'none' }} onClick={() => setImportSummary(null)}>
                  Xem thư viện
                </button>
                <button className="btn-primary" onClick={() => {
                  setImportSummary(null);
                  if (onGoLists) onGoLists();
                }}>
                  Xem lists
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className={`${styles.header} safe-top`}>
        <div>
          <div className="brand-lockup">
            <img className="brand-logo" src="/branding/shanbooks-logo.png" alt="" />
            <p className="aurelia-wordmark">ShanBooks</p>
          </div>
          <h1 className="screen-title">Library</h1>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.importBtn} onClick={() => fileRef.current?.click()} title="Import EPUB">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <input ref={fileRef} type="file" accept=".epub,.zip,.rar,application/epub+zip,application/zip,application/x-rar-compressed" hidden multiple onChange={handleFileImport} />
          <button
            className={styles.iconBtn}
            onClick={() => {
              setViewMode(viewMode === 'grid' ? 'list' : 'grid');
              resetScroll();
            }}
            title="Toggle view"
          >
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
          onChange={e => {
            setSearchQuery(e.target.value);
            resetScroll();
          }}
          placeholder="Search title, author, genre, lists"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              resetScroll();
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div className={styles.filterRail}>
        {FILTERS.map(item => (
          <button
            key={item.id}
            className={filterBy === item.id ? styles.activeChip : ''}
            onClick={() => {
              setFilterBy(item.id);
              resetScroll();
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={styles.libraryTools}>
        <span>{books.length} {books.length === 1 ? 'book' : 'books'}</span>
        <select
          value={sortBy}
          onChange={e => {
            setSortBy(e.target.value);
            resetScroll();
          }}
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <button onClick={() => selecting ? clearSelection() : setSelecting(true)}>
          {selecting ? 'Done' : 'Select'}
        </button>
      </div>

      <div
        ref={scrollRef}
        className="screen-scroll"
        onScroll={event => setScrollTop(event.currentTarget.scrollTop)}
      >
        {books.length === 0 ? (
          <div className={styles.empty}>
            <strong>No books found</strong>
            <span>Try another search, clear filters, or import an EPUB.</span>
          </div>
        ) : viewMode === 'grid' ? (
          <>
          {virtual.topSpacer > 0 && <div style={{ height: virtual.topSpacer }} />}
          <div className={styles.denseGrid}>
            {virtual.visibleBooks.map(book => {
              const selected = selectedSet.has(book.id);
              const pct = Math.round(progressFor(book));
              return (
                <BookGridItem
                  key={book.id}
                  book={book}
                  selected={selected}
                  selecting={selecting}
                  pct={pct}
                  onTap={handleBookTap}
                  onHoldStart={startHold}
                  onHoldCancel={cancelHold}
                  onOpenInfo={openInfo}
                />
              );
            })}
          </div>
          {virtual.bottomSpacer > 0 && <div style={{ height: virtual.bottomSpacer }} />}
          </>
        ) : (
          <ul className={styles.listView}>
            {virtual.topSpacer > 0 && <li style={{ height: virtual.topSpacer }} />}
            {virtual.visibleBooks.map(book => {
              const selected = selectedSet.has(book.id);
              const pct = Math.round(progressFor(book));
              return (
                <BookListItem
                  key={book.id}
                  book={book}
                  selected={selected}
                  selecting={selecting}
                  pct={pct}
                  onTap={onOpenBook}
                  onToggleSelected={toggleSelected}
                  onOpenInfo={onOpenBookInfo}
                />
              );
            })}
            {virtual.bottomSpacer > 0 && <li style={{ height: virtual.bottomSpacer }} />}
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
