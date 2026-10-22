// src/App.jsx
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import TabBar from './components/TabBar/TabBar';
import HomeScreen from './components/Home/HomeScreen';
import LibraryScreen from './components/Library/LibraryScreen';
import { useLibrary } from './hooks/useLibrary';
import { useSettings } from './hooks/useSettings';
import './styles/fonts.css';
import './styles/globals.css';
import './styles/themes.css';

const BookDetailModal = lazy(() => import('./components/Library/BookDetailModal'));
const ListsScreen = lazy(() => import('./components/Lists/ListsScreen'));
const SettingsScreen = lazy(() => import('./components/Settings/SettingsScreen'));
const ReaderScreen = lazy(() => import('./components/Reader/ReaderScreen'));

function PerfFallback() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'grid',
      placeItems: 'center',
      background: 'var(--bg-primary)',
      color: 'var(--text-secondary)',
      fontSize: 13,
      fontWeight: 700,
    }}>
      Loading...
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [openBook, setOpenBook] = useState(null);
  const [detailBook, setDetailBook] = useState(null);
  const [activeListId, setActiveListId] = useState(null);
  const activeTabRef = useRef(activeTab);
  const openBookRef = useRef(openBook);
  const detailBookRef = useRef(detailBook);
  const activeListIdRef = useRef(activeListId);
  const suppressHistoryPushRef = useRef(false);
  const edgeTouchRef = useRef(null);
  const scrollPositionsRef = useRef(new Map());
  const libraryBooksRef = useRef([]);

  const library = useLibrary();
  const { settings, updateSetting } = useSettings();
  const currentDetailBook = detailBook
    ? library.allBooksRaw.find(book => book.id === detailBook.id) || detailBook
    : null;
  const instantMotion = settings.reducedMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 1 }, transition: { duration: 0 } }
    : null;

  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { openBookRef.current = openBook; }, [openBook]);
  useEffect(() => { detailBookRef.current = detailBook; }, [detailBook]);
  useEffect(() => { activeListIdRef.current = activeListId; }, [activeListId]);
  useEffect(() => { libraryBooksRef.current = library.allBooksRaw; }, [library.allBooksRaw]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform?.()) return undefined;
    document.body.classList.add('native-app');
    return () => document.body.classList.remove('native-app');
  }, []);

  const captureScroll = useCallback(() => {
    const container = document.querySelector('#phone-frame .screen-scroll');
    if (container) scrollPositionsRef.current.set(activeTabRef.current, container.scrollTop);
  }, []);

  const restoreScroll = useCallback((tab) => {
    window.requestAnimationFrame(() => {
      const container = document.querySelector('#phone-frame .screen-scroll');
      if (container) container.scrollTop = scrollPositionsRef.current.get(tab) || 0;
    });
  }, []);

  const historySnapshot = useCallback((key) => ({
    shanbooks: true,
    key,
    activeTab,
    activeListId,
    detailBookId: detailBook?.id || null,
    openBookId: openBook?.id || null,
  }), [activeListId, activeTab, detailBook, openBook]);

  useEffect(() => {
    window.history.replaceState({
      shanbooks: true,
      key: 'home',
      activeTab: 'home',
      activeListId: null,
      detailBookId: null,
      openBookId: null,
    }, '');
  }, []);

  useEffect(() => {
    const key = openBook
      ? `reader:${openBook.id}`
      : detailBook
        ? `detail:${detailBook.id}`
        : activeTab === 'lists' && activeListId
          ? `lists:${activeListId}`
          : activeTab;

    if (suppressHistoryPushRef.current) {
      suppressHistoryPushRef.current = false;
      window.history.replaceState(historySnapshot(key), '');
      return;
    }
    if (window.history.state?.key !== key) {
      captureScroll();
      window.history.pushState(historySnapshot(key), '');
    }
  }, [activeListId, activeTab, captureScroll, detailBook, historySnapshot, openBook]);

  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state;
      if (!state?.shanbooks) return;
      suppressHistoryPushRef.current = true;
      const nextTab = state.activeTab || 'home';
      setActiveTab(nextTab);
      setActiveListId(state.activeListId || null);
      setDetailBook(state.detailBookId
        ? libraryBooksRef.current.find(book => book.id === state.detailBookId) || null
        : null);
      setOpenBook(state.openBookId
        ? libraryBooksRef.current.find(book => book.id === state.openBookId) || null
        : null);
      restoreScroll(nextTab);
    };

    const handleTouchStart = (event) => {
      const touch = event.touches?.[0];
      edgeTouchRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
    };

    const handleTouchMove = (event) => {
      const start = edgeTouchRef.current;
      const touch = event.touches?.[0];
      if (!start || !touch || start.x > 26) return;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (dx > 18 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        event.preventDefault();
      }
    };

    let nativeBackListener = null;
    let disposed = false;
    CapacitorApp.addListener('backButton', () => {
      const hasInternalView = Boolean(openBookRef.current)
        || Boolean(detailBookRef.current)
        || Boolean(activeListIdRef.current)
        || activeTabRef.current !== 'home';
      if (hasInternalView) window.history.back();
      else CapacitorApp.exitApp();
    }).then(listener => {
      if (disposed) listener.remove();
      else nativeBackListener = listener;
    }).catch(() => {
      nativeBackListener = null;
    });

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      disposed = true;
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      nativeBackListener?.remove?.();
    };
  }, [restoreScroll]);

  const handleOpenBook = (book) => {
    library.updateBook(book.id, {
      lastOpenedAt: Date.now(),
      status: book.status === 'unread' ? 'reading' : book.status,
    });
    setOpenBook(book);
  };

  const handleCloseBook = () => {
    if (window.history.state?.shanbooks) window.history.back();
    else setOpenBook(null);
  };

  const handleOpenBookInfo = (book) => {
    setDetailBook(book);
  };

  const handleOpenList = (id) => {
    setActiveListId(id);
    setActiveTab('lists');
  };

  return (
    <div style={{
      background: 'var(--bg-primary, #EDE8DC)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div id="phone-frame" data-theme={settings.theme}>
        <AnimatePresence mode="wait">
          {openBook ? (
            <Suspense fallback={<PerfFallback />}>
              <ReaderScreen
                key={`reader-${openBook.id}`}
                book={openBook}
                settings={settings}
                updateSetting={updateSetting}
                onBookUpdate={(updates) => library.updateBook(openBook.id, updates)}
                onClose={handleCloseBook}
              />
            </Suspense>
          ) : (
            <motion.div
              key="app-shell"
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              initial={settings.reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={settings.reducedMotion ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: settings.reducedMotion ? 0 : 0.2 }}
            >
              {/* Screen area */}
              <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                <AnimatePresence mode="wait">
                  {activeTab === 'home' && (
                    <motion.div
                      key="home"
                      style={{ position: 'absolute', inset: 0 }}
                      {...(instantMotion || {
                        initial: { opacity: 0, x: -16 },
                        animate: { opacity: 1, x: 0 },
                        exit: { opacity: 0, x: -16 },
                        transition: { duration: 0.16 },
                      })}
                    >
                      <HomeScreen
                        library={library}
                        onOpenBook={handleOpenBook}
                        onOpenBookInfo={handleOpenBookInfo}
                        onOpenList={handleOpenList}
                        onGoLibrary={() => setActiveTab('library')}
                        onGoLists={() => setActiveTab('lists')}
                      />
                    </motion.div>
                  )}
                  {activeTab === 'library' && (
                    <motion.div
                      key="library"
                      style={{ position: 'absolute', inset: 0 }}
                      {...(instantMotion || {
                        initial: { opacity: 0, x: -16 },
                        animate: { opacity: 1, x: 0 },
                        exit: { opacity: 0, x: -16 },
                        transition: { duration: 0.16 },
                      })}
                    >
                      <LibraryScreen
                        library={library}
                        onOpenBook={handleOpenBook}
                        onOpenBookInfo={handleOpenBookInfo}
                        onGoLists={() => setActiveTab('lists')}
                      />
                    </motion.div>
                  )}
                  {activeTab === 'lists' && (
                    <motion.div
                      key="lists"
                      style={{ position: 'absolute', inset: 0 }}
                      {...(instantMotion || {
                        initial: { opacity: 0, x: 16 },
                        animate: { opacity: 1, x: 0 },
                        exit: { opacity: 0 },
                        transition: { duration: 0.16 },
                      })}
                    >
                      <Suspense fallback={<PerfFallback />}>
                      <ListsScreen
                        library={library}
                        activeListId={activeListId}
                        setActiveListId={setActiveListId}
                        onOpenBook={handleOpenBook}
                        onOpenBookInfo={handleOpenBookInfo}
                      />
                      </Suspense>
                    </motion.div>
                  )}
                  {activeTab === 'settings' && (
                    <motion.div
                      key="settings"
                      style={{ position: 'absolute', inset: 0 }}
                      {...(instantMotion || {
                        initial: { opacity: 0, y: 16 },
                        animate: { opacity: 1, y: 0 },
                        exit: { opacity: 0, y: 16 },
                        transition: { duration: 0.16 },
                      })}
                    >
                      <Suspense fallback={<PerfFallback />}>
                      <SettingsScreen
                        settings={settings}
                        updateSetting={updateSetting}
                        library={library}
                      />
                      </Suspense>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tab bar */}
              <TabBar
                activeTab={activeTab}
                onTabChange={(tab) => {
                  captureScroll();
                  if (tab !== 'lists') setActiveListId(null);
                  setDetailBook(null);
                  setActiveTab(tab);
                  restoreScroll(tab);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {currentDetailBook && !openBook && (
            <Suspense fallback={null}>
              <BookDetailModal
                key={currentDetailBook.id}
                book={currentDetailBook}
                onClose={() => {
                  if (window.history.state?.shanbooks) window.history.back();
                  else setDetailBook(null);
                }}
                onOpen={handleOpenBook}
                library={library}
              />
            </Suspense>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
