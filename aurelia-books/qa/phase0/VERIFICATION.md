# Phase 0 Verification Refresh

Date: 2026-10-23

Scope: `aurelia-books` on `codex/phase-2-reader-adapters`

Phase 0 originally landed in commits `2ae476e`, `2e3d247`, and `45c754c`.
This refresh validates those artifacts without resetting or overwriting the
later Phase 1 and Phase 2 work already present on the branch.

## Results

| Command | Result |
| --- | --- |
| `npm install` | Completed; lockfile unchanged. |
| `npm run lint` | Pass; 0 errors and 0 warnings. |
| `npm run test:unit` | Pass; 12 files, 43 tests. |
| `npm run build` | Pass; Vite 8.0.16 transformed 598 modules. |
| `npm run test:e2e:baseline` | Pass; 3/3 projects in 46.0 seconds. |
| `npm run test:e2e` | Pass; 18/18 tests in 1.7 minutes. |
| `npm audit --omit=dev` | 11 advisories: 3 moderate, 6 high, 2 critical. |

The Playwright reruns set `BASELINE_OUTPUT_DIR` to temporary storage. The 18
tracked screenshots and six tracked JSON files under `qa/baseline/` therefore
remain the immutable Phase 0 evidence.

## Verified limitations

- A dedicated Playwright MCP endpoint was not available; the repository's local
  Playwright Test runner exercised the same Chromium workflow.
- The Reader axe scan covers host chrome, not the sandboxed EPUB iframe.
- Vite still reports intermittent `ResizeObserver loop completed with
  undelivered notifications` messages during E2E.
- The production audit still contains 11 advisories, several without an
  available upstream fix.
- Native Android Back, Open With, Share Target, and file-picker behavior require
  the manual device checklist.
