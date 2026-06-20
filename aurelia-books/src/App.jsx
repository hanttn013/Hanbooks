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

  useEffect(() => {
    if (!Capacitor.isNativePlatform?.()) return undefined;
    document.body.classList.add('native-app');
    return () => document.body.classList.remove('native-app');
  }, []);

  const goBackInsideApp = useCallback(() => {
    if (detailBookRef.current) {
      setDetailBook(null);
      return true;
    }
    if (openBookRef.current) {
      setOpenBook(null);
      return true;
    }
    if (activeTabRef.current === 'lists' && activeListIdRef.current) {
      setActiveListId(null);
      return true;
    }
    if (activeTabRef.current !== 'home') {
      setActiveTab('home');
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    window.history.replaceState({ hanbooks: true, key: 'home' }, '');
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
      window.history.replaceState({ hanbooks: true, key }, '');
      return;
    }
    if (window.history.state?.key !== key) {
      window.history.pushState({ hanbooks: true, key }, '');
    }
  }, [activeListId, activeTab, detailBook, openBook]);

  useEffect(() => {
    const handlePopState = () => {
      suppressHistoryPushRef.current = true;
      if (!goBackInsideApp()) {
        window.history.replaceState({ hanbooks: true, key: 'home' }, '');
        window.history.pushState({ hanbooks: true, key: 'home-guard' }, '');
      }
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
    CapacitorApp.addListener('backButton', () => {
      suppressHistoryPushRef.current = true;
      if (!goBackInsideApp()) {
        setActiveTab('home');
        setActiveListId(null);
        window.history.replaceState({ hanbooks: true, key: 'home' }, '');
        window.history.pushState({ hanbooks: true, key: 'home-guard' }, '');
      }
    }).then(listener => {
      nativeBackListener = listener;
    }).catch(() => {
      nativeBackListener = null;
    });

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      nativeBackListener?.remove?.();
    };
  }, [goBackInsideApp]);

  const handleOpenBook = (book) => {
    library.updateBook(book.id, {
      lastOpenedAt: Date.now(),
      status: book.status === 'unread' ? 'reading' : book.status,
    });
    setOpenBook(book);
  };

  const handleCloseBook = () => {
    setOpenBook(null);
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
                  if (tab !== 'lists') setActiveListId(null);
                  setDetailBook(null);
                  setActiveTab(tab);
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
                onClose={() => setDetailBook(null)}
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
