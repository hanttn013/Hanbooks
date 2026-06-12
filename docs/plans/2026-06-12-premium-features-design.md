# Aurelia Books — Premium Features Design Document

**Date:** 2026-06-12  
**Version:** 1.1  
**Status:** Approved  
**Author:** Antigravity

---

## 1. Overview
Aurelia Books is being upgraded to support a native-like reading experience on Web and Mobile browsers (simulating iOS style). The core focus is on data persistence reliability (using IndexedDB), seamless user-managed EPUB imports, robust book management, an Apple Books-like Continue Reading card, detailed reader progress, comprehensive text search, and realistic page-turn options (Slide & 3D Page Curl). Highlight/Notes are deferred to a later release.

---

## 2. Architecture & Data Layer (IndexedDB)
We will introduce `StorageManager.js` to manage an IndexedDB database `aurelia_db` (version 1). 
We use three Object Stores:
1. `books`: Stores book metadata and raw file Blobs for offline reading.
   * Key: `id` (UUID)
   * Fields:
     ```js
     {
       id: string,
       title: string,
       author: string,
       coverUrl: string,        // Extracted Base64 Cover image
       fileBlob: Blob,          // The actual EPUB binary file
       addedAt: number,         // timestamp
       lastOpenedAt: number,    // timestamp
       status: 'unread' | 'reading' | 'finished',
       isFavorite: boolean,
       isDemo: boolean,
       totalLocations: number
     }
     ```
2. `bookmarks`: Stores user-added reading landmarks.
   * Key: `id` (UUID)
   * Indexes: `bookId`, `cfi`
   * Fields:
     ```js
     {
       id: string,
       bookId: string,
       cfi: string,
       chapterTitle: string,
       excerpt: string,
       createdAt: number
     }
     ```
3. `progress`: Stores reading statistics, CFI, and percentage for resume functionality.
   * Key: `bookId`
   * Fields:
     ```js
     {
       bookId: string,
       cfi: string,
       percentage: number,
       chapterTitle: string,
       lastReadAt: number,
       readingTimeMs: number
     }
     ```

We will keep UI-only preferences (e.g. current settings, active tab, active theme) in `localStorage` for immediate, synchronous access during startup.

---

## 3. EPUB Local Import Flow
1. User clicks the `+` button in the Library header.
2. Triggers file input dialog: `<input type="file" accept=".epub" />`.
3. Reading File metadata using `epub.js`:
   ```js
   const book = ePub(fileBlob);
   await book.ready;
   const meta = await book.loaded.metadata;
   const title = meta.title || file.name.replace(/\.epub$/i, '');
   const author = meta.creator || 'Unknown Author';
   ```
4. Extracting the cover image:
   * Fetch the cover item from `book.coverUrl()`.
   * Convert the cover Blob to a Data URL (Base64) to be stored in IndexedDB.
   * If the EPUB lacks a cover, programmatically generate a beautiful SVG-based cover containing the title text and a preset aesthetic color palette.
5. Save metadata, extracted cover URL, and the original EPUB Blob to IndexedDB (`books` store).
6. Refresh state.

---

## 4. Book Management Screen
The context menu (long press or double click/tap) on a book card will expand to support:
1. **Delete Book:** Remove from IndexedDB (both `books` and associated `bookmarks`/`progress`). Demo books can also be deleted.
2. **Rename Book:** Inline modal to edit title and author names.
3. **View Info:** Read metadata (publisher, publication date, file size).
4. **Filter & Sort:**
   * In Library, sort books by: *Recently Opened*, *Recently Added*, *Title*, *Author*, *Progress*.
   * Filter books by: *All*, *Currently Reading*, *Favorites*, *Finished*, *Unread*.

---

## 5. Main Screen "Continue Reading" Widget
The top section of the Library screen (or the dedicated "Continue" tab) will display a prominent hero card of the most recently read book:
- Display the large book cover, title, author, current chapter name, and progress percentage.
- A styled button **"Continue Reading"** which launches the Reader directly at the last read CFI.

---

## 6. Reader Enhancements
1. **Progress Info Bar (Safe Bottom):**
   * Shows current percentage (e.g. `45%`).
   * Page index (e.g., `Page 145 of 450`) using `book.locations.percentageFromCfi(cfi)`.
   * Remaining time in chapter: Computed as `(Remaining pages in chapter) * (Estimated reading time per page)`. We assume a baseline reading speed of 250 words per minute, equivalent to about 1 minute per page.
2. **Complete Text Search:**
   * User types query in Search modal.
   * Execute `book.locations.search(keyword)` or query each spine section.
   * Display a clean list of match excerpts. Clicking any result executes `rendition.display(cfi)` and closes the modal.
3. **Bookmarks Modal:**
   * Displays all bookmarks for the book in reverse chronological order.
   * Allows navigation via single click and deletions.

---

## 7. Transitions & 3D Page Curl
1. **Scroll Mode:** Sets `epub.js` flow to `scrolled-doc`. Removes pagination, allows smooth vertical scrolling.
2. **Paged Mode (Slide):** Sets flow to `paginated`. Uses Framer Motion's `AnimatePresence` to slide pages left or right on navigation.
3. **Paged Mode (3D Page Curl):**
   * Employs custom CSS 3D Transforms (`rotateY`, `perspective`, `transform-origin`).
   * When navigating:
     1. Create a transient snapshot div mirroring the current page.
     2. Animate the fold rotation from `0deg` to `-180deg` (or `180deg` for backward).
     3. Apply a drop-shadow gradient overlays on the folding sheet to mimic depth.
     4. Call the `rendition.next()` or `rendition.prev()` call at the 50% midpoint of the animation.
     5. Complete animation and remove transient elements.
