import { PNG } from 'pngjs';
import fs from 'node:fs';

const png = PNG.sync.read(fs.readFileSync('qa/align/crops/home-avatar.png'));
console.log('Avatar crop dimensions: width =', png.width, 'height =', png.height);

let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;

const bg = [png.data[4], png.data[5], png.data[6]];
console.log('Sampled bg:', bg);

for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const idx = (y * png.width + x) * 4;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    const diff = Math.sqrt((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2);
    if (diff > 35) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
console.log({ minX, maxX, minY, maxY, glyphWidth: maxX - minX });
