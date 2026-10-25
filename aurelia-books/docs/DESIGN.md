# Thiết Kế Hệ Thống Thị Giác ShanBooks (Editorial Design System)

**Tác giả**: Product Designer & Frontend Engineer  
**Phiên bản**: 2.0 (Editorial Redesign)  
**Tôn chỉ**: "Thư viện biên tập tĩnh lặng — Bìa sách là nhân vật chính"  

---

## 1. Hướng Thị Giác (Design Philosophy & Identity)

Khác với các ứng dụng công nghệ phổ thông lạm dụng màu xanh công nghiệp và nền xám lạnh, ShanBooks được thiết kế như một **thư viện sách tuyển chọn (editorial private library)**:
- **Tĩnh lặng & Khiêm nhường (Quiet Chrome)**: Giao diện ứng dụng đóng vai trò là giá sách và phông nền mộc mạc, không trang trí rườm rà, để màu sắc và linh hồn của các bìa sách tự do tỏa sáng.
- **Ấm áp & Chân thực (Warm Tactility)**: Sử dụng các sắc độ kem ấm của giấy in cao cấp (`#FAF7F2` trong Light mode) và màu than ấm sâu của mực in truyền thống (`#161514` trong Dark mode).
- **Một màu nhấn duy nhất (Single Intentional Accent)**: Sắc **Hổ phách đất nung (Amber Terracotta - `#C05621` / `#E07A44`)** gợi nhớ gáy sách da cổ điển và ánh đèn bàn đọc sách ban đêm. Màu nhấn chỉ dùng cho hành động chính duy nhất và các chỉ báo quan trọng.
- **Typography văn hóa Việt**: Cặp font kinh điển **Lora** (Serif thanh lịch cho tiêu đề) và **Be Vietnam Pro** (Sans-serif nhân văn hiện đại được thiết kế chuyên biệt cho hệ dấu tiếng Việt, đảm bảo dấu câu như `Ắ, Ằ, Ẵ, Ặ, Ế, Ề, Ễ, Ệ, Ớ, Ờ, Ở, Ỡ, Ợ, Ứ, Ừ, Ử, Ữ, Ự` không bao giờ bị đè vỡ hay nhảy dòng).

---

## 2. Hệ Thống Design Tokens (Tokens Specification)

### 2.1. Thang Màu Sắc (Color Palette)

| Token | Light Mode (Warm Paper) | Dark Mode (Deep Ink) | Mục đích sử dụng |
|---|---|---|---|
| `--bg-base` | `#FAF7F2` (Kem ấm ngà) | `#141312` (Đen than tuyền) | Màu nền toàn ứng dụng |
| `--bg-surface` | `#FFFFFF` (Trắng tinh) | `#1E1D1B` (Than ấm cấp 1) | Thẻ card, thanh tab, modal sheet |
| `--bg-surface-raised` | `#F4EFEA` (Giấy ngà xén) | `#282624` (Than ấm cấp 2) | Nút bấm phụ, ô tìm kiếm, chip |
| `--text-primary` | `#201E1B` (Mực than đậm 95%) | `#F5F2EB` (Trắng ngà 95%) | Tiêu đề, tên sách, văn bản chính |
| `--text-secondary` | `#6E6962` (Xám chì ấm 65%) | `#A8A39A` (Xám ngà ấm 70%) | Tên tác giả, tiến độ, thời gian |
| `--text-muted` | `#99938A` (Xám tiêu bản 45%) | `#6E6A62` (Xám tiêu bản 40%) | Placeholder, định dạng, icon phụ |
| `--accent` | `#C05621` (Hổ phách đất nung) | `#E07A44` (Hổ phách phát sáng) | Nút hành động chính (CTA), điểm nhấn |
| `--accent-hover` | `#A84515` | `#F08F5B` | Hover & active state |
| `--accent-subtle` | `rgba(192, 86, 33, 0.10)` | `rgba(224, 122, 68, 0.16)` | Nền badge, tab active |
| `--border-subtle` | `rgba(32, 30, 27, 0.08)` | `rgba(245, 242, 235, 0.10)` | Đường phân cách, viền card |
| `--border-focus` | `#C05621` | `#E07A44` | Focus ring chuẩn a11y (2px solid) |
| `--cover-border` | `rgba(0, 0, 0, 0.06)` | `rgba(255, 255, 255, 0.12)` | Viền mảnh bảo vệ bìa sách không chìm |

### 2.2. Thang Khoảng Cách (Spacing Scale - Bội số 4/8px)
- `space-1`: `4px`
- `space-2`: `8px`
- `space-3`: `12px`
- `space-4`: `16px`
- `space-6`: `24px`
- `space-8`: `32px`
- `space-12`: `48px`

### 2.3. Thang Typography (Type Scale)

| Token | Size / Line-height | Font Family | Weight | Ứng dụng |
|---|---|---|---|---|
| `font-display` | `28px / 36px` | Lora, serif | 600 (SemiBold) | Tiêu đề lớn Trang chủ, Thư viện |
| `font-headline` | `20px / 28px` | Lora, serif | 600 (SemiBold) | Tiêu đề mục ("Đang đọc", "Mới thêm") |
| `font-title` | `16px / 22px` | Lora, serif | 600 (SemiBold) | Tên sách trên thẻ sách |
| `font-body` | `15px / 22px` | Be Vietnam Pro, sans-serif | 400 (Regular) | Mô tả sách, cài đặt, nội dung đọc |
| `font-label` | `13px / 18px` | Be Vietnam Pro, sans-serif | 500 (Medium) | Tên tác giả, nút bấm, tab bar |
| `font-caption` | `12px / 16px` | Be Vietnam Pro, sans-serif | 500 (Medium) | Tiến độ %, định dạng EPUB/PDF, badge |

