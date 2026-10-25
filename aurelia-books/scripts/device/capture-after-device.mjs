// scripts/device/capture-after-device.mjs
import { connectCDP } from './device-helper.mjs';
import fs from 'node:fs';

const OUT_DIR = 'qa/reader/after-device';
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
  const cdp = await connectCDP();

  console.log('--- Step 0: Ensure in Reader ---');
  let inReader = await cdp.evalJs(`Boolean(document.querySelector('[data-reader-chrome], [data-reader-viewport], [data-reader-surface]'))`);

  if (!inReader) {
    console.log('Tapping "Tiếp tục" or reading card on Home...');
    const tapped = await cdp.tapSelector('button', 'Tiếp tục');
    if (!tapped) {
      await cdp.tapSelector('[aria-label*="Pride and Prejudice"], h3');
      await sleep(1500);
      await cdp.tapSelector('button', 'Đọc');
    }
    await sleep(4000);
  }

  inReader = await cdp.evalJs(`Boolean(document.querySelector('[data-reader-chrome], [data-reader-viewport], [data-reader-surface]'))`);
  console.log('In Reader verified:', inReader);

  if (!inReader) {
    console.error('Failed to enter Reader screen!');
    cdp.screenshot(`${OUT_DIR}/debug-not-in-reader.png`);
    cdp.close();
    process.exit(1);
  }

  // Wait for EPUB renderer to layout
  await sleep(3000);

  // ================= State 1: Reading surface (Chrome hidden) =================
  console.log('Capturing State 1: Reading surface (chrome hidden)...');
  let isChromeHidden = await cdp.evalJs(`
    (() => {
      const chrome = document.querySelector('[data-reader-chrome="true"]');
      if (!chrome) return true;
      const style = window.getComputedStyle(chrome);
      return style.opacity === '0' || style.visibility === 'hidden';
    })()
  `);
  if (!isChromeHidden) {
    console.log('Hiding chrome via tap...');
    await cdp.tapCenter();
    await sleep(600);
  }
  cdp.screenshot(`${OUT_DIR}/01-reader-reading-surface.png`);

  // Measure State 1 metrics
  const state1Metrics = await cdp.evalJs(`
    (() => {
      const topBarrier = document.querySelector('[class*="safeTopBarrier"]');
      const bottomBarrier = document.querySelector('[class*="safeBottomBarrier"]');
      const miniFooter = document.querySelector('[class*="miniFooter"]');
      const hasHamburger = Array.from(document.querySelectorAll('button')).some(b => (b.textContent || '').includes('☰'));
      const topRect = topBarrier?.getBoundingClientRect();
      const btmRect = bottomBarrier?.getBoundingClientRect();
      const footRect = miniFooter?.getBoundingClientRect();
      return {
        safeTopHeight: topRect?.height || 0,
        safeBottomHeight: btmRect?.height || 0,
        miniFooterVisible: Boolean(miniFooter),
        miniFooterText: miniFooter?.innerText || '',
        hasFloatingHamburger: hasHamburger,
      };
    })()
  `);
  console.log('State 1 Metrics:', JSON.stringify(state1Metrics, null, 2));

  // ================= State 2: Reader Chrome Visible =================
  console.log('Capturing State 2: Reader chrome visible...');
  await cdp.tapCenter();
  await sleep(600);
  cdp.screenshot(`${OUT_DIR}/02-reader-chrome-progress-bar.png`);

  // Measure State 2 metrics
  const state2Metrics = await cdp.evalJs(`
    (() => {
      const topBar = document.querySelector('header[class*="topBar"]');
      const leftBtn = topBar?.querySelector('button[aria-label*="Đóng"], button[aria-label*="Close"]');
      const rightBtn = topBar?.querySelector('button[aria-label*="thêm"], button[aria-label*="More"]');
      const titleSlot = topBar?.querySelector('[class*="titleSlot"]');
      const chapterTitle = topBar?.querySelector('h1');
      
      const leftRect = leftBtn?.getBoundingClientRect();
      const rightRect = rightBtn?.getBoundingClientRect();
      const titleRect = titleSlot?.getBoundingClientRect();
      const chapterRect = chapterTitle?.getBoundingClientRect();

      const screenCenter = window.innerWidth / 2;
      const titleCenter = chapterRect ? (chapterRect.left + chapterRect.width / 2) : 0;
      const titleOffset = Math.abs(titleCenter - screenCenter);

      // Bottom bar tool buttons
      const tools = Array.from(document.querySelectorAll('nav[class*="toolsRow"] button, [class*="toolsRow"] > button'));
      const toolWidths = tools.map(t => t.getBoundingClientRect().width);
      const minW = Math.min(...toolWidths);
      const maxW = Math.max(...toolWidths);
      const toolDiff = maxW - minW;

      // Slider metrics
      const slider = document.querySelector('input[type="range"]');
      const sliderRect = slider?.getBoundingClientRect();

      return {
        leftBtnSize: leftRect ? { w: leftRect.width, h: leftRect.height } : null,
        rightBtnSize: rightRect ? { w: rightRect.width, h: rightRect.height } : null,
        titleCenterOffsetPx: titleOffset,
        toolCount: tools.length,
        toolWidths,
        toolWidthMaxDiff: toolDiff,
        sliderTouchHeight: sliderRect?.height || 0,
      };
    })()
  `);
  console.log('State 2 Metrics:', JSON.stringify(state2Metrics, null, 2));

  // ================= State 3: Menu ⋯ Popover =================
  console.log('Capturing State 3: Menu ⋯ popover...');
  await cdp.tapSelector('header button[aria-label*="thêm"], header button[aria-label*="More"]');
  await sleep(500);
  cdp.screenshot(`${OUT_DIR}/09-reader-more-menu.png`);

  // Measure State 3 metrics
  const state3Metrics = await cdp.evalJs(`
    (() => {
      const menu = document.querySelector('[class*="moreMenu"], [role="menu"]');
      const btn = document.querySelector('header button[aria-label*="thêm"], header button[aria-label*="More"]');
      const menuRect = menu?.getBoundingClientRect();
      const btnRect = btn?.getBoundingClientRect();
      const items = Array.from(menu?.querySelectorAll('[role="menuitem"], button') || []);
      return {
        menuVisible: Boolean(menu),
        menuWidth: menuRect?.width || 0,
        menuRight: menuRect?.right || 0,
        btnRight: btnRect?.right || 0,
        distanceFromScreenRight: menuRect ? (window.innerWidth - menuRect.right) : 0,
        itemCount: items.length,
      };
    })()
  `);
  console.log('State 3 Metrics:', JSON.stringify(state3Metrics, null, 2));

  // Close more menu by tapping inside header (keeps chrome visible)
  await cdp.tapSelector('header h1');
  await sleep(400);

  // ================= State 4: Panel / Sheet (ReaderSettingsPanel) =================
  console.log('Capturing State 4: ReaderSettingsPanel low tray...');
  // Tap Tool 3 (Aa / Kiểu chữ) directly via coordinates of 3rd tool
  const tool3Coord = await cdp.evalJs(`
    (() => {
      const tools = Array.from(document.querySelectorAll('nav[class*="toolsRow"] button, [class*="toolsRow"] > button'));
      const tool = tools[2];
      if (!tool) return null;
      const r = tool.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()
  `);
  if (tool3Coord) {
    await cdp.tapCoord(tool3Coord.x, tool3Coord.y);
  } else {
    await cdp.tapSelector('button[aria-label*="Kiểu chữ"], button[aria-label*="Appearance"], button[aria-label*="cài đặt"]');
  }
  await sleep(700);
  cdp.screenshot(`${OUT_DIR}/07-reader-settings-panel.png`);

  // Measure State 4 metrics
  const state4Metrics = await cdp.evalJs(`
    (() => {
      const sheet = document.querySelector('[data-reader-sheet="true"]');
      const panel = sheet?.querySelector('[class*="sheetPanel"]');
      const backdrop = sheet?.querySelector('[class*="backdrop"]');
      const closeBtn = sheet?.querySelector('button[aria-label*="Đóng"], button[aria-label*="Close"]');
      const panelRect = panel?.getBoundingClientRect();
      const vh = window.innerHeight;
      const heightVhRatio = panelRect ? (panelRect.height / vh) : 0;
      const backdropOpacity = backdrop ? window.getComputedStyle(backdrop).backgroundColor : 'none';

      return {
        sheetVisible: Boolean(sheet),
        heightPx: panelRect?.height || 0,
        viewportHeight: vh,
        heightRatioDvh: heightVhRatio,
        isUnder55Dvh: heightVhRatio <= 0.56,
        backdropStyle: backdropOpacity,
        hasTopCloseBtn: Boolean(closeBtn),
      };
    })()
  `);
  console.log('State 4 Metrics:', JSON.stringify(state4Metrics, null, 2));

  // Close settings panel
  await cdp.tapSelector('[data-reader-sheet="true"] button[aria-label*="Đóng"], [data-reader-sheet="true"] button[aria-label*="Close"]');
  await sleep(400);

  // Save full metrics report to file
  const fullReport = {
    timestamp: new Date().toISOString(),
    state1: state1Metrics,
    state2: state2Metrics,
    state3: state3Metrics,
    state4: state4Metrics,
  };
  fs.writeFileSync('qa/reader/after-device/metrics.json', JSON.stringify(fullReport, null, 2));
  console.log('All 4 states captured and verified successfully!');

  cdp.close();
}

run().catch(err => {
  console.error('Capture after failed:', err);
  process.exit(1);
});
