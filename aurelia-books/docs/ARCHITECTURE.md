# ShanBooks Phase 2 Architecture

## Import and reader flow

The browser receives a `File`, then `formatDetector` classifies it using magic
bytes, ZIP central-directory names, MIME, and extension. `useLibrary.addBook`
computes a content hash, rejects empty/unsafe input, extracts lightweight
metadata, and persists the original `Blob` in the existing IndexedDB book
record. Heavy parsing is lazy: `readerRegistry` loads only the adapter for the
selected format when Reader opens.

All adapters implement `BaseReaderAdapter`: open, metadata, cover, TOC,
navigation, search, location, theme, relocation events, and destroy. EPUB keeps
the existing sandboxed renderer for compatibility. PDF uses PDF.js, DOCX uses
Mammoth, text/Markdown/HTML use the text adapter, PPTX uses `@web-ppt/core`,
and CBZ uses a bounded ZIP image sequence. The Universal Reader renders their
common metadata/location contract and retains the existing EPUB screen.

## Location and migration

New positions are versioned JSON locators (`format`, page/slide/chapter and
offset). Legacy EPUB CFI values remain readable and are migrated lazily by
`bookModelMigration`; bookmarks retain a quote and optional note for reflowable
formats. This avoids coupling progress storage to one renderer.

## Workers and safety boundaries

- `import.worker.js` performs format detection and hashing off the UI thread.
- `docx.worker.js` keeps Mammoth conversion off the UI thread when Worker is
  available; the main-thread fallback preserves WebView compatibility.
- `archive.worker.js` extracts mixed ZIP/RAR batches off the UI thread; the
  client reconstructs folder paths lost by structured cloning of File objects.
- PDF.js and PPTX parsing use their own worker builds when supported.
- HTML/Markdown output is sanitized with DOMPurify; external images and active
  elements are removed. DOCX external file access is disabled.
- ZIP/RAR imports enforce archive size, entry count, total extracted bytes,
  per-entry bytes, path depth, and compression-ratio limits before extraction.

## Backup and native handoff

Data JSON backups preserve metadata/progress/bookmarks. Full backups are ZIP
archives containing a manifest and each stored document blob, so a restore can
reconstruct offline files. Storage quota/persistence status is visible in
Settings. Capacitor Share Target handles files shared into the app and feeds
the same import path; Android `SEND` filters are registered. Native `ACTION_VIEW`
"Open with" handling remains a manual follow-up.

## Supported formats and fidelity

| Format | Phase 2 status | Notes |
| --- | --- | --- |
| EPUB | Supported | Existing sandboxed EPUB renderer retained. |
| PDF | Supported | Page canvas, text layer, TOC/search and zoom. |
| DOCX | Supported | Mammoth HTML conversion; complex layout may simplify. |
| TXT/MD/HTML | Supported | Encoding fallback and sanitized/reflowable content. |
| PPTX | Supported with warning | Text/slide SVG path; fidelity depends on `@web-ppt/core`. |
| CBZ | Supported | Natural-sort image pages and bounded extraction. |
| FB2/MOBI/legacy Office | Rejected with actionable message | No adapter is shipped in Phase 2. |

## Phase 2 hardening and offline shell

Reflowable search emits stable block IDs and quote locators, not unconnected
character offsets. Reader provides saved bookmark navigation and working font,
size, margins, line-height, theme, and scroll/page controls. PDF fit-width uses
the actual reading pane; zoom scales both canvas and selectable text layer.
The existing EPUB screen remains a compatibility boundary, not a new adapter.

ZIP central-directory limits are checked before DOCX/PPTX/CBZ parsing and full
backup extraction. RAR checks declared size/depth/ratio before selecting entries
and checks actual output sizes; extraction runs in a terminable worker. These
are bounded whole-buffer parsers, not streaming guarantees for 500 MB inputs.
Inline CSS is stripped alongside scripts to block CSS resource requests.

Production web builds emit a versioned service worker that precaches the shell,
all lazy format chunks, WASM, and workers. Original books remain in IndexedDB.
One successful online installation is necessary; demo originals are not shell
assets. Android disables service-worker registration and uses packaged assets.
Cache matching ignores Vary for immutable same-origin emitted assets, avoiding
the different Origin headers of module/precache requests. No API responses or
user document blobs are cached by this service worker.

Data-only merges preserve existing original blobs. All snapshot record keys are
validated before any clear/write transaction. Restored percentages refresh the
localStorage progress cache as well as IndexedDB. Large-file identities hash
every 1 MB block rather than sampling only five positions.
