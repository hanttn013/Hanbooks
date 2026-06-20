# KQ Test - Hanbooks / Aurelia Books

## 0. Phiên test mới nhất - lite_gemini

| Thuộc tính | Nội dung |
|---|---|
| Ngày test | 2026-06-14 |
| Giờ bắt đầu | 19:34:35 +07:00 |
| Giờ kết thúc | 19:35:03 +07:00 |
| Người thực hiện | Codex |
| Skill được tham chiếu | `.agent/skills/test-driven-development/` |
| Mục đích | Lưu kết quả test mới sau khi đóng gói bản `lite_gemini` |
| Build được kiểm tra | `AureliaBooks-lite-gemini-debug.apk` |
| APK path | `aurelia-books/AureliaBooks-lite-gemini-debug.apk` |
| APK size | 32,590,138 bytes |
| APK last modified | 2026-06-14 19:30:03 |

### 0.1. Kết quả kiểm tra tự động

| ID | Hạng mục | Lệnh / Bằng chứng | Expected | Actual | Status |
|---|---|---|---|---|---|
| LG-AUTO-001 | ESLint | `npm.cmd run lint` | Không có lỗi lint | ESLint chạy xong, exit code 0 | Pass |
| LG-AUTO-002 | Production build | `npm.cmd run build` | Vite build thành công | Build thành công, exit code 0 | Pass |
| LG-AUTO-003 | APK artifact | `Get-ChildItem -Path aurelia-books -Filter '*.apk'` | Có APK `lite_gemini` | Có `AureliaBooks-lite-gemini-debug.apk` | Pass |
| LG-AUTO-004 | Unit test script | `package.json` | Có script unit test nếu đã cấu hình | Dự án chưa có script `test` | N/A |

Ghi chú:

- Vite vẫn cảnh báo chunk JS lớn hơn 500 kB: `index-DhQh0Cx0.js` khoảng 754.00 kB.
- Đây là warning hiệu năng, không làm build fail.
- Theo tinh thần TDD, phiên này **không thêm production code**; chỉ chạy kiểm tra và ghi nhận kết quả. Dự án hiện chưa có test runner/unit test để thực hiện chu trình RED/GREEN tự động.

### 0.2. Smoke test lite_gemini

| ID | Test case | Priority | Expected Result | Actual Result | Status | Evidence |
|---|---|---|---|---|---|---|
| LG-SMK-001 | Lint source code | P0 | Không có lỗi lint | Pass | Pass | Terminal output |
| LG-SMK-002 | Build web production | P0 | Tạo được `dist/` | Pass | Pass | Terminal output |
| LG-SMK-003 | APK lite_gemini tồn tại | P0 | Có APK sau đóng gói | Pass | Pass | File listing |
| LG-SMK-004 | Cài APK lên Android thật | P0 | Cài và mở được app | Chưa chạy | Not Run | Cần thiết bị thật |
| LG-SMK-005 | Import EPUB hợp lệ | P0 | Sách được lưu và hiển thị | Chưa chạy | Not Run | Cần test runtime |
| LG-SMK-006 | Mở sách và đọc | P0 | Reader hiển thị nội dung | Chưa chạy | Not Run | Cần test runtime |
| LG-SMK-007 | TOC dài không freeze | P1 | TOC 1000+ chương vẫn phản hồi | Chưa chạy | Not Run | Cần EPUB-03 |
| LG-SMK-008 | Progress không mất sau reload | P0 | Mở lại đúng vị trí | Chưa chạy | Not Run | Cần test runtime |
| LG-SMK-009 | Reader settings hoạt động | P1 | Theme/font/mode đổi đúng | Chưa chạy | Not Run | Cần test runtime |
| LG-SMK-010 | EPUB bẩn không phá reader | P1 | Ảnh/CSS không tràn, không crash | Chưa chạy | Not Run | Cần EPUB-11/EPUB-12 |

### 0.3. Kết luận phiên lite_gemini

Kết quả:

- Build verification: **Pass**.
- APK artifact: **Pass**.
- Runtime/manual test trên thiết bị thật: **Not Run**.
- Test data EPUB edge cases: **Not Run**.

Kết luận release:

**Bản `lite_gemini` đủ điều kiện để cài thử nội bộ**, nhưng chưa đủ bằng chứng để kết luận đạt release quality. Cần chạy tiếp nhóm P0 trên Android thật:

1. Import EPUB.
2. Mở sách.
3. Đọc và cuộn.
4. Mở TOC/chuyển chương.
5. Đổi setting reader.
6. Thoát/reload và khôi phục đúng vị trí.

### 0.4. Rủi ro còn mở

| ID | Severity | Priority | Mô tả | Trạng thái | Đề xuất |
|---|---|---|---|---|---|
| LG-RISK-001 | Medium | P2 | JS bundle khoảng 754 kB, Vite cảnh báo chunk lớn | Open | Code split Reader/Search/TOC khi có thời gian |
| LG-RISK-002 | High | P1 | Chưa có unit test runner/script `test` | Open | Thêm Vitest cho utils/settings/progress |
| LG-RISK-003 | High | P0 | Chưa test APK trên Android thật | Open | Cài APK và chạy smoke P0 |
| LG-RISK-004 | High | P1 | Chưa có EPUB test data chuẩn | Open | Chuẩn bị EPUB-01 đến EPUB-12 |
| LG-RISK-005 | Medium | P1 | Chưa đo thực tế TOC 1000+ chương | Open | Test bằng EPUB-03 |

## 1. Thông tin phiên test

| Thuộc tính | Nội dung |
|---|---|
| Ngày test | 2026-06-14 |
| Giờ bắt đầu | 14:57:20 +07:00 |
| Giờ kết thúc | 14:57:49 +07:00 |
| Người thực hiện | Codex |
| Project | Hanbooks / Aurelia Books |
| Thư mục app | `aurelia-books/` |
| Build được kiểm tra | `AureliaBooks-reader-lite-v2-debug.apk` |
| APK path | `aurelia-books/AureliaBooks-reader-lite-v2-debug.apk` |
| APK size | 32,588,879 bytes |
| APK last modified | 2026-06-14 01:06:07 |
| Môi trường lệnh | Windows PowerShell |
| Node/Vite app | React + Vite + Capacitor Android |

## 2. Phạm vi kiểm thử

Mục tiêu kiểm thử dựa theo tài liệu QA được cung cấp:

1. Người dùng import được nhiều loại EPUB.
2. Nội dung sách được hiển thị đúng và đọc ổn định.
3. Tiến độ đọc không bị mất.
4. Cài đặt Reader hoạt động đúng.
5. App vẫn mượt và không hỏng dữ liệu khi gặp trường hợp xấu.

Trong phiên này, tôi thực hiện kiểm thử khả dụng sau đóng gói ở mức **build verification / smoke baseline**:

