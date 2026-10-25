# Tiến Độ Dự Án ShanBooks (aurelia-books)

Cập nhật lần cuối: 2026-10-24

---

## 1. Tóm tắt trạng thái các Phase

| Phase | Nội dung chính | Trạng thái | Ghi chú & Bằng chứng |
|---|---|---|---|
| **Phase 0** | Khảo sát baseline, audit chất lượng, thiết lập công cụ đo | **Hoàn thành** | Đã chứng nhận trong `qa/phase0/VERIFICATION.md`, snapshot baseline trong `qa/baseline/`. |
| **Phase 1** | Hàng đợi metadata nền có giới hạn, dọn dẹp tài nguyên EPUB, điều hướng Back/Detail/Reader, chống trùng lặp dữ liệu | **Hoàn thành** | Đã chứng nhận trong `qa/phase1/ACCEPTANCE.md` và `qa/phase1/VERIFICATION-2026-10-23.md`. 30 chu kỳ mở/đóng EPUB giải phóng tài nguyên hoàn toàn. |
| **Phase 2** | Bộ đọc tài liệu đa định dạng (PDF, DOCX, TXT, MD, PPTX, CBZ, HTML), ZIP/RAR, offline service worker, backup/restore toàn vẹn | **Hoàn thành** | Đã chứng nhận trong `qa/phase2/VERIFICATION.md`. Service worker precache offline pass. |
| **Phase 3** | Adobe Spectrum UI tokens, Dark/Light/System theme, đa ngôn ngữ vi/en, khả năng tiếp cận a11y (axe-core WCAG AA) | **Đạt Definition of Done** | 19 test files (79 unit tests) pass; i18n audit 0 chuỗi hardcode; E2E suite đang chạy kiểm định toàn diện 3 viewport. |
| **Phase 4** | Hiệu năng & độ ổn định trên thiết bị thật, tối ưu bundle, chống rò rỉ, an toàn dữ liệu khi crash/kill | **Đạt Definition of Done** | Cold start 856ms (mục tiêu ≤3s); bundle index.js giảm 72% còn 284kB (0 cảnh báo >500kB); 1.000 sách cuộn jank 0.28%; mở EPUB 20MB 382ms; 50 chu kỳ reader không rò RAM; 20 lần sudden kill không hỏng DB; chi tiết trong `qa/phase4/METRICS.md`. |
| **Phase 5** | Bộ test hoàn chỉnh tự động, kiểm thử thiết bị thật (Back, intent, lifecycle, rotation), nghiệm thu phát hành | **Đạt Definition of Done** | Toàn bộ 8 kịch bản thiết bị thật (TECNO LI6 - Android 15) pass 100% (Back key, Home resume, Dark/Light mode, Font scaling 1.3x/2.0x, Rotation, Safe Area, Offline emulation, Share intent); 6 ảnh chụp màn hình; Release APK `app-release-unsigned.apk` (39.9MB) biên dịch thành công; chi tiết trong `qa/phase5/DEVICE-REPORT.md`. |

---

## 2. Chi tiết kết quả kiểm tra đầu vào (Bước 0)

1. **`npm run lint`**: PASS (0 lỗi, 0 cảnh báo).
2. **`npm run build`**: PASS (1.28s, 785 modules; cảnh báo bundle chunk lớn `index.js` ~1022 kB sẽ được tối ưu trong Phase 4).
3. **`npm run test:unit`**: PASS (19 test files, 79/79 unit tests pass).
4. **`npm run test:i18n`**: PASS (UI static strings and literal translation keys audit: passed).
5. **`npm run test:e2e`**: **PASS (54/54 tests passed trên cả 3 viewport: mobile-360x800, tablet-768x1024, desktop-1440x900 trong 6.7 phút)**.
   - Đã xác nhận toàn bộ test Phase 1, Phase 2, và Phase 3 acceptance (giao diện Spectrum, Dark/Light/System theme, WCAG AA axe-core, i18n, focus trapping, Back navigation).
6. **Thiết bị thật (`adb devices`)**:
   - **Model**: `TECNO LI6` (product: `LI6-OP`, device: `TECNO-LI6`)
   - **Phiên bản Android**: `Android 15` (API Level 35)
   - **RAM**: `7,866,580 kB` (~8 GB)
   - **Android System WebView**: `com.google.android.webview` phiên bản `156.0.8078.47` (versionCode `807804703`, targetSdkVersion `36`)
   - **Kết nối**: Đã ghép nối và kết nối thành công qua ADB Wi-Fi tại endpoint `192.168.1.80:34961`.
   - **Cách ly dữ liệu**: Đã cấu hình `applicationIdSuffix ".debug"` trong `android/app/build.gradle` (gói kiểm thử: `com.aurelia.books.debug`), bật `WebView.setWebContentsDebuggingEnabled(true)` an toàn chỉ cho bản debug.

