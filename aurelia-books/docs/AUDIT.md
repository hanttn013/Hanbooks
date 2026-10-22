# Phase 0 Audit

Date: 2026-10-22  
Scope: `aurelia-books` only; `soft-pages` and `next-app` were not assessed.

## Executive summary

ShanBooks builds and its existing EPUB happy path can be exercised in Chromium
at all three target viewport sizes. Phase 0 established repeatable unit, E2E,
visual, console, and accessibility baselines. No confirmed P0 data-loss or
startup-crash defect was found in the exercised path.

The current product is still an EPUB-focused MVP. The highest verified risks are
invalid interactive markup and unlabeled controls, disabled page zoom, low
contrast on mobile, invalid bundled font files, and dependency advisories. Code
inspection also confirms that the fast-import metadata state is not copied into
the persisted book record, so the background metadata queue cannot reliably
start. That defect belongs to Phase 1 and was intentionally not redesigned here.

## Baseline method

- Installed dependencies with `npm install`.
- Captured Home, Library, Lists, Settings, Book Detail, and Reader at 360x800,
  768x1024, and 1440x900.
- Stored 18 PNGs plus per-viewport `console.json` and `accessibility.json` under
  `qa/baseline/`.
- Used Playwright Test 1.64.1 with Chromium. A dedicated Playwright MCP endpoint
  was not exposed in this environment, so the same browser workflow was executed
  through the local Playwright runner.
- Scanned WCAG 2 A/AA and 2.1 A/AA rules with `@axe-core/playwright` 4.14.0.
  The EPUB iframe is excluded from axe because it is a separate sandboxed
  document; its host reader UI remains in scope.
- Added Vitest 4.1.12 instead of Vitest 5 because the active Node.js 25 runtime is
  outside Vitest 5's documented engine range.

## Confirmed findings

### P0 — release blocker / data loss

No P0 issue was confirmed in the Phase 0 browser path. This does not yet certify
storage migrations, backup/restore, native lifecycle persistence, corrupted
files, or large imports; those require the later phase scenarios.

### P1 — high impact

| ID | Finding | Evidence / impact | Target |
| --- | --- | --- | --- |
| P1-01 | Fast-import metadata state is dropped | `addBook()` does not persist the pending state expected by the background metadata processor. Cover/metadata enrichment can stall until manual repair. | Phase 1 |
| P1-02 | Invalid nested interactive controls | axe reports `nested-interactive` on Home and Library/Book Detail. Nested buttons/roles produce unreliable keyboard and screen-reader behavior. | Phase 3, or earlier bug fix |
| P1-03 | Sort/list selects lack accessible names | axe reports critical `select-name` in Library and Book Detail. | Phase 3, or earlier bug fix |
| P1-04 | Zoom disabled | Every captured screen reports `meta-viewport`; `user-scalable=no` prevents user zoom. | Phase 3 |
| P1-05 | Mobile contrast failures | axe reports `color-contrast` on Home, Library, Lists, Settings, and Book Detail at 360x800; the Want to Read card is also visibly unreadable. | Phase 3 |
| P1-06 | Bundled Montserrat assets are invalid | Every viewport logs decode/OTS warnings for Regular, SemiBold, and Bold font files. Rendering falls back and produces 6 warnings per run. | Phase 3 |
| P1-07 | Settings header is clipped | Visible in all three Settings screenshots; title/brand content is cut above the phone frame. | Phase 3 |
| P1-08 | Dependency advisories | `npm audit --omit=dev` reports 11 vulnerabilities: 2 critical, 6 high, 3 moderate. Critical advisories include `@capacitor/android` and `tar`; `epubjs` pulls a vulnerable `@xmldom/xmldom`. Several have no upstream fix. | Phase 1/2 dependency review |

### P2 — medium/low impact or maintainability