- Kiểm tra lint.
- Kiểm tra production build.
- Kiểm tra APK debug đã tồn tại sau đóng gói.
- Đối chiếu các nhóm testcase P0/P1 cần test thủ công hoặc test thiết bị thật.

Các test cần thao tác trên thiết bị Android thật, file picker thật, gesture thật, background/resume, EPUB lớn hoặc EPUB lỗi chưa được chạy trong phiên này.

## 3. Quy ước trạng thái

| Status | Ý nghĩa |
|---|---|
| Pass | Đã chạy và đạt kết quả mong đợi |
| Fail | Đã chạy và không đạt |
| Not Run | Chưa chạy trong phiên này |
| Blocked | Chưa thể chạy vì thiếu dữ liệu, thiết bị hoặc automation |
| N/A | Không áp dụng cho phiên test này |

## 4. Kết quả lệnh kiểm thử tự động

| ID | Hạng mục | Lệnh / Bằng chứng | Expected | Actual | Status |
|---|---|---|---|---|---|
| AUTO-001 | ESLint | `npm.cmd run lint` | Không có lỗi lint | ESLint chạy xong, exit code 0 | Pass |
| AUTO-002 | Production build | `npm.cmd run build` | Build thành công | Vite build thành công, exit code 0 | Pass |
| AUTO-003 | Build artifact | `Get-ChildItem -Filter '*.apk'` | Có APK debug mới | Có `AureliaBooks-reader-lite-v2-debug.apk` | Pass |
| AUTO-004 | Unit test script | `package.json` | Có script test nếu dự án đã cấu hình unit test | Chưa có script `test` | N/A |

Ghi chú build:

- Vite có cảnh báo chunk JS lớn hơn 500 kB.
- Đây là warning tối ưu hiệu năng, không làm build fail.
- Nên xử lý sau bằng code splitting nếu app tiếp tục lớn lên.

## 5. Smoke Test sau đóng gói

| ID | Test case | Priority | Expected Result | Actual Result | Status | Evidence |
|---|---|---|---|---|---|---|
| SMK-001 | Project lint sạch | P0 | Không có lỗi cú pháp/hook/style nghiêm trọng | `npm.cmd run lint` pass | Pass | Terminal output |
| SMK-002 | Build production web assets | P0 | `dist/` được tạo thành công | `npm.cmd run build` pass | Pass | Terminal output |
| SMK-003 | APK sau đóng gói tồn tại | P0 | APK debug có trong thư mục app | File tồn tại: `AureliaBooks-reader-lite-v2-debug.apk` | Pass | File listing |
| SMK-004 | Mở app trên Android | P0 | App cài và mở được | Chưa chạy trên thiết bị thật | Not Run | Cần test Android |
| SMK-005 | Import EPUB hợp lệ | P0 | Sách được lưu và hiển thị | Chưa chạy trong phiên này | Not Run | Cần file picker/device |
| SMK-006 | Mở sách | P0 | Reader hiển thị nội dung sách | Chưa chạy trong phiên này | Not Run | Cần test UI |
| SMK-007 | Đọc và lưu progress | P0 | Thoát/mở lại đúng vị trí | Chưa chạy trong phiên này | Not Run | Cần test UI |
| SMK-008 | Chuyển chương | P0 | Sang chương tiếp không trắng màn hình | Chưa chạy trong phiên này | Not Run | Cần test UI |
| SMK-009 | Đổi theme/font size | P1 | Text đổi ngay, không crash | Chưa chạy trong phiên này | Not Run | Cần test UI |
| SMK-010 | Reload/khởi động lại | P0 | Không mất sách và tiến độ | Chưa chạy trong phiên này | Not Run | Cần test Android |

Kết luận smoke hiện tại:

- **Build smoke: Pass.**
- **Runtime smoke trên thiết bị thật: Not Run.**
- Chưa thể kết luận app đạt release quality nếu chưa cài APK lên Android và chạy tối thiểu nhóm P0.

## 6. Testcase theo module

### 6.1. Library / Import

| ID | Test case | Priority | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-IMP-001 | Import EPUB hợp lệ | P0 | Sách được lưu và hiển thị | Chưa chạy | Not Run |
| TC-IMP-002 | Import EPUB không có cover | P1 | Hiển thị cover mặc định | Chưa chạy | Not Run |
| TC-IMP-003 | EPUB thiếu title | P1 | Dùng filename làm title | Chưa chạy | Not Run |
| TC-IMP-004 | Import file không phải EPUB | P1 | Báo lỗi, không lưu file | Chưa chạy | Not Run |
| TC-IMP-005 | Import EPUB bị hỏng | P0 | Không crash, có thông báo dễ hiểu | Chưa chạy | Not Run |
| TC-IMP-006 | Import cùng file hai lần | P1 | Có xử lý duplicate rõ ràng | Chưa chạy | Not Run |
| TC-IMP-008 | Import file 25 MB | P1 | UI vẫn phản hồi hoặc có loading | Chưa chạy | Not Run |
| TC-IMP-009 | Import nhiều file liên tiếp | P1 | Không mất hoặc nhầm metadata | Chưa chạy | Not Run |

Nhận xét:

- Phiên này chưa có bộ EPUB test data `EPUB-01` đến `EPUB-12`.
- Chưa có automation file picker.
- Cần chạy thủ công trên Android/WebView để xác nhận import thật.

### 6.2. Library

| ID | Test case | Priority | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-LIB-001 | Library rỗng | P1 | Empty state có hướng dẫn import | Chưa chạy | Not Run |
| TC-LIB-002 | Hiển thị nhiều sách | P1 | Không vỡ layout | Chưa chạy | Not Run |
| TC-LIB-003 | Sách title rất dài | P2 | Text truncate hợp lý | Chưa chạy | Not Run |
| TC-LIB-005 | Mở Book Detail | P1 | Đúng metadata của sách | Chưa chạy | Not Run |
| TC-LIB-006 | Xóa sách | P0 | Sách biến mất sau reload | Chưa chạy | Not Run |
| TC-LIB-008 | Continue Reading | P0 | Mở đúng sách và vị trí | Chưa chạy | Not Run |
| TC-LIB-009 | Reload Library | P0 | Danh sách không bị mất | Chưa chạy | Not Run |
| TC-LIB-010 | 100-500 sách | P2 | Scroll và cover vẫn mượt | Chưa chạy | Not Run |

### 6.3. Reader cơ bản

