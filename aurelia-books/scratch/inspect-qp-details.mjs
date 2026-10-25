import { execSync } from 'node:child_process';
execSync('"E:\\\\Personal_pj\\\\Hanbook\\\\.android-sdk\\\\platform-tools\\\\adb.exe" -s 115662546E004421 forward tcp:9223 localabstract:webview_devtools_remote_31681');

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

// 1. Go to library
await send('Runtime.evaluate', {
  expression: `(() => {
    const tab = document.querySelector('[data-tab="library"], button[aria-label="Library"]');
    if (tab) tab.click();
  })()`,
  awaitPromise: true
});

await new Promise(r => setTimeout(r, 800));

// 2. Open quick preview by triggering long press on first card
await send('Runtime.evaluate', {
  expression: `(() => {
    const card = document.querySelector('[class*="bookCard"], [class*="book_card"]');
    if (card) {
      card.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    }
  })()`,
  awaitPromise: true
});

await new Promise(r => setTimeout(r, 1000));

// 3. Inspect "Chi tiết sách"
const inspectResult = await send('Runtime.evaluate', {
  expression: `(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('Chi tiết sách'));
    if (!btn) return 'button not found';
    const r = btn.getBoundingClientRect();
    const cs = window.getComputedStyle(btn);

    const children = Array.from(btn.childNodes).map(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        return { type: 'text', text: node.textContent };
      }
      const nr = node.getBoundingClientRect ? node.getBoundingClientRect() : null;
      const ncs = window.getComputedStyle ? window.getComputedStyle(node) : null;
      return {
        type: 'element',
        tag: node.tagName,
        className: node.className,
        rect: nr ? { top: nr.top, bottom: nr.bottom, left: nr.left, right: nr.right, width: nr.width, height: nr.height } : null,
        display: ncs ? ncs.display : null,
        lineHeight: ncs ? ncs.lineHeight : null,
        padding: ncs ? ncs.padding : null,
        margin: ncs ? ncs.margin : null,
        textBox: ncs ? ncs.textBox : null,
        textBoxTrim: ncs ? ncs.textBoxTrim : null,
        textBoxEdge: ncs ? ncs.textBoxEdge : null,
      };
    });

    return {
      btn: {
        className: btn.className,
        rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height },
        display: cs.display,
        alignItems: cs.alignItems,
        justifyContent: cs.justifyContent,
        padding: cs.padding,
        paddingTop: cs.paddingTop,
        paddingBottom: cs.paddingBottom,
        lineHeight: cs.lineHeight,
        fontSize: cs.fontSize,
      },
      children
    };
  })()`,
  returnByValue: true
});

console.log(JSON.stringify(inspectResult.result.value, null, 2));
ws.close();