---

## 3. Các mục Phase 3 đã hoàn tất và bù đắp
- Giao diện Adobe Spectrum tokens (S2 design tokens) cho toàn bộ màn hình Home, Library, Lists, Settings, BookDetailModal, Reader Chrome.
- Dark/Light/System theme hỗ trợ WCAG AA contrast, không còn lỗi axe-core serious/critical trên cả 3 viewport.
- Hệ thống i18n vi/en đầy đủ, mặc định tiếng Việt, chuyển đổi tức thì và lưu trữ bền vững.
- Quản lý tiêu điểm (focus trap) trong dialog, hỗ trợ Escape và nút Back native/trình duyệt đóng dialog trước khi lùi màn hình.

---

## 4. Nhiệm Vụ Thiết Kế Lại Giao Diện (Editorial Design System) & Import/Bìa

- **Giai đoạn 0 — Audit Thị Giác**: **HOÀN THÀNH**
  - Chụp 74 ảnh baseline trước cải tạo trên 6 viewport (360×800, 412×915, 768×1024, 1024×768, 1440×900, 800×360 landscape) ở cả Light và Dark mode lưu tại `qa/design/before/`.
  - Viết tài liệu phân tích lỗi bố cục và thị giác chi tiết tại `docs/DESIGN-AUDIT.md`.
- **Giai đoạn 1 — Design System + Styleguide Sống**: **HOÀN THÀNH**
  - Viết đặc tả thiết kế thư viện biên tập tại `docs/DESIGN.md`.
  - Tải và đóng gói font cục bộ WOFF2 (SIL OFL 1.1) gồm **Lora** (Serif văn học) và **Be Vietnam Pro** (Sans giao diện), hỗ trợ 100% tiếng Việt có dấu đầy đủ (`"Ắ Ằ Ẳ Ẵ Ặ Ế Ề Ể Ễ Ệ Ớ Ờ Ở Ỡ Ợ Ứ Ừ Ử Ữ Ự"`), hoạt động offline không phụ thuộc CDN.
  - Xây dựng hệ thống token `src/styles/editorial-tokens.css` với bảng màu Warm Paper (`#FAF7F2`) / Deep Ink (`#141312`) và màu nhấn Terracotta (`#C05621` / `#E07A44`).
  - Dựng bộ component dùng chung: `<Cover>` (4 trạng thái), `<BookCard>`, `<ListCard>`, `<EmptyState>`, `<Skeleton>`, `<PageHeader>`, `<Sheet>`, `<AppShell>` (Sidebar ≥1200px, Navigation Rail 600–1200px & landscape phone, TabBar <600px).
  - Dựng trang Styleguide nội bộ `/#/dev/design` kiểm thử bảng màu, font scale, dấu tiếng Việt và component.
- **Giai đoạn 2 — Thiết kế lại LibraryScreen & HomeScreen**: **HOÀN THÀNH ĐỢT 1**
  - Dựng mới hoàn toàn `LibraryScreen` và `HomeScreen` theo triết lý "bìa sách là nhân vật chính", loại bỏ nút rác, nâng cấp hero card và kệ sách.
  - Chụp 48 ảnh sau cải tạo trên đủ 6 viewport tại `qa/design/after/`.
  - Tự phê bình và khắc phục độ tương phản Dark Mode, ghi nhận vào `qa/design/REVIEW.md`.
  - Kiểm thử: `npm run lint` 0 lỗi, `npm run build` pass (1.93s), `npm run test:unit` pass (79/79 tests), `npx playwright test smoke.spec.js` pass (15/15 tests across 3 viewports).
