// src/components/Reader/ReaderScreen.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ePub from 'epubjs';
import { useReader } from '../../hooks/useReader';
import BookmarksModal from './BookmarksModal';
import TOCModal from './TOCModal';
import SearchModal from './SearchModal';
import ReaderSettingsPanel from './ReaderSettingsPanel';
import { StorageManager } from '../../utils/StorageManager';
import styles from './ReaderScreen.module.css';

export default function ReaderScreen({ book, settings, updateSetting, onClose }) {
  const [showControls, setShowControls] = useState(true);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentCfi, setCurrentCfi] = useState(null);
  const [currentChapter, setCurrentChapter] = useState('');
  const [percentage, setPercentage] = useState(0);
  const [toc, setToc] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookmarkFeedback, setBookmarkFeedback] = useState(null); // 'added' | 'removed'
  const [currentPage, setCurrentPage] = useState(null);
  const [totalPages, setTotalPages] = useState(null);
  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [animateClass, setAnimateClass] = useState('');
  const [epubBook, setEpubBook] = useState(null);

  const viewerRef = useRef(null);
  const bookRef = useRef(null);
  const renditionRef = useRef(null);
  const currentChapterRef = useRef('');
  const currentCfiRef = useRef(null);

  const {
    progress,
    saveProgress,
    addBookmark,
    removeBookmark,
    bookmarks,
    isBookmarked,
    startReading,
    stopReading,
  } = useReader(book.id);

  // Determine epub URL (from IndexedDB Blob or public URL)
  const getEpubUrl = () => {
    if (book.fileBlob) {
      return URL.createObjectURL(book.fileBlob);
    }
    if (book.epubUrl) return book.epubUrl;
    return null;
  };

  useEffect(() => {
    const url = getEpubUrl();
    if (!url || !viewerRef.current) {
      setError("Unable to find the EPUB resource URL.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const epubBookInstance = ePub(url);
    bookRef.current = epubBookInstance;
    setEpubBook(epubBookInstance);

    const rendition = epubBookInstance.renderTo(viewerRef.current, {
      width: '100%',
      height: '100%',
      flow: settings.readingMode === 'scroll' ? 'scrolled-doc' : 'paginated',
      spread: 'none',
      allowScriptedContent: true,
    });

    renditionRef.current = rendition;

    // Apply reading theme
    rendition.themes.default({
      body: {
        'font-family': `'${settings.font}', Georgia, serif !important`,
        'font-size': `${settings.fontSize}px !important`,
        'line-height': `${settings.lineHeight} !important`,
        'letter-spacing': `${settings.letterSpacing}px !important`,
        'padding': `${settings.marginWidth}px !important`,
        'background': 'transparent !important',
        'margin': '0 !important',
      },
      p: { 'margin-bottom': '1em' },
      img: { 'max-width': '100%' },
    });

    // Get TOC
    epubBookInstance.loaded.navigation.then(nav => {
      if (nav?.toc) setToc(nav.toc);
    }).catch(() => { /* ignore navigation error */ });

    // Load book and restore position
    epubBookInstance.ready.then(() => {
      return epubBookInstance.locations.generate(1024);
    }).then(async () => {
      setTotalPages(epubBookInstance.locations.total);
      const savedProgress = await StorageManager.getProgress(book.id);
      return rendition.display(savedProgress?.cfi || undefined);
    }).then(() => {
      setIsLoading(false);
      startReading();
    }).catch(async () => {
      const savedProgress = await StorageManager.getProgress(book.id);
      const displayPromise = savedProgress?.cfi
        ? rendition.display(savedProgress.cfi).catch(() => rendition.display())
        : rendition.display();
      displayPromise.finally(() => {
        setIsLoading(false);
        startReading();
      });
    });

    // Track location changes
    rendition.on('locationChanged', (loc) => {
      const cfi = loc?.start?.cfi || loc?.cfi;
      if (cfi) {
        setCurrentCfi(cfi);
        currentCfiRef.current = cfi;
      }

      // Get chapter title from TOC
      epubBookInstance.loaded.navigation.then(nav => {
        if (!nav?.toc || !cfi) return;
        const spineItem = epubBookInstance.spine?.get(cfi);
        if (spineItem?.href) {
          const chapter = nav.toc.find(t =>
            t.href && spineItem.href.includes(t.href.split('#')[0])
          );
          const title = chapter?.label?.trim() || '';
          setCurrentChapter(title);
          currentChapterRef.current = title;
        }
      }).catch((_err) => { /* ignore nav load failure */ });

      // Calculate percentage and relative locations
      try {
        if (epubBookInstance.locations && cfi) {
          const pct = epubBookInstance.locations.percentageFromCfi(cfi) * 100;
          if (!isNaN(pct) && pct >= 0) {
            const rounded = Math.round(pct);
            setPercentage(rounded);
            saveProgress(cfi, rounded, currentChapterRef.current);
          }
          const currentLoc = epubBookInstance.locations.locationFromCfi(cfi);
          const totalLoc = epubBookInstance.locations.total;
          if (currentLoc !== -1) {
            setCurrentPage(Math.max(1, currentLoc));
            setTotalPages(totalLoc);
          }
        }
      } catch (err) {
        console.warn("Failed to calculate page locations:", err);
      }
    });

    // Click inside iframe to toggle controls
    rendition.on('click', () => {
      setShowControls(prev => !prev);
    });

    return () => {
      stopReading();
      try {
        epubBookInstance.destroy();
      } catch (err) {
        console.warn("Error destroying EPUB instance:", err);
      }
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [book.id]);

  // Re-apply typography when settings change (without re-mounting epub)
  useEffect(() => {
    if (!renditionRef.current) return;
    try {
      renditionRef.current.themes.default({
        body: {
          'font-family': `'${settings.font}', Georgia, serif !important`,
          'font-size': `${settings.fontSize}px !important`,
          'line-height': `${settings.lineHeight} !important`,
          'letter-spacing': `${settings.letterSpacing}px !important`,
          'padding': `${settings.marginWidth}px !important`,
          'background': 'transparent !important',
          'margin': '0 !important',
        },
        p: { 'margin-bottom': '1em' },
      });
    } catch (err) {
      console.warn("Failed to apply typography setting:", err);
    }
  }, [settings.font, settings.fontSize, settings.lineHeight, settings.letterSpacing, settings.marginWidth]);

  // Handle page animation triggers
  useEffect(() => {
    if (!currentCfi || settings.readingMode === 'scroll') return;
    const effect = settings.pageTurnEffect === 'realistic' ? styles.curlAnim : styles.slideAnim;
    
    const aid = requestAnimationFrame(() => {
      setAnimateClass(effect);
    });
    
    const tid = setTimeout(() => setAnimateClass(''), 400);
    return () => {
      cancelAnimationFrame(aid);
      clearTimeout(tid);
    };
  }, [currentCfi, settings.pageTurnEffect, settings.readingMode]);

  // Estimate remaining time in chapter
  useEffect(() => {
    if (!bookRef.current || !currentCfi) return;
    const updateTimeLeft = async () => {
      try {
        const item = bookRef.current.spine.get(currentCfi);
        if (item) {
          await item.load(bookRef.current.load.bind(bookRef.current));
          const doc = item.document;
          const text = doc?.body?.innerText || doc?.body?.textContent || '';
          const words = text.trim().split(/\s+/).filter(Boolean).length;
          const minutes = Math.ceil(words / 200);
          
          if (minutes > 0) {
            setTimeLeftStr(`${minutes} min left in chapter`);
          } else {
            setTimeLeftStr('');
          }
        }
      } catch (err) {
        console.warn("Could not calculate time left:", err);
      }
    };
    updateTimeLeft();
  }, [currentCfi]);

  // Page navigation
  const goNext = useCallback(() => renditionRef.current?.next(), []);
  const goPrev = useCallback(() => renditionRef.current?.prev(), []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, onClose]);

  // Bookmark toggle with visual feedback
  const handleBookmark = useCallback(() => {
    const cfi = currentCfiRef.current;
    if (!cfi) return;
    const existing = bookmarks.find(b => b.cfi === cfi);
    if (existing) {
      removeBookmark(existing.id);
      setBookmarkFeedback('removed');
    } else {
      addBookmark(cfi, currentChapterRef.current, '');
      setBookmarkFeedback('added');
    }
    setTimeout(() => setBookmarkFeedback(null), 1500);
  }, [addBookmark, removeBookmark, bookmarks]);

  const handleJumpTo = useCallback((cfi) => {
    if (!cfi) return;
    renditionRef.current?.display(cfi);
    setShowBookmarks(false);
    setShowTOC(false);
    setShowSearch(false);
  }, []);

  // Swipe gesture
  const touchStartX = useRef(null);
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0) goNext(); else goPrev();
    }
    touchStartX.current = null;
  };

  const bgColor = {
    'warm-cream': '#F5F0E8', 'pure-white': '#FFFFFF', 'vintage-paper': '#F5EDD6',
    'sepia': '#F1E4C3', 'dark-gray': '#2A2A2A', 'amoled-black': '#000000',
    'forest': '#1C3329', 'ocean': '#E8F4F8', 'midnight-blue': '#1A2035',
  }[settings.theme] || '#F5F0E8';

  const textColor = {
    'warm-cream': '#2C2416', 'pure-white': '#1A1A1A', 'vintage-paper': '#3D2B1F',
    'sepia': '#3B2F0A', 'dark-gray': '#E8E0D0', 'amoled-black': '#E0D8C8',
    'forest': '#E8F0E8', 'ocean': '#1A3040', 'midnight-blue': '#D8E0F0',
  }[settings.theme] || '#2C2416';

  const isCurrentBookmarked = isBookmarked(currentCfi);

  return (
    <motion.div
      className={styles.reader}
      style={{ backgroundColor: bgColor, color: textColor }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Loading */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className={styles.loading}
            style={{ backgroundColor: bgColor }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.loadingSpinner} />
            <p style={{ marginTop: 16, fontSize: 14, opacity: 0.5, color: textColor }}>
              Opening {book.title}…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>📖</p>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Could not open book</p>
          <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 20 }}>{error}</p>
          <button
            style={{ padding: '12px 28px', background: '#8B6914', color: '#FFF8EC', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
            onClick={onClose}
          >
            Back to Library
          </button>
        </div>
      )}

      {/* EPUB Viewer Container with Animation class wrapper */}
      <div
        ref={viewerRef}
        className={`${styles.viewer} ${animateClass}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => setShowControls(prev => !prev)}
      />

      {/* Tiny clean immersion footer at the bottom */}
      {!showControls && (
        <div style={{
          position: 'absolute',
          bottom: 12,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 10,
          opacity: 0.35,
          pointerEvents: 'none',
          userSelect: 'none',
          fontFamily: '-apple-system, system-ui, sans-serif',
          display: 'flex',
          justifyContent: 'center',
          gap: 12
        }}>
          {currentPage && totalPages && <span>Page {currentPage} of {totalPages}</span>}
          {percentage > 0 && <span>{percentage}%</span>}
          {timeLeftStr && <span>• {timeLeftStr}</span>}
        </div>
      )}

      {/* Page navigation zones */}
      {settings.readingMode !== 'scroll' && (
        <>
          <div className={styles.prevZone} onClick={(e) => { e.stopPropagation(); goPrev(); }} />
          <div className={styles.nextZone} onClick={(e) => { e.stopPropagation(); goNext(); }} />
        </>
      )}

      {/* Bookmark feedback toast */}
      <AnimatePresence>
        {bookmarkFeedback && (
          <motion.div
            className={styles.bookmarkToast}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            {bookmarkFeedback === 'added' ? '🔖 Bookmark added' : '🗑️ Bookmark removed'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls overlay */}
      <AnimatePresence>
        {showControls && (
          <>
            {/* Top bar */}
            <motion.div
              className={styles.topBar}
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.2 }}
            >
              <button className={styles.backBtn} onClick={onClose} title="Back to Library">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <div className={styles.topTitle}>
                <p style={{ fontWeight: 600, fontSize: 14, opacity: 0.85 }}>{book.title}</p>
                {currentChapter && (
                  <p style={{ fontSize: 11, opacity: 0.45, marginTop: 2 }}>{currentChapter}</p>
                )}
              </div>
              <button
                className={styles.backBtn}
                onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}
                title="Reading settings"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8"/>
                </svg>
              </button>
            </motion.div>

            {/* Bottom bar */}
            <motion.div
              className={styles.bottomBar}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.2 }}
            >
              {timeLeftStr && (
                <div style={{ fontSize: 11, textAlign: 'center', opacity: 0.5, marginBottom: 8, fontWeight: 500 }}>
                  {timeLeftStr}
                </div>
              )}
              {/* Progress row */}
              <div className={styles.progressRow}>
                <span style={{ fontSize: 11, opacity: 0.4 }}>
                  {currentPage ? `Page ${currentPage}` : '0%'}
                </span>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${percentage}%` }} />
                </div>
                <span style={{ fontSize: 11, opacity: 0.6, fontWeight: 500 }}>
                  {totalPages ? `${percentage}% (of ${totalPages})` : `${percentage}%`}
                </span>
              </div>

              {/* Action buttons */}
              <div className={styles.actionRow}>
                <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); setShowTOC(true); }} title="Table of Contents">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M4 6h16M4 10h12M4 14h16M4 18h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </button>

                <button
                  className={`${styles.actionBtn} ${isCurrentBookmarked ? styles.actionActive : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleBookmark(); }}
                  title={isCurrentBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                >
                  <svg width="18" height="20" viewBox="0 0 24 24" fill={isCurrentBookmarked ? 'currentColor' : 'none'}>
                    <path d="M5 3h14v18l-7-4-7 4V3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                  </svg>
                </button>

                <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); setShowBookmarks(true); }} title="View bookmarks">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 3h14v18l-7-4-7 4V3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                    <path d="M9 10h6M9 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </button>

                <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); setShowSearch(true); }} title="Search in book">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showBookmarks && (
          <BookmarksModal
            bookmarks={bookmarks}
            onJumpTo={handleJumpTo}
            onRemove={removeBookmark}
            onClose={() => setShowBookmarks(false)}
          />
        )}
        {showTOC && (
          <TOCModal
            toc={toc}
            currentChapter={currentChapter}
            onJumpTo={handleJumpTo}
            onClose={() => setShowTOC(false)}
          />
        )}
        {showSearch && (
          <SearchModal
            epubBook={epubBook}
            onJumpTo={handleJumpTo}
            onClose={() => setShowSearch(false)}
          />
        )}
        {showSettings && (
          <ReaderSettingsPanel
            settings={settings}
            updateSetting={updateSetting}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
