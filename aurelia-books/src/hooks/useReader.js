// src/hooks/useReader.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { App as CapacitorApp } from '@capacitor/app';
import { StorageManager } from '../utils/StorageManager';
import { migrateLegacyLocalStorage, progressStorageKey, STORAGE_KEYS } from '../utils/storageKeys';

const EMPTY_STATS = {
  totalReadingMs: 0,
  streak: 0,
  lastReadDate: null,
  booksFinished: 0,
  pagesReadToday: 0,
  lastTodayDate: null,
};

function loadStats() {
  try {
    migrateLegacyLocalStorage();
    const stored = localStorage.getItem(STORAGE_KEYS.stats);
    return stored ? { ...EMPTY_STATS, ...JSON.parse(stored) } : { ...EMPTY_STATS };
  } catch {
    return { ...EMPTY_STATS };
  }
}

function persistStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats));
  } catch (error) {
    console.warn('Could not persist reading stats:', error);
  }
}

export function useReader(bookId) {
  const [progress, setProgress] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [stats, setStats] = useState(loadStats);
  const statsRef = useRef(stats);
  const startTimeRef = useRef(null);
  const lastPercentageRef = useRef(null);
  const hasStartedRef = useRef(false);
  const mountedRef = useRef(true);

  const commitStats = useCallback((update) => {
    const next = typeof update === 'function' ? update(statsRef.current) : update;
    statsRef.current = next;
    persistStats(next);
    if (mountedRef.current) setStats(next);
    return next;
  }, []);

  // Fetch initial progress & bookmarks
  useEffect(() => {
    if (!bookId) return;
    let active = true;
    StorageManager.getProgress(bookId).then(value => {
      if (active) setProgress(value);
    });
    StorageManager.getBookmarks(bookId).then(value => {
      if (active) setBookmarks(value);
    });
    return () => {
      active = false;
    };
  }, [bookId]);

  const saveProgress = useCallback(async (cfi, percentage, chapterTitle) => {
    if (!bookId) return;
    const record = { bookId, cfi, percentage, chapterTitle, lastReadAt: Date.now() };
    await StorageManager.saveProgress(record);
    if (mountedRef.current) setProgress(record);
    try {
      localStorage.setItem(progressStorageKey(bookId), String(percentage));
    } catch (e) {
      console.warn("localStorage quota exceeded or blocked:", e);
    }
    commitStats(prev => {
      const today = new Date().toDateString();
      const resetToday = prev.lastTodayDate !== today;
      const previousPct = lastPercentageRef.current ?? percentage;
      const delta = Math.max(0, percentage - previousPct);
      lastPercentageRef.current = percentage;
      const estimatedPages = Math.round(delta * 3);
      return {
        ...prev,
        pagesReadToday: (resetToday ? 0 : prev.pagesReadToday || 0) + estimatedPages,
        lastTodayDate: today,
      };
    });
  }, [bookId, commitStats]);

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
    hasStartedRef.current = true;
    if (startTimeRef.current !== null) return;
    startTimeRef.current = Date.now();
    const today = new Date().toDateString();
    commitStats(prev => {
      if (prev.lastReadDate === today) return prev;
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const newStreak = prev.lastReadDate === yesterday ? prev.streak + 1 : 1;
      return { ...prev, streak: newStreak, lastReadDate: today };
    });
  }, [commitStats]);

  const stopReading = useCallback(() => {
    if (startTimeRef.current === null) return;
    const elapsed = Date.now() - startTimeRef.current;
    startTimeRef.current = null;
    commitStats(prev => ({
      ...prev,
      totalReadingMs: (prev.totalReadingMs || 0) + Math.max(0, elapsed),
    }));
  }, [commitStats]);

  useEffect(() => {
    mountedRef.current = true;
    let nativeListener = null;
    let disposed = false;
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') stopReading();
      else if (hasStartedRef.current) startReading();
    };
    const handlePageExit = () => stopReading();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageExit);
    window.addEventListener('beforeunload', handlePageExit);
    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive && hasStartedRef.current) startReading();
      else if (!isActive) stopReading();
    }).then(listener => {
      if (disposed) listener.remove();
      else nativeListener = listener;
    }).catch(() => {
      nativeListener = null;
    });

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageExit);
      window.removeEventListener('beforeunload', handlePageExit);
      nativeListener?.remove?.();
      mountedRef.current = false;
      stopReading();
    };
  }, [startReading, stopReading]);

  const markFinished = useCallback(() => {
    commitStats(prev => ({ ...prev, booksFinished: prev.booksFinished + 1 }));
  }, [commitStats]);

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
