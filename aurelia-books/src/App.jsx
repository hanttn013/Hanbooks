// src/App.jsx
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import TabBar from './components/TabBar/TabBar';
import HomeScreen from './components/Home/HomeScreen';
import LibraryScreen from './components/Library/LibraryScreen';
import { useLibrary } from './hooks/useLibrary';
import { useSettings } from './hooks/useSettings';
import { initializeNativeShareTarget } from './utils/nativeShareTarget';
import './styles/globals.css';
import './styles/themes.css';
import { Provider } from '@react-spectrum/s2/Provider';
import { Skeleton } from '@react-spectrum/s2/Skeleton';
import { ToastContainer, ToastQueue } from '@react-spectrum/s2/Toast';
import { translate } from './i18n/messages';
import I18nProvider from './i18n/I18nProvider';
import { useI18n } from './i18n/context';
import './styles/spectrum.css';
import FeedbackProvider from './components/UI/FeedbackProvider';
import { afterOverlaysClosed, consumeOverlayPop, dismissTopOverlay } from './components/UI/overlayNavigation';

const BookDetailModal = lazy(() => import('./components/Library/BookDetailModal'));
const ListsScreen = lazy(() => import('./components/Lists/ListsScreen'));
const SettingsScreen = lazy(() => import('./components/Settings/SettingsScreen'));
const ReaderScreen = lazy(() => import('./components/Reader/ReaderScreen'));

function PerfFallback() {
  const { t } = useI18n();
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
      <div><Skeleton isLoading><div style={{ width: 200, height: 72, borderRadius: 8, background: 'var(--bg-secondary)' }} /></Skeleton><p role="status" style={{ marginTop: 16 }}>{t('Loading...')}</p></div>
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
  const { addBook } = library;
  const { settings, updateSetting, colorScheme } = useSettings();
  const currentDetailBook = detailBook
    ? library.allBooksRaw.find(book => book.id === detailBook.id) || detailBook
    : null;

  useEffect(() => {
    let active = true;
    let cleanup = () => {};
    initializeNativeShareTarget(async files => {
      let imported = 0;
      let skipped = 0;
      let failed = 0;
      for (const file of files) {
        try {
          const result = await addBook(file, null, { fastMetadata: true });
          if (result.skippedDuplicate) skipped += 1;
          else imported += 1;
        } catch { failed += 1; }
      }
      ToastQueue.info(translate(settings.language, 'sharedSummary', { imported, skipped, failed }));
    }).then(remove => {
      if (active) cleanup = remove;
      else remove();
    }).catch(error => console.warn('Native share target is unavailable:', error));
    return () => {
      active = false;
      cleanup();
    };
  }, [addBook, settings.language]);

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
    if (container) {
      const key = `${activeTabRef.current}:${activeListIdRef.current || ''}`;
      scrollPositionsRef.current.set(key, container.scrollTop);
      if (window.history.state?.shanbooks) window.history.replaceState({ ...window.history.state, scrollTop: container.scrollTop }, '');
    }
  }, []);

  const restoreScroll = useCallback((tab, listId = null, savedScroll) => {
    window.requestAnimationFrame(() => {
      const container = document.querySelector('#phone-frame .screen-scroll');
      if (container) container.scrollTop = savedScroll ?? scrollPositionsRef.current.get(`${tab}:${listId || ''}`) ?? 0;
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
      window.history.pushState(historySnapshot(key), '');
    }
  }, [activeListId, activeTab, captureScroll, detailBook, historySnapshot, openBook]);

  useEffect(() => {
    const handlePopState = (event) => {
      if (consumeOverlayPop(event)) return;
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
      restoreScroll(nextTab, state.activeListId, state.scrollTop);
    };

    const handleTouchStart = (event) => {
      if (event.touches?.length !== 1) { edgeTouchRef.current = null; return; }
      const touch = event.touches?.[0];
      edgeTouchRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
    };

    const handleTouchMove = (event) => {
      if (event.touches?.length !== 1) { edgeTouchRef.current = null; return; }
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
      if (dismissTopOverlay()) return;
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
    captureScroll();
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
    captureScroll();
    setDetailBook(book);
  };

  const handleOpenList = (id) => {
    captureScroll();
    setActiveListId(id);
    setActiveTab('lists');
  };

  return (
    <I18nProvider locale={settings.language}>
    <Provider locale={settings.language === 'vi' ? 'vi-VN' : 'en-US'} colorScheme={colorScheme}>
    <FeedbackProvider>
    <div style={{
      background: 'var(--bg-primary, #EDE8DC)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div id="phone-frame" data-app-theme={colorScheme}>
        {!openBook && <a className="skip-link" href="#app-content" onClick={event => { event.preventDefault(); document.getElementById('app-content')?.focus(); }}>{translate(settings.language, 'Skip to content')}</a>}
        <>
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
            <div
              key="app-shell"
              className="app-shell"
            >
              {/* Screen area */}
              <div id="app-content" className="app-content" tabIndex={-1}>
                <>
                  {activeTab === 'home' && (
                    <div
                      key="home"
                      style={{ position: 'absolute', inset: 0 }}
                    >
                      <HomeScreen
                        library={library}
                        onOpenBook={handleOpenBook}
                        onOpenBookInfo={handleOpenBookInfo}
                        onOpenList={handleOpenList}
                        onGoLibrary={() => setActiveTab('library')}
                        onGoLists={() => setActiveTab('lists')}
                      />
                    </div>
                  )}
                  {activeTab === 'library' && (
                    <div
                      key="library"
                      style={{ position: 'absolute', inset: 0 }}
                    >
                      <LibraryScreen
                        library={library}
                        onOpenBook={handleOpenBook}
                        onOpenBookInfo={handleOpenBookInfo}
                        onGoLists={() => setActiveTab('lists')}
                      />
                    </div>
                  )}
                  {activeTab === 'lists' && (
                    <div
                      key="lists"
                      style={{ position: 'absolute', inset: 0 }}
                    >
                      <Suspense fallback={<PerfFallback />}>
                      <ListsScreen
                        library={library}
                        activeListId={activeListId}
                        setActiveListId={(id) => {
                          afterOverlaysClosed(() => {
                          captureScroll();
                          if (!id && activeListIdRef.current && window.history.state?.shanbooks) window.history.back();
                          else setActiveListId(id);
                          });
                        }}
                        onOpenBook={handleOpenBook}
                        onOpenBookInfo={handleOpenBookInfo}
                      />
                      </Suspense>
                    </div>
                  )}
                  {activeTab === 'settings' && (
                    <div
                      key="settings"
                      style={{ position: 'absolute', inset: 0 }}
                    >
                      <Suspense fallback={<PerfFallback />}>
                      <SettingsScreen
                        settings={settings}
                        updateSetting={updateSetting}
                        library={library}
                      />
                      </Suspense>
                    </div>
                  )}
                </>
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
            </div>
          )}
        </>
        <>
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
        </>
      </div>
    </div>
    <ToastContainer placement="bottom end" />
    </FeedbackProvider>
    </Provider>
    </I18nProvider>
  );
}