- **CỔNG DUYỆT (Phê Duyệt Hướng Thiết Kế)**: **ĐÃ ĐỒNG THUẬN VỚI NGƯỜI DÙNG**
  - **Phong cách giao diện**: Người dùng đánh giá rất thích hướng thiết kế theo ảnh tham khảo 3 màn hình (Editorial Library):
    - *Màn 1 (Home)*: Lời chào `"Find your best book"`, thanh tìm kiếm bo cong mềm mại `Search book ....`, thẻ nổi bật `"Continue Reading"` kèm ảnh bìa nổi bật, thanh tiến độ xanh mint, nút bo pill đen `"Đọc ngay"` / `"Read now"`, và kệ cuộn ngang `"Recommended for you"`.
    - *Màn 2 (Book Detail)*: Bìa sách 3D nổi khối ở giữa, thông tin căn giữa, khung thông số 4 cột bo tròn (Định dạng, Chương, Đánh dấu, Tiến độ), tab (`Synopsis`, `Details`, `Manage`), nút bấm bo pill cố định full-width `"Read"`. Nền modal đã làm đục tuyệt đối (`--bg-base`), không còn hiện tượng lọt sáng hay lộ danh sách thư viện bên dưới.
    - *Màn 3 (Reader Chrome)*: Thanh trên tinh gọn, thanh công cụ nổi bo tròn (floating dock) dưới chân gồm 4 nút: Bookmark (★), Ghi chú/Bookmarks (✏️), Cài đặt kiểu chữ (T), và Mục lục (☰).
  - **Yêu cầu quan trọng về cử chỉ đọc dọc (Vertical reading)**:
    - *"đọc dọc đó kéo lên 1/3 là qua trang đừng để kéo sâu quá"*: Đã thiết lập ngưỡng kéo `PULL_THRESHOLD_RATIO = 0.33` (kéo lên ~1/3 khung nhìn, tương đương 48–75px trên mobile) là nhận diện lật sang chương tiếp theo ngay khi thả tay, dung sai cuối chương cách đáy 16px, deadzone 8px giúp thao tác nhạy, nhẹ và tự nhiên, không bắt miết sâu.
  - **Tình trạng kiểm thử**:
    - `npm run lint`: **PASS (0 lỗi, 0 cảnh báo)**
    - `npm run build`: **PASS (1.09s)**
    - `npm run test:unit`: **PASS (19/19 files, 79/79 unit tests)**
    - `tests/e2e/smoke.spec.js`: **PASS (15/15 tests)**

---

## 5. Nhiệm Vụ: Thiết Kế Lại Toàn Bộ Giao Diện Bằng Adobe Spectrum (Thật Sự)

- **BƯỚC 0 — KIỂM CHỨNG HIỆN TRẠNG (HOÀN THÀNH)**:
  - **Quét repo (`docs/SPECTRUM-AUDIT.md`)**: Phát hiện 74 phần tử HTML thô (61 `<button>`, 9 `<input>`, 4 `<select>`, 0 `<dialog>`). Nguyên nhân trước đây chưa phản ánh Spectrum là do các màn chỉ import `ToastQueue` hoặc dùng class CSS tự viết, trong khi component S2 không được gọi.
  - **Khảo sát tài liệu & tương thích (`docs/DECISIONS.md`)**:
    - `@react-spectrum/s2` v1.8.2 tương thích hoàn hảo React 19.2.6 (chạy trên nền `react-aria-components` v1.22.1).
    - Cung cấp đầy đủ toàn bộ component yêu cầu: `Button`, `ActionButton`, `ButtonGroup`, `SearchField`, `TextField`, `Picker`, `Tabs`, `Dialog`, `AlertDialog`, `ProgressBar`, `Switch`, `Avatar`, `StatusLight`.
  - **Thử nghiệm PoC & Đo kích thước bundle**:
    - Vendor bundle `spectrum-vendor` chỉ tăng từ `380.14 kB` lên `398.46 kB` (+18.32 kB uncompressed, +4.8% — thấp xa so với trần 30%).
    - `vite build` thành công trong 1.46s với 0 lỗi. Không có rủi ro lớn, **quyết định sử dụng `@react-spectrum/s2` chính thức (không cần fallback)**.
  - **Chính sách phông chữ (Font)**:
    - S2 kế thừa tự nhiên `font-family` từ container/body.
