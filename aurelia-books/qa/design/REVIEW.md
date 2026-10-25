# ĐÁNH GIÁ THỊ GIÁC & TỰ PHÊ BÌNH THIẾT KẾ (DESIGN REVIEW)

Tài liệu ghi nhận kết quả tự phê bình thiết kế theo từng màn, đối chiếu với `docs/DESIGN-AUDIT.md` và `docs/DESIGN.md`.

---

## 1. Màn Thư Viện (LibraryScreen)

| Tiêu chí | Trước cải tạo (Baseline) | Đã sửa (Redesign Editorial) | Trạng thái |
|---|---|---|---|
| **Bìa sách là nhân vật chính** | Mỗi card bị choán 40% diện tích bởi nút xám "Thông tin", bìa bị dẹp lép | Bìa là Hero hiển thị trọn vẹn tỉ lệ 2:3, đổ bóng sách nổi khối (`--shadow-cover`), dải ruy-băng định dạng EPUB/PDF/DOCX ở góc, nút info chuyển thành 3-dots gọn gàng góc trên bìa. | Đạt |
| **Phân cấp thị giác & Typography** | Chữ thô, font hệ thống khô khan, chữ "Thư viện" quá đậm và chèn ép search bar | Tiêu đề Lora Serif trang nhã, supertitle "ShanBooks" thanh mảnh, tên sách Lora tối đa 2 dòng, tên tác giả Be Vietnam Pro màu thứ cấp. | Đạt |
| **Hệ thống màu & Tương phản AA** | Nền xám lạnh mặc định, độ tương phản trong Dark mode bị lệch màu xanh rêu (`#163B37`) | Áp dụng Warm Paper (`#FAF7F2`) cho Light Mode và Deep Ink (`#141312`) cho Dark Mode, màu nhấn Terracotta (`#C05621` / `#E07A44`), tương phản chữ đạt chuẩn WCAG AA (>= 4.5:1). | Đạt |
| **Đáp ứng Breakpoint (Responsive)** | Trapped bên trong khung giả lập điện thoại 393px giữa màn hình đen xì trên desktop và tablet | Hoàn toàn responsive: 2 cột ở màn thoại nhỏ (≤400px), 3 cột (400–600px), 4 cột trên Navigation Rail (600–840px), 5–6 cột trên tablet (840–1200px), auto-fill (≥1200px) có giới hạn max-width 1200px. | Đạt |
| **Thao tác & Vùng chạm** | Nút bấm chật chội, thanh lọc cuộn khó chạm | Filter chip dạng viên thuốc với nền tinh tế, touch target ≥ 44px, nút "Nhập tài liệu" nổi bật dễ bấm, thanh chọn sách (multi-select) nổi phía dưới. | Đạt |

---

## 2. Màn Trang Chủ (HomeScreen)

| Tiêu chí | Trước cải tạo (Baseline) | Đã sửa (Redesign Editorial) | Trạng thái |
|---|---|---|---|
| **Hero Card "Tiếp tục đọc"** | Khung xám nhợt nhạt, bìa sách thu nhỏ, nút bấm chen chúc | Hero Card sang trọng với nền surface ấm, bìa sách Hero tỉ lệ 2:3 với bóng đổ chân thực, badge "ĐANG ĐỌC" màu terracotta, thanh tiến độ mảnh thanh lịch, nút "Đọc ngay" dạng pill nổi bật. | Đạt |
| **Kệ sách & Đang đọc gần đây** | Danh sách sách bị ép vào khung hẹp, mỗi card có nút info to tướng | Dàn kệ sách thoáng đạt với `<BookCard>`, tên sách Lora tinh tế, khoảng thở rộng rãi giữa các section. | Đạt |
| **Phản hồi Desktop & Tablet** | Desktop bị bóp trong phone frame 393px | Desktop hiển thị Sidebar bên trái cố định (240px), nội dung chính dàn ngang với hero card chia 2 cột (bìa trái, thông tin phải), kệ sách tự co giãn theo container query. | Đạt |
| **Touch target & Accessibility** | Nút chuyển tab và info dễ bấm nhầm | TabBar/Rail/Sidebar phân tách rõ ràng, các nút hành động đạt kích thước tối thiểu 44×44px, hỗ trợ điều hướng bàn phím đầy đủ (`tabIndex={0}`, `Enter`/`Space`). | Đạt |

---

## 3. Styleguide Sống (`/#/dev/design`)

Trang nội bộ phục vụ kiểm tra toàn bộ token thị giác:
- **Bảng màu Tokens:** `--bg-base`, `--bg-surface`, `--bg-surface-raised`, `--accent`, `--text-primary`, `--text-secondary`.
- **Typography & Kiểm thử tiếng Việt:** Lora và Be Vietnam Pro với chuỗi kiểm tra dấu: `"Ắ Ằ Ẳ Ẵ Ặ Ế Ề Ể Ễ Ệ Ớ Ờ Ở Ỡ Ợ Ứ Ừ Ử Ữ Ự"`.
- **Bìa sách `<Cover>` 4 trạng thái:** Hình ảnh gốc, thư mục nguồn, ghép 2×2, và bìa tự sinh gradient terracotta/forest/gold.
- **Component dùng chung:** `<BookCard>`, `<ListCard>`, `<EmptyState>`, `<Skeleton>`, `<Sheet>`.
- Tự động loại khỏi bản build production để tối ưu bundle.