### 2.4. Đổ Bóng & Bán Kính Bo Góc (Elevation & Radius)
- **Radius**:
  - `radius-sm`: `6px` (Bìa sách, badge, chip nhỏ)
  - `radius-md`: `10px` (Nút bấm, ô input, dropdown)
  - `radius-lg`: `16px` (Thẻ card lớn, sheet dialog)
  - `radius-full`: `9999px` (Pills, filter chips, avatar)
- **Shadows (Đổ bóng 3 tầng vật lý)**:
  - `shadow-sm`: `0 1px 3px rgba(32, 30, 27, 0.05), 0 1px 2px rgba(32, 30, 27, 0.04)`
  - `shadow-cover`: `0 4px 12px rgba(32, 30, 27, 0.12), 0 1px 3px rgba(32, 30, 27, 0.08)` (Tạo độ gáy và độ nổi sách thật)
  - `shadow-raised`: `0 10px 25px -5px rgba(32, 30, 27, 0.10), 0 8px 10px -6px rgba(32, 30, 27, 0.05)`
  - `shadow-modal`: `0 20px 40px rgba(0, 0, 0, 0.24)`

---

## 3. Quy Tắc Xử Lý Bìa Sách (`<Cover>`)

Bìa sách phải được đối xử đồng bộ và trang trọng:
1. **Tỉ lệ cố định (Aspect Ratio)**: Luôn giữ tỉ lệ chuẩn `2 : 3` (tương ứng chiều rộng : chiều cao). Không bao giờ méo ảnh (`object-fit: cover`).
2. **Bo góc tinh tế**: `border-radius: 6px`, không bo quá tròn làm biến dạng bìa sách.
3. **Hiệu ứng gáy sách (Spine subtle highlight)**: Một dải bóng gradient trong suốt 3px ở mép trái tạo cảm giác độ cong của gáy sách thật.
4. **Bảo vệ nền tối**: Trong Dark mode, luôn có viền `1px solid rgba(255, 255, 255, 0.12)` để các cuốn sách bìa đen không bị hòa tan vào nền ứng dụng.
5. **4 Trạng thái của `<Cover>`**:
   - `Image Cover`: Ảnh bìa người dùng hoặc trích xuất từ metadata EPUB/PDF/CBZ.
   - `Source Folder Cover`: Bìa ảnh đi kèm thư mục gốc.
   - `Composite 2x2 Cover`: Dành cho Danh Sách (Lists), ghép 4 bìa nhỏ của các cuốn sách bên trong.
   - `Generated Cover (Bìa tự sinh)`: Khi không có ảnh, sinh bìa theo bảng màu gradient ấm áp từ token (kèm tên sách in hoa kiểu chữ Lora và tác giả căn giữa chuẩn chỉnh).

---

## 4. Kiến Trúc Khung Responsive (AppShell Breakpoints)

| Breakpoint | Chiều rộng | Thanh điều hướng | Lưới Thư viện | Cơ chế Chi tiết & Trình đọc |
|---|---|---|---|---|
| **Compact** | ≤ 400px | Bottom TabBar (có icon + text gọn, không cắt chữ) | 2 cột (hoặc 3 cột nhỏ) | Bottom Sheet |
| **Mobile Standard** | 400px – 600px | Bottom TabBar (padding an toàn đáy) | 3 cột | Bottom Sheet |
| **Tablet Portrait / Foldable** | 600px – 840px | Navigation Rail (bên trái, icon + text) | 4 cột | Right Panel Sheet |
| **Tablet Landscape** | 840px – 1200px | Navigation Rail hoặc Sidebar | 5–6 cột | Master-Detail (Detail cố định bên phải) |
| **Desktop Wide** | ≥ 1200px | Full Sidebar thanh lịch (tối đa 240px) | 6–10 cột (`auto-fill`) | Master-Detail, max-width nội dung `1280px` |
| **Landscape Phone** | Chiều cao < 480px | Navigation Rail siêu mỏng, ẩn header thừa | Tối đa cột | Reader chiếm 100% toàn màn hình |

---

## 5. Quy Chuẩn Trình Đọc (Reader Experience)
- **Độ rộng dòng đọc tối đa**: `680px` (khoảng 65–75 ký tự mỗi dòng), căn giữa trang, tạo khoảng lề hai bên rộng rãi, không kéo chữ ra viền màn hình lớn.
- **Chrome điều khiển**: Tự động ẩn khi đọc, chạm 1 lần vào giữa màn hình để hiển thị/ẩn mượt mà.
- **Thanh tiến độ**: Mảnh mai (`4px`), có tay nắm kéo vuốt mượt mà, hiển thị % và số trang hiện tại.
- **Panel phụ (TOC, Search, Bookmarks, Settings)**:
  - Mobile: Trượt lên dưới dạng **Bottom Sheet** có thể vuốt xuống để đóng.
  - Tablet/Desktop: Trượt vào từ cạnh phải dưới dạng **Side Panel**, không che khuất trang đang đọc.
