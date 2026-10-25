# Báo Cáo Kiểm Toán Thị Giác & Trải Nghiệm (Design Audit Baseline)

**Dự án**: ShanBooks (`aurelia-books`)  
**Ngày thực hiện**: 24/10/2026  
**Thư mục lưu ảnh bằng chứng**: `qa/design/before/` (Bao gồm 74 ảnh chụp ở 6 breakpoint × Light/Dark)  
**Người thực hiện**: Product Designer & Frontend Engineer  

---

## 1. Tổng Quan Nhận Định Chuyên Môn (Executive Summary)
Giao diện hiện tại của ShanBooks đang gặp vấn đề lớn về cả **tính thẩm mỹ**, **phân cấp thị giác (visual hierarchy)** lẫn **khả năng thích ứng đa màn hình (responsive breakpoints)**:
1. **Thiếu bản sắc thị giác của ứng dụng đọc sách (Lack of Editorial Soul)**: Nền xám lạnh (`#f8f9fa`) phối hợp cùng màu nhấn xanh dương điện tử (`#3b82f6`) mang cảm giác một trang quản trị admin/bootstrap hơn là một không gian thư viện yên tĩnh, ấm cúng và tôn vinh bìa sách.
2. **Bìa sách bị chèn ép thay vì là nhân vật chính**: Các card sách trong Thư viện bị bọc bởi khung bo viền xám thô kệch, kèm theo nút bấm "Thông tin" xám to đùng ở cuối mỗi card gây nhiễu loạn thị giác. Bìa sách bị co nhỏ, thiếu bóng đổ chiều sâu (elevation) và không có đường viền phân tách tinh tế trong Dark mode.
3. **Phá vỡ bố cục trên màn hình nhỏ & màn hình ngang**:
   - Ở điện thoại hẹp (360px): Nhãn thanh điều hướng dưới đáy bị cắt ngắn thành `Danh sá...`, hàng filter chip co rút thành các chấm tròn 2 chữ `T..`, `Đ..`, `C..` trông như lỗi font.
   - Ở điện thoại xoay ngang (800×360): Tiêu đề khổng lồ chiếm 40% chiều cao và TabBar chiếm 25%, nội dung sách bị ép lại chỉ còn ~100px ở giữa và bị che khuất hoàn toàn.
4. **Lãng phí không gian trên Tablet và Desktop (Unresponsive Layout)**:
   - Trên màn hình 1440px và 1024px, lưới thư viện bị cố định cứng 3 cột ở góc trái thay vì mở rộng 5–8 cột `auto-fill`. Hơn 60% diện tích màn hình là khoảng trắng chết.
   - Thẻ "Đang đọc" (Continue reading) trên Desktop kéo dài thành một dải trắng 1200px trống hoác, bìa sách dạt về mép trái.

---

## 2. Bảng Phân Tích Chi Tiết Từng Màn Hình

### Màn Hình 1: Trang Chủ (Home Screen)
- **Ảnh kiểm chứng**: `360x800-01-home-*`, `1440x900-01-home-*`, `800x360-01-home-*`
- **Các vấn đề cụ thể**:
  1. *Phân cấp thị giác*: Chữ "SHANBOOKS" bé xíu nằm trên tiêu đề "Trang chủ" quá đậm và căn giữa tùy tiện. Khi lên desktop có sidebar mang tên "ShanBooks" thì xảy ra hiện tượng trùng lặp thương hiệu 2 lần.
  2. *Thẻ Sách Đang Đọc (Featured/Continue Reading)*:
     - Trên Mobile: 2 nút "Đọc ngay" (xanh chói) và "Thông tin" (xám đục) xếp chồng dọc chiếm diện tích lớn, thanh tiến độ đọc mỏng manh khó nhìn.
     - Trên Desktop (1440px): Khung thẻ kéo giãn vô tận ra toàn màn hình, tạo khoảng trống chết khổng lồ bên phải.
  3. *Mục "Đang đọc gần đây"*:
     - Cuộn ngang thiếu chỉ báo cuộn (scroll indicator), thẻ sách ở Mobile bị thanh TabBar đáy đè che khuất tên sách và chân bìa sách (thiếu `padding-bottom` bù trừ safe-area và TabBar).
  4. *Nút "Xem tất cả"*: Căn lề dọc lệch so với tiêu đề section "Đang đọc gần đây".
