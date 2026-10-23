# Changelog

## Unreleased

### Phase 1 acceptance closure

- Added bounded-queue/retry/reload/deletion and import-race regressions.
- Reject damaged binary/container files before persistence; archive failures no
  longer stop later files in a batch, and per-file reasons remain in the summary.
- Show per-book queue states and fix EPUB Blob URL/global-listener cleanup.
- Added 30-cycle browser resource probes and physical Android acceptance steps.

### Phase 2 — Universal document readers

- Added offline import and lazy reader adapters for PDF, DOCX, TXT, Markdown,
  HTML, PPTX, CBZ, and existing EPUB files.
- Added content-based format detection, SHA-256 duplicate identity, locator
  migration, per-format reader smoke coverage, and bounded ZIP/RAR extraction.
- Added worker-backed hashing/DOCX conversion, sanitized HTML output, generic
  highlights/bookmarks, full ZIP backup/restore, storage quota status, and
  Capacitor Share Target ingestion.
- Added Phase 2 architecture notes and three-viewport import/reader evidence.

Known limitations: PPTX fidelity is intentionally best-effort; FB2/MOBI and
legacy binary Office files are rejected; Android `ACTION_VIEW`/"Open with"
handling still needs a native-device pass; dependency advisories remain open.

### Phase 1 — Stability fixes

- Made metadata extraction resumable, concurrency-limited, and retryable.
- Persisted reading time/progress across close and background lifecycle events.
- Reworked browser/Android Back navigation with history snapshots and scroll
  restoration.
- Migrated `aurelia_*` localStorage keys to `shanbooks_*` without changing the
  Android appId or IndexedDB database name.
- Removed non-functional reader settings and unused legacy screens.
- Rejected empty imports, serialized concurrent duplicate detection, and reused
  a managed IndexedDB connection.
