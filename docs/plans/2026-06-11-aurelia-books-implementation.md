# Aurelia Books — Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Build Aurelia Books premium iOS reading web prototype with React + Vite, featuring Library, Reader (3 modes), Appearance, Bookmarks, Search, Stats.

**Architecture:** React 18 + Vite SPA mimicking iPhone screen. epub.js for EPUB parsing/rendering. framer-motion for animations. localStorage for all persistence. CSS Modules for scoped styling.

**Tech Stack:** React 18, Vite, epub.js, framer-motion, uuid, CSS Modules

---

## Task 1: Project Scaffold

**Files:**
- Create: `aurelia-books/` (Vite React project)

**Step 1: Scaffold Vite React project**

```bash
cd e:\Personal_pj\Hanbook
npx create-vite@latest aurelia-books --template react
cd aurelia-books
npm install
npm install epubjs framer-motion uuid
```

**Step 2: Install fonts in index.html**

Add to `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
```

**Step 3: Commit**
```bash
git add -A && git commit -m "feat: scaffold Vite React project with dependencies"
```

---

## Task 2: Global Design System (CSS)

**Files:**
- Create: `aurelia-books/src/styles/globals.css`
- Create: `aurelia-books/src/styles/themes.css`
- Modify: `aurelia-books/src/main.jsx`

**Step 1: Create globals.css**

```css
/* src/styles/globals.css */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --font-ui: -apple-system, 'SF Pro Display', system-ui, sans-serif;
  --color-gold: #8B6914;
  --color-brown: #3D2010;
  --color-shelf: #5C3D1E;
  --radius-book: 6px;
  --shadow-book: 4px 4px 12px rgba(0,0,0,0.3);
  --transition-fast: 200ms ease;
  --transition-med: 350ms ease;
}

body {
  font-family: var(--font-ui);
  background: #1a1a1a;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  overflow: hidden;
}

/* iPhone frame */
#phone-frame {
  width: 393px;
  height: 852px;
  border-radius: 55px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 40px 80px rgba(0,0,0,0.6), inset 0 0 0 2px #333;
  background: var(--bg-primary, #EDE8DC);
}

/* Safe area simulation */
.safe-top { padding-top: 59px; }
.safe-bottom { padding-bottom: 34px; }

/* Scrollable content within phone */
.screen-scroll {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.screen-scroll::-webkit-scrollbar { display: none; }
```

**Step 2: Create themes.css**

```css
/* src/styles/themes.css */
[data-theme="warm-cream"] {
  --bg-primary: #EDE8DC;
  --bg-secondary: #E4DED4;
  --bg-card: #FFFFFF;
  --text-primary: #2C2416;
  --text-secondary: #7A6A54;
  --accent: #8B6914;
  --accent-dark: #6B4E10;
  --shelf-color: #5C3D1E;
  --border: rgba(44,36,22,0.12);
}
[data-theme="pure-white"] {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F5F5F5;
  --bg-card: #FFFFFF;
  --text-primary: #1A1A1A;
  --text-secondary: #666666;
  --accent: #8B6914;
  --accent-dark: #6B4E10;
  --shelf-color: #5C3D1E;
  --border: rgba(0,0,0,0.1);
}
[data-theme="vintage-paper"] {
  --bg-primary: #F5EDD6;
  --bg-secondary: #EDE4C8;
  --bg-card: #FAF3E0;
  --text-primary: #3D2B1F;
  --text-secondary: #7A5C2E;
  --accent: #7A5C2E;
  --accent-dark: #5A3C1E;
  --shelf-color: #6B4E2E;
  --border: rgba(61,43,31,0.12);
}
[data-theme="sepia"] {
  --bg-primary: #F1E4C3;
  --bg-secondary: #E8D9B0;
  --bg-card: #F5EAD0;
  --text-primary: #3B2F0A;
  --text-secondary: #7A6530;
  --accent: #8B6914;
  --accent-dark: #6B4E10;
  --shelf-color: #5C3D1E;
  --border: rgba(59,47,10,0.12);
}
[data-theme="dark-gray"] {
  --bg-primary: #2C2C2C;
  --bg-secondary: #383838;
  --bg-card: #3A3A3A;
  --text-primary: #E8E0D0;
  --text-secondary: #A09888;
  --accent: #C4A35A;
  --accent-dark: #A4833A;
  --shelf-color: #4A3020;
  --border: rgba(255,255,255,0.1);
}
[data-theme="amoled-black"] {
  --bg-primary: #000000;
  --bg-secondary: #111111;
  --bg-card: #1A1A1A;
  --text-primary: #E0D8C8;
  --text-secondary: #888070;
  --accent: #C4A35A;
  --accent-dark: #A4833A;
  --shelf-color: #2A1810;
  --border: rgba(255,255,255,0.08);
}
[data-theme="forest"] {
  --bg-primary: #1C3329;
  --bg-secondary: #243D30;
  --bg-card: #2A4438;
  --text-primary: #E8F0E8;
  --text-secondary: #90B898;
  --accent: #7AB892;
  --accent-dark: #5A9872;
  --shelf-color: #3A2818;
  --border: rgba(232,240,232,0.1);
}
[data-theme="ocean"] {
  --bg-primary: #E8F4F8;
  --bg-secondary: #D8EAF0;
  --bg-card: #FFFFFF;
  --text-primary: #1A3040;
  --text-secondary: #4A7090;
  --accent: #4A90B0;
  --accent-dark: #3A7090;
  --shelf-color: #2A4060;
  --border: rgba(26,48,64,0.12);
}
[data-theme="midnight-blue"] {
  --bg-primary: #1A2035;
  --bg-secondary: #222840;
  --bg-card: #2A3050;
  --text-primary: #D8E0F0;
  --text-secondary: #8090B0;
  --accent: #6080C0;
  --accent-dark: #4060A0;
  --shelf-color: #0A1020;
  --border: rgba(216,224,240,0.1);
}
```

