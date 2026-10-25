// scripts/capture-reader-features.mjs
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const ADB = 'E:\\Personal_pj\\Hanbook\\.android-sdk\\platform-tools\\adb.exe';
const OUT_DIR = 'qa/reader';

await fs.mkdir(OUT_DIR, { recursive: true });

// 1. Forward ADB port
console.log('1. Forwarding ADB port...');
const pid = execSync(`"${ADB}" -s 115662546E004421 shell pidof com.aurelia.books.debug`).toString().trim();
console.log(`Target PID: ${pid}`);
execSync(`"${ADB}" -s 115662546E004421 forward tcp:9223 localabstract:webview_devtools_remote_${pid}`);

// 2. Connect CDP
console.log('2. Connecting to Chrome DevTools Protocol...');
const targetsRes = await fetch('http://127.0.0.1:9223/json/list');
const targets = await targetsRes.json();
const target = targets.find(t => t.type === 'page');
if (!target) {
  console.error('No page target found in WebView');
  process.exit(1);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));

let msgId = 1;
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const curId = msgId++;
    const handler = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === curId) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });
}

async function evaluate(code) {
  const res = await send('Runtime.evaluate', {
    expression: code,
    returnByValue: true,
    awaitPromise: true,
  });
  if (res.exceptionDetails) {
    throw new Error('CDP Eval error: ' + JSON.stringify(res.exceptionDetails));
  }
  return res.result?.value;
}

