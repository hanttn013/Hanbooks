// src/hooks/useLibrary.js
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DEMO_BOOKS } from '../data/demoBooks';
import { StorageManager } from '../utils/StorageManager';

export function useLibrary() {
  const [books, setBooks] = useState([]);
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('aurelia_sort') || 'lastOpenedAt');
  const [filterBy, setFilterBy] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Load books from IndexedDB
  const refreshLibrary = useCallback(async () => {
    setIsLoading(true);
    try {
      let list = await StorageManager.getAllBooks();
      if (list.length === 0) {
        // Load demo books from public URLs or assets
        for (const demo of DEMO_BOOKS) {
          try {
            const res = await fetch(demo.epubUrl);
            const blob = await res.blob();
            const bookRecord = {
              ...demo,
              fileBlob: blob,
              coverUrl: null, // extracted cover or SVG will fall back
            };
            await StorageManager.saveBook(bookRecord);
          } catch (e) {
            console.error('Failed to pre-fetch demo book:', demo.title, e);
            // Fallback save metadata only
            await StorageManager.saveBook({ ...demo, fileBlob: null });
          }
        }
        list = await StorageManager.getAllBooks();
      }
      setBooks(list);
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
    const book = {
      id: uuidv4(),
      title: metadata.title || file.name.replace(/\.epub$/i, ''),
      author: metadata.author || 'Unknown Author',
      isDemo: false,
      coverColor: metadata.coverColor || '#2D4A6E',
      coverAccent: metadata.coverAccent || '#C4A35A',
      coverUrl: metadata.coverUrl || null, // Base64 cover
      fileBlob: file,
      status: 'unread',
      isFavorite: false,
      addedAt: Date.now(),
      lastOpenedAt: null,
      totalLocations: 0,
    };
    await StorageManager.saveBook(book);
    setBooks(prev => [book, ...prev]);
    return book;
  }, []);

  const deleteBook = useCallback(async (id) => {
    await StorageManager.deleteBook(id);
    setBooks(prev => prev.filter(b => b.id !== id));
  }, []);

  const updateBook = useCallback(async (id, updates) => {
    // We update state first or DB first? Update DB then update state
    setBooks(prev => prev.map(b => {
      if (b.id === id) {
        const updated = { ...b, ...updates };
        StorageManager.saveBook(updated);
        return updated;
      }
      return b;
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
    return true;
  });

  const sortedBooks = getSorted(filteredBooks);

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
    refreshLibrary,
  };
}
