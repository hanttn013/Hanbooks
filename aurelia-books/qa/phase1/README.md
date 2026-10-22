# Phase 1 Evidence

Phase 1 focuses on data integrity, lifecycle persistence, navigation history,
and Android buildability.

## Automated evidence

Each viewport directory contains the deterministic Back-navigation sequence:

1. `reader.png`
2. `detail-after-back.png`
3. `library-after-back.png`
4. `home-after-back.png`

The sequence is captured at 360x800, 768x1024, and 1440x900 by
`tests/e2e/smoke.spec.js`. The same suite also verifies list scroll restoration
and reading-stat persistence on `pagehide`.

## Android artifact

The debug APK was built successfully on 2026-10-22 with Temurin JDK 21:

- Path: `android/app/build/outputs/apk/debug/app-debug.apk`
- Size: 42,157,187 bytes
- SHA-256: `7814EE689944CABB6C349A658A6AB0A956BE1D254888245D174E871490F7BF87`

The APK is a generated, ignored build artifact and is not committed. Building
it proves the Capacitor/Gradle project compiles; it does not replace the native
runtime checks in `MANUAL_ANDROID_CHECKLIST.md`.
