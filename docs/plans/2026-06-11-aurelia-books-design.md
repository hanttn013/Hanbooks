# Aurelia Books — Design Document

**Date:** 2026-06-11  
**Version:** 1.0  
**Status:** Approved

---

## Overview

Aurelia Books là ứng dụng đọc sách điện tử cao cấp, tập trung vào trải nghiệm đọc tự nhiên như sách thật. Prototype là Web App (React + Vite), sau đó migrate sang React Native/Expo để đóng gói IPA.

---

## Architecture

**Tech Stack:**
- React 18 + Vite
- epub.js — parse và render EPUB
- framer-motion — animations (page curl, slide, fade)
- localStorage — persistence (library, progress, bookmarks, settings)
- CSS Modules — scoped styling

**Persistence Keys:**
- `aurelia_library` — danh sách sách + metadata
- `aurelia_progress` — vị trí đọc từng sách (CFI)
- `aurelia_bookmarks` — bookmarks theo bookId
- `aurelia_settings` — theme, font, reading mode, typography

---

## Screens

### 1. Library (Tab 1)
- Header: "AURELIA" subtitle + "Library" title
- View toggle: Bookshelf / Grid / List
- Sections: Currently Reading, Favorites, Recently Added, Finished Books
- **Bookshelf View** (default): sách đặt trên kệ gỗ, hiệu ứng chiều sâu
- **Grid View**: 2 cột, bìa sách + title bên dưới
- **List View**: thumbnail nhỏ + title + author + progress bar + %
- Sort options: Title, Author, Recently Opened, Recently Added, Progress
- Import EPUB: nút "+" → file picker
- Demo books: 3 cuốn pre-loaded, có thể xóa
- Long press / context menu: Open, Bookmark List, Mark as Favorite, Mark as Finished, Delete

### 2. Continue Reading (Tab 2)
- Hero card: bìa lớn, title, author, chapter hiện tại, progress %
- "Continue Reading" CTA button (nâu đậm)
- "Also Reading" list: các sách đang đọc khác

### 3. Appearance (Tab 3)
- Preview text block (live preview)
- **Theme selector**: 9 themes (Pure White, Warm Cream, Vintage Paper, Sepia, Dark Gray, AMOLED Black, Forest, Ocean, Midnight Blue)
- **Typeface**: font picker (Merriweather, Georgia, Literata, Charter, Times New Roman, SF Pro, Noto Serif, EB Garamond)
- **Text controls**: Font Size, Line Height, Margin Width, Letter Spacing (sliders)
- **Reading Mode**: Classic Page / Real Book / Continuous Scroll
- **Page Turning**: Realistic / Slide / Fade / Instant

### 4. Reader Screen (full screen)
- Default: ẩn hoàn toàn UI
- Tap center: hiện/ẩn Reader Controls
- **Reader Controls overlay**:
  - Top: Back button, Title, Chapter
  - Bottom: Progress bar, Bookmark button, TOC button, Search button, Settings shortcut
- **3 Reading Modes**:
  1. Classic Page: swipe left/right, framer-motion slide
  2. Real Book: CSS 3D page curl animation
  3. Continuous Scroll: vertical scroll, no pagination
- **Page Turn Effects** (cho Classic + Real Book): Realistic, Slide, Fade, Instant

### 5. Table of Contents (modal/sheet)
- Danh sách chapters từ EPUB spine
- Highlight chapter đang đọc
- Tap → jump đến chapter

### 6. Bookmarks (modal/sheet)
- Danh sách bookmarks của sách hiện tại
- Mỗi bookmark: chapter name + excerpt + delete button
- Tap → jump đến vị trí

### 7. Search in Book (modal)
- Input field
- Kết quả: list matches với context excerpt
- Tap → jump đến vị trí

### 8. Reading Stats (trong Library hoặc book detail)
- Tổng sách đã đọc xong
- Streak ngày đọc
- Số trang đọc hôm nay
- Tổng giờ đọc (tracked khi reader active)

---

## Animations

### Open Book Animation (300–500ms)
- Book card scale up từ grid position
- Framer Motion shared layout animation
- Transition vào Reader screen

### Page Curl (Real Book mode)
- CSS 3D transform: rotateY với perspective
- Shadow gradient trên trang đang curl
- Thời gian: 400ms ease-in-out

### Tab Transitions
- Fade + slide nhẹ giữa các tabs

---

## Themes

| Theme | Background | Text | Accent |
|-------|-----------|------|--------|
| Pure White | #FFFFFF | #1A1A1A | #8B6914 |
| Warm Cream | #EDE8DC | #2C2416 | #8B6914 |
| Vintage Paper | #F5EDD6 | #3D2B1F | #7A5C2E |
| Sepia | #F1E4C3 | #3B2F0A | #8B6914 |
| Dark Gray | #2C2C2C | #E8E0D0 | #C4A35A |
| AMOLED Black | #000000 | #E0D8C8 | #C4A35A |
| Forest | #1C3329 | #E8F0E8 | #7AB892 |
| Ocean | #E8F4F8 | #1A3040 | #4A90B0 |
| Midnight Blue | #1A2035 | #D8E0F0 | #6080C0 |

---

## Data Models

```js
// Book
{
  id: string,           // uuid
  title: string,
  author: string,
  coverUrl: string,     // blob URL or data URL
  filePath: string,     // blob URL of EPUB
  addedAt: number,      // timestamp
  lastOpenedAt: number,
  status: 'reading' | 'finished' | 'unread',
  isFavorite: boolean,
  isDemo: boolean,      // true = deletable demo book
  totalLocations: number
}

// Progress
{
  bookId: string,
  cfi: string,          // epub.js CFI location
  percentage: number,
  chapterTitle: string,
  lastReadAt: number,
  readingTimeMs: number // total reading time
}

// Bookmark
{
  id: string,
  bookId: string,
  cfi: string,
  chapterTitle: string,
  excerpt: string,
  createdAt: number
}

// Settings
{
  theme: string,
  font: string,
  fontSize: number,
  lineHeight: number,
  marginWidth: number,
  letterSpacing: number,
  readingMode: 'classic' | 'realbook' | 'scroll',
  pageTurnEffect: 'realistic' | 'slide' | 'fade' | 'instant'
}
```

---

## Features Confirmed

- ✅ 3 Reading Modes (Classic Page, Real Book, Continuous Scroll)
- ✅ 9 Themes
- ✅ Bookshelf / Grid / List view
- ✅ Import EPUB từ file
- ✅ Demo books (deletable)
- ✅ Bookmark
- ✅ Table of Contents
- ✅ Search in Book
- ✅ Reading Stats
- ✅ Sort by: Title, Author, Recently Opened, Recently Added, Progress
- ✅ Progress tracking + auto-resume
- ✅ Typography controls
- ❌ Highlight & Notes
- ❌ Reading Timer
- ❌ Dictionary
