# KẾ HOẠCH DỌN DẸP REPOSITORY (CLEANUP PLAN)
> **Mục tiêu**: Làm gọn repository, thiết lập cấu trúc rõ ràng, chấm dứt tình trạng rác test phình to, giữ nguyên 100% hành vi ứng dụng.  
> **Trạng thái**: Chờ Chủ dự án duyệt (Review Gate — Chưa thực hiện xóa bất kỳ file nào).  
> **Commit an toàn**: Nhánh `backup/pre-cleanup` & Tag `pre-cleanup` tại commit `44262cb`. Toàn bộ thay đổi chưa commit đã được lưu an toàn tại nhánh `backup/uncommitted-reader-work` (commit `f9c34ab`).

---

## 1. Kiểm Kê Hiện Trạng Repository

### 1.1. Dung Lượng Thư Mục Cấp 1 & Cấp 2 (Không tính `node_modules`)

| Thư mục cấp 1 | Cấp 2 tiêu biểu | Dung lượng | Mô tả / Nội dung chính |
| :--- | :--- | :--- | :--- |
| **`aurelia-books/`** | Toàn bộ dự án chính | **3,039.4 MB** | Mã nguồn, build cache, ảnh QA, fixtures |
| ↳ `.android-build/` | Cache build Gradle cục bộ | 1,694.5 MB | Cache trung gian Android (không cần track) |
| ↳ `tests/fixtures/large/` | File nhị phân test tải lớn | 649.0 MB | Gồm file `oversized-500mb.bin`, `large-100mb.pdf` |
| ↳ `android/` | Android native project | 334.0 MB | Cấu hình Capacitor native và wrapper Gradle |
| ↳ `qa/` | Ảnh, logs, báo cáo test các phase | 149.1 MB | 508 file ảnh & report test tích tụ qua 5 phase |
| ↳ `.npm-cache-phase3/` | Cache gói npm cục bộ | 115.3 MB | Thư mục cache npm cũ của phase 3 |
| ↳ `dist/` | Web production bundle | 33.1 MB | Đầu ra của lệnh `vite build` |
| ↳ `public/` | Asset web, font, sample epub | 28.6 MB | Font Inter/Lora, 2 cuốn sách mẫu |
| ↳ `src/` | Mã nguồn ứng dụng React | 1.5 MB | 80 file JS/JSX/CSS logic ứng dụng |
| ↳ `scripts/` + `scratch/` | Script tiện ích & scratch debug | 0.3 MB | Các script kiểm tra và đo lường |
| **`.jdk/`** | JDK 17 & 21 cục bộ | **1,008.3 MB** | Bộ cài JDK môi trường dev (đã gitignore) |
| **`.git/`** | Git database & history | **886.7 MB** | Cơ sở dữ liệu lịch sử commit |
| **`.android-sdk/`** | Android SDK cục bộ | **701.0 MB** | Build-tools, platform-tools (đã gitignore) |
| **`data/`** | Thư viện sách mẫu | **695.0 MB** | 1,200+ tệp EPUB test tải thư viện (đã gitignore) |
| **`.venv/`** | Môi trường ảo Python | **11.4 MB** | Môi trường Python cục bộ (đã gitignore) |
| **`.tmp-font/`** | Thư mục tải font tạm | **7.2 MB** | Tệp font tải về trong đợt audit trước |
| **`.phase1-verification-backup-20261023/`** | Backup báo cáo phase 1 | **5.2 MB** | Bản sao lưu kết quả test phase 1 cũ |
| **`Font/`** | `font-montserrat.zip` | **4.1 MB** | File zip font cũ không dùng |
| **`.trail/`** | Repo context graph cache | **4.2 MB** | Cache đồ thị ngữ cảnh mã nguồn Trail |
| **`soft-pages/`** | Prototype UI cũ | **0.4 MB** | Repo con (gitlink 160000, không ai import) |
| **`next-app/`** | Prototype Next.js cũ | **0.4 MB** | Repo con lồng nhau (có `.git`, không ai import) |
| **`ios/`** | Dự án iOS riêng | **0.02 MB** | Repo con iOS (đã gitignore) |
| **`test-artifacts/`** | Thư mục artifact test rỗng | **0.00 MB** | Thư mục rỗng từ các lần chạy trước |

