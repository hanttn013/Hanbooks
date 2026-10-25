# Phase 2 Android checklist

Run on a physical or emulator build with the app installed:

- [ ] Share a PDF, EPUB, DOCX, PPTX, and ZIP from Files/Drive into ShanBooks.
- [ ] Confirm each shared file appears in the import summary and opens from
      Library after the app returns to foreground.
- [ ] Share multiple files in one Android `SEND_MULTIPLE` action and confirm no
      file is dropped.
- [ ] Use Android Back in Universal Reader, Book Detail, Library, and Home.
- [ ] Kill/relaunch after reading and confirm progress, bookmarks, and stored
      file blobs remain available offline.
- [ ] Export a full ZIP backup, clear app data, import it, and open a restored
      PDF/DOCX/PPTX/CBZ without network access.
- [ ] Verify unsupported FB2/MOBI/legacy Office files show a clear rejection.
- [ ] Verify Settings reports quota/persistence state and the Protect offline
      action does not crash when the browser denies persistence.

Browser Playwright cannot emit native share/back events, so this checklist is
required before claiming Android release readiness.
