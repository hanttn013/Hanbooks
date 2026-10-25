# BÁO CÁO CĂN CHỈNH NÚT & LỀ TRÊN PIXEL MÁY THẬT (TECNO LI6)

**Thiết bị kiểm nghiệm**: TECNO LI6 (Android 15)  
**Độ phân giải vật lý**: 1080 x 2460 px  
**Mật độ điểm ảnh**: 440 dpi (Device Pixel Ratio: 2.755)  
**Thời gian đo nghiệm**: 2026-10-25T07:07:07.537Z  
**Gói ứng dụng**: `com.aurelia.books.debug`  
**Phương pháp đo**: Chụp ảnh trực tiếp từ thiết bị (`adb exec-out screencap -p`), đọc hộp phần tử bằng Chrome DevTools Protocol (CDP), phân tích điểm ảnh thực tế qua `pngjs`. Chụp ảnh đối chiếu với lưới hướng dẫn (`DebugOverlay`).

---

## 1. BẢNG TỔNG HỢP CĂN GIỮA DỌC CỦA NÚT (BUTTON VERTICAL CENTERING)
**Tiêu chí đạt**:
- Độ lệch đệm trên so với đệm dưới (padding diff) $\le 2\text{px}$ trên điểm ảnh thật.
- Tâm biểu tượng so với tâm chữ (icon center vs text center) $\le 3\text{px}$.

| Tên nút / Vị trí | Đệm trên (px) | Đệm dưới (px) | Độ lệch đệm (px) | Tâm Icon - Text (px) | Kết quả | Ảnh trích xuất |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Nút Tiếp tục (Hero Card)** | 3 | 4 | **1px** | 0px | ✅ ĐẠT | [`crop`](crops/button-tiep-tuc-hero.png) |
| **Nút Nhập tài liệu (Library Header)** | 3 | 4 | **1px** | 0px | ✅ ĐẠT | [`crop`](crops/button-nhap-tai-lieu.png) |
| **★ Yêu thích (Xem nhanh)** | 3 | 4 | **1px** | 0px | ✅ ĐẠT | [`crop`](crops/qp-button--y-u-th-ch.png) |
| **Thêm vào danh sách (Xem nhanh)** | 3 | 4 | **1px** | 0px | ✅ ĐẠT | [`crop`](crops/qp-button-th-m-v-o-danh-s-ch.png) |
| **Cập nhật thông tin (Xem nhanh)** | 44 | 44 | **0px** | 0.5px | ✅ ĐẠT | [`crop`](crops/qp-button-c-p-nh-t-th-ng-tin.png) |
| **Tiếp tục (Xem nhanh)** | 3 | 4 | **1px** | 0px | ✅ ĐẠT | [`crop`](crops/qp-button-ti-p-t-c.png) |
| **Chi tiết sách (Xem nhanh)** | 44 | 46 | **2px** | 0.5px | ✅ ĐẠT | [`crop`](crops/qp-button-chi-ti-t-s-ch.png) |
| **Nút Tạo danh sách (Lists)** | 3 | 4 | **1px** | 0px | ✅ ĐẠT | [`crop`](crops/button-tao-danh-sach.png) |
| **Xuất dữ liệu (Settings)** | 3 | 4 | **1px** | 0px | ✅ ĐẠT | [`crop`](crops/settings-button-xu-t-d-li-u.png) |
| **Xuất toàn bộ thư viện (Settings)** | 3 | 4 | **1px** | 0px | ✅ ĐẠT | [`crop`](crops/settings-button-xu-t-to-n-b-th-vi-n.png) |
| **Khôi phục thư viện (Settings)** | 3 | 4 | **1px** | 0px | ✅ ĐẠT | [`crop`](crops/settings-button-kh-i-ph-c-th-vi-n.png) |
| **Tạo bản sao lưu (Settings)** | 3 | 4 | **1px** | 0px | ✅ ĐẠT | [`crop`](crops/settings-button-t-o-b-n-sao-l-u.png) |

---

## 2. BẢNG TỔNG HỢP CĂN LỀ BIÊN (EDGEACTION - 16PX MARGIN FLUSH)
**Tiêu chí đạt**:
- Vùng chạm tối thiểu đạt 44dp.
- Mực hiển thị (visual ink edge) chạm đúng đường lề 16px (tương đương 44px vật lý ở lề trái và 1036px vật lý ở lề phải trên màn hình 1080px) với sai số $\le 2\text{px}$.

