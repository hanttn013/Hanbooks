import { execSync } from 'node:child_process';
import { PNG } from 'pngjs';
import fs from 'node:fs/promises';

const ADB = 'E:\\Personal_pj\\Hanbook\\.android-sdk\\platform-tools\\adb.exe';
execSync(`"${ADB}" forward tcp:9223 localabstract:webview_devtools_remote_21263`);

const pngBuf = execSync(`"${ADB}" exec-out screencap -p`, { maxBuffer: 15 * 1024 * 1024 });
const png = PNG.sync.read(pngBuf);

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
  const svg = b.querySelector('svg');
  const span = b.querySelector('span');
  return {
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    buttonRect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height },
    svgRect: svg ? { top: svg.getBoundingClientRect().top, bottom: svg.getBoundingClientRect().bottom, left: svg.getBoundingClientRect().left, right: svg.getBoundingClientRect().right, width: svg.getBoundingClientRect().width, height: svg.getBoundingClientRect().height } : null,
    spanRect: span ? { top: span.getBoundingClientRect().top, bottom: span.getBoundingClientRect().bottom, left: span.getBoundingClientRect().left, right: span.getBoundingClientRect().right, width: span.getBoundingClientRect().width, height: span.getBoundingClientRect().height } : null,
  };
})()`);

console.log('rectInfo:', JSON.stringify(rectInfo, null, 2));
const scale = png.width / rectInfo.windowWidth;

// Crop function
function measureButton(name, r, svgR, spanR) {
  const bx = Math.round(r.left * scale);
  const by = Math.round(r.top * scale);
  const bw = Math.round(r.width * scale);
  const bh = Math.round(r.height * scale);

  function getPix(px, py) {
    const idx = (py * png.width + px) * 4;
    return [png.data[idx], png.data[idx + 1], png.data[idx + 2], png.data[idx + 3]];
  }

  // Sample background color inside button (away from border)
  const bg = getPix(bx + 10, by + Math.round(bh / 2));
  console.log('Button background RGB:', bg);

  // Find all ink pixels (ignore outer 3px border)
  const marginInset = 3;
  let allMinY = Infinity, allMaxY = -Infinity;
  let allMinX = Infinity, allMaxX = -Infinity;
  let iconMinY = Infinity, iconMaxY = -Infinity;
  let textMinY = Infinity, textMaxY = -Infinity;

  // Split x boundary between icon and text if svgR and spanR exist
  const splitX = svgR && spanR ? Math.round(((svgR.right + spanR.left) / 2) * scale) : bx + bw / 2;

  // Save cropped button PNG
  const crop = new PNG({ width: bw, height: bh });

  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const srcIdx = ((by + y) * png.width + (bx + x)) << 2;
      const dstIdx = (y * bw + x) << 2;
      const pr = png.data[srcIdx];
      const pg = png.data[srcIdx + 1];
      const pb = png.data[srcIdx + 2];
      const pa = png.data[srcIdx + 3];

      crop.data[dstIdx] = pr;
      crop.data[dstIdx + 1] = pg;
      crop.data[dstIdx + 2] = pb;
      crop.data[dstIdx + 3] = pa;

      // Check if within inset
      if (x >= marginInset && x < bw - marginInset && y >= marginInset && y < bh - marginInset) {
        // Color diff against bg
        const diff = Math.sqrt((pr - bg[0]) ** 2 + (pg - bg[1]) ** 2 + (pb - bg[2]) ** 2);
        if (diff > 35) {
          // Ink pixel!
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
  }

  const topPad = allMinY - by;
  const botPad = (by + bh) - allMaxY;
  const padDiff = Math.abs(topPad - botPad);
  const iconCenter = (iconMinY + iconMaxY) / 2;
  const textCenter = (textMinY + textMaxY) / 2;
  const iconTextCenterDiff = Math.abs(iconCenter - textCenter);

  return {
    name,
    buttonBox: { x: bx, y: by, w: bw, h: bh },
    inkBox: { minY: allMinY, maxY: allMaxY, minX: allMinX, maxX: allMaxX },
    topPad,
    botPad,
    padDiff,
    iconCenter,
    textCenter,
    iconTextCenterDiff,
    crop,
  };
}

const m = measureButton('Nhập tài liệu', rectInfo.buttonRect, rectInfo.svgRect, rectInfo.spanRect);
console.log('MEASUREMENT ON CURRENT PHYSICAL PIXELS:');
console.log({
  name: m.name,
  buttonHeight: m.buttonBox.h,
  topPadPx: m.topPad,
  botPadPx: m.botPad,
  paddingDiffPx: m.padDiff,
  iconCenterY: m.iconCenter,
  textCenterY: m.textCenter,
  iconTextCenterDiffPx: m.iconTextCenterDiff,
  passPadding: m.padDiff <= 2,
  passCenter: m.iconTextCenterDiff <= 3,
});

ws.close();
