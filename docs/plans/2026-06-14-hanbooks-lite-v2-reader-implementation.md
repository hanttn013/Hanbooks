# Hanbooks Lite v2 Reader Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Build Hanbooks Lite v2 reader improvements: chapter-level progress, cleaner controls, safer EPUB rendering, previous-location jumpback, and lightweight chapter-flow/status settings.

**Architecture:** Keep the existing React + epub.js reader and add small, local state helpers in `ReaderScreen.jsx`. Extend settings with `chapterFlow` and `readingStatusLine`. Avoid native Android work and avoid true multi-chapter iframe stitching for this release.

**Tech Stack:** React, Vite, epub.js, IndexedDB via `StorageManager`, localStorage settings.

---

### Task 1: Extend Reader Settings Model

**Files:**
- Modify: `aurelia-books/src/hooks/useSettings.js`
- Modify: `aurelia-books/src/components/Reader/ReaderSettingsPanel.jsx`
- Modify: `aurelia-books/src/components/Settings/SettingsScreen.jsx`

**Steps:**

1. Add defaults:
   - `chapterFlow: 'continuous'`
   - `readingStatusLine: 'off'`
   - bump `settingsVersion` to 5.
2. During old settings migration, force defaults only for missing new keys.
3. Add controls to Reader Settings:
   - Chapter Flow: Continuous / Manual.
   - Status Line: Off / Minimal / Detailed.
4. Add the same settings summary/control to Settings screen if simple.
5. Run `npm.cmd run lint`.

### Task 2: Make EPUB Rendering Safer

**Files:**
- Modify: `aurelia-books/src/components/Reader/ReaderScreen.jsx`

**Steps:**

1. Change epub.js render option `allowScriptedContent` from `true` to `false`.
2. Verify demo EPUBs still open.
3. Run `npm.cmd run lint`.

### Task 3: Chapter Progress State

**Files:**
- Modify: `aurelia-books/src/components/Reader/ReaderScreen.jsx`

**Steps:**

1. Add state for:
   - `chapterPercentage`
   - `bookPercentage`
   - `chapterProgressAvailable`
   - `currentSpineIndex`
   - `currentSpineHref`
2. In `handleRelocated`, derive spine item from current CFI.
3. Calculate book percentage as existing percentage.
4. Calculate chapter percentage using epub.js location data when reliable:
   - Use current spine index and current location.
   - Estimate chapter range from spine item location boundaries if possible.
   - Fall back to book percentage if unavailable.
5. Keep saving book-level percentage to progress/localStorage.
6. Update visible progress label to show chapter progress when available.

### Task 4: Chapter-Level Seek

**Files:**
- Modify: `aurelia-books/src/components/Reader/ReaderScreen.jsx`

**Steps:**

1. Change slider value from book percentage to visible chapter percentage.
2. On slider drag, update chapter percentage state only.
3. On commit:
   - If chapter progress is available, seek inside current spine item/chapter.
   - If chapter progress is unavailable, use existing book-level seek fallback.
4. Before jumping, store current CFI as previous location.
5. Run manual smoke test on demo books.

### Task 5: Cleaner Tap Zones And Controls

**Files:**
- Modify: `aurelia-books/src/components/Reader/ReaderScreen.jsx`
- Modify: `aurelia-books/src/components/Reader/ReaderScreen.module.css`

**Steps:**

1. Remove viewer-level toggle on every click.
2. Add a center tap zone for toggling controls.
3. In scroll mode, do not use left/right edge taps.
4. In pages mode, keep left/right zones for previous/next.
5. Update top bar layout to Back + chapter title + More.
6. Update bottom bar to TOC + slider + Bookmark + Aa.
7. Ensure controls have opaque enough background and do not cover text when hidden.

### Task 6: Previous Location

**Files:**
- Modify: `aurelia-books/src/components/Reader/ReaderScreen.jsx`

**Steps:**

1. Add `previousLocation` state.
2. Add helper `rememberCurrentLocation()`.
3. Call helper before TOC/Search/Bookmark/progress jumps.
4. Add More menu item `Back to previous location` when available.
5. On use, display previous CFI and clear or swap previous/current.

### Task 7: Chapter Flow End Block

**Files:**
- Modify: `aurelia-books/src/components/Reader/ReaderScreen.jsx`

**Steps:**

1. Update `appendNextChapterControl` to read `settings.chapterFlow`.
2. For `continuous`, render a softer divider:
   - next chapter hint.
   - compact next chapter button.
   - less heavy blank space.
3. For `manual`, keep larger explicit next chapter button.
4. Keep no-op/end-of-book state.

### Task 8: Reading Status Line

**Files:**
- Modify: `aurelia-books/src/components/Reader/ReaderScreen.jsx`
- Modify: `aurelia-books/src/components/Reader/ReaderScreen.module.css`

**Steps:**

1. Render no status line when `readingStatusLine === 'off'`.
2. For `minimal`, show `chapter · chapter%`.
3. For `detailed`, show `chapter · chapter% chapter · book% book`.
4. Place it only inside visible controls or in a low-profile bottom area that does not cover text.

### Task 9: Stronger Progress Save And Auto Finished

**Files:**
- Modify: `aurelia-books/src/components/Reader/ReaderScreen.jsx`
- Modify: `aurelia-books/src/App.jsx`

**Steps:**

1. Pass `library` or an `onBookUpdate` callback into ReaderScreen.
2. Save latest progress on close/unmount when CFI exists.
3. If book percentage reaches 98%, update book status to `finished`.
4. Avoid repeated writes by checking current status.

### Task 10: Build And APK

**Files:**
- Generated: `aurelia-books/AureliaBooks-reader-lite-v2-debug.apk`

**Steps:**

1. Run `npm.cmd run lint`.
2. Run `npm.cmd run build`.
3. Run `npx.cmd cap sync android`.
4. Run Gradle debug build.
5. Copy debug APK to `AureliaBooks-reader-lite-v2-debug.apk`.

