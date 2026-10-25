import { execSync } from 'node:child_process';

const ADB = 'E:\\Personal_pj\\Hanbook\\.android-sdk\\platform-tools\\adb.exe';
execSync(`"${ADB}" forward tcp:9223 localabstract:webview_devtools_remote_21263`);

const res = await fetch('http://127.0.0.1:9223/json/list');
const json = await res.json();
console.log('Successfully connected to CDP! Targets:', json.length);
console.log(json.map(t => ({ title: t.title, url: t.url, type: t.type })));
