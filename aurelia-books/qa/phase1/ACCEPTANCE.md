# Phase 1 acceptance — 2026-10-23

## Confirmed by automated checks

| Requirement | Evidence / result |
| --- | --- |
| Queue concurrency, 50 books | `metadataQueue.test.jsx`: maximum active tasks is two, including manual starts. |
| Backoff / attempt limit | Fake timers verify no early retry, 1s/5s backoff, three attempts, persisted failed reason and no further retry. |
| Interrupted job / reload | Both processing and running normalize to pending; persisted retry time survives remount. |
| Deletion / storage failure | Late completion cannot recreate deleted records; initial storage failure releases the active slot. Actual IndexedDB transaction test also passes. |
| Queue UI | Playwright uses a controlled parser delay to observe pending/running, then done, alongside a persisted failed record. Screenshots in `acceptance/<viewport>/`. |
| Invalid input isolation | Truncated EPUB, broken ZIP/RAR, zero-byte file, renamed text fail individually; valid NFD Vietnamese text survives the same batch; IndexedDB has exactly one added book. |
| Import races | Parallel imports and repeated NFC/NFD file names yield one record per duplicate identity; content hash tests verify filename-independent identity. |
| Reader resources | 30 open/close cycles in each viewport. Instrumentation wraps the real EPUB constructor and counts destruction, live Blob URLs, frames and global listeners. Per-cycle JSON retained. |

## Verification commands

- `npm run lint`: pass, zero errors.
- `npm run test:unit`: 17 files, 67 passed, zero failed.
- `npm run build`: pass; 609 modules; large-chunk warning remains.
- `npm run test:e2e`: 30 passed, zero failed, all three viewports (4.6 minutes).
- Navigation regression: 15/15 smoke/navigation tests pass; separate navigation
  plus queue-state screenshot rerun: 18/18 passed, zero failed (1.4 minutes).
- `npx cap sync android`: pass.
- `gradlew.bat assembleDebug` with JDK 21: BUILD SUCCESSFUL, 153 tasks.

| Resource probe | Cycles | Remaining Blob URLs | Remaining EPUB instances / frames | Global listener growth |
| --- | ---: | ---: | --- | ---: |
| 360×800 | 30 | 0 | 0 / 0 | 0 |
| 768×1024 | 30 | 0 | 0 / 0 | 0 |
| 1440×900 | 30 | 0 | 0 / 0 | 0 |

## Physical device sign-off still required

Follow `MANUAL-DEVICE-CHECKLIST.md` on a real Android device. Native Back event
dispatch, process death after background/swipe kill, native file provider/picker
permissions and Android share intents cannot be certified by Chromium tests.

## Known findings outside this closure

- P2: Vite still logs intermittent ResizeObserver delivery warnings.
- Existing font/accessibility/Spectrum issues and dependency advisories remain
  tracked in `docs/AUDIT.md`; this work adds no new product feature.
- Resource instrumentation certifies the measured instances/URLs/listeners over
  30 cycles; it is not a claim that every browser heap allocation has been freed.

## Debug artifact

`android/app/build/outputs/apk/debug/app-debug.apk` built with repository JDK 21.
Size: 43,230,518 bytes.
SHA-256: `F5DF8EA672F106CCA68974E9DEE76107E9FB923F2BCC782AB7C8AF7A663865E3`.

Generated historical QA/fixture changes were restored only after making and
hash-verifying copies of all 53 files under the repository-local
`.phase1-verification-backup-20261023/`. This recovery copy is uncommitted;
new acceptance evidence is committed separately under `qa/phase1/acceptance/`.
