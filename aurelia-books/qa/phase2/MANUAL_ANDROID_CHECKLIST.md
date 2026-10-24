# Phase 2 Android checklist

Status: not run on physical hardware. Check each item only after observing its
expected result. Record device/Android/WebView versions, APK SHA, date and tester.
`ACTION_VIEW` Open With is not implemented: record it as unsupported rather than
checking it as passed. Existing native Share uses SEND/SEND_MULTIPLE.

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

- [ ] On each format, navigate next/previous/TOC/search, bookmark, close/reopen.
      Expected: same location, progress and saved bookmark; unsupported search
      (CBZ without OCR) returns no match, never crashes.
- [ ] For EPUB/DOCX/TXT/MD change font, size, line-height, margins and mode.
      Expected: visible reflow; PDF/slide layout stays fixed rather than promising
      text reflow. DOCX/PPTX warning remains visible.
- [ ] Background mid-scroll; return, then swipe-kill and relaunch.
      Expected: last flushed position/time survives; no double-counted background
      reading time. Abrupt OS kill before a flush is a separate durability risk.
- [ ] Select files from local storage and a document provider; cancel picker,
      repeat selection, select multiple mixed formats.
      Expected: cancel changes nothing; every selected file has its own outcome.
- [ ] Try representative 100/250/500 MB files while watching Android memory.
      Expected: no OOM/frozen UI, clear limits, resources released on exit.
      This is not yet certified by automated small-fixture tests.
