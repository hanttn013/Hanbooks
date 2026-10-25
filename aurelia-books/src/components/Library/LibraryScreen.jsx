// src/components/Library/LibraryScreen.jsx
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import BookCard from '../Common/BookCard';
import Cover from '../Common/Cover';
import Sheet from '../Common/Sheet';
import EmptyState from '../Common/EmptyState';
import { useI18n } from '../../i18n/context';
import { ToastQueue } from '@react-spectrum/s2/Toast';
import Button from '../Common/Button';
import IconButton from '../Common/IconButton';
import EdgeAction from '../Common/EdgeAction';
import { ActionMenu } from '@react-spectrum/s2/ActionMenu';
import { Picker, PickerItem } from '@react-spectrum/s2/Picker';
import { MenuTrigger, Menu, MenuItem } from '@react-spectrum/s2/Menu';
import { SearchField } from '@react-spectrum/s2/SearchField';
import { ToggleButton } from '@react-spectrum/s2/ToggleButton';
import { ToggleButtonGroup } from '@react-spectrum/s2/ToggleButtonGroup';
import BookQuickPreviewModal from './BookQuickPreviewModal';
import styles from './LibraryScreen.module.css';
import { readProgressPercent } from '../../utils/storageKeys';
import { isArchiveFile } from '../../utils/archiveImport';
import { extractArchiveInWorker as extractDocumentsFromArchive } from '../../utils/archiveWorkerClient';

const VIEWPORT_HEIGHT = 800;
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

const BookGridItem = memo(function BookGridItem({
  book,
  selected,
  selecting,
  onTap,
  onOpenInfo,
  onQuickPreview,
  onToggleSelect,
}) {
  return (
    <BookCard
      book={book}
      selected={selected}
      selecting={selecting}
      onOpenBook={onTap}
      onOpenBookInfo={onOpenInfo}
      onQuickPreview={onQuickPreview}
      onToggleSelect={onToggleSelect}
    />
  );
});

const BookListItem = memo(function BookListItem({
  book,
  selected,
  selecting,
  pct,
  onTap,
  onToggleSelected,
  onOpenInfo,
}) {
  const { t } = useI18n();
  return (
    <li className={styles.listRow} data-selected={selected || undefined}>
      <div
        role="button"
        tabIndex={0}
        className={styles.listRowButton}
        onClick={() => selecting ? onToggleSelected(book.id) : onTap(book)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selecting ? onToggleSelected(book.id) : onTap(book);
          }
        }}
        aria-pressed={selecting ? selected : undefined}
      >
        <div className={styles.listCoverThumb}>
          <Cover
            src={book.coverUrl || book.coverImage}
            title={book.title}
            author={book.author}
            shape="book"
          />
        </div>
        <div className={styles.listRowContent}>
          <strong className={styles.listRowTitle}>{book.title}</strong>
          <small className={styles.listRowAuthor}>{book.author || t('Unknown author')}</small>
          <div className={styles.listRowMeta}>
            <span className={styles.formatTag}>{String(book.format || 'epub').toUpperCase()}</span>
            {pct > 0 && <span className={styles.progressBadge}>· {pct}%</span>}
          </div>
        </div>
      </div>
      {!selecting && (
        <IconButton
          size="S"
          aria-label={`${t('View details')}: ${book.title}`}
          onPress={() => onOpenInfo(book)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
            <circle cx="5" cy="12" r="1.5" />
          </svg>
        </IconButton>
      )}
    </li>
  );
});

