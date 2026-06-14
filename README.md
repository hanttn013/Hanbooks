# Hanbooks / Aurelia Books

**Hanbooks** là một ứng dụng đọc EPUB offline được xây dựng theo tinh thần **Vibe Code**: phát triển nhanh bằng đối thoại thiết kế - triển khai - kiểm thử, nhưng vẫn giữ cấu trúc kỹ thuật rõ ràng, có tài liệu quyết định sản phẩm, có báo cáo test, và có khả năng đóng gói Android thực tế.

Tên kỹ thuật hiện tại của app là **Aurelia Books** (`com.aurelia.books`). Định hướng sản phẩm là một trình đọc EPUB cá nhân dành cho người hay đọc truyện dài, đặc biệt là các EPUB được tải/chuyển đổi từ Wattpad hoặc nguồn cá nhân khác.

> Your stories. Your library. Always offline.

## Triết Lý Sản Phẩm

Hanbooks không cố trở thành mạng xã hội đọc truyện. App tập trung vào ba việc quan trọng nhất:

1. Mở app lên là đọc tiếp ngay.
2. Đọc mượt, ít hiệu ứng, không che chữ.
3. Lưu sách và vị trí đọc ổn định khi dùng offline.

Các bản thiết kế gần nhất đưa app theo hướng **Reader Lite + Library đẹp**:

- Reader siêu nhẹ, mặc định scroll dọc như Wattpad.
- Library/Home đủ đẹp và dễ quản lý nhưng không làm reader lag.
- TOC, progress, bookmark, settings và metadata EPUB được xử lý theo hướng thực dụng.
- Không thêm comment, feed, social, đề xuất online hoặc tính năng gây nhiễu trải nghiệm đọc cá nhân.

## Vibe Code Là Gì Trong Dự Án Này?

Dự án này được phát triển theo workflow "vibe code" nhưng không phải code tùy hứng. Quy trình thực tế là:

- Người dùng đưa ra cảm nhận, ảnh màn hình, audit UX hoặc yêu cầu sản phẩm.
- AI đọc codebase thật, tài liệu thiết kế và tình trạng hiện tại.
- Thiết kế được viết thành plan trong `docs/plans/`.
- Code được triển khai theo phạm vi đã duyệt.
- App được kiểm tra bằng `lint`, `build`, `Capacitor sync`, Gradle build và báo cáo QA.
- APK debug được xuất ra để cài thử trên Android.

Nói ngắn gọn: **ý tưởng đi nhanh, nhưng code vẫn có cấu trúc, có kiểm thử và có tài liệu.**

## Trạng Thái Hiện Tại

Bản mới nhất đã đóng gói:

```text
AureliaBooks-lite-gemini-debug.apk
```

Vị trí:

```text
aurelia-books/AureliaBooks-lite-gemini-debug.apk
```

Các cải tiến chính của bản `lite_gemini`:

- Reader tự ẩn controls khi người dùng cuộn.
- EPUB iframe có CSS phòng thủ tốt hơn cho ảnh lớn, dòng quá dài, CSS EPUB bẩn.
- `allowScriptedContent` được tắt để an toàn hơn với EPUB không rõ nguồn.
- Lưu progress được debounce để giảm ghi IndexedDB liên tục.
- TOC được flatten và virtualized thủ công cho sách có rất nhiều chương.
- TOC có search chapter nhẹ.
- Home bớt cảm giác dashboard, ưu tiên Continue Reading.
- Library card gọn hơn, có nút ba chấm để mở Book Info.

## Công Nghệ Sử Dụng

| Nhóm | Công nghệ |
|---|---|
| UI | React 19 |
| Build tool | Vite 8 |
| Mobile wrapper | Capacitor 8 |
| Android target | Capacitor Android |
| EPUB engine | epub.js |
| Animation | framer-motion, nhưng Reader Lite giảm tối đa animation |
| ID | uuid |
| Styling | CSS Modules + CSS variables |
| Storage | IndexedDB + localStorage |
| Lint | ESLint |
| Package manager | npm |

## Bản Thiết Kế Nền Tảng

Dự án được phát triển qua nhiều tài liệu thiết kế. Các tài liệu quan trọng nằm ở thư mục cha:

```text
../docs/plans/
```

Các plan đáng chú ý:

