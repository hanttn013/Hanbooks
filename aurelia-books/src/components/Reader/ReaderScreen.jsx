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
import { getFontStack, getThemeById } from '../../styles/designTokens';
import styles from './ReaderScreen.module.css';

const PULL_THRESHOLD_RATIO = 0.4;
const PULL_MAX_RATIO = 0.52;

function getThemePalette(theme) {
  const tokens = getThemeById(theme);
  return { bgColor: tokens.bg, textColor: tokens.text };
}

function readerThemeRules(settings) {
  const { bgColor, textColor } = getThemePalette(settings.theme);
  return {
    html: {
      'background': `${bgColor} !important`,
      'color': `${textColor} !important`,
    },
    body: {
      'font-family': `${getFontStack(settings.font)} !important`,
      'font-size': `${settings.fontSize}px !important`,
      'line-height': `${settings.lineHeight} !important`,
      'letter-spacing': `${settings.letterSpacing}px !important`,
      'padding': `${settings.marginWidth}px !important`,
      'background': `${bgColor} !important`,
      'color': `${textColor} !important`,
      'margin': '0 !important',
      'max-width': '760px !important',
      'margin-left': 'auto !important',
      'margin-right': 'auto !important',
      'text-align': 'left !important',
      'font-style': 'normal !important',
      'overflow-wrap': 'break-word !important',
      'word-break': 'normal !important',
    },
    'p, div, span, section, article, h1, h2, h3, h4, h5, h6, li, blockquote': {
      'color': `${textColor} !important`,
      'font-style': 'normal !important',
      'max-width': '100% !important',
    },
    p: {
      'margin': '0 0 1em !important',
      'text-align': 'left !important',
    },
    'section, article': {
      'margin-left': '0 !important',
      'margin-right': '0 !important',
      'padding-left': '0 !important',
      'padding-right': '0 !important',
    },
    img: {
      'display': 'block',
      'max-width': '100% !important',
      'height': 'auto !important',
      'object-fit': 'contain !important',
      'margin': '1em auto !important',
    },
    table: {
      'max-width': '100% !important',
      'overflow-wrap': 'break-word !important',
    },
  };
}

function appendChapterEndMarker(contents, epubBookInstance, settings) {
  if (settings.readingMode !== 'scroll') return;

  const doc = contents?.document;
  const body = doc?.body;
  if (!doc || !body || doc.getElementById('hanbooks-chapter-end')) return;

  const spineItems = epubBookInstance?.spine?.spineItems || [];
  const sectionIndex = contents?.section?.index;
  const hasKnownIndex = Number.isInteger(sectionIndex);
  const hasNext = !hasKnownIndex || sectionIndex < spineItems.length - 1;
  const { bgColor, textColor } = getThemePalette(settings.theme);

  const wrapper = doc.createElement('div');
  wrapper.id = 'hanbooks-chapter-end';
  const isContinuous = (settings.chapterFlow || 'continuous') === 'continuous';

  wrapper.style.cssText = [
    'display:block',
    `margin:${isContinuous ? 10 : 24}px 0 0`,
    `padding:${isContinuous ? '16px 16px 48px' : '24px 16px 64px'}`,
    'min-height:140px',
    `background:${bgColor}`,
    `color:${textColor}`,
    'text-align:center',
    'break-inside:avoid',
    'opacity:0.52',
  ].join(';');

  const hint = doc.createElement('p');
  hint.textContent = hasNext
    ? 'Kéo để sang chương tiếp'
    : 'Bạn đã đọc hết sách';
  hint.style.cssText = [
    'margin:0 auto',
    'opacity:0.5',
    'font:500 13px system-ui,-apple-system,sans-serif',
    'letter-spacing:0',
    'max-width:240px',
  ].join(';');

  wrapper.appendChild(hint);
  body.appendChild(wrapper);
}

