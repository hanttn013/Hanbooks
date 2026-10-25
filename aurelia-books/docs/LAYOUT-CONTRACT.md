# Hợp Đồng Bố Cục ShanBooks (Layout Contract)

Tài liệu này xác lập quy chuẩn bố cục bất biến cho toàn bộ giao diện ShanBooks (`aurelia-books`), tuân thủ chuẩn Adobe Spectrum S2 và triết lý thiết kế Editorial Library.

---

## 1. Một Lề Ngang Chuẩn (Single Horizontal Inset)
- **Token**: `--page-margin: var(--space-4, 16px)`.
- **Áp dụng**: Toàn bộ `<PageHeader>`, thanh tìm kiếm, filter chip rail, lưới sách (`libraryGrid`), kệ sách ngang (`shelfScrollWrapper`), thẻ danh sách và thẻ cài đặt phải có mép trái và mép phải căn đúng lề này.
- **Kệ cuộn ngang**:
  - `margin: 0 calc(-1 * var(--page-margin))`
  - `padding-inline: var(--page-margin)`
  - `scroll-padding-inline: var(--page-margin)`
  - Bìa sách đầu tiên căn đúng lề trái 16px, bìa sách cuối cùng có đệm lề phải 16px khi cuộn hết cỡ.
- **Lưới thư viện**: Không dùng `justify-items: center` làm lệch cột 0 so với header. Bìa sách ở cột 0 luôn thẳng lề 16px với tiêu đề header (sai lệch 0px).

---

## 2. Header Trang (`<PageHeader>`)
- **Hàng 1**:
  - Bên trái: Tiêu đề trang (`<h1>`, font Lora serif).
  - Bên phải: Khu vực hành động **sát lề phải** (cách mép màn hình đúng `var(--page-margin)`).
  - Tối đa **1 nút chính (Primary/Accent Button)** + **1 menu ActionButton (⋯)**.
  - Vùng chạm icon 44×44dp tối thiểu; glyph và khung nút phải gióng thẳng hàng dọc với mép phải của nội dung bên dưới.
- **Hàng 2**: Mô tả ngắn tùy chọn (qua `i18n`). Không giữ các dòng mô tả thừa như "Tìm cuốn sách của bạn" ở Trang chủ.

---

## 3. Căn Giữa Dọc Giữa Icon Và Nhãn (Icon & Text Baseline Alignment)
- Mọi nút bấm có icon và chữ (như "Nhập tài liệu", "Tạo danh sách", "Tiếp tục"):
  - Tâm dọc của icon và tâm dọc của chữ lệch nhau **≤ 1px**.
  - Xử lý tận gốc bằng `display: inline-flex; align-items: center; justify-content: center; line-height: 1.2; vertical-align: middle`.
  - Icon SVG có `display: block; flex-shrink: 0`.

---

## 4. Thanh Công Cụ Thư Viện (`toolsRow`)
- Chiều cao: **1 hàng duy nhất ≤ 44dp**.
- **Bên trái**: Số lượng sách hiển thị theo nội dung (`N sách`).
- **Bên phải**:
  1. Nút Sắp xếp gọn theo nội dung: icon Sort + nhãn tiêu chí hiện tại (ví dụ: `Mới mở ▾`), bấm vào mở Menu lựa chọn.
  2. Nút "Tùy chọn hiển thị" (`Display Options`): icon Sliders, bấm vào mở Tray (trên điện thoại) hoặc Popover (trên tablet/desktop) chứa:
     - Chế độ xem: Lưới / Danh sách (Grid / List).
     - Kích thước bìa sách: Nhỏ / Vừa / Lớn (Small / Medium / Large).
     - Bật chế độ Chọn nhiều (Multi-select).
- Không có Picker kéo giãn full gây tràn; không bị cắt chữ thành "C.."; không có nút icon không nhãn `≡`.

---

