# Báo Cáo Kiểm Chứng Hiện Trạng Áp Dụng Adobe Spectrum (docs/SPECTRUM-AUDIT.md)

**Ngày thực hiện:** 24/10/2026  
**Mục tiêu:** Quét toàn bộ repository để kiểm tra mức độ tích hợp `@react-spectrum/s2` và `react-aria-components`, thống kê chính xác số lượng thẻ HTML tương tác nguyên thủy (`<button>`, `<input>`, `<select>`, `<dialog>`), và làm rõ nguyên nhân gốc rễ vì sao các bản dựng trước đây chưa phản ánh giao diện Adobe Spectrum trên ảnh chụp thực tế.

---

## 1. Kết Quả Quét Import Thư Viện

### 1.1. `@react-spectrum/s2` (Phiên bản cài đặt: `1.8.2`)
| File | Component / Tiện ích import | Mục đích sử dụng thực tế |
|---|---|---|
| `src/App.jsx` | `Provider`, `Skeleton`, `ToastContainer`, `ToastQueue` | Bọc Provider gốc cho colorScheme/locale, hiển thị Toast và fallback loading. |
| `src/components/UI/Sheet.jsx` | `Dialog`, `DialogContainer`, `Heading`, `Content`, `Footer` | Modal sheet bọc Spectrum Dialog (chỉ dùng cho một số sheet phụ). |
| `src/components/UI/Controls.jsx` | `Button`, `ActionButton`, `Picker`, `PickerItem`, `TextField`, `SearchField`, `Slider` | File bọc điều khiển dùng chung (tuy nhiên các màn chính phần lớn không gọi). |
| `src/components/TabBar/TabBar.jsx` | `ActionButton` | Thử nghiệm điều hướng cũ, không còn là navigation chính của AppShell. |
| `src/components/Reader/EpubReaderScreen.jsx` | `ActionMenu`, `MenuItem` | Menu trong Reader. |
| `src/components/Library/LibraryScreen.jsx` | `ToastQueue` | Chỉ dùng thông báo Toast, toàn bộ UI (Search, Filter, BookCard) viết bằng HTML/CSS tự chế! |
| `src/components/Home/HomeScreen.jsx` | *(Không import)* | 0% Spectrum, 100% thẻ HTML native `<button>`, `<input>` và CSS Module. |
| `src/components/Lists/ListsScreen.jsx` | `ToastQueue` | Chỉ dùng Toast, danh sách và nút dùng thẻ HTML native. |
| `src/components/Settings/SettingsScreen.jsx` | `ToastQueue` | Chỉ dùng Toast, các nút sao lưu và đặt lại dùng thẻ `<button>` tự viết. |
| `src/components/Library/BookDetailModal.jsx` | `ToastQueue` | Chỉ dùng Toast, toàn bộ nút "Đọc", tab, và form dùng `<button>`, `<input>`, `<select>`. |

### 1.2. `react-aria-components` / `react-aria`
- `react-aria-components`: Không import trực tiếp ở màn hình ứng dụng (được quản lý dưới dạng dependency nội tại của `@react-spectrum/s2` v1.8.2).

---

## 2. Thống Kê Thẻ HTML Tương Tác Nguyên Thủy (Raw HTML Elements) Trong `src/`

Tổng số phần tử cần chuyển đổi sang component Spectrum chính thức:
- **`<button>` thô:** 61 vị trí
- **`<input>` thô:** 9 vị trí
- **`<select>` thô:** 4 vị trí
- **`<dialog>` thô:** 0 vị trí

### Bảng phân bố chi tiết theo từng file:

