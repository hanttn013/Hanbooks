# Phase 2 verification — 2026-10-23

## Automated checks

| Check | Result |
| --- | --- |
| `npm.cmd run test:unit` | 12 suites, 43 tests passed |
| `npm.cmd run lint` | Passed |
| `npm.cmd run build` | Passed; Vite lazy-format chunks emitted |
| `npm.cmd run test:e2e` | 18 tests passed: baseline + regression + 7-format reader smoke across 360/768/1440 |
| `npm.cmd run android:apk` | Passed; Capacitor sync found `@capgo/capacitor-share-target@8.0.63` |
| Debug APK | `android/app/build/outputs/apk/debug/app-debug.apk`, 43,229,897 bytes, SHA-256 `D7B36894F4C4463B1D7EF83237EBED9D958F251A2682024EC2584EBF425F5DA4` |
| `npm.cmd audit --omit=dev` | 11 vulnerabilities remain: 3 moderate, 6 high, 2 critical; several have no fix |

The format reader test stores screenshots and the import summary in this
directory. The existing Phase 1/baseline evidence was restored after the full
suite so this directory is the only new visual evidence from Phase 2.

## Manual gate

Native share/open/back behavior still needs the device checklist in
`MANUAL_ANDROID_CHECKLIST.md`; browser automation cannot emit Capacitor native
events.
