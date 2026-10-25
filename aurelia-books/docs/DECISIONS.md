# Engineering Decisions

## 2026-10-23 — Phase 1 queue and EPUB cleanup acceptance

Persisted queue values `processing`/`ready` remain compatible with existing data;
the Library exposes them as `running`/`done`, and interrupted `running` or
`processing` jobs normalize to `pending` on startup. Capacity is checked at the
task entry point as well as the scheduler. Book updates use an existing-record
transaction so delayed extraction cannot recreate a deleted book.

The installed epub.js has archive URL revocation and global-listener cleanup
defects. The reader supplies a small managed default view and revokes the book's
owned archive/replacement URLs before destruction. Browser resource probes count
live EPUB instances, URLs, frames, and global listener registrations for 30 cycles.

## 2026-10-22 — Keep Phase 0 behavior changes narrow

Phase 0 fixes only the three requested lint failures and the duplicate bookmark
read discovered beside the same Book Detail effect. Metadata queue architecture,
navigation, storage migrations, reader settings, and new formats remain separate
phase work so the baseline stays comparable.

## 2026-10-22 — Use Vitest 4 on Node.js 25

The active runtime is Node.js 25.9.0. Vitest 5 documents support for Node
`^22.12 || ^24 || >=26`, so Phase 0 pins Vitest 4.1.12 rather than installing a
package whose declared engine excludes this runtime. Revisit on the next Node
LTS/runtime upgrade.

## 2026-10-22 — Keep deterministic generated fixtures

Test documents are generated locally by `scripts/generate-test-fixtures.mjs`.
They contain only synthetic text and minimal package structures, avoiding
copyrighted fixtures while keeping binary import tests reproducible.

## 2026-10-23 — Use Vitest thread workers in the Windows app sandbox

Vitest's default fork pool copies transformed modules through an atomic rename in
the system temp directory. The Windows app sandbox rejects that rename with
`EPERM` before any test is collected. The documented thread pool exercises the
same suite without that filesystem operation; both an unrestricted default-pool
run and the configured thread-pool run pass all 43 tests.

## 2026-10-22 — Do not auto-fix dependency advisories

The production audit includes vulnerable transitive packages and advisories with
no available fix. Phase 0 records the exact risk instead of running an automatic
upgrade that could change EPUB or Capacitor behavior without regression coverage.

## 2026-10-22 — Preserve the native application identity

Future renaming will keep `com.aurelia.books` so existing Android installations
continue to address the same app data. Storage key renaming must be implemented
as an explicit read-old/write-new migration in Phase 1.

## 2026-10-22 — Migrate localStorage, preserve IndexedDB and appId

Phase 1 copies each `aurelia_*` localStorage value to its `shanbooks_*`
equivalent only when the new key does not already exist, then removes the old
key. Per-book progress keys are migrated dynamically. `aurelia_db` remains at
schema v4 and `com.aurelia.books` remains the Android appId because renaming
either would disconnect existing installations from their data.

## 2026-10-22 — Persist metadata work in book records

Metadata jobs use fields on the existing book record (`metadataStatus`, attempt
count, next retry timestamp, and error) instead of an in-memory-only queue or a
new IndexedDB store. This avoids a schema bump while making jobs resumable.
Concurrency is capped at two and automatic retries stop after three attempts;
manual Repair Info remains available.

## 2026-10-22 — Remove settings that do not change reader behavior

`pageTurnEffect` had no renderer implementation. `chapterFlow` only changed end
marker spacing while both options used the same navigation behavior. Both were
removed from defaults and UI rather than presenting controls that overpromise.

## 2026-10-22 — Use history snapshots as navigation state

Each internal view stores tab, list, detail-book, reader-book, and tab scroll
state in `history.state`. Browser and Android Back consume the same stack.
Android exits only when the current state is Home. Native back-button behavior
still requires the manual device checklist because Playwright cannot emit the
Capacitor native event.

## 2026-10-23 — Keep one adapter contract and lazy-load heavy readers

PDF.js, Mammoth, Marked/DOMPurify, `@web-ppt/core`, and fflate are loaded from
format-specific chunks instead of the startup path. Every new reader implements
the same adapter contract so progress, search, TOC, bookmarks, and Reader UI do
not grow format-specific storage branches. The legacy PDF.js build is selected
for older WebViews; a worker is still used when the runtime supports it.

## 2026-10-23 — Prefer safe best-effort document support

PPTX is exposed with a fidelity notice because browser conversion cannot promise
PowerPoint layout parity. Legacy binary Office, FB2, and MOBI are rejected with
an actionable unsupported-format message until dedicated adapters exist. HTML,
Markdown, DOCX output, and archive extraction are treated as untrusted input and
are bounded/sanitized before display.

