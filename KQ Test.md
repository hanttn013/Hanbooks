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
