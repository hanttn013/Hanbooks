import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = 'E:/Personal_pj/Hanbook';

console.log('--- 1. Analyzing Git Blobs ---');
const rawObjects = execSync('git rev-list --objects --all', { cwd: root, maxBuffer: 100 * 1024 * 1024 }).toString('utf8');
const lines = rawObjects.split('\n').filter(Boolean);

const batchInput = lines.map(l => l.split(' ')[0]).join('\n');
const batchOutput = execSync('git cat-file --batch-check="%(objectname) %(objecttype) %(objectsize) %(rest)"', {
  cwd: root,
  input: batchInput,
  maxBuffer: 100 * 1024 * 1024
}).toString('utf8');

const pathMap = new Map();
for (const line of lines) {
  const parts = line.split(' ');
  if (parts.length > 1) {
    pathMap.set(parts[0], parts.slice(1).join(' '));
  }
}

const blobs = [];
for (const line of batchOutput.split('\n')) {
  if (!line) continue;
  const [sha, type, sizeStr] = line.split(' ');
  if (type === 'blob') {
    const size = parseInt(sizeStr, 10);
    const p = pathMap.get(sha) || '(unreferenced/unknown)';
    blobs.push({ sha, size, path: p });
  }
}

blobs.sort((a, b) => b.size - a.size);
console.log('Top 20 largest blobs in git history:');
for (let i = 0; i < Math.min(20, blobs.length); i++) {
  const b = blobs[i];
  const sizeMb = (b.size / (1024 * 1024)).toFixed(2);
  console.log(`${(i + 1).toString().padStart(2)}. [${sizeMb} MB] ${b.sha.slice(0, 8)} ${b.path}`);
}

console.log('\n--- 2. Top 30 tracked files in working tree ---');
const trackedRaw = execSync('git ls-files -z', { cwd: root, maxBuffer: 50 * 1024 * 1024 }).toString('utf8');
const trackedFiles = trackedRaw.split('\0').filter(Boolean);

const trackedSizes = [];
for (const f of trackedFiles) {
  const full = path.join(root, f);
  try {
    const stat = fs.statSync(full);
    trackedSizes.push({ path: f, size: stat.size });
  } catch {}
}
trackedSizes.sort((a, b) => b.size - a.size);

console.log('Top 30 tracked files in working tree:');
for (let i = 0; i < Math.min(30, trackedSizes.length); i++) {
  const f = trackedSizes[i];
  const sizeMb = (f.size / (1024 * 1024)).toFixed(2);
  const sizeKb = (f.size / 1024).toFixed(1);
  console.log(`${(i + 1).toString().padStart(2)}. [${sizeMb > 1 ? sizeMb + ' MB' : sizeKb + ' KB'}] ${f.path}`);
}

console.log('\n--- 3. File extension statistics ---');
const extCount = {};
const extSize = {};

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    if (entry.isDirectory()) {
      try { scanDir(full); } catch {}
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase() || '(no-ext)';
      try {
        const sz = fs.statSync(full).size;
        extCount[ext] = (extCount[ext] || 0) + 1;
        extSize[ext] = (extSize[ext] || 0) + sz;
      } catch {}
    }
  }
}
scanDir(root);

const sortedExts = Object.keys(extCount).sort((a, b) => (extSize[b] || 0) - (extSize[a] || 0));
console.log('Extension | Count | Total Size');
for (const ext of sortedExts) {
  if (['.png', '.jpg', '.jpeg', '.webm', '.log', '.json', '.zip', '.apk', '.mp4', '.svg', '.js', '.jsx', '.css', '.md'].includes(ext) || extSize[ext] > 500 * 1024) {
    const mb = (extSize[ext] / (1024 * 1024)).toFixed(2);
    console.log(`${ext.padEnd(10)} | ${extCount[ext].toString().padStart(5)} | ${mb.padStart(7)} MB`);
  }
}

console.log('\n--- 4. Directory Sizes (Level 1 and 2, excluding node_modules) ---');
function getDirSize(dir) {
  let total = 0;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return 0; }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.name === 'node_modules' || (entry.name === '.git' && dir !== path.join(root, '.git'))) continue;
    if (entry.isDirectory()) {
      total += getDirSize(full);
    } else if (entry.isFile()) {
      try { total += fs.statSync(full).size; } catch {}
    }
  }
  return total;
}

const l1 = fs.readdirSync(root, { withFileTypes: true });
for (const item of l1) {
  if (item.name === 'node_modules') continue;
  const full = path.join(root, item.name);
  if (item.isDirectory()) {
    const szMb = (getDirSize(full) / (1024 * 1024)).toFixed(2);
    console.log(`L1: ${item.name.padEnd(35)} : ${szMb.padStart(8)} MB`);
    // L2
    try {
      const l2 = fs.readdirSync(full, { withFileTypes: true });
      for (const item2 of l2) {
        if (item2.name === 'node_modules') continue;
        const full2 = path.join(full, item2.name);
        if (item2.isDirectory()) {
          const sz2Mb = (getDirSize(full2) / (1024 * 1024)).toFixed(2);
          console.log(`    L2: ${(item.name + '/' + item2.name).padEnd(31)} : ${sz2Mb.padStart(8)} MB`);
        }
      }
    } catch {}
  }
}
