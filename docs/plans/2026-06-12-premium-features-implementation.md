# Premium Features Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Build premium e-reading features for Aurelia Books, including IndexedDB offline storage, local EPUB import, book management, search, bookmarks, stats, and 3D page curl transitions.

**Architecture:** Use IndexedDB for storage of EPUB binaries and metadata. Manage settings via localStorage. Render EPUB using epub.js and animate using CSS 3D Transforms and Framer Motion.

**Tech Stack:** React 18, Vite, epub.js, IndexedDB API, Framer Motion, CSS Modules.

---

### Task 1: StorageManager Utility (IndexedDB)

**Files:**
- Create: `aurelia-books/src/utils/StorageManager.js`

**Step 1: Write the minimal implementation**

Create the IndexedDB helper to handle database creation and basic operations for `books`, `bookmarks`, and `progress`.

```js
// src/utils/StorageManager.js
const DB_NAME = 'aurelia_db';
const DB_VERSION = 1;

export class StorageManager {
  static openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('books')) {
          db.createObjectStore('books', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('bookmarks')) {
          const store = db.createObjectStore('bookmarks', { keyPath: 'id' });
          store.createIndex('bookId', 'bookId', { unique: false });
        }
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'bookId' });
        }
      };

      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  static async getAllBooks() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('books', 'readonly');
      const store = transaction.objectStore('books');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async saveBook(book) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('books', 'readwrite');
      const store = transaction.objectStore('books');
      const request = store.put(book);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async deleteBook(id) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['books', 'bookmarks', 'progress'], 'readwrite');
      
      // Delete book
      transaction.objectStore('books').delete(id);
      
      // Delete progress
      transaction.objectStore('progress').delete(id);
      
      // Delete bookmarks (requires querying by index or filtering)
      const bookmarkStore = transaction.objectStore('bookmarks');
      const index = bookmarkStore.index('bookId');
      const request = index.openCursor(IDBKeyRange.only(id));
      request.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          bookmarkStore.delete(cursor.primaryKey);
          cursor.continue();
        }
      };
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  static async getProgress(bookId) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('progress', 'readonly');
      const store = transaction.objectStore('progress');
      const request = store.get(bookId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  static async saveProgress(progress) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('progress', 'readwrite');
      const store = transaction.objectStore('progress');
      const request = store.put(progress);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async getBookmarks(bookId) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('bookmarks', 'readonly');
      const store = transaction.objectStore('bookmarks');
      const index = store.index('bookId');
      const request = index.getAll(IDBKeyRange.only(bookId));
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  static async addBookmark(bookmark) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('bookmarks', 'readwrite');
      const store = transaction.objectStore('bookmarks');
      const request = store.put(bookmark);
      request.onsuccess = () => resolve(bookmark);
      request.onerror = () => reject(request.error);
    });
  }

  static async removeBookmark(id) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('bookmarks', 'readwrite');
      const store = transaction.objectStore('bookmarks');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
```

**Step 2: Commit**

```bash
git add aurelia-books/src/utils/StorageManager.js
git commit -m "feat: add StorageManager IndexedDB utility"
```

---

### Task 2: Data Hooks Integration (IndexedDB & useLibrary)

**Files:**
- Modify: `aurelia-books/src/hooks/useLibrary.js`
- Modify: `aurelia-books/src/hooks/useReader.js`

**Step 1: Update useLibrary.js to support Async IndexedDB storage**

Replace the LocalStorage implementation with StorageManager. Also, integrate demo books preloading on first launch.

