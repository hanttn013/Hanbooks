import { memo, useEffect, useMemo, useRef, useState } from 'react';
import BookCover from './BookCover';
import { Action, Choice, SearchBox } from '../UI/Controls';
import Sheet from '../UI/Sheet';
import { useI18n } from '../../i18n/context';
import { ToastQueue } from '@react-spectrum/s2/Toast';
import styles from './LibraryScreen.module.css';
import { readProgressPercent } from '../../utils/storageKeys';
import { isArchiveFile } from '../../utils/archiveImport';
import { extractArchiveInWorker as extractDocumentsFromArchive } from '../../utils/archiveWorkerClient';

const GRID_ROW_HEIGHT = 340;
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
  return readProgressPercent(book);
}

function MetadataStatus({ book }) {
  const { t } = useI18n();
  const status = { processing: 'running', ready: 'done' }[book.metadataStatus] || book.metadataStatus || 'done';
  return <span data-metadata-status={status} role="status" title={book.metadataError || ''}>{t(status)}{status === 'failed' && book.metadataError ? `: ${book.metadataError}` : ''}</span>;
}

const BookGridItem = memo(function BookGridItem({ book, selected, selecting, pct, onTap, onHoldStart, onHoldCancel, onOpenInfo }) {
  const { t } = useI18n();
  return <article className="book-card library-book-card" data-selected={selected || undefined}>
    <button className="book-card-cover" data-book-format={book.format || 'epub'} aria-label={`${selecting ? t('Select') : t('Read')}: ${book.title}`} aria-pressed={selecting ? selected : undefined}
      onClick={() => onTap(book)} onPointerDown={() => onHoldStart(book)} onPointerUp={onHoldCancel} onPointerLeave={onHoldCancel} onContextMenu={event => onOpenInfo?.(event, book)}>
      <BookCover book={book} size="medium" />
    </button>
    <h3>{book.title}</h3><p>{book.author}</p><MetadataStatus book={book} /><p>{String(book.format || 'epub').toUpperCase()} · {t('completePercent', { count: pct })}</p>
    {!selecting && <div className="book-card-actions"><Action label={`${t('Book info')}: ${book.title}`} onPress={() => onOpenInfo({ preventDefault() {}, stopPropagation() {} }, book)}>{t('Info')}</Action></div>}
  </article>;
});

const BookListItem = memo(function BookListItem({ book, selected, selecting, pct, onTap, onToggleSelected, onOpenInfo }) {
  const { t } = useI18n();
  return <li className="library-list-row">
    <button data-book-format={book.format || 'epub'} aria-pressed={selecting ? selected : undefined} onClick={() => selecting ? onToggleSelected(book.id) : onTap(book)}>
      <BookCover book={book} size="small" /><span><strong>{book.title}</strong><small>{book.author}</small><MetadataStatus book={book} /><small>{t('completePercent', { count: pct })}</small></span>
    </button>
    {!selecting && <Action label={`${t('Book info')}: ${book.title}`} onPress={() => onOpenInfo(book)}>{t('Info')}</Action>}
  </li>;
});

