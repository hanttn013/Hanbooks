# ShanBooks

Main Hanbooks application: a React + Vite EPUB reader packaged for Android with Capacitor.

For the repository overview, see `../README.md`.

## Setup

```powershell
npm install
```

## Development

```powershell
npm run dev
```

To bind Vite to a specific local address:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

## Checks

```powershell
npm run lint
npm run build
npm run test:unit
npm run test:e2e
```

Generate the deterministic, license-safe document fixtures before tests that
exercise file import:

```powershell
npm run fixtures
```

Run the complete automated suite with:

```powershell
npm run test:all
```

Playwright runs Chromium at 360x800, 768x1024, and 1440x900. The Phase 0
visual, console, and axe accessibility baselines live in `qa/baseline/`.
Phase 1 navigation and lifecycle evidence lives in `qa/phase1/`.
Transient Playwright reports and traces are ignored by Git.

## Android

Sync web assets into the native Android project:

```powershell
npm run android:sync
```

Build a debug APK:

```powershell
npm run android:apk
```

The Android toolchain requires JDK 21. Set `JAVA_HOME` to a JDK 21 installation
before running the build if another Java version is the system default.

Gradle writes the debug APK to:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Native Back, background/force-stop persistence, and picker behavior still need
to be checked on a device or emulator with
`qa/phase1/MANUAL_ANDROID_CHECKLIST.md`.

## Storage compatibility

On startup, legacy `aurelia_*` localStorage values are migrated once to the
`shanbooks_*` namespace. Existing values under the new keys win, and migrated
legacy keys are removed. The IndexedDB database name (`aurelia_db`) and Android
application id (`com.aurelia.books`) intentionally stay unchanged so installed
libraries and app upgrades retain their data.

## Source Map

```text
src/
|-- App.jsx
|-- main.jsx
|-- components/
|   |-- Home/
|   |-- Library/
|   |-- Lists/
|   |-- Reader/
|   |-- Settings/
|   `-- TabBar/
|-- data/
|-- hooks/
|-- styles/
`-- utils/
```

Important files:

```text
src/hooks/useLibrary.js
src/hooks/useReader.js
src/hooks/useSettings.js
src/utils/StorageManager.js
src/utils/epubMetadata.js
src/utils/archiveImport.js
```