## 5. Vùng Chạm (Touch Targets)
- Mọi phần tử tương tác (ActionButton, Button, Chip, Picker, Checkbox, Tab):
  - Vùng chạm tối thiểu: **≥ 44×44dp** (trên điện thoại).
  - Kích thước hiển thị thị giác: ≥ 32dp (phần còn lại bù bằng padding / hitbox vô hình).

---

## 6. Cấu Trúc Thẻ Sách (`<BookCard>`)
Một cấu trúc cố định duy nhất dùng chung cho Library, Home, và List Detail:
1. **Bìa sách**: Khóa cứng tỉ lệ **2:3**.
2. **Tên sách**: Giới hạn tối đa 2 dòng, **luôn giữ chỗ đủ 2 dòng** (`min-height: calc(2 * var(--line-height-title))`) để mọi thẻ trên cùng hàng luôn có cùng chiều cao.
3. **Tác giả**: Giới hạn 1 dòng, **luôn giữ chỗ 1 dòng**.
4. **Hàng meta cố định**: Badge định dạng (EPUB/PDF) căn trái; nút menu ⋯ căn phải, **sát mép phải của bìa sách**.
5. **Dấu tiếng Việt**: `line-height` và `padding-top` đủ cho các ký tự có dấu chồng (`"Ắ Ệ Ở Ữ Ự"`), không bị cắt xén đỉnh.

---

## 7. Thẻ "Đọc Tiếp" (Continue Reading Hero Card)
- **Bìa sách**: Đúng tỉ lệ **2:3**, chiều rộng 72–80dp.
- **Padding**: Đều cả 4 phía (14–16dp).
- **Cột thông tin**: Căn đỉnh, tên sách (≤ 2 dòng), tác giả (1 dòng).
- **Hàng đáy**: ProgressBar có số % hiển thị rõ ràng (ví dụ: `42%`) và nút Primary mang nhãn **"Tiếp tục"** (không trùng với tiêu đề "Đọc tiếp" của mục).
- Toàn bộ thẻ nhận sự kiện chạm (`cursor: pointer`). Không có khoảng trống thừa lơ lửng ở giữa.

---

## 8. Hàng Danh Sách (`<ListRow>` / `<ListCard>`)
- **Hình đại diện vuông (1:1)**: Kích thước 64–72dp căn đỉnh (`align-self: flex-start`).
- **Cột chữ**: Căn đỉnh cùng thumbnail; offset tiêu đề so với mép trên card bằng nhau ở mọi hàng.
- **Ghép 2×2 bìa**: `grid-template: 1fr 1fr / 1fr 1fr`, mỗi ô vuông có `object-fit: cover; min-width: 0; min-height: 0; overflow: hidden`.
- **Ô trống**: Dùng màu tự sinh từ hash của tên danh sách; tuyệt đối **không dùng glyph ✦**; không ô nào bị cắt mép.
- **Thời gian**: Dùng `Intl.RelativeTimeFormat` theo ngôn ngữ hiện hành (không dùng chuỗi cứng "Just now/19h/6d").
- **Mô tả**: Tối đa 1 dòng (`ellipsis`).
- **Menu ⋯**: Căn phải hàng, hỗ trợ: Sửa, Đổi ảnh bìa, Xóa.

---

## 9. Thanh Điều Hướng Đáy (Bottom TabBar)
- Tab đang kích hoạt: Màu accent + pill chỉ báo rõ ràng.
- Tab không kích hoạt: Màu phụ (`text-secondary`).
- Nhãn chữ luôn luôn hiển thị trên mọi tab.
- Chiều cao vùng chạm mỗi tab: **≥ 48dp**, tích hợp an toàn `env(safe-area-inset-bottom)`.

---

## 10. Phông Chữ & Bản Quyền
- Sử dụng font WOFF2 nội bộ đi kèm dự án: **Lora** (Serif) và **Be Vietnam Pro** (Sans) theo giấy phép mã nguồn mở SIL OFL 1.1.
- Không tải Adobe Clean qua CDN ngoài; 100% hoạt động độc lập offline.
