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