---

### 1.2. Thống Kê Tệp Theo Phần Mở Rộng

| Định dạng | Số lượng | Dung lượng | Tình trạng & Phân loại |
| :--- | :---: | :---: | :--- |
| **`.zip`** | 23 | 1,240.3 MB | Gồm fixture test tải và font zip |
| **`.epub`** | 1,232 | 849.4 MB | Sách mẫu thư viện trong `data/` và `public/books/` |
| *(không đuôi)* | 1,392 | 632.2 MB | Chủ yếu trong SDK, JDK và file `oversized-500mb.bin` |
| **`.jar` / `.bin`** | 472 | 1,034.2 MB | Toolchain Android/Java |
| **`.png`** | 13,389 | 210.7 MB | Ảnh chụp màn hình test, report HTML, asset |
| **`.apk`** | 3 | 110.5 MB | File APK debug xuất xưởng trong `android/` |
| **`.pdf`** | 4 | 100.1 MB | Gồm file `large-100mb.pdf` và fixture test định dạng |
| **`.xml`** | 9,928 | 96.8 MB | File cấu hình trong SDK, Android resource |
| **`.json`** | 315 | 6.7 MB | Cấu hình, i18n, metadata, kết quả test axe |
| **`.js` / `.mjs`** | 299 | 17.0 MB | Script đo đạc, worker, mã nguồn, test |
| **`.md`** | 363 | 1.1 MB | Tài liệu, báo cáo theo từng phase, trail index |
| **`.css`** | 69 | 0.8 MB | CSS modules và styles hệ thống |
| **`.jsx`** | 47 | 0.3 MB | Component giao diện ứng dụng |
| **`.log`** | 8 | 0.3 MB | Log chạy test / device debug |

---

### 1.3. Lịch Sử Git & Top 20 Blob Lớn Nhất

- `git count-objects -vH`:
  - Số đối tượng trong pack: **2,938 objects**
  - Số packfile: **2 packs**
  - Tổng dung lượng pack: **886.40 MiB**

#### Top 20 Blob Lớn Nhất Trong Lịch Sử Git:
| STT | Dung lượng | SHA | Đường dẫn tệp trong lịch sử | Phân loại |
| :---: | :---: | :---: | :--- | :--- |
| 1 | **23.70 MB** | `2ea238e8` | `aurelia-books/public/books/pride-and-prejudice.epub` | Sách mẫu public (đang dùng) |
| 2 | **4.13 MB** | `91ea2e0a` | `Font/font-montserrat.zip` | File zip font thừa |
| 3 | **2.95 MB** | `ce20c16b` | `aurelia-books/public/books/jane-eyre.epub` | Sách mẫu public (đang dùng) |
| 4 | **2.77 MB** | `68c3ce67` | `aurelia-books/qa/design/before-clean/dark/07-reader-page.png` | Ảnh chụp phase cũ |
| 5 | **2.77 MB** | `132e01df` | `aurelia-books/qa/design/before-clean/light/07-reader-page.png` | Ảnh chụp phase cũ |
| 6 | **2.77 MB** | `3f03b22e` | `aurelia-books/qa/device-screenshots/current_screen.png` | Ảnh thiết bị tạm |
| 7 | **2.63 MB** | `26938a08` | `aurelia-books/qa/device-screenshots/reader_open.png` | Ảnh thiết bị tạm |
| 8 | **2.63 MB** | `0373fa35` | `aurelia-books/qa/device-screenshots/detail.png` | Ảnh thiết bị tạm |
| 9 | **2.61 MB** | `1738734e` | `aurelia-books/qa/device-screenshots/reader_chrome.png` | Ảnh thiết bị tạm |
| 10 | **2.60 MB** | `97d5d21a` | `aurelia-books/qa/design/before-clean/dark/08-reader-chrome.png` | Ảnh chụp phase cũ |
| 11 | **2.58 MB** | `b6732cf7` | `aurelia-books/qa/design/before-clean/light/08-reader-chrome.png` | Ảnh chụp phase cũ |
| 12 | **2.22 MB** | `3cdbed32` | `aurelia-books/qa/fix/device/part-a-settings-bottom.png` | Ảnh chụp fix cũ |
| 13 | **2.22 MB** | `e74e4433` | `aurelia-books/qa/fix/device/part-b-detail-modal-finished.png` | Ảnh chụp fix cũ |
| 14 | **2.22 MB** | `00155609` | `aurelia-books/qa/fix/device/part-b-reader-after-reread.png` | Ảnh chụp fix cũ |
| 15 | **2.12 MB** | `80d4cff6` | `aurelia-books/qa/device-screenshots/library.png` | Ảnh thiết bị tạm |
| 16 | **2.11 MB** | `fbc93115` | `aurelia-books/qa/design/before-clean/dark/02-library.png` | Ảnh chụp phase cũ |
| 17 | **2.11 MB** | `64e27c24` | `aurelia-books/qa/reader/01-reader-surface.png` | Ảnh test reader cũ |
| 18 | **2.10 MB** | `341d170e` | `aurelia-books/qa/design/before-clean/light/02-library.png` | Ảnh chụp phase cũ |
| 19 | **2.09 MB** | `827ff9b7` | `aurelia-books/qa/reader/before/01-reader-surface.png` | Ảnh tham chiếu chủ dự án |
| 20 | **2.08 MB** | `69f9c9ed` | `aurelia-books/qa/reader/03-reader-progress-scrubber.png` | Ảnh test reader cũ |

