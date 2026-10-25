# Hanbooks (ShanBooks)

<p align="center">
  <strong>Trình đọc tài liệu ngoại tuyến, đa định dạng với trải nghiệm biên tập sách in, bảo vệ mắt và tôn trọng quyền riêng tư.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Capacitor-Android_8.4-119EFF?logo=capacitor" alt="Capacitor Android" />
  <img src="https://img.shields.io/badge/Adobe_Spectrum-S2-FA0F00?logo=adobe" alt="Adobe Spectrum S2" />
  <img src="https://img.shields.io/badge/Offline-IndexedDB_First-green" alt="Offline First" />
  <img src="https://img.shields.io/badge/License-MIT-purple" alt="License" />
</p>

---

## 📱 Giao diện ứng dụng

### 1. Trang chủ & Kệ sách (Home & Shelves)
Giao diện biên tập tối giản với thẻ đọc tiếp (*Continue Reading*), tiến độ trực quan, tìm kiếm nhanh và kệ sách cá nhân (*Shelves*).

| Giao diện Sáng (Light Mode) | Giao diện Tối (Dark Mode) |
| :---: | :---: |
| <img src="assets/screenshots/01-home-light.png" width="360" alt="Hanbooks Home Screen Light" /> | <img src="assets/screenshots/01-home-dark.png" width="360" alt="Hanbooks Home Screen Dark" /> |

---

### 2. Thư viện cá nhân & Không gian đọc chuyên sâu
Thư viện quản lý sách dạng lưới hoặc danh sách, hỗ trợ phân loại kệ, đổi ảnh bìa, gắn nhãn định dạng. Màn hình đọc được tối ưu viền an toàn (*Safe-area insets*), thanh tiến độ trải dài mượt mà và thanh công cụ tối giản.

| Thư viện dạng lưới | Trọng tâm đọc sách (Reading Surface) |
| :---: | :---: |
| <img src="assets/screenshots/02-library-grid.png" width="360" alt="Hanbooks Library Grid" /> | <img src="assets/screenshots/03-reader-surface.png" width="360" alt="Hanbooks Reading Surface" /> |

---

### 3. Điều khiển đọc sách & Tùy biến hiển thị
Thanh công cụ icon thanh lịch, thanh trượt tiến độ toàn chiều rộng kèm nhãn phần trăm trực quan, đánh dấu trang nhanh kèm hoàn tác (*Undo*), cùng bảng cài đặt chủ đề màu nền (Default, Paper, Dark, Sepia, Cream, Forest, Midnight), phông chữ, cỡ chữ, khoảng cách dòng và lề trang.

| Thanh điều khiển đọc sách | Bảng tùy biến hiển thị & phông chữ |
| :---: | :---: |
| <img src="assets/screenshots/04-reader-controls.png" width="360" alt="Hanbooks Reader Controls" /> | <img src="assets/screenshots/05-reader-settings.png" width="360" alt="Hanbooks Reader Settings Panel" /> |

---

## ✨ Tính năng nổi bật

- **Hỗ trợ đa định dạng tài liệu**: Đọc ngoại tuyến mượt mà các tệp `.epub`, `.pdf`, `.docx`, `.pptx`, `.cbz`, `.txt`, `.md`, `.html`.
- **Nhập tệp nén thông minh**: Tự động giải nén ZIP & RAR bằng Web Worker chạy ngầm, quét và nhập hàng loạt sách vào thư viện không giật lag.
- **Trải nghiệm đọc tinh tế (Editorial Typography)**:
  - 7 bảng màu nền bảo vệ mắt: *Default, Paper, Warm Cream, Sepia, Forest, Midnight, Dark*.
  - Tùy chỉnh linh hoạt phông chữ (Serif / Sans), kích thước chữ, khoảng cách dòng và lề trang.
  - Chế độ hiển thị phân trang lật mượt (*Paginated*) hoặc cuộn liên tục (*Continuous Scroll*).
  - Tự động làm sạch và chuẩn hóa danh mục mục lục (TOC), loại bỏ đầu mục thừa hoặc phân đoạn rỗng.
  - Tìm kiếm toàn văn bản trong sách kèm đánh dấu trích đoạn ngữ cảnh (*Snippet highlight*).
  - Đánh dấu trang (*Bookmarks*) và ghi nhớ vị trí đọc chính xác đến từng đoạn (*CFI / Locator*).
- **Kiến trúc Responsive đa thiết bị**:
  - **Điện thoại di động (< 640px)**: Thao tác một tay tiện lợi, thanh điều hướng và công cụ dưới đáy tinh gọn, tự động né tai thỏ và thanh cử chỉ (Safe-area).
  - **Máy tính bảng / Màn hình gập (640px – 1023px)**: Thanh điều hướng NavRail 72px và thanh công cụ dạng dock nổi bo góc trang nhã.
  - **Máy tính để bàn / Laptop (≥ 1024px)**: Bố cục trang đôi (Two-column book spread) với đường gân phân trang như sách in thật, độ dài dòng đọc tối ưu (`68ch`), thanh bên Sidebar 240px và ngăn kéo mục lục (Drawer) 380px.
