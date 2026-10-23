---
title: Phase 2 universal readers and offline import
author: Hanttn013
date: 2026-10-23
branch: codex/phase-2-reader-adapters
touches:
  - aurelia-books/CHANGELOG.md
  - aurelia-books/android/app/capacitor.build.gradle
  - aurelia-books/android/app/src/main/AndroidManifest.xml
  - aurelia-books/android/capacitor.settings.gradle
  - aurelia-books/docs/ARCHITECTURE.md
  - aurelia-books/docs/AUDIT.md
  - aurelia-books/docs/DECISIONS.md
  - aurelia-books/package-lock.json
  - aurelia-books/package.json
  - aurelia-books/qa/BUGS.md
---

## Decided
- Phase 2 uses one BaseReaderAdapter contract with lazy format chunks for PDF, DOCX, TXT/MD/HTML, PPTX, CBZ, while retaining the existing EPUB renderer.
- New positions are versioned JSON locators; legacy EPUB CFI remains readable.
- Full backups are manifest-plus-blob ZIPs with explicit archive limits; native share target feeds the same import path.

## Tried and ruled out
- Loading PDF.js, Mammoth, Marked/DOMPurify, PPTX parsing, and archive decompression in the startup bundle was rejected; format-specific lazy chunks keep the initial path smaller.
- Exact PPTX fidelity and legacy binary Office/FB2/MOBI support were not claimed without dedicated adapters.

## Watch out
- `npm audit --omit=dev` still reports 11 production vulnerabilities (3 moderate, 6 high, 2 critical), several without fixes.
- Android Share Target and native Back/Open-with still require the physical-device checklist; Playwright only verifies browser import/readers.
- Full E2E rewrites tracked baseline images and fixture ZIPs; restore those generated artifacts before committing and keep only `qa/phase2` evidence.