> **Nhận xét quan trọng về Git History**:  
> Trong Top 20 blob lớn nhất, ngoại trừ 2 cuốn sách mẫu EPUB (`pride-and-prejudice.epub` 23.7MB và `jane-eyre.epub` 2.95MB), **17/18 tệp còn lại đều là ảnh chụp màn hình PNG của các đợt test và fix trước đây** được commit vào git. Đây là nguyên nhân trực tiếp khiến `.git` phình to tới 886 MB.

---

## 2. Kiểm Tra Mã Bên Thứ Ba / Repo Clone Lồng Nhau

| Thư mục / Thành phần | Tồn tại `.git`? | Được ai tham chiếu? | Tình trạng sử dụng | Đề xuất xử lý |
| :--- | :---: | :--- | :--- | :--- |
| **`next-app/`** | Có (`.git`) | Không có bất kỳ file nào trong `aurelia-books` import hay tham chiếu. `AUDIT.md` ghi chú: *`next-app` was not assessed*. | **KHÔNG DÙNG** (Mã clone/thử nghiệm thừa) | **XÓA HOÀN TOÀN** khỏi cây làm việc. |
| **`soft-pages/`** | Có (`.git`) | Gitlink mode `160000` commit `e2d3b803`. `README.md` ghi: *Older UI prototype and experiments*. Không code nào import. | **KHÔNG DÙNG** (Prototype UI cũ) | **XÓA GITLINK & XÓA THƯ MỤC**. |
| **`ios/`** | Có (`.git`) | Dự án độc lập cho nền tảng iOS, đã có trong `.gitignore`. Không ảnh hưởng Android/Web. | **TÁCH BIỆT** | **GIỮ NGUYÊN / ĐÃ GITIGNORE**. |
| **`.android-build/`** | Không | Thư mục cache Gradle sinh ra khi biên dịch Android native (1.69 GB). | **RÁC BUILD CỤC BỘ** | **XÓA THƯ MỤC & ĐÃ GITIGNORE**. |
| **`.npm-cache-phase3/`** | Không | Thư mục cache cài đặt gói npm cũ (115 MB). | **RÁC CỤC BỘ** | **XÓA THƯ MỤC & ĐÃ GITIGNORE**. |
| **`.phase1-verification-backup-20261023/`** | Không | Thư mục backup thủ công của đợt test phase 1 cũ (5.17 MB). | **KHÔNG DÙNG** | **XÓA HOÀN TOÀN**. |
| **`.tmp-font/`** | Không | Thư mục tải font tạm thời (7.2 MB). | **RÁC TẠM** | **XÓA HOÀN TOÀN**. |
| **`Font/`** | Không | Chứa `font-montserrat.zip` (4.13 MB). Font đã nhúng trực tiếp trong `public/fonts/`. | **KHÔNG DÙNG** | **XÓA HOÀN TOÀN**. |

