# Hanbooks Lite Gemini Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement `lite_gemini`, a lightweight upgrade focused on smooth long-novel reading, virtualized TOC, debounced progress saves, EPUB rendering resilience, and small Home/Library polish.

**Architecture:** Build on the current React + epub.js Reader Lite v2. Keep changes local to Reader, TOC, Home, Library, and CSS. Avoid new dependencies and native Android storage work.

**Tech Stack:** React, Vite, epub.js, CSS Modules, IndexedDB through `StorageManager`, Capacitor Android.

---

### Task 1: Reader Smoothness

**Files:**
- Modify: `aurelia-books/src/components/Reader/ReaderScreen.jsx`
- Modify: `aurelia-books/src/components/Reader/ReaderScreen.module.css`

**Steps:**

1. Add auto-hide controls on touch move/scroll gestures.
2. Make page-mode tap zones follow left/center/right behavior.
3. Keep scroll-mode side zones inert.
4. Add max-width, paragraph spacing, image constraints, and defensive CSS to EPUB theme rules.
5. Verify `allowScriptedContent: false` remains.

### Task 2: Debounce Progress Saves

**Files:**
- Modify: `aurelia-books/src/components/Reader/ReaderScreen.jsx`

**Steps:**

1. Add refs for pending progress and debounce timer.
2. Replace immediate `saveProgress` calls in relocated handler with debounced saves.
3. Flush pending progress on close and unmount.
4. Preserve UI updates and auto-finished behavior.

### Task 3: Virtualized TOC

**Files:**
- Modify: `aurelia-books/src/components/Reader/TOCModal.jsx`

**Steps:**

1. Flatten nested TOC into rows with depth.
2. Add local search query.
3. Render small TOCs normally.
4. Render large TOCs through manual virtualization.
5. Preserve current chapter highlight and jump behavior.

### Task 4: Home Polish

**Files:**
- Modify: `aurelia-books/src/components/Home/HomeScreen.jsx`
- Modify: `aurelia-books/src/components/Home/HomeScreen.module.css`

**Steps:**

1. Replace stat grid with compact activity line.
2. Keep Continue Reading prominent.
3. Keep Recently Added and Shelves.
4. Avoid heavy new visuals.

### Task 5: Library Card Polish

**Files:**
- Modify: `aurelia-books/src/components/Library/LibraryScreen.jsx`
- Modify: `aurelia-books/src/components/Library/LibraryScreen.module.css`

**Steps:**

1. Remove genre from grid card meta.
2. Show progress compactly.
3. Add visible three-dot info/menu button on each grid card.
4. Keep long press shortcut.
5. Prevent info button click from opening reader.

### Task 6: Verify And Package

**Commands:**

1. `npm.cmd run lint`
2. `npm.cmd run build`
3. `npx.cmd cap sync android`
4. `.\gradlew.bat assembleDebug --console=plain --no-daemon`
5. Copy APK to `AureliaBooks-lite-gemini-debug.apk`

