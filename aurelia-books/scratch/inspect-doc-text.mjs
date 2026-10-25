import { PNG } from 'pngjs';
import fs from 'node:fs';

const png = PNG.sync.read(fs.readFileSync('qa/align/crops/qp-button--c.png'));
// Sample background inside the button (e.g. at x=20, y=60)
const bg = [png.data[(60 * png.width + 20) * 4], png.data[(60 * png.width + 20) * 4 + 1], png.data[(60 * png.width + 20) * 4 + 2]];
console.log('Inside button bg (accent):', bg);

let minY = Infinity, maxY = -Infinity;
for (let y = 10; y < png.height - 10; y++) {
  for (let x = 10; x < png.width - 10; x++) {
    const idx = (y * png.width + x) * 4;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    const diff = Math.sqrt((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2);
    if (diff > 50) { // white text on terracotta
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
console.log('Doc text ink:', { minY, maxY, topPad: minY, botPad: png.height - maxY, diff: Math.abs(minY - (png.height - maxY)) });
