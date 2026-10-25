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

// Inject candidate fix CSS
await evalCode(`(() => {
  let style = document.getElementById('test-align-fix');
  if (!style) {
    style = document.createElement('style');
    style.id = 'test-align-fix';
    document.head.appendChild(style);
  }
  style.textContent = \`
    button[data-rac], button {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    button[data-rac] svg, button svg {
      vertical-align: middle !important;
      display: inline-block !important;
      flex-shrink: 0 !important;
      margin: 0 !important;
    }
    button[data-rac] > span, button > span {
      display: inline-flex !important;
      align-items: center !important;
      line-height: 1 !important;
      text-box: trim-both cap alphabetic !important;
    }
  \`;
})()`);

await new Promise(r => setTimeout(r, 200));

const measured = await evalCode(`(() => {
  const b = Array.from(document.querySelectorAll('button')).find(btn => (btn.innerText || '').includes('Nhập tài liệu'));
  if (!b) return null;
  const br = b.getBoundingClientRect();
  const svg = b.querySelector('svg');
  const span = b.querySelector('span');
  const sr = svg ? svg.getBoundingClientRect() : null;
  const spr = span ? span.getBoundingClientRect() : null;

  return {
    button: { top: br.top, bottom: br.bottom, height: br.height, center: br.top + br.height / 2 },
    svg: sr ? { top: sr.top, bottom: sr.bottom, height: sr.height, center: sr.top + sr.height / 2, topPad: sr.top - br.top, botPad: br.bottom - sr.bottom } : null,
    span: spr ? { top: spr.top, bottom: spr.bottom, height: spr.height, center: spr.top + spr.height / 2, topPad: spr.top - br.top, botPad: br.bottom - spr.bottom } : null,
    centerDiff: (sr && spr) ? Math.abs((sr.top + sr.height / 2) - (spr.top + spr.height / 2)) : null,
    contentTopPad: Math.min(sr?.top ?? 9999, spr?.top ?? 9999) - br.top,
    contentBotPad: br.bottom - Math.max(sr?.bottom ?? -9999, spr?.bottom ?? -9999),
  };
})()`);

console.log('MEASURED AFTER FIX:', JSON.stringify(measured, null, 2));

ws.close();
