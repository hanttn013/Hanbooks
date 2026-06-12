# Aurelia Books Product Redesign Design

**Date:** 2026-06-12  
**Status:** Approved  
**Scope:** Redesign Aurelia Books around daily novel reading, dense library management, lists/shelves, book metadata, and a calmer reader.

## Context

The current app has a strong visual identity, but the product structure over-prioritizes showcase screens and repeats the same books across multiple sections. The reader is also too fragile: scrolling can fail, controls overlap text, and search/bookmarks are present but not useful enough.

The redesign keeps the warm editorial Aurelia identity while moving the app closer to an Apple Books-style reading product with Wattpad-like list organization.

## Goals

- Make reading reliable first: scroll mode must work, typography must be comfortable, controls must not block text.
- Replace the current bottom tabs with a product structure that matches reader behavior: Home, Library, Lists, Settings.
- Add library-wide search with real filtering and sorting.
- Add CRUD Lists/Shelves so users can classify novels.
- Add a long-press Book Info Sheet with useful EPUB metadata.
- Keep EPUB import and IndexedDB storage from the current app.

## Navigation

Bottom navigation becomes:

- **Home:** Continue Reading, Recently Added, and a short Your Lists section.
- **Library:** All books, search, filters, sort, grid/list view, multi-select, add to list.
- **Lists:** User-created shelves/lists and list detail screens.
- **Settings:** Reading defaults, import/export/storage preferences, and app settings.

The current Continue tab is folded into Home. The current Appearance tab is folded into Settings and Reader Settings.

When a book is open, the reader is full screen and bottom navigation is hidden.

## Home

Home shows each book at most once in the primary visible sections.

- Continue Reading hero uses the most recently opened reading book.
- Recently Added is a compact horizontal row.
- Your Lists shows the most-used or most-recent lists.

Home is not a full library management screen. It is a quick return point.

## Library

Library is denser and more operational.

- Search input at the top searches title, author, genre, extracted description, and tags/list names when available.
- Status chips: All, Reading, Unread, Finished, Favorites.
- Sort options: Recently Opened, Recently Added, Title A-Z, Author A-Z, Progress, Date Finished.
- View modes: Grid and List only.
- Multi-select supports Add to List.
- Long-press or card detail action opens Book Info Sheet.

Books do not appear in repeated shelf sections inside Library.

## Lists

Lists are first-class library organization.

Each list has:

- `id`
- `name`
- `description`
- `coverStyle`
- `sortMode`
- `bookIds`
- `createdAt`
- `updatedAt`

Users can:

- Create, rename, and delete lists.
- Add one book or multiple selected books to a list.
- Remove books from a list.
- Open list detail.
- Set sort mode per list.

Manual drag ordering can be added later. The first implementation stores enough structure to support it later without blocking the initial release.

## Book Info Sheet

Long-pressing a book card opens Book Info Sheet. Tapping a cover in grid can also open it.

The sheet includes:

- Cover
- Title
- Author
- Genre/type when detected
- Estimated pages or generated locations
- TOC/chapter count
- Reading status and progress
- Publisher, language, published date when present
- File size when available
- Auto-generated synopsis or preview
- Actions: Read/Continue, Favorite, Add to List, quick bookmark, Rename, Delete

### Metadata Extraction

Metadata is generated automatically from the EPUB. The user does not need to type it manually.

Extraction order:

1. Use EPUB metadata: title, creator, language, publisher, pubdate, description, subject.
2. Extract cover via `book.coverUrl()`.
3. Use navigation/TOC and spine to estimate chapter count.
4. Generate locations or estimate pages from text length if page count is unavailable.
5. If description is missing, read the first few spine sections and create a rough synopsis/preview.
6. Fallback to file name and default values when metadata is absent.

The preview extractor should skip obvious table of contents, copyright, license, and title-page fragments where possible.

## Reader

Reader should feel quiet and dependable.

- Default controls are hidden after opening.
- Tap center toggles controls.
- Tap or swipe sides turns pages in paged mode.
- Scroll mode uses real vertical scroll and must not be blocked by overlay zones.
- Body text is normal roman serif, not italic.
- Text is left-aligned by default. Justification is optional later, only if hyphenation is acceptable.
- Top controls: Back, chapter/title, settings.
- Bottom controls: progress, current chapter/page, time remaining.
- Main actions: Chapters, Bookmark, Settings, More.
- More contains Search in Book and Bookmark List.

The existing 3D page curl is deprioritized. Slide or no animation is enough for the next implementation.

## Search

### Library Search

Library search filters the user's collection by:

- Title
- Author
- Genre
- Extracted synopsis/preview
- List membership name

It works together with status filter and sort.

### In-Book Search

In-book search is available from Reader More.

It supports:

- Query text
- Scope: current chapter or entire book
- Results grouped or labeled by chapter
- Excerpt display
- Jump to result CFI
- Empty and loading states

Search indexes the EPUB spine on demand and can cache lightweight results for the current session.

## Bookmarks

Bookmarks are useful but not dominant.

- Reader has one quick bookmark button.
- Bookmark list lives in More or Chapters.
- Book Info Sheet can expose a quick bookmark/status action.
- Bookmark records remain separate from Lists.

Future phase: bookmark categories or attaching bookmarks to lists/tags.

## Data Storage

IndexedDB remains the primary storage.

Existing stores:

- `books`
- `bookmarks`
- `progress`

New or expanded stores:

- `lists`
- Optional `bookMetaCache` if keeping metadata separate from book records is cleaner.

Book records should gain:

- `genre`
- `description`
- `publisher`
- `language`
- `publishedAt`
- `fileSize`
- `chapterCount`
- `estimatedPages`
- `metadataExtractedAt`

## Error Handling

- If EPUB metadata extraction fails, save the book with fallback metadata and allow reading.
- If cover extraction fails, generate a styled fallback cover.
- If saved CFI fails, open from the beginning.
- If in-book search fails for a spine item, keep partial results and show a non-blocking warning.
- If IndexedDB write fails, show a user-facing error and keep UI state consistent.

## Testing

Manual verification:

- Import EPUB and confirm metadata extraction.
- Long-press book opens Book Info Sheet.
- Demo books open and scroll.
- Reader controls do not cover text while hidden.
- Library search combines correctly with filters and sort.
- Create, rename, delete lists.
- Add one book and multiple selected books to a list.
- Open list detail and remove a book.
- Search in book returns excerpts and jumps to result.
- Bookmark button creates/removes bookmark and bookmark list can jump.

Automated checks:

- `npm run lint`
- `npm run build`

## Phasing

### Phase 1

- Fix reader scroll and typography.
- Add Home/Library/Lists/Settings navigation.
- Add Book Info Sheet with metadata fields.
- Add automatic EPUB metadata extraction.
- Add library search/filter/sort.
- Add Lists CRUD and Add to List.

### Phase 2

- Improve in-book search filters and caching.
- Improve bookmark list integration.
- Add export/import backup for library and lists.
- Add manual ordering inside lists.
- Add richer metadata cleanup and genre detection.
