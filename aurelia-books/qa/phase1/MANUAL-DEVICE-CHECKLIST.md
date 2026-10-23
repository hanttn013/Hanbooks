# Phase 1 — Android physical-device acceptance

Device/model: __________ Android/WebView: __________ APK/build: __________

Use an existing installation with books, bookmarks, lists, and reading progress.
Record actual results and attach screenshots/logcat for any failure.

| Done | Steps on the physical device | Expected result |
| --- | --- | --- |
| [ ] | Open Library → Book Detail → Reader. Press native Back repeatedly. | Reader → Book Detail → Library → Home; next Back exits. |
| [ ] | Open Lists → a list → Book Detail → Reader. Press native Back at each level. | Each Back returns one level, preserving selected list and scroll. |
| [ ] | Open each tab (Home, Library, Lists, Settings) and press native Back. | Returns to preceding tab/history entry; exits only from Home. |
| [ ] | Close a list using ‹ Lists, then press native Back. | The list detail just closed does not reopen. |
| [ ] | Scroll Library/list detail, open Reader directly, then Back. | Original tab/list and scroll position return. |
| [ ] | Read EPUB, then TXT/DOCX, move to a distinctive position, immediately background using Home. Reopen. | Latest position and progress remain; background time is excluded. |
| [ ] | Read at least 30 seconds, background, then swipe away from recents. Relaunch and reopen the book. | Persisted position and elapsed foreground reading time are retained. |
| [ ] | With Reader visible, lock/unlock device; rotate portrait/landscape. | Reader remains usable; no duplicate timer/listener effects or lost position. |
| [ ] | Use native file picker for multiple supported files, including NFD Vietnamese names. | Every selected file gets its own result; readable files open offline. |
| [ ] | Select truncated EPUB, broken ZIP/RAR, empty file and one good file together. | Each bad file names its reason; good file imports; no bad-file book records. |
| [ ] | Select the same file twice, then import it again. | Duplicate prompt/skip works; no unintended duplicate books. |
| [ ] | Start pending metadata work, background/swipe-kill, relaunch. | Interrupted work resumes; no permanently running job. |
| [ ] | Pause queue, relaunch, then resume. | Pause persists; resume processes pending work with at most two active jobs. |
| [ ] | Android Share/Open With: send supported document and mixed files if the provider permits. | Supported share path imports each file; failures do not abort later files. Record unsupported intent/provider separately. |
| [ ] | Disable network and repeat opening imported books. | Local files, bookmarks, progress, and lists remain available. |

Browser automation cannot certify Android native Back dispatch, process death,
provider permissions or the native picker. These rows require human sign-off.