---

## 3. Phân Loại 508 Tệp Ảnh Và Output QA

Toàn bộ 508 tệp trong `aurelia-books/qa/` (tổng dung lượng ~149 MB) được phân loại thành 5 nhóm:

```
[a] Baseline Visual Regression (0 tệp)
    - Không có test nào dùng `toMatchSnapshot()` để so khớp pixel cố định.

[b] Ảnh tham chiếu thiết kế do Chủ dự án cung cấp (22 tệp, 16.67 MB)
    - `qa/reader/before/` (12 tệp: 4 ảnh máy thật 1080px, 8 ảnh giả lập 1073px).
    - `qa/reader/before-device/` (9 tệp: ảnh baseline máy thật 1080x2460 trước khi làm lại Reader).
    - `qa/test-device.png` (1 tệp).
    -> ĐỀ XUẤT: Giữ nguyên vẹn, gom vào thư mục chuẩn `qa/reference/`.

[c] Ảnh Before/After & Bằng chứng theo Phase cũ (432 tệp, 104.87 MB)
    - `qa/phase1/` (35 tệp)
    - `qa/phase2/` (54 tệp)
    - `qa/phase3/` (83 tệp)
    - `qa/phase5/` (8 tệp)
    - `qa/design/` (179 tệp)
    - `qa/align/` (38 tệp)
    - `qa/fix/` (15 tệp)
    - `qa/reader/after-device/` (8 tệp)
    -> ĐỀ XUẤT: Xóa khỏi tracking git (đã được lưu trọn vẹn trong tag `pre-cleanup`). Không commit ảnh theo phase.

[d] Ảnh tạm & Artifact của lần chạy test (22 tệp, 20.43 MB)
    - `qa/device-screenshots/` (19 tệp ảnh chụp tạm thời khi test)
    - `qa/test-results/` (1 tệp)
    - `qa/playwright-report/` (1 tệp)
    - `qa/offline-results/` (1 tệp)
    -> ĐỀ XUẤT: Xóa sạch, cấu hình Playwright và test script xuất vào `.artifacts/` (gitignore).

[e] Video / Trace / Log (2 tệp, 2.49 MB)
    - Các file `.log`, `trace.zip` sinh ra khi test lỗi.
    -> ĐỀ XUẤT: Xóa sạch, chuyển toàn bộ đường dẫn xuất log sang `.artifacts/logs/`.
```

---

## 4. Kiểm Kê Mã Chết & Legacy Code (Knip / ESLint / Grep Audit)

### 4.1. File mã nguồn không ai import trong `src/`:
1. **`src/components/Library/BookCover.jsx`** & **`BookCover.module.css`**:
   - Thành phần bìa sách cũ, đã được thay thế 100% bằng `src/components/Common/Cover.jsx` theo Design System mới. Không có bất kỳ file nào import.
   - *Đề xuất: XÓA.*
2. **`src/components/TabBar/TabBar.jsx`** & **`TabBar.module.css`**:
   - Thanh TabBar cũ, đã được thay thế 100% bằng thanh điều hướng responsive tích hợp trong `src/components/Common/AppShell.jsx`. Không có file nào import.
   - *Đề xuất: XÓA.*
3. **Thư mục rỗng**:
   - `src/components/Appearance/` (thư mục rỗng từ prototype cũ).
   - `src/components/Continue/` (thư mục rỗng từ prototype cũ).
   - *Đề xuất: XÓA.*

### 4.2. File scratch phục vụ debug trong `scratch/`:
- 35 file script `.mjs` tạm trong `aurelia-books/scratch/` sinh ra trong quá trình đo lường CDP và kiểm tra layout.
- *Đề xuất: XÓA sạch thư mục `scratch/`.*

