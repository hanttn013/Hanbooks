// scripts/device/capture-all-before-device.mjs
import { connectCDP, adb } from './device-helper.mjs';
import fs from 'node:fs';

const OUT_DIR = 'qa/reader/before-device';
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const cdp = await connectCDP();

console.log('=== Capturing Real Device Before Baseline (1080x2460) ===');

// Helper to ensure chrome is visible
async function ensureChromeVisible() {
  const hasChrome = await cdp.evalJs(`
    (() => {
      const top = document.querySelector('header');
      return Boolean(top && window.getComputedStyle(top).display !== 'none');
    })()
  `);
  if (!hasChrome) {
    console.log('Chrome is hidden, tapping ☰ button to open chrome...');
    await cdp.tapSelector('button', '☰');
    await sleep(800);
  }
}

// Helper to ensure chrome is hidden
async function ensureChromeHidden() {
  const hasChrome = await cdp.evalJs(`
    (() => {
      const top = document.querySelector('header');
      return Boolean(top && window.getComputedStyle(top).display !== 'none');
    })()
  `);
  if (hasChrome) {
    console.log('Chrome is visible, tapping center to hide...');
    await cdp.tapCenter();
    await sleep(800);
  }
}

// 1. Reading Surface (Chrome hidden)
console.log('[1/8] Capturing 01-reader-reading-surface.png...');
await ensureChromeHidden();
await sleep(500);
cdp.screenshot(`${OUT_DIR}/01-reader-reading-surface.png`);

// 2. Reader Chrome (Top and Bottom bars)
console.log('[2/8] Capturing 02-reader-chrome-progress-bar.png...');
await ensureChromeVisible();
await sleep(600);
cdp.screenshot(`${OUT_DIR}/02-reader-chrome-progress-bar.png`);

// 3. Scrubber (Dragging progress bar)
console.log('[3/8] Capturing 03-reader-progress-scrubber.png...');
await ensureChromeVisible();
const sliderPos = await cdp.evalJs(`
  (() => {
    const s = document.querySelector('input[type="range"], [role="slider"]');
    if (!s) return null;
    const r = s.getBoundingClientRect();
    return { x: r.left + r.width * 0.65, y: r.top + r.height / 2 };
  })()
`);
if (sliderPos) {
  await cdp.tapCoord(sliderPos.x, sliderPos.y);
  await sleep(400);
}
cdp.screenshot(`${OUT_DIR}/03-reader-progress-scrubber.png`);

// 4. Bookmark action & Toast
console.log('[4/8] Capturing 04-reader-bookmark-toast.png...');
await ensureChromeVisible();
await cdp.tapSelector('button[aria-label="Thêm dấu trang"]');
await sleep(400);
cdp.screenshot(`${OUT_DIR}/04-reader-bookmark-toast.png`);
console.log('Waiting for toast to disappear...');
await sleep(3500);

// 5. Bookmarks List / Sheet
console.log('[5/8] Capturing 05-reader-bookmarks-list.png...');
await ensureChromeVisible();
await cdp.tapSelector('button[aria-label="Mở dấu trang"]');
await sleep(1000);
cdp.screenshot(`${OUT_DIR}/05-reader-bookmarks-list.png`);
// Close sheet
console.log('Closing bookmarks sheet with Back key...');
adb('shell input keyevent KEYCODE_BACK');
await sleep(800);

// 6. Table of Contents (TOC) Modal / Sheet
console.log('[6/8] Capturing 06-reader-toc-modal.png...');
await ensureChromeVisible();
await cdp.tapSelector('button[aria-label="Mục lục"]');
await sleep(1200);
cdp.screenshot(`${OUT_DIR}/06-reader-toc-modal.png`);
// Close sheet
console.log('Closing TOC sheet with Back key...');
adb('shell input keyevent KEYCODE_BACK');
await sleep(800);

// 7. Reader Settings Panel (Aa)
console.log('[7/8] Capturing 07-reader-settings-panel.png...');
await ensureChromeVisible();
await cdp.tapSelector('button[aria-label="Cài đặt trang đọc"]');
await sleep(1000);
cdp.screenshot(`${OUT_DIR}/07-reader-settings-panel.png`);
// Close panel
console.log('Closing settings panel with Back key...');
adb('shell input keyevent KEYCODE_BACK');
await sleep(800);

// 8. More Menu (⋯) & Search Modal
console.log('[8/8] Capturing 09-reader-more-menu.png & 08-reader-search-modal.png...');
await ensureChromeVisible();
await cdp.tapSelector('button[aria-label="Thêm thao tác"]');
await sleep(800);
cdp.screenshot(`${OUT_DIR}/09-reader-more-menu.png`);

console.log('Tapping "Tìm kiếm" in more menu...');
const searchOpened = await cdp.evalJs(`
  (() => {
    const items = Array.from(document.querySelectorAll('[role="menuitem"], button, [data-rac]'));
    const item = items.find(i => (i.innerText || '').includes('Tìm kiếm'));
    if (item) { item.click(); return true; }
    return false;
  })()
`);
await sleep(1200);
if (searchOpened) {
  cdp.screenshot(`${OUT_DIR}/08-reader-search-modal.png`);
  // Close search modal
  adb('shell input keyevent KEYCODE_BACK');
  await sleep(800);
}

console.log('=== All 8 Real-Device Before States Captured Successfully! ===');
cdp.close();