| Đường dẫn file | `<button>` | `<input>` | `<select>` | `<dialog>` | Ghi chú chuyển đổi Spectrum |
|---|:---:|:---:|:---:|:---:|---|
| `src/components/Common/AppShell.jsx` | 3 | 0 | 0 | 0 | Nút chuyển tab điều hướng mobile, rail, sidebar |
| `src/components/Common/BookCard.jsx` | 1 | 0 | 0 | 0 | Nút menu ActionButton "⋯" của thẻ sách |
| `src/components/Common/EmptyState.jsx` | 1 | 0 | 0 | 0 | Nút hành động trong EmptyState (chuyển sang `IllustratedMessage` + `Button`) |
| `src/components/Common/Sheet.jsx` | 1 | 0 | 0 | 0 | Nút đóng sheet (chuyển sang `CloseButton` hoặc Spectrum Dialog) |
| `src/components/Dev/DesignSystemScreen.jsx` | 4 | 0 | 0 | 0 | Trang dev lab |
| `src/components/Home/HomeScreen.jsx` | 6 | 1 | 0 | 0 | Nút "Đọc tiếp", nút "Xem tất cả", Clear search, SearchField thô |
| `src/components/Library/LibraryScreen.jsx` | 11 | 2 | 2 | 0 | Nút Import, Toggle view, 6 chip lọc, clear search, 2 input (search + file picker), 2 select sắp xếp |
| `src/components/Lists/ListsScreen.jsx` | 7 | 2 | 1 | 0 | Nút Tạo list, Thêm sách, Sửa list, Xóa list, input tên/mô tả |
| `src/components/Library/BookDetailModal.jsx` | 14 | 2 | 1 | 0 | Nút Đọc dính đáy, Back, Bookmark, Đánh giá sao, Quản lý sách, Đổi tên, Select danh sách |
| `src/components/Settings/SettingsScreen.jsx` | 8 | 1 | 0 | 0 | 4 nút sao lưu, 2 nút danger (Đặt lại, Xóa dữ liệu), nút chọn thư mục |
| `src/components/Reader/EpubReaderScreen.jsx` | 3 | 1 | 0 | 0 | Nút chrome reader, thanh trượt trang |
| `src/components/Reader/TOCModal.jsx` | 1 | 0 | 0 | 0 | Nút đóng mục lục |
| `src/components/Reader/UniversalReaderScreen.jsx` | 1 | 0 | 0 | 0 | Nút reader fallback |
| **TỔNG CỘNG** | **61** | **9** | **4** | **0** | **74 phần tử tương tác cần thay thế** |

---

## 3. Phân Tích Nguyên Nhân Gốc Rễ (Vì Sao Trước Đây Chưa Phản Ánh Spectrum)

1. **"Áp màu lên component tự viết" thay vì dùng component Spectrum:**  
   Trước đây dự án chỉ định nghĩa các CSS Variables mang tên "spectrum" hoặc "tokens" (ví dụ `--bg-primary: #f8f8f8`, `--accent: #0265dc`) rồi áp class CSS `.btn`, `.btn-primary` vào thẻ `<button>` native. Do đó không hề có các trạng thái hover/focus/active, accessibility tree, hay viền/bo góc chuẩn mực của Adobe Spectrum Design System.
2. **Các màn chính chỉ import `ToastQueue`:**  
   Trong khi `package.json` đã cài đặt `@react-spectrum/s2` v1.8.2, các lập trình viên trước đây chỉ import `ToastQueue` để bắn thông báo Toast, còn các component như `Button`, `SearchField`, `Picker`, `Tabs`, `Dialog` thì không được sử dụng ở `HomeScreen`, `LibraryScreen`, `BookDetailModal`, `SettingsScreen`.
3. **Mâu thuẫn tầng CSS (CSS Layers Conflict):**  
   File `spectrum.css` định nghĩa lại `body { background: var(--bg-primary); }` với giá trị `#f8f8f8` (màu xám lạnh phẳng) đè lên các token nền khác, tạo ra sự lệch pha màu sắc giữa các màn hình và vi phạm nguyên tắc một hệ thị giác thống nhất.
4. **Vite Locale Optimizer bị hạn chế:**  
   Trong `vite.config.js`, plugin `@react-aria/optimize-locales-plugin` bị cấu hình cứng `locales: ['en-US']`, dẫn tới các chuỗi nội địa hóa tiếng Việt của React Aria/Spectrum không thể hoạt động tối ưu nếu không bổ sung `'vi-VN'`.

---

## 4. Kế Hoạch Chuyển Đổi Thực Sự (Genuine Spectrum Migration)
- Thay toàn bộ 61 `<button>` bằng: `Button` (Primary/Secondary/Destructive) và `ActionButton` (icon, menu ⋯).
- Thay toàn bộ `<input type="search">` bằng `SearchField`.
- Thay các `<input type="text">` / `<textarea>` bằng `TextField` / `TextArea`.
- Thay các `<select>` bằng `Picker` / `PickerItem`.
- Thay các chip lọc bằng `ToggleButtonGroup` hoặc `TagGroup`.
- Thay các tab custom bằng `Tabs`, `TabList`, `Tab`, `TabPanel`.
- Dùng `AlertDialog` 2 bước cho thao tác nguy hiểm trong Settings.
