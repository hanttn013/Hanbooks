import { connectCDP, adb } from './device-helper.mjs';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const cdp = await connectCDP();

console.log('Opening More menu...');
await cdp.tapSelector('button[aria-label*="thêm"], button[aria-label*="More"]');
await sleep(800);

console.log('Tapping "Tìm trong tài liệu"...');
const tapped = await cdp.evalJs(`
  (() => {
    const items = Array.from(document.querySelectorAll('[role="menuitem"], div, span'));
    const item = items.find(el => (el.innerText || '').includes('Tìm trong tài liệu'));
    if (item) { item.click(); return true; }
    return false;
  })()
`);
console.log('Search item tapped:', tapped);
await sleep(1200);

cdp.screenshot('qa/reader/before-device/08-reader-search-modal.png');

console.log('Closing search modal...');
adb('shell input keyevent KEYCODE_BACK');
await sleep(600);

cdp.close();
