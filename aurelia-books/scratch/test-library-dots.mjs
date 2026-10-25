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

// Switch to library
await send('Runtime.evaluate', {
  expression: `(() => {
    const tab = document.querySelector('[data-tab="library"], button[aria-label="Library"]');
    if (tab) tab.click();
  })()`,
  awaitPromise: true
});

await new Promise(r => setTimeout(r, 600));

const info = await send('Runtime.evaluate', {
  expression: `(() => {
    const btn = document.querySelector('header button[aria-label*="Tùy chọn"], header button:has(svg circle)');
    if (!btn) return 'not found';
    const svg = btn.querySelector('svg');
    const r = btn.getBoundingClientRect();
    const sr = svg ? svg.getBoundingClientRect() : null;

    return {
      windowWidth: window.innerWidth,
      btn: {
        rect: { left: r.left, right: r.right, width: r.width },
        paddingRight: window.getComputedStyle(btn).paddingRight,
        rightFromWindow: window.innerWidth - r.right,
      },
      svg: sr ? {
        rect: { left: sr.left, right: sr.right, width: sr.width },
        rightFromWindow: window.innerWidth - sr.right,
      } : null,
      expectedMarginFromWindow: 16,
      diffCss: sr ? Math.abs((window.innerWidth - sr.right) - 16) : null
    };
  })()`,
  returnByValue: true
});

console.log(JSON.stringify(info.result.value, null, 2));
ws.close();
