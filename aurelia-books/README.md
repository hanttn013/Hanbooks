# Aurelia Books

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

Gradle writes the debug APK to:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

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
