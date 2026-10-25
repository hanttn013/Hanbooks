import { execSync } from 'node:child_process';
import { PNG } from 'pngjs';
import fs from 'node:fs/promises';

const ADB = 'E:\\Personal_pj\\Hanbook\\.android-sdk\\platform-tools\\adb.exe';
execSync(`"${ADB}" forward tcp:9223 localabstract:webview_devtools_remote_21263`);

// Capture screenshot from device
console.log('Capturing screencap from device...');
const pngBuf = execSync(`"${ADB}" exec-out screencap -p`, { maxBuffer: 15 * 1024 * 1024 });
const png = PNG.sync.read(pngBuf);
console.log(`Screenshot size: ${png.width}x${png.height}`);

// Connect to CDP to find "Nhập tài liệu"
const res = await fetch('http://127.0.0.1:9223/json/list');
const targets = await res.json();
const target = targets.find(t => t.type === 'page');

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

async function evalCode(code) {
  const result = await send('Runtime.evaluate', {
    expression: code,
    returnByValue: true,
    awaitPromise: true,
  });
  return result.result?.value;
}

const rectInfo = await evalCode(`(() => {
  const b = Array.from(document.querySelectorAll('button')).find(btn => (btn.innerText || '').includes('Nhập tài liệu'));
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return {
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height }
  };
})()`);

console.log('Rect info:', rectInfo);

const scale = png.width / rectInfo.windowWidth;
console.log('Effective scale:', scale);

const bx = Math.round(rectInfo.rect.left * scale);
const by = Math.round(rectInfo.rect.top * scale);
const bw = Math.round(rectInfo.rect.width * scale);
const bh = Math.round(rectInfo.rect.height * scale);

console.log(`Button box on image: x=${bx}, y=${by}, w=${bw}, h=${bh}`);

// Sample background color from button corners
function getPixel(x, y) {
  const idx = (png.width * y + x) << 2;
  return [png.data[idx], png.data[idx + 1], png.data[idx + 2], png.data[idx + 3]];
}

const bg = getPixel(bx + Math.round(bw / 2), by + Math.round(bh / 2));
console.log('Sampled center/bg color:', bg);

ws.close();