- **Mức độ ưu tiên**: **P0 (Critical)**

---

### Màn Hình 2: Thư Viện (Library Grid & List View)
- **Ảnh kiểm chứng**: `360x800-02-library-grid-*`, `360x800-03-library-list-*`, `1440x900-02-library-grid-*`
- **Các vấn đề cụ thể**:
  1. *Thanh lọc (Filter Chips)*:
     - Trên 360px: Thu nhỏ thành các hình tròn 30px cụt ngủn (`T..`, `Đ..`, `C..`, `Y..`), mất hoàn toàn khả năng đọc.
  2. *Bộ chọn sắp xếp (Sort Controls)*:
     - Chữ "Sắp xếp sách" đặt lẻ loi phía trên dropdown. Trên desktop, dropdown bị ném dạt ra mép cực phải màn hình cách xa ô tìm kiếm hơn 600px, đứt gãy luồng mắt người dùng.
  3. *Lưới sách (Book Cards)*:
     - Thừa nút "Thông tin" ở mọi card: Người dùng app đọc sách muốn chạm vào bìa là mở sách hoặc mở thông tin, không ai muốn một card sách bị chia nửa diện tích bởi một nút xám nặng nề.
     - Lỗi typography: Tên sách hiển thị lộn xộn, text "Hoàn tất EPUB - Đã đọc 0%" quá nhỏ, font không chân mặc định thô.
     - Cố định cột: Không thích ứng container query; desktop chỉ hiện 3 cột, để trống 700px bên phải.
  4. *Giao diện Danh sách (List view)*:
     - Khoảng cách giữa các hàng không đều, thiếu thumbnail bìa chất lượng, thông tin tác giả và tiến độ dính sát nhau.
- **Mức độ ưu tiên**: **P0 (Critical)**

---

### Màn Hình 3: Chi Tiết Sách (Book Detail Sheet / Modal)
- **Ảnh kiểm chứng**: `360x800-04-book-detail-*`, `1440x900-04-book-detail-*`
- **Các vấn đề cụ thể**:
  1. *Cấu trúc hiển thị*: Hiện tại hiển thị dưới dạng một Dialog ở giữa màn hình trên mọi kích thước. Trên điện thoại nhỏ, dialog làm che khuất hoàn toàn ngữ cảnh bên dưới thay vì dạng Bottom Sheet tự nhiên kéo vuốt được.
  2. *Pointer Intercept Bug*: Backdrop của React Spectrum S2 Modal giữ pointer-events sau khi thao tác, làm treo thao tác click thanh điều hướng đáy.
  3. *Phân bổ thông tin*: Bìa sách, mô tả, nút "Đọc", nút "Yêu thích", thẻ định dạng và tiến độ xếp lộn xộn, thiếu nhịp điệu typography.
- **Mức độ ưu tiên**: **P1 (High)**

---

### Màn Hình 4: Danh Sách Đọc (Lists Overview & List Detail)
- **Ảnh kiểm chứng**: `360x800-05-lists-*`, `360x800-09-lists-*`
- **Các vấn đề cụ thể**:
  1. *Card danh sách*: Dùng một hình chữ nhật bo góc đơn điệu với màu nền mờ nhạt, không hiển thị được preview bìa các sách nằm trong danh sách đó.
  2. *Trạng thái rỗng (Empty State)*: Khi danh sách chưa có sách, giao diện hiển thị một dòng text cộc lốc, không có minh họa tinh tế, không có nút call-to-action "Thêm sách vào danh sách" rõ ràng.
- **Mức độ ưu tiên**: **P1 (High)**

---

