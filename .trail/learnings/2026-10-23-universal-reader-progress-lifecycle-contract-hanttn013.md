---
title: Universal reader progress lifecycle contract
author: Hanttn013
date: 2026-10-23
branch: codex/phase-2-reader-adapters
touches:
  - aurelia-books/README.md
  - aurelia-books/scripts/cdp-seed-qa-library.mjs
  - aurelia-books/src/components/Reader/UniversalReaderScreen.jsx
  - aurelia-books/src/hooks/useReader.js
  - aurelia-books/src/readers/TextReaderAdapter.js
  - aurelia-books/src/utils/bookModelMigration.js
  - aurelia-books/src/utils/documentMetadata.js
  - aurelia-books/src/utils/epubMetadata.js
  - aurelia-books/src/utils/importWorkerClient.js
  - aurelia-books/src/utils/storageKeys.js
---

## Decided
Universal reader adapters keep their UI-facing progress as a 0..1 fraction, while UniversalReaderScreen converts persisted/localStorage progress to 0..100. Reflowable TXT/MD/HTML/DOCX locators retain their normalized `offset`, and pending scroll is captured synchronously so close, web/native background, and unmount can flush after DOM refs disappear.

## Tried and ruled out
Computing the current scroll position only from `contentRef` during effect cleanup was ruled out because React clears the DOM ref before the passive cleanup runs; the last debounced position must live in a ref captured by the scroll handler.

## Watch out
`useReader.startReading()` records the request while hidden/inactive but starts its clock only when both document visibility and Capacitor app state are active, so foreground events must continue to resume a requested session.