function buildScrollState(scrolling, win = null) {
  if (!scrolling) return null;
  const viewport = win?.innerHeight || scrolling.clientHeight || 0;
  const scrollHeight = scrolling.scrollHeight || 0;
  const maxScroll = Math.max(0, scrollHeight - viewport);
  return { win, scrolling, maxScroll };
}

function getScrollState(contents, root) {
  const candidates = [];
  const pushCandidate = (scrolling, win = null) => {
    const state = buildScrollState(scrolling, win);
    if (state) candidates.push(state);
  };

  const doc = contents?.document;
  const win = contents?.window;
  if (doc) {
    pushCandidate(doc.scrollingElement || doc.documentElement || doc.body, win);
    pushCandidate(doc.body, win);
    pushCandidate(doc.documentElement, win);
  }

  if (root) {
    pushCandidate(root, window);
    const iframes = root.querySelectorAll?.('iframe') || [];
    iframes.forEach((iframe) => {
      try {
        const frameDoc = iframe.contentDocument;
        const frameWin = iframe.contentWindow;
        if (frameDoc) {
          pushCandidate(frameDoc.scrollingElement || frameDoc.documentElement || frameDoc.body, frameWin);
          pushCandidate(frameDoc.body, frameWin);
          pushCandidate(frameDoc.documentElement, frameWin);
        }
      } catch {
        // Cross-origin frames are ignored; EPUB content is normally same-origin blob data.
      }
    });

    const elements = root.querySelectorAll?.('*') || [];
    elements.forEach((element) => {
      if (element.scrollHeight > element.clientHeight + 4) {
        pushCandidate(element, null);
      }
    });
  }

  const usable = candidates
    .filter(state => state.scrolling && state.scrolling.clientHeight > 0)
    .sort((a, b) => b.maxScroll - a.maxScroll);
  return usable[0] || null;
}

function getTouchY(event) {
  return event?.touches?.[0]?.clientY ?? event?.changedTouches?.[0]?.clientY ?? null;
}

function pullThresholdPx() {
  const viewport = window.innerHeight || document.documentElement.clientHeight || 720;
  return Math.max(132, Math.round(viewport * PULL_THRESHOLD_RATIO));
}

function pullMaxPx() {
  const viewport = window.innerHeight || document.documentElement.clientHeight || 720;
  return Math.max(176, Math.round(viewport * PULL_MAX_RATIO));
}

