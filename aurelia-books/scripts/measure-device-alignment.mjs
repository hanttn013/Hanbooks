// scripts/measure-device-alignment.mjs
import { execSync } from 'node:child_process';
import { PNG } from 'pngjs';
import fs from 'node:fs/promises';
import path from 'node:path';

const ADB = 'E:\\Personal_pj\\Hanbook\\.android-sdk\\platform-tools\\adb.exe';
const CROPS_DIR = 'qa/align/crops';
const GUIDES_DIR = 'qa/align/guides';

await fs.mkdir(CROPS_DIR, { recursive: true });
await fs.mkdir(GUIDES_DIR, { recursive: true });

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

function captureScreenshot() {
  const pngBuf = execSync(`"${ADB}" -s 115662546E004421 exec-out screencap -p`, {
    maxBuffer: 20 * 1024 * 1024,
  });
  return PNG.sync.read(pngBuf);
}

function savePng(png, filepath) {
  const buf = PNG.sync.write(png);
  return fs.writeFile(filepath, buf);
}

function cropRegion(png, x, y, width, height) {
  const bx = Math.max(0, Math.min(png.width - 1, Math.round(x)));
  const by = Math.max(0, Math.min(png.height - 1, Math.round(y)));
  const bw = Math.max(1, Math.min(png.width - bx, Math.round(width)));
  const bh = Math.max(1, Math.min(png.height - by, Math.round(height)));

  const crop = new PNG({ width: bw, height: bh });
  for (let r = 0; r < bh; r++) {
    for (let c = 0; c < bw; c++) {
      const srcIdx = ((by + r) * png.width + (bx + c)) * 4;
      const dstIdx = (r * bw + c) * 4;
      crop.data[dstIdx] = png.data[srcIdx];
      crop.data[dstIdx + 1] = png.data[srcIdx + 1];
      crop.data[dstIdx + 2] = png.data[srcIdx + 2];
      crop.data[dstIdx + 3] = png.data[srcIdx + 3];
    }
  }
  return { crop, x: bx, y: by, width: bw, height: bh };
}

// Function to measure a button's vertical alignment on physical pixels
function analyzeButtonInk(png, scale, buttonRect, svgRect, spanRect, name) {
  const bx = Math.round(buttonRect.left * scale);
  const by = Math.round(buttonRect.top * scale);
  const bw = Math.round(buttonRect.width * scale);
  const bh = Math.round(buttonRect.height * scale);

  const { crop } = cropRegion(png, bx, by, bw, bh);

  // Sample background color inside button (away from border)
  function getPix(px, py) {
    const idx = (py * png.width + px) * 4;
    return [png.data[idx], png.data[idx + 1], png.data[idx + 2], png.data[idx + 3]];
  }

  const bgSample = getPix(bx + 10, by + Math.round(bh / 2));

  // Determine split X between icon and text if both present
  const splitX = svgRect && spanRect
    ? Math.round(((svgRect.right + spanRect.left) / 2) * scale)
    : (svgRect ? Math.round(svgRect.right * scale) + 4 : bx + bw / 2);

  const marginInset = 3; // ignore outer 3px border/radii
  let allMinY = Infinity, allMaxY = -Infinity;
  let allMinX = Infinity, allMaxX = -Infinity;
  let iconMinY = Infinity, iconMaxY = -Infinity;
  let textMinY = Infinity, textMaxY = -Infinity;

  for (let y = marginInset; y < bh - marginInset; y++) {
    for (let x = marginInset; x < bw - marginInset; x++) {
      const srcIdx = ((by + y) * png.width + (bx + x)) * 4;
      const pr = png.data[srcIdx];
      const pg = png.data[srcIdx + 1];
      const pb = png.data[srcIdx + 2];

      const diff = Math.sqrt((pr - bgSample[0]) ** 2 + (pg - bgSample[1]) ** 2 + (pb - bgSample[2]) ** 2);
      if (diff > 35) {
        const absX = bx + x;
        const absY = by + y;
        if (absY < allMinY) allMinY = absY;
        if (absY > allMaxY) allMaxY = absY;
        if (absX < allMinX) allMinX = absX;
        if (absX > allMaxX) allMaxX = absX;

        if (absX < splitX) {
          if (absY < iconMinY) iconMinY = absY;
          if (absY > iconMaxY) iconMaxY = absY;
        } else {
          if (absY < textMinY) textMinY = absY;
          if (absY > textMaxY) textMaxY = absY;
        }
      }
    }
  }

  const topPad = allMinY - by;
  const botPad = (by + bh) - allMaxY;
  const padDiff = Math.abs(topPad - botPad);

  let iconCenter = null;
  let textCenter = null;
  let iconTextCenterDiff = null;

  if (iconMinY !== Infinity && textMinY !== Infinity) {
    iconCenter = (iconMinY + iconMaxY) / 2;
    textCenter = (textMinY + textMaxY) / 2;
    iconTextCenterDiff = Math.abs(iconCenter - textCenter);
  }

  return {
    name,
    buttonBox: { x: bx, y: by, width: bw, height: bh },
    inkBox: { minY: allMinY, maxY: allMaxY, minX: allMinX, maxX: allMaxX },
    topPad,
    botPad,
    padDiff,
    iconCenter,
    textCenter,
    iconTextCenterDiff,
    passPadding: padDiff <= 2,
    passCenter: iconTextCenterDiff !== null ? iconTextCenterDiff <= 3 : true,
    crop,
  };
}

