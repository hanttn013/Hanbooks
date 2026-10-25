// src/hooks/useLibrary.js
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DEMO_BOOKS } from '../data/demoBooks';
import { StorageManager } from '../utils/StorageManager';
import { normalizeBookMetadata } from '../utils/epubMetadata';
import { extractDocumentMetadata } from '../utils/documentMetadata';
import { analyzeImportFile } from '../utils/importWorkerClient';
import { getLibraryStats } from '../utils/libraryStats';
import { includesSearchText } from '../utils/searchText';
import { migrateLegacyLocalStorage, progressStorageKey, readProgressPercent, STORAGE_KEYS } from '../utils/storageKeys';

const METADATA_MAX_ATTEMPTS = 3;
const METADATA_CONCURRENCY = 2;
const METADATA_RETRY_DELAYS = [1000, 5000, 15000];

const DEFAULT_LISTS = [
  {
    id: 'reading-now',
    name: 'Đang đọc',
    description: 'Các tác phẩm đang theo dõi.',
    coverStyle: 'gold',
    sortBy: 'lastOpenedAt',
    bookIds: ['demo-1'],
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'want-to-read',
    name: 'Muốn đọc',
    description: 'Dành cho những buổi tối tĩnh lặng.',
    coverStyle: 'cream',
    sortBy: 'addedAt',
    bookIds: ['demo-2'],
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 7,
  },
  {
    id: 'romance',
    name: 'Văn học & Tình cảm',
    description: 'Những câu chuyện lắng đọng, sâu sắc.',
    coverStyle: 'burgundy',
    sortBy: 'title',
    bookIds: ['demo-1', 'demo-3'],
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 6,
  },
];