```text
../docs/plans/2026-06-11-aurelia-books-design.md
../docs/plans/2026-06-12-aurelia-books-product-redesign-design.md
../docs/plans/2026-06-13-reader-lite-library-polish-design.md
../docs/plans/2026-06-14-hanbooks-lite-v2-reader-design.md
../docs/plans/2026-06-14-hanbooks-lite-gemini-design.md
```

Tài liệu context tổng thể:

```text
../context.md
```

Báo cáo kiểm thử:

```text
../KQ Test.md
```

## Cấu Trúc Thư Mục

```text
aurelia-books/
├── android/                         # Project Android do Capacitor sinh ra
├── public/
│   ├── books/                       # EPUB demo
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── App.jsx                      # App shell, tab routing, reader modal
│   ├── main.jsx                     # React entry
│   ├── components/
│   │   ├── Home/                    # Home, Continue Reading, queue, shelves
│   │   ├── Library/                 # Library grid/list, import EPUB, Book Info
│   │   ├── Lists/                   # Shelves/list CRUD
│   │   ├── Reader/                  # Reader, TOC, search, bookmarks, settings
│   │   ├── Settings/                # Settings, statistics, data reset
│   │   ├── Appearance/              # Appearance screen còn trong source
│   │   ├── Continue/                # Continue screen legacy/auxiliary
│   │   └── TabBar/                  # Bottom navigation
│   ├── data/
│   │   └── demoBooks.js             # Demo book metadata
│   ├── hooks/
│   │   ├── useLibrary.js            # Library state, import, list CRUD, filters
│   │   ├── useReader.js             # Progress, bookmark, reading stats
│   │   └── useSettings.js           # Reader/theme settings
│   ├── styles/
│   │   ├── globals.css              # Global layout, modal, phone frame
│   │   └── themes.css               # Theme CSS variables
│   └── utils/
│       ├── StorageManager.js        # IndexedDB access layer
│       ├── epubMetadata.js          # EPUB metadata/cover/preview extraction
│       └── libraryStats.js          # Statistics helpers
├── capacitor.config.json            # Capacitor app config
├── package.json                     # Scripts and dependencies
├── vite.config.js                   # Vite config
└── README.md
```

## Chức Năng Chính

### Library

- Import file `.epub`.
- Tự đọc metadata EPUB: title, author, cover, description, publisher, language, pages ước tính.
- Tìm kiếm theo title, author, genre, description, publisher và list.
- Lọc theo All, Reading, Unread, Finished, Favorites, Has Bookmarks.
- Sắp xếp theo Recently Opened, Recently Added, Title, Author, Progress.
- Grid/list view.
- Nhấn sách để mở reader.
- Nhấn giữ hoặc bấm nút ba chấm để mở Book Info.
- Xóa sách và dọn progress/bookmark/list liên quan.

### Reader

- Mặc định đọc bằng scroll mode.
- Mở lại đúng vị trí đang đọc dở bằng CFI.
- Controls ẩn khi đọc, hiện khi tap vùng giữa.
- Thanh progress ưu tiên chapter progress.
- TOC có search và virtual list cho sách nhiều chương.
- Search nội dung trong EPUB.
- Bookmark theo CFI trong nội dung.
- Back to previous location sau khi jump bằng TOC/search/bookmark/progress.
- Reading settings bottom sheet: theme, font size, line height, reading mode, chapter flow, status line.
- Tắt scripted content trong EPUB.
- CSS phòng thủ với EPUB có ảnh/CSS lộn xộn.

### Lists / Shelves

- Tạo list/shelf.
- Sửa tên, mô tả, màu đại diện.
- Thêm nhiều sách vào list.
- Gỡ sách khỏi list.
- Xóa list nhưng giữ sách trong Library.

### Settings

- Thống kê thư viện và hoạt động đọc.
- Chọn theme, font, font size, line height, margins, letter spacing.
- Chọn reading mode.
- Chọn chapter flow và status line.
- Xóa toàn bộ data app.

## Lưu Trữ Dữ Liệu

App sử dụng IndexedDB và localStorage:

| Loại dữ liệu | Nơi lưu |
|---|---|
| Sách và file EPUB | IndexedDB `books` |
| Progress | IndexedDB `progress` |
| Bookmarks | IndexedDB `bookmarks` |
| Lists/Shelves | IndexedDB `lists` |
| Settings | localStorage `aurelia_settings` |
| Quick progress percent | localStorage `aurelia_pct_{bookId}` |
| Reading stats | localStorage `aurelia_stats` |