```js
// Replace src/hooks/useLibrary.js content
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DEMO_BOOKS } from '../data/demoBooks';
import { StorageManager } from '../utils/StorageManager';

export function useLibrary() {
  const [books, setBooks] = useState([]);
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('aurelia_sort') || 'lastOpenedAt');
  const [filterBy, setFilterBy] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Load books from IndexedDB
  const refreshLibrary = useCallback(async () => {
    setIsLoading(true);
    try {
      let list = await StorageManager.getAllBooks();
      if (list.length === 0) {
        // Load demo books from public URLs or assets
        for (const demo of DEMO_BOOKS) {
          try {
            const res = await fetch(demo.epubUrl);
            const blob = await res.blob();
            const bookRecord = {
              ...demo,
              fileBlob: blob,
              coverUrl: null, // extracted cover or SVG will fall back
            };
            await StorageManager.saveBook(bookRecord);
          } catch (e) {
            console.error('Failed to pre-fetch demo book:', demo.title, e);
            // Fallback save metadata only
            await StorageManager.saveBook({ ...demo, fileBlob: null });
          }
        }
        list = await StorageManager.getAllBooks();
      }
      setBooks(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  useEffect(() => {
    localStorage.setItem('aurelia_sort', sortBy);
  }, [sortBy]);

  const addBook = useCallback(async (file, metadata) => {
    const book = {
      id: uuidv4(),
      title: metadata.title || file.name.replace(/\.epub$/i, ''),
      author: metadata.author || 'Unknown Author',
      isDemo: false,
      coverColor: metadata.coverColor || '#2D4A6E',
      coverAccent: metadata.coverAccent || '#C4A35A',
      coverUrl: metadata.coverUrl || null, // Base64 cover
      fileBlob: file,
      status: 'unread',
      isFavorite: false,
      addedAt: Date.now(),
      lastOpenedAt: null,
      totalLocations: 0,
    };
    await StorageManager.saveBook(book);
    setBooks(prev => [book, ...prev]);
    return book;
  }, []);

  const deleteBook = useCallback(async (id) => {
    await StorageManager.deleteBook(id);
    setBooks(prev => prev.filter(b => b.id !== id));
  }, []);

  const updateBook = useCallback(async (id, updates) => {
    setBooks(prev => prev.map(b => {
      if (b.id === id) {
        const updated = { ...b, ...updates };
        StorageManager.saveBook(updated);
        return updated;
      }
      return b;
    }));
  }, []);

  const getSorted = useCallback((bookList) => {
    return [...bookList].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        case 'addedAt':
          return b.addedAt - a.addedAt;
        case 'progress': {
          const progA = parseFloat(localStorage.getItem(`aurelia_pct_${a.id}`) || 0);
          const progB = parseFloat(localStorage.getItem(`aurelia_pct_${b.id}`) || 0);
          return progB - progA;
        }
        case 'lastOpenedAt':
        default:
          return (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0);
      }
    });
  }, [sortBy]);

  // Derived sections
  const filteredBooks = books.filter(b => {
    if (filterBy === 'reading') return b.status === 'reading';
    if (filterBy === 'favorites') return b.isFavorite;
    if (filterBy === 'finished') return b.status === 'finished';
    if (filterBy === 'unread') return b.status === 'unread';
    return true;
  });

  const sortedBooks = getSorted(filteredBooks);

  return {
    books: sortedBooks,
    allBooksRaw: books,
    isLoading,
    addBook,
    deleteBook,
    updateBook,
    sortBy,
    setSortBy,
    filterBy,
    setFilterBy,
    refreshLibrary,
  };
}
```

**Step 2: Update useReader.js to support Async IndexedDB progress and bookmarks**

