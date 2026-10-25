import { execSync } from 'node:child_process';
execSync('"E:\\\\Personal_pj\\\\Hanbook\\\\.android-sdk\\\\platform-tools\\\\adb.exe" -s 115662546E004421 forward tcp:9223 localabstract:webview_devtools_remote_6923');

const res = await fetch('http://127.0.0.1:9223/json/list');
const targets = await res.json();
const target = targets.find(t => t.type === 'page');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));

let id = 1;
function send(method, params = {}) {
  return new Promise((resolve) => {
    const cur = id++;
    const handler = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === cur) {
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: cur, method, params }));
  });
}

// 1. Go to Library
await send('Runtime.evaluate', {
  expression: `(() => {
    const tab = document.querySelector('[data-tab="library"], button[aria-label="Library"]');
    if (tab) tab.click();
  })()`,
  awaitPromise: true
});

await new Promise(r => setTimeout(r, 600));

// 2. Open quick preview by contextmenu
await send('Runtime.evaluate', {
  expression: `(() => {
    const card = document.querySelector('[class*="bookCard"], [class*="book_card"]');
    if (card) {
      card.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    }
  })()`,
  awaitPromise: true
});

await new Promise(r => setTimeout(r, 600));

// 3. Click "Chi tiết sách" inside quick preview
await send('Runtime.evaluate', {
  expression: `(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('Chi tiết sách'));
    if (btn) btn.click();
  })()`,
  awaitPromise: true
});

await new Promise(r => setTimeout(r, 1000));

// 4. Measure BookDetailModal Back and Fav buttons
const info = await send('Runtime.evaluate', {
  expression: `(() => {
    const backBtn = document.querySelector('header button[aria-label*="Quay lại"], header button[aria-label*="Back"], [class*="topBar"] button:first-child');
    const favBtn = document.querySelector('header button[aria-label*="Yêu thích"], header button[aria-label*="Favorite"], [class*="topBar"] button:last-child');

    const backSvg = backBtn ? backBtn.querySelector('svg') : null;
    const favSvg = favBtn ? favBtn.querySelector('svg') : null;

    const bsr = backSvg ? backSvg.getBoundingClientRect() : null;
    const fsr = favSvg ? favSvg.getBoundingClientRect() : null;

    return {
      windowWidth: window.innerWidth,
      backSvg: bsr ? {
        rect: { left: bsr.left, right: bsr.right, width: bsr.width },
        leftFromWindow: bsr.left,
        diffCss: Math.abs(bsr.left - 16)
      } : null,
      favSvg: fsr ? {
        rect: { left: fsr.left, right: fsr.right, width: fsr.width },
        rightFromWindow: window.innerWidth - fsr.right,
        diffCss: Math.abs((window.innerWidth - fsr.right) - 16)
      } : null,
    };
  })()`,
  returnByValue: true
});

console.log(JSON.stringify(info.result.value, null, 2));

// Close detail
await send('Runtime.evaluate', {
  expression: `(() => {
    const backBtn = document.querySelector('header button[aria-label*="Quay lại"], header button[aria-label*="Back"], [class*="topBar"] button:first-child');
    if (backBtn) backBtn.click();
  })()`,
  awaitPromise: true
});

ws.close();