**Step 3: Commit**
```bash
git add -A && git commit -m "feat: global CSS design system and themes"
```

---

## Task 3: Data Layer (hooks + localStorage)

**Files:**
- Create: `aurelia-books/src/hooks/useLibrary.js`
- Create: `aurelia-books/src/hooks/useSettings.js`
- Create: `aurelia-books/src/hooks/useReader.js`
- Create: `aurelia-books/src/data/demoBooks.js`

**Step 1: Create demoBooks.js** — 3 public domain demo books stored as metadata. The actual EPUB files will be fetched from Project Gutenberg URLs or bundled as assets.

```js
// src/data/demoBooks.js
export const DEMO_BOOKS = [
  {
    id: 'demo-1',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    isDemo: true,
    coverColor: '#2D4A6E',
    coverTextColor: '#C4A35A',
    epubUrl: 'https://www.gutenberg.org/ebooks/1342.epub.images',
    status: 'reading',
    isFavorite: false,
    addedAt: Date.now() - 86400000 * 3,
    lastOpenedAt: Date.now() - 3600000,
  },
  {
    id: 'demo-2',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isDemo: true,
    coverColor: '#1E4D3A',
    coverTextColor: '#C4A35A',
    epubUrl: 'https://www.gutenberg.org/ebooks/64317.epub.images',
    status: 'unread',
    isFavorite: true,
    addedAt: Date.now() - 86400000 * 7,
    lastOpenedAt: null,
  },
  {
    id: 'demo-3',
    title: 'Jane Eyre',
    author: 'Charlotte Brontë',
    isDemo: true,
    coverColor: '#6B2D5E',
    coverTextColor: '#F0D080',
    epubUrl: 'https://www.gutenberg.org/ebooks/1260.epub.images',
    status: 'finished',
    isFavorite: false,
    addedAt: Date.now() - 86400000 * 14,
    lastOpenedAt: Date.now() - 86400000 * 2,
  },
];
```

**Step 2: Create useLibrary.js**

```js
// src/hooks/useLibrary.js
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DEMO_BOOKS } from '../data/demoBooks';

const STORAGE_KEY = 'aurelia_library';

function loadLibrary() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    return DEMO_BOOKS;
  } catch { return DEMO_BOOKS; }
}

function saveLibrary(books) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

export function useLibrary() {
  const [books, setBooks] = useState(loadLibrary);
  const [sortBy, setSortBy] = useState('lastOpenedAt');

  useEffect(() => { saveLibrary(books); }, [books]);

  const addBook = useCallback(async (file) => {
    const url = URL.createObjectURL(file);
    const book = {
      id: uuidv4(),
      title: file.name.replace('.epub', ''),
      author: 'Unknown Author',
      isDemo: false,
      coverColor: '#2D4A6E',
      coverTextColor: '#C4A35A',
      epubUrl: url,
      blobUrl: url,
      status: 'unread',
      isFavorite: false,
      addedAt: Date.now(),
      lastOpenedAt: null,
    };
    // Extract metadata from epub
    setBooks(prev => [book, ...prev]);
    return book;
  }, []);

  const deleteBook = useCallback((id) => {
    setBooks(prev => prev.filter(b => b.id !== id));
  }, []);

  const updateBook = useCallback((id, updates) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const getSorted = useCallback((bookList) => {
    return [...bookList].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'author') return a.author.localeCompare(b.author);
      if (sortBy === 'addedAt') return b.addedAt - a.addedAt;
      if (sortBy === 'lastOpenedAt') return (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0);
      return 0;
    });
  }, [sortBy]);

  return { books, addBook, deleteBook, updateBook, sortBy, setSortBy, getSorted };
}
```

