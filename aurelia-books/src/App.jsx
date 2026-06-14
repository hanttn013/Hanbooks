// src/App.jsx
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TabBar from './components/TabBar/TabBar';
import HomeScreen from './components/Home/HomeScreen';
import LibraryScreen from './components/Library/LibraryScreen';
import BookDetailModal from './components/Library/BookDetailModal';
import ListsScreen from './components/Lists/ListsScreen';
import SettingsScreen from './components/Settings/SettingsScreen';
import ReaderScreen from './components/Reader/ReaderScreen';
import { useLibrary } from './hooks/useLibrary';
import { useSettings } from './hooks/useSettings';
import './styles/globals.css';
import './styles/themes.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [openBook, setOpenBook] = useState(null);
  const [detailBook, setDetailBook] = useState(null);
  const [activeListId, setActiveListId] = useState(null);

  const library = useLibrary();
  const { settings, updateSetting } = useSettings();
  const currentDetailBook = detailBook
    ? library.allBooksRaw.find(book => book.id === detailBook.id) || detailBook
    : null;
  const instantMotion = settings.reducedMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 1 }, transition: { duration: 0 } }
    : null;

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
              <ReaderScreen
                key={`reader-${openBook.id}`}
                book={openBook}
                settings={settings}
                updateSetting={updateSetting}
                onBookUpdate={(updates) => library.updateBook(openBook.id, updates)}
                onClose={handleCloseBook}
              />
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
                      <ListsScreen
                        library={library}
                        activeListId={activeListId}
                        setActiveListId={setActiveListId}
                        onOpenBook={handleOpenBook}
                        onOpenBookInfo={handleOpenBookInfo}
                      />
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
                      <SettingsScreen
                        settings={settings}
                        updateSetting={updateSetting}
                        library={library}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tab bar */}
              <TabBar
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {currentDetailBook && !openBook && (
            <BookDetailModal
              key={currentDetailBook.id}
              book={currentDetailBook}
              onClose={() => setDetailBook(null)}
              onOpen={handleOpenBook}
              library={library}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
