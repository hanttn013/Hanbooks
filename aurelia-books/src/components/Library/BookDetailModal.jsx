import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Cover from '../Common/Cover';
import Sheet from '../Common/Sheet';
import { ToastQueue } from '@react-spectrum/s2/Toast';
import Button from '../Common/Button';
import IconButton from '../Common/IconButton';
import TextAction from '../Common/TextAction';
import EdgeAction from '../Common/EdgeAction';
import { Tabs, TabList, Tab, TabPanel } from '@react-spectrum/s2/Tabs';
import { Picker, PickerItem } from '@react-spectrum/s2/Picker';
import { TextField } from '@react-spectrum/s2/TextField';
import { useConfirm } from '../UI/feedbackContext';
import { useI18n } from '../../i18n/context';
import { StorageManager } from '../../utils/StorageManager';
import { looksLikeTocText } from '../../utils/epubMetadata';
import { extractDocumentMetadata } from '../../utils/documentMetadata';
import { readProgressPercent } from '../../utils/storageKeys';
import { cleanSynopsis } from '../../utils/cleanSynopsis';
import styles from './BookDetailModal.module.css';

const SYNOPSIS_TRUNCATE_LIMIT = 280;

function progressFor(book) {
  return readProgressPercent(book);
}

function formatFileSize(size) {
  if (!size) return 'Unknown size';
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function needsMetadataRefresh(book) {
  return Boolean(book.fileBlob) && (
    book.metadataStatus === 'pending'
    || !book.metadataExtractedAt
    || looksLikeTocText(book.description)
    || !book.description
    || !book.author
    || book.author === 'Unknown Author'
    || !book.chapterCount
  );
}

export default function BookDetailModal({ book, onClose, onOpen, library }) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState('synopsis');
  const [bookmarks, setBookmarks] = useState([]);
  const [listId, setListId] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isManualRefreshingMeta, setIsManualRefreshingMeta] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isAddingToList, setIsAddingToList] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  const [displayOverrides, setDisplayOverrides] = useState({});
  const mountedRef = useRef(true);

  const repairMetadata = library?.repairMetadata;
  const shouldRefreshMetadata = needsMetadataRefresh(book);
  const isAutoRefreshingMeta = book.metadataStatus === 'pending' || book.metadataStatus === 'processing';
  const isRefreshingMeta = isManualRefreshingMeta || isAutoRefreshingMeta;
  const displayBook = { ...book, ...displayOverrides };
  const pct = progressFor(displayBook);
  const isFinished = displayBook.status === 'finished' || pct >= 98;
  const isBusy = isDeleting || isRefreshingMeta || isBookmarking || isAddingToList || isRenaming || isFavoriting;

  const rawDescription = displayOverrides.description ?? book.description;
  const sanitizedSynopsis = (!rawDescription || looksLikeTocText(rawDescription))
    ? ''
    : cleanSynopsis(rawDescription);

  const handleReread = async () => {
    if (isBusy) return;
    try {
      await library?.resetBookProgress?.(book.id);
      const resetBook = {
        ...displayBook,
        status: 'reading',
        progress: 0,
        progressPercent: 0,
        cfi: undefined,
        locator: undefined,
      };
      if (mountedRef.current) {
        setDisplayOverrides(prev => ({
          ...prev,
          status: 'reading',
          progress: 0,
          progressPercent: 0,
        }));
      }
      onOpen(resetBook);
    } catch (err) {
      ToastQueue.negative(t(err.message || 'Could not reset reading progress.'));
    }
  };

  useEffect(() => {
    let active = true;
    StorageManager.getBookmarks(book.id)
      .then(items => {
        if (active && mountedRef.current) setBookmarks(items);
      })
      .catch(() => {
        if (active && mountedRef.current) setBookmarks([]);
      });
    return () => {
      active = false;
    };
  }, [book.id]);

  useEffect(() => {
    mountedRef.current = true;
    if (isAutoRefreshingMeta && repairMetadata) {
      Promise.resolve(repairMetadata(book.id)).catch(err => {
        console.warn('Could not auto-repair EPUB metadata:', err);
      });
    }
    return () => {
      mountedRef.current = false;
    };
  }, [book.id, isAutoRefreshingMeta, repairMetadata]);

  const handleRefreshMetadata = async () => {
    if (!book.fileBlob || isRefreshingMeta) return;
    setIsManualRefreshingMeta(true);
    try {
      if (repairMetadata) {
        await repairMetadata(book.id, { force: true });
        return;
      }
      await new Promise(resolve => window.setTimeout(resolve, 50));
      const metadata = await extractDocumentMetadata(book.fileBlob, book.format || 'epub', {
        title: book.title,
        author: book.author,
        genre: book.genre,
        description: book.description,
        characters: book.characters,
        originalTitle: book.originalTitle,
        editor: book.editor,
        beta: book.beta,
        chapterCount: book.chapterCount,
        estimatedPages: book.estimatedPages,
        fileSize: book.fileSize,
      });
      if (!mountedRef.current) return;
      setDisplayOverrides(prev => ({ ...prev, ...metadata }));
      await library?.updateBook?.(book.id, {
        ...metadata,
        metadataStatus: 'ready',
        metadataPending: false,
        metadataAttempts: 0,
        metadataNextRetryAt: null,
        metadataError: null,
      });
    } catch (err) {
      console.warn('Could not refresh EPUB metadata:', err);
      if (mountedRef.current) ToastQueue.negative(t('Could not repair this EPUB metadata.'));
    } finally {
      if (mountedRef.current) setIsManualRefreshingMeta(false);
    }
  };

  const handleFavorite = async () => {
    if (isFavoriting || isBusy) return;
    setIsFavoriting(true);
    const next = !displayBook.isFavorite;
    try {
      await library?.updateBook?.(book.id, { isFavorite: next });
      if (!mountedRef.current) return;
      setDisplayOverrides(prev => ({ ...prev, isFavorite: next }));
    } finally {
      if (mountedRef.current) setIsFavoriting(false);
    }
  };

  const handleQuickBookmark = async () => {
    if (isBookmarking || isBusy) return;
    setIsBookmarking(true);
    const bookmark = {
      id: uuidv4(),
      bookId: book.id,
      cfi: '',
      chapterTitle: 'Book info',
      excerpt: book.description || `${book.title} by ${book.author}`,
      createdAt: Date.now(),
    };
    try {
      await StorageManager.addBookmark(bookmark);
      if (!mountedRef.current) return;
      setBookmarks(prev => [...prev, bookmark]);
      library?.refreshLibrary?.();
    } finally {
      if (mountedRef.current) setIsBookmarking(false);
    }
  };

  const handleRename = async () => {
    const cleanTitle = title.trim();
    const cleanAuthor = author.trim();
    if (!cleanTitle || !cleanAuthor || isRenaming || isBusy) return;
    setIsRenaming(true);
    try {
      await library?.updateBook?.(book.id, { title: cleanTitle, author: cleanAuthor });
      if (!mountedRef.current) return;
      setDisplayOverrides(prev => ({ ...prev, title: cleanTitle, author: cleanAuthor }));
      setRenaming(false);
    } finally {
      if (mountedRef.current) setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (isBusy || !await confirm(`${t('deleteBookConfirm')} ${book.title}`)) return;
    setIsDeleting(true);
    try {
      await library?.deleteBook?.(book.id);
      onClose();
    } catch (err) {
      ToastQueue.negative(t(err.message || 'Could not delete this book.'));
      setIsDeleting(false);
    }
  };

  const handleAddToList = async () => {
    if (!listId || isAddingToList || isBusy) return;
    setIsAddingToList(true);
    try {
      await library?.addBooksToList?.(listId, [book.id]);
      if (!mountedRef.current) return;
      setListId('');
      ToastQueue.positive(t('Added to list'));
    } finally {
      if (mountedRef.current) setIsAddingToList(false);
    }
  };

  return (
    <Sheet
      title={t('Book Detail')}
      onClose={onClose}
      fullHeight={true}
      hideDefaultHeader={true}
    >
      <div className={styles.container}>
        {/* Top bar controls */}
        <div className={styles.topBar}>
          <EdgeAction edge="left" offset={18.5}>
            <IconButton
              onPress={onClose}
              aria-label={t('Close')}
              size="M"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </IconButton>
          </EdgeAction>

          <span className={styles.modalTitle}>{t('Book Detail')}</span>

          <EdgeAction edge="right" offset={16}>
            <IconButton
              onPress={handleFavorite}
              aria-label={displayBook.isFavorite ? t('Unfavorite') : t('Favorite')}
              size="M"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={displayBook.isFavorite ? 'var(--accent)' : 'none'}
                stroke={displayBook.isFavorite ? 'var(--accent)' : 'currentColor'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </IconButton>
          </EdgeAction>
        </div>

        {/* Hero Book Cover */}
        <div className={styles.heroCoverWrapper}>
          <div className={styles.coverContainer}>
            <Cover
              src={displayBook.coverUrl || displayBook.coverImage}
              title={displayBook.title}
              author={displayBook.author}
              format={displayBook.format}
              size="medium"
            />
          </div>
          <h2 className={styles.bookTitle}>{displayBook.title}</h2>
          <p className={styles.bookAuthor}>{displayBook.author || t('Unknown author')}</p>
        </div>

        {/* 4-column Stats Box */}
        <div className={styles.statsBox}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>{t('Format')}</span>
            <span className={styles.statValue}>{String(displayBook.format || 'epub').toUpperCase()}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>{t('Chapters')}</span>
            <span className={styles.statValue}>{displayBook.chapterCount || '—'}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>{t('Bookmarks')}</span>
            <span className={styles.statValue}>{bookmarks.length}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>{t('Progress')}</span>
            <span className={`${styles.statValue} ${styles.statValueAccent}`}>
              {Math.round(pct)}%
            </span>
          </div>
        </div>

        {/* Adobe Spectrum Tabs */}
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(String(key))}
          aria-label={t('Book details')}
          density="compact"
        >
          <TabList aria-label={t('Book details')}>
            <Tab id="synopsis">{t('Synopsis')}</Tab>
            <Tab id="details">{t('Details')}</Tab>
            <Tab id="manage">{t('Manage')}</Tab>
          </TabList>

          <TabPanel id="synopsis" className={styles.tabPanel}>
            {sanitizedSynopsis ? (
              <div>
                <p className={styles.synopsisText}>
                  {sanitizedSynopsis.length > SYNOPSIS_TRUNCATE_LIMIT && !isSynopsisExpanded
                    ? `${sanitizedSynopsis.slice(0, SYNOPSIS_TRUNCATE_LIMIT)}…`
                    : sanitizedSynopsis}
                </p>
                {sanitizedSynopsis.length > SYNOPSIS_TRUNCATE_LIMIT && (
                  <TextAction
                    size="S"
                    onPress={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
                    style={{ marginTop: 8 }}
                  >
                    {t(isSynopsisExpanded ? 'Show less' : 'Show more')}
                  </TextAction>
                )}
              </div>
            ) : (
              <div>
                <p className={styles.synopsisEmpty}>{t('No synopsis available.')}</p>
                <div style={{ marginTop: 12 }}>
                  <Button
                    variant="secondary"
                    size="S"
                    onPress={handleRefreshMetadata}
                    isDisabled={isBusy}
                  >
                    {t(isRefreshingMeta ? 'Repairing...' : 'Repair Info')}
                  </Button>
                </div>
              </div>
            )}

            {displayBook.metadataStatus === 'failed' && (
              <p role="alert" style={{ color: 'var(--danger)', fontSize: 13, marginTop: 8 }}>
                {displayBook.metadataError}
              </p>
            )}
          </TabPanel>

          <TabPanel id="details" className={styles.tabPanel}>
            <ul className={styles.detailsList}>
              <li className={styles.detailItem}>
                <span className={styles.detailLabel}>{t('Publisher')}</span>
                <span className={styles.detailVal}>{displayBook.publisher || t('Unknown')}</span>
              </li>
              <li className={styles.detailItem}>
                <span className={styles.detailLabel}>{t('Language')}</span>
                <span className={styles.detailVal}>{displayBook.language || t('Unknown')}</span>
              </li>
              <li className={styles.detailItem}>
                <span className={styles.detailLabel}>{t('File')}</span>
                <span className={styles.detailVal}>{formatFileSize(displayBook.fileSize)}</span>
              </li>
              <li className={styles.detailItem}>
                <span className={styles.detailLabel}>{t('Published')}</span>
                <span className={styles.detailVal}>{displayBook.publishedAt || t('Unknown')}</span>
              </li>
              {displayBook.originalTitle && (
                <li className={styles.detailItem}>
                  <span className={styles.detailLabel}>{t('Original')}</span>
                  <span className={styles.detailVal}>{displayBook.originalTitle}</span>
                </li>
              )}
              {displayBook.editor && (
                <li className={styles.detailItem}>
                  <span className={styles.detailLabel}>{t('Editor')}</span>
                  <span className={styles.detailVal}>{displayBook.editor}</span>
                </li>
              )}
            </ul>
          </TabPanel>

          <TabPanel id="manage" className={styles.tabPanel}>
            <div className={styles.manageGroup}>
              {/* Add to list */}
              <div className={styles.manageRow}>
                <div style={{ flex: 1 }}>
                  <Picker
                    aria-label={t('Choose list')}
                    placeholder={t('Choose list')}
                    selectedKey={listId || null}
                    onSelectionChange={(key) => setListId(String(key || ''))}
                    size="M"
                  >
                    {(library?.lists || []).map((l) => (
                      <PickerItem key={l.id} id={l.id}>
                        {l.name}
                      </PickerItem>
                    ))}
                  </Picker>
                </div>
                <Button
                  variant="primary"
                  size="M"
                  onPress={handleAddToList}
                  isDisabled={!listId || isBusy}
                >
                  {t('Add')}
                </Button>
              </div>

              {/* Rename */}
              {renaming ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <TextField
                    aria-label={t('Title')}
                    value={title}
                    onChange={setTitle}
                  />
                  <TextField
                    aria-label={t('Author')}
                    value={author}
                    onChange={setAuthor}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      variant="primary"
                      size="M"
                      onPress={handleRename}
                      isDisabled={isBusy}
                    >
                      {t('Save')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="M"
                      onPress={() => setRenaming(false)}
                    >
                      {t('Cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  size="M"
                  onPress={() => {
                    setTitle(displayBook.title);
                    setAuthor(displayBook.author);
                    setRenaming(true);
                  }}
                  isDisabled={isBusy}
                >
                  {t('Rename')}
                </Button>
              )}

              {/* Quick Bookmark */}
              <Button
                variant="secondary"
                size="M"
                onPress={handleQuickBookmark}
                isDisabled={isBusy}
              >
                {t('Bookmark')}
              </Button>

              {/* Reset progress */}
              {(pct > 0 || isFinished) && (
                <Button
                  variant="secondary"
                  size="M"
                  onPress={async () => {
                    const confirmed = await confirm(t('Reset reading progress for this book?'));
                    if (!confirmed) return;
                    await library?.resetBookProgress?.(book.id);
                    if (mountedRef.current) {
                      setDisplayOverrides(prev => ({
                        ...prev,
                        status: 'reading',
                        progress: 0,
                        progressPercent: 0,
                      }));
                    }
                    ToastQueue.positive(t('Progress reset'));
                  }}
                  isDisabled={isBusy}
                >
                  {t('Reset progress')}
                </Button>
              )}

              {/* Delete book */}
              <Button
                variant="negative"
                size="M"
                onPress={handleDelete}
                isDisabled={isBusy}
              >
                {t(isDeleting ? 'Deleting...' : 'Delete')}
              </Button>
            </div>
          </TabPanel>
        </Tabs>

        {/* Bottom Full-width Sticky Read Bar */}
        <div className={styles.bottomActionWrapper}>
          <Button
            variant="accent"
            size="L"
            styles={{ width: '100%' }}
            onPress={isFinished ? handleReread : () => onOpen(displayBook)}
            isDisabled={isDeleting}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            <span>{isFinished ? t('Re-read') : t(pct > 0 ? 'Continue' : 'Read')}</span>
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
