import { execSync } from 'node:child_process';
import { PNG } from 'pngjs';
import fs from 'node:fs';

const ADB = 'E:\\Personal_pj\\Hanbook\\.android-sdk\\platform-tools\\adb.exe';
execSync(`"${ADB}" -s 115662546E004421 forward tcp:9223 localabstract:webview_devtools_remote_6923`);

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

// 1. Open quick preview if not open
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

// Apply style dynamically to test
await send('Runtime.evaluate', {
  expression: `(() => {
    let s = document.getElementById('test-tune-style');
    if (!s) {
      s = document.createElement('style');
      s.id = 'test-tune-style';
      document.head.appendChild(s);
    }
    s.innerHTML = 'button > span, button[data-rac] > span, [role="button"] > span { transform: translateY(1.5px) !important; }';
  })()`,
  awaitPromise: true
});

await new Promise(r => setTimeout(r, 400));

// Get rect
const btnInfo = await send('Runtime.evaluate', {
  expression: `(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('Chi tiết sách'));
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
  })()`,
  returnByValue: true
});

const pngBuf = execSync(`"${ADB}" -s 115662546E004421 exec-out screencap -p`, { maxBuffer: 20 * 1024 * 1024 });
const png = PNG.sync.read(pngBuf);
const winWidth = 392.727294921875;
const scale = png.width / winWidth;

const r = btnInfo.result.value;
const bx = Math.round(r.left * scale);
const by = Math.round(r.top * scale);
const bw = Math.round(r.width * scale);
const bh = Math.round(r.height * scale);

// Sample background inside button (at bx+15, by+bh/2)
const idxBg = (Math.round(by + bh / 2) * png.width + (bx + 15)) * 4;
const bg = [png.data[idxBg], png.data[idxBg + 1], png.data[idxBg + 2]];

let minY = Infinity, maxY = -Infinity;
for (let y = 3; y < bh - 3; y++) {
  for (let x = 3; x < bw - 3; x++) {
    const idx = ((by + y) * png.width + (bx + x)) * 4;
    const pr = png.data[idx];
    const pg = png.data[idx + 1];
    const pb = png.data[idx + 2];
    const diff = Math.sqrt((pr - bg[0]) ** 2 + (pg - bg[1]) ** 2 + (pb - bg[2]) ** 2);
    if (diff > 45) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

const topPad = minY;
const botPad = bh - maxY;
const padDiff = Math.abs(topPad - botPad);

console.log('WITH translateY(1.5px) ON REAL PHYSICAL PIXELS:', {
  buttonBox: { bx, by, bw, bh },
  minY, maxY, topPad, botPad, padDiff,
  passPadding: padDiff <= 2
});

// Close sheet
await send('Runtime.evaluate', {
  expression: `(() => {
    const btn = document.querySelector('[role="dialog"] button[aria-label*="Đóng"], [class*="sheet"] button[aria-label*="Đóng"]');
    if (btn) btn.click();
  })()`,
  awaitPromise: true
});

ws.close();
