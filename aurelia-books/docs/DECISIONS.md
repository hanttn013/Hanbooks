# Engineering Decisions

## 2026-10-23 — Phase 1 queue and EPUB cleanup acceptance

Persisted queue values `processing`/`ready` remain compatible with existing data;
the Library exposes them as `running`/`done`, and interrupted `running` or
`processing` jobs normalize to `pending` on startup. Capacity is checked at the
task entry point as well as the scheduler. Book updates use an existing-record
transaction so delayed extraction cannot recreate a deleted book.

The installed epub.js has archive URL revocation and global-listener cleanup
defects. The reader supplies a small managed default view and revokes the book's
owned archive/replacement URLs before destruction. Browser resource probes count
live EPUB instances, URLs, frames, and global listener registrations for 30 cycles.

## 2026-10-22 — Keep Phase 0 behavior changes narrow

Phase 0 fixes only the three requested lint failures and the duplicate bookmark
read discovered beside the same Book Detail effect. Metadata queue architecture,
navigation, storage migrations, reader settings, and new formats remain separate
phase work so the baseline stays comparable.

## 2026-10-22 — Use Vitest 4 on Node.js 25

The active runtime is Node.js 25.9.0. Vitest 5 documents support for Node
`^22.12 || ^24 || >=26`, so Phase 0 pins Vitest 4.1.12 rather than installing a
package whose declared engine excludes this runtime. Revisit on the next Node
LTS/runtime upgrade.

## 2026-10-22 — Keep deterministic generated fixtures

Test documents are generated locally by `scripts/generate-test-fixtures.mjs`.
They contain only synthetic text and minimal package structures, avoiding
copyrighted fixtures while keeping binary import tests reproducible.

## 2026-10-23 — Use Vitest thread workers in the Windows app sandbox

Vitest's default fork pool copies transformed modules through an atomic rename in
the system temp directory. The Windows app sandbox rejects that rename with
`EPERM` before any test is collected. The documented thread pool exercises the
same suite without that filesystem operation; both an unrestricted default-pool
run and the configured thread-pool run pass all 43 tests.

## 2026-10-22 — Do not auto-fix dependency advisories

The production audit includes vulnerable transitive packages and advisories with
no available fix. Phase 0 records the exact risk instead of running an automatic
upgrade that could change EPUB or Capacitor behavior without regression coverage.

## 2026-10-22 — Preserve the native application identity

Future renaming will keep `com.aurelia.books` so existing Android installations
continue to address the same app data. Storage key renaming must be implemented
as an explicit read-old/write-new migration in Phase 1.

## 2026-10-22 — Migrate localStorage, preserve IndexedDB and appId

Phase 1 copies each `aurelia_*` localStorage value to its `shanbooks_*`
equivalent only when the new key does not already exist, then removes the old
key. Per-book progress keys are migrated dynamically. `aurelia_db` remains at
schema v4 and `com.aurelia.books` remains the Android appId because renaming
either would disconnect existing installations from their data.

## 2026-10-22 — Persist metadata work in book records

Metadata jobs use fields on the existing book record (`metadataStatus`, attempt
count, next retry timestamp, and error) instead of an in-memory-only queue or a
new IndexedDB store. This avoids a schema bump while making jobs resumable.
Concurrency is capped at two and automatic retries stop after three attempts;
manual Repair Info remains available.

## 2026-10-22 — Remove settings that do not change reader behavior

`pageTurnEffect` had no renderer implementation. `chapterFlow` only changed end
marker spacing while both options used the same navigation behavior. Both were
removed from defaults and UI rather than presenting controls that overpromise.

## 2026-10-22 — Use history snapshots as navigation state

Each internal view stores tab, list, detail-book, reader-book, and tab scroll
state in `history.state`. Browser and Android Back consume the same stack.
Android exits only when the current state is Home. Native back-button behavior
still requires the manual device checklist because Playwright cannot emit the
Capacitor native event.

## 2026-10-23 — Keep one adapter contract and lazy-load heavy readers

PDF.js, Mammoth, Marked/DOMPurify, `@web-ppt/core`, and fflate are loaded from
format-specific chunks instead of the startup path. Every new reader implements
the same adapter contract so progress, search, TOC, bookmarks, and Reader UI do
not grow format-specific storage branches. The legacy PDF.js build is selected
for older WebViews; a worker is still used when the runtime supports it.

## 2026-10-23 — Prefer safe best-effort document support

PPTX is exposed with a fidelity notice because browser conversion cannot promise
PowerPoint layout parity. Legacy binary Office, FB2, and MOBI are rejected with
an actionable unsupported-format message until dedicated adapters exist. HTML,
Markdown, DOCX output, and archive extraction are treated as untrusted input and
are bounded/sanitized before display.

## 2026-10-23 — Full backup is an explicit ZIP format

JSON backups remain the portable metadata format. Full backups add a manifest
and the original blobs under `books/`, allowing offline restoration without a
server. The implementation caps the archive at 500 MB and surfaces missing-file
state instead of silently inventing a readable book.

## 2026-10-23 — Verify offline with a production shell, not a dev server

Precache emitted build assets with a small Vite plugin; avoid a new runtime
dependency. Native Capacitor continues using bundled assets. The acceptance test
turns network off before first lazy reader load, then exports a ZIP, clears the
test library records, restores and opens every format again. Precache requests
and crossorigin modules have different Origin headers; ignore Vary only for our
same-origin asset-cache lookup. Do not rebuild while this test is running.

Mammoth is a semantic converter, not a Word page-layout engine, and explicitly
does not sanitize output; DOCX conversion therefore retains DOMPurify and a
visible fidelity notice. See [Mammoth documentation](https://github.com/mwilliamson/mammoth.js).
PPTX remains best-effort SVG with an explicit warning and a text fallback on
slide-render failure; images/advanced effects are not guaranteed in fallback.