| ID | Test case | Priority | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-REA-001 | Mở sách lần đầu | P0 | Hiển thị vị trí bắt đầu hợp lệ | Chưa chạy | Not Run |
| TC-REA-002 | Mở chương từ TOC | P0 | Điều hướng đúng chương | Chưa chạy | Not Run |
| TC-REA-003 | Sang chương tiếp theo | P0 | Không trắng màn hình hoặc nhảy sai | Chưa chạy | Not Run |
| TC-REA-004 | Quay chương trước | P1 | Về đúng chương | Chưa chạy | Not Run |
| TC-REA-005 | Mở sách không có TOC | P1 | Reader vẫn đọc được | Chưa chạy | Not Run |
| TC-REA-006 | Chương chứa ảnh | P1 | Ảnh không tràn màn hình | Chưa chạy | Not Run |
| TC-REA-009 | Xoay màn hình | P1 | Không mất vị trí | Chưa chạy | Not Run |
| TC-REA-010 | Quay lại Library | P0 | Progress được lưu | Chưa chạy | Not Run |

### 6.4. Scroll mode

| ID | Test case | Priority | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-SCR-001 | Cuộn chương dài | P0 | Không giật hoặc mất nội dung | Chưa chạy | Not Run |
| TC-SCR-002 | Cuộn nhanh liên tục | P1 | Không freeze | Chưa chạy | Not Run |
| TC-SCR-003 | Tap khi đang cuộn | P1 | Controls không bật sai | Chưa chạy | Not Run |
| TC-SCR-004 | Tap vùng giữa | P1 | Controls bật đúng một lần | Chưa chạy | Not Run |
| TC-SCR-005 | Tap ngoài vùng giữa | P2 | Không bật controls | Chưa chạy | Not Run |
| TC-SCR-006 | Cuộn đến cuối chương | P0 | Có cách sang chương tiếp | Chưa chạy | Not Run |
| TC-SCR-007 | Reload ở giữa chương | P0 | Khôi phục gần đúng vị trí | Chưa chạy | Not Run |
| TC-SCR-008 | Đổi font ở giữa chương | P1 | Không nhảy về đầu chương | Chưa chạy | Not Run |

### 6.5. Paginated mode

| ID | Test case | Priority | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-PAG-001 | Chuyển trang tiếp | P0 | Sang đúng trang | Chưa chạy | Not Run |
| TC-PAG-002 | Quay trang trước | P0 | Quay đúng trang | Chưa chạy | Not Run |
| TC-PAG-003 | Tap trái/phải | P1 | Hành vi đúng vùng | Chưa chạy | Not Run |
| TC-PAG-004 | Tap giữa | P1 | Bật controls | Chưa chạy | Not Run |
| TC-PAG-005 | Trang cuối chương | P0 | Sang chương tiếp đúng | Chưa chạy | Not Run |
| TC-PAG-006 | Đổi kích thước chữ | P1 | Layout tính lại, không crash | Chưa chạy | Not Run |
| TC-PAG-008 | Reload trang hiện tại | P0 | Khôi phục bằng CFI | Chưa chạy | Not Run |

### 6.6. Reader Settings và Typography

| ID | Test case | Priority | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-SET-001 | Đổi Light/Sepia/Dark | P1 | Theme đổi ngay | Chưa chạy | Not Run |
| TC-SET-002 | Tăng font size | P1 | Text lớn hơn, không tràn | Chưa chạy | Not Run |
| TC-SET-003 | Giảm font size | P1 | Không nhỏ hơn giới hạn | Chưa chạy | Not Run |
| TC-SET-004 | Đổi font family | P1 | Áp dụng đúng trong EPUB iframe | Chưa chạy | Not Run |
| TC-SET-005 | Đổi line height | P1 | Paragraph hiển thị đúng | Chưa chạy | Not Run |
| TC-SET-006 | Reload | P1 | Settings vẫn được giữ | Chưa chạy | Not Run |
| TC-SET-008 | Setting bị hỏng trong localStorage | P1 | App fallback an toàn | Chưa chạy | Not Run |
| TC-SET-009 | Dark mode contrast | P2 | Nội dung dễ đọc | Chưa chạy | Not Run |

### 6.7. TOC

| ID | Test case | Priority | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-TOC-001 | Mở TOC | P1 | Hiện danh sách chương | Chưa chạy | Not Run |
| TC-TOC-002 | Chọn chương | P0 | Mở đúng nội dung | Chưa chạy | Not Run |
| TC-TOC-003 | Chương hiện tại | P2 | Được highlight | Chưa chạy | Not Run |
| TC-TOC-004 | TOC lồng nhiều cấp | P1 | Hiển thị hierarchy đúng | Chưa chạy | Not Run |
| TC-TOC-005 | 1.000 chương | P1 | Không freeze đáng kể | Chưa chạy | Not Run |
| TC-TOC-006 | Tên chương rất dài | P2 | Không vỡ layout | Chưa chạy | Not Run |
| TC-TOC-007 | EPUB không có TOC | P1 | Có trạng thái fallback | Chưa chạy | Not Run |

### 6.8. Progress và CFI

| ID | Test case | Priority | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-PRO-001 | Đọc giữa Chapter II rồi thoát | P0 | Lưu CFI | Chưa chạy | Not Run |
| TC-PRO-002 | Reload | P0 | Mở đúng đoạn | Chưa chạy | Not Run |
| TC-PRO-003 | Đóng tab rồi mở lại | P0 | Khôi phục đúng | Chưa chạy | Not Run |
| TC-PRO-004 | Background/resume | P0 | Không mất progress | Chưa chạy | Not Run |
| TC-PRO-005 | Hai sách khác nhau | P0 | Progress không bị ghi đè | Chưa chạy | Not Run |
| TC-PRO-006 | Đổi font trước khi thoát | P1 | CFI vẫn hợp lệ | Chưa chạy | Not Run |
| TC-PRO-007 | CFI bị hỏng | P1 | Fallback về chương hợp lệ | Chưa chạy | Not Run |
| TC-PRO-009 | Lưu khi scroll liên tục | P1 | Không ghi IndexedDB quá mức | Chưa chạy | Not Run |
| TC-PRO-010 | Xóa sách | P1 | Progress liên quan được dọn sạch | Chưa chạy | Not Run |

## 7. Test phi chức năng

### 7.1. Performance

| ID | Hạng mục | Mục tiêu | Kết quả phiên này | Status |
|---|---|---|---|---|
| PERF-001 | Thời gian build production | Build không lỗi | Pass, build xong khoảng dưới 1 giây theo Vite output | Pass |
| PERF-002 | Chunk size | Không quá lớn hoặc có kế hoạch xử lý | JS chunk 749.90 kB, Vite cảnh báo > 500 kB | Warning |
| PERF-003 | Mở TOC 1.000 chương | Dưới 300 ms hoặc không freeze đáng kể | Chưa có test data EPUB-03 | Not Run |
| PERF-004 | Scroll chương dài | Không có giật kéo dài | Chưa chạy trên thiết bị thật | Not Run |
| PERF-005 | Import file 20-30 MB | UI phản hồi hoặc loading rõ | Chưa có test data EPUB-02 | Not Run |
| PERF-006 | Số lần ghi progress | Không ghi IndexedDB quá mức | Chưa đo bằng instrumentation | Not Run |

