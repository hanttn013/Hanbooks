# ShanBooks

Main application package for Hanbooks: a React 19 + Vite offline document reader built with Adobe Spectrum S2 and packaged for Android with Capacitor 8.

For the comprehensive repository overview, showcase screenshots, and feature guide, see [README.md](../README.md).

---

## 🚀 Setup & Development

### 1. Install Dependencies

```powershell
npm install
```

### 2. Start Local Development Server

```powershell
npm run dev
```

To bind Vite to a specific local address or port:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

---

## 🧪 Testing & Quality Checks

Run the verification suite locally:

```powershell
# ESLint check
npm run lint

# Design system and element enforcement audit
npm run test:elements

# UI strings and i18n key audit
npm run test:i18n

# Unit tests (Vitest)
npm run test:unit

# Production build bundle check
npm run build

# End-to-end browser tests (Playwright)
npm run test:e2e
```

To regenerate deterministic test fixtures (EPUB, PDF, CBZ, DOCX, PPTX) before running import tests:

```powershell
npm run fixtures
```

---

## 📱 Android Native Build

### Prerequisites
- Java Development Kit (JDK) 21. Ensure `JAVA_HOME` points to your JDK 21 installation.
- Android Studio with Android SDK Platform 34 or 35.

### Build Steps

1. Sync web assets into the Capacitor Android project:
```powershell
npm run android:sync
```

2. Compile debug APK with Gradle:
```powershell
npm run android:apk
```

The compiled APK will be output to:
```text
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 💾 Storage Architecture

- **IndexedDB (`aurelia_db`)**: Primary storage for document binary blobs, parsed cover images, chapter navigation tables, bookmarks, and per-book reading locations (EPUB CFIs, PDF page offsets).
- **LocalStorage (`shanbooks_*`)**: Stores lightweight reader settings, color themes, font preferences, and language selections.
- **Backup & Migration**: Supports full offline export/import to `.zip` archive or `.json` metadata dump without data loss.

---

## 📂 Source Structure

```text
src/
|-- App.jsx                   # Root application shell & routing
|-- main.jsx                  # React entry point
|-- components/
|   |-- Home/                 # Editorial Home screen & reading shelves
|   |-- Library/              # Grid/List book library view & multi-selection
|   |-- Lists/                # Shelves and collections management
|   |-- Reader/               # Distraction-free reader surface & controls
|   |-- Settings/             # Themes, typography, and backup settings
|   `-- TabBar/               # Bottom navigation bar & desktop sidebar
|-- hooks/                    # useLibrary, useReader, useSettings
|-- readers/                  # Adapters for EPUB, PDF, DOCX, PPTX, CBZ, TXT, MD
|-- styles/                   # CSS Design tokens & responsive layout media queries
`-- utils/                    # StorageManager, archiveImport, epubMetadata, formatDetector
```
