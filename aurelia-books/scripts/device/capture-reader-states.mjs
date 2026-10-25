// scripts/device/capture-reader-states.mjs
import { connectCDP, adb } from './device-helper.mjs';
import fs from 'node:fs';

const OUT_DIR = 'qa/reader/before-device';
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const cdp = await connectCDP();

console.log('--- Step 0: Ensure in Reader ---');
let inReader = await cdp.evalJs(`Boolean(document.querySelector('.reader-chrome, [data-reader-chrome], .reader-content, [data-reader-viewport]'))`);

if (!inReader) {
  console.log('Tapping "Tiếp tục" button on Home...');
  const tapped = await cdp.tapSelector('button', 'Tiếp tục');
  if (!tapped) {
    console.log('Tapping Pride and Prejudice card...');
    await cdp.tapSelector('[aria-label*="Pride and Prejudice"], h3');
    await sleep(1500);
    console.log('Tapping "Đọc" button in detail modal...');
    await cdp.tapSelector('button', 'Đọc');
  }
  await sleep(3500);
}

inReader = await cdp.evalJs(`Boolean(document.querySelector('.reader-chrome, [data-reader-chrome], .reader-content, [data-reader-viewport]'))`);
console.log('In Reader verified:', inReader);

if (!inReader) {
  console.error('Failed to enter Reader screen!');
  cdp.screenshot(`${OUT_DIR}/debug-not-in-reader.png`);
  cdp.close();
  process.exit(1);
}

// Ensure EPUB text and locations render
await sleep(2500);

// --- State 1: Reading surface (Chrome hidden) ---
console.log('Capturing State 1: Reading surface (chrome hidden)...');
let chromeHidden = await cdp.evalJs(`
  (() => {
    const topBar = document.querySelector('header.reader-chrome, header[data-reader-chrome], header[class*="topBar"]');
    if (!topBar) return true;
    const style = window.getComputedStyle(topBar);
    return style.display === 'none' || style.opacity === '0' || style.visibility === 'hidden';
  })()
`);
if (!chromeHidden) {
  console.log('Hiding chrome via center tap...');
  await cdp.tapCenter();
  await sleep(800);
}
cdp.screenshot(`${OUT_DIR}/01-reader-reading-surface.png`);

// --- State 2: Reader chrome visible ---
console.log('Capturing State 2: Reader chrome visible...');
await cdp.tapCenter();
await sleep(800);
cdp.screenshot(`${OUT_DIR}/02-reader-chrome-progress-bar.png`);

// --- State 3: Scrubber preview / active ---
console.log('Capturing State 3: Progress scrubber...');
// Find slider track coordinates
const sliderRect = await cdp.evalJs(`
  (() => {
    const slider = document.querySelector('input[type="range"], [role="slider"], [class*="slider"], [class*="progress"]');
    if (!slider) return null;
    const r = slider.getBoundingClientRect();
    return { x: r.left + r.width * 0.65, y: r.top + r.height / 2 };
  })()
`);
if (sliderRect) {
  await cdp.tapCoord(sliderRect.x, sliderRect.y);
  await sleep(300);
}
cdp.screenshot(`${OUT_DIR}/03-reader-progress-scrubber.png`);

// --- State 4: Bookmark action & toast ---
console.log('Capturing State 4: Bookmark action & toast...');
// Tap Bookmark tool in footer
await cdp.tapSelector('footer button, [class*="bottomBar"] button', 'Dấu trang');
await sleep(500);
cdp.screenshot(`${OUT_DIR}/04-reader-bookmark-toast.png`);
await sleep(3000); // wait for toast to finish

// --- State 5: Bookmarks List / Sheet ---
console.log('Capturing State 5: Bookmarks Sheet...');
const tappedNotes = await cdp.tapSelector('footer button, [class*="bottomBar"] button', 'Ghi chú');
if (!tappedNotes) {
  // Try 2nd button in footer
  await cdp.evalJs(`
    (() => {
      const btns = document.querySelectorAll('footer button, [class*="bottomBar"] button');
      if (btns[1]) btns[1].click();
    })()
  `);
}
await sleep(1000);
cdp.screenshot(`${OUT_DIR}/05-reader-bookmarks-list.png`);
// Close sheet
await cdp.tapSelector('button[aria-label*="Đóng"], button[aria-label*="Close"], button.edge-action');
adb('shell input keyevent KEYCODE_BACK');
await sleep(800);

// Ensure chrome visible
await cdp.tapCenter();
await sleep(600);

// --- State 6: TOC Sheet ---
console.log('Capturing State 6: Table of Contents Sheet...');
const tappedTOC = await cdp.tapSelector('footer button, [class*="bottomBar"] button', 'Mục lục');
if (!tappedTOC) {
  // Try 4th button in footer
  await cdp.evalJs(`
    (() => {
      const btns = document.querySelectorAll('footer button, [class*="bottomBar"] button');
      if (btns[3]) btns[3].click();
    })()
  `);
}
await sleep(1200);
cdp.screenshot(`${OUT_DIR}/06-reader-toc-modal.png`);
// Close sheet
adb('shell input keyevent KEYCODE_BACK');
await sleep(800);

// Ensure chrome visible
await cdp.tapCenter();
await sleep(600);

// --- State 7: Reader Settings Panel ---
console.log('Capturing State 7: Reader Settings Panel...');
const tappedSettings = await cdp.tapSelector('footer button, [class*="bottomBar"] button', 'Giao diện');
if (!tappedSettings) {
  // Try 3rd button in footer
  await cdp.evalJs(`
    (() => {
      const btns = document.querySelectorAll('footer button, [class*="bottomBar"] button');
      if (btns[2]) btns[2].click();
    })()
  `);
}
await sleep(1000);
cdp.screenshot(`${OUT_DIR}/07-reader-settings-panel.png`);
// Close panel
adb('shell input keyevent KEYCODE_BACK');
await sleep(800);

// Ensure chrome visible
await cdp.tapCenter();
await sleep(600);

// --- State 8: More menu (⋯) & Search Modal ---
console.log('Capturing State 8: More menu (⋯)...');
// Top bar rightmost button is ⋯
await cdp.evalJs(`
  (() => {
    const headerBtns = Array.from(document.querySelectorAll('header button, [class*="topBar"] button'));
    if (headerBtns.length > 0) headerBtns[headerBtns.length - 1].click();
  })()
`);
await sleep(800);
cdp.screenshot(`${OUT_DIR}/09-reader-more-menu.png`);

console.log('Capturing State 9: Search Modal...');
// In more menu, click "Tìm kiếm"
const searchItemTapped = await cdp.evalJs(`
  (() => {
    const items = Array.from(document.querySelectorAll('[role="menuitem"], button, div'));
    const searchItem = items.find(el => el.innerText?.includes('Tìm kiếm') || el.innerText?.includes('Search'));
    if (searchItem) { searchItem.click(); return true; }
    return false;
  })()
`);
await sleep(1000);
if (searchItemTapped) {
  cdp.screenshot(`${OUT_DIR}/08-reader-search-modal.png`);
  adb('shell input keyevent KEYCODE_BACK');
  await sleep(600);
}

console.log('ALL states captured on real device successfully into qa/reader/before-device/!');
cdp.close();
