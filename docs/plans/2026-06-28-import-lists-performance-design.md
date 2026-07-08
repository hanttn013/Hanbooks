# Import, Lists, and Performance Fix Design

## Scope

Fix import freezes, duplicate EPUB imports, ZIP folder list creation, missing list background images, and add four requested color themes.

## Design

- Import ZIP archives with asynchronous `fflate.unzip` to avoid blocking the UI during decompression.
- Preserve each EPUB archive path and group imported books into lists by the first folder inside the archive. Root EPUB files fall back to the archive name.
- Detect duplicates in `useLibrary` before saving a book. The duplicate identity uses normalized title and author plus a lightweight sampled file key from file size and first/last bytes.
- Process imports incrementally and yield to the browser between books so the overlay and touch handling stay responsive.
- Extend list records with an optional `coverImageUrl`. Existing lists still use their color style. The list editor can upload and resize a background image before saving.
- Add themes for `#333D6D`, `#4647AE`, `#1A312C`, and `#111844` across app chrome, settings, appearance, and reader iframe rendering.
- Guard Book Info metadata repair against repeated taps and state updates after the modal closes.

## Verification

- Run production build.
- Build/install Android debug APK when tooling is available.
- Benchmark large EPUB imports, ZIP folder imports, duplicate imports, and archive extraction on the attached Android device.