function normalizeIdentity(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function normalizeListName(value) {
  return String(value || '').normalize('NFC').trim().toLowerCase();
}

function buildDuplicateKeys(file, metadata = {}, analysis = {}) {
  const title = normalizeIdentity(metadata.title || file?.name?.replace(/\.[^.]+$/i, ''));
  const author = normalizeIdentity(metadata.author || '');
  const format = metadata.format || analysis.detection?.format || 'epub';
  const size = metadata.fileSize || file?.size || 0;
  return {
    titleAuthorKey: [format, title, author].filter(Boolean).join('|'),
    fileKey: [size, analysis.hash].filter(Boolean).join('|'),
  };
}

function basicMetadataFromFile(file, format = 'epub') {
  const rawName = String(file?.name || 'Untitled Book').replace(/\.[^.]+$/i, '').trim();
  const [titlePart, ...authorParts] = rawName.split(/\s+-\s+/);
  const author = authorParts.join(' - ').trim();
  let colorSeed = 0;
  for (const character of rawName) colorSeed = ((colorSeed * 31) + character.codePointAt(0)) >>> 0;
  const hue = colorSeed % 360;
  return {
    title: titlePart?.trim() || rawName || 'Untitled Book',
    author: author || 'Unknown Author',
    genre: format === 'epub' ? 'Fiction' : 'Document',
    format,
    description: '',
    publisher: '',
    language: '',
    publishedAt: '',
    fileSize: file?.size || 0,
    chapterCount: 0,
    estimatedPages: Math.max(1, Math.round((file?.size || 0) / 7000)),
    coverColor: `hsl(${hue} 36% 32%)`,
    coverAccent: `hsl(${(hue + 42) % 360} 48% 65%)`,
    coverUrl: null,
    metadataPending: true,
    metadataStatus: 'pending',
    metadataExtractedAt: null,
  };
}

export function useLibrary() {
  migrateLegacyLocalStorage();
  const [books, setBooks] = useState([]);
  const [sortBy, setSortBy] = useState(() => localStorage.getItem(STORAGE_KEYS.sort) || 'lastOpenedAt');
  const [filterBy, setFilterBy] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [lists, setLists] = useState([]);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [bookmarkedBookIds, setBookmarkedBookIds] = useState(() => new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isMetadataQueuePaused, setIsMetadataQueuePaused] = useState(() => localStorage.getItem(STORAGE_KEYS.metadataPaused) === '1');
  const [metadataProcessingCount, setMetadataProcessingCount] = useState(0);
  const [metadataQueueTick, setMetadataQueueTick] = useState(0);
  const autoBackupTimerRef = useRef(null);
  const booksRef = useRef([]);
  const metadataActiveIdsRef = useRef(new Set());
  const importQueueRef = useRef(Promise.resolve());

  const queueAutoBackup = useCallback((reason = 'library-change') => {
    window.clearTimeout(autoBackupTimerRef.current);
    autoBackupTimerRef.current = window.setTimeout(() => {
      const run = () => {
        StorageManager.createAutoBackup(reason).catch(err => {
          console.warn('Auto backup failed:', err);
        });
      };
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(run, { timeout: 8000 });
      } else {
        window.setTimeout(run, 1200);
      }
    }, 1200);
  }, []);

  // Load books from IndexedDB
  const refreshLibrary = useCallback(async () => {
    setIsLoading(true);
    try {
      let list = await StorageManager.getAllBooks();
      // Purge any legacy demo books if previously seeded
      if (list.some(b => b.isDemo || (typeof b.id === 'string' && b.id.startsWith('demo-')))) {
        const remaining = [];
        for (const b of list) {
          if (b.isDemo || (typeof b.id === 'string' && b.id.startsWith('demo-'))) {
            try {
              await StorageManager.deleteBook(b.id);
            } catch (err) {
              void err;
            }
          } else {
            remaining.push(b);
          }
        }
        list = remaining;
      }
      localStorage.setItem(STORAGE_KEYS.seededDemo, '1');

      const interrupted = [];
      const normalized = list.map(book => {
        const demoFallback = DEMO_BOOKS.find(item => item.id === book.id);
        const normalizedBook = {
          ...normalizeBookMetadata({ ...demoFallback, ...book }),
          ...book,
          genre: book.genre || demoFallback?.genre || 'Fiction',
          description: book.description || demoFallback?.description || '',
          characters: book.characters || demoFallback?.characters || '',
          originalTitle: book.originalTitle || demoFallback?.originalTitle || '',
          editor: book.editor || demoFallback?.editor || '',
          beta: book.beta || demoFallback?.beta || '',
          chapterCount: book.chapterCount || demoFallback?.chapterCount || 0,
          estimatedPages: book.estimatedPages || demoFallback?.estimatedPages || 0,
          format: book.format || 'epub',
        };
        if (['processing', 'running'].includes(normalizedBook.metadataStatus)) {
          normalizedBook.metadataStatus = 'pending';
          normalizedBook.metadataPending = true;
          normalizedBook.metadataError = 'Metadata extraction was interrupted and will resume.';
          interrupted.push(normalizedBook);
        }
        return normalizedBook;
      });
      await Promise.all(interrupted.map(book => StorageManager.saveBook(book)));
      setBooks(normalized);
      booksRef.current = normalized;

      let storedLists = (await StorageManager.getAllLists?.()) || [];
      if (storedLists.length === 0 && typeof StorageManager.saveList === 'function') {
        for (const item of DEFAULT_LISTS) {
          await StorageManager.saveList(item);
        }
        localStorage.setItem(STORAGE_KEYS.seededDefaultLists, '1');
        storedLists = (await StorageManager.getAllLists?.()) || [];
      }
      setLists(storedLists);

      const allBookmarks = await StorageManager.getAllBookmarks();
      setBookmarkCount(allBookmarks.length);
      setBookmarkedBookIds(new Set(allBookmarks.map(bookmark => bookmark.bookId).filter(Boolean)));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    booksRef.current = books;
  }, [books]);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshLibrary();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshLibrary]);

  useEffect(() => {
    return () => window.clearTimeout(autoBackupTimerRef.current);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.sort, sortBy);
  }, [sortBy]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.metadataPaused, isMetadataQueuePaused ? '1' : '0');
  }, [isMetadataQueuePaused]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const addBook = useCallback((file, metadata, options = {}) => {
    const importTask = importQueueRef.current.then(async () => {
      if (!file || file.size === 0) throw new Error('Cannot import an empty file.');
      const analysis = options.analysis || await analyzeImportFile(file);
      const detection = analysis.detection;
      if (!detection?.supported || detection.format === 'zip' || detection.format === 'rar') {
        throw new Error(detection?.message || `Unsupported document format: ${detection?.format || 'unknown'}.`);
      }
      const format = options.format || detection.format;
      const bookMetadata = metadata
        || (options.fastMetadata
          ? basicMetadataFromFile(file, format)
          : await extractDocumentMetadata(file, format, { fileName: file.name }));
      const duplicateKeys = buildDuplicateKeys(file, bookMetadata, analysis);
      const duplicate = booksRef.current.find(item => {
        const storedTitleAuthor = item.titleAuthorKey
          || [item.format || 'epub', normalizeIdentity(item.title), normalizeIdentity(item.author)].filter(Boolean).join('|');
        const storedFile = item.fileKey || '';
        return Boolean(duplicateKeys.titleAuthorKey && storedTitleAuthor === duplicateKeys.titleAuthorKey)
          || Boolean(duplicateKeys.fileKey && storedFile === duplicateKeys.fileKey);
      });
      let duplicateStrategy = options.duplicateStrategy || (typeof options.onDuplicate === 'function' ? 'ask' : 'skip');
      if (duplicate) {
        if (typeof options.onDuplicate === 'function') {
          duplicateStrategy = await options.onDuplicate(duplicate);
        }
        if (!duplicateStrategy || duplicateStrategy === 'skip' || duplicateStrategy === 'cancel' || duplicateStrategy === 'close') {
          return { ...duplicate, skippedDuplicate: true, duplicateOf: duplicate.id, analysis };
        }
      }

      const isPendingMetadata = options.fastMetadata || bookMetadata.metadataStatus === 'pending';
      const book = {
      id: duplicate && duplicateStrategy === 'replace' ? duplicate.id : uuidv4(),
      title: bookMetadata.title || file.name.replace(/\.[^.]+$/i, ''),
      author: bookMetadata.author || 'Unknown Author',
      format,
      locatorVersion: 1,
      fileName: file.name,
      isDemo: false,
      coverColor: bookMetadata.coverColor || '#2D4A6E',
      coverAccent: bookMetadata.coverAccent || '#C4A35A',
      coverUrl: bookMetadata.coverUrl || null,
      fileBlob: file,
      status: duplicate && duplicateStrategy === 'replace' ? duplicate.status : 'unread',
      isFavorite: duplicate && duplicateStrategy === 'replace' ? duplicate.isFavorite : false,
      addedAt: duplicate && duplicateStrategy === 'replace' ? duplicate.addedAt : Date.now(),
      lastOpenedAt: duplicate && duplicateStrategy === 'replace' ? duplicate.lastOpenedAt : null,
      totalLocations: 0,
      genre: bookMetadata.genre || 'Fiction',
      description: bookMetadata.description || '',
      characters: bookMetadata.characters || '',
      originalTitle: bookMetadata.originalTitle || '',
      editor: bookMetadata.editor || '',
      beta: bookMetadata.beta || '',
      publisher: bookMetadata.publisher || '',
      language: bookMetadata.language || '',
      publishedAt: bookMetadata.publishedAt || '',
      fileSize: bookMetadata.fileSize || file.size || 0,
      chapterCount: bookMetadata.chapterCount || 0,
      estimatedPages: bookMetadata.estimatedPages || 0,
      metadataPending: isPendingMetadata,
      metadataStatus: isPendingMetadata ? 'pending' : (bookMetadata.metadataStatus || 'ready'),
      metadataAttempts: 0,
      metadataNextRetryAt: null,
      metadataError: null,
      metadataExtractedAt: isPendingMetadata ? null : (bookMetadata.metadataExtractedAt || Date.now()),
      titleAuthorKey: duplicateKeys.titleAuthorKey,
      fileKey: duplicateKeys.fileKey,
      contentHash: analysis.hash,
      hashStrategy: analysis.strategy,
      sourcePath: file.archivePath || file.webkitRelativePath || file.name || '',
      };
      await StorageManager.saveBook(book);
      booksRef.current = duplicate && duplicateStrategy === 'replace'
        ? booksRef.current.map(item => item.id === duplicate.id ? book : item)
        : [book, ...booksRef.current];
      setBooks([...booksRef.current]);
      queueAutoBackup('book-imported');
      return book;
    });
    importQueueRef.current = importTask.catch(() => undefined);
    return importTask;
  }, [queueAutoBackup]);

  const deleteBook = useCallback(async (id) => {
    await StorageManager.deleteBook(id);
    booksRef.current = booksRef.current.filter(book => book.id !== id);
    setBooks([...booksRef.current]);
    setLists(prev => prev.map(list => ({
      ...list,
      bookIds: list.bookIds.filter(bookId => bookId !== id),
    })));
    setBookmarkedBookIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    queueAutoBackup('book-deleted');
  }, [queueAutoBackup]);

  const updateBook = useCallback(async (id, updates) => {
    const current = booksRef.current.find(book => book.id === id);
    if (!current) return null;
    const updated = await StorageManager.updateExistingBook(id, updates);
    if (!updated) return null;
    booksRef.current = booksRef.current.map(book => book.id === id ? updated : book);
    setBooks([...booksRef.current]);
    const keys = Object.keys(updates);
    const isReadingPulse = keys.length > 0 && keys.every(key => ['lastOpenedAt', 'status'].includes(key));
    if (!isReadingPulse) queueAutoBackup('book-updated');
    return updated;
  }, [queueAutoBackup]);

  const repairMetadata = useCallback(async (id, { force = false } = {}) => {
    const book = booksRef.current.find(b => b.id === id);
    if (!book || (!force && book.metadataStatus === 'ready')) return null;
    if (!book.fileBlob) {
      await updateBook(id, { metadataStatus: 'failed', metadataPending: false, metadataNextRetryAt: null, metadataError: 'Original file is missing. Import the document again.' });
      return 'failed';
    }
    if (metadataActiveIdsRef.current.has(id)) return null;
    if (metadataActiveIdsRef.current.size >= METADATA_CONCURRENCY) return null;
    if (!force && book.metadataNextRetryAt > Date.now()) return null;
    const attempts = force ? 0 : (book.metadataAttempts || 0);
    if (!force && attempts >= METADATA_MAX_ATTEMPTS) return null;
    metadataActiveIdsRef.current.add(id);
    setMetadataProcessingCount(metadataActiveIdsRef.current.size);
    try {
      await updateBook(id, {
        metadataStatus: 'processing',
        metadataPending: true,
        metadataAttempts: attempts,
        metadataError: null,
      });
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
      await updateBook(id, {
        ...metadata,
        metadataStatus: 'ready',
        metadataPending: false,
        metadataAttempts: attempts + 1,
        metadataNextRetryAt: null,
        metadataError: null,
      });
      return 'ready';
    } catch (err) {
      console.warn('Metadata auto-repair failed for', book.title, err);
      const nextAttempts = attempts + 1;
      const retryable = nextAttempts < METADATA_MAX_ATTEMPTS;
      await updateBook(id, {
        metadataStatus: retryable ? 'pending' : 'failed',
        metadataPending: retryable,
        metadataAttempts: nextAttempts,
        metadataNextRetryAt: retryable ? Date.now() + METADATA_RETRY_DELAYS[nextAttempts - 1] : null,
        metadataError: err?.message || 'Metadata extraction failed.',
      });
      return retryable ? 'pending' : 'failed';
    } finally {
      metadataActiveIdsRef.current.delete(id);
      setMetadataProcessingCount(metadataActiveIdsRef.current.size);
    }
  }, [updateBook]);

  // Background Metadata Queue
  useEffect(() => {
    if (isLoading || isMetadataQueuePaused) return undefined;
    const now = Date.now();
    const capacity = Math.max(0, METADATA_CONCURRENCY - metadataActiveIdsRef.current.size);
    const pendingBooks = booksRef.current.filter(book => (
      book.metadataStatus === 'pending'
      && (book.metadataAttempts || 0) < METADATA_MAX_ATTEMPTS
      && !metadataActiveIdsRef.current.has(book.id)
    ));
    const ready = pendingBooks
      .filter(book => !book.metadataNextRetryAt || book.metadataNextRetryAt <= now)
      .slice(0, capacity);
    const nextRetryAt = pendingBooks
      .map(book => book.metadataNextRetryAt)
      .filter(value => value && value > now)
      .sort((a, b) => a - b)[0];
    const delay = ready.length > 0 ? 250 : Math.max(250, Math.min(15000, (nextRetryAt || now + 15000) - now));
    const timer = window.setTimeout(() => {
      if (ready.length > 0) ready.forEach(book => repairMetadata(book.id).catch(error => console.warn('Could not persist metadata job:', error)));
      else if (pendingBooks.length > 0) setMetadataQueueTick(value => value + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [books, isLoading, isMetadataQueuePaused, metadataQueueTick, repairMetadata]);

  const createList = useCallback(async (input, legacyDesc = '', legacyStyle = 'gold', legacyIds = []) => {
    let name = '';
    let description = '';
    let coverStyle = 'gold';
    let coverImageUrl = '';
    let bookIds = [];

    if (typeof input === 'string') {
      name = input;
      description = legacyDesc;
      coverStyle = legacyStyle;
      bookIds = legacyIds;
    } else if (input && typeof input === 'object') {
      name = input.name || '';
      description = input.description || '';
      coverStyle = input.coverStyle || 'gold';
      coverImageUrl = input.coverImageUrl || '';
      bookIds = input.bookIds || [];
    }

    const cleanName = name.trim();
    const incomingIds = Array.from(new Set(bookIds));
    const existing = lists.find(item => normalizeListName(item.name) === normalizeListName(cleanName));
    if (existing) {
      const updated = {
        ...existing,
        description: existing.description || description.trim(),
        coverStyle: existing.coverStyle || coverStyle,
        coverImageUrl: coverImageUrl || existing.coverImageUrl || '',
        bookIds: Array.from(new Set([...(existing.bookIds || []), ...incomingIds])),
        updatedAt: Date.now(),
      };
      await StorageManager.saveList(updated);
      setLists(prev => prev.map(item => item.id === updated.id ? updated : item));
      queueAutoBackup('list-merged');
      return updated;
    }
    const item = {
      id: uuidv4(),
      name: cleanName,
      description: description.trim(),
      coverStyle,
      coverImageUrl,
      sortBy: 'addedAt',
      bookIds: incomingIds,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await StorageManager.saveList(item);
    setLists(prev => [...prev, item]);
    queueAutoBackup('list-created');
    return item;
  }, [lists, queueAutoBackup]);

  const updateList = useCallback(async (id, updates) => {
    let saved = null;
    setLists(prev => prev.map(item => {
      if (item.id !== id) return item;
      saved = { ...item, ...updates, updatedAt: Date.now() };
      StorageManager.saveList(saved);
      queueAutoBackup('list-updated');
      return saved;
    }));
    return saved;
  }, [queueAutoBackup]);

  const deleteList = useCallback(async (id) => {
    await StorageManager.deleteList(id);
    localStorage.setItem(STORAGE_KEYS.seededDefaultLists, '1');
    setLists(prev => prev.filter(item => item.id !== id));
    queueAutoBackup('list-deleted');
  }, [queueAutoBackup]);

  const addBooksToList = useCallback(async (listId, bookIds) => {
    setLists(prev => prev.map(item => {
      if (item.id !== listId) return item;
      const updated = {
        ...item,
        bookIds: Array.from(new Set([...item.bookIds, ...bookIds])),
        updatedAt: Date.now(),
      };
      StorageManager.saveList(updated);
      queueAutoBackup('list-books-added');
      return updated;
    }));
  }, [queueAutoBackup]);

  const removeBookFromList = useCallback(async (listId, bookId) => {
    setLists(prev => prev.map(item => {
      if (item.id !== listId) return item;
      const updated = {
        ...item,
        bookIds: item.bookIds.filter(id => id !== bookId),
        updatedAt: Date.now(),
      };
      StorageManager.saveList(updated);
      queueAutoBackup('list-book-removed');
      return updated;
    }));
  }, [queueAutoBackup]);

  const getSorted = useCallback((bookList) => {
    return [...bookList].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        case 'addedAt':
          return b.addedAt - a.addedAt;
        case 'progress': {
          const progA = readProgressPercent(a);
          const progB = readProgressPercent(b);
          return progB - progA;
        }
        case 'lastOpenedAt':
        default:
          return (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0);
      }
    });
  }, [sortBy]);

  // Derived sections
  const filteredBooks = useMemo(() => books.filter(b => {
    if (filterBy === 'reading') return b.status === 'reading';
    if (filterBy === 'favorites') return b.isFavorite;
    if (filterBy === 'finished') return b.status === 'finished';
    if (filterBy === 'unread') return b.status === 'unread';
    if (filterBy === 'bookmarked') return bookmarkedBookIds.has(b.id);
    return true;
  }).filter(b => {
    const query = debouncedSearchQuery.trim();
    if (!query) return true;
    const listNames = lists
      .filter(list => list.bookIds.includes(b.id))
      .map(list => list.name)
      .join(' ');
    const haystack = [
      b.title,
      b.author,
      b.genre,
      b.description,
      b.publisher,
      listNames,
    ].filter(Boolean).join(' ');
    return includesSearchText(haystack, query);
  }), [books, filterBy, bookmarkedBookIds, debouncedSearchQuery, lists]);

  const resetBookProgress = useCallback(async (bookId) => {
    await StorageManager.deleteProgress(bookId);
    try {
      localStorage.removeItem(progressStorageKey(bookId));
    } catch (e) {
      console.warn('Could not remove progress from localStorage:', e);
    }
    await updateBook(bookId, {
      progress: 0,
      progressPercent: 0,
      status: 'reading',
      lastOpenedAt: Date.now(),
    });
  }, [updateBook]);

  const sortedBooks = useMemo(() => getSorted(filteredBooks), [filteredBooks, getSorted]);
  const stats = useMemo(() => getLibraryStats(books, lists, bookmarkCount), [books, lists, bookmarkCount]);

  return {
    books: sortedBooks,
    allBooksRaw: books,
    isLoading,
    addBook,
    deleteBook,
    updateBook,
    resetBookProgress,
    sortBy,
    setSortBy,
    filterBy,
    setFilterBy,
    searchQuery,
    setSearchQuery,
    lists,
    bookmarkCount,
    bookmarkedBookIds,
    stats,
    createList,
    updateList,
    deleteList,
    addBooksToList,
    removeBookFromList,
    refreshLibrary,
    isMetadataQueuePaused,
    setIsMetadataQueuePaused,
    metadataProcessingCount,
    repairMetadata,
    pendingMetadataTotal: books.filter(b => b.metadataStatus === 'pending').length,
    failedMetadataTotal: books.filter(b => b.metadataStatus === 'failed').length,
  };
}
