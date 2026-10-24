# Phase 2 verification — 2026-10-23 (report closed 2026-10-24)

## Automated checks

| Command | Final result |
| --- | --- |
| npm run lint | Pass, zero ESLint errors |
| npm run test:unit | 18 files, 74 passed / 0 failed |
| npm run build | Pass, 610 modules; lazy readers/workers and sw.js emitted |
| npm run test:e2e | 33 passed / 0 failed, 3.5 minutes, three viewports |
| Navigation regression within full suite | 15 passed / 0 failed |
| npx playwright test --config playwright.offline.config.js | 1 passed / 0 failed (7.0 seconds including setup) |
| npx cap sync android | Pass; App and Capgo Share Target plugins synced |
| gradlew.bat -p android assembleDebug | BUILD SUCCESSFUL, 22s, 153 tasks (27 executed) |

APK: android/app/build/outputs/apk/debug/app-debug.apk, 43,231,300 bytes.
SHA-256: 5C595DA680F3B4835D405BA538847A1BFC193CC402710C114007DAD8CA48953E.

Initial offline test failed (blank shell: module/CSS cache misses caused by Vary
headers); fixed, isolated retest passed. An intervening diagnostic run was
cancelled. The final result above is a fresh run on the final production build,
not a count of all attempts.

## Confirmed coverage

- Seven non-EPUB formats import and open at 360x800, 768x1024 and 1440x900.
  EPUB navigation/resources remain covered by the existing full suite.
- Long Markdown search jumps to the target, adds/navigates bookmarks, exposes
  working reader settings and resumes at the target after close/reopen.
- Unit regressions: safe HTML/CSS, stable search anchors, data-only merge retains
  original blobs, invalid backup fails without clearing data, all-block hash,
  archive worker cleanup/path reconstruction.
- Offline test installs production assets once, disables network, cold-reloads,
  imports/opens all seven formats without prior lazy-reader visits, exports full
  ZIP, clears test library records, restores and reopens every format offline.
- New screenshots are in the viewport subdirectories, offline/ and baseline/.
  Historical Phase 1 evidence/fixture ZIP timestamps were restored after making
  hash-verified backups of the generated rerun output.

## Limits and remaining gates

- Native Share/Back/file picker/background kill require MANUAL_ANDROID_CHECKLIST.md.
  ACTION_VIEW Open With is not implemented; SEND/SEND_MULTIPLE is wired, unverified
  on hardware. Do not describe this as only a missing device test for ACTION_VIEW.
- Small synthetic fixtures do not certify complex Word/PowerPoint documents or
  100–500 MB peak RAM. Whole-buffer conversion/full ZIP backup still has memory
  overhead and a 500 MB backup cap; streaming optimization remains open.
- EPUB remains the existing compatibility screen rather than a BaseReaderAdapter.
- DOCX reflows; PPTX effects/fonts/media may differ. Text fallback on SVG failure
  does not guarantee original images. FB2/MOBI/AZW3 and legacy Office are deferred.
- Existing font decoding, iframe script blocking and EPUB ResizeObserver console
  noise remain open. Passing tests do not mean zero console errors or axe-clean UI.
- Prior production audit reports 11 dependency advisories (2 critical, 6 high,
  3 moderate); no dependency upgrade or new audit claim is made in this closure.
- Initial bundle warning (~753 kB minified) remains for Phase 4.
