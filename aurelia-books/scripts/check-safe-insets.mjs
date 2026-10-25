// scripts/check-safe-insets.mjs
import { execSync } from 'node:child_process';

const adbPath = 'E:\\Personal_pj\\Hanbook\\.android-sdk\\platform-tools\\adb.exe';
const device = '192.168.1.80:45577';

try {
  execSync(`"${adbPath}" connect ${device}`, { encoding: 'utf8' });
} catch {}

const sockets = execSync(`"${adbPath}" -s ${device} shell "cat /proc/net/unix | grep devtools"`).toString();
const match = sockets.match(/@webview_devtools_remote_(\d+)/);
if (!match) {
  console.error('No devtools');
  process.exit(1);
}
const pid = match[1];
execSync(`"${adbPath}" -s ${device} forward tcp:9226 localabstract:webview_devtools_remote_${pid}`);

const res = await fetch('http://127.0.0.1:9226/json');
const targets = await res.json();
const page = targets.find(t => t.url?.includes('localhost') || t.type === 'page') || targets[0];
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

function send(method, params = {}) {
  return new Promise((resolve) => {
    const id = Math.floor(Math.random() * 100000);
    const handler = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalJs(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  return r.result?.value;
}

const safeInsets = await evalJs(`
  (() => {
    const el = document.createElement("div");
    el.style.position = "fixed";
    el.style.top = "0";
    el.style.left = "0";
    el.style.paddingTop = "env(safe-area-inset-top, 0px)";
    el.style.paddingBottom = "env(safe-area-inset-bottom, 0px)";
    el.style.paddingLeft = "env(safe-area-inset-left, 0px)";
    el.style.paddingRight = "env(safe-area-inset-right, 0px)";
    document.body.appendChild(el);
    const style = window.getComputedStyle(el);
    const insets = {
      top: style.paddingTop,
      bottom: style.paddingBottom,
      left: style.paddingLeft,
      right: style.paddingRight
    };
    document.body.removeChild(el);
    return insets;
  })()
`);

console.log('SAFE AREA INSETS ON DEVICE:', safeInsets);

const viewportMeta = await evalJs(`
  document.querySelector('meta[name="viewport"]')?.getAttribute('content')
`);
console.log('VIEWPORT META:', viewportMeta);

ws.close();
