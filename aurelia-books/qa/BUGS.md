# QA Bug Log

| ID | Severity | Reproduction | Expected | Actual / root cause | Status |
| --- | --- | --- | --- | --- | --- |
| QA-001 | P1 | Run `npm run lint` on the Phase 0 starting revision. | No hook lint error. | Book Detail synchronously called a state setter from its metadata effect. | Fixed; unit regression added. |
| QA-002 | P2 | Run `npm run lint` on the Phase 0 starting revision. | No unused variables. | Two Library catch bindings named `e` were unused. | Fixed. |
| QA-003 | P1 | Open any screen and inspect the browser console. | Custom fonts decode without warnings. | Three Montserrat OTF files fail browser decoding/OTS validation. | Open; Phase 3. |
| QA-004 | P1 | Run the baseline axe scan on Home, Library, or Book Detail. | Interactive controls are not nested. | Card/button containers include other button-like descendants. | Open; Phase 3. |
| QA-005 | P1 | Run the baseline axe scan on Library and Book Detail. | Every select has an accessible name. | Sort and list selects are unlabeled (`select-name`, critical). | Open; Phase 3. |
| QA-006 | P1 | Run axe at 360x800 and inspect the viewport meta tag. | WCAG AA contrast and user zoom are available. | Five screens have contrast failures; every screen disables zoom. | Open; Phase 3. |
| QA-007 | P1 | Open Settings at each baseline viewport and inspect the stored PNGs. | Header is fully visible. | The original audit interpretation was incorrect; all three captures show the complete brand and heading. | Invalidated 2026-10-23; no product defect. |
| QA-008 | P2 | Open the app at 768x1024 or 1440x900. | Layout uses tablet/desktop space. | UI remains a centered narrow phone shell. | Open; Phase 3. |
| QA-009 | P2 | Open the demo EPUB and inspect console. | Safe content produces no console errors. | Sandboxed `about:srcdoc` blocks five script executions; security posture is correct but console is noisy. | Open; Phase 2. |
| QA-010 | P1 | Fast-import an EPUB that needs background metadata extraction. | Persisted status enters the worker queue and finishes/retries. | `addBook()` dropped the pending state expected by the metadata processor. | Fixed Phase 1; pending/processing/retry/reload regression tests pass. |
| QA-011 | P1 | Run `npm audit --omit=dev`. | No unresolved production advisories. | 11 vulnerabilities: 2 critical, 6 high, 3 moderate; some have no fix. | Open; dependency review required. |
| QA-012 | P2 | Run the full Playwright suite and watch the Vite server output. | No unhandled browser error reaches the dev server. | `ResizeObserver loop completed with undelivered notifications` appears once per viewport; all assertions still pass. | Open; isolate observer/layout source in Phase 1/3. |
| QA-013 | P1 | Read, then close Reader or background the app before another React render. | Elapsed time and latest progress persist immediately. | Stats previously depended on a later state-effect write; progress only flushed on Reader cleanup/button close. | Fixed Phase 1; unit lifecycle and Playwright page-background tests added. |
| QA-014 | P1 | Open Library → Book Detail → Reader, then press browser Back repeatedly. | Reader → Detail → Library → Home. | State-only unwinding and new history pushes skipped/duplicated views. | Fixed Phase 1; Playwright passes at all three viewports. |
| QA-015 | P1 | Change `chapterFlow` or `pageTurnEffect`. | Setting changes renderer behavior. | Page animation was unused; chapter flow only changed spacing. | Fixed Phase 1 by removing both controls and stale values. |
| QA-016 | P1 | Run two identical imports concurrently. | One new book and one duplicate result. | Both calls checked the same stale `booksRef` before either persisted. | Fixed Phase 1 by serializing the import critical section. |
| QA-017 | P2 | Import a zero-byte EPUB. | Clear failure without a stored unreadable item. | Fast import previously accepted and stored the empty file. | Fixed Phase 1; unit regression added. |
| QA-018 | P2 | Repeatedly call StorageManager operations during a long session. | One managed IndexedDB connection is reused and can close for deletion/version changes. | `openDB()` created a new connection for every operation. | Fixed Phase 1 with cached connection and explicit close lifecycle. |
| QA-019 | P2 | Import a PDF and trigger a second render before the first finishes. | The previous render is cancelled without an application error. | PDF.js rejects a concurrent canvas render; adapter now cancels per-canvas tasks and ignores expected cancellation errors. | Fixed Phase 2; three-viewport reader smoke passes. |
| QA-020 | P1 | Import a full backup containing a document blob, then restore it offline. | The book and original file are restored together. | JSON-only backup could preserve metadata but not the offline file. | Fixed Phase 2 with manifest + blob ZIP backup; 500 MB cap remains. |
| QA-021 | P2 | Share a supported document into the Android app. | The shared file enters the same import queue. | Browser cannot exercise Capacitor handoff; native Share Target and SEND filters are wired, but device verification remains manual. | Phase 2 implementation; manual check pending. |
| QA-022 | P2 | Inspect `screen` values in the original baseline `console.json` files. | Navigation-time messages are attributed to the screen that emitted them. | `activeScreen` changed only at capture time, so startup font warnings and Reader iframe errors were assigned to stale labels. | Fixed; temporary three-viewport rerun and regression assertion pass. |
| QA-023 | P2 | Run the configured Vitest command inside the Windows app sandbox. | Tests collect and execute normally. | Vitest's default fork pool uses an atomic temp-file rename blocked by the sandbox (`EPERM`) before collection. | Fixed by using the supported thread pool; 43/43 tests pass. |

Detailed screenshots, raw console entries, and raw axe violations are stored in
`qa/baseline/`; its historical console labels have the limitation documented in
`docs/AUDIT.md`. Phase 1 navigation evidence is stored in `qa/phase1/`.
