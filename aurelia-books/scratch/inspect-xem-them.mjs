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

const info = await send('Runtime.evaluate', {
  expression: `(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('Xem thêm'));
    if (!btn) return 'not found';
    const span = btn.querySelector('span');
    const cs = window.getComputedStyle(btn);
    const scs = span ? window.getComputedStyle(span) : null;
    const r = btn.getBoundingClientRect();
    const sr = span ? span.getBoundingClientRect() : null;
    const parent = btn.parentElement;
    const pr = parent.getBoundingClientRect();

    return {
      windowWidth: window.innerWidth,
      parent: {
        className: parent.className,
        rect: { left: pr.left, right: pr.right, width: pr.width },
        marginRight: window.getComputedStyle(parent).marginRight,
      },
      btn: {
        className: btn.className,
        rect: { left: r.left, right: r.right, width: r.width },
        paddingRight: cs.paddingRight,
        paddingLeft: cs.paddingLeft,
      },
      span: sr ? {
        rect: { left: sr.left, right: sr.right, width: sr.width },
        rightFromWindow: window.innerWidth - sr.right,
      } : null,
      expectedMarginFromWindow: 16,
    };
  })()`,
  returnByValue: true
});

console.log(JSON.stringify(info.result.value, null, 2));
ws.close();
