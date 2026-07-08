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
```

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
