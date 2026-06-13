// src/components/Reader/ReaderScreen.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import ePub from 'epubjs';
import { useReader } from '../../hooks/useReader';
import BookmarksModal from './BookmarksModal';
import TOCModal from './TOCModal';
import SearchModal from './SearchModal';
import ReaderSettingsPanel from './ReaderSettingsPanel';
import { StorageManager } from '../../utils/StorageManager';
import styles from './ReaderScreen.module.css';

function getThemePalette(theme) {
  const bgColor = {
    'warm-cream': '#F5F0E8', 'pure-white': '#FFFFFF', 'vintage-paper': '#F5EDD6',
    'sepia': '#F1E4C3', 'dark-gray': '#2A2A2A', 'amoled-black': '#000000',
    'forest': '#1C3329', 'ocean': '#E8F4F8', 'midnight-blue': '#1A2035',
  }[theme] || '#F5F0E8';

  const textColor = {
    'warm-cream': '#2C2416', 'pure-white': '#1A1A1A', 'vintage-paper': '#3D2B1F',
    'sepia': '#3B2F0A', 'dark-gray': '#E8E0D0', 'amoled-black': '#E0D8C8',
    'forest': '#E8F0E8', 'ocean': '#1A3040', 'midnight-blue': '#D8E0F0',
  }[theme] || '#2C2416';

  return { bgColor, textColor };
}

function readerThemeRules(settings) {
  const { bgColor, textColor } = getThemePalette(settings.theme);
  return {
    html: {
      'background': `${bgColor} !important`,
      'color': `${textColor} !important`,
    },
    body: {
      'font-family': `'${settings.font}', Georgia, serif !important`,
      'font-size': `${settings.fontSize}px !important`,
      'line-height': `${settings.lineHeight} !important`,
      'letter-spacing': `${settings.letterSpacing}px !important`,
      'padding': `${settings.marginWidth}px !important`,
      'background': `${bgColor} !important`,
      'color': `${textColor} !important`,
      'margin': '0 !important',
      'text-align': 'left !important',
      'font-style': 'normal !important',
    },
    'p, div, span, section, article, h1, h2, h3, h4, h5, h6, li': {
      'color': `${textColor} !important`,
      'font-style': 'normal !important',
    },
    p: {
      'margin-bottom': '1em',
      'text-align': 'left !important',
    },
    img: { 'max-width': '100%' },
  };
}

function appendNextChapterControl(contents, epubBookInstance, rendition, settings) {
  if (settings.readingMode !== 'scroll') return;

  const doc = contents?.document;
  const body = doc?.body;
  if (!doc || !body || doc.getElementById('hanbooks-next-chapter')) return;

  const spineItems = epubBookInstance?.spine?.spineItems || [];
  const sectionIndex = contents?.section?.index;
  const hasKnownIndex = Number.isInteger(sectionIndex);
  const hasNext = !hasKnownIndex || sectionIndex < spineItems.length - 1;
  const { bgColor, textColor } = getThemePalette(settings.theme);

  const wrapper = doc.createElement('div');
  wrapper.id = 'hanbooks-next-chapter';
  wrapper.style.cssText = [
    'display:block',
    'margin:48px 0 0',
    'padding:56px 16px 72px',
    `background:${bgColor}`,
    `color:${textColor}`,
    'text-align:center',
    'border-top:1px solid rgba(139,105,20,0.22)',
    'break-inside:avoid',
  ].join(';');

  const hint = doc.createElement('p');
  hint.textContent = hasNext ? 'Keo len de sang chuong tiep theo' : 'Ban da doc den cuoi sach';
  hint.style.cssText = [
    'margin:0 0 16px',
    'opacity:0.62',
    'font:500 14px system-ui,-apple-system,sans-serif',
    'letter-spacing:0',
  ].join(';');

  const button = doc.createElement('button');
  button.type = 'button';
  button.textContent = hasNext ? 'Chuong tiep theo' : 'Het sach';
  button.disabled = !hasNext;
  button.style.cssText = [
    'min-height:48px',
    'min-width:176px',
    'padding:0 22px',
    'border-radius:24px',
    'border:1px solid rgba(139,105,20,0.55)',
    hasNext ? 'background:#8B6914' : 'background:transparent',
    hasNext ? 'color:#FFF8EC' : `color:${textColor}`,
    'font:600 15px system-ui,-apple-system,sans-serif',
    hasNext ? 'opacity:1' : 'opacity:0.45',
  ].join(';');

  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (hasNext) rendition?.next?.();
  });

  wrapper.appendChild(hint);
  wrapper.appendChild(button);
  body.appendChild(wrapper);
}

