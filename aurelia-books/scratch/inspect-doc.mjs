import { PNG } from 'pngjs';
import fs from 'node:fs';

const png = PNG.sync.read(fs.readFileSync('qa/align/crops/qp-button--c.png'));
const bg = [png.data[4], png.data[5], png.data[6]];

let minY = Infinity, maxY = -Infinity;
for (let y = 3; y < png.height - 3; y++) {
  for (let x = 3; x < png.width - 3; x++) {
    const idx = (y * png.width + x) * 4;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    const diff = Math.sqrt((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2);
    if (diff > 35) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
console.log('Doc:', { minY, maxY, topPad: minY, botPad: png.height - maxY, diff: Math.abs(minY - (png.height - maxY)) });