## 2026-10-23 — Full backup is an explicit ZIP format

JSON backups remain the portable metadata format. Full backups add a manifest
and the original blobs under `books/`, allowing offline restoration without a
server. The implementation caps the archive at 500 MB and surfaces missing-file
state instead of silently inventing a readable book.

## 2026-10-23 — Verify offline with a production shell, not a dev server

Precache emitted build assets with a small Vite plugin; avoid a new runtime
dependency. Native Capacitor continues using bundled assets. The acceptance test
turns network off before first lazy reader load, then exports a ZIP, clears the
test library records, restores and opens every format again. Precache requests
and crossorigin modules have different Origin headers; ignore Vary only for our
same-origin asset-cache lookup. Do not rebuild while this test is running.

Mammoth is a semantic converter, not a Word page-layout engine, and explicitly
does not sanitize output; DOCX conversion therefore retains DOMPurify and a
visible fidelity notice. See [Mammoth documentation](https://github.com/mwilliamson/mammoth.js).
PPTX remains best-effort SVG with an explicit warning and a text fallback on
slide-render failure; images/advanced effects are not guaranteed in fallback.

## 2026-10-24 — Chuyển đổi toàn diện sang Adobe Spectrum S2 (Bước 0)

1. **Phiên bản & Tương thích:**
   - Dự án đang sử dụng `@react-spectrum/s2` v1.8.2 kết hợp `unplugin-parcel-macros` v0.2.0 trên nền Vite v8 và React 19.2.6.
   - S2 v1.8.2 được thiết kế sẵn tương thích React 19 (`peerDependencies: {"react": "^19.0.0-rc.1"}`) và chạy trên nền `react-aria-components` v1.22.1, `react-aria` v3.53.1, `react-stately` v3.51.0.
   - Toàn bộ component tương tác được import trực tiếp từ `@react-spectrum/s2`: `Button`, `ActionButton`, `ButtonGroup`, `SearchField`, `TextField`, `Picker`, `PickerItem`, `Tabs`, `TabList`, `Tab`, `TabPanel`, `Dialog`, `AlertDialog`, `DialogContainer`, `ProgressBar`, `Switch`, `StatusLight`, `Avatar`, `IllustratedMessage`.

2. **Kích thước bundle & Đánh giá rủi ro:**
   - Kích thước vendor chunk trước khi dựng S2: `spectrum-vendor` 380.14 kB (gzip 109.04 kB).
   - Kích thước vendor chunk sau khi dựng S2 PoC (chứa Button, ActionButton, SearchField, Picker, ProgressBar, Switch, StatusLight, Avatar): `spectrum-vendor` 398.46 kB (gzip 113.48 kB).
   - Mức tăng: +18.32 kB uncompressed (+4.8%), thấp hơn rất nhiều so với ngưỡng cảnh báo 30%. S2 đáp ứng hoàn hảo tiêu chí không gây phình bundle bất thường.
   - `vite build` hoàn thành trong 1.46s không có bất kỳ lỗi cú pháp hoặc macro nào. Không cần fallback sang React Aria thuần vì S2 hoạt động trơn tru.

3. **Chính sách Phông chữ (Font) & Tiếng Việt:**
   - Adobe Clean là phông chữ có bản quyền thương mại của Adobe, tuyệt đối không bundle vào ứng dụng mã nguồn mở.
   - `@react-spectrum/s2` không ép cứng `font-family: Adobe Clean` trong CSS của mình mà kế thừa trực tiếp từ thẻ gốc (`body` / `:root`).
   - Ứng dụng cấu hình phông chữ giao diện chính thống là **Be Vietnam Pro** (Regular, Medium, SemiBold, Bold) được lưu trữ offline dạng `.woff2` tại `public/fonts/`. Phông chữ này thuộc giấy phép SIL Open Font License (OFL), kiểm thử hiển thị chuẩn xác 100% 19 nguyên âm có dấu tiếng Việt ("Ắ Ằ Ẳ Ẵ Ặ Ế Ề Ể Ễ Ệ Ớ Ờ Ở Ỡ Ợ Ứ Ừ Ử Ữ Ự").
   - Phần hiển thị tiêu đề nghệ thuật kế thừa **Lora** (Serif) đã được nhúng sẵn woff2 offline.

4. **Quản lý Token & Accent:**
   - Thay thế toàn bộ mã màu hardcode hoặc hex phân tán. Sử dụng cơ chế `Provider` của Spectrum với `colorScheme` (light/dark) kết hợp một màu nhấn đồng nhất duy nhất (Accent) đáp ứng tương phản WCAG AA trên cả hai nền.

## 2026-10-25 — Sửa tận gốc lệch nhãn nút, mép lề EdgeAction, và lọc giới thiệu Gutenberg

1. **Nguyên nhân lệch nhãn nút (Button Vertical Alignment):**
   - `@react-spectrum/s2` áp dụng CSS mặc định `display: flex; align-items: baseline; justify-content: center;` cho các nút bấm.
   - Icon SVG bên trong mang `vertical-align: baseline; display: block`, khiến đáy của icon 16–20px bị neo vào baseline của dòng chữ, làm đỉnh icon chạm sát mép trên của nút (topPad = 0px trong CSS = 0px vật lý, botPad = ~10px trong CSS = 27.5px vật lý trên màn TECNO 440dpi).
   - Icon cao hơn nhãn chữ ~13px vật lý, và toàn bộ nội dung bị đẩy lệch lên trên.
   - **Giải pháp tận gốc**:
     - Ghi đè hệ thống nút tại `src/styles/spectrum.css`: ép `display: inline-flex !important; align-items: center !important; justify-content: center !important;` cho mọi `button`, `button[data-rac]`, `[role="button"]`.
     - Icon SVG: `vertical-align: middle !important; display: block !important; margin: 0 !important;`.
     - Nhãn chữ: `line-height: 1 !important; text-box: trim-both cap alphabetic !important; padding-block: 0 !important; margin-block: 0 !important;`
      - Cân đối metric tiếng Việt: Do các dấu thanh tiếng Việt nằm cao hơn cap-height Latinh, thêm vi chỉnh `transform: translateY(1.5px) !important;` trên span giúp cân bằng khoảng trống trên/dưới đạt chênh lệch 0–1px vật lý trên màn hình thật TECNO. (được xác nhận hỗ trợ 100% trên Android 15 Chrome 156 qua `CSS.supports`).
     - Đóng gói wrapper chuẩn `<Button>`, `<IconButton>`, `<TextAction>` tại `src/components/Common/`.

2. **Hành động sát lề (<EdgeAction>):**
   - Các nút mép (avatar Home, ⋯ Library, Xem thêm các kệ, X Xem nhanh, nút Back) có vùng chạm tối thiểu 44dp. Khi nằm trong container đệm 16px, phần đệm nội tại của nút khiến glyph bị thụt vào trong 8–24dp.
   - `<EdgeAction>` áp dụng margin âm bằng đúng nửa phần đệm ngoài glyph bù trừ phần đệm ngoài glyph. Với icon SVG có khoảng trống nội bộ (viewBox padding), component hỗ trợ tham số `offset` hoặc tính theo `(44 - glyphWidth) / 2 + glyphInset`. Đối với nhãn chữ (như "Xem thêm"), button được thiết lập `padding-right: 0 !important` giúp mép chữ chạm sát lề mà không cần margin âm.
   - Kết quả: Vùng chạm 44dp được bảo toàn đầy đủ, đồng thời mép mực ngoài cùng của glyph/chữ chạm chuẩn xác lề 16px (±2px đo trên ảnh máy thật).

3. **Thanh sắp xếp gọn (Compact Sort Button):**
   - Thay thế `Picker` S2 rộng cố định ~220dp bằng nút gọn `width: fit-content; max-width: 50%` chứa icon sắp xếp + nhãn hiện tại + chevron nhỏ.
   - Loại bỏ tiêu đề phụ lặp ở Header của Library và Home để giao diện tinh gọn, đúng chuẩn tạp chí.

4. **Thẻ Đọc tiếp (Continue Reading Hero Card):**
   - ProgressBar và phần trăm ("0%") được gom cùng hàng với nút "Tiếp tục" trong một hàng duy nhất với `align-items: center`.
   - Tâm thanh tiến độ và tâm nút trùng nhau (chênh lệch $\le 2\text{px}$). Chiều cao thẻ đồng bộ theo bìa 2:3 với 4 phía padding 16px bằng nhau.

5. **Lọc giới thiệu Gutenberg & bóc tách thẻ <a>:**
   - Xử lý DOM bằng `DOMParser`, thay thế thẻ `<a>` bằng chính `textContent` của nó thay vì xoá phần tử, ngăn chặn triệt để hiện tượng rơi chữ (ví dụ "terms of the or online at www.").
   - Lọc bỏ triệt để đoạn bản quyền Gutenberg, metadata machine header (`Title:/Author:/Release date:/Language:/Credits:`), cắt từ marker `*** START OF`.
   - Áp dụng ngưỡng tối thiểu 40 ký tự: nếu không còn nội dung mô tả thực sự $\ge 40$ ký tự, trả về chuỗi rỗng để giao diện hiển thị fallback "Chưa có giới thiệu" kèm nút cập nhật thông tin, không bao giờ để lọt metadata thô.


