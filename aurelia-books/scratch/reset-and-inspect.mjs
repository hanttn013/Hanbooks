import { execSync } from 'node:child_process';
execSync('"E:\\\\Personal_pj\\\\Hanbook\\\\.android-sdk\\\\platform-tools\\\\adb.exe" -s 115662546E004421 forward tcp:9223 localabstract:webview_devtools_remote_6923');

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

// Check current URL and exit reader if needed
await send('Runtime.evaluate', {
  expression: `(() => {
    window.location.hash = '';
    window.location.href = 'https://localhost/';
  })()`,
  awaitPromise: true
});

await new Promise(r => setTimeout(r, 1200));

const headerInfo = await send('Runtime.evaluate', {
  expression: `(() => {
    const header = document.querySelector('header');
    const actionsArea = header ? header.querySelector('[class*="actionsArea"]') : null;
    const btn = header ? header.querySelector('button') : null;
    const svg = btn ? btn.querySelector('svg') : null;
    const edgeDiv = btn ? btn.parentElement : null;

    function getInfo(el) {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        className: el.className,
        rect: { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height },
        marginRight: cs.marginRight,
        paddingRight: cs.paddingRight,
        rightFromWindow: window.innerWidth - r.right
      };
    }

    return {
      windowWidth: window.innerWidth,
      header: getInfo(header),
      actionsArea: getInfo(actionsArea),
      edgeDiv: getInfo(edgeDiv),
      btn: getInfo(btn),
      svg: getInfo(svg),
    };
  })()`,
  returnByValue: true
});

console.log(JSON.stringify(headerInfo.result.value, null, 2));
ws.close();
