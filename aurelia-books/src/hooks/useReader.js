// src/hooks/useReader.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { StorageManager } from '../utils/StorageManager';

const STATS_KEY = 'aurelia_stats';

function loadStats() {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    return stored ? JSON.parse(stored) : {
      totalReadingMs: 0,
      streak: 0,
      lastReadDate: null,
      booksFinished: 0,
      pagesReadToday: 0,
      lastTodayDate: null,
    };
  } catch {
    return {
      totalReadingMs: 0,
      streak: 0,
      lastReadDate: null,
      booksFinished: 0,
      pagesReadToday: 0,
      lastTodayDate: null,
    };
  }
}

export function useReader(bookId) {
  const [progress, setProgress] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [stats, setStats] = useState(loadStats);
  const startTimeRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }, [stats]);

  // Fetch initial progress & bookmarks
  useEffect(() => {
    if (!bookId) return;
    StorageManager.getProgress(bookId).then(setProgress);
    StorageManager.getBookmarks(bookId).then(setBookmarks);
  }, [bookId]);

  const saveProgress = useCallback(async (cfi, percentage, chapterTitle) => {
    if (!bookId) return;
    const record = { bookId, cfi, percentage, chapterTitle, lastReadAt: Date.now() };
    await StorageManager.saveProgress(record);
    setProgress(record);
    try {
      localStorage.setItem(`aurelia_pct_${bookId}`, String(percentage));
    } catch (e) {
      console.warn("localStorage quota exceeded or blocked:", e);
    }
  }, [bookId]);

  const addBookmark = useCallback(async (cfi, chapterTitle, excerpt) => {
    if (!bookId) return null;
    const bookmark = {
      id: uuidv4(),
      bookId,
      cfi,
      chapterTitle,
      excerpt: excerpt ? excerpt.slice(0, 120) : '',
      createdAt: Date.now(),
    };
    const saved = await StorageManager.addBookmark(bookmark);
    setBookmarks(prev => [...prev, saved]);
    return saved;
  }, [bookId]);

  const removeBookmark = useCallback(async (id) => {
    await StorageManager.removeBookmark(id);
    setBookmarks(prev => prev.filter(b => b.id !== id));
  }, []);

  const isBookmarked = useCallback((cfi) => {
    if (!cfi) return false;
    return bookmarks.some(b => b.cfi === cfi);
  }, [bookmarks]);

  const startReading = useCallback(() => {
    startTimeRef.current = Date.now();
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
    progress,
    saveProgress,
    addBookmark,
    removeBookmark,
    bookmarks,
    isBookmarked,
    stats,
    startReading,
    stopReading,
    markFinished,
  };
}