- **GIAI ĐOẠN TRIỂN KHAI SPECTRUM (APPSHELL + 3 MÀN CHÍNH)**:
  - **Khung ứng dụng (AppShell & PageHeader)**:
    - Provider Spectrum S2 bọc toàn app với cơ chế `colorScheme` (Light/Dark/System) và locale `vi-VN` / `en-US`.
    - Lớp safe-area duy nhất quản lý bằng CSS tokens (`--safe-top/bottom/left/right` và `--app-nav-height` đo bằng `ResizeObserver`). Không màn nào tự xử lý safe-area riêng.
    - Điều hướng breakpoint: Mobile (<600px) thanh điều hướng dưới 4 mục, vùng chạm tối thiểu 48px, nhãn luôn hiện; Tablet (600–1200px) Navigation Rail; Desktop (≥1200px) Sidebar.
    - Duy nhất 1 kiểu `<PageHeader>` chuẩn cho toàn bộ Home/Library/Lists/Settings: tiêu đề và hành động chính trên hàng trên, mô tả bên dưới, cùng lề trái.
    - Xóa bỏ hoàn toàn `-webkit-tap-highlight-color` của WebView.
  - **Component Nền Tảng (<Cover> & <BookCard>)**:
    - `<Cover>`: Loại bỏ hoàn toàn chữ `SHANBOOKS` trên bìa tự sinh; thay bằng huy hiệu chữ cái đầu (monogram) + viền họa tiết hình học; bỏ format badge phủ lên mặt bìa. Thêm chế độ `shape="square"` cho hình đại diện list (tuyệt đối không còn khối màu phẳng vô nghĩa).
    - `<BookCard>`: Bìa sách khóa chặt tỉ lệ 2:3 với trần kích thước điện thoại ≤ 120px (trên tablet ≤ 150px, desktop ≤ 170px); tên sách 2 dòng (`-webkit-line-clamp: 2`), tác giả 1 dòng; thanh tiến độ mảnh 2.5px dưới bìa; badge định dạng (EPUB/PDF) và nút menu "⋯" (S2 `<ActionButton isQuiet>`) chuyển hoàn toàn xuống hàng meta dưới bìa, **không che bìa**.
  - **LibraryScreen**:
    - Dùng Spectrum S2 `<SearchField>`.
    - Bộ lọc trạng thái dùng Spectrum S2 `<ToggleButtonGroup>` và `<ToggleButton>` tương phản AA (xóa bỏ cặp cam/xanh xung đột).
    - Hàng công cụ "N sách · Sắp xếp · Cỡ bìa · Chọn" cùng baseline: S2 `<Picker>` sắp xếp, S2 `<Picker>` kích thước bìa (Nhỏ/Vừa/Lớn), S2 `<ActionButton>` chọn nhiều sách.
    - **Lưới điện thoại 3 cột thực thụ**: Bìa hiển thị đều đặn, không bị phóng to, không kéo dài.
    - Thanh tác vụ chọn sách dùng S2 `<Picker>` và S2 `<Button variant="accent">`.
  - **HomeScreen**:
    - Thẻ "Đọc tiếp" (Continue Reading) siêu tinh gọn: Bìa 76px bên trái, tên sách, tác giả, S2 `<ProgressBar>`, nút S2 `<Button variant="accent">` "Đọc tiếp", tổng chiều cao thẻ ≤ 120px (thực tế 114px).
    - Các kệ cuộn ngang ("Gợi ý cho bạn", "Mới thêm"): Dùng **cùng một cỡ bìa đồng nhất 108px**, có scroll-snap, lộ một phần bìa kế tiếp (peek), nút hành động S2 `<ActionButton isQuiet>`. Loại bỏ hoàn toàn hiện tượng 2 cỡ bìa khác nhau cho cùng một loại sách trên 1 màn.
  - **ListsScreen & <ListCard>**:
    - Hàng danh sách gọn gàng cao 80–96px trên điện thoại: hình đại diện vuông 68px (`<Cover shape="square">`), tên danh sách, "N cuốn sách · cập nhật", mũi tên điều hướng.
    - Toàn bộ dữ liệu seed ("Đang đọc", "Muốn đọc", "Văn học & Tình cảm") và mô tả đều là tiếng Việt 100%, không còn tiếng Anh mồ côi.
    - Modal tạo/sửa danh sách dùng S2 `<TextField>` và S2 `<Button>`.
    - Màn hình ≥ 600px hiển thị lưới thẻ vuông 2–3 cột.
  - **Kiểm tra chất lượng & Biên dịch**:
    - `npm run lint`: **PASS (0 lỗi, 0 cảnh báo)**.
    - `npm run test:unit`: **PASS (20 files, 80/80 tests)**.
    - `npm run build`: **PASS (1.00s)**, vendor `spectrum-vendor` 414.58 kB (gzip 117.35 kB), `index.js` 287.29 kB (gzip 90.23 kB).
    - Android APK `app-debug.apk` (`com.aurelia.books.debug`): **Biên dịch thành công 100% trong 25s**.