### 7.2. Compatibility

| ID | Nền tảng | Expected | Actual | Status |
|---|---|---|---|---|
| COMP-001 | Chrome desktop | App build và chạy web được | Chỉ build, chưa mở browser | Not Run |
| COMP-002 | Chrome Android | Đọc và import được | Chưa chạy | Not Run |
| COMP-003 | Capacitor WebView Android | APK cài và chạy được | Chưa cài thiết bị thật | Not Run |
| COMP-004 | Mobile 320 px | Không vỡ layout | Chưa chạy | Not Run |
| COMP-005 | Mobile 390 px | Không vỡ layout | Chưa chạy | Not Run |
| COMP-006 | Landscape | Không mất vị trí đọc | Chưa chạy | Not Run |

### 7.3. Offline

| ID | Test case | Expected | Actual | Status |
|---|---|---|---|---|
| OFF-001 | Mở sách đã import khi offline | Sách vẫn mở được | Chưa chạy | Not Run |
| OFF-002 | Reload app khi offline | Library/progress vẫn còn | Chưa chạy | Not Run |
| OFF-003 | Cover/font khi offline | Không mất UI chính | Chưa chạy | Not Run |

### 7.4. Security

| ID | Test case | Expected | Actual | Status |
|---|---|---|---|---|
| SEC-001 | EPUB chứa script | Script không được chạy | Code hiện đặt `allowScriptedContent: false`, chưa test bằng file độc | Not Run |
| SEC-002 | Link ngoài trong EPUB | Không phá gesture/reader | Chưa chạy | Not Run |
| SEC-003 | CSS cố định che toàn màn hình | Reader vẫn kiểm soát hiển thị | Chưa chạy | Not Run |
| SEC-004 | File path bất thường | Không crash/import bậy | Chưa chạy | Not Run |

## 8. Bug / Risk ghi nhận

| ID | Severity | Priority | Mô tả | Trạng thái | Đề xuất |
|---|---|---|---|---|---|
| RISK-001 | Medium | P2 | JS bundle production lớn hơn 500 kB | Open | Cân nhắc code splitting cho Reader/Search/Settings modals |
| RISK-002 | High | P1 | Chưa có automated test script trong `package.json` | Open | Thêm Vitest cho utils/settings/storage |
| RISK-003 | High | P0 | Chưa chạy smoke runtime trên Android thật | Open | Cài APK và chạy 10 smoke case P0 |
| RISK-004 | High | P1 | Chưa có bộ EPUB test data chuẩn `EPUB-01` đến `EPUB-12` | Open | Chuẩn bị bộ file test cố định |
| RISK-005 | Medium | P1 | Chưa đo lưu progress khi scroll liên tục | Open | Thêm instrumentation/log hoặc test tự động debounce |

## 9. Kết luận phiên test

Kết quả hiện tại:

- Build verification: **Pass**.
- APK artifact check: **Pass**.
- Functional/manual Reader test: **Not Run**.
- Import/EPUB edge cases: **Not Run**.
- Performance trên thiết bị thật: **Not Run**.

Kết luận release:

**Chưa đủ bằng chứng để kết luận bản APK đạt release quality**, vì nhóm P0 quan trọng nhất của app đọc sách vẫn cần test thủ công hoặc automation trên thiết bị thật:

1. Import EPUB.
2. Mở sách.
3. Đọc nội dung.
4. Chuyển chương.
5. Lưu vị trí.
6. Reload/mở lại không mất sách và progress.

Điều kiện đề xuất để cho phép release thử nghiệm nội bộ:

- Cài `AureliaBooks-reader-lite-v2-debug.apk` lên ít nhất 1 thiết bị Android thật.
- Chạy toàn bộ smoke suite 10 case.
- Dùng tối thiểu 3 file EPUB:
  - EPUB nhỏ hợp lệ.
  - EPUB thiếu metadata/cover.
  - EPUB lỗi hoặc không hợp lệ.
- Ghi evidence bằng screenshot hoặc video ngắn cho các case P0.

## 10. Checklist test tiếp theo

- [ ] Chuẩn bị bộ test data `EPUB-01` đến `EPUB-12`.
- [ ] Cài APK lên Android thật.
- [ ] Chạy smoke suite 10 case.
- [ ] Chạy P0 cho Import, Reader, Progress, Reload.
- [ ] Ghi bug theo format `BUG-MODULE-NNN`.
- [ ] Thêm script unit test bằng Vitest.
- [ ] Tự động hóa ít nhất 1 flow: import demo/mock -> mở sách -> đổi theme -> reload -> restore progress.

## 11. Regression test lite_gemini metadata/reader

Ngày test: 2026-06-14  
Giờ test: 22:39:45 +07:00  
Mục tiêu: kiểm tra lại các lỗi người dùng báo trên Book Info và Reader progress.

| ID | Test case | Expected | Actual | Status |
|---|---|---|---|---|
| REG-BOOKINFO-001 | EPUB có trang `Giới thiệu`/`Văn án` và TOC dài | Synopsis ưu tiên văn án/giới thiệu, không lấy danh sách `Chương 1...` làm văn án | Đã sửa extractor: phát hiện TOC-like text, parse `Văn án`, `Tác giả`, `Thể loại`, `Tên gốc`, `Nhân vật`, `Editor`, `Beta` từ các trang đầu | Pass by code review |
| REG-BOOKINFO-002 | EPUB có navigation lồng nhau hoặc nhiều section phụ | Chapter count đếm chương thật theo nhãn `Chương N`/`Chapter N`, không lấy thẳng số spine/nav row | Đã flatten TOC và đếm unique chapter numbers, fallback mới dùng content rows/spine | Pass by code review |
| REG-BOOKINFO-003 | Sách đã import trước đó có metadata bẩn | Mở Book Info sẽ refresh metadata từ EPUB mà không spam render | Đã thêm lazy metadata refresh, chạy sau khi modal render, dependency ổn định | Pass by lint |
| REG-READER-001 | Scroll mode ở trang/chương `Giới thiệu`, progress 67% | Kéo slider tới 100% chỉ tới cuối `Giới thiệu`, không nhảy cuối sách | Đã seek theo scroll height của iframe chapter hiện tại trước khi fallback sang book locations | Pass by code review |
| REG-READER-002 | Scroll trong reader | Controls tự ẩn, progress chương cập nhật theo vị trí scroll | Đã cập nhật progress từ `scrollingElement.scrollTop / maxScroll` | Pass by code review |
| REG-BUILD-001 | Lint | Không có lỗi ESLint | `npm.cmd run lint` pass | Pass |
| REG-BUILD-002 | Web build | Build production thành công | `npm.cmd run build` pass, còn warning bundle > 500 kB | Pass |
| REG-APK-001 | Build APK debug | Tạo APK mới sau bản vá | Đã cài portable JDK 21 + Android SDK 36 trong workspace và build `AureliaBooks-lite-gemini-debug.apk` lúc 2026-06-15 00:08:10 +07:00 | Pass |

