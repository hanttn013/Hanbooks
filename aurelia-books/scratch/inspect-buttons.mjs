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

// Navigate to library or switch tab
await evalCode(`(() => {
  const libBtn = Array.from(document.querySelectorAll('button[data-tab="library"]')).find(b => b.offsetWidth > 0);
  if (libBtn) libBtn.click();
})()`);

await new Promise(r => setTimeout(r, 800));

const buttonInfo = await evalCode(`(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  return buttons.map(b => {
    const rect = b.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const cs = window.getComputedStyle(b);
    
    // Look at child nodes
    const children = Array.from(b.childNodes).map(c => {
      if (c.nodeType === Node.TEXT_NODE) {
        return { type: 'text', text: c.textContent.trim() };
      } else if (c.nodeType === Node.ELEMENT_NODE) {
        const cRect = c.getBoundingClientRect();
        const cCs = window.getComputedStyle(c);
        return {
          type: c.tagName.toLowerCase(),
          className: c.className,
          text: c.innerText?.trim(),
          top: cRect.top,
          bottom: cRect.bottom,
          left: cRect.left,
          right: cRect.right,
          height: cRect.height,
          lineHeight: cCs.lineHeight,
          verticalAlign: cCs.verticalAlign,
          display: cCs.display,
        };
      }
      return null;
    }).filter(Boolean);

    return {
      text: b.innerText?.trim() || b.getAttribute('aria-label') || '',
      className: b.className,
      rect: { top: rect.top, bottom: rect.bottom, height: rect.height, left: rect.left, right: rect.right, width: rect.width },
      styles: {
        display: cs.display,
        alignItems: cs.alignItems,
        justifyContent: cs.justifyContent,
        paddingTop: cs.paddingTop,
        paddingBottom: cs.paddingBottom,
        paddingLeft: cs.paddingLeft,
        paddingRight: cs.paddingRight,
        height: cs.height,
        minHeight: cs.minHeight,
        lineHeight: cs.lineHeight,
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
      },
      children,
    };
  }).filter(Boolean);
})()`);

console.log(JSON.stringify(buttonInfo.slice(0, 8), null, 2));

ws.close();
