# Báo Cáo Nghiệm Thu Thiết Bị Thật — Phase 5 (Real Device Acceptance)

## 1. Thông số thiết bị kiểm thử
- **Model**: TECNO LI6
- **Hệ điều hành**: Android 15 (API 35)
- **Build ID**: LI6-15.1.2.170SP05(OP001PF001AZ)
- **WebView Provider**: com.google.android.webview 156.0.8078.47
- **Gói kiểm thử**: `com.aurelia.books.debug` (Cách ly an toàn với `com.aurelia.books`)

---

## 2. Bảng kết quả kiểm thử chức năng & tích hợp hệ thống

| Hạng mục kiểm thử | Kịch bản thực tế | Kết quả | Trạng thái | Minh chứng |
|---|---|---|---|---|
| **Điều hướng Back cứng (Back Key)** | Nhấn phím Back phần cứng Android khi đang mở Reader | Reader đóng mượt mà, chuyển về màn hình danh sách | **PASS** | Phím BACK (KEYCODE_BACK) xử lý chuẩn xác |
| **Vòng đời Background & Resume** | Phím Home đưa app vào nền 3s, khôi phục lại | Ứng dụng khôi phục tức thì, giữ nguyên DOM và state | **PASS** | Không crash, không tải lại trang từ đầu |
| **Giao diện Tối/Sáng Hệ thống** | Chuyển đổi qua `cmd uimode night yes/no` | Giao diện tự động phản hồi theo tông màu hệ thống | **PASS** | Ảnh chụp `01-system-dark-mode.png`, `02-system-light-mode.png` |
| **Khả năng tiếp cận: Phóng to Font** | Font scale 1.3x và 2.0x trong Settings | Text co giãn hợp lý, không tràn layout, không đè vỡ nút | **PASS** | Ảnh chụp `03-font-scale-130.png`, `04-font-scale-200.png` |
| **Xoay màn hình (Rotation)** | Xoay Ngang (Landscape) & Dọc (Portrait) | Layout responsive linh hoạt, chuyển đổi mượt | **PASS** | Ảnh chụp `05-landscape.png`, `06-portrait.png` |
| **An toàn tai thỏ (Safe Area)** | Hỗ trợ `env(safe-area-inset-*)` | Header & Bottom navigation không bị che khuất | **PASS** | `CSS.supports('padding-top', 'env(...)') = true` |
| **Chế độ đọc ngoại tuyến (Offline)** | Ngắt toàn bộ kết nối mạng | Đọc sách từ IndexedDB trơn tru, không phụ thuộc mạng | **PASS** | CDP offline emulation test |
| **Tiếp nhận Share Intent** | Nhận Intent mở file `application/epub+zip` | MainActivity tiếp nhận sạch sẽ, không crash | **PASS** | `am start -a ACTION_VIEW` |

---

## 3. Danh sách ảnh chụp màn hình thực tế trên thiết bị
- `qa/phase5/device/01-system-dark-mode.png`
- `qa/phase5/device/02-system-light-mode.png`
- `qa/phase5/device/03-font-scale-130.png`
- `qa/phase5/device/04-font-scale-200.png`
- `qa/phase5/device/05-landscape.png`
- `qa/phase5/device/06-portrait.png`

---

## 4. Kết luận
Toàn bộ các kịch bản kiểm thử tích hợp trên thiết bị thật đạt **100% PASS**. Ứng dụng đạt chuẩn nghiệm thu kỹ thuật trên Android 15.
