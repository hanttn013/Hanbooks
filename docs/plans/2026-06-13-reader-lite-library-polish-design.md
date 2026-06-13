# Hanbooks Reader Lite + Library Polish Design

## Context

Hanbooks is aimed at readers who export stories as EPUB files, especially from Wattpad, then read them offline on Android. The strongest product position is not to copy Wattpad's social feed or compete with full-featured ebook readers. Hanbooks should become a light, attractive offline EPUB reader for personal story libraries.

The selected direction is **Reader Lite + Library polish**. Reader performance has priority over visual flourish. Home and Library can remain beautiful, but only with static, low-cost UI patterns.

## Competitive Assessment

Compared with Wattpad, Hanbooks wins on offline reading, personal file ownership, no network dependency, and fewer distractions. It does not need comments, rankings, recommendations, or social reading features in this phase.

Compared with market ebook readers such as Moon+ Reader, ReadEra, Apple Books, and Kindle, Hanbooks is still lighter in advanced reader tools. Those apps are stronger in annotations, dictionary, cloud sync, mature EPUB handling, backup, and format management. Hanbooks can compete by being simpler: fast open, smooth scroll, clear library, lists, bookmarks, and search for offline EPUB stories.

## Reader Lite

The reader is the performance-critical surface. It should feel native, immediate, and quiet.

- Continuous scroll is the primary reading mode.
- Page mode and page animations are advanced options, not part of the main path.
- Reader overlays should avoid Framer Motion where possible.
- Controls appear and disappear instantly or with very short opacity transitions.
- Remove backdrop blur, large shadows, scale tap animations, slide transitions, and 3D curl effects from the default reader.
- Do not calculate time-left on every reading position change.
- Do not block first render on full location generation.
- Generate detailed locations only after the book is already displayed, or fall back to rough progress.
- Search, TOC, Bookmarks, and Settings should open as simple static panels.
- EPUB iframe styles should prefer fast system fonts by default, with decorative fonts as optional settings.

Reader controls:

- Tap the reading surface to show or hide controls.
- Top controls: Back, compact title, bookmark/settings entry points.
- Bottom controls: thin progress, percentage, current chapter when available.
- In scroll mode, horizontal swipe page turns are disabled to avoid fighting native scrolling.

## Home And Library Polish

Home and Library should feel premium without making Android devices work hard.

Home:

- Continue Reading is the first and strongest action.
- Recently opened and recently added sections should use lightweight rows or compact cards.
- Stats are concise: total books, reading, bookmarks, storage.
- Avoid page transition animations when switching tabs.

Library:

- Search stays near the top and is immediately usable.
- Filters: All, Reading, Unread, Finished, Favorites, Has Bookmarks.
- Sort options: Recently Opened, Recently Added, Title, Author, Progress.
- Grid and list views remain available.
- List view is recommended for large libraries because it renders less visual work.
- Book covers should use lighter shadows and no 3D transforms.
- Long press opens Book Info quickly with a simple sheet.

Lists:

- Keep CRUD lists.
- List cards show name, count, and a few small cover thumbnails.
- Adding books to a list should support search and multi-select, but avoid animated layout changes.

## Data Flow

- IndexedDB remains the source for books, progress, bookmarks, lists, and cached metadata.
- Opening a book prioritizes getting an EPUB source and calling `rendition.display()` quickly.
- Metadata and detailed progress are cached and updated in the background.
- Missing metadata should never block import or reading.
- Reader settings keep reduced motion and lite behavior enabled by default.

## Error Handling

- EPUB open failures show a clear message and a return-to-library action.
- Missing metadata falls back to filename and `Unknown author`.
- Search failures should stay inside the search panel and never crash the reader.
- Storage quota problems should tell the user to remove books or export/backup later.

## Testing

Automated checks:

- `npm run lint`
- `npm run build`
- `npx cap sync android`
- `gradlew assembleDebug`

Manual Android checks:

- Open demo EPUB.
- Open imported EPUB.
- Scroll continuously for several minutes.
- Toggle reader controls repeatedly.
- Add/remove bookmark.
- Open TOC, Search, Bookmarks, and Settings panels.
- Filter and sort Library.
- Long press a book and open Book Info.

## Success Criteria

- EPUB content appears quickly and does not stay on an indefinite loading screen.
- Continuous scroll feels stable on Android mid-range hardware.
- Reader controls respond immediately.
- Default reader no longer feels like it is performing page animations.
- Home and Library remain visually pleasant while avoiding expensive effects.