export default function ReaderScreen({ book, settings, updateSetting, onClose }) {
  const [showControls, setShowControls] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [currentCfi, setCurrentCfi] = useState(null);
  const [currentChapter, setCurrentChapter] = useState('');
  const [percentage, setPercentage] = useState(0);
  const [toc, setToc] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookmarkFeedback, setBookmarkFeedback] = useState(null); // 'added' | 'removed'
  const [currentPage, setCurrentPage] = useState(null);
  const [totalPages, setTotalPages] = useState(null);
  const [epubBook, setEpubBook] = useState(null);

  const viewerRef = useRef(null);
  const bookRef = useRef(null);
  const renditionRef = useRef(null);
  const currentChapterRef = useRef('');
  const currentCfiRef = useRef(null);

  const {
    saveProgress,
    addBookmark,
    removeBookmark,
    bookmarks,
    isBookmarked,
    startReading,
    stopReading,
  } = useReader(book.id);

  // Determine EPUB source. epub.js is more reliable with ArrayBuffer for IndexedDB blobs.
  const getEpubSource = async () => {
    if (book.isDemo && book.epubUrl) {
      return {
        source: book.epubUrl,
        revokeUrl: null,
      };
    }
    if (book.fileBlob && book.fileBlob.size > 0) {
      return {
        source: await book.fileBlob.arrayBuffer(),
        revokeUrl: null,
      };
    }
    if (book.epubUrl) {
      return {
        source: book.epubUrl,
        revokeUrl: null,
      };
    }
    return { source: null, revokeUrl: null };
  };

  useEffect(() => {
    let isMounted = true;
    let revokeUrl = null;
    let epubBookInstance = null;
    let rendition = null;
    let displayTimeout = null;
    let locationTimer = null;

    const withTimeout = (promise, ms, message) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => {
          displayTimeout = window.setTimeout(() => reject(new Error(message)), ms);
        }),
      ]).finally(() => {
        if (displayTimeout) {
          window.clearTimeout(displayTimeout);
          displayTimeout = null;
        }
      });
    };

    const handleRelocated = (loc) => {
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
      }).catch(() => { /* ignore nav load failure */ });

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
    };

    const initReader = async () => {
      try {
        const epubSource = await getEpubSource();
        if (!isMounted) return;
        revokeUrl = epubSource.revokeUrl;

        if (!epubSource.source || !viewerRef.current) {
          setError("Unable to find the EPUB resource URL.");
          setIsLoading(false);
          return;
        }

        epubBookInstance = ePub(epubSource.source);
        bookRef.current = epubBookInstance;
        setEpubBook(epubBookInstance);

        rendition = epubBookInstance.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          flow: settings.readingMode === 'scroll' ? 'scrolled-doc' : 'paginated',
          spread: 'none',
          allowScriptedContent: true,
        });

        renditionRef.current = rendition;

        // Apply reading theme inside the EPUB iframe.
        rendition.themes.default(readerThemeRules(settings));
        rendition.hooks.content.register((contents) => {
          appendNextChapterControl(contents, epubBookInstance, rendition, settings);
        });

        epubBookInstance.loaded.navigation.then(nav => {
          if (isMounted && nav?.toc) setToc(nav.toc);
        }).catch(() => { /* ignore navigation error */ });

        rendition.on('relocated', handleRelocated);
        rendition.on('locationChanged', handleRelocated);
        rendition.on('click', () => {
          setShowControls(prev => !prev);
        });

        const savedProgress = await StorageManager.getProgress(book.id);
        const cfi = savedProgress?.cfi || undefined;

        try {
          await withTimeout(rendition.display(cfi), 12000, 'Timed out restoring saved reading position.');
        } catch (displayErr) {
          console.warn("Failed to restore saved reading position, opening from the start:", displayErr);
          await withTimeout(rendition.display(), 12000, 'Timed out opening the EPUB.');
        }

        if (!isMounted) return;
        setIsLoading(false);
        startReading();

        locationTimer = window.setTimeout(() => {
          epubBookInstance.ready
          .then(() => epubBookInstance.locations.generate(3000))
          .then(() => {
            if (!isMounted) return;
            setTotalPages(epubBookInstance.locations.total);

            const loc = rendition.currentLocation();
            const currentLocationCfi = loc?.start?.cfi || loc?.cfi;
            if (currentLocationCfi && epubBookInstance.locations) {
              const pct = epubBookInstance.locations.percentageFromCfi(currentLocationCfi) * 100;
              if (!isNaN(pct) && pct >= 0) {
                setPercentage(Math.round(pct));
              }
              const currentLoc = epubBookInstance.locations.locationFromCfi(currentLocationCfi);
              if (currentLoc !== -1) {
                setCurrentPage(Math.max(1, currentLoc));
              }
            }
          })
          .catch((err) => {
            console.warn("Background location generation failed:", err);
          });
        }, 1800);
      } catch (err) {
        console.error("Critical EPUB display failure:", err);
        if (!isMounted) return;
        setError(err.message || "Could not open this EPUB.");
        setIsLoading(false);
      }
    };

    initReader();

    return () => {
      isMounted = false;
      stopReading();
      if (displayTimeout) window.clearTimeout(displayTimeout);
      if (locationTimer) window.clearTimeout(locationTimer);
      try {
        rendition?.off?.('relocated', handleRelocated);
        rendition?.off?.('locationChanged', handleRelocated);
        epubBookInstance?.destroy();
      } catch (err) {
        console.warn("Error destroying EPUB instance:", err);
      }
      if (revokeUrl) URL.revokeObjectURL(revokeUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id]);

  // Re-apply typography when settings change (without re-mounting epub)
  useEffect(() => {
    if (!renditionRef.current) return;
    try {
      renditionRef.current.themes.default(readerThemeRules(settings));
    } catch (err) {
      console.warn("Failed to apply typography setting:", err);
    }
  }, [settings]);

  useEffect(() => {
    if (!renditionRef.current) return;
    try {
      renditionRef.current.flow(settings.readingMode === 'scroll' ? 'scrolled-doc' : 'paginated');
      if (currentCfiRef.current) {
        renditionRef.current.display(currentCfiRef.current);
      }
    } catch (err) {
      console.warn("Failed to switch reading mode:", err);
    }
  }, [settings.readingMode]);

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

  const handleSeekChange = useCallback((event) => {
    setPercentage(Number(event.target.value));
  }, []);

  const handleSeekCommit = useCallback((event) => {
    const value = Number(event.currentTarget.value);
    const rendition = renditionRef.current;
    const locations = bookRef.current?.locations;
    if (!rendition || !locations?.total) return;

    if (value <= 0) {
      rendition.display();
      return;
    }

    try {
      const ratio = Math.min(0.999, Math.max(0.001, value / 100));
      const cfi = locations.cfiFromPercentage(ratio);
      if (cfi) rendition.display(cfi);
    } catch (err) {
      console.warn('Failed to seek reading progress:', err);
    }
  }, []);

  // Swipe gesture
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const edgeSwipeRef = useRef(false);
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    edgeSwipeRef.current = touchStartX.current < 28;
  };
  const handleTouchMove = (e) => {
    if (!edgeSwipeRef.current || touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dx > 12 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  const handleTouchEnd = (e) => {
    if (settings.readingMode === 'scroll') {
      touchStartX.current = null;
      touchStartY.current = null;
      edgeSwipeRef.current = false;
      return;
    }
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0) goNext(); else goPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
    edgeSwipeRef.current = false;
  };

  const { bgColor, textColor } = getThemePalette(settings.theme);

  const isCurrentBookmarked = isBookmarked(currentCfi);

  return (
    <div
      className={styles.reader}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        '--reader-bg': bgColor,
        '--reader-text': textColor,
      }}
    >
      {/* Loading */}
      {isLoading && (
        <div className={styles.loading} style={{ backgroundColor: bgColor }}>
          <div className={styles.loadingSpinner} />
          <p style={{ marginTop: 16, fontSize: 14, opacity: 0.5, color: textColor }}>
            Opening {book.title}...
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>Book</p>
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
        className={`${styles.viewer} ${settings.readingMode === 'scroll' ? styles.scrollViewer : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => { setShowControls(prev => !prev); setShowMore(false); }}
      />

      {/* Page navigation zones */}
      {settings.readingMode !== 'scroll' && (
        <>
          <div className={styles.prevZone} onClick={(e) => { e.stopPropagation(); goPrev(); }} />
          <div className={styles.nextZone} onClick={(e) => { e.stopPropagation(); goNext(); }} />
        </>
      )}

      {/* Bookmark feedback toast */}
      {bookmarkFeedback && (
        <div className={styles.bookmarkToast}>
          {bookmarkFeedback === 'added' ? 'Bookmark added' : 'Bookmark removed'}
        </div>
      )}

      {/* Controls overlay */}
      {showControls && (
        <>
          {/* Top bar */}
          <div className={styles.topBar}>
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
            </div>

          {/* Bottom bar */}
          <div className={styles.bottomBar}>
              {/* Progress row */}
              <div className={styles.progressRow}>
                <span style={{ fontSize: 11, opacity: 0.4 }}>
                  {currentPage ? `Page ${currentPage}` : '0%'}
                </span>
                <input
                  className={styles.progressSlider}
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={percentage}
                  disabled={!totalPages}
                  onChange={handleSeekChange}
                  onPointerUp={handleSeekCommit}
                  onTouchEnd={handleSeekCommit}
                  onKeyUp={handleSeekCommit}
                  aria-label="Reading progress"
                />
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

                <div className={styles.moreWrap}>
                  <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); setShowMore(prev => !prev); }} title="More">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h.01M12 12h.01M19 12h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                  </button>
                  {showMore && (
                    <div className={styles.moreMenu} onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setShowSearch(true); setShowMore(false); }}>
                        <span>Search in book</span>
                      </button>
                      <button onClick={() => { setShowBookmarks(true); setShowMore(false); }}>
                        <span>Bookmarks ({bookmarks.length})</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
        </>
      )}

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
            currentCfi={currentCfi}
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
    </div>
  );
}
