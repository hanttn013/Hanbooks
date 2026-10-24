import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import BookCover from './BookCover';
import Sheet from '../UI/Sheet';
import { Action, Field, Choice } from '../UI/Controls';
import { ToastQueue } from '@react-spectrum/s2/Toast';
import { useConfirm } from '../UI/feedbackContext';
import { useI18n } from '../../i18n/context';
import { StorageManager } from '../../utils/StorageManager';
import { looksLikeTocText } from '../../utils/epubMetadata';
import { extractDocumentMetadata } from '../../utils/documentMetadata';
import { readProgressPercent } from '../../utils/storageKeys';

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
  const [displayOverrides, setDisplayOverrides] = useState({});
  const mountedRef = useRef(true);
  const repairMetadata = library?.repairMetadata;
  const shouldRefreshMetadata = needsMetadataRefresh(book);
  const isAutoRefreshingMeta = book.metadataStatus === 'pending' || book.metadataStatus === 'processing';
  const isRefreshingMeta = isManualRefreshingMeta || isAutoRefreshingMeta;
  const displayBook = { ...book, ...displayOverrides };
  const pct = progressFor(displayBook);
  const infoBookmark = bookmarks.find(item => item.cfi === '' && item.chapterTitle === 'Book info');
  const isBusy = isDeleting || isRefreshingMeta || isBookmarking || isAddingToList || isRenaming || isFavoriting;

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

    // Auto trigger lazy repair
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

  const handleQuickBookmark = async () => {
    if (infoBookmark || isBookmarking || isBusy) return;
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
    } finally {
      if (mountedRef.current) setIsAddingToList(false);
    }
  };

  return <Sheet title="Book Info" onClose={onClose} busy={isDeleting || isRenaming} historyManaged>
    <div className="hero-reading" style={{ padding: 0, border: 0 }}>
      <BookCover book={book} size="hero" />
      <div style={{ minWidth: 0 }}>
        <h2>{displayBook.title}</h2><p>{displayBook.author}</p>
        <p>{String(book.format || 'epub').toUpperCase()} · {t('completePercent', { count: Math.round(pct) })}</p>
        {isRefreshingMeta && <p role="status">{t('Loading...')}</p>}
        <div className="action-row"><Action primary onPress={() => onOpen(book)} disabled={isDeleting}>{t(pct > 0 ? 'Continue' : 'Read')}</Action><Action onPress={handleFavorite} disabled={isBusy}>{t(displayBook.isFavorite ? 'Unfavorite' : 'Favorite')}</Action></div>
      </div>
    </div>
    <section><h3>{t('Synopsis')}</h3><p>{!looksLikeTocText(displayBook.description) && displayBook.description ? displayBook.description : t('No synopsis available.')}</p>
      {book.metadataStatus === 'failed' && <p role="alert">{book.metadataError}</p>}
      {shouldRefreshMetadata && <Action onPress={handleRefreshMetadata} disabled={isBusy}>{t(isRefreshingMeta ? 'Repairing...' : 'Repair Info')}</Action>}
    </section>
    <dl className="field-grid">
      {[[t('Publisher'), displayBook.publisher], [t('Language'), displayBook.language], [t('Published'), displayBook.publishedAt], [t('Chapters'), displayBook.chapterCount], [t('File'), formatFileSize(book.fileSize)], [t('Bookmarks'), bookmarks.length], [t('Original'), displayBook.originalTitle], [t('Characters'), displayBook.characters], [t('Editor'), displayBook.editor], [t('Beta'), displayBook.beta]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? t('Unknown')}</dd></div>)}
    </dl>
    <div className="field-grid"><Choice label="Choose list" value={listId} onChange={setListId} options={[{ id: '', label: 'Choose list' }, ...(library?.lists || []).map(list => ({ id: list.id, label: list.name, raw: true }))]} /><div style={{ alignSelf: 'end' }}><Action onPress={handleAddToList} disabled={!listId || isBusy}>{t('Add')}</Action></div></div>
    {renaming && <div className="field-grid"><Field label="Title" value={title} onChange={setTitle} /><Field label="Author" value={author} onChange={setAuthor} /><Action onPress={handleRename} disabled={isBusy}>{t(isRenaming ? 'Saving...' : 'Save')}</Action></div>}
    <div className="action-row">
      <Action onPress={handleQuickBookmark} disabled={Boolean(infoBookmark) || isBusy}>{t(isBookmarking ? 'Saving...' : infoBookmark ? 'Bookmarked' : 'Bookmark')}</Action>
      <Action onPress={() => { if (!renaming) { setTitle(displayBook.title); setAuthor(displayBook.author); } setRenaming(!renaming); }} disabled={isBusy}>{t('Rename')}</Action>
      <Action negative onPress={handleDelete} disabled={isBusy}>{t(isDeleting ? 'Deleting...' : 'Delete')}</Action>
    </div>
  </Sheet>;
}
