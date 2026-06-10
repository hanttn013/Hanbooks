// src/App.jsx
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TabBar from './components/TabBar/TabBar';
import LibraryScreen from './components/Library/LibraryScreen';
import ContinueScreen from './components/Continue/ContinueScreen';
import AppearanceScreen from './components/Appearance/AppearanceScreen';
import ReaderScreen from './components/Reader/ReaderScreen';
import { useLibrary } from './hooks/useLibrary';
import { useSettings } from './hooks/useSettings';
import './styles/globals.css';
import './styles/themes.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('library');
  const [openBook, setOpenBook] = useState(null);

  const library = useLibrary();
  const { settings, updateSetting } = useSettings();

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

  return (
    <div style={{
      background: 'radial-gradient(ellipse at center, #1a1410 0%, #0a0a0a 100%)',
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
              onClose={handleCloseBook}
            />
          ) : (
            <motion.div
              key="app-shell"
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Screen area */}
              <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                <AnimatePresence mode="wait">
                  {activeTab === 'library' && (
                    <motion.div
                      key="library"
                      style={{ position: 'absolute', inset: 0 }}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.22 }}
                    >
                      <LibraryScreen
                        library={library}
                        onOpenBook={handleOpenBook}
                        settings={settings}
                      />
                    </motion.div>
                  )}
                  {activeTab === 'continue' && (
                    <motion.div
                      key="continue"
                      style={{ position: 'absolute', inset: 0 }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.22 }}
                    >
                      <ContinueScreen
                        library={library}
                        onOpenBook={handleOpenBook}
                        settings={settings}
                      />
                    </motion.div>
                  )}
                  {activeTab === 'appearance' && (
                    <motion.div
                      key="appearance"
                      style={{ position: 'absolute', inset: 0 }}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 16 }}
                      transition={{ duration: 0.22 }}
                    >
                      <AppearanceScreen
                        settings={settings}
                        updateSetting={updateSetting}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tab bar */}
              <TabBar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                settings={settings}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