### 4.3. Script device/qa một lần không còn dùng:
- `scripts/reproduce-phase-a.mjs`, `scripts/reproduce-phase-b.mjs`, `scripts/capture-clean-before.mjs`: Script một lần của các phase cũ.
- *Đề xuất: Dọn dẹp, chỉ giữ lại các script chính thức trong `scripts/`.*

### 4.4. Kiểm tra Dependencies (`package.json`):
- `lightningcss`: Knip báo unused nhưng **THỰC TẾ ĐANG DÙNG** trong `vite.config.js` (`cssMinify: 'lightningcss'`). -> **GIỮ LẠI**.
- `pngjs`: Dùng trong `scripts/measure-device-alignment.mjs` để đọc pixel ảnh chụp màn hình máy thật. -> **GIỮ LẠI TRONG devDependencies**.
- Các dependency còn lại đều đang phục vụ trực tiếp cho các adapter định dạng (`pdfjs-dist`, `mammoth`, `marked`, `node-unrar-js`, `fflate`, `@web-ppt/core`, `epubjs`), UI Spectrum (`@react-spectrum/s2`), Capacitor, và Vitest/Playwright. -> **GIỮ NGUYÊN**.

### 4.5. Khắc phục 28 lỗi ESLint phát hiện trong audit:
- `src/components/Common/BookCard.jsx`: Gọi hook `useLongPress` có điều kiện -> Chuyển lên đầu component.
- `src/components/Library/LibraryScreen.jsx` & `HomeScreen.jsx`: Bỏ biến chưa khai báo (`ActionButton`, `Picker`) hoặc import chuẩn.
- `src/components/Reader/UniversalReaderScreen.jsx`: Khai báo thiếu `removeBookmark` từ `useLibrary`.
- `src/i18n/messages.js`: Xóa 4 key trùng lặp (`Edit list`, `Delete list`, `Synopsis`, `Favorite`).
- `src/utils/cleanToc.js`: Bỏ ký tự escape thừa trong regex.
- Bỏ các biến không dùng và import `React` thừa trong các file component mới.

---

## 5. Tài Liệu Và Báo Cáo (Docs Audit)

### Danh sách 27 tệp tài liệu hiện tại:
- **Tài liệu kiến trúc & thiết kế cốt lõi**:
  - `aurelia-books/docs/ARCHITECTURE.md` (Kiến trúc hệ thống) -> **GIỮ**.
  - `aurelia-books/docs/DECISIONS.md` (Quyết định thiết kế) -> **GIỮ**.
  - `aurelia-books/docs/DESIGN.md` (Hệ thống thiết kế) -> **GIỮ**.
  - `aurelia-books/docs/LAYOUT-CONTRACT.md` (Quy chuẩn bố cục & metrics) -> **GIỮ**.
  - `aurelia-books/docs/AUDIT.md` (Báo cáo audit ban đầu) -> **GIỮ**.
  - `docs/CLEANUP-PLAN.md` (Kế hoạch dọn dẹp hiện tại) -> **GIỮ**.
- **Báo cáo theo từng phase rời rạc**:
  - `qa/phase0/VERIFICATION.md`
  - `qa/phase1/ACCEPTANCE.md`, `qa/phase1/MANUAL-DEVICE-CHECKLIST.md`, `qa/phase1/MANUAL_ANDROID_CHECKLIST.md`, `qa/phase1/README.md`, `qa/phase1/VERIFICATION-2026-10-23.md`
  - `qa/phase2/MANUAL_ANDROID_CHECKLIST.md`, `qa/phase2/VERIFICATION.md`
  - `qa/phase4/METRICS.md`
  - `qa/phase5/DEVICE-REPORT.md`, `qa/phase5/MANUAL-REMAINING.md`
  - `qa/align/REPORT.md`, `qa/design/NOTES.md`, `qa/design/REVIEW.md`, `qa/baseline/README.md`
  - `aurelia-books/docs/DESIGN-AUDIT.md`, `aurelia-books/docs/SPECTRUM-AUDIT.md`
  - `docs/plans/2026-06-28-import-lists-performance-design.md`
  -> **ĐỀ XUẤT GỘP**: Tạo một tệp duy nhất `docs/HISTORY.md` tóm tắt súc tích tiến trình và kết quả đạt được qua các phase (mỗi phase 5–10 dòng). Sau đó xóa các báo cáo phase rời rạc.