- **GIAI ĐOẠN 2 & 3 — TOÀN BỘ CÁC MÀN VÀ MODAL CÒN LẠI (HOÀN THÀNH 100%)**:
  - **Book Detail Modal (`BookDetailModal.jsx`)**:
    - Chuyển sang Adobe Spectrum S2 `<Tabs>`, `<TabList>`, `<Tab>`, `<TabPanel>`, `<Picker>`, `<TextField>`, `<Button>`.
    - Thanh tác vụ "Đọc sách" (Read) cố định dưới đáy full-width với nền đục hoàn toàn (`--bg-base`), phủ kín `safe-area-inset-bottom`.
    - Bộ lọc tóm tắt `cleanSynopsis` loại bỏ 100% rác bản quyền Project Gutenberg ("The of", "This eBook is for...", "Transcriber's note") mà không làm mất liên kết hay nội dung sách.
  - **SettingsScreen (`SettingsScreen.jsx`)**:
    - Đồng bộ 5 nhóm cấu hình dạng Section Card của Spectrum với tiêu đề, biểu tượng và mô tả thống nhất.
    - Lưới sao lưu 2 cột cân xứng tuyệt đối với lề của nhóm (độ lệch ≤1px).
    - Nút đặt lại viền đỏ (`variant="secondary"` kèm lớp cảnh báo).
    - Hộp thoại xóa toàn bộ dữ liệu 2 bước an toàn qua S2 `<AlertDialog>`.
  - **Reader Chrome (`UniversalReaderScreen.jsx`, `EpubReaderScreen.jsx`, `ReaderScreen.module.css`)**:
    - Loại bỏ hoàn toàn kiểu thanh "pill-in-pill" chồng chéo; thay thế bằng floating dock nổi bật, tối giản và tiện dụng ở đáy màn hình.
    - Độ tương phản chữ thanh tiêu đề đạt chuẩn WCAG AA (>10:1 ratio).
    - Đồng bộ màu thanh trạng thái (StatusBar) theo theme đọc thời gian thực.
    - Căn giữa trang bìa và trang tiêu đề EPUB; tối ưu thời gian chờ hiển thị với `withTimeout` để không gây trễ mở sách.
  - **Kiểm soát phần tử thô tự động (`scripts/audit-raw-elements.mjs`)**:
    - Quét toàn bộ JSX trong `src/`: 0 phần tử `<button>`, `<input>`, `<select>`, `<dialog>` thô nằm ngoài danh sách 10 ngoại lệ hợp lệ.
    - Tích hợp trực tiếp vào quy trình kiểm thử tự động `npm run test:all`.

---

## 6. Kết quả nghiệm thu kỹ thuật toàn diện (Final Verification)

1. **Kiểm tra phần tử thô (`npm run test:elements`)**:
   - Quét 68 tệp JS/JSX: **ĐẠT 100%**.
   - 0 phần tử thô trái phép. Duy nhất 10 phần tử cho phép (3 tab bar items trong AppShell, 3 theme preview trong DesignSystem, 3 file input ẩn để tải file, 1 TOC item).
   - Màu sắc: 0 mã màu hex viết cứng trong JSX style; 100% dùng token Spectrum S2 và Editorial tokens thống nhất (`#C05621` Light / `#E07A44` Dark).
2. **Kiểm tra tĩnh (`npm run lint`)**:
   - **PASS (0 lỗi, 0 cảnh báo)**.
3. **Kiểm thử đơn vị (`npm run test:unit`)**:
   - **PASS (21 tệp kiểm thử, 84/84 tests passed)**.
4. **Biên dịch Production (`npm run build`)**:
   - **PASS trong 1.07s**. 100% chunk < 500 kB (chunk lớn nhất `index-*.js`: 287.96 kB, gzip 90.64 kB; `spectrum-vendor-*.js`: 443.23 kB, gzip 125.05 kB).
5. **Kiểm thử E2E Playwright (`npx playwright test`)**:
   - **PASS TOÀN BỘ 78/78 tests trên cả 3 viewport (mobile-360x800, tablet-768x1024, desktop-1440x900) trong 6.9 phút**:
     - `baseline.spec.js`: 3/3 passed
     - `dialogNavigation.spec.js`: 3/3 passed
     - `documentInteractions.spec.js`: 3/3 passed
     - `formatReaders.spec.js`: 3/3 passed
     - `importControls.spec.js`: 3/3 passed
     - `listWorkflow.spec.js`: 3/3 passed
     - `nav-overlap-scan.spec.js`: 9/9 passed (light, dark, viewports)
     - `phase1Acceptance.spec.js`: 9/9 passed (queue, bad files, 30 EPUB cycles)
     - `phase3Acceptance.spec.js`: 6/6 passed (i18n, light/dark, axe-core WCAG AA)
     - `readerChrome.spec.js`: 6/6 passed
     - `reread.spec.js`: 6/6 passed
     - `smoke.spec.js`: 15/15 passed
     - `visual-system.spec.js`: 9/9 passed
6. **Đóng gói ứng dụng Android (`npm run android:apk`)**:
   - Gói kiểm thử: **`com.aurelia.books.debug`** (an toàn tuyệt đối, không ảnh hưởng bản release).
   - File APK: `android/app/build/outputs/apk/debug/app-debug.apk` (kích thước: 41.3 MB).
   - Thời gian build: **24s thành công (BUILD SUCCESSFUL)**.

---

## 7. Nhiệm vụ: Sửa Lệch Bố Cục, Responsive, và Hai Tính Năng Lỗi (Bìa List, Xem Nhanh)

