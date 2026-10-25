import { PNG } from 'pngjs';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const pngBuf = execSync('"E:\\\\Personal_pj\\\\Hanbook\\\\.android-sdk\\\\platform-tools\\\\adb.exe" -s 115662546E004421 exec-out screencap -p', { maxBuffer: 20 * 1024 * 1024 });
const png = PNG.sync.read(pngBuf);

// We know from earlier CDP that the avatar SVG is at:
// left: 354.727, right: 376.727, width: 22, top: 70, bottom: 92, height: 22
const scale = png.width / 392.727294921875;
const svgLeft = Math.round(354.727294921875 * scale);
const svgRight = Math.round(376.727294921875 * scale);
const svgTop = Math.round(70 * scale);
const svgBottom = Math.round(92 * scale);

console.log({ scale, svgLeft, svgRight, svgTop, svgBottom });

let inkMaxX = -Infinity;
let inkMinX = Infinity;

for (let y = svgTop; y <= svgBottom; y++) {
  for (let x = svgLeft; x <= svgRight; x++) {
    const idx = (y * png.width + x) * 4;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    // Dark ink pixels of the avatar icon
    if (r < 100 && g < 100 && b < 100) {
      if (x > inkMaxX) inkMaxX = x;
      if (x < inkMinX) inkMinX = x;
    }
  }
}

const expectedMarginPx = Math.round(png.width - (16 * scale));
console.log({
  inkMinX,
  inkMaxX,
  expectedMarginPx,
  diffPx: Math.abs(inkMaxX - expectedMarginPx)
});