export default function ReaderScreen({ book, settings, updateSetting, onClose, onBookUpdate }) {
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
  const [totalPages, setTotalPages] = useState(null);
  const [epubBook, setEpubBook] = useState(null);
  const [chapterPercentage, setChapterPercentage] = useState(0);
  const [chapterProgressAvailable, setChapterProgressAvailable] = useState(false);
  const [previousLocation, setPreviousLocation] = useState(null);
  const [pullVisual, setPullVisual] = useState({ distance: 0, opacity: 0, message: '', direction: 'next' });

  const viewerRef = useRef(null);
  const bookRef = useRef(null);
  const renditionRef = useRef(null);
  const currentChapterRef = useRef('');
  const currentCfiRef = useRef(null);
  const currentContentsRef = useRef(null);
  const currentSpineItemRef = useRef(null);
  const latestBookPercentageRef = useRef(0);
  const isSeekingRef = useRef(false);
  const finishedMarkedRef = useRef(book.status === 'finished');
  const progressTimerRef = useRef(null);
  const pendingProgressRef = useRef(null);
  const contentCleanupRef = useRef([]);
  const pullStartYRef = useRef(null);
  const pullActiveRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const pullDirectionRef = useRef('next');
  const pullFrameRef = useRef(null);
  const pullVisualRef = useRef({ distance: 0, opacity: 0, message: '', direction: 'next' });
  const bookmarkBusyRef = useRef(false);

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

  const rememberCurrentLocation = useCallback(() => {
    const cfi = currentCfiRef.current;
    if (cfi) setPreviousLocation(cfi);
  }, []);

  const getChapterProgressFromLocation = useCallback((loc) => {
    const displayed = loc?.start?.displayed || loc?.displayed;
    if (displayed?.total && displayed.total > 0) {
      const page = Math.max(1, displayed.page || 1);
      return {
        available: true,
        value: Math.min(100, Math.max(0, Math.round((page / displayed.total) * 100))),
      };
    }

    const sectionPercent = loc?.start?.percentage ?? loc?.percentage;
    if (typeof sectionPercent === 'number' && !Number.isNaN(sectionPercent)) {
      return {
        available: true,
        value: Math.min(100, Math.max(0, Math.round(sectionPercent * 100))),
      };
    }

    return { available: false, value: latestBookPercentageRef.current };
  }, []);

  const updateScrollChapterProgress = useCallback((contents) => {
    if (isSeekingRef.current) return false;
    const scrollState = getScrollState(contents, viewerRef.current);
    if (!scrollState) return false;
    if (scrollState.maxScroll <= 0) {
      setChapterProgressAvailable(true);
      setChapterPercentage(100);
      return true;
    }
    const value = Math.min(100, Math.max(0, Math.round((scrollState.scrolling.scrollTop / scrollState.maxScroll) * 100)));
    setChapterProgressAvailable(true);
    setChapterPercentage(value);
    return true;
  }, []);

  const seekWithinScrollChapter = useCallback((value) => {
    const scrollState = getScrollState(currentContentsRef.current, viewerRef.current);
    if (!scrollState || scrollState.maxScroll <= 0) return false;
    const ratio = Math.min(1, Math.max(0, value / 100));
    const top = Math.round(scrollState.maxScroll * ratio);
    scrollState.scrolling.scrollTop = top;
    scrollState.scrolling.scrollTo?.({ top, behavior: 'auto' });
    scrollState.win?.scrollTo?.(0, top);
    scrollState.scrolling.dispatchEvent?.(new Event('scroll', { bubbles: true }));
    setChapterProgressAvailable(true);
    setChapterPercentage(Math.round(ratio * 100));
    window.requestAnimationFrame?.(() => updateScrollChapterProgress(currentContentsRef.current));
    return true;
  }, [updateScrollChapterProgress]);

  const hasNextChapter = useCallback(() => {
    const spineItems = bookRef.current?.spine?.spineItems || [];
    const sectionIndex = currentContentsRef.current?.section?.index;
    if (!spineItems.length || !Number.isInteger(sectionIndex)) return true;
    return sectionIndex < spineItems.length - 1;
  }, []);

  const hasPreviousChapter = useCallback(() => {
    const spineItems = bookRef.current?.spine?.spineItems || [];
    const sectionIndex = currentContentsRef.current?.section?.index;
    if (!spineItems.length || !Number.isInteger(sectionIndex)) return true;
    return sectionIndex > 0;
  }, []);

  const isAtScrollChapterEnd = useCallback(() => {
    const scrollState = getScrollState(currentContentsRef.current, viewerRef.current);
    if (!scrollState) return false;
    return scrollState.maxScroll <= 0 || scrollState.scrolling.scrollTop >= scrollState.maxScroll - 6;
  }, []);

  const isAtScrollChapterStart = useCallback(() => {
    const scrollState = getScrollState(currentContentsRef.current, viewerRef.current);
    if (!scrollState) return false;
    return scrollState.scrolling.scrollTop <= 6;
  }, []);

  const applyPullTransform = useCallback((distance, released = false, direction = 'next') => {
    const doc = currentContentsRef.current?.document;
    const body = doc?.body;
    if (!body) return;
    const translate = Math.min(42, Math.max(0, distance * 0.16));
    const signedTranslate = direction === 'previous' ? translate : -translate;
    // eslint-disable-next-line react-hooks/immutability
    body.style.transition = released ? 'transform 180ms cubic-bezier(.2,.8,.2,1)' : 'none';
    body.style.transform = translate > 0 ? `translate3d(0, ${signedTranslate}px, 0)` : '';
    body.style.willChange = translate > 0 ? 'transform' : '';
    if (released) {
      window.setTimeout(() => {
        if (body.style.transform === '') body.style.transition = '';
      }, 200);
    }
  }, []);

  const schedulePullVisual = useCallback((distance, message, direction = 'next') => {
    const threshold = pullThresholdPx();
    pullVisualRef.current = {
      distance,
      opacity: Math.min(1, Math.max(0, distance / threshold)),
      message,
      direction,
    };
    if (pullFrameRef.current) return;
    pullFrameRef.current = window.requestAnimationFrame(() => {
      pullFrameRef.current = null;
      setPullVisual(pullVisualRef.current);
    });
  }, []);

  const resetPullHint = useCallback(() => {
    pullActiveRef.current = false;
    pullStartYRef.current = null;
    pullDistanceRef.current = 0;
    pullDirectionRef.current = 'next';
    pullVisualRef.current = { distance: 0, opacity: 0, message: '', direction: 'next' };
    if (pullFrameRef.current) {
      window.cancelAnimationFrame(pullFrameRef.current);
      pullFrameRef.current = null;
    }
    setPullVisual(pullVisualRef.current);
    applyPullTransform(0, true, pullDirectionRef.current);
  }, [applyPullTransform]);

  const beginPull = useCallback((event) => {
    if (settings.readingMode !== 'scroll') return;
    pullStartYRef.current = getTouchY(event);
    pullActiveRef.current = false;
    pullDistanceRef.current = 0;
    pullDirectionRef.current = 'next';
    schedulePullVisual(0, '', 'next');
    applyPullTransform(0, false, 'next');
  }, [applyPullTransform, schedulePullVisual, settings.readingMode]);

  const updatePull = useCallback((event, isEdgeSwipe = false) => {
    if (settings.readingMode !== 'scroll' || isEdgeSwipe) return false;
    const startY = pullStartYRef.current;
    const currentY = getTouchY(event);
    if (startY === null || currentY === null) return false;
    const dy = currentY - startY;
    const direction = dy > 0 ? 'previous' : 'next';
    if (Math.abs(dy) < 16 && !pullActiveRef.current) return false;
    if (!pullActiveRef.current) {
      const canPullNext = direction === 'next' && isAtScrollChapterEnd();
      const canPullPrevious = direction === 'previous' && isAtScrollChapterStart();
      if (!canPullNext && !canPullPrevious) return false;
    }

    const threshold = pullThresholdPx();
    const distance = Math.min(pullMaxPx(), Math.max(0, Math.abs(dy) - 16));
    pullActiveRef.current = true;
    pullDistanceRef.current = distance;
    pullDirectionRef.current = direction;
    applyPullTransform(distance, false, direction);
    const message = !hasNextChapter()
      ? 'Bạn đã đọc hết sách'
      : distance >= threshold
        ? 'Thả để sang chương tiếp'
        : 'Kéo để sang chương tiếp';
    const effectiveMessage = direction === 'previous'
      ? (!hasPreviousChapter()
        ? 'Bạn đang ở đầu sách'
        : distance >= threshold
          ? 'Thả để quay lại chương trước'
          : 'Kéo xuống để quay lại chương trước')
      : message;
    schedulePullVisual(distance, effectiveMessage, direction);
    if (event.cancelable) event.preventDefault();
    return true;
  }, [applyPullTransform, hasNextChapter, hasPreviousChapter, isAtScrollChapterEnd, isAtScrollChapterStart, schedulePullVisual, settings.readingMode]);

  const finishPull = useCallback((event) => {
    if (!pullActiveRef.current) return false;
    if (event?.cancelable) event.preventDefault();
    const direction = pullDirectionRef.current;
    const shouldNavigate = pullDistanceRef.current >= pullThresholdPx()
      && (direction === 'next' ? hasNextChapter() : hasPreviousChapter());
    resetPullHint();
    if (shouldNavigate) {
      if (direction === 'next') {
        renditionRef.current?.next?.();
      } else {
        renditionRef.current?.prev?.();
      }
      return true;
    }
    return false;
  }, [hasNextChapter, hasPreviousChapter, resetPullHint]);

  const queueProgressSave = useCallback((cfi, bookPercentage, chapterTitle) => {
    if (!cfi) return;
    pendingProgressRef.current = { cfi, bookPercentage, chapterTitle };
    window.clearTimeout(progressTimerRef.current);
    progressTimerRef.current = window.setTimeout(() => {
      const pending = pendingProgressRef.current;
      if (!pending) return;
      saveProgress(pending.cfi, pending.bookPercentage, pending.chapterTitle);
      pendingProgressRef.current = null;
    }, 1000);
  }, [saveProgress]);

  const saveLatestProgress = useCallback(() => {
    const pending = pendingProgressRef.current;
    window.clearTimeout(progressTimerRef.current);
    progressTimerRef.current = null;
    if (pending) {
      saveProgress(pending.cfi, pending.bookPercentage, pending.chapterTitle);
      pendingProgressRef.current = null;
      return;
    }
    const cfi = currentCfiRef.current;
    if (!cfi) return;
    saveProgress(cfi, latestBookPercentageRef.current, currentChapterRef.current);
  }, [saveProgress]);

  const closeReader = useCallback(() => {
    saveLatestProgress();
    onClose();
  }, [onClose, saveLatestProgress]);

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
        try {
          currentSpineItemRef.current = epubBookInstance.spine?.get(cfi) || null;
        } catch {
          currentSpineItemRef.current = null;
        }
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
            latestBookPercentageRef.current = rounded;
            setPercentage(rounded);
            queueProgressSave(cfi, rounded, currentChapterRef.current);
            if (rounded >= 98 && !finishedMarkedRef.current) {
              finishedMarkedRef.current = true;
              onBookUpdate?.({ status: 'finished' });
            }
          }
          const currentLoc = epubBookInstance.locations.locationFromCfi(cfi);
          const totalLoc = epubBookInstance.locations.total;
          if (currentLoc !== -1) {
            setTotalPages(totalLoc);
          }
        }
        const chapterProgress = getChapterProgressFromLocation(loc);
        setChapterProgressAvailable(chapterProgress.available);
        setChapterPercentage(chapterProgress.value);
      } catch (err) {
        console.warn("Failed to calculate page locations:", err);
        setChapterProgressAvailable(false);
        setChapterPercentage(latestBookPercentageRef.current);
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
          allowScriptedContent: false,
        });

        renditionRef.current = rendition;

        // Apply reading theme inside the EPUB iframe.
        rendition.themes.default(readerThemeRules(settings));
        rendition.hooks.content.register((contents) => {
          contentCleanupRef.current.forEach(cleanup => cleanup());
          contentCleanupRef.current = [];
          currentContentsRef.current = contents;
          appendChapterEndMarker(contents, epubBookInstance, settings);
          const onContentScroll = () => {
            updateScrollChapterProgress(contents);
            setShowControls(false);
            setShowMore(false);
            resetPullHint();
          };
          const onContentTouchStart = (event) => beginPull(event);
          const onContentTouchMove = (event) => updatePull(event, false);
          const onContentTouchEnd = (event) => finishPull(event);

          contents?.window?.addEventListener?.('scroll', onContentScroll, { passive: true });
          contents?.window?.addEventListener?.('touchstart', onContentTouchStart, { passive: true });
          contents?.window?.addEventListener?.('touchmove', onContentTouchMove, { passive: false });
          contents?.window?.addEventListener?.('touchend', onContentTouchEnd, { passive: false });
          contents?.window?.addEventListener?.('touchcancel', onContentTouchEnd, { passive: false });
          contentCleanupRef.current.push(() => {
            contents?.window?.removeEventListener?.('scroll', onContentScroll);
            contents?.window?.removeEventListener?.('touchstart', onContentTouchStart);
            contents?.window?.removeEventListener?.('touchmove', onContentTouchMove);
            contents?.window?.removeEventListener?.('touchend', onContentTouchEnd);
            contents?.window?.removeEventListener?.('touchcancel', onContentTouchEnd);
          });
          window.setTimeout(() => updateScrollChapterProgress(contents), 80);
        });

        epubBookInstance.loaded.navigation.then(nav => {
          if (isMounted && nav?.toc) setToc(nav.toc);
        }).catch(() => { /* ignore navigation error */ });

        rendition.on('relocated', handleRelocated);
        rendition.on('locationChanged', handleRelocated);
        rendition.on('click', (event) => {
          const width = window.innerWidth || viewerRef.current?.clientWidth || 1;
          const x = event?.clientX ?? width / 2;
          if (x >= width * 0.25 && x <= width * 0.75) {
            setShowControls(prev => !prev);
          }
          setShowMore(false);
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
                const rounded = Math.round(pct);
                latestBookPercentageRef.current = rounded;
                setPercentage(rounded);
              }
              const currentLoc = epubBookInstance.locations.locationFromCfi(currentLocationCfi);
              if (currentLoc !== -1) {
                setTotalPages(epubBookInstance.locations.total);
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
      saveLatestProgress();
      stopReading();
      if (displayTimeout) window.clearTimeout(displayTimeout);
      if (locationTimer) window.clearTimeout(locationTimer);
      try {
        rendition?.off?.('relocated', handleRelocated);
        rendition?.off?.('locationChanged', handleRelocated);
        contentCleanupRef.current.forEach(cleanup => cleanup());
        contentCleanupRef.current = [];
        if (pullFrameRef.current) {
          window.cancelAnimationFrame(pullFrameRef.current);
          pullFrameRef.current = null;
        }
        currentContentsRef.current = null;
        epubBookInstance?.destroy();
      } catch (err) {
        console.warn("Error destroying EPUB instance:", err);
      }
      if (revokeUrl) URL.revokeObjectURL(revokeUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id, updateScrollChapterProgress]);

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
      else if (e.key === 'Escape') closeReader();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, closeReader]);

  // Bookmark toggle with visual feedback
  const handleBookmark = useCallback(async () => {
    if (bookmarkBusyRef.current) return;
    const cfi = currentCfiRef.current;
    if (!cfi) return;
    bookmarkBusyRef.current = true;
    const existing = bookmarks.find(b => b.cfi === cfi);
    try {
      if (existing) {
        await removeBookmark(existing.id);
        setBookmarkFeedback('removed');
      } else {
        await addBookmark(cfi, currentChapterRef.current, '');
        setBookmarkFeedback('added');
      }
      window.setTimeout(() => setBookmarkFeedback(null), 1500);
    } finally {
      bookmarkBusyRef.current = false;
    }
  }, [addBookmark, removeBookmark, bookmarks]);

  const handleJumpTo = useCallback((cfi) => {
    if (!cfi) return;
    rememberCurrentLocation();
    renditionRef.current?.display(cfi);
    setShowBookmarks(false);
    setShowTOC(false);
    setShowSearch(false);
  }, [rememberCurrentLocation]);

  const handleSeekChange = useCallback((event) => {
    isSeekingRef.current = true;
    const value = Number(event.target.value);
    if (settings.readingMode === 'scroll') {
      setChapterProgressAvailable(true);
      setChapterPercentage(value);
      seekWithinScrollChapter(value);
      return;
    }
    if (chapterProgressAvailable) setChapterPercentage(value);
    else setPercentage(value);
  }, [chapterProgressAvailable, seekWithinScrollChapter, settings.readingMode]);

  const handleSeekCommit = useCallback((event) => {
    event.stopPropagation();
    const value = Number(event.currentTarget.value);
    const rendition = renditionRef.current;
    if (!rendition) return;
    rememberCurrentLocation();

    if (settings.readingMode === 'scroll' && seekWithinScrollChapter(value)) {
      window.setTimeout(() => {
        isSeekingRef.current = false;
        updateScrollChapterProgress(currentContentsRef.current);
        if (value >= 100) setChapterPercentage(100);
        saveLatestProgress();
      }, value >= 100 ? 180 : 120);
      return;
    }

    const locations = bookRef.current?.locations;
    if (!locations?.total) {
      isSeekingRef.current = false;
      return;
    }

    if (value <= 0) {
      rendition.display(currentSpineItemRef.current?.href || undefined);
      window.setTimeout(() => {
        isSeekingRef.current = false;
        updateScrollChapterProgress(currentContentsRef.current);
        saveLatestProgress();
      }, 160);
      return;
    }

    try {
      const ratio = value >= 100 ? 0.9999 : Math.min(0.999, Math.max(0.001, value / 100));
      if (chapterProgressAvailable && currentSpineItemRef.current?.cfiFromPercentage) {
        const chapterCfi = currentSpineItemRef.current.cfiFromPercentage(ratio);
        if (chapterCfi) {
          rendition.display(chapterCfi);
          return;
        }
      }
      const cfi = locations.cfiFromPercentage(ratio);
      if (cfi) rendition.display(cfi);
    } catch (err) {
      console.warn('Failed to seek reading progress:', err);
    } finally {
      window.setTimeout(() => {
        isSeekingRef.current = false;
        updateScrollChapterProgress(currentContentsRef.current);
        saveLatestProgress();
      }, 120);
    }
  }, [chapterProgressAvailable, rememberCurrentLocation, saveLatestProgress, seekWithinScrollChapter, settings.readingMode, updateScrollChapterProgress]);

  const handleSeekStart = useCallback((event) => {
    event.stopPropagation();
    isSeekingRef.current = true;
    setShowControls(true);
  }, []);

  // Swipe gesture
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const edgeSwipeRef = useRef(false);
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    edgeSwipeRef.current = touchStartX.current < 28;
    beginPull(e);
  };
  const handleTouchMove = (e) => {
    if (touchStartX.current !== null && touchStartY.current !== null) {
      const dxAny = e.touches[0].clientX - touchStartX.current;
      const dyAny = e.touches[0].clientY - touchStartY.current;
      if (Math.abs(dyAny) > 8 && Math.abs(dyAny) > Math.abs(dxAny)) {
        setShowControls(false);
        setShowMore(false);
      }
    }
    if (updatePull(e, edgeSwipeRef.current)) return;
    if (!edgeSwipeRef.current || touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dx > 12 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current !== null && edgeSwipeRef.current) {
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      if (diff > 58 && Math.abs(diff) > Math.abs(dy) * 1.2) {
        e.preventDefault();
        closeReader();
        touchStartX.current = null;
        touchStartY.current = null;
        edgeSwipeRef.current = false;
        return;
      }
    }
    if (settings.readingMode === 'scroll') {
      finishPull(e);
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
    resetPullHint();
  };

  const handleReaderTap = useCallback((event) => {
    const width = window.innerWidth || event.currentTarget.clientWidth || 1;
    const x = event.clientX;
    const left = width * 0.25;
    const right = width * 0.75;
    if (x >= left && x <= right) {
      setShowControls(prev => !prev);
    }
    setShowMore(false);
  }, []);

  const { bgColor, textColor } = getThemePalette(settings.theme);

  const isCurrentBookmarked = isBookmarked(currentCfi);
  const visibleProgress = chapterProgressAvailable ? chapterPercentage : percentage;
  const chapterLabel = currentChapter || book.title;
  const statusLine = (() => {
    if ((settings.readingStatusLine || 'off') === 'off') return '';
    const shortChapter = chapterLabel.length > 32 ? `${chapterLabel.slice(0, 29)}...` : chapterLabel;
    if (settings.readingStatusLine === 'detailed') {
      return `${shortChapter} - ${Math.round(visibleProgress)}% chapter - ${Math.round(percentage)}% book`;
    }
    return `${shortChapter} - ${Math.round(visibleProgress)}%`;
  })();

  return (
    <div
      className={styles.reader}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        '--reader-bg': bgColor,
        '--reader-text': textColor,
        '--reader-font-family': getFontStack(settings.font),
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
            style={{ padding: '12px 28px', background: 'var(--accent)', color: 'var(--accent-contrast)', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
            onClick={closeReader}
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
        onClick={handleReaderTap}
      />

      {settings.readingMode === 'scroll' && pullVisual.opacity > 0 && (
        <div
          className={`${styles.pullIndicator} ${pullVisual.opacity >= 1 ? styles.pullReady : ''} ${pullVisual.direction === 'previous' ? styles.pullPrevious : ''}`}
          style={{
            opacity: pullVisual.opacity,
            transform: `translate3d(-50%, ${
              pullVisual.direction === 'previous'
                ? Math.min(18, pullVisual.distance * 0.06)
                : Math.max(0, 18 - pullVisual.distance * 0.12)
            }px, 0)`,
          }}
        >
          <span />
          <strong>{pullVisual.message}</strong>
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
              <button className={styles.backBtn} onClick={closeReader} title="Back to Library">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <div className={styles.topTitle}>
                <p style={{ fontWeight: 650, fontSize: 14, opacity: 0.9 }}>{chapterLabel}</p>
              </div>
              <div className={styles.moreWrap}>
                <button className={styles.backBtn} onClick={(e) => { e.stopPropagation(); setShowMore(prev => !prev); }} title="More">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h.01M12 12h.01M19 12h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </button>
                {showMore && (
                  <div className={styles.topMoreMenu} onClick={e => e.stopPropagation()}>
                    {previousLocation && (
                      <button onClick={() => { renditionRef.current?.display(previousLocation); setPreviousLocation(null); setShowMore(false); }}>
                        <span>Back to previous location</span>
                      </button>
                    )}
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

          {/* Bottom bar */}
          <div className={styles.bottomBar}>
              {/* Progress row */}
              <div className={styles.progressRow}>
                <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); setShowTOC(true); }} title="Table of Contents">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M4 6h16M4 10h12M4 14h16M4 18h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </button>
                <input
                  className={styles.progressSlider}
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={visibleProgress}
                  disabled={settings.readingMode !== 'scroll' && !totalPages}
                  onPointerDown={handleSeekStart}
                  onTouchStart={handleSeekStart}
                  onClick={e => e.stopPropagation()}
                  onInput={handleSeekChange}
                  onChange={handleSeekChange}
                  onPointerUp={handleSeekCommit}
                  onMouseUp={handleSeekCommit}
                  onTouchEnd={handleSeekCommit}
                  onPointerCancel={() => { isSeekingRef.current = false; }}
                  onBlur={() => { isSeekingRef.current = false; }}
                  onKeyUp={handleSeekCommit}
                  aria-label={chapterProgressAvailable ? 'Chapter progress' : 'Book progress'}
                />
                <span style={{ fontSize: 11, opacity: 0.6, fontWeight: 500 }}>
                  {chapterProgressAvailable ? `${Math.round(visibleProgress)}%` : `${Math.round(percentage)}% book`}
                </span>
                <button
                  className={`${styles.actionBtn} ${isCurrentBookmarked ? styles.actionActive : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleBookmark(); }}
                  title={isCurrentBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                >
                  <svg width="18" height="20" viewBox="0 0 24 24" fill={isCurrentBookmarked ? 'currentColor' : 'none'}>
                    <path d="M5 3h14v18l-7-4-7 4V3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}
                  title="Reading settings"
                >
                  <span className={styles.aaLabel}>Aa</span>
                </button>
              </div>
              {statusLine && <div className={styles.statusLine}>{statusLine}</div>}
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