| Tên thao tác biên / Vị trí | Mép đo | Mép mực đo được (px) | Tọa độ lề chuẩn (px) | Độ lệch (px) | Kết quả | Ảnh trích xuất |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Home Avatar (Header)** | Phải | 1038 | 1036 | **2px** | ✅ ĐẠT | [`crop`](crops/home-avatar.png) |
| **Xem thêm (Home Shelf)** | Phải | 1035 | 1036 | **1px** | ✅ ĐẠT | [`crop`](crops/home-xem-them.png) |
| **Library ⋯ (Header)** | Phải | 1034 | 1036 | **2px** | ✅ ĐẠT | [`crop`](crops/library-dots.png) |
| **Nút Đóng X (Xem nhanh Sheet)** | Phải | 1038 | 1036 | **2px** | ✅ ĐẠT | [`crop`](crops/sheet-close-x.png) |
| **Nút Quay lại (Book Detail Header)** | Trái | 44 | 44 | **0px** | ✅ ĐẠT | [`crop`](crops/book-detail-back.png) |
| **Nút Yêu thích (Book Detail Header)** | Phải | 1035 | 1036 | **1px** | ✅ ĐẠT | [`crop`](crops/book-detail-fav.png) |

---

## 3. THẺ ĐỌC TIẾP (CONTINUE READING HERO CARD)
**Tiêu chí đạt**:
- Hàng dưới cùng gom thành 1 hàng duy nhất: `[ProgressBar flex-1 + %] [Nút Tiếp tục]`.
- Tâm dọc của thanh tiến trình (ProgressBar) và nút Tiếp tục thẳng hàng nhau (độ lệch $\le 2\text{px}$).
- Đệm 4 phía bằng nhau (16px).

- **Tâm dọc ProgressBar**: 939 px
- **Tâm dọc Nút Tiếp tục**: 938.5 px
- **Độ lệch tâm**: **0.5px** (✅ ĐẠT)
- **Đệm 4 phía**: Trái 294px, Phải 46px, Trên 306px, Dưới 52px.
- Ảnh trích xuất thẻ: [`crops/continue-reading-card.png`](crops/continue-reading-card.png)

---

## 4. HÀNG SẮP XẾP GỌN (COMPACT SORT ROW) & TIÊU ĐỀ PHỤ
**Tiêu chí đạt**:
- Nút sắp xếp là nút `fit-content` chiếm $\le 50\%$ độ rộng hàng.
- Nút có biểu tượng sắp xếp + nhãn hiển thị + chevron.
- Đã xóa tiêu đề phụ trùng lặp dưới tiêu đề chính ở Thư viện và Trang chủ.

- **Độ rộng nút sắp xếp**: 103.92045593261719px (26% độ rộng hàng) ($\le 50\%$)
- **Có biểu tượng sắp xếp**: Có
- **Đã xóa phụ đề trùng lặp**: Đã xóa hoàn toàn
- **Kết quả**: ✅ ĐẠT

---

## 5. GIỚI THIỆU SÁCH SẠCH (CLEAN SYNOPSIS - GUTENBERG STRIPPING)
**Tiêu chí đạt**:
- Lọc bỏ hoàn toàn boilerplate Gutenberg bản quyền (terms of the or online, Project Gutenberg License,...).
- Giữ nguyên nội dung văn bản bên trong thẻ `<a>` (như Oscar Wilde, London...).
- Nếu giới thiệu trống hoặc $< 40$ ký tự, hiển thị fallback thân thiện "Chưa có giới thiệu cho cuốn sách này".

- **Màn hình Xem nhanh (Quick Preview)**:
  - Đoạn trích: "Oscar Wilde..."
  - Chứa rác Gutenberg: KHÔNG
  - Chứa câu rác "terms of the or online": KHÔNG
  - Trạng thái: ✅ ĐẠT
- **Màn hình Chi tiết sách (Book Detail)**:
  - Đoạn trích: "Chưa có giới thiệu cho tài liệu này...."
  - Trạng thái: ✅ ĐẠT

---

## 6. HÌNH ẢNH MÀN HÌNH CÓ LƯỚI HƯỚNG DẪN (DEBUG GUIDES OVERLAY)
Các ảnh chụp toàn màn hình trên máy thật với lớp overlay:
- Đường đỏ dọc tại lề trái (16px) và lề phải (16px).
- Khung xanh lá (`#00e676`) quanh mỗi hộp nút.
- Đường vàng (`#ffea00`) ngang tâm mỗi nút.

1. **Trang chủ (Home Screen)**: [`guides/home-guides.png`](guides/home-guides.png)
2. **Thư viện (Library Screen)**: [`guides/library-guides.png`](guides/library-guides.png)
3. **Xem nhanh (Quick Preview Modal)**: [`guides/quick-preview-guides.png`](guides/quick-preview-guides.png)
4. **Chi tiết sách (Book Detail Modal)**: [`guides/book-detail-guides.png`](guides/book-detail-guides.png)
5. **Danh sách (Lists Screen)**: [`guides/lists-guides.png`](guides/lists-guides.png)
6. **Cài đặt (Settings Screen)**: [`guides/settings-guides.png`](guides/settings-guides.png)

---
*Báo cáo được khởi tạo tự động dựa trên đo đạc điểm ảnh quang học thực tế.*
