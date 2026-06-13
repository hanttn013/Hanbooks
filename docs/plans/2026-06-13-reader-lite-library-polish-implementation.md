# Reader Lite Library Polish Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Make Hanbooks feel fast on Android by keeping the reader ultra-light while polishing Home and Library with low-cost UI.

**Architecture:** Keep the existing React/Vite/Capacitor app and IndexedDB data layer. Optimize the reader by removing expensive animation and background computation from the default path, then simplify Home/Library styles without changing core storage contracts.

**Tech Stack:** React, Vite, Capacitor Android, epub.js, IndexedDB, CSS modules, ESLint.

---

### Task 1: Add Reader Lite Settings Contract

**Files:**
- Modify: `aurelia-books/src/hooks/useSettings.js`
- Modify: `docs/plans/task.md`

**Step 1: Inspect existing settings defaults**

Run: `Get-Content aurelia-books\src\hooks\useSettings.js`

Expected: Defaults include `readingMode`, `pageTurnEffect`, and `reducedMotion`.

**Step 2: Ensure Lite defaults are explicit**

In `DEFAULT_SETTINGS`, keep:

```js
readingMode: 'scroll',
pageTurnEffect: 'none',
reducedMotion: true,
readerMode: 'lite',
```

If `readerMode` is not present, add it and bump `settingsVersion`.

**Step 3: Add migration**

When old settings are loaded:

```js
if ((parsed.settingsVersion || 0) < DEFAULT_SETTINGS.settingsVersion) {
  merged.readingMode = 'scroll';
  merged.pageTurnEffect = 'none';
  merged.reducedMotion = true;
  merged.readerMode = 'lite';
}
```

**Step 4: Verify**

Run: `npm.cmd run lint`

Expected: PASS.

**Step 5: Optional commit**

Only if the user asks for commits:

```bash
git add aurelia-books/src/hooks/useSettings.js docs/plans/task.md
git commit -m "feat: add reader lite settings"
```

### Task 2: Make Reader Overlay Static And Fast

**Files:**
- Modify: `aurelia-books/src/components/Reader/ReaderScreen.jsx`
- Modify: `aurelia-books/src/components/Reader/ReaderScreen.module.css`

**Step 1: Replace motion-heavy reader container**

Remove Framer Motion wrappers from the main reader surface where practical. Use plain `div` for:

- root reader container
- loading overlay
- top bar
- bottom bar
- bookmark toast

Keep `AnimatePresence` only around modal components if removing it causes more churn.

**Step 2: Keep reader display non-blocking**

Ensure `rendition.display()` controls first content render. Location generation must stay delayed:

```js
locationTimer = window.setTimeout(() => {
  epubBookInstance.ready
    .then(() => epubBookInstance.locations.generate(3000))
    .then(/* update progress metadata */)
    .catch(/* warn only */);
}, 1800);
```

**Step 3: Disable swipe in scroll mode**

Keep:

```js
if (settings.readingMode === 'scroll') {
  touchStartX.current = null;
  return;
}
```

**Step 4: Remove expensive CSS**

In `ReaderScreen.module.css`, ensure the default reader has no:

- `backdrop-filter`
- page curl keyframes
- slide page keyframes
- scale active transforms
- large box shadows

**Step 5: Verify**

Run: `npm.cmd run lint`

Expected: PASS.

### Task 3: Simplify Reader Panels

**Files:**
- Modify: `aurelia-books/src/components/Reader/BookmarksModal.jsx`
- Modify: `aurelia-books/src/components/Reader/TOCModal.jsx`
- Modify: `aurelia-books/src/components/Reader/SearchModal.jsx`
- Modify: `aurelia-books/src/components/Reader/ReaderSettingsPanel.jsx`

**Step 1: Remove spring animation**

Replace `motion.div` sheet animation with a plain `div` or a short opacity transition. Avoid:

```js
transition={{ type: 'spring', damping: 30, stiffness: 300 }}
```

**Step 2: Keep panel content unchanged**

Do not redesign panel behavior in this task. Preserve:

- jumping to TOC item
- jumping to search result
- bookmark removal
- settings controls

**Step 3: Hide page animation controls in Lite mode**

In `ReaderSettingsPanel.jsx`, only show page animation options when:

```js
settings.readerMode !== 'lite' && settings.readingMode !== 'scroll'
```

**Step 4: Verify**

Run: `npm.cmd run lint`

Expected: PASS.

### Task 4: Polish Home With Low-Cost UI