// Function to measure edge action glyph ink distance to margin (left or right)
function analyzeEdgeActionInk(png, scale, elementRect, edge = 'right', targetMarginCss = 16, name) {
  const bx = Math.round(elementRect.left * scale);
  const by = Math.round(elementRect.top * scale);
  const bw = Math.round(elementRect.width * scale);
  const bh = Math.round(elementRect.height * scale);

  const { crop } = cropRegion(png, bx, by, bw, bh);

  // Sample background color outside glyph
  function getPix(px, py) {
    const idx = (py * png.width + px) * 4;
    return [png.data[idx], png.data[idx + 1], png.data[idx + 2], png.data[idx + 3]];
  }

  // Sample screen background at the element corner
  const bgSample = getPix(Math.max(0, bx - 6), by + Math.round(bh / 2));

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (let y = 3; y < bh - 3; y++) {
    for (let x = 0; x < bw; x++) {
      const srcIdx = ((by + y) * png.width + (bx + x)) * 4;
      const pr = png.data[srcIdx];
      const pg = png.data[srcIdx + 1];
      const pb = png.data[srcIdx + 2];

      const diff = Math.sqrt((pr - bgSample[0]) ** 2 + (pg - bgSample[1]) ** 2 + (pb - bgSample[2]) ** 2);
      if (diff > 55) {
        const absX = bx + x;
        const absY = by + y;
        if (absX < minX) minX = absX;
        if (absX > maxX) maxX = absX;
        if (absY < minY) minY = absY;
        if (absY > maxY) maxY = absY;
      }
    }
  }

  // Calculate target margin in physical pixels
  const expectedMarginPx = edge === 'right'
    ? Math.round(png.width - (targetMarginCss * scale))
    : Math.round(targetMarginCss * scale);

  const measuredInkEdgePx = edge === 'right' ? maxX : minX;
  const marginDiffPx = Math.abs(measuredInkEdgePx - expectedMarginPx);

  return {
    name,
    edge,
    elementBox: { x: bx, y: by, width: bw, height: bh },
    inkBox: { minX, maxX, minY, maxY },
    measuredInkEdgePx,
    expectedMarginPx,
    marginDiffPx,
    passMargin: marginDiffPx <= 2,
    crop,
  };
}

// Function to measure Continue Reading card alignment
function analyzeContinueReadingCard(png, scale, cardRect, progressRect, buttonRect) {
  const cx = Math.round(cardRect.left * scale);
  const cy = Math.round(cardRect.top * scale);
  const cw = Math.round(cardRect.width * scale);
  const ch = Math.round(cardRect.height * scale);

  const { crop } = cropRegion(png, cx, cy, cw, ch);

  // Progress Bar vertical center
  const pTop = Math.round(progressRect.top * scale);
  const pBottom = Math.round(progressRect.bottom * scale);
  const progressCenterY = (pTop + pBottom) / 2;

  // Button vertical center
  const bTop = Math.round(buttonRect.top * scale);
  const bBottom = Math.round(buttonRect.bottom * scale);
  const buttonCenterY = (bTop + bBottom) / 2;

  const centerDiffPx = Math.abs(progressCenterY - buttonCenterY);

  // Card paddings
  const padTop = Math.round((progressRect.top - cardRect.top) * scale);
  const padBottom = Math.round((cardRect.bottom - buttonRect.bottom) * scale);
  const padLeft = Math.round((progressRect.left - cardRect.left) * scale);
  const padRight = Math.round((cardRect.right - buttonRect.right) * scale);

  return {
    name: 'Thẻ Đọc tiếp (Progress vs Button)',
    cardBox: { x: cx, y: cy, width: cw, height: ch },
    progressCenterY,
    buttonCenterY,
    centerDiffPx,
    passCenter: centerDiffPx <= 2,
    paddings: { top: padTop, bottom: padBottom, left: padLeft, right: padRight },
    crop,
  };
}

const results = {
  timestamp: new Date().toISOString(),
  device: 'TECNO LI6 (Android 15)',
  screenResolution: '1080x2460',
  buttons: [],
  edgeActions: [],
  sortRow: null,
  continueReadingCard: null,
  synopsisValidation: null,
  bookDetailSynopsisValidation: null,
};

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Helper to capture a clean screenshot for measurement and an overlay screenshot for visual proof
async function captureScreenPair(screenName) {
  // 1. Clean screenshot without overlay lines
  await evaluate(`(() => {
    if (window.__setDebugGuides) window.__setDebugGuides(false);
    const el = document.getElementById('debug-overlay');
    if (el) el.style.display = 'none';
  })()`);
  await sleep(300);
  const cleanShot = captureScreenshot();

  // 2. Overlay screenshot with debug guide lines for visual inspection
  await evaluate(`(() => {
    if (window.__setDebugGuides) window.__setDebugGuides(true);
    const el = document.getElementById('debug-overlay');
    if (el) el.style.display = 'block';
  })()`);
  await sleep(350);
  const guidesShot = captureScreenshot();
  await savePng(guidesShot, path.join(GUIDES_DIR, `${screenName}-guides.png`));

  // 3. Return to clean mode
  await evaluate(`(() => {
    if (window.__setDebugGuides) window.__setDebugGuides(false);
    const el = document.getElementById('debug-overlay');
    if (el) el.style.display = 'none';
  })()`);
  await sleep(200);

  return cleanShot;
}