**Step 3: Create useSettings.js**

```js
// src/hooks/useSettings.js
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'aurelia_settings';

const DEFAULT_SETTINGS = {
  theme: 'warm-cream',
  font: 'Merriweather',
  fontSize: 18,
  lineHeight: 1.7,
  marginWidth: 24,
  letterSpacing: 0,
  readingMode: 'classic',
  pageTurnEffect: 'slide',
};

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    document.getElementById('phone-frame')?.setAttribute('data-theme', settings.theme);
  }, [settings]);

  const updateSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  return { settings, updateSetting };
}
```

**Step 4: Create useReader.js**

```js
// src/hooks/useReader.js
import { useState, useEffect, useCallback, useRef } from 'react';

const PROGRESS_KEY = 'aurelia_progress';
const BOOKMARKS_KEY = 'aurelia_bookmarks';
const STATS_KEY = 'aurelia_stats';
import { v4 as uuidv4 } from 'uuid';

function load(key, def) {
  try { return JSON.parse(localStorage.getItem(key)) || def; } catch { return def; }
}

export function useReader(bookId) {
  const [progress, setProgress] = useState(() => load(PROGRESS_KEY, {}));
  const [bookmarks, setBookmarks] = useState(() => load(BOOKMARKS_KEY, {}));
  const [stats, setStats] = useState(() => load(STATS_KEY, { totalReadingMs: 0, streak: 0, lastReadDate: null, pagesReadToday: 0 }));
  const startTimeRef = useRef(null);

  useEffect(() => { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); }, [progress]);
  useEffect(() => { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks)); }, [bookmarks]);
  useEffect(() => { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); }, [stats]);

  const saveProgress = useCallback((cfi, percentage, chapterTitle) => {
    setProgress(prev => ({
      ...prev,
      [bookId]: { cfi, percentage, chapterTitle, lastReadAt: Date.now() }
    }));
  }, [bookId]);

  const getProgress = useCallback(() => progress[bookId] || null, [progress, bookId]);

  const addBookmark = useCallback((cfi, chapterTitle, excerpt) => {
    const bookmark = { id: uuidv4(), bookId, cfi, chapterTitle, excerpt, createdAt: Date.now() };
    setBookmarks(prev => ({
      ...prev,
      [bookId]: [...(prev[bookId] || []), bookmark]
    }));
    return bookmark;
  }, [bookId]);

  const removeBookmark = useCallback((id) => {
    setBookmarks(prev => ({
      ...prev,
      [bookId]: (prev[bookId] || []).filter(b => b.id !== id)
    }));
  }, [bookId]);

  const getBookmarks = useCallback(() => bookmarks[bookId] || [], [bookmarks, bookId]);

  const startReading = useCallback(() => { startTimeRef.current = Date.now(); }, []);

  const stopReading = useCallback(() => {
    if (!startTimeRef.current) return;
    const elapsed = Date.now() - startTimeRef.current;
    setStats(prev => ({ ...prev, totalReadingMs: prev.totalReadingMs + elapsed }));
    startTimeRef.current = null;
  }, []);

  return { saveProgress, getProgress, addBookmark, removeBookmark, getBookmarks, stats, startReading, stopReading };
}
```

**Step 5: Commit**
```bash
git add -A && git commit -m "feat: data layer hooks - library, settings, reader"
```

---

## Task 4: App Shell + Navigation

**Files:**
- Modify: `aurelia-books/src/App.jsx`
- Modify: `aurelia-books/src/main.jsx`
- Create: `aurelia-books/src/components/TabBar/TabBar.jsx`
- Create: `aurelia-books/src/components/TabBar/TabBar.module.css`

**Step 1: App.jsx — iPhone frame + tab routing**

