# Hanbooks Lite Gemini Design

## Goal

`lite_gemini` improves long-form reading smoothness on Android without redesigning the whole product. It keeps Hanbooks as an offline EPUB reader, avoids social/comment/feed features, and prioritizes: fast continue reading, reader UI that does not cover text, TOC that does not freeze on long novels, progress saving that does not create avoidable IndexedDB churn, and more resilient rendering for messy EPUB files.

## Reader

Keep Reader Lite v2 as the base:

- Scroll mode remains default.
- Controls stay hidden while reading.
- Tapping the center area toggles controls.
- In scroll mode, side zones do nothing.
- In pages mode, left/right zones move previous/next and the center zone toggles controls.

Add:

- Auto-hide controls when the reader detects a scroll/touch move.
- Cleaner EPUB CSS rules:
  - readable max-width for text on large/landscape screens;
  - constrained images with object-fit;
  - normalized paragraph spacing;
  - force unexpected italic/font-style back to normal;
  - safer body/section spacing.
- Keep `allowScriptedContent: false`.
- Keep the bottom-sheet reading settings panel.

## TOC

The current TOC renders every item, which can freeze on novels with 1000-3000 chapters.

`lite_gemini` will:

- Flatten nested TOC into `{ item, depth }` rows.
- Render normally for small TOCs.
- Use manual virtualization for large TOCs:
  - fixed row height;
  - render only visible rows plus overscan;
  - top/bottom spacer blocks preserve scroll height.
- Add a lightweight TOC search field.

No new virtualization library is required in this release.

## Progress Saving

Current relocated events can save often. `lite_gemini` will:

- Update UI immediately.
- Debounce IndexedDB progress writes by roughly 1000 ms.
- Always flush the latest CFI/progress on close and unmount.
- Continue storing CFI, book percentage, chapter title, and timestamp.

## Messy EPUB Handling

This release does not add a full Web Worker import pipeline. It does improve resilience through:

- stricter reader CSS;
- import overlay remains visible while metadata is extracted;
- existing metadata fallback remains the source of truth;
- Library cover/card CSS should avoid layout breakage with large/missing covers.

## Home And Library Polish

Home should feel less like an admin dashboard:

- Continue Reading remains dominant.
- Stats become one compact line instead of a grid.
- Recently Added and Shelves remain easy to reach.

Library cards become tighter:

- cover;
- title;
- author;
- progress;
- favorite indicator/menu.

Long press remains a shortcut, but a visible three-dot menu makes Book Info discoverable.

## Out Of Scope

- Native Filesystem / SAF.
- Backup / restore.
- Large batch import.
- Full Web Worker EPUB parse.
- Volume key controls.
- Brightness gesture.
- Orientation lock.
- True multi-chapter iframe stitching.