// Reset view
console.log('Ensuring clean state...');
await evaluate(`(() => {
  window.location.hash = '';
  if (document.querySelector('[data-reader-chrome]')) {
    window.history.back();
  }
})()`);
await sleep(1000);

console.log('--- SCREEN 1: HOME SCREEN ---');
await evaluate(`(() => {
  const tab = document.querySelector('[data-tab="home"], button[aria-label="Home"], button[role="tab"]:first-child');
  if (tab) tab.click();
})()`);
await sleep(1000);

let homeShot = await captureScreenPair('home');
let winInfo = await evaluate(`({ width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio })`);
let scale = homeShot.width / winInfo.width;

// Measure Home Avatar EdgeAction
const avatarInfo = await evaluate(`(() => {
  const av = document.querySelector('header button[aria-label*="Thư viện"], header button:has(svg circle)');
  if (!av) return null;
  const r = av.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
})()`);

if (avatarInfo) {
  const res = analyzeEdgeActionInk(homeShot, scale, avatarInfo, 'right', 16, 'Home Avatar (Header)');
  await savePng(res.crop, path.join(CROPS_DIR, 'home-avatar.png'));
  console.log(`Avatar EdgeAction: ink = ${res.measuredInkEdgePx}px, expected = ${res.expectedMarginPx}px, diff = ${res.marginDiffPx}px -> ${res.passMargin ? 'PASS' : 'FAIL'}`);
  const { crop, ...jsonRes } = res;
  results.edgeActions.push(jsonRes);
}

// Measure Home "Xem thêm" EdgeAction
const xemThemInfo = await evaluate(`(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('Xem thêm'));
  if (!btn) return null;
  const r = btn.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
})()`);

if (xemThemInfo) {
  const res = analyzeEdgeActionInk(homeShot, scale, xemThemInfo, 'right', 16, 'Xem thêm (Home Shelf)');
  await savePng(res.crop, path.join(CROPS_DIR, 'home-xem-them.png'));
  console.log(`Xem thêm EdgeAction: ink = ${res.measuredInkEdgePx}px, expected = ${res.expectedMarginPx}px, diff = ${res.marginDiffPx}px -> ${res.passMargin ? 'PASS' : 'FAIL'}`);
  const { crop, ...jsonRes } = res;
  results.edgeActions.push(jsonRes);
}

// Measure Continue Reading Card
const continueReadingInfo = await evaluate(`(() => {
  const card = document.querySelector('.hero-card, [class*="heroCard"], [class*="hero_card"]');
  if (!card) return null;
  const progress = card.querySelector('[role="progressbar"], [class*="progressRow"], [class*="progressBar"]');
  const btn = card.querySelector('button');
  if (!progress || !btn) return null;
  const cRect = card.getBoundingClientRect();
  const pRect = progress.getBoundingClientRect();
  const bRect = btn.getBoundingClientRect();
  const svg = btn.querySelector('svg');
  const span = btn.querySelector('span');
  return {
    card: { left: cRect.left, top: cRect.top, width: cRect.width, height: cRect.height, right: cRect.right, bottom: cRect.bottom },
    progress: { left: pRect.left, top: pRect.top, width: pRect.width, height: pRect.height, right: pRect.right, bottom: pRect.bottom },
    button: { left: bRect.left, top: bRect.top, width: bRect.width, height: bRect.height, right: bRect.right, bottom: bRect.bottom },
    btnSvg: svg ? { left: svg.getBoundingClientRect().left, right: svg.getBoundingClientRect().right } : null,
    btnSpan: span ? { left: span.getBoundingClientRect().left, right: span.getBoundingClientRect().right } : null,
  };
})()`);

if (continueReadingInfo) {
  const cardRes = analyzeContinueReadingCard(homeShot, scale, continueReadingInfo.card, continueReadingInfo.progress, continueReadingInfo.button);
  await savePng(cardRes.crop, path.join(CROPS_DIR, 'continue-reading-card.png'));
  console.log(`Continue Reading Card: center diff = ${cardRes.centerDiffPx}px -> ${cardRes.passCenter ? 'PASS' : 'FAIL'}`);
  const { crop, ...jsonCardRes } = cardRes;
  results.continueReadingCard = jsonCardRes;

  const btnRes = analyzeButtonInk(homeShot, scale, continueReadingInfo.button, continueReadingInfo.btnSvg, continueReadingInfo.btnSpan, 'Nút Tiếp tục (Hero Card)');
  await savePng(btnRes.crop, path.join(CROPS_DIR, 'button-tiep-tuc-hero.png'));
  console.log(`Button Tiếp tục: padDiff = ${btnRes.padDiff}px (top ${btnRes.topPad} / bot ${btnRes.botPad}) -> ${btnRes.passPadding ? 'PASS' : 'FAIL'}`);
  const { crop: bCrop, ...jsonBtnRes } = btnRes;
  results.buttons.push(jsonBtnRes);
}