Ghi chú:

- APK mới đã build thành công nhưng chưa được smoke test trên Android thật trong phiên này.
- Toolchain portable đã được đặt trong `.jdk/` và `.android-sdk/`, cả hai đều được ignore để không push lên GitHub.
- File cài thử: `aurelia-books/AureliaBooks-lite-gemini-debug.apk`.

## 12. Regression test Book Info freeze + chapter slider

Ngày test: 2026-06-15  
Giờ test: 01:29:19 +07:00  
APK: `aurelia-books/AureliaBooks-lite-gemini-debug.apk`  
APK size: 32,331,401 bytes  
Mục tiêu: kiểm tra lại lỗi Book Info bị đứng, synopsis vẫn là TOC, và slider trong 1 chapter không kéo được.

| ID | Test case | Expected | Actual | Status |
|---|---|---|---|---|
| REG-BOOKINFO-004 | Mở Book Info của sách có synopsis bẩn dạng danh sách `Chương 1...` | Modal mở ngay, không parse EPUB nặng lúc mở | Đã bỏ auto metadata extraction trong `BookDetailModal`; modal chỉ render dữ liệu hiện có và không chạy parse khi mở | Pass by code review |
| REG-BOOKINFO-005 | Sách cũ có description TOC-like | Không hiển thị danh sách chương như văn án | `looksLikeTocText()` chuyển sang normalize ASCII-safe; modal ẩn synopsis dạng TOC và hiện hướng dẫn `Repair Info` | Pass by code review |
| REG-BOOKINFO-006 | Người dùng muốn sửa metadata sách cũ | Có thao tác chủ động, cập nhật modal ngay sau khi sửa | Thêm nút `Repair Info`; sau khi trích EPUB xong cập nhật `displayBook` ngay và lưu vào IndexedDB | Pass by code review |
| REG-BOOKINFO-007 | EPUB tiếng Việt/convert lỗi encoding | Nhận được `Chương`, `Tác giả`, `Thể loại`, `Văn án`, `Giới thiệu` ở dạng có dấu/không dấu/mojibake phổ biến | Viết lại extractor theo normalize ASCII-safe, tránh phụ thuộc regex tiếng Việt bị lỗi mã hóa | Pass by code review |
| REG-READER-003 | Slider chapter trong scroll mode trên Android | Kéo ngang được, không bị reader cha nuốt touch | `.progressSlider` có `touch-action: none`, `pointer-events: auto`, và chặn propagation khi pointer/touch start | Pass by code review |
| REG-READER-004 | Đang kéo slider, scroll listener vẫn chạy | Giá trị slider không bị nhảy ngược khi ngón tay đang drag | Thêm `isSeekingRef`; progress scroll không ghi đè trong lúc seek, tự mở khóa sau commit | Pass by code review |
| REG-READER-005 | Kéo slider tới 100% trong chapter hiện tại | Seek theo chiều cao chapter hiện tại trước, không dùng book percentage | `seekWithinScrollChapter()` chạy trước fallback CFI/book locations | Pass by code review |
| REG-BUILD-003 | Lint sau bản vá | Không có lỗi ESLint | `npm.cmd run lint` pass | Pass |
| REG-BUILD-004 | Web build sau bản vá | Build production thành công | `npm.cmd run build` pass, còn warning bundle > 500 kB | Pass |
| REG-APK-002 | Build APK debug sau bản vá | Tạo APK mới | Gradle `assembleDebug` pass bằng JDK 21 + Android SDK 36 portable; APK copy ra `AureliaBooks-lite-gemini-debug.apk` lúc 2026-06-15 01:29:10 +07:00 | Pass |

Kết luận test:

- Bản APK mới đã được đóng gói lại sau khi sửa Book Info và chapter slider.
- Chưa có smoke test trực tiếp trên Tecno Pove 6 Neo trong phiên này, nên các case runtime vẫn cần bạn cài APK mới và kiểm tra thực tế.
- Nếu sách đã import trước đó có metadata bẩn, mở Book Info sẽ không còn tự đứng vì không auto-parse; bấm `Repair Info` để trích lại metadata từ EPUB và lưu lại.

## 13. Test thực chiến Android thật

Ngày test: 2026-06-15  
Giờ test: 15:24:01 +07:00  
Thiết bị: TECNO LI6  
Android: 15, SDK 35  
ADB serial: `115662546E004421`  
APK: `aurelia-books/AureliaBooks-lite-gemini-debug.apk`  
APK build time: 2026-06-15 15:19:55 +07:00  
APK size: 32,331,401 bytes  
Evidence folder: `test-artifacts/android-real/`

### 13.1. Smoke test trên máy thật

| ID | Test case | Expected | Actual | Status | Evidence |
|---|---|---|---|---|---|
| REAL-001 | ADB nhận thiết bị | Trạng thái `device` | `TECNO_LI6`, Android 15, SDK 35, trạng thái `device` | Pass | `adb devices -l` |
| REAL-002 | Cài APK mới | `adb install -r` thành công | `Performing Streamed Install` -> `Success` | Pass | command output |
| REAL-003 | Mở app | App focus vào `com.aurelia.books/.MainActivity` | Focus đúng MainActivity, không crash | Pass | `launch.png` |
| REAL-004 | Home render | Home/Continue Reading/Library stats hiển thị | Render đúng trên thiết bị thật | Pass | `launch.png` |
| REAL-005 | Mở Library | Tab Library mở được | Library hiển thị 1 book, search, filter, menu | Pass | `library.png` |
| REAL-006 | Mở Book Info | Modal mở, không đứng UI | Book Info mở được bằng menu sách | Pass | `bookinfo.png` |
| REAL-007 | Book Info synopsis bẩn sau bản 01:29 | Không lấy TOC làm văn án | Phát hiện còn lỗi: synopsis bị rút còn `Chương`, chưa hiện `Repair Info` | Fail -> Fixed | `bookinfo.png` |
| REAL-008 | Book Info sau hotfix detector | Synopsis bẩn bị ẩn, có Repair Info | Hiển thị `No clean synopsis...` và nút `Repair Info` | Pass | `bookinfo-fixed.png` |
| REAL-009 | Reader mở sách | Reader mở được từ Book Info | Reader mở TOC/intro, controls hiện | Pass | `reader-controls.png` |
| REAL-010 | Slider chapter nhận touch | Tap cuối track lên 100% | Slider lên `100%`, không bị nuốt touch | Pass | `reader-slider-tap.png` |
| REAL-011 | Logcat crash check | Không có FATAL/ANR của app | Không thấy `FATAL EXCEPTION`/`ANR` cho `com.aurelia.books` trong mẫu log | Pass | `logcat-reader.txt` |
| REAL-012 | RAM reader | Ghi nhận PSS/RSS sau khi mở reader | TOTAL PSS 217,672 KB; TOTAL RSS 395,232 KB; Graphics 84,288 KB | Pass | `meminfo-reader.txt` |

