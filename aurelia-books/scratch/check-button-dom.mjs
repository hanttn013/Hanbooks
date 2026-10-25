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

const check = await send('Runtime.evaluate', {
  expression: `(() => {
    // Open Quick preview if not open
    const card = document.querySelector('[class*="bookCard"]');
    if (card) {
      card.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    }
    const btns = Array.from(document.querySelectorAll('button'));
    const detailsBtn = btns.find(b => (b.innerText || '').includes('Chi tiết sách'));
    if (!detailsBtn) return 'not found';
    return {
      innerHTML: detailsBtn.innerHTML,
      childNodes: Array.from(detailsBtn.childNodes).map(n => ({ nodeType: n.nodeType, nodeName: n.nodeName, text: n.textContent })),
      computedPadding: window.getComputedStyle(detailsBtn).padding,
      computedAlignItems: window.getComputedStyle(detailsBtn).alignItems,
      computedJustifyContent: window.getComputedStyle(detailsBtn).justifyContent,
      computedLineHeight: window.getComputedStyle(detailsBtn).lineHeight,
      computedHeight: window.getComputedStyle(detailsBtn).height,
    };
  })()`,
  returnByValue: true
});

console.log(JSON.stringify(check.result.value, null, 2));
ws.close();