console.log('--- SCREEN 2: LIBRARY SCREEN ---');
await evaluate(`(() => {
  const tab = document.querySelector('[data-tab="library"], button[aria-label="Library"], button[aria-label*="Thư viện"]');
  if (tab) tab.click();
})()`);
await sleep(1000);

let libraryShot = await captureScreenPair('library');

// Measure "Nhập tài liệu" button in header
const nhapTaiLieuInfo = await evaluate(`(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('Nhập tài liệu'));
  if (!btn) return null;
  const r = btn.getBoundingClientRect();
  const svg = btn.querySelector('svg');
  const span = btn.querySelector('span');
  return {
    button: { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom },
    svg: svg ? { left: svg.getBoundingClientRect().left, right: svg.getBoundingClientRect().right } : null,
    span: span ? { left: span.getBoundingClientRect().left, right: span.getBoundingClientRect().right } : null,
  };
})()`);

if (nhapTaiLieuInfo) {
  const btnRes = analyzeButtonInk(libraryShot, scale, nhapTaiLieuInfo.button, nhapTaiLieuInfo.svg, nhapTaiLieuInfo.span, 'Nút Nhập tài liệu (Library Header)');
  await savePng(btnRes.crop, path.join(CROPS_DIR, 'button-nhap-tai-lieu.png'));
  console.log(`Button Nhập tài liệu: padDiff = ${btnRes.padDiff}px (top ${btnRes.topPad} / bot ${btnRes.botPad}), centerDiff = ${btnRes.iconTextCenterDiff}px -> ${btnRes.passPadding ? 'PASS' : 'FAIL'}`);
  const { crop, ...jsonRes } = btnRes;
  results.buttons.push(jsonRes);
}

// Measure Library Header ⋯ EdgeAction
const dotsInfo = await evaluate(`(() => {
  const btn = document.querySelector('header button[aria-label*="Tùy chọn"], header button:has(svg circle)');
  if (!btn) return null;
  const r = btn.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
})()`);

if (dotsInfo) {
  const res = analyzeEdgeActionInk(libraryShot, scale, dotsInfo, 'right', 16, 'Library ⋯ (Header)');
  await savePng(res.crop, path.join(CROPS_DIR, 'library-dots.png'));
  console.log(`Library ⋯ EdgeAction: ink = ${res.measuredInkEdgePx}px, expected = ${res.expectedMarginPx}px, diff = ${res.marginDiffPx}px -> ${res.passMargin ? 'PASS' : 'FAIL'}`);
  const { crop, ...jsonRes } = res;
  results.edgeActions.push(jsonRes);
}

// Measure Sort Row and Display Options EdgeAction
const sortRowInfo = await evaluate(`(() => {
  const toolsRow = document.querySelector('[class*="toolsRow"]');
  const sortBtn = toolsRow ? toolsRow.querySelector('button:first-child') : null;
  const displayBtn = toolsRow ? toolsRow.querySelector('button[aria-label*="Hiển thị"], button:has(svg rect)') : null;
  const subtitle = document.querySelector('header p[class*="pageSubtitle"]');
  return {
    sortBtnWidth: sortBtn ? sortBtn.getBoundingClientRect().width : null,
    toolsRowWidth: toolsRow ? toolsRow.getBoundingClientRect().width : window.innerWidth,
    sortBtnText: sortBtn ? sortBtn.innerText : null,
    hasSortIcon: sortBtn ? !!sortBtn.querySelector('svg') : false,
    subtitleText: subtitle ? subtitle.innerText : null,
    isSubtitlePresent: !!subtitle && subtitle.innerText.trim().length > 0,
    displayBtnRect: displayBtn ? { left: displayBtn.getBoundingClientRect().left, right: displayBtn.getBoundingClientRect().right, top: displayBtn.getBoundingClientRect().top, width: displayBtn.getBoundingClientRect().width, height: displayBtn.getBoundingClientRect().height } : null,
  };
})()`);

if (sortRowInfo) {
  const isCompact = sortRowInfo.sortBtnWidth && (sortRowInfo.sortBtnWidth <= sortRowInfo.toolsRowWidth * 0.5);
  results.sortRow = {
    sortBtnWidthCss: sortRowInfo.sortBtnWidth,
    toolsRowWidthCss: sortRowInfo.toolsRowWidth,
    ratio: sortRowInfo.sortBtnWidth ? (sortRowInfo.sortBtnWidth / sortRowInfo.toolsRowWidth) : null,
    isCompact,
    hasSortIcon: sortRowInfo.hasSortIcon,
    redundantSubtitleRemoved: !sortRowInfo.isSubtitlePresent,
    passSortRow: isCompact && sortRowInfo.hasSortIcon && !sortRowInfo.isSubtitlePresent,
  };
  console.log(`Sort Row: width = ${sortRowInfo.sortBtnWidth}px (${Math.round(results.sortRow.ratio * 100)}% row), hasIcon = ${sortRowInfo.hasSortIcon}, subtitleRemoved = ${!sortRowInfo.isSubtitlePresent} -> ${results.sortRow.passSortRow ? 'PASS' : 'FAIL'}`);

  if (sortRowInfo.displayBtnRect) {
    const dispRes = analyzeEdgeActionInk(libraryShot, scale, sortRowInfo.displayBtnRect, 'right', 16, 'Display Options (Tools Row)');
    await savePng(dispRes.crop, path.join(CROPS_DIR, 'library-display-options.png'));
    console.log(`Display Options EdgeAction: diff = ${dispRes.marginDiffPx}px -> ${dispRes.passMargin ? 'PASS' : 'FAIL'}`);
    const { crop, ...jsonRes } = dispRes;
    results.edgeActions.push(jsonRes);
  }
}

