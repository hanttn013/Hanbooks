import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = 'E:/Personal_pj/Hanbook';
const aureliaRoot = path.join(root, 'aurelia-books');

console.log('=== AUDIT INVENTORY SCRIPT ===');

// --- 1. Git & Dry-run Checks ---
console.log('\n--- Dry Run: git clean -ndx ---');
try {
  const gitClean = execSync('git clean -ndx', { cwd: root, maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
  console.log('git clean -ndx preview (first 40 lines):');
  console.log(gitClean.split('\n').slice(0, 40).join('\n'));
} catch (e) {
  console.error('git clean -ndx error:', e.message);
}

// --- 2. Check for third-party / clone repos ---
console.log('\n--- Nested Repos & Subprojects ---');
const possibleRepos = ['next-app', 'soft-pages', 'ios'];
for (const repo of possibleRepos) {
  const p = path.join(root, repo);
  if (fs.existsSync(p)) {
    const hasGit = fs.existsSync(path.join(p, '.git'));
    const isTracked = execSync(`git ls-files "${repo}"`, { cwd: root }).toString('utf8').trim();
    console.log(`Repo: ${repo} | Exists: true | Has .git: ${hasGit} | Tracked by root git: ${Boolean(isTracked)}`);
  }
}

// --- 3. QA and Images Inventory ---
console.log('\n--- QA & Image Files Categorization ---');
const qaRoot = path.join(aureliaRoot, 'qa');

function getFilesRecursively(dir, filterFn) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.name === 'node_modules') continue;
    if (entry.isDirectory()) {
      results = results.concat(getFilesRecursively(full, filterFn));
    } else if (entry.isFile()) {
      if (!filterFn || filterFn(entry.name, full)) {
        try {
          const st = fs.statSync(full);
          results.push({ path: full, rel: path.relative(root, full).replace(/\\/g, '/'), size: st.size });
        } catch {}
      }
    }
  }
  return results;
}

const allQaFiles = getFilesRecursively(qaRoot);
console.log(`Total files in aurelia-books/qa: ${allQaFiles.length}`);

const categories = {
  baselineVisualRegression: [], // Used in tests: e.g. tests/e2e references
  ownerDesignReferences: [],    // e.g. qa/reader/before/, qa/reader/before-device/, Anh_UX_UI
  phaseBeforeAfter: [],         // qa/phase1/, qa/phase2/, qa/phase3/, qa/design/, qa/align/, qa/fix/
  temporaryTestArtifacts: [],   // qa/test-results/, qa/playwright-report/, qa/test-device.png, qa/device-screenshots/
  videosTracesLogs: [],         // *.webm, *.mp4, *.zip, *.log
  other: [],
};

// Check Playwright test files to see what images are referenced
const testFiles = getFilesRecursively(path.join(aureliaRoot, 'tests'), (name) => name.endsWith('.js') || name.endsWith('.jsx'));
const testContents = testFiles.map(f => fs.readFileSync(f.path, 'utf8')).join('\n');

for (const f of allQaFiles) {
  const norm = f.rel;
  const ext = path.extname(norm).toLowerCase();
  
  if (['.webm', '.mp4', '.log'].includes(ext) || norm.includes('trace.zip')) {
    categories.videosTracesLogs.push(f);
  } else if (norm.includes('qa/test-results') || norm.includes('qa/playwright-report') || norm.includes('device-screenshots') || norm.endsWith('test-device.png')) {
    categories.temporaryTestArtifacts.push(f);
  } else if (norm.includes('qa/reader/before') || norm.includes('qa/reader/before-device')) {
    categories.ownerDesignReferences.push(f);
  } else if (norm.includes('qa/phase') || norm.includes('qa/design') || norm.includes('qa/align') || norm.includes('qa/fix')) {
    categories.phaseBeforeAfter.push(f);
  } else if (norm.includes('qa/reader')) {
    categories.phaseBeforeAfter.push(f);
  } else {
    categories.other.push(f);
  }
}

console.log('Category breakdown in qa/:');
for (const [k, arr] of Object.entries(categories)) {
  const totalSz = (arr.reduce((s, x) => s + x.size, 0) / (1024 * 1024)).toFixed(2);
  console.log(`- ${k}: ${arr.length} files (${totalSz} MB)`);
}

// Check other image dirs in root
const rootImgDirs = ['Anh_UX_UI', 'test-artifacts', '.phase1-verification-backup-20261023'];
for (const d of rootImgDirs) {
  const p = path.join(root, d);
  if (fs.existsSync(p)) {
    const files = getFilesRecursively(p);
    const sz = (files.reduce((s, x) => s + x.size, 0) / (1024 * 1024)).toFixed(2);
    console.log(`Directory ${d}: ${files.length} files (${sz} MB)`);
  }
}

// --- 4. Dead Code / Legacy Code Scan ---
console.log('\n--- Legacy & Dead Code Search ---');
const legacySymbols = ['ContinueScreen', 'AppearanceScreen', 'soft-pages'];
for (const sym of legacySymbols) {
  try {
    const hits = execSync(`git grep "${sym}" aurelia-books/src/`, { cwd: root }).toString('utf8').trim();
    console.log(`Hits for "${sym}" in aurelia-books/src: ${hits ? hits.split('\n').length : 0}`);
  } catch {
    console.log(`Hits for "${sym}" in aurelia-books/src: 0`);
  }
}

// Check for .bak, .old, .orig files
const bakFiles = getFilesRecursively(aureliaRoot, (name) => name.endsWith('.bak') || name.endsWith('.old') || name.endsWith('.orig') || name.includes('.copy'));
console.log(`Backup/old/orig files found in aurelia-books: ${bakFiles.length}`);
for (const b of bakFiles) console.log(`  - ${b.rel}`);

// Check all JS/JSX files in src to see which are unimported
const srcFiles = getFilesRecursively(path.join(aureliaRoot, 'src'), (name) => name.endsWith('.js') || name.endsWith('.jsx'));
console.log(`\nScanning ${srcFiles.length} source files in aurelia-books/src for unreferenced files...`);

const allCodeFiles = getFilesRecursively(aureliaRoot, (name) => (name.endsWith('.js') || name.endsWith('.jsx') || name.endsWith('.html')) && !name.includes('node_modules'));
const allCode = allCodeFiles.map(f => fs.readFileSync(f.path, 'utf8')).join('\n');

const unreferencedSrc = [];
for (const sf of srcFiles) {
  const baseName = path.basename(sf.path, path.extname(sf.path));
  if (baseName === 'main' || baseName === 'App' || baseName === 'globals' || baseName === 'index') continue;
  // Regex check for import or require or dynamic reference
  const regex = new RegExp(`\\b${baseName}\\b`);
  if (!regex.test(allCode.replace(fs.readFileSync(sf.path, 'utf8'), ''))) {
    unreferencedSrc.push(sf.rel);
  }
}
console.log(`Unreferenced source files in src/ (${unreferencedSrc.length}):`);
for (const u of unreferencedSrc) console.log(`  - ${u}`);

// --- 5. Documentation Files Audit ---
console.log('\n--- Documentation Audit (docs/ & qa/*.md) ---');
const docFiles = getFilesRecursively(path.join(aureliaRoot, 'docs')).concat(
  getFilesRecursively(path.join(root, 'docs'))
).concat(
  getFilesRecursively(qaRoot, (name) => name.endsWith('.md'))
);
console.log(`Total doc markdown files: ${docFiles.length}`);
for (const d of docFiles) {
  const szKb = (d.size / 1024).toFixed(1);
  console.log(`  - [${szKb.padStart(5)} KB] ${d.rel}`);
}
