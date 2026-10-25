// scripts/device/device-helper.mjs
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const ADB = 'E:\\Personal_pj\\Hanbook\\.android-sdk\\platform-tools\\adb.exe';
export const DEVICE = '192.168.1.16:39407';
export const PACKAGE = 'com.aurelia.books.debug';
export const ACTIVITY = 'com.aurelia.books.debug/com.aurelia.books.MainActivity';

export function adb(cmd) {
  try {
    execSync(`"${ADB}" connect ${DEVICE}`, { stdio: 'pipe' });
  } catch {}
  return execSync(`"${ADB}" -s ${DEVICE} ${cmd}`, { maxBuffer: 10 * 1024 * 1024 });
}

export async function ensureAppRunning() {
  let pid = '';
  try {
    pid = adb(`shell pidof ${PACKAGE}`).toString().trim().split(/\s+/)[0];
  } catch {}
  if (!pid) {
    console.log('App not running, launching...');
    adb(`shell am start -n ${ACTIVITY}`);
    // Wait for app launch
    await new Promise(r => setTimeout(r, 4000));
  } else {
    console.log(`App is running with PID ${pid}`);
  }
}

export async function connectCDP(port = 9226) {
  await ensureAppRunning();
  try {
    adb('forward --remove-all');
  } catch {}
  let pid = '';
  try {
    pid = adb(`shell pidof ${PACKAGE}`).toString().trim().split(/\s+/)[0];
  } catch {}
  if (!pid) {
    const sockets = adb('shell "cat /proc/net/unix | grep devtools"').toString();
    const match = sockets.match(/@webview_devtools_remote_(\d+)/);
    if (!match) {
      throw new Error('No webview devtools socket found on device.');
    }
    pid = match[1];
  }
  adb(`forward tcp:${port} localabstract:webview_devtools_remote_${pid}`);

  const res = await fetch(`http://127.0.0.1:${port}/json`);
  const targets = await res.json();
  const page = targets.find(t => t.url?.includes('localhost') || t.type === 'page') || targets[0];
  if (!page) throw new Error('No page target found');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

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

  async function evalJs(expr) {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return r.result?.value;
  }

  function screenshot(destPath) {
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const buf = adb('exec-out screencap -p');
    fs.writeFileSync(destPath, buf);
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    console.log(`Screenshot saved: ${destPath} (${w}x${h}, ${buf.length} bytes)`);
    return { width: w, height: h, size: buf.length };
  }

  async function tapCoord(cssX, cssY) {
    const dpr = (await evalJs('window.devicePixelRatio')) || 2.75;
    const realX = Math.round(cssX * dpr);
    const realY = Math.round(cssY * dpr);
    adb(`shell input tap ${realX} ${realY}`);
    await new Promise(r => setTimeout(r, 400));
  }

  async function tapSelector(selector, textMatch = null) {
    const code = `
      (() => {
        const els = Array.from(document.querySelectorAll('${selector}'));
        const el = ${textMatch ? `els.find(e => (e.innerText || e.getAttribute('aria-label') || '').includes('${textMatch}'))` : 'els[0]'};
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
      })()
    `;
    const rect = await evalJs(code);
    if (!rect) {
      console.warn(`Element not found for selector: "${selector}"${textMatch ? ` text: "${textMatch}"` : ''}`);
      return false;
    }
    await tapCoord(rect.x, rect.y);
    return true;
  }

  async function tapCenter() {
    const dim = await evalJs('({ x: window.innerWidth / 2, y: window.innerHeight / 2 })');
    await tapCoord(dim.x, dim.y);
  }

  function close() {
    ws.close();
  }

  return { ws, send, evalJs, screenshot, tapCoord, tapSelector, tapCenter, close };
}
