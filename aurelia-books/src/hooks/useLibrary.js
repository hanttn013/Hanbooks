// src/hooks/useLibrary.js
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DEMO_BOOKS } from '../data/demoBooks';
import { StorageManager } from '../utils/StorageManager';
import { extractEpubMetadata, normalizeBookMetadata } from '../utils/epubMetadata';
import { getLibraryStats } from '../utils/libraryStats';

const DEFAULT_LISTS = [
  {
    id: 'reading-now',
    name: 'Reading Now',
    description: 'Stories in progress.',
    coverStyle: 'gold',
    sortBy: 'lastOpenedAt',
    bookIds: ['demo-1'],
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'want-to-read',
    name: 'Want to Read',
    description: 'Saved for a quieter evening.',
    coverStyle: 'cream',
    sortBy: 'addedAt',
    bookIds: ['demo-2'],
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 7,
  },
  {
    id: 'romance',
    name: 'Romance',
    description: 'Longing, restraint, and slow unfolding.',
    coverStyle: 'burgundy',
    sortBy: 'title',
    bookIds: ['demo-1', 'demo-3'],
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 6,
  },
];

export function useLibrary() {
  const [books, setBooks] = useState([]);
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('aurelia_sort') || 'lastOpenedAt');
  const [filterBy, setFilterBy] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lists, setLists] = useState([]);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [bookmarkedBookIds, setBookmarkedBookIds] = useState(() => new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load books from IndexedDB
  const refreshLibrary = useCallback(async () => {
    setIsLoading(true);
    try {
      let list = await StorageManager.getAllBooks();
      if (list.length === 0 && localStorage.getItem('aurelia_seeded_demo') !== '1') {
        // Load demo books from public URLs or assets
        for (const demo of DEMO_BOOKS) {
          try {
            const res = await fetch(demo.epubUrl);
            const blob = await res.blob();
            const metadata = await extractEpubMetadata(blob, {
              title: demo.title,
              author: demo.author,
              genre: demo.genre,
              description: demo.description,
              chapterCount: demo.chapterCount,
              estimatedPages: demo.estimatedPages,
            });
            const bookRecord = {
              ...demo,
              ...metadata,
              title: metadata.title || demo.title,
              author: metadata.author || demo.author,
              coverUrl: metadata.coverUrl,
              fileBlob: blob,
            };
            await StorageManager.saveBook(bookRecord);
          } catch (e) {
            console.error('Failed to pre-fetch demo book:', demo.title, e);
            // Fallback save metadata only
            await StorageManager.saveBook({ ...demo, ...normalizeBookMetadata(demo), fileBlob: null });
          }
        }
        localStorage.setItem('aurelia_seeded_demo', '1');
        list = await StorageManager.getAllBooks();
      }

      const normalized = list.map(book => {
        const demoFallback = DEMO_BOOKS.find(item => item.id === book.id);
        return {
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
        };
      });
      setBooks(normalized);

      let storedLists = await StorageManager.getAllLists();
      if (storedLists.length === 0) {
        for (const item of DEFAULT_LISTS) {
          await StorageManager.saveList(item);
        }
        storedLists = await StorageManager.getAllLists();
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
    const timer = setTimeout(() => {
      refreshLibrary();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshLibrary]);

  useEffect(() => {
    localStorage.setItem('aurelia_sort', sortBy);
  }, [sortBy]);

  const addBook = useCallback(async (file, metadata) => {
    const bookMetadata = metadata || await extractEpubMetadata(file, { fileName: file.name });
    const book = {
      id: uuidv4(),
      title: bookMetadata.title || file.name.replace(/\.epub$/i, ''),
      author: bookMetadata.author || 'Unknown Author',
      isDemo: false,
      coverColor: bookMetadata.coverColor || '#2D4A6E',
      coverAccent: bookMetadata.coverAccent || '#C4A35A',
      coverUrl: bookMetadata.coverUrl || null,
      fileBlob: file,
      status: 'unread',
      isFavorite: false,
      addedAt: Date.now(),
      lastOpenedAt: null,
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
      metadataExtractedAt: bookMetadata.metadataExtractedAt || Date.now(),
    };
    await StorageManager.saveBook(book);
    setBooks(prev => [book, ...prev]);
    return book;
  }, []);

  const deleteBook = useCallback(async (id) => {
    await StorageManager.deleteBook(id);
    setBooks(prev => prev.filter(b => b.id !== id));
    setLists(prev => prev.map(list => ({
      ...list,
      bookIds: list.bookIds.filter(bookId => bookId !== id),
    })));
    setBookmarkedBookIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const updateBook = useCallback(async (id, updates) => {
    setBooks(prev => prev.map(b => {
      if (b.id === id) {
        const updated = { ...b, ...updates };
        StorageManager.saveBook(updated);
        return updated;
      }
      return b;
    }));
  }, []);

  const createList = useCallback(async ({ name, description = '', coverStyle = 'gold', bookIds = [] }) => {
    const item = {
      id: uuidv4(),
      name: name.trim(),
      description: description.trim(),
      coverStyle,
      sortBy: 'addedAt',
      bookIds: Array.from(new Set(bookIds)),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await StorageManager.saveList(item);
    setLists(prev => [...prev, item]);
    return item;
  }, []);

  const updateList = useCallback(async (id, updates) => {
    let saved = null;
    setLists(prev => prev.map(item => {
      if (item.id !== id) return item;
      saved = { ...item, ...updates, updatedAt: Date.now() };
      StorageManager.saveList(saved);
      return saved;
    }));
    return saved;
  }, []);

  const deleteList = useCallback(async (id) => {
    await StorageManager.deleteList(id);
    setLists(prev => prev.filter(item => item.id !== id));
  }, []);

  const addBooksToList = useCallback(async (listId, bookIds) => {
    setLists(prev => prev.map(item => {
      if (item.id !== listId) return item;
      const updated = {
        ...item,
        bookIds: Array.from(new Set([...item.bookIds, ...bookIds])),
        updatedAt: Date.now(),
      };
      StorageManager.saveList(updated);
      return updated;
    }));
  }, []);

  const removeBookFromList = useCallback(async (listId, bookId) => {
    setLists(prev => prev.map(item => {
      if (item.id !== listId) return item;
      const updated = {
        ...item,
        bookIds: item.bookIds.filter(id => id !== bookId),
        updatedAt: Date.now(),
      };
      StorageManager.saveList(updated);
      return updated;
    }));
  }, []);

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
          const progA = parseFloat(localStorage.getItem(`aurelia_pct_${a.id}`) || 0);
          const progB = parseFloat(localStorage.getItem(`aurelia_pct_${b.id}`) || 0);
          return progB - progA;
        }
        case 'lastOpenedAt':
        default:
          return (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0);
      }
    });
  }, [sortBy]);

  // Derived sections
  const filteredBooks = books.filter(b => {
    if (filterBy === 'reading') return b.status === 'reading';
    if (filterBy === 'favorites') return b.isFavorite;
    if (filterBy === 'finished') return b.status === 'finished';
    if (filterBy === 'unread') return b.status === 'unread';
    if (filterBy === 'bookmarked') return bookmarkedBookIds.has(b.id);
    return true;
  }).filter(b => {
    const query = searchQuery.trim().toLowerCase();
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
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(query);
  });

  const sortedBooks = getSorted(filteredBooks);
  const stats = getLibraryStats(books, lists, bookmarkCount);

  return {
    books: sortedBooks,
    allBooksRaw: books,
    isLoading,
    addBook,
    deleteBook,
    updateBook,
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
  };
}
