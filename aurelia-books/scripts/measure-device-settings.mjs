// scripts/measure-device-settings.mjs
import { execSync } from 'node:child_process';

const adbPath = 'E:\\Personal_pj\\Hanbook\\.android-sdk\\platform-tools\\adb.exe';
const device = '192.168.1.80:45577';

try {
  execSync(`"${adbPath}" connect ${device}`, { encoding: 'utf8' });
} catch {}

const sockets = execSync(`"${adbPath}" -s ${device} shell "cat /proc/net/unix | grep devtools"`).toString();
const match = sockets.match(/@webview_devtools_remote_(\d+)/);
if (!match) {
  console.error('No webview socket');
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

// Click settings tab
await evalJs(`
  const tabs = Array.from(document.querySelectorAll('button[data-tab="settings"]'));
  const tab = tabs.find(b => b.offsetWidth > 0 && b.offsetHeight > 0) || tabs[0];
  if (tab) tab.click();
`);
await new Promise(r => setTimeout(r, 800));

// Scroll to bottom
await evalJs(`
  const scrollable = document.querySelector('.screen-scroll') || document.scrollingElement;
  if (scrollable) scrollable.scrollTop = scrollable.scrollHeight;
`);
await new Promise(r => setTimeout(r, 500));

const check = await evalJs(`
  (() => {
    const navBar = document.querySelector('[class*="mobileTabBar"]') || document.querySelector('nav');
    const resetBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Đặt lại'));
    const deleteBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Xóa toàn bộ'));
    if (!navBar) return { error: 'No navbar' };
    const navRect = navBar.getBoundingClientRect();
    const resetRect = resetBtn?.getBoundingClientRect();
    const deleteRect = deleteBtn?.getBoundingClientRect();
    return {
      navTop: navRect.top,
      resetBottom: resetRect?.bottom,
      deleteBottom: deleteRect?.bottom,
      resetOverlaps: resetRect ? resetRect.bottom > navRect.top : false,
      deleteOverlaps: deleteRect ? deleteRect.bottom > navRect.top : false,
      clearanceBelowResetPx: resetRect ? (navRect.top - resetRect.bottom) : null,
      clearanceBelowDeletePx: deleteRect ? (navRect.top - deleteRect.bottom) : null
    };
  })()
`);

console.log('DEVICE OVERLAP MEASUREMENT:', JSON.stringify(check, null, 2));
ws.close();