function captureScreenshot(filename) {
  const filepath = path.join(OUT_DIR, filename);
  console.log(`📸 Capturing screenshot -> ${filepath}`);
  const pngBuf = execSync(`"${ADB}" -s 115662546E004421 exec-out screencap -p`, {
    maxBuffer: 20 * 1024 * 1024,
  });
  return fs.writeFile(filepath, pngBuf);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function closeAnyModal() {
  await evaluate(`(() => {
    // 1. Try close button on sheets / modals
    const closeBtn = document.querySelector('[class*="closeButton"], [aria-label*="Đóng"], [aria-label*="Close"], button[aria-label="Dismiss"]');
    if (closeBtn) {
      closeBtn.click();
      return;
    }
    // 2. Dismiss any open menu by pressing Escape
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    // 3. Or click backdrop
    const backdrop = document.querySelector('[class*="underlay"], [class*="backdrop"], [data-rac][role="presentation"]');
    if (backdrop) backdrop.click();
  })()`);
  await sleep(700);
}

async function ensureControlsVisible() {
  await evaluate(`(() => {
    const chrome = document.querySelector('.reader-chrome');
    if (!chrome) {
      const showBtn = Array.from(document.querySelectorAll('button')).find(b => (b.getAttribute('aria-label') || '').includes('controls') || b.innerText.includes('☰'));
      if (showBtn) {
        showBtn.click();
      } else {
        const viewer = document.querySelector('[data-reader-surface], [class*="viewer"]');
        if (viewer) viewer.click();
      }
    }
  })()`);
  await sleep(600);
}

async function main() {
  // Make sure debug overlay is hidden
  await evaluate(`(() => {
    if (window.__setDebugGuides) window.__setDebugGuides(false);
  })()`);
  await sleep(300);

  // Close any popover / menu left from previous run
  await closeAnyModal();

  // 1. Capture clean reader view (reading text surface without chrome overlay)
  console.log('\n--- 1. Capturing Clean Reader Surface ---');
  await evaluate(`(() => {
    const chrome = document.querySelector('.reader-chrome');
    if (chrome) {
      // Tap reader surface to toggle controls off
      const surface = document.querySelector('[data-reader-surface]');
      if (surface) surface.click();
    }
  })()`);
  await sleep(800);
  await captureScreenshot('01-reader-surface.png');

  // 2. Capture Reader with Controls (Chrome: Top Bar, Bottom Bar, Progress Bar Scrubber)
  console.log('\n--- 2. Capturing Reader Controls (Top Bar & Bottom Dock) ---');
  await ensureControlsVisible();
  await captureScreenshot('02-reader-chrome.png');

  // 3. Capture Progress Bar Scrubber
  console.log('\n--- 3. Capturing Progress Bar Scrubber ---');
  await ensureControlsVisible();
  await evaluate(`(() => {
    const slider = document.querySelector('input[type="range"][class*="progressSlider"]');
    if (slider) {
      slider.value = 68;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));
    }
  })()`);
  await sleep(500);
  await captureScreenshot('03-reader-progress-scrubber.png');

  // 4. Capture Bookmark Toggle (Add Bookmark + Toast notification)
  console.log('\n--- 4. Capturing Bookmark Toggle Action ---');
  await ensureControlsVisible();
  await evaluate(`(() => {
    const dockBtns = document.querySelectorAll('[class*="dockActions"] button');
    // dockBtns[0] is bookmark star
    if (dockBtns[0]) dockBtns[0].click();
  })()`);
  await sleep(500);
  await captureScreenshot('04-reader-bookmark-toast.png');

  // 5. Capture Bookmarks Modal / Sheet
  console.log('\n--- 5. Capturing Bookmarks Sheet ---');
  await ensureControlsVisible();
  await evaluate(`(() => {
    const dockBtns = document.querySelectorAll('[class*="dockActions"] button');
    // dockBtns[1] is pencil (Show bookmarks)
    if (dockBtns[1]) dockBtns[1].click();
  })()`);
  await sleep(1000);
  await captureScreenshot('05-reader-bookmarks-sheet.png');

  // Close Bookmarks Sheet
  await closeAnyModal();

  // 6. Capture Table of Contents (TOC) Sheet
  console.log('\n--- 6. Capturing Table of Contents (TOC) Sheet ---');
  await ensureControlsVisible();
  await evaluate(`(() => {
    const dockBtns = document.querySelectorAll('[class*="dockActions"] button');
    // dockBtns[3] is hamburger list (Table of contents)
    if (dockBtns[3]) dockBtns[3].click();
  })()`);
  await sleep(1000);
  await captureScreenshot('06-reader-toc-sheet.png');

  // Close TOC Sheet
  await closeAnyModal();

  // 7. Capture Reading Settings Panel (Aa button)
  console.log('\n--- 7. Capturing Reading Settings Panel ---');
  await ensureControlsVisible();
  await evaluate(`(() => {
    const dockBtns = document.querySelectorAll('[class*="dockActions"] button');
    // dockBtns[2] is Aa (Reading settings)
    if (dockBtns[2]) dockBtns[2].click();
  })()`);
  await sleep(1000);
  await captureScreenshot('07-reader-settings-panel.png');

  // Close Settings Panel
  await closeAnyModal();

  // 8. Capture Search Modal from TopBar More menu
  console.log('\n--- 8. Capturing Search in Document Modal ---');
  await ensureControlsVisible();
  // Click More button (⋯) in top bar
  await evaluate(`(() => {
    const moreBtn = document.querySelector('header button[aria-label*="More"], header button[aria-label*="Thêm"]');
    if (moreBtn) moreBtn.click();
  })()`);
  await sleep(600);
  // Click Search menu item
  await evaluate(`(() => {
    const items = Array.from(document.querySelectorAll('[role="menuitem"], [class*="MenuItem"]'));
    const searchItem = items.find(m => {
      const t = (m.innerText || '').toLowerCase();
      return t.includes('tìm') || t.includes('search');
    });
    if (searchItem) searchItem.click();
  })()`);
  await sleep(1000);
  await captureScreenshot('08-reader-search-modal.png');

  // Close Search Modal
  await closeAnyModal();

  console.log('\nALL READER FEATURE SCREENSHOTS CAPTURED PERFECTLY!');
  ws.close();
}

main().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
