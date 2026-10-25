import { execSync } from 'node:child_process';
import fs from 'node:fs';

const ADB = 'E:\\Personal_pj\\Hanbook\\.android-sdk\\platform-tools\\adb.exe';
const DEVICE = '192.168.1.16:39407';

try {
  execSync(`"${ADB}" connect ${DEVICE}`, { encoding: 'utf8' });
} catch (e) {
  console.warn('Connect warning:', e.message);
}

const pngBuf = execSync(`"${ADB}" -s ${DEVICE} exec-out screencap -p`);
fs.writeFileSync('qa/test-device.png', pngBuf);
const w = pngBuf.readUInt32BE(16);
const h = pngBuf.readUInt32BE(20);
console.log(`Saved qa/test-device.png (${pngBuf.length} bytes), Resolution: ${w}x${h}`);
