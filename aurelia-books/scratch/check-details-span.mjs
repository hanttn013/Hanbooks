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

const check = await send('Runtime.evaluate', {
  expression: `(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('Chi tiết sách'));
    if (!btn) return 'not found';
    const span = btn.querySelector('span');
    const r = btn.getBoundingClientRect();
    const sr = span ? span.getBoundingClientRect() : null;
    return {
      btnRect: { top: r.top, bottom: r.bottom, height: r.height },
      spanRect: sr ? { top: sr.top, bottom: sr.bottom, height: sr.height } : null,
      topGap: sr ? sr.top - r.top : null,
      botGap: sr ? r.bottom - sr.bottom : null,
      gapDiff: sr ? Math.abs((sr.top - r.top) - (r.bottom - sr.bottom)) : null,
      spanPadding: span ? window.getComputedStyle(span).padding : null,
    };
  })()`,
  returnByValue: true
});

console.log(JSON.stringify(check.result.value, null, 2));

// Close sheet
await send('Runtime.evaluate', {
  expression: `(() => {
    const btn = document.querySelector('[role="dialog"] button[aria-label*="Đóng"], [class*="sheet"] button[aria-label*="Đóng"]');
    if (btn) btn.click();
  })()`,
  awaitPromise: true
});

ws.close();