### 13.2. EPUB thực chiến cần bổ sung dữ liệu

Repo hiện chỉ có EPUB demo và 1 EPUB người dùng đã import trên thiết bị. Các testcase dưới đây đã được thêm vào test plan nhưng chưa chạy đủ vì chưa có bộ file tương ứng.

| ID | Test | Status | Ghi chú |
|---|---|---|---|
| EPUB-13 | 500 chương từ Wattpad | Not Run | Cần file test |
| EPUB-14 | 2000 chương | Not Run | Cần file test |
| EPUB-15 | Chương cực dài 10,000+ từ | Not Run | Cần file test |
| EPUB-16 | Chứa emoji | Not Run | Cần file test |
| EPUB-17 | Chứa icon unicode | Not Run | Cần file test |
| EPUB-18 | Chứa ảnh GIF | Not Run | Cần file test |
| EPUB-19 | Chứa ảnh 4K | Not Run | Cần file test |
| EPUB-20 | Có footnote | Not Run | Cần file test |
| EPUB-21 | Calibre EPUB | Not Run | Cần file test |
| EPUB-22 | Fanqie EPUB | Not Run | Cần file test |
| EPUB-23 | TruyenFull EPUB | Partial | Có 1 sách TruyenFull trên thiết bị, đã test Book Info/Reader smoke |
| EPUB-24 | WPD EPUB | Not Run | Cần file test |
| EPUB-25 | EPUB tiếng Trung | Not Run | Cần file test |
| EPUB-26 | EPUB tiếng Nhật | Not Run | Cần file test |
| EPUB-27 | EPUB tiếng Hàn | Not Run | Cần file test |

### 13.3. Reader stress / memory leak

| ID | Test | Expected | Actual | Status |
|---|---|---|---|---|
| PERF-007 | Đọc liên tục 2 giờ | Không crash, RAM không tăng đều vô hạn | Chưa chạy đủ 2 giờ | Not Run |
| PERF-008 | Chuyển 500 chương liên tục | Không đứng UI/không leak nặng | Chưa có automation/harness | Not Run |
| PERF-009 | Mở 20 sách khác nhau | Không crash, progress không lẫn | Chưa đủ 20 EPUB test | Not Run |
| PERF-010 | Import 100 EPUB | IndexedDB/storage ổn định | Chưa đủ bộ EPUB | Not Run |
| PERF-011 | Reader smoke RAM | Ghi nhận RAM sau mở reader | TOTAL PSS 217,672 KB | Pass |

### 13.4. Library lớn

| ID | Test | Expected | Actual | Status |
|---|---|---|---|---|
| LIB-STRESS-001 | 1000 sách | Library vẫn scroll/search được | Chưa có data generator/import harness | Not Run |
| LIB-STRESS-002 | 5000 sách | Không crash, virtual/scroll hợp lý | Chưa có data generator/import harness | Not Run |
| LIB-STRESS-003 | Cover cache 5000 sách | Không nổ storage/RAM | Chưa có data generator/import harness | Not Run |

### 13.5. Search

| ID | Test | Expected | Actual | Status |
|---|---|---|---|---|
| SEA-001 | Search title | Tìm được theo title | ADB input bị IME/system search overlay, chưa xác nhận trong app | Blocked |
| SEA-002 | Search author | Tìm được theo author | Chưa chạy | Not Run |
| SEA-003 | Search tiếng Việt có dấu | `Bạch Nguyệt Quang` tìm đúng | Chưa chạy | Not Run |
| SEA-004 | Search không dấu | `Bach Nguyet Quang` tìm được `Bạch Nguyệt Quang` | Chưa hỗ trợ/verify accent-insensitive rõ ràng | Not Run |
| SEA-005 | Search typo | Có tolerance typo cơ bản | Chưa có fuzzy search/harness | Not Run |

### 13.6. Kết luận thực chiến

- APK mới đã cài và chạy trên Android thật.
- Book Info ban đầu phát hiện lỗi còn sót `Chương`; đã hotfix detector, rebuild, cài lại, và xác nhận UI mới hiển thị `Repair Info`.
- Slider reader đã nhận tap/seek lên 100% trên thiết bị thật.
- Chưa đủ dữ liệu để kết luận khả năng thay Wattpad ở nhóm EPUB cực lớn, library 1000-5000 sách, search không dấu/typo, và memory leak 2 giờ.

## 14. Benchmark liên tục nhiều EPUB và thao tác lặp

Ngày test: 2026-06-15  
Giờ test: 15:35 +07:00  
Thiết bị Android: TECNO LI6, Android 15, SDK 35  
Data source: `data/*.epub`  
Evidence:

- `test-artifacts/epub-benchmark/metadata-84.json`
- `test-artifacts/android-real/bookinfo-loop.csv`
- `test-artifacts/android-real/reader-loop.csv`
- `test-artifacts/android-real/meminfo-bookinfo-loop-20.txt`
- `test-artifacts/android-real/meminfo-reader-loop-10.txt`
- `test-artifacts/android-real/logcat-loop.txt`

### 14.1. Benchmark EPUB trong thư mục Data

| Metric | Result |
|---|---|
| EPUB found | 84 |
| EPUB tested | 84 |
| Passed | 84 |
| Failed | 0 |
| Avg parse latency | 11 ms |
| P50 | 9 ms |
| P90 | 16 ms |
| P95 | 22 ms |
| Max | 31 ms |
| Max spine count | 345 |
| Max nav chapter count | 347 |

Ghi chú: benchmark này dùng parser ZIP/OPF nhẹ trong Node để kiểm tra độ sạch metadata/TOC của bộ EPUB thật. Đây chưa phải import vào IndexedDB trên Android, vì app hiện chưa có debug harness để tự import hàng loạt file từ `/sdcard` bằng ADB.

### 14.2. UI loop trên Android thật

| ID | Loop | Count | Avg | Min | Max | Status |
|---|---|---:|---:|---:|---:|---|
| LOOP-BOOKINFO-001 | Mở Library -> mở Book Info -> đóng modal | 20 | 1610 ms | 1565 ms | 1643 ms | Pass |
| LOOP-READER-001 | Mở Book Info -> Read -> Back | 10 | 4270 ms | 3669 ms | 8991 ms | Partial |