- **Offline-First & Bảo toàn dữ liệu**:
  - Hoạt động 100% ngoại tuyến không cần internet.
  - Sách, bìa, vị trí và lịch sử đọc lưu cục bộ trong IndexedDB (`aurelia_db`).
  - Hỗ trợ xuất và nhập bản sao lưu toàn bộ thư viện dạng tệp `.zip` hoặc bản ghi dữ liệu `.json`.
- **Ứng dụng Native cho Android**:
  - Đóng gói Capacitor 8 cho Android (`com.aurelia.books`).
  - Tương thích nút Back hệ thống, cử chỉ vuốt lật trang, và tự động đồng bộ chế độ Sáng/Tối của thiết bị.
  - Đạt chuẩn tiếp cận WCAG AA (tương phản màu sắc > 4.5:1, hỗ trợ trình đọc màn hình đầy đủ).

---

## ⌨️ Phím tắt tiện ích

Khi đọc sách trên máy tính hoặc bàn phím ngoài:

| Phím tắt | Thao tác |
| :--- | :--- |
| `Mũi tên phải` / `Page Down` / `Space` | Sang trang tiếp theo |
| `Mũi tên trái` / `Page Up` / `Shift + Space` | Quay lại trang trước |
| `B` | Thêm / Xóa dấu trang (Bookmark) |
| `T` | Mở danh mục mục lục (TOC) |
| `A` / `S` | Mở bảng cài đặt hiển thị (Appearance) |
| `F` | Bật / Tắt chế độ toàn màn hình |
| `Esc` | Đóng thanh điều khiển, bảng cài đặt hoặc ngăn kéo |

---

## 🛠️ Công nghệ sử dụng

| Phân hệ | Công nghệ |
| :--- | :--- |
| **Giao diện & Logic** | React 19, JavaScript (ESM) |
| **Hệ thống thiết kế** | Adobe Spectrum S2 (`@react-spectrum/s2`), CSS Modules & CSS Tokens |
| **Build Tool** | Vite 8, LightningCSS |
| **Nền tảng di động** | Capacitor 8 (Android SDK 34 / 35, JDK 21) |
| **Bộ giải mã định dạng** | `epubjs`, `pdfjs-dist`, `mammoth`, `@web-ppt/core`, `marked` |
| **Xử lý nén & giải nén** | `fflate` (ZIP), `node-unrar-js` (RAR WebAssembly) trong Web Worker |
| **Lưu trữ dữ liệu** | IndexedDB (`aurelia_db`) & LocalStorage |
| **Kiểm thử tự động** | Vitest (Unit), Playwright (E2E & A11y), Axe-core |

---

## 🚀 Cài đặt & Khởi chạy

### Yêu cầu môi trường
- **Node.js**: v20+ hoặc v22+
- **JDK**: Java Development Kit 21 (khi biên dịch Android)
- **Android SDK**: Android Studio Jellyfish trở lên (Platform SDK 34/35)

### 1. Khởi chạy Web & Phát triển

```powershell
# Di chuyển vào thư mục ứng dụng
cd aurelia-books

# Cài đặt thư viện phụ thuộc
npm install

# Khởi chạy máy chủ phát triển
npm run dev
```

Mở trình duyệt tại địa chỉ `http://localhost:5173`.

### 2. Kiểm thử chất lượng

```powershell
# Kiểm tra cú pháp & chuẩn mã (ESLint)
npm run lint

# Kiểm tra bộ bao bọc tương thích Adobe Spectrum S2
npm run test:elements

# Kiểm tra đa ngôn ngữ & chuỗi giao diện (i18n)
npm run test:i18n

# Chạy toàn bộ 93 unit tests
npm run test:unit

# Biên dịch gói sản phẩm (Production build)
npm run build
```

### 3. Đóng gói ứng dụng Android

```powershell
# Đồng bộ mã nguồn web vào dự án Android
npm run android:sync

# Biên dịch tệp cài đặt APK (Debug)
npm run android:apk
```

Tệp APK sau khi biên dịch nằm tại:
```text
aurelia-books/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📂 Cấu trúc dự án

```text
.
|-- aurelia-books/                  # Thư mục ứng dụng chính
|   |-- android/                    # Dự án Capacitor Android Native
|   |-- src/                        # Mã nguồn giao diện & logic ứng dụng (React 19)
|   |   |-- components/             # Các màn hình (Home, Library, Lists, Reader, Settings)
|   |   |-- hooks/                  # Custom React hooks (useLibrary, useReader, useSettings)
|   |   |-- readers/                # Bộ điều hợp đọc (EPUB, PDF, DOCX, PPTX, CBZ, TXT, MD)
|   |   |-- styles/                 # Hệ thống CSS Tokens, biến chủ đề & layout
|   |   `-- utils/                  # Xử lý IndexedDB, metadata, nén và sao lưu dữ liệu
|   |-- scripts/                    # Kịch bản kiểm tra chất lượng & sinh fixtures
|   `-- tests/                      # Bộ kiểm thử Unit (Vitest) & E2E (Playwright)
|-- assets/                         # Ảnh giới thiệu & ảnh chụp màn hình
`-- README.md                       # Tài liệu tổng quan dự án
```

---

## 📄 Giấy phép

Phát hành theo giấy phép [MIT](LICENSE). Dự án được xây dựng với mục tiêu mang lại trải nghiệm đọc sách cá nhân tốt nhất, tôn trọng sự tập trung và quyền riêng tư của độc giả.
