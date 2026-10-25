# Ma Trận Kiểm Thử Trình Đọc (Reader Test Matrix Coverage)

Tài liệu theo dõi độ bao phủ kiểm thử cho trình đọc ShanBooks (`com.aurelia.books.debug`) theo quy chuẩn kiểm thử thiết bị thật kết hợp Chromium Playwright.

---

## 1. Không Gian Trạng Thái (State Matrix)

| Chiều kiểm thử | Giá trị khảo sát | Số lượng |
|---|---|---|
| **Theme đọc** | Ngà (`ivory`), Xanh rừng (`forest`), Chàm (`indigo`), Đêm (`night`), Nâu giấy (`warm-paper` / `sepia`) | 5 |
| **Chế độ đọc** | Cuộn (`continuous` / `scroll`), Phân trang (`classic` / `paginated`) | 2 |
| **Theme ứng dụng** | Light, Dark | 2 |
| **Font scale hệ thống** | 1.0x (mặc định), 1.3x (trung bình), 2.0x (tối đa trợ năng) | 3 |
| **Hướng màn hình** | Dọc (Portrait - 1080×2460), Ngang (Landscape - 2460×1080) | 2 |
| **Định dạng tài liệu** | EPUB, PDF, DOCX, TXT, PPTX | 5 |

**Tổng số tổ hợp lý thuyết**: 5 × 2 × 2 × 3 × 2 × 5 = **600 tổ hợp**.

---

## 2. Bảng Theo Dõi Kiểm Thử Chi Tiết

| Định dạng | Theme đọc | Chế độ | App Theme | Font Scale | Chiều | Trạng thái kiểm | Ghi chú / Bằng chứng |
|---|---|---|---|---|---|---|---|
| **EPUB** | Ngà | Cuộn | Light | 1.0x | Dọc | ⏳ Đang kiểm | Baseline tại `qa/reader/before/` |
| **EPUB** | Xanh rừng | Cuộn | Light | 1.0x | Dọc | ⏳ Chờ thiết bị | |
| **EPUB** | Chàm | Cuộn | Dark | 1.0x | Dọc | ⏳ Chờ thiết bị | |
| **EPUB** | Đêm | Cuộn | Dark | 1.0x | Dọc | ⏳ Chờ thiết bị | |
| **EPUB** | Nâu giấy | Cuộn | Light | 1.0x | Dọc | ⏳ Chờ thiết bị | |
| **EPUB** | Ngà | Phân trang | Light | 1.0x | Dọc | ⏳ Chờ thiết bị | Chạm mép trái/phải để lật trang |
| **EPUB** | Đêm | Phân trang | Dark | 1.0x | Dọc | ⏳ Chờ thiết bị | |
| **EPUB** | Ngà | Cuộn | Light | 1.3x | Dọc | ⏳ Chờ thiết bị | Không tràn mép hoặc che chữ |
| **EPUB** | Ngà | Cuộn | Light | 2.0x | Dọc | ⏳ Chờ thiết bị | Không tràn mép hoặc che chữ |
| **EPUB** | Ngà | Cuộn | Light | 1.0x | Ngang | ⏳ Chờ thiết bị | Tâm tiêu đề và thanh công cụ |
| **PDF** | N/A | Cuộn | Light | 1.0x | Dọc | ⏳ Chờ thiết bị | Thanh tiến độ hiện trang X/Y |
| **DOCX** | Ngà | Cuộn | Light | 1.0x | Dọc | ⏳ Chờ thiết bị | Shell chung, safe-area |
| **TXT** | Ngà | Cuộn | Light | 1.0x | Dọc | ⏳ Chờ thiết bị | Shell chung, safe-area |
| **PPTX** | N/A | Cuộn | Light | 1.0x | Dọc | ⏳ Chờ thiết bị | Cảnh báo fidelity |

---

## 3. Nhật Ký Bằng Chứng Máy Thật (Real Device Captures)

- Thiết bị đích: `TECNO LI6` (Android 15, độ phân giải 1080×2460).
- Thư mục ảnh before gốc chủ dự án: `qa/reader/before/` (4 ảnh máy thật 1080px, 8 ảnh giả lập 1073px).
- Thư mục ảnh before đầy đủ trên máy thật: `qa/reader/before-device/` (cần chụp lại toàn bộ gồm Mục lục, Cài đặt, Tìm kiếm, Dấu trang).
- Thư mục ảnh after nghiệm thu: `qa/reader/after-device/`.
