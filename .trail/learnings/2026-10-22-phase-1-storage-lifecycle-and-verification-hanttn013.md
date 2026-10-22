---
title: Phase 1 storage lifecycle and verification
author: Hanttn013
date: 2026-10-22
branch: codex/phase-1-stability-fixes
touches:
  - aurelia-books/README.md
  - aurelia-books/docs/AUDIT.md
  - aurelia-books/docs/DECISIONS.md
  - aurelia-books/qa/BUGS.md
  - aurelia-books/src/App.jsx
  - aurelia-books/src/components/Appearance/AppearanceScreen.jsx
  - aurelia-books/src/components/Appearance/AppearanceScreen.module.css
  - aurelia-books/src/components/Continue/ContinueScreen.jsx
  - aurelia-books/src/components/Continue/ContinueScreen.module.css
  - aurelia-books/src/components/Home/HomeScreen.jsx
---

## Decided
Phase 1 keeps the installed-data identity stable: Android appId remains com.aurelia.books and IndexedDB remains aurelia_db v4. Only localStorage keys migrate from aurelia_* to shanbooks_*, with new-key-wins semantics and removal of old keys. Metadata enrichment is a persistent bounded queue; reader time/progress flushes on web and Capacitor lifecycle boundaries; browser and Android Back share history snapshots.

## Tried and ruled out
Running Vitest and Vite build concurrently in this Windows sandbox caused an EPERM rename failure in the temporary transform cache before tests loaded. Running unit tests independently succeeds. Building Capacitor with the system JDK 17 fails because Capacitor 8 requires Java source release 21; the repository-local Temurin JDK 21 build succeeds.

## Watch out
The Phase 0 baseline Playwright test writes into qa/baseline, so a full later-phase run can change the historical captures; restore those generated changes after verification or separate immutable capture from assertions. ResizeObserver delivery warnings remain visible in E2E and are tracked as a later-phase issue.