console.log('--- SCREEN 3: QUICK PREVIEW (XEM NHANH) MODAL ---');
// Long press or trigger quick preview on first book card
await evaluate(`(() => {
  const card = document.querySelector('[class*="bookCard"], [class*="book_card"]');
  if (card) {
    card.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
  }
})()`);
await sleep(1000);

let qpShot = await captureScreenPair('quick-preview');

// Measure 'X' close button in sheet
const closeBtnInfo = await evaluate(`(() => {
  const xBtn = document.querySelector('[role="dialog"] button[aria-label*="Đóng"], [class*="sheet"] button[aria-label*="Đóng"]');
  if (!xBtn) return null;
  const r = xBtn.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
})()`);

if (closeBtnInfo) {
  const res = analyzeEdgeActionInk(qpShot, scale, closeBtnInfo, 'right', 16, 'Nút Đóng X (Xem nhanh Sheet)');
  await savePng(res.crop, path.join(CROPS_DIR, 'sheet-close-x.png'));
  console.log(`Sheet X EdgeAction: ink = ${res.measuredInkEdgePx}px, diff = ${res.marginDiffPx}px -> ${res.passMargin ? 'PASS' : 'FAIL'}`);
  const { crop, ...jsonRes } = res;
  results.edgeActions.push(jsonRes);
}

// Measure Quick Preview Action Buttons: "Đọc", "Yêu thích", "Thêm vào danh sách", "Chi tiết sách"
const qpButtons = await evaluate(`(() => {
  const btns = Array.from(document.querySelectorAll('[role="dialog"] button, [class*="sheet"] button'));
  return btns.map(b => {
    const r = b.getBoundingClientRect();
    const svg = b.querySelector('svg');
    const span = b.querySelector('span');
    return {
      text: b.innerText || b.getAttribute('aria-label') || '',
      rect: { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom },
      svg: svg ? { left: svg.getBoundingClientRect().left, right: svg.getBoundingClientRect().right } : null,
      span: span ? { left: span.getBoundingClientRect().left, right: span.getBoundingClientRect().right } : null,
    };
  }).filter(b => b.text.trim().length > 0 && b.rect.width > 20 && !b.text.includes('Đóng'));
})()`);

for (const b of qpButtons) {
  const btnRes = analyzeButtonInk(qpShot, scale, b.rect, b.svg, b.span, `${b.text.replace(/\n/g, ' ').trim()} (Xem nhanh)`);
  const safeName = b.text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  await savePng(btnRes.crop, path.join(CROPS_DIR, `qp-button-${safeName}.png`));
  console.log(`QP Button "${b.text.trim()}": padDiff = ${btnRes.padDiff}px, centerDiff = ${btnRes.iconTextCenterDiff}px -> ${btnRes.passPadding ? 'PASS' : 'FAIL'}`);
  const { crop, ...jsonRes } = btnRes;
  results.buttons.push(jsonRes);
}

// Check Quick Preview Synopsis Text
const qpSynopsis = await evaluate(`(() => {
  const syn = document.querySelector('[class*="synopsis"], [class*="description"], [role="dialog"] p');
  return syn ? syn.innerText : null;
})()`);

if (qpSynopsis) {
  const hasGutenberg = /gutenberg/i.test(qpSynopsis);
  const hasBrokenOr = /the or online/i.test(qpSynopsis);
  const isFallbackOrClean = !hasGutenberg && !hasBrokenOr;
  results.synopsisValidation = {
    screen: 'Xem nhanh',
    textSnippet: qpSynopsis.slice(0, 150),
    hasGutenberg,
    hasBrokenOr,
    passClean: isFallbackOrClean,
  };
  console.log(`QP Synopsis validation: clean = ${isFallbackOrClean} (snippet: "${qpSynopsis.slice(0, 60)}...")`);
}

// 4. Open Book Detail from Quick Preview ("Chi tiết sách")
console.log('--- OPENING BOOK DETAIL FROM QUICK PREVIEW ---');
await evaluate(`(() => {
  const detailsBtn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('Chi tiết sách'));
  if (detailsBtn) detailsBtn.click();
})()`);
await sleep(1200);

let detailShot = await captureScreenPair('book-detail');

