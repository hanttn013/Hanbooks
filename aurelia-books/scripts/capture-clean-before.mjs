// scripts/capture-clean-before.mjs
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ADB_PATH = 'E:\\Personal_pj\\Hanbook\\.android-sdk\\platform-tools\\adb.exe';
const DEVICE = '192.168.1.80:45577';
const FORWARD_PORT = 9226;
const OUT_DIR = 'qa/design/before-clean';

function adb(cmd) {
  return execSync(`"${ADB_PATH}" -s ${DEVICE} ${cmd}`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
}

function ensureConnected() {
  try {
    execSync(`"${ADB_PATH}" connect ${DEVICE}`, { encoding: 'utf8' });
  } catch {}
}

async function getCdpSession() {
  ensureConnected();
  // Snooze heads-up adb notification
  try {
    adb("shell \"cmd notification snooze --for 3600000 '-1|android|62|null|1000'\"");
  } catch {}

  const sockets = adb('shell "cat /proc/net/unix | grep devtools"');
  const match = sockets.match(/@webview_devtools_remote_(\d+)/);
  if (!match) throw new Error('WebView devtools remote socket not found.');
  const pid = match[1];
  adb(`forward tcp:${FORWARD_PORT} localabstract:webview_devtools_remote_${pid}`);
  const res = await fetch(`http://127.0.0.1:${FORWARD_PORT}/json`);
  const targets = await res.json();
  const page = targets.find(t => t.url?.includes('localhost') || t.type === 'page') || targets[0];
  if (!page?.webSocketDebuggerUrl) throw new Error('No webSocketDebuggerUrl found');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();

  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });

  ws.addEventListener('message', event => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.error.message));
      else p.resolve(msg.result);
    }
  });

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      id += 1;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description || 'Evaluation error');
    }
    return res.result?.value;
  }

  return { send, evaluate, close: () => ws.close() };
}

function captureDevicePng(filename) {
  const localPath = path.join(OUT_DIR, filename);
  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  adb('shell screencap -p /sdcard/temp_shot.png');
  adb(`pull /sdcard/temp_shot.png "${localPath}"`);
  adb('shell rm /sdcard/temp_shot.png');
  console.log(`Saved: ${localPath}`);
}

async function captureMode(mode, cdp) {
  console.log(`\n================ CAPTURING ${mode.toUpperCase()} MODE ================`);
  // Set app theme in localStorage & documentElement
  await cdp.evaluate(`
    (() => {
      try {
        const stored = JSON.parse(localStorage.getItem('shanbooks_settings') || '{}');
        stored.appTheme = '${mode}';
        localStorage.setItem('shanbooks_settings', JSON.stringify(stored));
        document.documentElement.setAttribute('data-app-theme', '${mode}');
        const frame = document.getElementById('phone-frame');
        if (frame) frame.setAttribute('data-app-theme', '${mode}');
      } catch (e) {
        console.error(e);
      }
    })()
  `);
  await new Promise(r => setTimeout(r, 600));

  // Close reader/modals if open
  await cdp.evaluate(`
    (() => {
      const backBtn = document.querySelector('button[aria-label*="Back"], button[class*="backBtn"]');
      if (backBtn) backBtn.click();
      const closeBtn = document.querySelector('button[aria-label*="Close"], button[class*="closeButton"]');
      if (closeBtn) closeBtn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 600));

  // 1. Home tab
  await cdp.evaluate(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('button[data-tab="home"]'));
      const tab = tabs.find(b => b.offsetWidth > 0 && b.offsetHeight > 0) || tabs[0];
      if (tab) tab.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 800));
  captureDevicePng(`${mode}/01-home.png`);

  // 2. Library tab
  await cdp.evaluate(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('button[data-tab="library"]'));
      const tab = tabs.find(b => b.offsetWidth > 0 && b.offsetHeight > 0) || tabs[0];
      if (tab) tab.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 800));
  captureDevicePng(`${mode}/02-library.png`);

  // 3. Lists tab
  await cdp.evaluate(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('button[data-tab="lists"]'));
      const tab = tabs.find(b => b.offsetWidth > 0 && b.offsetHeight > 0) || tabs[0];
      if (tab) tab.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 800));
  captureDevicePng(`${mode}/03-lists.png`);

  // 4. Settings tab (Top)
  await cdp.evaluate(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('button[data-tab="settings"]'));
      const tab = tabs.find(b => b.offsetWidth > 0 && b.offsetHeight > 0) || tabs[0];
      if (tab) tab.click();
      const scrollable = document.querySelector('.screen-scroll') || document.scrollingElement;
      if (scrollable) scrollable.scrollTop = 0;
    })()
  `);
  await new Promise(r => setTimeout(r, 800));
  captureDevicePng(`${mode}/04-settings-top.png`);

  // 5. Settings tab (Bottom)
  await cdp.evaluate(`
    (() => {
      const scrollable = document.querySelector('.screen-scroll') || document.scrollingElement;
      if (scrollable) scrollable.scrollTop = scrollable.scrollHeight;
    })()
  `);
  await new Promise(r => setTimeout(r, 800));
  captureDevicePng(`${mode}/05-settings-bottom.png`);

  // 6. Book Detail Modal (switch to Library, click info on first book)
  await cdp.evaluate(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('button[data-tab="library"]'));
      const tab = tabs.find(b => b.offsetWidth > 0 && b.offsetHeight > 0) || tabs[0];
      if (tab) tab.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 800));
  await cdp.evaluate(`
    (() => {
      const card = document.querySelector('article');
      const infoBtn = card?.querySelector('button[aria-label*="Book info"]');
      if (infoBtn) infoBtn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1000));
  captureDevicePng(`${mode}/06-book-detail.png`);

  // 7. Reader (first page)
  await cdp.evaluate(`
    (() => {
      const modal = document.querySelector('[role="dialog"]');
      const startBtn = modal?.querySelector('button[class*="startReadingBtn"]');
      if (startBtn) startBtn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 3500));
  captureDevicePng(`${mode}/07-reader-page.png`);

  // 8. Reader (when chrome shown) - tap in center
  adb('shell input tap 540 1200');
  await new Promise(r => setTimeout(r, 1000));
  captureDevicePng(`${mode}/08-reader-chrome.png`);

  // Press Back key to exit reader
  adb('shell input keyevent 4');
  await new Promise(r => setTimeout(r, 800));
}

async function main() {
  console.log('Connecting to device via CDP...');
  const cdp = await getCdpSession();
  console.log('Connected!');

  // Capture Light Mode
  await captureMode('light', cdp);

  // Capture Dark Mode
  await captureMode('dark', cdp);

  // Restore light mode
  await cdp.evaluate(`
    (() => {
      const stored = JSON.parse(localStorage.getItem('shanbooks_settings') || '{}');
      stored.appTheme = 'light';
      localStorage.setItem('shanbooks_settings', JSON.stringify(stored));
      document.documentElement.setAttribute('data-app-theme', 'light');
    })()
  `);

  cdp.close();
  console.log('\n>>> All clean before screenshots captured successfully!');
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
