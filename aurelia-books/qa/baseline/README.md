# Phase 0 Baseline

Generated on 2026-10-22 with Playwright Test 1.64.1 and Chromium.

Each viewport directory contains six full-page screenshots:

- `home.png`
- `library.png`
- `lists.png`
- `settings.png`
- `book-detail.png`
- `reader.png`

It also contains `console.json` and `accessibility.json`. The latter is an axe
WCAG 2 A/AA and 2.1 A/AA scan. Reader host chrome is scanned, while the isolated
EPUB iframe is excluded and must be covered separately in later format tests.

Recreate the baseline with:

```powershell
npm run test:e2e:baseline
```