Ghi chú:

- `LOOP-BOOKINFO-001` chạy đủ 20 vòng, không thấy kẹt lệnh, không thấy crash/ANR.
- `LOOP-READER-001` chạy đủ 10 vòng nhưng có log cho thấy một số lần `BACK` đưa app ra foreground khác/Chrome, nên kết quả dùng như stress thao tác chứ chưa phải latency reader chuẩn.
- `logcat-loop.txt` không có `FATAL EXCEPTION`, `ANR`, hoặc `AndroidRuntime` liên quan app.

### 14.3. RAM sau loop

| Checkpoint | TOTAL PSS | TOTAL RSS | Java Heap | Native Heap | Graphics | Nhận xét |
|---|---:|---:|---:|---:|---:|---|
| Sau Book Info loop 20 | 227,722 KB | 410,640 KB | 12,664 KB | 28,912 KB | 101,640 KB | Graphics cao, có thể gây cảm giác lag trên WebView |
| Sau Reader loop 10 | 126,732 KB | 311,240 KB | 12,444 KB | 28,424 KB | 3,232 KB | RAM quay về thấp hơn, chưa thấy leak rõ trong loop ngắn |

### 14.4. Kết luận benchmark

- Parser EPUB nhẹ xử lý 84 file Data rất nhanh trên PC, không phát hiện file fail.
- UI Book Info chịu được 20 vòng liên tục trên máy thật, chưa crash.
- Reader loop chưa đủ sạch để kết luận latency vì thao tác BACK bằng ADB chưa ổn định.
- Cảm giác lag nhiều khả năng đến từ WebView/GPU/DOM render, không phải RAM leak rõ ràng trong test ngắn.
- Để test import 100 EPUB/1000-5000 sách đúng nghĩa, cần thêm debug harness trong app: tự import file từ bundled benchmark manifest hoặc một màn Benchmark chỉ bật ở debug build.

## 15. Phase cuối: Search không dấu, Bookmark, Backup, Library Scale

Ngày test: 2026-06-15  
Giờ test: 15:56 +07:00  
APK: `aurelia-books/AureliaBooks-lite-gemini-debug.apk`  
Thiết bị Android thật: TECNO LI6, Android 15  
Evidence:

- `test-artifacts/epub-benchmark/library-scale-500-1000-5000.json`
- `test-artifacts/android-real/settings-backup-2.png`
- `test-artifacts/android-real/settings-backup-created.png`
- `test-artifacts/android-real/logcat-backup.txt`

### 15.1. Chức năng đã thêm

| Feature | Kết quả |
|---|---|
| Search không dấu | Thêm `normalizeSearchText()` và áp dụng vào Library search |
| Bookmark | Giữ Reader bookmark hiện có, Library vẫn có filter `Has Bookmarks`; backup đã bao gồm bookmarks |
| Export Library | Thêm nút `Settings > Backup > Export library` xuất JSON |
| Import Library | Thêm nút `Settings > Backup > Import library` để merge backup JSON |
| Auto Backup | Thêm store `backups` trong IndexedDB, backup thủ công và auto backup sau thay đổi library/list |
| Multi EPUB import | File picker Library hỗ trợ chọn nhiều `.epub` một lượt |

Ghi chú backup: JSON backup chứa metadata, progress, bookmarks, lists, settings. EPUB blob không nhúng vào backup để tránh file backup rất lớn và gây đứng app; EPUB gốc cần lưu riêng.

### 15.2. Test trên Android thật

| ID | Test | Expected | Actual | Status |
|---|---|---|---|---|
| BACKUP-001 | Mở Settings > Backup | Thấy Export/Import/Create Auto Backup | UI hiển thị đúng | Pass |
| BACKUP-002 | Create auto backup | Timestamp backup cập nhật, không crash | `Last backup 15:56:17 15/6/2026` | Pass |
| BACKUP-003 | Logcat sau backup | Không FATAL/ANR | Không thấy `FATAL EXCEPTION`, `ANR`, `AndroidRuntime` trong mẫu log | Pass |
| EXPORT-001 | Export library button | Có entry point export JSON | UI hiện `Export library - JSON`; chưa tự động xác nhận file picker/download bằng ADB | Partial |
| IMPORT-001 | Import library button | Có entry point import JSON | UI hiện `Import library - Merge`; chưa chạy restore thật để tránh ghi đè data đang test | Partial |

### 15.3. Search không dấu và library scale

Benchmark dùng synthetic metadata để đo search/filter logic ở 500/1000/5000 sách.

| Size | Query | Matches | Latency | Status |
|---:|---|---:|---:|---|
| 500 | `Bạch Nguyệt Quang` | 71 | 24.244 ms | Pass |
| 500 | `Bach Nguyet Quang` | 71 | 6.943 ms | Pass |
| 500 | `Dieu Tam` | 100 | 6.422 ms | Pass |
| 1000 | `Bạch Nguyệt Quang` | 142 | See JSON | Pass |
| 1000 | `Bach Nguyet Quang` | 142 | See JSON | Pass |
| 5000 | `Bạch Nguyệt Quang` | 714 | 59.539 ms | Pass |
| 5000 | `Bach Nguyet Quang` | 714 | 50.304 ms | Pass |
| 5000 | `Dieu Tam` | 1000 | 44.641 ms | Pass |
| 5000 | `bach hop` | 1666 | 54.089 ms | Pass |
| 5000 | typo `Bach Nguyt Quang` | 0 | 49.380 ms | Expected |

Ghi chú: search không dấu đã pass. Typo/fuzzy search chưa được thêm trong phase này, nên typo trả 0 là expected.

### 15.4. EPUB data availability

| Source | Count |
|---|---:|
| Recursive `.epub` trong workspace, bỏ qua build/toolchain | 1215 |
| `.epub` trực tiếp trong `data/` | 1209 |

Ghi chú: đã quét lại sau khi dữ liệu đầy đủ xuất hiện trong `data/`; hiện đã đủ hơn 1000 EPUB thật để benchmark.

### 15.4.1. Benchmark 1209 EPUB thật

Evidence: `test-artifacts/epub-benchmark/metadata-1209.json`

| Metric | Result |
|---|---:|
| EPUB found | 1209 |
| EPUB tested | 1209 |
| Passed | 1209 |
| Failed | 0 |
| Avg parse latency | 20 ms |
| P50 | 17 ms |
| P90 | 35 ms |
| P95 | 40 ms |
| Max | 245 ms |
| TOC-like descriptions detected | 4 |
| Max spine count | 2207 |
| Max nav chapter count | 2205 |

### 15.5. Kết luận phase cuối

