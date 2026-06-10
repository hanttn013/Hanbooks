// src/hooks/useReader.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

const PROGRESS_KEY = 'aurelia_progress';
const BOOKMARKS_KEY = 'aurelia_bookmarks';
const STATS_KEY = 'aurelia_stats';

function load(key, defaultVal) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function useReader(bookId) {
  const [allProgress, setAllProgress] = useState(() => load(PROGRESS_KEY, {}));
  const [allBookmarks, setAllBookmarks] = useState(() => load(BOOKMARKS_KEY, {}));
  const [stats, setStats] = useState(() => load(STATS_KEY, {
    totalReadingMs: 0,
    streak: 0,
    lastReadDate: null,
    booksFinished: 0,
    pagesReadToday: 0,
    lastTodayDate: null,
  }));
  const startTimeRef = useRef(null);

  useEffect(() => { save(PROGRESS_KEY, allProgress); }, [allProgress]);
  useEffect(() => { save(BOOKMARKS_KEY, allBookmarks); }, [allBookmarks]);
  useEffect(() => { save(STATS_KEY, stats); }, [stats]);

  // Progress
  const saveProgress = useCallback((cfi, percentage, chapterTitle) => {
    if (!bookId) return;
    setAllProgress(prev => ({
      ...prev,
      [bookId]: { cfi, percentage, chapterTitle, lastReadAt: Date.now() },
    }));
    // Cache percentage separately for sort
    try {
      localStorage.setItem(`aurelia_pct_${bookId}`, String(percentage));
    } catch {}
  }, [bookId]);

  const getProgress = useCallback(() => {
    return bookId ? (allProgress[bookId] || null) : null;
  }, [allProgress, bookId]);

  // Bookmarks
  const addBookmark = useCallback((cfi, chapterTitle, excerpt) => {
    if (!bookId) return null;
    const bookmark = {
      id: uuidv4(),
      bookId,
      cfi,
      chapterTitle,
      excerpt: excerpt ? excerpt.slice(0, 120) : '',
      createdAt: Date.now(),
    };
    setAllBookmarks(prev => ({
      ...prev,
      [bookId]: [...(prev[bookId] || []), bookmark],
    }));
    return bookmark;
  }, [bookId]);

  const removeBookmark = useCallback((id) => {
    if (!bookId) return;
    setAllBookmarks(prev => ({
      ...prev,
      [bookId]: (prev[bookId] || []).filter(b => b.id !== id),
    }));
  }, [bookId]);

  const getBookmarks = useCallback(() => {
    return bookId ? (allBookmarks[bookId] || []) : [];
  }, [allBookmarks, bookId]);

  const isBookmarked = useCallback((cfi) => {
    if (!bookId || !cfi) return false;
    return (allBookmarks[bookId] || []).some(b => b.cfi === cfi);
  }, [allBookmarks, bookId]);

  // Reading time tracking
  const startReading = useCallback(() => {
    startTimeRef.current = Date.now();

    // Streak tracking
    const today = new Date().toDateString();
    setStats(prev => {
      if (prev.lastReadDate === today) return prev;
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const newStreak = prev.lastReadDate === yesterday ? prev.streak + 1 : 1;
      return { ...prev, streak: newStreak, lastReadDate: today };
    });
  }, []);

  const stopReading = useCallback(() => {
    if (!startTimeRef.current) return;
    const elapsed = Date.now() - startTimeRef.current;
    setStats(prev => ({
      ...prev,
      totalReadingMs: prev.totalReadingMs + elapsed,
    }));
    startTimeRef.current = null;
  }, []);

  const markFinished = useCallback(() => {
    setStats(prev => ({ ...prev, booksFinished: prev.booksFinished + 1 }));
  }, []);

  return {
    saveProgress,
    getProgress,
    addBookmark,
    removeBookmark,
    getBookmarks,
    isBookmarked,
    stats,
    startReading,
    stopReading,
    markFinished,
    allProgress,
  };
}