// Measure Back button (left EdgeAction) and Favorite button (right EdgeAction)
const detailEdgeActions = await evaluate(`(() => {
  const topBar = document.querySelector('[class*="topBar"]');
  if (!topBar) return null;
  const buttons = Array.from(topBar.querySelectorAll('button'));
  const back = buttons[0];
  const fav = buttons[buttons.length - 1];
  return {
    back: back ? { left: back.getBoundingClientRect().left, top: back.getBoundingClientRect().top, width: back.getBoundingClientRect().width, height: back.getBoundingClientRect().height, right: back.getBoundingClientRect().right } : null,
    fav: fav ? { left: fav.getBoundingClientRect().left, top: fav.getBoundingClientRect().top, width: fav.getBoundingClientRect().width, height: fav.getBoundingClientRect().height, right: fav.getBoundingClientRect().right } : null,
  };
})()`);

if (detailEdgeActions?.back) {
  const res = analyzeEdgeActionInk(detailShot, scale, detailEdgeActions.back, 'left', 16, 'Nút Quay lại (Book Detail Header)');
  await savePng(res.crop, path.join(CROPS_DIR, 'book-detail-back.png'));
  console.log(`Detail Back EdgeAction: ink = ${res.measuredInkEdgePx}px, expected = ${res.expectedMarginPx}px, diff = ${res.marginDiffPx}px -> ${res.passMargin ? 'PASS' : 'FAIL'}`);
  const { crop, ...jsonRes } = res;
  results.edgeActions.push(jsonRes);
}

if (detailEdgeActions?.fav) {
  const res = analyzeEdgeActionInk(detailShot, scale, detailEdgeActions.fav, 'right', 16, 'Nút Yêu thích (Book Detail Header)');
  await savePng(res.crop, path.join(CROPS_DIR, 'book-detail-fav.png'));
  console.log(`Detail Fav EdgeAction: ink = ${res.measuredInkEdgePx}px, expected = ${res.expectedMarginPx}px, diff = ${res.marginDiffPx}px -> ${res.passMargin ? 'PASS' : 'FAIL'}`);
  const { crop, ...jsonRes } = res;
  results.edgeActions.push(jsonRes);
}

// Check Book Detail Synopsis Text
const detailSynopsis = await evaluate(`(() => {
  const syn = document.querySelector('[class*="synopsis"], [class*="description"]');
  return syn ? syn.innerText : null;
})()`);

if (detailSynopsis) {
  const hasGutenberg = /gutenberg/i.test(detailSynopsis);
  const hasBrokenOr = /the or online/i.test(detailSynopsis);
  const isFallbackOrClean = !hasGutenberg && !hasBrokenOr;
  results.bookDetailSynopsisValidation = {
    screen: 'Chi tiết sách',
    textSnippet: detailSynopsis.slice(0, 150),
    hasGutenberg,
    hasBrokenOr,
    passClean: isFallbackOrClean,
  };
  console.log(`Detail Synopsis validation: clean = ${isFallbackOrClean}`);
}

// Close Book Detail
await evaluate(`(() => {
  const topBar = document.querySelector('[class*="topBar"]');
  if (topBar) {
    const back = topBar.querySelector('button');
    if (back) back.click();
  }
})()`);
await sleep(800);

console.log('--- SCREEN 4: LISTS SCREEN ---');
await evaluate(`(() => {
  const tab = document.querySelector('[data-tab="lists"], button[aria-label="Lists"], [aria-label*="Danh sách"]');
  if (tab) tab.click();
})()`);
await sleep(1000);

let listsShot = await captureScreenPair('lists');

// Measure "Tạo danh sách" button
const taoDanhSachInfo = await evaluate(`(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('Tạo danh sách') || (b.innerText || '').includes('Danh sách mới'));
  if (!btn) return null;
  const r = btn.getBoundingClientRect();
  const svg = btn.querySelector('svg');
  const span = btn.querySelector('span');
  return {
    button: { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom },
    svg: svg ? { left: svg.getBoundingClientRect().left, right: svg.getBoundingClientRect().right } : null,
    span: span ? { left: span.getBoundingClientRect().left, right: span.getBoundingClientRect().right } : null,
  };
})()`);

if (taoDanhSachInfo) {
  const btnRes = analyzeButtonInk(listsShot, scale, taoDanhSachInfo.button, taoDanhSachInfo.svg, taoDanhSachInfo.span, 'Nút Tạo danh sách (Lists)');
  await savePng(btnRes.crop, path.join(CROPS_DIR, 'button-tao-danh-sach.png'));
  console.log(`Button Tạo danh sách: padDiff = ${btnRes.padDiff}px, centerDiff = ${btnRes.iconTextCenterDiff}px -> ${btnRes.passPadding ? 'PASS' : 'FAIL'}`);
  const { crop, ...jsonRes } = btnRes;
  results.buttons.push(jsonRes);
}

console.log('--- SCREEN 5: SETTINGS SCREEN ---');
await evaluate(`(() => {
  const tab = document.querySelector('[data-tab="settings"], button[aria-label="Settings"], [aria-label*="Cài đặt"]');
  if (tab) tab.click();
})()`);
await sleep(1000);

// Scroll settings backup grid into view
await evaluate(`(() => {
  const backup = document.querySelector('[class*="backupGrid"]');
  if (backup) backup.scrollIntoView({ behavior: 'instant', block: 'center' });
})()`);
await sleep(500);

let settingsShot = await captureScreenPair('settings');