- Chức năng Search không dấu, Export/Import Library, Auto Backup và multi EPUB import đã được thêm.
- Auto Backup đã được xác nhận trên Android thật.
- Scale search 500/1000/5000 sách đã benchmark bằng synthetic metadata, kết quả dưới 60ms ở 5000 sách.
- Chưa test restore/import backup thật để tránh ghi đè dữ liệu đang test trên thiết bị.
- Đã benchmark metadata/TOC với 1209 EPUB thật trong `data/`.
- Chưa import 1209 EPUB thật vào IndexedDB trên Android vì app chưa có debug harness để tự import hàng loạt từ `/sdcard`; file picker Android không phù hợp để automation ADB số lượng lớn.

## 16. Performance QA P0 - Android Real Device

Ngày test: 2026-06-15  
Giờ test: 16:47-16:59 +07:00  
Thiết bị: TECNO LI6, Android 15, SDK 35  
APK: `aurelia-books/AureliaBooks-lite-gemini-debug.apk`  
Build APK: 2026-06-15 16:55:39 +07:00  

Evidence:

- `test-artifacts/performance-qa/home-after-launch.png`
- `test-artifacts/performance-qa/after-20-loop.png`
- `test-artifacts/performance-qa/after-bookinfo-cssfix-loop.png`
- `test-artifacts/performance-qa/screenrecord-60s.mp4`
- `test-artifacts/performance-qa/cdp-after-20-loop.json`
- `test-artifacts/performance-qa/cdp-after-bookinfo-cssfix-loop.json`
- `test-artifacts/performance-qa/gfxinfo-after-20-loop.txt`
- `test-artifacts/performance-qa/gfxinfo-after-bookinfo-cssfix-loop.txt`
- `test-artifacts/performance-qa/meminfo-after-bookinfo-cssfix-loop.txt`

### 16.1. P0 tối ưu đã làm

| Khu vực | Thay đổi | Kết quả |
|---|---|---|
| BookInfo modal | Không parse EPUB khi mở modal; chỉ parse khi bấm `Repair Info` | Tránh đứng khi mở review sách |
| BookInfo/modal | Chặn Android text selection toolbar, thêm `contain: layout paint`, `touch-action: pan-y` | Không còn overlay `Sao chép/Chia sẻ` khi long press |
| Cover | `loading="lazy"` + `decoding="async"` | Không ghi nhận slow bitmap upload sau loop |
| Library | Virtual render grid/list, chỉ render item gần viewport | Giảm node/layout object khi đổi màn |
| Library search/filter | Debounce search 180ms, memo filter/sort/stats | Giảm render lại khi gõ/search |
| TOC | Flatten + virtual list + memo row, search không dấu | Tránh render toàn bộ TOC dài |
| App shell | Lazy load Reader/TOC/Settings/BookInfo/Lists bằng `React.lazy` | Giảm tải ban đầu, có fallback loading |
| Auto backup | Debounce + chạy qua `requestIdleCallback`, bỏ qua reading pulse | Không backup khi đang mở đọc tiếp/progress nhẹ |

### 16.2. Chrome DevTools / WebView inspect

| Check | Result |
|---|---|
| WebView socket | `webview_devtools_remote_<pid>` available |
| Forward | `adb forward tcp:9223 localabstract:webview_devtools_remote_<pid>` |
| Target | `Aurelia Books — Premium Reading Experience`, `https://localhost/` |
| CDP observer | Inject được `PerformanceObserver` cho `longtask` và `layout-shift` |

### 16.3. Kết quả đo

| Test | Metric | Result | Nhận xét |
|---|---|---:|---|
| Cold start | Launch TotalTime | 1062-1632 ms | Chấp nhận được; cold start vẫn có jank do initial surface/WebView |
| Cold start | FCP | 776-1412 ms | Tùy phiên sau install/cold start |
| 20 vòng Home/Library/Lists/Settings | Janky frames | 46/1508 = 3.05% | Tốt hơn rõ, p90 17ms, p95 20ms |
| 20 vòng Home/Library/Lists/Settings | Long task | 0 | Không thấy JS long task sau thao tác lặp |
| 20 vòng Home/Library/Lists/Settings | CLS | 0 | Không layout shift sau thao tác lặp |
| BookInfo trước CSS fix | Janky frames | 28/170 = 16.47% | Modal là nghi phạm đúng |
| BookInfo sau CSS fix | Janky frames | 2/23 = 8.70% | Giảm khoảng một nửa |
| BookInfo sau CSS fix | p95 frame | 26 ms | Trước fix là 57ms |
| BookInfo sau CSS fix | Long task | 1 task, 54 ms | Còn một spike nhỏ khi mở modal |
| BookInfo sau CSS fix | CLS | 0.0219 | Thấp, xảy ra đầu phiên |
| BookInfo sau CSS fix | Views | 10 | Trước khi fix selection toolbar có lúc lên 278 |
| BookInfo sau CSS fix | TOTAL PSS | 219,354 KB | Ổn hơn trước BookInfo loop 255,805 KB |

### 16.4. Màn còn cần theo dõi

| Màn | Kết luận |
|---|---|
| Home | Không thấy long task trong loop, nhưng cold start vẫn có jank ban đầu |
| Library | Đã virtualize; 20 vòng tab/scroll đạt jank 3.05% |
| BookInfo | Đã giảm jank, nhưng vẫn là màn cần tối ưu tiếp nếu muốn mượt hơn |
| Reader | Chưa chạy full reader stress 2 giờ trong vòng này |
| TOC | Đã virtualize code; cần test với EPUB 2000+ chương trong WebView thật |
| Settings | Đã lazy load; không thấy crash/ANR trong loop |

### 16.5. Giới hạn của vòng test này

- Đã quay `screenrecord-60s.mp4`; chưa quay đủ 15 phút liên tục trong vòng này.
- Chưa import 1000+ EPUB thật vào IndexedDB trên Android vì cần debug harness import hàng loạt.
- Chưa đo manual “đọc liên tục 2 giờ” và “chuyển 500 chương liên tục”.
- `gfxinfo reset` trên thiết bị đôi lúc in thống kê cũ ra stdout, nên kết quả chính lấy từ file `gfxinfo-after-*.txt` và CDP JSON.

### 16.6. Kết luận Performance QA

- App không còn fail kiểu “JS đứng lâu” trong vòng 20 thao tác cơ bản: CDP ghi nhận 0 long task/0 CLS ở tab loop.
- BookInfo đúng là điểm gây khựng nhất; đã giảm jank từ 16.47% xuống 8.70% và loại bỏ Android text selection overlay.
- RAM sau BookInfo CSS fix ở mức TOTAL PSS 219MB, WebView 1 instance, không thấy dấu hiệu leak rõ trong loop ngắn.
- Việc còn lại nên tập trung vào: giảm jank cold start, test TOC 2000+ chương trong WebView thật, và tạo debug harness import 1000 EPUB vào IndexedDB để đo Library ở dữ liệu thật.
