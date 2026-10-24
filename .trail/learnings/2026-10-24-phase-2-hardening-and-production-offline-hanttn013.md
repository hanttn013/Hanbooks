---
title: Phase 2 hardening and production offline acceptance
author: Hanttn013
date: 2026-10-24
branch: codex/phase-2-reader-adapters
touches:
  - aurelia-books/src/utils/StorageManager.js
  - aurelia-books/src/utils/archiveWorkerClient.js
  - aurelia-books/scripts/offline-plugin.mjs
  - aurelia-books/src/components/Reader/UniversalReaderScreen.jsx
---

## Decided
- Validate ZIP central-directory limits before DOCX/PPTX/CBZ/full-backup decompression. Data-only merge must retain local blobs; validate record keys before clear/write transactions.
- Reflowable search returns stable paragraph/heading anchors and quotes. Persisted progress remains 0–100 while adapter locations use 0–1.
- Archive extraction uses a separate worker entry/client to avoid circular Vite worker bundles. Reconstruct custom archivePath after File structured clone.
- Production web shell precaches emitted lazy readers, WASM and workers; Capacitor retains packaged assets. Offline acceptance must cold reload and open lazy formats, then restore a full backup after clearing test records.
## Tried and ruled out
- Five sampled hash blocks miss changes elsewhere; every 1 MB block now contributes.
- Default cache matching misses crossorigin module requests when Vary: Origin differs from precache headers. Ignore Vary only for the same-origin build-asset cache.
- Dev-server offline success does not certify production installation. Do not rebuild assets during a production offline test.
## Watch out
- Final automated set: 74 unit, 33 E2E, 1 production offline/restore. Existing EPUB ResizeObserver/font/iframe console noise remains; passing assertions do not certify clean console.
- EPUB compatibility UI is deliberately retained, not converted to BaseReaderAdapter. ACTION_VIEW is not implemented; native SEND/SEND_MULTIPLE requires physical-device testing.
- 100–500 MB peak RAM and complex DOCX/PPTX fidelity are not certified. Whole-buffer ZIP backup/parsers have overhead; text fallback cannot guarantee images.
- Full suite rewrites historical Phase 1 evidence and fixture ZIP timestamps. Back up generated output with hash checks before restoring historical artifacts; retain Phase 2 evidence.