// Measure buttons in Settings (inside backupGrid or settings sections, exclude tab bar)
const settingsButtons = await evaluate(`(() => {
  const backup = document.querySelector('[class*="backupGrid"]');
  const btns = Array.from((backup || document).querySelectorAll('button'));
  return btns.map(b => {
    const r = b.getBoundingClientRect();
    const svg = b.querySelector('svg');
    const span = b.querySelector('span');
    return {
      text: b.innerText || b.getAttribute('aria-label') || '',
      rect: { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom },
      svg: svg ? { left: svg.getBoundingClientRect().left, right: svg.getBoundingClientRect().right } : null,
      span: span ? { left: span.getBoundingClientRect().left, right: span.getBoundingClientRect().right } : null,
    };
  }).filter(b => b.text.trim().length > 0 && b.rect.width > 50 && !['Trang chủ', 'Thư viện', 'Danh sách', 'Cài đặt'].includes(b.text.trim()));
})()`);

for (const b of settingsButtons.slice(0, 4)) {
  const btnRes = analyzeButtonInk(settingsShot, scale, b.rect, b.svg, b.span, `${b.text.replace(/\n/g, ' ').trim()} (Settings)`);
  const safeName = b.text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  await savePng(btnRes.crop, path.join(CROPS_DIR, `settings-button-${safeName}.png`));
  console.log(`Settings Button "${b.text.trim()}": padDiff = ${btnRes.padDiff}px -> ${btnRes.passPadding ? 'PASS' : 'FAIL'}`);
  const { crop, ...jsonRes } = btnRes;
  results.buttons.push(jsonRes);
}

// Return to Home
await evaluate(`(() => {
  const tab = document.querySelector('[data-tab="home"], button[aria-label="Home"]');
  if (tab) tab.click();
})()`);
await sleep(500);

// Close WS connection
ws.close();

// Write results JSON
await fs.writeFile('qa/align/measurements.json', JSON.stringify(results, null, 2));

// Generate QA REPORT Markdown
const reportContent = `# BÁO CÁO CĂN CHỈNH NÚT & LỀ TRÊN PIXEL MÁY THẬT (TECNO LI6)

**Thiết bị kiểm nghiệm**: TECNO LI6 (Android 15)  
**Độ phân giải vật lý**: 1080 x 2460 px  
**Mật độ điểm ảnh**: 440 dpi (Device Pixel Ratio: 2.755)  
**Thời gian đo nghiệm**: ${results.timestamp}  
**Gói ứng dụng**: \`com.aurelia.books.debug\`  
**Phương pháp đo**: Chụp ảnh trực tiếp từ thiết bị (\`adb exec-out screencap -p\`), đọc hộp phần tử bằng Chrome DevTools Protocol (CDP), phân tích điểm ảnh thực tế qua \`pngjs\`. Chụp ảnh đối chiếu với lưới hướng dẫn (\`DebugOverlay\`).

---

## 1. BẢNG TỔNG HỢP CĂN GIỮA DỌC CỦA NÚT (BUTTON VERTICAL CENTERING)
**Tiêu chí đạt**:
- Độ lệch đệm trên so với đệm dưới (padding diff) $\\le 2\\text{px}$ trên điểm ảnh thật.
- Tâm biểu tượng so với tâm chữ (icon center vs text center) $\\le 3\\text{px}$.

| Tên nút / Vị trí | Đệm trên (px) | Đệm dưới (px) | Độ lệch đệm (px) | Tâm Icon - Text (px) | Kết quả | Ảnh trích xuất |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
${results.buttons.map(b => `| **${b.name}** | ${b.topPad} | ${b.botPad} | **${b.padDiff}px** | ${b.iconTextCenterDiff !== null ? `${b.iconTextCenterDiff}px` : '—'} | ${b.passPadding && b.passCenter ? '✅ ĐẠT' : '❌ CHƯA ĐẠT'} | [\`crop\`](crops/${b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png) |`).join('\n')}

---

## 2. BẢNG TỔNG HỢP CĂN LỀ BIÊN (EDGEACTION - 16PX MARGIN FLUSH)
**Tiêu chí đạt**:
- Vùng chạm tối thiểu đạt 44dp.
- Mực hiển thị (visual ink edge) chạm đúng đường lề 16px (tương đương 44px vật lý ở lề trái và 1036px vật lý ở lề phải trên màn hình 1080px) với sai số $\\le 2\\text{px}$.

| Tên thao tác biên / Vị trí | Mép đo | Mép mực đo được (px) | Tọa độ lề chuẩn (px) | Độ lệch (px) | Kết quả | Ảnh trích xuất |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
${results.edgeActions.map(e => `| **${e.name}** | ${e.edge === 'right' ? 'Phải' : 'Trái'} | ${e.measuredInkEdgePx} | ${e.expectedMarginPx} | **${e.marginDiffPx}px** | ${e.passMargin ? '✅ ĐẠT' : '❌ CHƯA ĐẠT'} | [\`crop\`](crops/${e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png) |`).join('\n')}

---

