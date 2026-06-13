# Aurelia Books Product Redesign Implementation Plan

**Date:** 2026-06-12  
**Design:** `docs/plans/2026-06-12-aurelia-books-product-redesign-design.md`

## Task 1: Data Layer, Lists, and EPUB Metadata

Files:

- `aurelia-books/src/utils/StorageManager.js`
- `aurelia-books/src/utils/epubMetadata.js`
- `aurelia-books/src/hooks/useLibrary.js`
- `docs/plans/task.md`

Steps:

1. Upgrade IndexedDB to include `lists`.
2. Add list CRUD methods and default list seeding.
3. Add book metadata fields: genre, description, publisher, language, publishedAt, fileSize, chapterCount, estimatedPages, metadataExtractedAt.
4. Add EPUB metadata extraction helper that reads EPUB metadata, cover, TOC/spine, and first-section preview.
5. Integrate extraction into demo preload and local EPUB import flow.
6. Verify with `npm run lint` and `npm run build`.

## Task 2: App Shell and Navigation

Files:

- `aurelia-books/src/App.jsx`
- `aurelia-books/src/components/TabBar/TabBar.jsx`
- `aurelia-books/src/components/TabBar/TabBar.module.css`
- `aurelia-books/src/components/Home/HomeScreen.jsx`
- `aurelia-books/src/components/Home/HomeScreen.module.css`
- `aurelia-books/src/components/Settings/SettingsScreen.jsx`
- `aurelia-books/src/components/Settings/SettingsScreen.module.css`

Steps:

1. Replace tabs with Home, Library, Lists, Settings.
2. Fold Continue into Home.
3. Fold Appearance into Settings.
4. Hide bottom navigation while reader is open.
5. Verify with `npm run lint` and `npm run build`.

## Task 3: Library Search, Dense Views, and Book Info Sheet

Files:

- `aurelia-books/src/components/Library/LibraryScreen.jsx`
- `aurelia-books/src/components/Library/LibraryScreen.module.css`
- `aurelia-books/src/components/Library/BookDetailModal.jsx`

Steps:

1. Replace repeated sections with one searchable dense collection.
2. Add library search across title, author, genre, description, and list names.
3. Keep status filters and sort.
4. Support grid/list views and multi-select.
5. Long-press or cover tap opens Book Info Sheet.
6. Book Info Sheet shows metadata, synopsis, quick bookmark, favorite, add to list, rename, delete, read.
7. Verify with `npm run lint` and `npm run build`.

## Task 4: Lists Screen

Files:

- `aurelia-books/src/components/Lists/ListsScreen.jsx`
- `aurelia-books/src/components/Lists/ListsScreen.module.css`
- `aurelia-books/src/components/Library/BookDetailModal.jsx`

Steps:

1. Add Lists overview.
2. Add list detail.
3. Add create, rename, delete.
4. Add one or many books to list.
5. Remove books from list.
6. Add per-list sort.
7. Verify with `npm run lint` and `npm run build`.

## Task 5: Reader Reliability, Search, and Bookmarks

Files:

- `aurelia-books/src/components/Reader/ReaderScreen.jsx`
- `aurelia-books/src/components/Reader/ReaderScreen.module.css`
- `aurelia-books/src/components/Reader/SearchModal.jsx`
- `aurelia-books/src/components/Reader/BookmarksModal.jsx`

Steps:

1. Make scroll mode actually scroll without overlay zones blocking it.
2. Default controls hidden after opening.
3. Normalize reader typography.
4. Move Search and Bookmark List into More.
5. Add in-book search scope filter.
6. Ensure bookmark create/remove and jump works.
7. Verify with `npm run lint` and `npm run build`.

## Task 6: Final Verification and Polish

Files:

- Any touched files as needed.

Steps:

1. Run `npm run lint`.
2. Run `npm run build`.
3. Manually verify app loads at dev server URL.
4. Update `docs/plans/task.md` statuses.