### Màn Hình 5: Trình Đọc Sách (Reader Chrome & Panels)
- **Ảnh kiểm chứng**: `360x800-05-reader-chrome-*`, `1440x900-05-reader-chrome-*`
- **Các vấn đề cụ thể**:
  1. *Chrome điều khiển*:
     - Thanh trên và thanh dưới quá dày, che mất nhiều dòng chữ khi đang đọc.
     - Trên màn hình rộng (Desktop / Tablet ngang), cột chữ bị kéo giãn ra toàn bộ chiều ngang màn hình (> 140 ký tự/dòng), khiến mắt người đọc mỏi và dễ mất dòng (chuẩn vàng: 60–75 ký tự/dòng).
  2. *Các panel phụ trợ (TOC, Search, Bookmarks, Settings)*:
     - Hiện tại mở dialog che giữa trang sách thay vì trượt vào từ cạnh bên (Side Panel trên Desktop) hoặc Bottom Sheet vuốt được (trên Mobile).
- **Mức độ ưu tiên**: **P1 (High)**

---

### Màn Hình 6: Cài Đặt (Settings Screen)
- **Ảnh kiểm chứng**: `360x800-10-settings-*`, `1440x900-10-settings-*`
- **Các vấn đề cụ thể**:
  1. *Nhóm cài đặt*: Các mục Ngôn ngữ, Giao diện, Lưu trữ, Sao lưu/Khôi phục bị dàn trải thành danh sách dài không phân nhóm thẻ rõ rệt.
  2. *Tùy chọn giao diện*: Thiếu trực quan hóa bảng màu (chỉ có chữ dropdown thay vì các ô swatch màu trực quan).
- **Mức độ ưu tiên**: **P2 (Medium)**

---

### Màn Hình 7: Thanh Điều Hướng Ứng Dụng (Navigation Shell)
- **Ảnh kiểm chứng**: Toàn bộ các ảnh chụp
- **Các vấn đề cụ thể**:
  1. *Mobile TabBar*:
     - Thiếu icon đồng bộ cho cả 4 tab, text bị cắt `Danh sá...` ở 360px.
     - Không có padding an toàn cho phím điều hướng cử chỉ của Android/iOS (`env(safe-area-inset-bottom)`).
  2. *Desktop Navigation*:
     - Thay vì Navigation Rail (gọn gàng, hiện đại) hoặc Sidebar tinh tế, hiện tại chỉ là một danh sách link thô sơ bên trái không ăn nhập với phần nội dung chính.
- **Mức độ ưu tiên**: **P0 (Critical)**

---

## 3. Bảng Xếp Hạng Ưu Tiên Xử Lý

| Hạng mục | Màn hình liên quan | Hành động thiết kế lại | Ưu tiên |
|---|---|---|---|
| **Editorial Design System** | Toàn bộ ứng dụng | Xây dựng bảng token màu kem ấm (`#FAF7F2`), màu than (`#1A1917`), 1 màu nhấn hổ phách đất (`#C05621` / Amber Terrakotta), thang font serif/sans chuẩn tiếng Việt, spacing 4/8px. | **P0** |
| **Responsive AppShell** | TabBar & Sidebar | Bottom tabs (có icon + label ngắn gọn, không cắt chữ), Navigation Rail trên Tablet/Desktop, ẩn chrome trên điện thoại landscape. | **P0** |
| **Library Redesign** | Thư viện (Grid/List) | Lưới sách responsive container queries (2-3 cột mobile, 4-6 tablet, 6-10 desktop). Bìa nổi bật với bóng đổ thực, bỏ nút "Thông tin" thô, filter chip cuộn ngang mượt mà. | **P0** |
| **Home Redesign** | Trang chủ | Hero card ấm cúng, thẻ sách "Đang đọc" thanh lịch, tiến độ đọc tinh tế, grid sách gần đây thoáng đãng. | **P0** |
| **Book Detail Redesign** | Modal chi tiết sách | Bottom sheet kéo mở trên mobile, Right Side-panel (Master-Detail) trên Desktop/Tablet. | **P1** |
| **Reader Chrome Redesign**| Bộ đọc đa định dạng | Giới hạn chiều rộng đọc 680px căn giữa, thanh tiến độ mảnh, TOC/Search/Settings chuyển thành Sheet/Side-panel. | **P1** |
| **Lists & Settings** | Danh sách & Cài đặt | Card danh sách dạng stack bìa 2×2, cài đặt phân nhóm group cards trực quan. | **P2** |

Báo cáo này là cơ sở trực tiếp để triển khai **Giai đoạn 1 (Design System & Style Guide)** và **Giai đoạn 2 (Thiết kế lại từng màn hình)**.
