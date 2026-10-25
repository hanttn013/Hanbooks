import { execSync } from 'node:child_process';

const ADB = 'E:\\Personal_pj\\Hanbook\\.android-sdk\\platform-tools\\adb.exe';
execSync(`"${ADB}" forward tcp:9223 localabstract:webview_devtools_remote_21263`);

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

const buttons = await evalCode(`(() => {
  const allBtns = Array.from(document.querySelectorAll('button'));
  return allBtns.filter(b => {
    const t = b.innerText?.trim() || b.getAttribute('aria-label') || '';
    return t.includes('Nhập') || t.includes('thêm') || t.includes('Đọc') || t.includes('More') || t.includes('tiếp');
  }).map(b => {
    const r = b.getBoundingClientRect();
    const cs = window.getComputedStyle(b);
    const svgs = Array.from(b.querySelectorAll('svg')).map(s => {
      const sr = s.getBoundingClientRect();
      const scs = window.getComputedStyle(s);
      return {
        tag: 'svg',
        rect: { top: sr.top, bottom: sr.bottom, height: sr.height, left: sr.left, right: sr.right, width: sr.width },
        styles: { verticalAlign: scs.verticalAlign, display: scs.display, margin: scs.margin }
      };
    });
    const spans = Array.from(b.querySelectorAll('span')).map(s => {
      const sr = s.getBoundingClientRect();
      const scs = window.getComputedStyle(s);
      return {
        text: s.innerText?.trim(),
        rect: { top: sr.top, bottom: sr.bottom, height: sr.height, left: sr.left, right: sr.right, width: sr.width },
        styles: { lineHeight: scs.lineHeight, display: scs.display, paddingTop: scs.paddingTop, paddingBottom: scs.paddingBottom }
      };
    });
    return {
      text: b.innerText?.trim() || b.getAttribute('aria-label') || '',
      className: b.className,
      rect: { top: r.top, bottom: r.bottom, height: r.height, left: r.left, right: r.right, width: r.width },
      styles: {
        display: cs.display,
        alignItems: cs.alignItems,
        justifyContent: cs.justifyContent,
        lineHeight: cs.lineHeight,
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        paddingTop: cs.paddingTop,
        paddingBottom: cs.paddingBottom,
      },
      svgs,
      spans,
    };
  });
})()`);

console.log(JSON.stringify(buttons, null, 2));

ws.close();