### A. Tóm tắt kết quả
- **Phần 0 — Hợp đồng bố cục (`docs/LAYOUT-CONTRACT.md`)**:
  - Đã thiết lập token `--page-margin: 16px` bất biến.
  - Sửa `<PageHeader>` căn sát mép phải (hành động sát mép phải `headerWidth - 16px`), bỏ subtitle thừa trên Home.
  - Thanh Library: thiết kế lại thành 1 hàng duy nhất $\le$ 44dp (trái: đếm sách; phải: Sort Picker co giãn theo nội dung + nút "Tùy chọn hiển thị" mở Popover/Tray). Loại bỏ icon $\equiv$ không nhãn và chữ bị cắt "C..".
  - Sửa lệch 13px của lưới Library: xóa bỏ `justify-items: center` trên `.libraryGrid` và bỏ `max-width: 120px; margin: 0 auto` trên card để cột 0 căn thẳng tắp 16px với header, search, chip.
  - `<BookCard>` cấu trúc cố định: bìa 2:3, giữ chỗ 2 dòng tiêu đề, 1 dòng tác giả, hàng meta cố định (badge định dạng trái, ActionMenu ⋯ phải). Thêm padding-top 2px chống cắt đỉnh dấu tiếng Việt ("Ắ Ệ Ở Ữ Ự").
  - Thẻ "Đọc tiếp" (Hero Card): bìa đúng tỉ lệ 2:3 (76x114), padding đều 4 phía 16px, hiển thị phần trăm tiến độ kèm nút Primary "Tiếp tục".
  - `<ListRow>`: ảnh đại diện vuông 68dp căn đỉnh với cột chữ, offset tiêu đề so với mép card bằng nhau ở mọi hàng; hiển thị thời gian qua `Intl.RelativeTimeFormat(locale)`; lưới 2x2 vuông vức (`min-width: 0; min-height: 0; object-fit: cover`) không có glyph ✦; ActionMenu ⋯ (Sửa, Đổi ảnh bìa, Xóa).
  - Thanh nav dưới: tab chọn dùng accent + pill chỉ báo, vùng chạm $\ge$ 48dp.
- **Phần 1 — Sửa lỗi Upload Bìa Danh Sách**:
  - *Nguyên nhân gốc*: Trước đó `ListEditor` chưa có input tải ảnh hoặc preview bìa tùy chỉnh; `ListCard` không truyền `src={list.coverImageUrl}` vào `<Cover>`; `<Cover>` bỏ qua `src` nếu có `subCovers`.
  - *Đã khắc phục*:
    - Xây dựng `src/utils/imageCoverProcessor.js`: kiểm tra magic bytes (JPEG/PNG/WebP), chặn SVG, giới hạn 20MB, resize/downsample trước khi giải mã bằng `createImageBitmap({ resizeWidth: 768 })` chống tràn RAM với ảnh $\ge$ 12MP, crop vuông 1:1, xuất WebP.
    - Cập nhật `ListEditor` trong `ListsScreen.jsx`: thêm UI "Chọn ảnh", "Dùng bìa tự động", xem trước tức thì, thông báo Toast khi lỗi/thành công.
    - Cập nhật `useLibrary.js`: lưu trữ `coverImageUrl` bền vững trong IndexedDB `lists`.
    - Cập nhật `<Cover>`: ưu tiên hiển thị `src` tùy chỉnh trước composite grid.
- **Phần 2 — Nhấn Giữ: Xem Nhanh Sách (Quick Preview)**:
  - Viết hook `useLongPress.js`: ngưỡng 500ms, hủy nếu di chuyển > 8px (không cản trở cuộn ngang/dọc kệ sách), chặn menu chuột phải/chọn chữ bằng `-webkit-touch-callout: none; user-select: none; onContextMenu: preventDefault`, rung phản hồi haptic qua `@capacitor/haptics` / `navigator.vibrate`.
  - Xây dựng `<BookQuickPreviewModal>`: mở Sheet/Tray Spectrum, hiển thị bìa 2:3, tên, tác giả, định dạng, phần trăm tiến độ, phần mô tả được làm sạch bằng `cleanSynopsis.js` (loại bỏ HTML, giấy phép Project Gutenberg, gộp khoảng trắng, clamp 5 dòng + nút Spectrum "Xem thêm"/"Thu gọn"), fallback "Chưa có giới thiệu", các nút Đọc/Tiếp tục, Yêu thích, Thêm vào danh sách, Chi tiết sách.
  - Tích hợp lối tắt phụ: mục "Xem nhanh" trong ActionMenu ⋯ của `BookCard`.
- **Phần 3 — Responsive và Xuống Dòng**:
  - Nhóm nút Settings (`.backupGrid`): màn hình < 480px xếp dọc full-width, từ 480px trở lên xếp lưới 2 cột bằng nhau.
  - Chữ: áp dụng `min-width: 0`, `overflow-wrap: anywhere`, `text-wrap: balance/pretty`.
  - i18n & Pseudo-locale: bổ sung hàm chuyển đổi `pseudoTransform` cho locale `pseudo` (+40% độ dài, bọc ngoặc) để kiểm thử tràn chữ; cập nhật toàn bộ key tiếng Việt trong `messages.js` (audit i18n đạt 100%).
