---
title: Phase 0 baseline evidence revalidation
author: Hanttn013
date: 2026-10-23
branch: codex/phase-2-reader-adapters
touches:
  - aurelia-books/docs/AUDIT.md
  - aurelia-books/docs/DECISIONS.md
  - aurelia-books/qa/BUGS.md
  - aurelia-books/qa/baseline/README.md
  - aurelia-books/tests/e2e/baseline.spec.js
  - aurelia-books/vitest.config.js
  - AGENTS.md
  - aurelia-books/qa/phase0/VERIFICATION.md
  - next-app/
---

## Decided
- Keep the committed 2026-10-22 `qa/baseline` captures immutable. The baseline spec now accepts `BASELINE_OUTPUT_DIR`, sets the destination screen before navigation, and asserts that every console entry uses a known screen label.
- Use Vitest's documented thread pool in this Windows app sandbox; the default fork pool fails before collection on an atomic temp-file rename.

## Tried and ruled out
- Running Playwright inside the filesystem/network sandbox stalled before tests because the local Vite socket was blocked. The same command outside the sandbox passed all viewport projects.
- Re-running the full E2E suite in the checkout rewrites tracked Phase 1/2 screenshots and generated ZIP fixtures. Those generated diffs were restored and should never be mixed into an audit-only commit.

## Watch out
- The historical baseline console JSON has correct messages/counts but stale `screen` labels around navigation. Use a redirected fresh run for label-sensitive analysis.
- The old Settings-clipping finding was a visual-audit false positive; all three stored screenshots show the full brand and heading.
