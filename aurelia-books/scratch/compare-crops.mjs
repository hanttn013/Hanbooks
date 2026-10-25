import { PNG } from 'pngjs';
import fs from 'node:fs';

const docPng = PNG.sync.read(fs.readFileSync('qa/align/crops/qp-button--c.png'));
const ctPng = PNG.sync.read(fs.readFileSync('qa/align/crops/qp-button-chi-ti-t-s-ch.png'));

console.log('Doc (accent): width =', docPng.width, 'height =', docPng.height);
console.log('Chi tiet (secondary): width =', ctPng.width, 'height =', ctPng.height);