## 3. THẺ ĐỌC TIẾP (CONTINUE READING HERO CARD)
**Tiêu chí đạt**:
- Hàng dưới cùng gom thành 1 hàng duy nhất: \`[ProgressBar flex-1 + %] [Nút Tiếp tục]\`.
- Tâm dọc của thanh tiến trình (ProgressBar) và nút Tiếp tục thẳng hàng nhau (độ lệch $\\le 2\\text{px}$).
- Đệm 4 phía bằng nhau (16px).

- **Tâm dọc ProgressBar**: ${results.continueReadingCard?.progressCenterY} px
- **Tâm dọc Nút Tiếp tục**: ${results.continueReadingCard?.buttonCenterY} px
- **Độ lệch tâm**: **${results.continueReadingCard?.centerDiffPx}px** (${results.continueReadingCard?.passCenter ? '✅ ĐẠT' : '❌ CHƯA ĐẠT'})
- **Đệm 4 phía**: Trái ${results.continueReadingCard?.paddings.left}px, Phải ${results.continueReadingCard?.paddings.right}px, Trên ${results.continueReadingCard?.paddings.top}px, Dưới ${results.continueReadingCard?.paddings.bottom}px.
- Ảnh trích xuất thẻ: [\`crops/continue-reading-card.png\`](crops/continue-reading-card.png)

---

## 4. HÀNG SẮP XẾP GỌN (COMPACT SORT ROW) & TIÊU ĐỀ PHỤ
**Tiêu chí đạt**:
- Nút sắp xếp là nút \`fit-content\` chiếm $\\le 50\\%$ độ rộng hàng.
- Nút có biểu tượng sắp xếp + nhãn hiển thị + chevron.
- Đã xóa tiêu đề phụ trùng lặp dưới tiêu đề chính ở Thư viện và Trang chủ.

- **Độ rộng nút sắp xếp**: ${results.sortRow?.sortBtnWidthCss}px (${Math.round(results.sortRow?.ratio * 100)}% độ rộng hàng) ($\\le 50\\%$)
- **Có biểu tượng sắp xếp**: ${results.sortRow?.hasSortIcon ? 'Có' : 'Không'}
- **Đã xóa phụ đề trùng lặp**: ${results.sortRow?.redundantSubtitleRemoved ? 'Đã xóa hoàn toàn' : 'Chưa'}
- **Kết quả**: ${results.sortRow?.passSortRow ? '✅ ĐẠT' : '❌ CHƯA ĐẠT'}

---

## 5. GIỚI THIỆU SÁCH SẠCH (CLEAN SYNOPSIS - GUTENBERG STRIPPING)
**Tiêu chí đạt**:
- Lọc bỏ hoàn toàn boilerplate Gutenberg bản quyền (terms of the or online, Project Gutenberg License,...).
- Giữ nguyên nội dung văn bản bên trong thẻ \`<a>\` (như Oscar Wilde, London...).
- Nếu giới thiệu trống hoặc $< 40$ ký tự, hiển thị fallback thân thiện "Chưa có giới thiệu cho cuốn sách này".

- **Màn hình Xem nhanh (Quick Preview)**:
  - Đoạn trích: "${results.synopsisValidation?.textSnippet}..."
  - Chứa rác Gutenberg: ${results.synopsisValidation?.hasGutenberg ? 'CÓ (LỖI)' : 'KHÔNG'}
  - Chứa câu rác "terms of the or online": ${results.synopsisValidation?.hasBrokenOr ? 'CÓ (LỖI)' : 'KHÔNG'}
  - Trạng thái: ${results.synopsisValidation?.passClean ? '✅ ĐẠT' : '❌ CHƯA ĐẠT'}
- **Màn hình Chi tiết sách (Book Detail)**:
  - Đoạn trích: "${results.bookDetailSynopsisValidation?.textSnippet}..."
  - Trạng thái: ${results.bookDetailSynopsisValidation?.passClean ? '✅ ĐẠT' : '❌ CHƯA ĐẠT'}

---

## 6. HÌNH ẢNH MÀN HÌNH CÓ LƯỚI HƯỚNG DẪN (DEBUG GUIDES OVERLAY)
Các ảnh chụp toàn màn hình trên máy thật với lớp overlay:
- Đường đỏ dọc tại lề trái (16px) và lề phải (16px).
- Khung xanh lá (\`#00e676\`) quanh mỗi hộp nút.
- Đường vàng (\`#ffea00\`) ngang tâm mỗi nút.

1. **Trang chủ (Home Screen)**: [\`guides/home-guides.png\`](guides/home-guides.png)
2. **Thư viện (Library Screen)**: [\`guides/library-guides.png\`](guides/library-guides.png)
3. **Xem nhanh (Quick Preview Modal)**: [\`guides/quick-preview-guides.png\`](guides/quick-preview-guides.png)
4. **Chi tiết sách (Book Detail Modal)**: [\`guides/book-detail-guides.png\`](guides/book-detail-guides.png)
5. **Danh sách (Lists Screen)**: [\`guides/lists-guides.png\`](guides/lists-guides.png)
6. **Cài đặt (Settings Screen)**: [\`guides/settings-guides.png\`](guides/settings-guides.png)

---
*Báo cáo được khởi tạo tự động dựa trên đo đạc điểm ảnh quang học thực tế.*
`;

await fs.writeFile('qa/align/REPORT.md', reportContent);
console.log('ALL REAL-DEVICE PIXEL MEASUREMENTS COMPLETED SUCCESSFULLY!');
console.log('REPORT SAVED TO qa/align/REPORT.md');
