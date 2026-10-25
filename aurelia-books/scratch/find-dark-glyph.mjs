import { PNG } from 'pngjs';
import fs from 'node:fs';

const png = PNG.sync.read(fs.readFileSync('qa/align/crops/sheet-close-x.png'));

let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;

for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const idx = (y * png.width + x) * 4;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    // Dark ink pixels
    if (r < 120 && g < 120 && b < 120) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
console.log({ minX, maxX, minY, maxY, glyphWidth: maxX - minX, glyphHeight: maxY - minY });