Lưu ý: bản hiện tại vẫn lưu EPUB blob trong IndexedDB. Native filesystem/SAF và backup/restore được để ngoài phạm vi `lite_gemini`.

## Yêu Cầu Môi Trường

- Node.js tương thích với Vite 8.
- npm.
- JDK 21 khi build Android.
- Android SDK khi build APK.
- Windows PowerShell nếu dùng đúng môi trường hiện tại của project.

Trong workspace hiện tại, Android toolchain local đã từng được dùng ở:

```text
.android-build/jdk21
.android-build/sdk
```

## Cài Đặt Dependencies

Từ thư mục app:

```powershell
cd aurelia-books
npm install
```

## Chạy Web Dev Server

```powershell
npm run dev
```

Mặc định Vite sẽ in ra URL localhost. Nếu cần host cụ thể:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

## Kiểm Tra Code

```powershell
npm run lint
```

## Build Web Production

```powershell
npm run build
```

Output nằm trong:

```text
dist/
```

## Sync Android

```powershell
npx cap sync android
```

Hoặc:

```powershell
npm run android:sync
```

## Build APK Debug

Script có sẵn:

```powershell
npm run android:apk
```

Trong môi trường hiện tại, có thể build thủ công bằng local JDK/SDK:

```powershell
cd aurelia-books\android

$root = Split-Path (Get-Location) -Parent
$env:JAVA_HOME = Join-Path $root '.android-build\jdk21'
$env:ANDROID_HOME = Join-Path $root '.android-build\sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

.\gradlew.bat assembleDebug --console=plain --no-daemon
```

APK Gradle sinh ra tại:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Copy ra tên bản phát hành nội bộ:

```powershell
Copy-Item android\app\build\outputs\apk\debug\app-debug.apk AureliaBooks-lite-gemini-debug.apk -Force
```

## Các APK Đã Xuất

Một số APK debug có thể thấy trong thư mục app:

```text
AureliaBooks-debug.apk
AureliaBooks-android-optimized-debug.apk
AureliaBooks-reader-lite-debug.apk
AureliaBooks-reader-lite-v2-debug.apk
AureliaBooks-lite-gemini-debug.apk
```

Bản nên dùng mới nhất:

```text
AureliaBooks-lite-gemini-debug.apk
```

## Quy Trình Test

Tối thiểu trước mỗi bản APK:

```powershell
npm run lint
npm run build
npx cap sync android
```

Sau đó build APK bằng Gradle.

Kết quả test được ghi trong:

```text
../KQ Test.md
```

Các nhóm test quan trọng:

- Import EPUB.
- Mở sách.
- Đọc và cuộn.
- TOC/chuyển chương.
- Reader settings.
- Bookmark/search.
- Lưu progress và reload.
- EPUB thiếu metadata, không cover, CSS phức tạp, ảnh lớn.
- Test trên Android thật.

## Nguyên Tắc Phát Triển

- Reader mượt hơn giao diện hào nhoáng.
- Không để controls che chữ khi đang đọc.
- Không thêm social/comment/feed.
- Không chạy script trong EPUB.
- Không làm nặng Library bằng animation hoặc layout quá phức tạp.
- Mỗi thay đổi lớn nên có design doc và implementation plan.
- Không commit/push tự động nếu người quản lý repo chưa yêu cầu.

## Roadmap Gần

Các hướng tiếp theo hợp lý:

- Thêm test runner như Vitest cho `utils`, `settings`, `progress`.
- Tạo bộ EPUB test data từ `EPUB-01` đến `EPUB-12`.
- Test APK trên Android thật với truyện dài.
- Tối ưu bundle bằng code splitting Reader/Search/TOC.
- Batch import EPUB.
- Duplicate/update detection cho EPUB tải lại từ Wattpad.
- Backup/restore dữ liệu.
- Native Filesystem hoặc Android Storage Access Framework.

## Giới Hạn Hiện Tại

- Chưa có cloud sync.
- Chưa có backup/restore.
- Chưa có native filesystem/SAF.
- Chưa có unit test runner chính thức.
- Chưa có Web Worker cho import EPUB lớn.
- Chưa chứng minh đầy đủ hiệu năng với EPUB 1000-3000 chương trên thiết bị thật.

## License

Chưa khai báo license chính thức.

