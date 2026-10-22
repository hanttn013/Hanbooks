# Engineering Decisions

## 2026-10-22 — Keep Phase 0 behavior changes narrow

Phase 0 fixes only the three requested lint failures and the duplicate bookmark
read discovered beside the same Book Detail effect. Metadata queue architecture,
navigation, storage migrations, reader settings, and new formats remain separate
phase work so the baseline stays comparable.

## 2026-10-22 — Use Vitest 4 on Node.js 25

The active runtime is Node.js 25.9.0. Vitest 5 documents support for Node
`^22.12 || ^24 || >=26`, so Phase 0 pins Vitest 4.1.12 rather than installing a
package whose declared engine excludes this runtime. Revisit on the next Node
LTS/runtime upgrade.

## 2026-10-22 — Keep deterministic generated fixtures

Test documents are generated locally by `scripts/generate-test-fixtures.mjs`.
They contain only synthetic text and minimal package structures, avoiding
copyrighted fixtures while keeping binary import tests reproducible.

## 2026-10-22 — Do not auto-fix dependency advisories

The production audit includes vulnerable transitive packages and advisories with
no available fix. Phase 0 records the exact risk instead of running an automatic
upgrade that could change EPUB or Capacitor behavior without regression coverage.

## 2026-10-22 — Preserve the native application identity

Future renaming will keep `com.aurelia.books` so existing Android installations
continue to address the same app data. Storage key renaming must be implemented
as an explicit read-old/write-new migration in Phase 1.
