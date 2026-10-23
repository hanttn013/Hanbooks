---
title: Phase 1 bounded queue and EPUB resource acceptance
author: Hanttn013
date: 2026-10-23
branch: codex/phase-2-reader-adapters
touches:
  - aurelia-books/src/hooks/useLibrary.js
  - aurelia-books/src/utils/StorageManager.js
  - aurelia-books/src/utils/destroyEpubBook.js
  - aurelia-books/src/readers/ManagedEpubView.js
  - aurelia-books/tests/e2e/phase1Acceptance.spec.js
---

## Decided
Phase 1 acceptance tests use fake timers and a mocked storage/parser boundary for 50-job concurrency, backoff, interrupted states, deletion and import races. Existing-record IndexedDB transactions prevent delayed metadata writes from recreating deleted books. Library maps persisted processing/ready to running/done for compatibility.

## Tried and ruled out
A 30-cycle Playwright probe exposed real epub.js 0.3.x leaks: Archive.destroy revokes cache keys rather than URL values, Resources.destroy leaves replacement URLs, and the default manager retains an anonymous unload callback plus an orientationchange listener due to a case mismatch. A managed default view and owned-URL cleanup fixed the observed growth; merely destroying the book was insufficient.

## Watch out
Keep resource instrumentation in browser tests; it verifies 30 destroyed instances and stable top-document listeners/URL counts, not a whole-heap proof. RAR/ZIP failures must be caught inside the per-file loop so later documents still import. Native process-death/back/file-provider checks remain physical-device sign-off.
