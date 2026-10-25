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

const check = await evalCode(`(() => {
  return {
    userAgent: navigator.userAgent,
    supportsTextBoxTrim: CSS.supports('text-box', 'trim-both cap alphabetic'),
    supportsTextBoxEdge: CSS.supports('text-box-edge', 'cap alphabetic'),
    supportsTextBoxTrimProp: CSS.supports('text-box-trim', 'both'),
    supportsCap: CSS.supports('line-height: 1cap'),
  };
})()`);

console.log(JSON.stringify(check, null, 2));

ws.close();