- **Phần 4 — Test Đo Bounding-Box & E2E**:
  - `npm run test:elements`: PASS 100% (0 phần tử HTML thô trái phép).
  - `npm run test:i18n`: PASS 100% (0 thiếu chuỗi tiếng Việt).
  - `npm run test:unit`: PASS 100% (22 test files, 91/91 unit tests).
  - `npx playwright test tests/e2e/listWorkflow.spec.js`: PASS 2/2 tests (tạo list kèm bìa custom, kiểm tra render ảnh, reload trang vẫn giữ bìa, reset về bìa tự động thành công).
  - `npx playwright test tests/e2e/visual-system.spec.js`: PASS 27/27 tests trên cả 3 viewport (mobile-360x800, tablet-768x1024, desktop-1440x900):
    1. Header left alignment = 16px và Action flush right trên tất cả các tab.
    2. Zero 13px offset: cột 0 của lưới Library, SearchField, chip filter, tools row căn thẳng tắp 16px.
    3. Tọa độ Y hàng tên, tác giả, meta badge bằng nhau giữa các card cùng hàng ($\le$ 1px).
    4. Thẻ Hero: tỉ lệ 2:3 chuẩn (1.5 $\pm$ 0.05), padding 4 phía đều nhau 16px, nút "Tiếp tục".
    5. ListCard: offset đỉnh tiêu đề so với card top bất biến giữa hàng có mô tả và không có mô tả ($\le$ 1px); ô ghép 2x2 vuông vức.
    6. Nhấn giữ ~500ms mở Quick Preview modal mượt mà.
  - `npm run android:apk`: Debug APK `app-debug.apk` (41.3MB) biên dịch thành công 100%.

---

## 6. Nhiệm Vụ Làm Lại Trình Đọc (Reader Overhaul): Bề Mặt Đọc, Chrome, Menu ⋯, Panel

### Mục tiêu & Nguyên tắc:
- Tuân thủ nghiêm ngặt Antislop & Spectrum tokens, không dùng CSS đè chắp vá.
- Thao tác duy nhất trên `com.aurelia.books.debug`.
- Bằng chứng thiết bị thật: kiểm tra căn chỉnh đo trên máy thật (`TECNO LI6` - Android 15, 1080×2460) và Chromium.
- **Cổng Duyệt (Review Gate)**: Dừng lại sau Mục 1–4, trình bày Before/After và bảng số đo thực tế trước khi sang Mục 5–9.

### Tiến độ thực hiện Mục 0–4:

1. **Mục 0: Công cụ & Baseline Trước Cải Tạo (Hoàn thành)**:
   - Đã cập nhật `src/components/Dev/DebugOverlay.jsx`: vẽ vùng cấm status bar (`--safe-top`), gesture bar (`--safe-bottom`), chữ thập tâm màn hình, touch target xanh ($\ge$ 44dp) / đỏ (< 44dp).
   - Đã lập ma trận 600 trạng thái kiểm thử tại `qa/reader/COVERAGE.md`.
   - Đã chụp toàn bộ 9 ảnh baseline Before trên máy thật (1080×2460) lưu tại `qa/reader/before-device/`.

2. **Mục 1: Bề Mặt Đọc (Reading Surface) (Hoàn thành)**:
   - Tạo mới `ReaderViewport.jsx` & `ReaderViewport.module.css`:
     - Cạnh an toàn `--safe-top` và `--safe-bottom` trám hoàn toàn bằng `--reader-bg` (không hở nền app).
     - Chữ trang đầu/cuối được cắt gọn, không bao giờ trườn vào sau status bar icons hay gesture bar.
     - Mini footer mỏng mờ (`"Chương IV · 55%"`) khi chrome ẩn, chạm vào để bật lại chrome.
     - Loại bỏ hoàn toàn nút nổi `"☰"` che góc văn bản.
     - Bố cục chạm 3 vùng (Trái: lùi/ẩn, Giữa: toggle chrome, Phải: tiến/ẩn).
     - Phân đoạn: chuẩn hóa hoặc dãn đoạn `margin: 0 0 0.75em; text-indent: 0` hoặc theo CSS gốc, tuyệt đối không vừa thụt vừa dãn.
     - Bìa SVG/IMG căn giữa hoàn hảo chiều dọc và ngang, `object-fit: contain`.
     - Chỉ báo hết chương (`#hanbooks-chapter-end`): căn giữa flexbox, gồm chevron tinh tế và tên chương tiếp theo.

