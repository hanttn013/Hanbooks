# Hanbooks Lite v2 Reader Design

## Goal

Hanbooks Lite v2 focuses on making the reader feel closer to Wattpad while keeping the app lightweight on Android. The reader should stay clean while reading, use chapter-level progress, avoid accidental toolbar toggles, and make chapter navigation feel natural without introducing heavy multi-chapter rendering.

## Scope

This version targets the reading experience only. It does not move EPUB storage from IndexedDB to native filesystem, does not add backup/restore, and does not implement batch import or duplicate/update detection.

## Reader Controls

When controls are hidden, the screen shows only book content. No floating progress line, header, toolbar, or translucent button should cover text.

Controls appear only when the user taps the center reading zone. Edge taps should not toggle controls in scroll mode. In pages mode, edge zones remain reserved for previous/next navigation.

Top bar:

- Back.
- Current chapter title, falling back to book title.
- More menu.

Bottom bar:

- Table of contents.
- Chapter progress slider.
- Bookmark.
- Reading settings.

The slider represents the current chapter, not the whole book. Book-level percentage remains internal for Home, Library, and persistence.

## Chapter Progress

Lite v2 treats Wattpad-style reading as chapter-first:

- The visible slider is chapter progress.
- The slider can seek within the current chapter.
- If EPUB chapter/spine information is unreliable, the app falls back to book-level progress and labels it clearly.
- The status line can show chapter and book progress separately.

Implementation can use epub.js spine item information and CFI mapping. If exact chapter-local CFI generation is unavailable, use the best safe fallback rather than blocking the reader.

## Chapter Flow

Add a `chapterFlow` setting:

- `continuous`: default. The end-of-chapter block should feel like a natural continuation, with a divider and small next-chapter action.
- `manual`: keeps an explicit next chapter button for weak devices or heavy EPUB files.

This version does not stitch multiple EPUB iframes into a true infinite scroll. It improves the current end-of-chapter experience and keeps performance predictable.

## Previous Location

When the user jumps through TOC, search, bookmarks, or progress slider, the reader stores the previous CFI. The More menu exposes `Back to previous location` when such a location exists.

## Reading Status Line

Add a `readingStatusLine` setting:

- `off`.
- `minimal`: `Chapter 1 · 68%`.
- `detailed`: `Chapter 1 · 68% chapter · 12% book`.

Default: `off` to keep reader clean.

## EPUB Safety And Stability

Set `allowScriptedContent` to `false` by default. EPUBs imported from Wattpad or converters may contain unpredictable content, and the reader should not execute embedded scripts.

Progress should be saved on close/unmount in addition to relocated events. When reading reaches 98% or more, the app can mark the book as finished quietly.

## Out Of Scope

- Native filesystem / SAF.
- Backup and restore.
- Batch import.
- Duplicate/update detection.
- Volume key controls.
- Brightness gesture.
- Orientation lock.
- True multi-chapter preloading/stitching.