```jsx
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
    library.updateBook(book.id, { lastOpenedAt: Date.now(), status: book.status === 'unread' ? 'reading' : book.status });
    setOpenBook(book);
  };

  return (
    <div style={{ background: '#111', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div id="phone-frame" data-theme={settings.theme}>
        <AnimatePresence mode="wait">
          {openBook ? (
            <ReaderScreen
              key="reader"
              book={openBook}
              settings={settings}
              onClose={() => setOpenBook(null)}
            />
          ) : (
            <motion.div key="tabs" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                <AnimatePresence mode="wait">
                  {activeTab === 'library' && (
                    <motion.div key="library" style={{ height: '100%' }}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <LibraryScreen library={library} onOpenBook={handleOpenBook} settings={settings} />
                    </motion.div>
                  )}
                  {activeTab === 'continue' && (
                    <motion.div key="continue" style={{ height: '100%' }}
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                      <ContinueScreen library={library} onOpenBook={handleOpenBook} settings={settings} />
                    </motion.div>
                  )}
                  {activeTab === 'appearance' && (
                    <motion.div key="appearance" style={{ height: '100%' }}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <AppearanceScreen settings={settings} updateSetting={updateSetting} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <TabBar activeTab={activeTab} onTabChange={setActiveTab} settings={settings} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add -A && git commit -m "feat: app shell with tab navigation and iPhone frame"
```

---

## Task 5: TabBar Component

**Step 1: Create TabBar.jsx + CSS**

Full TabBar with Library, Continue, Appearance icons — styled to match design mockups (warm cream background, gold accent for active tab, thin border top).

**Step 2: Commit**
```bash
git add -A && git commit -m "feat: TabBar component"
```

---

## Task 6: Library Screen

**Files:**
- Create: `aurelia-books/src/components/Library/LibraryScreen.jsx`
- Create: `aurelia-books/src/components/Library/LibraryScreen.module.css`
- Create: `aurelia-books/src/components/Library/BookshelfView.jsx`
- Create: `aurelia-books/src/components/Library/GridView.jsx`
- Create: `aurelia-books/src/components/Library/ListView.jsx`
- Create: `aurelia-books/src/components/Library/BookCard.jsx`
- Create: `aurelia-books/src/components/Library/BookCover.jsx`

Full implementation: header with view toggle, sections (Currently Reading, Favorites, Recently Added, Finished), sort dropdown, import EPUB button, long-press context menu.

**Step 2: Commit**
```bash
git add -A && git commit -m "feat: Library screen with bookshelf, grid, list views"
```

---

## Task 7: Continue Screen

**Files:**
- Create: `aurelia-books/src/components/Continue/ContinueScreen.jsx`
- Create: `aurelia-books/src/components/Continue/ContinueScreen.module.css`

Hero card with large cover, Continue Reading button, Also Reading list.

**Commit:** `feat: Continue reading screen`

---

## Task 8: Appearance Screen

**Files:**
- Create: `aurelia-books/src/components/Appearance/AppearanceScreen.jsx`
- Create: `aurelia-books/src/components/Appearance/AppearanceScreen.module.css`

Live preview text, theme grid (9 themes), font picker, typography sliders, reading mode selector, page turn effect selector.

**Commit:** `feat: Appearance screen with full settings`

---

## Task 9: Reader Screen — Core

**Files:**
- Create: `aurelia-books/src/components/Reader/ReaderScreen.jsx`
- Create: `aurelia-books/src/components/Reader/ReaderScreen.module.css`
- Create: `aurelia-books/src/components/Reader/ReaderControls.jsx`
- Create: `aurelia-books/src/components/Reader/ClassicPageReader.jsx`
- Create: `aurelia-books/src/components/Reader/ScrollReader.jsx`
- Create: `aurelia-books/src/components/Reader/RealBookReader.jsx`

Full screen reader, tap-to-show/hide controls, epub.js rendering, CFI-based progress saving.

**Commit:** `feat: Reader screen core with 3 reading modes`

---

## Task 10: Bookmarks, TOC, Search Modals

**Files:**
- Create: `aurelia-books/src/components/Reader/BookmarksModal.jsx`
- Create: `aurelia-books/src/components/Reader/TOCModal.jsx`
- Create: `aurelia-books/src/components/Reader/SearchModal.jsx`

Bottom sheet modals, list/jump to location.

**Commit:** `feat: Bookmarks, TOC, and Search modals`

---

## Task 11: Reading Stats

**Files:**
- Create: `aurelia-books/src/components/Library/StatsBar.jsx`

Stats shown in Library header or Continue screen: total books finished, reading streak, reading time today.

**Commit:** `feat: Reading stats display`

---

## Task 12: Polish + Dev Server

Run `npm run dev` in `aurelia-books/`, verify all screens work, test EPUB import, test all themes.

**Commit:** `feat: final polish and verification`