```js
// Replace src/hooks/useReader.js content
import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { StorageManager } from '../utils/StorageManager';

const STATS_KEY = 'aurelia_stats';

function loadStats() {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    return stored ? JSON.parse(stored) : {
      totalReadingMs: 0,
      streak: 0,
      lastReadDate: null,
      booksFinished: 0,
      pagesReadToday: 0,
      lastTodayDate: null,
    };
  } catch {
    return {
      totalReadingMs: 0,
      streak: 0,
      lastReadDate: null,
      booksFinished: 0,
      pagesReadToday: 0,
      lastTodayDate: null,
    };
  }
}

export function useReader(bookId) {
  const [progress, setProgress] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [stats, setStats] = useState(loadStats);
  const startTimeRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }, [stats]);

  // Fetch initial progress & bookmarks
  useEffect(() => {
    if (!bookId) return;
    StorageManager.getProgress(bookId).then(setProgress);
    StorageManager.getBookmarks(bookId).then(setBookmarks);
  }, [bookId]);

  const saveProgress = useCallback(async (cfi, percentage, chapterTitle) => {
    if (!bookId) return;
    const record = { bookId, cfi, percentage, chapterTitle, lastReadAt: Date.now() };
    await StorageManager.saveProgress(record);
    setProgress(record);
    try {
      localStorage.setItem(`aurelia_pct_${bookId}`, String(percentage));
    } catch {}
  }, [bookId]);

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
    startTimeRef.current = Date.now();
    const today = new Date().toDateString();
    setStats(prev => {
      if (prev.lastReadDate === today) return prev;
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const newStreak = prev.lastReadDate === yesterday ? prev.streak + 1 : 1;
      return { ...prev, streak: newStreak, lastReadDate: today };
    });
  }, []);

  const stopReading = useCallback(() => {
    if (!startTimeRef.current) return;
    const elapsed = Date.now() - startTimeRef.current;
    setStats(prev => ({
      ...prev,
      totalReadingMs: prev.totalReadingMs + elapsed,
    }));
    startTimeRef.current = null;
  }, []);

  const markFinished = useCallback(() => {
    setStats(prev => ({ ...prev, booksFinished: prev.booksFinished + 1 }));
  }, []);

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
```

**Step 3: Commit**

```bash
git add aurelia-books/src/hooks/useLibrary.js aurelia-books/src/hooks/useReader.js
git commit -m "feat: migrate library and reader hooks to IndexedDB"
```

---

### Task 3: Local EPUB Import & Metadata Extraction

**Files:**
- Modify: `aurelia-books/src/components/Library/LibraryScreen.jsx`
- Modify: `aurelia-books/src/components/Library/LibraryScreen.module.css`

**Step 1: Implement EPUB parser helper inside LibraryScreen.jsx**

Update the header import button to parse metadata and extract the cover image inside the zip as a Base64 URL before saving to IndexedDB.

```jsx
// Modify import handlers in src/components/Library/LibraryScreen.jsx
// Need to add file input ref and handle EPUB load
```

*Note:* Inside `LibraryScreen.jsx`, we will read the file with `FileReader`, feed it into `ePub(arrayBuffer)` and wait for `book.ready`.
We will extract metadata:
```js
const book = ePub(arrayBuffer);
await book.ready;
const metadata = await book.loaded.metadata;
let coverUrl = null;
try {
  const coverPath = await book.coverUrl();
  if (coverPath) {
    // coverPath from epubjs might be a blob url or local path.
    // If it's a blob URL, we can fetch it and convert to base64.
    const res = await fetch(coverPath);
    const blob = await res.blob();
    coverUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }
} catch (e) {
  console.log("No cover image extracted, using custom cover colors");
}
```
If no cover, choose a random pastel color for cover layout and write text title.

**Step 2: Commit**

```bash
git add aurelia-books/src/components/Library/LibraryScreen.jsx
git commit -m "feat: implement local EPUB import with metadata and cover image extraction"
```

---

### Task 4: Continue Reading Widget & Book Management Menu

**Files:**
- Modify: `aurelia-books/src/components/Library/LibraryScreen.jsx`
- Modify: `aurelia-books/src/components/Library/LibraryScreen.module.css`
- Modify: `aurelia-books/src/components/Library/BookCard.jsx`

**Step 1: Create 'Continue Reading' Hero Widget**

At the top of the Thư viện screen (or inside a card container), add a prominent card for the book with the latest `lastOpenedAt`. Show:
- Large cover thumbnail
- Progress bar + Percentage
- Button: "Continue Reading" (opens reader directly)

**Step 2: Implement Book Context Menu Actions**

Add actions to the context menu / details screen:
- **Rename Book:** inline prompt to edit name & author.
- **Delete Book:** prompts confirmation, deletes from DB, and updates view.
- **Details:** show size, metadata.
- **Read/Unread Filter:** Add tabs / segment control at the top of Library: "All", "Reading", "Finished", "Unread", "Favorites".

**Step 3: Commit**