export default function LibraryScreen({ library, onOpenBook, onOpenBookInfo, onGoLists }) {
  const { t } = useI18n();
  const [duplicate, setDuplicate] = useState(null);
  const duplicateResolve = useRef(null);
  const [containerWidth, setContainerWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 800
  );
  const [viewMode, setViewMode] = useState('grid');
  const [coverSize, setCoverSize] = useState('medium'); // 'small' | 'medium' | 'large'
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [targetListId, setTargetListId] = useState('');
  const [quickPreviewBook, setQuickPreviewBook] = useState(null);
  const [showDisplayOptions, setShowDisplayOptions] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [importSummary, setImportSummary] = useState(null);
  const [importItems, setImportItems] = useState([]);
  const [scrollTop, setScrollTop] = useState(0);
  const fileRef = useRef(null);
  const scrollRef = useRef(null);

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
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      duplicateResolve.current?.('skip');
    };
  }, []);

  const chooseDuplicate = (choice) => {
    duplicateResolve.current?.(choice);
    duplicateResolve.current = null;
    setDuplicate(null);
  };

  const resetScroll = () => {
    setScrollTop(0);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // Auto-calculating responsive columns aligned with CSS Grid:
  // repeat(auto-fill, minmax(clamp(105px, 28vw, 160px), 1fr)) & gap: clamp(12px, 2.5vw, 24px)
  const columns = useMemo(() => {
    if (containerWidth <= 0) return 3;
    const padding = 32;
    const available = Math.min(1200, containerWidth) - padding;
    const minCard = Math.max(105, Math.min(160, containerWidth * 0.28));
    const gap = Math.max(12, Math.min(24, containerWidth * 0.025));
    const count = Math.floor((available + gap) / (minCard + gap));
    return Math.max(2, Math.min(8, count));
  }, [containerWidth]);

  const gridRowHeight = useMemo(() => {
    const horizontalPadding = 32;
    const gap = Math.max(12, Math.min(24, containerWidth * 0.025));
    const availableWidth = Math.min(1200, containerWidth) - horizontalPadding;
    const cardWidth = Math.min(170, Math.max(90, (availableWidth - (columns - 1) * gap) / columns));
    return Math.round(cardWidth * 1.5 + 68);
  }, [containerWidth, columns]);

  const listRowHeight = 80;

  const virtual = useMemo(() => {
    const rowHeight = viewMode === 'grid' ? gridRowHeight : listRowHeight;
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
  }, [books, scrollTop, viewMode, columns, gridRowHeight]);

  const toggleSelected = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const clearSelection = () => {
    setSelecting(false);
    setSelectedIds([]);
  };

  const handleBookTap = (book) => {
    if (selecting) {
      toggleSelected(book.id);
      return;
    }
    onOpenBook(book);
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

    const askDuplicateDecision = (existingBook) => {
      return new Promise((resolve) => {
        duplicateResolve.current = resolve;
        setDuplicate(existingBook.title || 'Untitled');
      });
    };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setImportItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'processing', message: 'Processing document...' } : item));

      if (isArchiveFile(file)) {
        setImportStatus(`Extracting ${file.name}...`);
        try {
          const archiveEntries = await extractDocumentsFromArchive(file);
          if (archiveEntries.length === 0) {
            setImportItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'skipped', message: 'No documents in archive' } : item));
            continue;
          }

          const archiveListName = file.name.replace(/\.[^/.]+$/, '');
          let archiveList = lists.find(l => l.name.toLowerCase() === archiveListName.toLowerCase());
          if (!archiveList) {
            archiveList = await createList(archiveListName, `Imported from archive ${file.name}`);
            listsCreated += 1;
          }

          const archiveBookIds = [];
          for (let eIdx = 0; eIdx < archiveEntries.length; eIdx++) {
            const entry = archiveEntries[eIdx];
            totalFiles += 1;
            setImportStatus(`Importing from ${file.name} (${eIdx + 1}/${archiveEntries.length})...`);
            try {
              const res = await addBook(entry.file, entry.folderCover, { onDuplicate: askDuplicateDecision, fastMetadata: true });
              if (res.skippedDuplicate) {
                skippedCount += 1;
              } else if (res.book) {
                importedCount += 1;
                archiveBookIds.push(res.book.id);
              }
            } catch (err) {
              console.error('Error importing archive file entry:', err);
              errorCount += 1;
            }
          }

          if (archiveBookIds.length > 0 && archiveList) {
            await addBooksToList(archiveList.id, archiveBookIds);
          }
          setImportItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'success', message: `Imported documents to list "${archiveListName}"` } : item));
        } catch (err) {
          console.error('Error extracting archive:', err);
          errorCount += 1;
          setImportItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'error', message: 'Could not extract archive' } : item));
        }
      } else {
        totalFiles += 1;
        setImportStatus(`Importing ${file.name}...`);
        try {
          const res = await addBook(file, null, { onDuplicate: askDuplicateDecision, fastMetadata: true });
          if (res.skippedDuplicate) {
            skippedCount += 1;
            setImportItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'skipped', message: 'Duplicate skipped' } : item));
          } else if (res.book) {
            importedCount += 1;
            setImportItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'success', message: 'Successfully imported' } : item));
          }
        } catch (err) {
          console.error('Error importing standalone file:', err);
          errorCount += 1;
          setImportItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'error', message: err.message || 'Import failed' } : item));
        }
      }
    }

    setIsImporting(false);
    setImportStatus('');
    setImportSummary({ totalFiles, importedCount, skippedCount, listsCreated, errorCount });
    if (e.target) e.target.value = '';
  };

  const handleAddSelectedToList = async () => {
    if (!targetListId || selectedIds.length === 0) return;
    try {
      await addBooksToList(targetListId, selectedIds);
      ToastQueue.positive(t('Added to list'));
      clearSelection();
    } catch (err) {
      ToastQueue.negative(t(err.message || 'Could not add to list'));
    }
  };

  return (
    <div className={styles.libraryScreen}>
      {/* Duplicate Resolution Dialog */}
      {duplicate && (
        <Sheet
          title={t('Duplicate document')}
          onClose={() => chooseDuplicate('skip')}
          footer={
            <div className={styles.sheetActions}>
              <Button
                variant="secondary"
                onPress={() => chooseDuplicate('skip')}
              >
                {t('Skip')}
              </Button>
              <Button
                variant="secondary"
                onPress={() => chooseDuplicate('keep')}
              >
                {t('Keep both')}
              </Button>
              <Button
                variant="accent"
                onPress={() => chooseDuplicate('replace')}
              >
                {t('Replace')}
              </Button>
            </div>
          }
        >
          <p style={{ margin: '0 0 8px', fontWeight: 600 }}>{duplicate}</p>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{t('duplicatePrompt')}</p>
        </Sheet>
      )}

      {isImporting && !duplicate && (
        <div className={styles.importingOverlay} role="status" aria-live="polite">
          <p>{t(importStatus || 'Importing...')}</p>
          <small>{t('Documents are checked by content and processed offline')}</small>
        </div>
      )}

      {importSummary && (
        <Sheet
          title={t('Import Summary')}
          onClose={() => setImportSummary(null)}
          footer={
            <Button
              variant="accent"
              onPress={() => {
                setImportSummary(null);
                onGoLists?.();
              }}
            >
              {t('Lists')}
            </Button>
          }
        >
          <p style={{ marginBottom: 12 }}>{t('processedCount', { count: importSummary.totalFiles })}</p>
          <ul style={{ maxHeight: 200, overflowY: 'auto', paddingLeft: 20, margin: '0 0 12px' }} aria-label={t('Import results')}>
            {importItems.map(item => (
              <li key={item.id} data-import-status={item.status} style={{ fontSize: 13, marginBottom: 4 }}>
                <strong>{item.name}</strong> — {t(item.message)}
              </li>
            ))}
          </ul>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {t('newBooksCount', { count: importSummary.importedCount })} · {t('duplicatesCount', { count: importSummary.skippedCount })} · {t('errorsCount', { count: importSummary.errorCount })}
          </p>
        </Sheet>
      )}

      <div className={styles.innerLimiter}>
        {/* Adaptive Responsive Library Header */}
        <div className={styles.libraryHeaderArea}>
          <div className={styles.libraryTitleArea}>
            <h1 className={styles.libraryTitle}>{t('Library')}</h1>
          </div>

          <div className={styles.searchSection}>
            <SearchField
              aria-label={t('Search title, author, genre, lists')}
              placeholder={t('Search title, author, genre, lists')}
              value={searchQuery}
              onChange={(v) => {
                setSearchQuery(v);
                resetScroll();
              }}
              onClear={() => {
                setSearchQuery('');
                resetScroll();
              }}
            />
          </div>

          <div className={styles.headerActions}>
            <Button
              variant="accent"
              size="S"
              onPress={() => fileRef.current?.click()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>{t('Import documents')}</span>
            </Button>
            <EdgeAction edge="right" offset={16}>
              <ActionMenu
                isQuiet
                size="S"
                aria-label={t('Library options')}
                onAction={(key) => {
                  if (key === 'select') setSelecting(true);
                  else if (key === 'displayOptions') setShowDisplayOptions(true);
                }}
              >
                <MenuItem id="select">{t('Select books')}</MenuItem>
                <MenuItem id="displayOptions">{t('Display options')}</MenuItem>
              </ActionMenu>
            </EdgeAction>
            <input
              ref={fileRef}
              type="file"
              accept=".epub,.pdf,.docx,.txt,.md,.markdown,.html,.htm,.pptx,.cbz,.zip,.rar,.doc,.xls,.ppt"
              hidden
              multiple
              onChange={handleFileImport}
            />
          </div>
        </div>

        {/* Filter rail using S2 ToggleButtonGroup */}
        <div className={styles.filterRail} aria-label={t('Filters')}>
          <ToggleButtonGroup
            aria-label={t('Filters')}
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([filterBy])}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];
              if (selected) {
                setFilterBy(selected);
                resetScroll();
              }
            }}
            isEmphasized
            size="S"
          >
            {FILTERS.map((item) => (
              <ToggleButton key={item.id} id={item.id}>
                {t(item.label)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>

        {/* Tools row: Count on left, Sort button and Display Options button on right (Single row <= 44dp) */}
        <div className={styles.toolsRow}>
          <span className={styles.bookCount}>{t('booksCount', { count: books.length })}</span>
          <div className={styles.toolsRight}>
            <MenuTrigger>
              <Button
                variant="secondary"
                size="S"
                className={styles.compactSortBtn}
                aria-label={t('Sort books')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M6 12h12m-9 6h6" />
                </svg>
                <span className={styles.sortLabel}>{t(SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Recent')}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </Button>
              <Menu
                onAction={(key) => {
                  if (key) {
                    setSortBy(key);
                    resetScroll();
                  }
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} id={opt.value}>
                    {t(opt.label)}
                  </MenuItem>
                ))}
              </Menu>
            </MenuTrigger>

            <EdgeAction edge="right" offset={15}>
              <IconButton
                size="S"
                aria-label={t('Display options')}
                onPress={() => setShowDisplayOptions(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="21" x2="4" y2="14" />
                  <line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" />
                  <line x1="20" y1="12" x2="20" y2="3" />
                  <line x1="1" y1="14" x2="7" y2="14" />
                  <line x1="9" y1="8" x2="15" y2="8" />
                  <line x1="17" y1="16" x2="23" y2="16" />
                </svg>
              </IconButton>
            </EdgeAction>
          </div>
        </div>

        {/* Books Scroll Area */}
        <div
          ref={scrollRef}
          className={`${styles.scrollArea} screen-scroll`}
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        >
          {books.length === 0 ? (
            <EmptyState
              title={t('No books found')}
              description={t('Try another search, clear filters, or import a document.')}
              actionLabel={t('Clear')}
              onAction={() => {
                setSearchQuery('');
                setFilterBy('all');
              }}
            />
          ) : viewMode === 'grid' ? (
            <>
              {virtual.topSpacer > 0 && <div style={{ height: virtual.topSpacer }} />}
              <div className={styles.libraryGrid}>
                {virtual.visibleBooks.map((book) => (
                  <BookGridItem
                    key={book.id}
                    book={book}
                    selected={selectedSet.has(book.id)}
                    selecting={selecting}
                    onTap={handleBookTap}
                    onOpenInfo={onOpenBookInfo}
                    onQuickPreview={(b) => setQuickPreviewBook(b)}
                    onToggleSelect={toggleSelected}
                  />
                ))}
              </div>
              {virtual.bottomSpacer > 0 && <div style={{ height: virtual.bottomSpacer }} />}
            </>
          ) : (
            <ul className={styles.libraryList}>
              {virtual.topSpacer > 0 && <li style={{ height: virtual.topSpacer }} />}
              {virtual.visibleBooks.map((book) => (
                <BookListItem
                  key={book.id}
                  book={book}
                  selected={selectedSet.has(book.id)}
                  selecting={selecting}
                  pct={Math.round(progressFor(book))}
                  onTap={onOpenBook}
                  onToggleSelected={toggleSelected}
                  onOpenInfo={onOpenBookInfo}
                />
              ))}
              {virtual.bottomSpacer > 0 && <li style={{ height: virtual.bottomSpacer }} />}
            </ul>
          )}
        </div>

        {/* Selection Toolbar using S2 Picker and Button */}
        {selecting && selectedIds.length > 0 && (
          <div className={styles.selectionToolbar}>
            <span className={styles.selectionCount}>
              {t('selectedCount', { count: selectedIds.length })}
            </span>
            <div className={styles.selectionControls}>
              <Picker
                aria-label={t('Choose list')}
                selectedKey={targetListId}
                onSelectionChange={(key) => setTargetListId(key || '')}
                size="S"
                placeholder={t('Choose list')}
              >
                {lists.map((l) => (
                  <PickerItem key={l.id} id={l.id}>
                    {l.name}
                  </PickerItem>
                ))}
              </Picker>
              <Button
                variant="accent"
                size="S"
                isDisabled={!targetListId}
                onPress={handleAddSelectedToList}
              >
                {t('Add')}
              </Button>
            </div>
          </div>
        )}

        {/* Display Options Sheet (View Mode, Cover Size, Select Books) */}
        {showDisplayOptions && (
          <Sheet
            title={t('Display options')}
            onClose={() => setShowDisplayOptions(false)}
            footer={
              <Button
                variant="accent"
                size="M"
                onPress={() => setShowDisplayOptions(false)}
              >
                {t('Done')}
              </Button>
            }
          >
            <div className={styles.displayOptionsContent}>
              <div className={styles.displayOptionGroup}>
                <span className={styles.displayOptionLabel}>{t('View mode')}</span>
                <ToggleButtonGroup
                  aria-label={t('View mode')}
                  selectionMode="single"
                  disallowEmptySelection
                  selectedKeys={new Set([viewMode])}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0];
                    if (selected) {
                      setViewMode(selected);
                      resetScroll();
                    }
                  }}
                  size="S"
                >
                  <ToggleButton id="grid">{t('Grid')}</ToggleButton>
                  <ToggleButton id="list">{t('List')}</ToggleButton>
                </ToggleButtonGroup>
              </div>

              <div className={styles.displayOptionGroup}>
                <span className={styles.displayOptionLabel}>{t('Cover size')}</span>
                <ToggleButtonGroup
                  aria-label={t('Cover size')}
                  selectionMode="single"
                  disallowEmptySelection
                  selectedKeys={new Set([coverSize])}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0];
                    if (selected) setCoverSize(selected);
                  }}
                  size="S"
                >
                  <ToggleButton id="small">{t('Small')}</ToggleButton>
                  <ToggleButton id="medium">{t('Medium')}</ToggleButton>
                  <ToggleButton id="large">{t('Large')}</ToggleButton>
                </ToggleButtonGroup>
              </div>

              <div className={styles.displayOptionGroup}>
                <Button
                  variant={selecting ? 'accent' : 'secondary'}
                  size="M"
                  onPress={() => {
                    setShowDisplayOptions(false);
                    if (selecting) {
                      clearSelection();
                    } else {
                      setSelecting(true);
                    }
                  }}
                >
                  {selecting ? t('Done selecting') : t('Select books')}
                </Button>
              </div>
            </div>
          </Sheet>
        )}

        {/* Long Press Quick Preview Modal */}
        <BookQuickPreviewModal
          book={quickPreviewBook}
          isOpen={Boolean(quickPreviewBook)}
          onClose={() => setQuickPreviewBook(null)}
          onOpenBook={onOpenBook}
          onOpenBookInfo={onOpenBookInfo}
          onToggleFavorite={async (book) => {
            await library.updateBook(book.id, { isFavorite: !book.isFavorite });
            setQuickPreviewBook(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
          }}
          onAddToList={(book) => {
            setSelectedIds([book.id]);
            setSelecting(true);
          }}
        />
      </div>
    </div>
  );
}
