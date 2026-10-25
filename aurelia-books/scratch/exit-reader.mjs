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

// Exit reader by history.back
await send('Runtime.evaluate', {
  expression: `window.history.back()`,
  awaitPromise: true
});

await new Promise(r => setTimeout(r, 1000));

const status = await send('Runtime.evaluate', {
  expression: `(() => {
    return {
      buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText || b.getAttribute('aria-label')).slice(0, 10)
    };
  })()`,
  returnByValue: true
});

console.log(JSON.stringify(status.result.value, null, 2));
ws.close();