3. **Mục 2: Thanh Điều Hướng Trên và Dưới (ReaderChrome) (Hoàn thành)**:
   - Tạo mới `ReaderChrome.jsx` & `ReaderChrome.module.css`:
     - Top Bar: Nút Đóng (trái) và nút ⋯ (phải) đối xứng tuyệt đối (44dp touch target). Tiêu đề nằm chính giữa (độ lệch thực tế: **0.36px** $\le$ 2px).
     - Bottom Bar: Thanh dock duy nhất, không lồng card trong card.
       - Hàng 1: Scrubber tiến độ tương phản cao, thumb trắng viền cam 22dp, touch target $\ge$ 44dp.
       - Hàng 2: Bốn công cụ độ rộng bằng nhau (độ lệch thực tế: **0.0px** $\le$ 1px): Dấu trang, Ghi chú, Kiểu chữ (Aa), Mục lục.
     - Toast thông báo Bookmark: nổi mờ chính giữa trên bottom dock, `role="status"`, có nút "Hoàn tác".

4. **Mục 3: Menu Ba Chấm (More Menu ⋯) (Hoàn thành)**:
   - Popover neo chính xác vào nút ⋯ ở góc phải trên. Mép phải menu trùng khớp hoàn toàn mép phải nút (độ lệch **0.0px**).
   - Chiều rộng 315px ($\ge$ 220px, cách mép phải màn hình 11.2px an toàn).
   - Mỗi mục có icon, văn bản sắc nét, số lượng phụ căn phải ("Dấu trang (2)").

5. **Mục 4: Panel / Sheet Trang Nhã (ReaderSheet) (Hoàn thành)**:
   - Tạo mới `ReaderSheet.jsx` & `ReaderSheet.module.css`:
     - Mobile: Bottom Tray thích ứng nội dung (< 85dvh), thanh grab handle + nút X ở header.
     - Riêng Panel Kiểu chữ (Aa / `ReaderSettingsPanel`): Low Tray $\le$ 55dvh, `noBackdrop={true}` (không làm tối đen màn hình phía trên) giúp người dùng thấy trực tiếp văn bản/màu nền thay đổi khi chỉnh.
     - Bỏ hoàn toàn nút "Đóng" thừa ở chân sheet.

6. **Kết quả đo lường CDP trên thiết bị thật (TECNO LI6 - Android 15, 1080×2460)**:
   - Sải nút Top Bar: Trái `44×44px`, Phải `44×44px` (Đối xứng 100%).
   - Độ lệch tâm tiêu đề Top Bar: **0.36px** (Đạt chuẩn $\le$ 2px).
   - Độ rộng 4 nút Bottom Bar: `[87.18, 87.18, 87.18, 87.18]px` (Độ lệch: **0.0px**, Đạt chuẩn $\le$ 1px).
   - Scrubber Slider Thumb: 22dp hiển thị, touch target $\ge$ 44dp.
   - Căn lề phải Popover Menu: lệch **0.0px** so với nút ⋯, cách mép màn hình 11.3px.
   - Chiều cao Low Tray (Aa): $48.2\text{dvh} \le 55\text{dvh}$, `noBackdrop` hoạt động đúng.

7. **Kiểm thử Tự Động & Tiêu Chuẩn Trợ Năng (A11y)**:
   - `npm run test:unit`: PASS 100% (22 test files, 93/93 unit tests).
   - `npx playwright test tests/e2e/readerChrome.spec.js`: PASS 6/6 tests trên cả 3 viewport (mobile-360x800, tablet-768x1024, desktop-1440x900):
     - Auto-hide Reader Chrome sau khoảng thời gian đọc không tương tác.
     - Phím tắt / bàn phím: Mini Footer đóng vai trò nút mở điều khiển trang đọc (`aria-label="Show reader controls"`), hỗ trợ Tab/Enter lấy nét tức thì.
     - Bàn phím ESC đóng Panel/Sheet mà không thoát Reader.
     - Kiểm toán Axe Accessibility Audit trên các Sheet/Panel: **0 vi phạm nghiêm trọng (0 critical/serious violations)**, tương phản màu sắc `bookTitle` đạt $\ge$ 4.5:1, tên truy cập WCAG 2.5.3 (Label in Name) khớp 100%.
   - `npx playwright test tests/e2e/captureReaderFeatures.spec.js`: PASS 100%.
   - `npm run build`: PASS (1.16s, 1227 modules transformed).
   - `npx cap sync android`: Hoàn thành đồng bộ assets vào thư mục Android.
   - `gradlew assembleDebug`: BUILD SUCCESSFUL in 22s (`app-debug.apk` 41.3MB sẵn sàng).