export default function LibraryScreen({ library, onOpenBook, onOpenBookInfo, onGoLists }) {
  const { t } = useI18n();
  const [duplicate, setDuplicate] = useState(null);
  const duplicateResolve = useRef(null);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const columns = Math.max(2, Math.min(6, Math.floor((containerWidth - 40) / 180)));
  const [viewMode, setViewMode] = useState('grid');
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [targetListId, setTargetListId] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [importSummary, setImportSummary] = useState(null);
  const [importItems, setImportItems] = useState([]);
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

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    let frame;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setContainerWidth(element.clientWidth));
    });
    observer.observe(element);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); duplicateResolve.current?.('skip'); };
  }, []);
  const chooseDuplicate = choice => { duplicateResolve.current?.(choice); duplicateResolve.current = null; setDuplicate(null); };

  const resetScroll = () => {
    setScrollTop(0);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const virtual = useMemo(() => {
    const rowHeight = viewMode === 'grid' ? GRID_ROW_HEIGHT : LIST_ROW_HEIGHT;
    const itemCount = books.length;
    const rowCount = viewMode === 'grid'
      ? Math.ceil(itemCount / columns)
      : itemCount;
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN_ROWS);
    const visibleRows = Math.ceil(VIEWPORT_HEIGHT / rowHeight) + OVERSCAN_ROWS * 2;
    const endRow = Math.min(rowCount, startRow + visibleRows);
    const startIndex = viewMode === 'grid' ? startRow * columns : startRow;
    const endIndex = viewMode === 'grid' ? Math.min(itemCount, endRow * columns) : endRow;
    return {
      startIndex,
      visibleBooks: books.slice(startIndex, endIndex),
      topSpacer: startRow * rowHeight,
      bottomSpacer: Math.max(0, (rowCount - endRow) * rowHeight),
    };
  }, [books, scrollTop, viewMode, columns]);

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
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsImporting(true);
    setImportStatus('Preparing import...');
    setImportItems(files.map((file, index) => ({ id: `selected-${index}`, name: file.name, status: 'pending', message: 'Waiting' })));
    let totalFiles = 0;
    let importedCount = 0;
    let skippedCount = 0;
    let listsCreated = 0;
    let errorCount = 0;

    const updateItem = (id, updates) => {
      setImportItems(current => current.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const importOne = async (file, id) => {
      totalFiles += 1;
      updateItem(id, { name: file.name, status: 'processing', message: 'Checking format and content...' });
      try {
        let book = await addBook(file, null, { fastMetadata: true });
        if (book.skippedDuplicate) {
          const choice = await new Promise(resolve => { duplicateResolve.current = resolve; setDuplicate(file.name); });
          if (choice === 'keep' || choice === 'replace') {
            book = await addBook(file, null, {
              fastMetadata: true,
              analysis: book.analysis,
              duplicateStrategy: choice,
            });
            importedCount += 1;
            updateItem(id, { status: 'success', message: choice === 'replace' ? 'Replaced existing copy' : 'Kept both copies' });
            return book;
          }
          skippedCount += 1;
          updateItem(id, { status: 'duplicate', message: 'Duplicate skipped' });
          return null;
        }
        importedCount += 1;
        updateItem(id, { status: 'success', message: t('Imported format', { format: String(book.format || 'document').toUpperCase() }) });
        return book;
      } catch (error) {
        errorCount += 1;
        updateItem(id, { status: 'error', message: error?.message || 'Import failed' });
        return null;
      }
    };

    try {
      for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
        const file = files[fileIndex];
        const selectedId = `selected-${fileIndex}`;
        if (isArchiveFile(file)) {
          setImportStatus(t('Extracting file', { name: file.name }));
          updateItem(selectedId, { status: 'processing', message: 'Inspecting archive...' });
          let archive;
          try {
            archive = await extractDocumentsFromArchive(file);
          } catch (error) {
            errorCount += 1;
            updateItem(selectedId, { status: 'error', message: error.message || 'Invalid archive' });
            continue;
          }
          if (archive.files.length === 0) {
            errorCount++;
            updateItem(selectedId, { status: 'error', message: 'No supported documents in archive' });
            continue;
          }
          updateItem(selectedId, { status: 'success', message: t('Documents found', { count: archive.files.length }) });
          let processed = 0;
          for (const group of archive.groups || [{ name: archive.listName, files: archive.files }]) {
            const importedIds = [];
            for (let index = 0; index < group.files.length; index += 1) {
              const documentFile = group.files[index];
              processed += 1;
              setImportStatus(t('Importing archive item', { current: processed, total: archive.files.length, name: archive.sourceName }));
              const itemId = `archive-${fileIndex}-${processed}`;
              setImportItems(current => [...current, { id: itemId, name: documentFile.name, status: 'pending', message: t('From archive', { name: archive.sourceName }) }]);
              const book = await importOne(documentFile, itemId);
              if (book) importedIds.push(book.id);
              await new Promise(resolve => window.setTimeout(resolve, 0));
            }
            if (importedIds.length > 0) {
              await createList({
                name: group.name || archive.listName,
                description: t('Imported list description', { count: importedIds.length, name: archive.sourceName }),
                coverStyle: 'forest',
                bookIds: importedIds,
              });
              listsCreated += 1;
              await new Promise(resolve => window.setTimeout(resolve, 0));
            }
          }
        } else {
          setImportStatus(t('Importing file', { name: file.name }));
          await importOne(file, selectedId);
          await new Promise(resolve => window.setTimeout(resolve, 0));
        }
      }
      setImportSummary({
        totalFiles,
        importedCount,
        skippedCount,
        listsCreated,
        errorCount,
        pendingCount: importedCount,
      });
    } catch (err) {
      console.error('Failed to import documents:', err);
      ToastQueue.negative(t(err.message || 'Import failed. Check the per-file status for details.'));
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

  return <div className={styles.screen} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); handleFileImport({ target: { files: event.dataTransfer.files } }); }}>
    {duplicate && <Sheet title="Duplicate document" onClose={() => chooseDuplicate('skip')} footer={<><Action onPress={() => chooseDuplicate('keep')}>{t('Keep both')}</Action><Action negative onPress={() => chooseDuplicate('replace')}>{t('Replace')}</Action></>}><p>{duplicate}</p><p>{t('duplicatePrompt')}</p></Sheet>}
    {isImporting && !duplicate && <div className={styles.importingOverlay} role="status" aria-live="polite"><p>{t(importStatus || 'Importing...')}</p><small>{t('Documents are checked by content and processed offline')}</small></div>}
    {importSummary && <Sheet title="Import Summary" onClose={() => setImportSummary(null)} footer={<Action primary onPress={() => { setImportSummary(null); onGoLists?.(); }}>{t('Lists')}</Action>}>
      <p>{t('processedCount', { count: importSummary.totalFiles })}</p>
      <ul aria-label={t('Import results')}>{importItems.map(item => <li key={item.id} data-import-status={item.status}><strong>{item.name}</strong> — {t(item.message)}</li>)}</ul>
      <p>{t('newBooksCount', { count: importSummary.importedCount })} · {t('duplicatesCount', { count: importSummary.skippedCount })} · {t('errorsCount', { count: importSummary.errorCount })}</p>
    </Sheet>}
    <header className={`${styles.header} safe-top`}>
      <div><p className="aurelia-wordmark">ShanBooks</p><h1 className="screen-title">{t('Library')}</h1></div>
      <div className="action-row"><Action primary onPress={() => fileRef.current?.click()}>{t('Import documents')}</Action><Action onPress={() => { setViewMode(viewMode === 'grid' ? 'list' : 'grid'); resetScroll(); }}>{t('Toggle view')}</Action></div>
      <input ref={fileRef} type="file" accept=".epub,.pdf,.docx,.txt,.md,.markdown,.html,.htm,.pptx,.cbz,.zip,.rar,.doc,.xls,.ppt" hidden multiple onChange={handleFileImport} />
    </header>
    <div className="library-search"><SearchBox label="Search title, author, genre, lists" value={searchQuery} onChange={value => { setSearchQuery(value); resetScroll(); }} /></div>
    <div className={styles.filterRail}>{FILTERS.map(item => <Action key={item.id} aria-pressed={filterBy === item.id} onPress={() => { setFilterBy(item.id); resetScroll(); }}>{t(item.label)}</Action>)}</div>
    <div className={styles.libraryTools}><span>{t('booksCount', { count: books.length })}</span><Choice label="Sort books" value={sortBy} onChange={value => { setSortBy(value); resetScroll(); }} options={SORT_OPTIONS} /><Action onPress={() => selecting ? clearSelection() : setSelecting(true)}>{t(selecting ? 'Done' : 'Select')}</Action></div>
    <div ref={scrollRef} className="screen-scroll" onScroll={event => setScrollTop(event.currentTarget.scrollTop)}>
      {books.length === 0 ? <div className="empty-state"><strong>{t('No books found')}</strong><p>{t('Try another search, clear filters, or import a document.')}</p><Action onPress={() => { setSearchQuery(''); setFilterBy('all'); }}>{t('Clear')}</Action></div> : viewMode === 'grid' ? <>
        {virtual.topSpacer > 0 && <div style={{ height: virtual.topSpacer }} />}
        <div className="library-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{virtual.visibleBooks.map(book => <BookGridItem key={book.id} book={book} selected={selectedSet.has(book.id)} selecting={selecting} pct={Math.round(progressFor(book))} onTap={handleBookTap} onHoldStart={startHold} onHoldCancel={cancelHold} onOpenInfo={openInfo} />)}</div>
        {virtual.bottomSpacer > 0 && <div style={{ height: virtual.bottomSpacer }} />}
      </> : <ul className="library-list">{virtual.topSpacer > 0 && <li style={{ height: virtual.topSpacer }} />}{virtual.visibleBooks.map(book => <BookListItem key={book.id} book={book} selected={selectedSet.has(book.id)} selecting={selecting} pct={Math.round(progressFor(book))} onTap={onOpenBook} onToggleSelected={toggleSelected} onOpenInfo={onOpenBookInfo} />)}{virtual.bottomSpacer > 0 && <li style={{ height: virtual.bottomSpacer }} />}</ul>}
    </div>
    {selecting && selectedIds.length > 0 && <div className="selection-toolbar"><strong>{t('selectedCount', { count: selectedIds.length })}</strong><Choice label="Choose list" value={targetListId} onChange={setTargetListId} options={[{ id: '', label: 'Choose list' }, ...lists.map(list => ({ id: list.id, label: list.name, raw: true }))]} /><Action primary disabled={!targetListId} onPress={handleAddSelectedToList}>{t('Add')}</Action></div>}
  </div>;
}
