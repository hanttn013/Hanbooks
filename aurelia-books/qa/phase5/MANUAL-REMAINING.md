# Danh Sách Hạng Mục Nghiệm Thu Thủ Công & Backlog (Phase 5)

## 1. Các hạng mục cần kiểm tra thủ công thêm (Manual Checklist)
Dù toàn bộ tự động hóa trên thiết bị thật (`TECNO LI6 - Android 15`) đã đạt 100% PASS, một số trường hợp sử dụng thực tế của người dùng cuối nên được kiểm tra định kỳ trước các đợt phát hành lớn:

1. **Phím vật lý tăng giảm âm lượng để lật trang (Volume Key Paging)**:
   - Một số người dùng máy đọc sách chuyên dụng (như Onyx Boox, Meebook) sử dụng phím âm lượng để lật trang thay vì chạm màn hình. Hiện tại ứng dụng hỗ trợ chạm mép trái/phải, phím mũi tên bàn phím và vuốt cảm ứng. Cần cân nhắc thêm tùy chọn "Lật trang bằng phím âm lượng" trong Cài đặt nếu phát hành cho thiết bị e-ink.
2. **Ký số phát hành Google Play (Release Keystore & Signed AAB)**:
   - Bản build hiện tại sử dụng debug keystore tiêu chuẩn của Android SDK (`~/.android/debug.keystore`). Khi xuất bản lên Google Play Console, người vận hành cần cấu hình Release Keystore trong file `android/key.properties` (được bảo mật không commit vào git).
3. **Các bản phân phối Android tùy biến của OEM (HiOS, MIUI/HyperOS, ColorOS, OneUI)**:
   - Các hệ điều hành tùy biến thường có cơ chế tiết kiệm pin (Battery Optimization) rất gắt gao. Cần kiểm tra thông báo hướng dẫn người dùng tắt tối ưu pin nếu muốn app tự động xử lý metadata sách dung lượng lớn khi tắt màn hình.
4. **Hỗ trợ định dạng có DRM (Digital Rights Management)**:
   - Sách có mã hóa DRM độc quyền (như Adobe DRM hoặc Kindle AZW3/KFX có bản quyền) không nằm trong phạm vi của ShanBooks (ứng dụng thuần cục bộ, mã nguồn mở, hỗ trợ sách không khóa mã).

---

## 2. Trạng thái lỗi tồn đọng (`qa/BUGS.md`)
- **Blocker / Critical**: 0
- **Major**: 0
- **Minor / Enhancement**: 0
Toàn bộ các lỗi phát hiện trong các đợt audit trước (rò rỉ EPUB blob, tiêu điểm dialog, safe area, cảnh báo chunk >500kB) đều đã được khắc phục triệt để.
