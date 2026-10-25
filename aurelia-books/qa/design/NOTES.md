# Ghi Chú Thiết Kế & Xử Lý Thiết Bị (qa/design/NOTES.md)

## 1. Xử lý thông báo "Gỡ lỗi không dây" (Wireless Debugging Banner)
- **Vấn đề**: Khi kết nối qua ADB Wi-Fi, Android 15 hiển thị một thông báo dạng Heads-up (Intrusive) có nội dung *"Đã kết nối gỡ lỗi không dây / Bấm để tắt gỡ lỗi không dây"* nằm cố định ở đỉnh màn hình, che khuất toàn bộ thanh tiêu đề (Header/Status Bar) khi chụp ảnh màn hình.
- **Giải pháp xử lý không cần cắm cáp USB**:
  Sử dụng lệnh `cmd notification snooze` của Android để tạm ẩn (snooze) thông báo này trong 1 giờ (3600000 ms) mà không làm ngắt kết nối gỡ lỗi:
  ```bash
  adb shell "cmd notification snooze --for 3600000 '-1|android|62|null|1000'"
  ```
  Sau khi snooze, thông báo lập tức biến mất khỏi màn hình, để lộ 100% Header và Status bar sạch sẽ cho việc chụp ảnh nghiệm thu.

## 2. Thông số thiết bị kiểm thử
- Thiết bị: TECNO LI6 (Android 15, API 35)
- Độ phân giải vật lý: 1080 × 2460 px
- Mật độ hiển thị: ~2.75x (CSS viewport ~393 × 895 px)
- Con số "60" ở góc trên bên trái màn hình là bộ đếm FPS của phần cứng máy TECNO, được bỏ qua trong các đánh giá giao diện.