```bash
git add aurelia-books/src/components/Library/LibraryScreen.jsx aurelia-books/src/components/Library/BookCard.jsx
git commit -m "feat: implement Continue Reading widget and detailed Book Management menu"
```

---

### Task 5: Reader Screen & Complete Text Search

**Files:**
- Modify: `aurelia-books/src/components/Reader/ReaderScreen.jsx`
- Modify: `aurelia-books/src/components/Reader/SearchModal.jsx`

**Step 1: Implement Text Search indexing**

In `SearchModal.jsx`, use `epubjs` text search capabilities.
```js
// In SearchModal.jsx search execution:
const searchSpine = async (q) => {
  const results = [];
  const spine = epubBook.spine;
  
  await Promise.all(spine.spineItems.map(async (item) => {
    await item.load(epubBook.load.bind(epubBook));
    const itemResults = item.find(q);
    item.unload();
    
    itemResults.forEach((result) => {
      results.push({
        cfi: result.cfi,
        excerpt: result.excerpt,
        chapterTitle: item.idref || 'Content'
      });
    });
  }));
  
  return results;
};
```
Display results matching query, and double click or single click to jump.

**Step 2: Commit**

```bash
git add aurelia-books/src/components/Reader/SearchModal.jsx
git commit -m "feat: implement complete text search with spine content indexing"
```

---

### Task 6: Bookmarks Modal Navigation

**Files:**
- Modify: `aurelia-books/src/components/Reader/BookmarksModal.jsx`

**Step 1: Hook bookmarks list click event**

Allow bookmarks items to trigger `onJumpTo(bookmark.cfi)`, which display the exact location in the EPUB.

**Step 2: Commit**

```bash
git add aurelia-books/src/components/Reader/BookmarksModal.jsx
git commit -m "feat: implement bookmark navigation jumps"
```

---

### Task 7: Estimated Reading Time & Progress Info Bar

**Files:**
- Modify: `aurelia-books/src/components/Reader/ReaderScreen.jsx`
- Modify: `aurelia-books/src/components/Reader/ReaderScreen.module.css`

**Step 1: Compute locations and pagination details**

In `ReaderScreen.jsx`, display the bottom bar:
- "Page X of Y" (Y is calculated via `book.locations.length()`, and X via `book.locations.locationFromCfi(cfi)`)
- "Z min left in chapter" (estimate based on page length and average reading speed of 250 WPM)
- Total book progress `%`

**Step 2: Commit**

```bash
git add aurelia-books/src/components/Reader/ReaderScreen.jsx
git commit -m "feat: implement detailed reading progress and estimated reading time"
```

---

### Task 8: Slide & 3D Page Curl Animations

**Files:**
- Modify: `aurelia-books/src/components/Reader/ReaderScreen.jsx`
- Modify: `aurelia-books/src/components/Reader/ReaderScreen.module.css`

**Step 1: Add transitions config hooks**

Based on `settings.readingMode === 'classic'` and `settings.pageTurnEffect === 'realistic'`, add dynamic CSS classes to the viewer container.
For **3D Page Curl**:
1. When navigating left/right, block default rendition change temporarily.
2. Apply `.turning-page` animation. The page container scales, bends, and rotates.
3. Mid-animation (150ms), call `rendition.next()` or `rendition.prev()`.
4. End animation.

For **Slide**:
Use `framer-motion` container to slide-out/slide-in page contents.

**Step 2: Commit**

```bash
git add aurelia-books/src/components/Reader/ReaderScreen.jsx aurelia-books/src/components/Reader/ReaderScreen.module.css
git commit -m "feat: implement realistic 3D Page Curl and Slide page transitions"
```

---

### Task 9: Final Polish & Responsive support

**Files:**
- Modify: `aurelia-books/src/styles/globals.css`
- Modify: `aurelia-books/src/App.jsx`

**Step 1: Implement PWA and mobile layout adjustments**

Ensure all elements fit correctly on smaller mobile devices like iPhone 6/SE width (`320px` to `375px`).

**Step 2: Commit**

```bash
git add aurelia-books/src/styles/globals.css aurelia-books/src/App.jsx
git commit -m "feat: add PWA configurations and mobile device responsiveness"
```