| ID | Finding | Evidence / impact | Target |
| --- | --- | --- | --- |
| P2-01 | EPUB scripts generate console errors when blocked | Five `about:srcdoc` script-block errors appear when the sandboxed EPUB opens. Blocking script is the safe behavior, but the noise violates the final no-console-error goal. | Phase 2 |
| P2-02 | Tablet/desktop keep a narrow phone shell | 768px and 1440px captures do not use the available width. | Phase 3 |
| P2-03 | Main bundle is large | Vite reports a 770.84 kB JavaScript chunk (240.72 kB gzip) and the >500 kB warning. | Phase 2/4 |
| P2-04 | Raw source metadata leaks into synopsis | The demo Book Detail shows lengthy Project Gutenberg boilerplate instead of a concise description. | Phase 1/3 |
| P2-05 | Reader axe coverage is incomplete | The sandboxed EPUB iframe is excluded from the automated host-page scan. Format-specific content accessibility needs separate coverage. | Phase 2/5 |
| P2-06 | Legacy product identifiers remain | UI says ShanBooks while appId/storage keys retain Aurelia names. appId must stay stable; storage keys need migration. | Phase 1 |
| P2-07 | Native Android behavior is unverified in Phase 0 | Browser automation cannot verify the native back button, share/open intent, or Android file picker. | Phase 1/2 manual checklist |
| P2-08 | ResizeObserver warning reaches the Vite error channel | The final E2E run logged `ResizeObserver loop completed with undelivered notifications` once per viewport. Tests still passed, but the source observer/layout loop needs isolation. | Phase 1/3 |

## Accessibility baseline counts

Counts below are violation rule types, not individual affected DOM nodes.

| Viewport | Home | Library | Lists | Settings | Detail | Reader |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 360x800 | 3 | 4 | 2 | 2 | 4 | 1 |
| 768x1024 | 2 | 3 | 1 | 1 | 3 | 1 |
| 1440x900 | 2 | 3 | 1 | 1 | 3 | 1 |

## Console baseline

Each viewport recorded 11 browser-console entries: six invalid-font warnings and
five blocked sandbox-script errors. No uncaught page exception was written to the
captured page-console JSON. Separately, Vite's error channel received one
ResizeObserver delivery warning per viewport during the final test run. Raw page
entries are kept beside each viewport's screenshots.

## Phase 0 fixes

- Removed the synchronous state update from the Book Detail metadata effect and
  derived queue activity from persisted metadata status.
- Removed a duplicated bookmark-loading effect in Book Detail.
- Removed two unused catch bindings in Library.
- Added a regression test proving Book Detail reads bookmarks once and triggers
  metadata repair once.

## Not yet certified

Phase 0 does not claim support for PDF, DOCX, TXT/MD/HTML, PPTX, CBZ, or FB2;
does not certify IndexedDB migration or full backup/restore; and does not certify
Android-native navigation or lifecycle persistence. Those remain explicit work
for Phases 1–5.

## Phase 1 follow-up — 2026-10-22

The following Phase 0 risks are now covered by regression tests and fixed:

- Fast imports persist metadata queue state; extraction runs with concurrency 2,
  retries up to three attempts with backoff, and resumes interrupted `processing`
  records as `pending` after reload.
- Concurrent imports are serialized around duplicate detection and persistence;
  empty files are rejected before storage.
- Reading time and the latest reader progress are flushed on unmount,
  `visibilitychange`, `pagehide`, `beforeunload`, and Capacitor
  `appStateChange`.
- Browser history restores Reader → Book Detail → previous tab → Home, including
  the tab scroll position. Android Back uses the same history and exits only from
  Home.
- Legacy `aurelia_*` localStorage values migrate to `shanbooks_*`; the IndexedDB
  name and Android appId intentionally remain unchanged to retain installed data.
- Non-functional `chapterFlow` and `pageTurnEffect` controls and unreferenced
  Continue/Appearance screens were removed.

Remaining visual, accessibility, font, bundle, console, and dependency findings
keep their Phase 0 priority and are not claimed as resolved by Phase 1.

Phase 1 verification completed with 13 unit tests and 15 Playwright tests, plus
clean ESLint and production builds. The Capacitor debug APK also compiled with
JDK 21. Native device behavior remains explicitly manual; see
`qa/phase1/MANUAL_ANDROID_CHECKLIST.md`.