- **Tài liệu theo dõi liên tục**:
  - `qa/PROGRESS.md`: Rút gọn còn trạng thái hiện tại (Reader Overhaul hoàn thành Mục 0–4) và các đầu việc tiếp theo.
  - `qa/BUGS.md`: Dọn dẹp, chỉ giữ danh sách lỗi đang mở.
  - `qa/reader/COVERAGE.md`: Giữ làm ma trận kiểm thử 600 trạng thái của Reader.

---

## 6. Chính Sách Artifact Mới (Khắc Phục Tận Gốc Rác Test)

Để rác test không bao giờ quay trở lại repo, thiết lập các quy tắc bắt buộc sau:

1. **Một thư mục đầu ra duy nhất bị gitignore**: `.artifacts/`
   - Playwright output: `.artifacts/test-results/`
   - Playwright report HTML: `.artifacts/playwright-report/`
   - Ảnh chụp thiết bị thật: `.artifacts/device/`
   - Logs & Traces: `.artifacts/logs/`
2. **Quy tắc đặt tên ảnh: Ghi đè theo màn, không thêm mới**:
   - Định dạng: `{screen}.{theme}.{width}.png` (ví dụ: `home.light.360.png`, `reader.sepia.1080.png`).
   - Lần chạy test sau tự động ghi đè lên file của lần chạy trước. Tuyệt đối không đặt tên theo ngày, giờ, timestamp hay phase (`after-phase3-final-v2.png`).
3. **Cập nhật `playwright.config.js`**:
   ```javascript
   outputDir: '.artifacts/test-results',
   reporter: [
     ['list'],
     ['html', { outputFolder: '.artifacts/playwright-report', open: 'never' }],
   ],
   ```
4. **Bổ sung npm scripts dọn dẹp**:
   - `npm run qa:clean`: Xóa toàn bộ `.artifacts/`, thư mục build `dist/`, và cache trung gian. Hỗ trợ cờ `--dry-run`.
   - `npm run qa:prune`: Dọn dẹp các thư mục chạy cũ, chỉ giữ lại N phiên test gần nhất.
5. **Cập nhật `.gitignore` toàn diện**:
   - Chặn `.artifacts/`, `.android-build/`, `.npm-cache*/`, `*.apk`, `*.log`, `.phase1-verification-*`, `.tmp-font/`, `Font/`, `next-app/`.
6. **Quy tắc trong `AGENTS.md`**:
   - Bổ sung chỉ dẫn bất di bất dịch cho các agent sau: *Không commit ảnh/video/log vào git; mọi output test bắt buộc ghi vào `.artifacts/`; ghi đè thay vì tạo file mới; không clone repo ngoài vào source.*

---

## 7. Bảng Kế Hoạch Thực Hiện Sau Khi Được Duyệt (Từng Nhóm Commit)

