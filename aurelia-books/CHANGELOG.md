# Changelog

## Unreleased

### Phase 1 — Stability fixes

- Made metadata extraction resumable, concurrency-limited, and retryable.
- Persisted reading time/progress across close and background lifecycle events.
- Reworked browser/Android Back navigation with history snapshots and scroll
  restoration.
- Migrated `aurelia_*` localStorage keys to `shanbooks_*` without changing the
  Android appId or IndexedDB database name.
- Removed non-functional reader settings and unused legacy screens.
- Rejected empty imports, serialized concurrent duplicate detection, and reused
  a managed IndexedDB connection.
