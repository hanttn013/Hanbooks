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
