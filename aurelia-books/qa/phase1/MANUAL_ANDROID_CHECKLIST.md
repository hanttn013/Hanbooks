# Phase 1 Android Manual Checklist

Playwright verifies browser history but cannot emit native Android Back or real
Capacitor lifecycle events. Run these checks on the debug APK:

- Open Book Detail, open Reader, press Android Back four times. Confirm the
  order Reader → Book Detail → previous tab → Home; one more Back exits.
- Open a list, scroll it, open a book, return with Back, and confirm the selected
  list and scroll position are restored.
- Read for at least 30 seconds, background the app, force-stop it, reopen it, and
  confirm reading time and EPUB position are retained.
- Import two copies of the same EPUB in one picker operation; confirm one is
  imported and one is reported as duplicate.
- Import an empty/corrupt EPUB; confirm the app remains usable and the metadata
  queue eventually reports failure without crashing.
- Pause the metadata queue, restart the app, confirm it stays paused; resume and
  confirm pending work completes.