**Files:**
- Modify: `aurelia-books/src/components/Home/HomeScreen.jsx`
- Modify: `aurelia-books/src/components/Home/HomeScreen.module.css`
- Modify: `aurelia-books/src/styles/globals.css`

**Step 1: Keep Continue Reading first**

Ensure the first visible content after the header is the current/most recent reading item.

**Step 2: Reduce expensive visuals**

Use flat cards and smaller shadows. Avoid:

- nested cards
- large gradients
- blur
- animated layout transitions

**Step 3: Keep stats compact**

Display only:

- total books
- reading books
- bookmarks
- storage

**Step 4: Verify**

Run: `npm.cmd run build`

Expected: PASS with only the existing chunk-size warning allowed.

### Task 5: Polish Library For Large Offline Collections

**Files:**
- Modify: `aurelia-books/src/components/Library/LibraryScreen.jsx`
- Modify: `aurelia-books/src/components/Library/LibraryScreen.module.css`
- Modify: `aurelia-books/src/components/Library/BookCover.module.css`

**Step 1: Keep search at the top**

Confirm search remains reachable without scrolling deep into the page.

**Step 2: Add or verify filter coverage**

Filters should include:

- All
- Reading
- Unread
- Finished
- Favorites
- Has Bookmarks

**Step 3: Make list view the low-cost default candidate**

Do not remove grid view, but make list view polished enough for large libraries:

- title
- author
- status
- progress
- small cover

**Step 4: Reduce cover rendering cost**

In `BookCover.module.css`, reduce heavy shadows and avoid transform effects.

**Step 5: Verify**

Run: `npm.cmd run lint`

Expected: PASS.

### Task 6: Make Book Info Sheet Lightweight

**Files:**
- Modify: `aurelia-books/src/components/Library/BookDetailModal.jsx`

**Step 1: Remove spring animation**

Use static sheet or short CSS transition. Preserve:

- title/author edit
- synopsis
- metadata
- add to list
- bookmark
- delete

**Step 2: Keep long press behavior unchanged**

Do not alter how `LibraryScreen` opens the modal unless necessary.

**Step 3: Verify**

Run: `npm.cmd run lint`

Expected: PASS.

### Task 7: Android Build Verification

**Files:**
- Generated: `aurelia-books/android/app/src/main/assets/public/`
- Generated: `aurelia-books/android/app/build/outputs/apk/debug/app-debug.apk`

**Step 1: Build web**

Run:

```powershell
npm.cmd run build
```

Expected: PASS.

**Step 2: Sync Capacitor**

Run:

```powershell
$root = Get-Location
$env:JAVA_HOME = Join-Path $root '.android-build\jdk21'
$env:ANDROID_HOME = Join-Path $root '.android-build\sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
npx.cmd cap sync android
```

Expected: Capacitor sync finishes successfully.

**Step 3: Build APK**

Run from `aurelia-books/android`:

```powershell
$root = Split-Path (Get-Location) -Parent
$env:JAVA_HOME = Join-Path $root '.android-build\jdk21'
$env:ANDROID_HOME = Join-Path $root '.android-build\sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
.\gradlew.bat assembleDebug --console=plain --no-daemon
```

Expected: `BUILD SUCCESSFUL`.

**Step 4: Copy APK**

Copy `aurelia-books/android/app/build/outputs/apk/debug/app-debug.apk` to a friendly ignored filename:

```powershell
Copy-Item android\app\build\outputs\apk\debug\app-debug.apk AureliaBooks-reader-lite-debug.apk -Force
```

### Task 8: Manual Android Acceptance Pass

**Files:**
- Use APK from Task 7.

**Step 1: Install on Android**

Install `AureliaBooks-reader-lite-debug.apk`.

**Step 2: Test reader flow**

Check:

- demo EPUB opens
- imported EPUB opens
- continuous scroll works for several minutes
- controls toggle quickly
- bookmark add/remove works
- TOC opens
- Search opens and returns results
- Settings opens

**Step 3: Test library flow**

Check:

- search filters books
- filters work
- sort works
- grid/list switch works
- long press opens Book Info
- list CRUD still works

**Step 4: Record follow-up bugs**

If any issue appears, add a new row to `docs/plans/task.md` instead of mixing unrelated fixes into this plan.

---

Plan complete and saved to `docs/plans/2026-06-13-reader-lite-library-polish-implementation.md`.

Next step: run `.agent/workflows/execute-plan.md` to execute this plan task-by-task in single-flow mode.
