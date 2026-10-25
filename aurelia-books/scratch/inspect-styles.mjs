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

const styles = await send('Runtime.evaluate', {
  expression: `(() => {
    // If modal is not open, open it first
    let btn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('Chi tiết sách'));
    if (!btn) {
      const card = document.querySelector('[class*="bookCard"]');
      if (card) {
        const evt = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
        card.dispatchEvent(evt);
      }
      btn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('Chi tiết sách'));
    }
    if (!btn) return 'not found';
    const cs = window.getComputedStyle(btn);
    const span = btn.querySelector('span');
    const spanCs = span ? window.getComputedStyle(span) : null;
    const r = btn.getBoundingClientRect();
    const sr = span ? span.getBoundingClientRect() : null;
    return {
      btn: {
        className: btn.className,
        display: cs.display,
        alignItems: cs.alignItems,
        justifyContent: cs.justifyContent,
        height: cs.height,
        paddingTop: cs.paddingTop,
        paddingBottom: cs.paddingBottom,
        paddingLeft: cs.paddingLeft,
        paddingRight: cs.paddingRight,
        lineHeight: cs.lineHeight,
      },
      span: spanCs ? {
        className: span.className,
        display: spanCs.display,
        alignItems: spanCs.alignItems,
        lineHeight: spanCs.lineHeight,
        fontSize: spanCs.fontSize,
        textBox: spanCs.textBox,
        textBoxTrim: spanCs.textBoxTrim,
        textBoxEdge: spanCs.textBoxEdge,
        height: spanCs.height,
      } : null,
      rects: {
        btn: { top: r.top, bottom: r.bottom, height: r.height },
        span: sr ? { top: sr.top, bottom: sr.bottom, height: sr.height } : null,
        topSpace: sr ? sr.top - r.top : null,
        botSpace: sr ? r.bottom - sr.bottom : null,
        spaceDiff: sr ? (r.bottom - sr.bottom) - (sr.top - r.top) : null,
      }
    };
  })()`,
  returnByValue: true
});
console.log(JSON.stringify(styles.result.value, null, 2));
ws.close();