| Nhóm | Tên nhóm hành động | Chi tiết tệp tin & thao tác | Dung lượng giải phóng | Rủi ro & Cách phòng ngừa |
| :---: | :--- | :--- | :---: | :--- |
| **Nhóm 1** | **Xóa repo clone & cache cục bộ thừa** | - Xóa `next-app/`<br>- Xóa gitlink `soft-pages/`<br>- Xóa `.phase1-verification-backup-20261023/`<br>- Xóa `.tmp-font/` & `Font/font-montserrat.zip`<br>- Xóa `aurelia-books/.android-build/`<br>- Xóa `aurelia-books/.npm-cache-phase3/` | **~1,825 MB** (trên đĩa) | **Thấp**: Hoàn toàn là mã clone độc lập và cache thừa, không file nào trong ứng dụng import. |
| **Nhóm 2** | **Dọn dẹp ảnh QA & output test cũ** | - Di chuyển 22 ảnh tham chiếu của chủ dự án (`qa/reader/before/`, `qa/reader/before-device/`) vào `qa/reference/`<br>- Xóa 432 ảnh Before/After theo phase cũ (`qa/phase1-5/`, `qa/design/`, `qa/align/`, `qa/fix/`)<br>- Xóa `qa/device-screenshots/`, `qa/test-results/`, `qa/playwright-report/`, `qa/offline-results/`, `qa/test-device.png` | **~132 MB** | **Thấp**: Đã lưu toàn bộ trong tag `pre-cleanup`. Không có test nào so sánh pixel snapshot từ các file này. |
| **Nhóm 3** | **Xóa mã chết & sửa lỗi ESLint** | - Xóa `BookCover.jsx` & `BookCover.module.css`<br>- Xóa `TabBar.jsx` & `TabBar.module.css`<br>- Xóa thư mục rỗng `Appearance/`, `Continue/`<br>- Xóa các script trong `scratch/`<br>- Sửa triệt để 28 lỗi ESLint (BookCard hook, missing imports, messages duplicate keys) | **~1 MB** | **Trung bình**: Kiểm tra ngay bằng `npm run lint` và `npm run build` sau khi sửa. |
| **Nhóm 4** | **Gộp tài liệu & rút gọn báo cáo** | - Tạo `docs/HISTORY.md` tóm tắt súc tích các phase<br>- Xóa các báo cáo rời rạc theo phase trong `qa/phase*/`, `qa/align/`, `qa/design/`<br>- Rút gọn `qa/PROGRESS.md` & `qa/BUGS.md` | **~0.1 MB** | **Rất thấp**: Toàn bộ lịch sử chi tiết vẫn xem lại được qua tag `pre-cleanup`. |
| **Nhóm 5** | **Thiết lập chính sách Artifact & `.gitignore`** | - Cập nhật `playwright.config.js` trỏ vào `.artifacts/`<br>- Cập nhật `.gitignore` chặn triệt để `.artifacts/`, rác build, cache<br>- Thêm script `npm run qa:clean` và `npm run qa:prune`<br>- Cập nhật quy tắc chống rác trong `AGENTS.md` | **Ngăn ngừa vĩnh viễn** | **Rất thấp**: Đã test cấu hình đường dẫn Playwright. |

---

## 8. Đề Xuất Riêng Về Lịch Sử Git (Chờ Quyết Định)

- **Thực trạng**: Hiện tại thư mục `.git` chiếm **886.7 MB** do lịch sử commit từ các phase trước chứa 17 blob ảnh PNG lớn (2MB – 3MB mỗi ảnh).
- **Quy tắc**: Tuyệt đối không tự ý chạy `git filter-repo`, `git rebase` hay `push --force`.
- **Đề xuất**:
  - **Phương án A (Khuyến nghị cho giai đoạn hiện tại)**: Giữ nguyên lịch sử git để đảm bảo an toàn tuyệt đối, không thay đổi SHA commit. Việc dọn dẹp cây làm việc (working tree) ở Nhóm 1–5 đã giúp repo nhẹ đi hơn 2,000 MB trên đĩa.
  - **Phương án B (Chỉ làm khi chủ dự án yêu cầu thu nhỏ `.git`)**: Khi chuẩn bị phát hành chính thức hoặc clone lên remote mới, sử dụng `git filter-repo --strip-blobs-bigger-than 2M` để gỡ các ảnh chụp test khỏi lịch sử cũ. Có thể phục hồi nguyên vẹn mọi lúc từ tag `pre-cleanup`.

---

## 9. CỔNG DUYỆT (REVIEW GATE)

> [!IMPORTANT]
> **DỪNG LẠI CHỜ PHÊ DUYỆT**:  
> Theo Quy tắc an toàn bắt buộc số 2, **tôi chưa thực hiện bất kỳ lệnh xóa nào**.  
> Kế hoạch kiểm kê trên đã được lưu chi tiết tại tệp [`docs/CLEANUP-PLAN.md`](file:///E:/Personal_pj/Hanbook/docs/CLEANUP-PLAN.md).  
> **Xin Chủ dự án xem xét và phê duyệt danh sách trên** để tôi bắt đầu thực hiện BƯỚC 3 theo từng nhóm commit riêng biệt kèm xác minh tự động (`npm run lint`, `npm run build`, `npm run test:all`).
