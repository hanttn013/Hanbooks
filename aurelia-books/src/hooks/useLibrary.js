// src/hooks/useLibrary.js
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DEMO_BOOKS } from '../data/demoBooks';

const STORAGE_KEY = 'aurelia_library';

function loadLibrary() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.length > 0) {
        // Merge: update demo books' epubUrl from DEMO_BOOKS (in case they changed)
        return parsed.map(book => {
          const demo = DEMO_BOOKS.find(d => d.id === book.id);
          if (demo) return { ...book, epubUrl: demo.epubUrl };
          return book;
        });
      }
    }
    return [...DEMO_BOOKS];
  } catch {
    return [...DEMO_BOOKS];
  }
}

function saveLibrary(books) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  } catch (e) {
    console.warn('Failed to save library:', e);
  }
}

export function useLibrary() {
  const [books, setBooks] = useState(loadLibrary);
  const [sortBy, setSortBy] = useState('lastOpenedAt');

  useEffect(() => {
    saveLibrary(books);
  }, [books]);

  const addBook = useCallback(async (file) => {
    const url = URL.createObjectURL(file);
    const title = file.name.replace(/\.epub$/i, '');
    const book = {
      id: uuidv4(),
      title,
      author: 'Unknown Author',
      isDemo: false,
      coverColor: '#2D4A6E',
      coverAccent: '#C4A35A',
      epubUrl: url,
      blobUrl: url,
      status: 'unread',
      isFavorite: false,
      addedAt: Date.now(),
      lastOpenedAt: null,
      totalLocations: 0,
    };
    setBooks(prev => [book, ...prev]);
    return book;
  }, []);

  const deleteBook = useCallback((id) => {
    setBooks(prev => {
      const book = prev.find(b => b.id === id);
      if (book?.blobUrl) {
        try { URL.revokeObjectURL(book.blobUrl); } catch {}
      }
      return prev.filter(b => b.id !== id);
    });
  }, []);

  const updateBook = useCallback((id, updates) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
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
  const currentlyReading = getSorted(books.filter(b => b.status === 'reading'));
  const favorites = getSorted(books.filter(b => b.isFavorite));
  const recentlyAdded = getSorted(books.filter(b => b.status !== 'finished'));
  const finished = getSorted(books.filter(b => b.status === 'finished'));

  return {
    books,
    addBook,
    deleteBook,
    updateBook,
    sortBy,
    setSortBy,
    getSorted,
    currentlyReading,
    favorites,
    recentlyAdded,
    finished,
  };
}
