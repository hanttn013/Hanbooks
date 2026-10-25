import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const evidence = async (page, info, name) => {
  const dir = path.resolve(process.env.PHASE1_OUTPUT_DIR ? path.join(process.env.PHASE1_OUTPUT_DIR, 'acceptance') : 'qa/phase1/acceptance', info.project.name);
  await fs.mkdir(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true });
};

test('per-book queue exposes pending running done and failed', async ({ page }, info) => {
  await page.route('**/src/utils/documentMetadata.js*', route => route.fulfill({ contentType: 'application/javascript', body: `export async function extractDocumentMetadata(file, format, fallback) { await new Promise(r => setTimeout(r, 4000)); return {...fallback, title: fallback.title}; }` }));
  await page.addInitScript(() => {
    localStorage.setItem('shanbooks_seeded_demo', '1');
    localStorage.setItem('shanbooks_seeded_default_lists', '1');
  });
  await page.goto('/');
  await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => { const r = indexedDB.open('aurelia_db', 4); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    await new Promise((resolve, reject) => {
      const tx = db.transaction('books', 'readwrite');
      for (let i = 0; i < 4; i++) tx.objectStore('books').put({ id: `queue-${i}`, title: `Queue ${i}`, author: 'QA', format: 'txt', fileBlob: new Blob(['text']), metadataStatus: i === 3 ? 'failed' : 'pending', metadataAttempts: 0, metadataError: i === 3 ? 'Damaged fixture' : null });
      tx.oncomplete = resolve; tx.onerror = reject;
    }); db.close();
  });
  await page.reload();
  await page.locator('[data-tab="library"]:visible').click();
  await expect(page.locator('[data-metadata-status="running"]')).toHaveCount(2);
  await expect(page.locator('[data-metadata-status="pending"]')).toHaveCount(1);
  await expect(page.locator('[data-metadata-status="failed"]')).toHaveCount(1);
  await evidence(page, info, 'queue-running-pending-failed');
  await page.locator('[data-metadata-status="failed"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-metadata-status="failed"]')).toBeVisible();
  await evidence(page, info, 'queue-failed-reason');
  await expect(page.locator('[data-metadata-status="done"]')).toHaveCount(3, { timeout: 15000 });
  await evidence(page, info, 'queue-done');
});

test('bad files report individually while valid NFD document survives without junk records', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.locator('button:has-text("Read now"), button:has-text("Continue"), button:has-text("Read"), button:has-text("Tiếp tục"), button:has-text("Đọc tiếp")').first()).toBeVisible({ timeout: 30000 });
  await page.locator('[data-tab="library"]:visible').click();
  const original = await page.evaluate(async () => {
    const db = await new Promise(resolve => { const r = indexedDB.open('aurelia_db', 4); r.onsuccess = () => resolve(r.result); });
    const count = await new Promise(resolve => { const r = db.transaction('books').objectStore('books').count(); r.onsuccess = () => resolve(r.result); }); db.close(); return count;
  });
  const epub = await fs.readFile(path.resolve('tests/fixtures/sample.epub'));
  const bad = [
    { name: 'truncated.epub', mimeType: 'application/epub+zip', buffer: epub.subarray(0, 80) },
    { name: 'broken.zip', mimeType: 'application/zip', buffer: Buffer.from('PKbroken') },
    { name: 'broken.rar', mimeType: 'application/vnd.rar', buffer: Buffer.from('invalid rar') },
    { name: 'empty.txt', mimeType: 'text/plain', buffer: Buffer.alloc(0) },
    { name: 'renamed.epub', mimeType: 'application/epub+zip', buffer: Buffer.from('ordinary text') },
  ];
  await page.locator('input[type="file"]').first().setInputFiles([...bad, { name: 'Tiếng Việt.txt'.normalize('NFD'), mimeType: 'text/plain', buffer: Buffer.from('Chương 1\nNội dung hợp lệ.') }]);
  await expect(page.getByText(/Processed/)).toBeVisible({ timeout: 30000 });
  for (const file of bad) await expect(page.getByRole('list', { name: 'Import results' }).getByText(file.name, { exact: true })).toBeVisible();
  await evidence(page, info, 'mixed-invalid-files');
  const records = await page.evaluate(async () => {
    const db = await new Promise(resolve => { const r = indexedDB.open('aurelia_db', 4); r.onsuccess = () => resolve(r.result); });
    const books = await new Promise(resolve => { const r = db.transaction('books').objectStore('books').getAll(); r.onsuccess = () => resolve(r.result); }); db.close(); return books.map(b => b.fileName);
  });
  expect(records).toHaveLength(original + 1);
  for (const file of bad) expect(records).not.toContain(file.name);
  expect(records).toContain('Tiếng Việt.txt'.normalize('NFD'));
});

test('30 EPUB open-close cycles release reader DOM, Blob URLs and global listeners', async ({ page }, info) => {
  test.setTimeout(240000);
  await page.route('**/node_modules/.vite/deps/epubjs.js*', async route => {
    const url = new URL(route.request().url());
    if (url.searchParams.has('qa-original')) return route.continue();
    url.searchParams.set('qa-original', '1');
    await route.fulfill({ contentType: 'application/javascript', body: `import original from ${JSON.stringify(url.href)}; export default function(...args) { const book = original(...args); window.qaEpubCreated = (window.qaEpubCreated || 0) + 1; window.qaEpubLive = (window.qaEpubLive || 0) + 1; const destroy = book.destroy.bind(book); let closed = false; book.destroy = (...args) => { if (!closed) { closed = true; window.qaEpubLive--; } return destroy(...args); }; return book; }` });
  });
  await page.addInitScript(() => {
    const urls = new Set();
    const create = URL.createObjectURL.bind(URL); const revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = blob => { const url = create(blob); urls.add(url); return url; };
    URL.revokeObjectURL = url => { urls.delete(url); return revoke(url); };
    const listeners = [];
    const add = EventTarget.prototype.addEventListener; const remove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function(type, fn, options) {
      if ((this === window || this === document) && !listeners.some(x => x.target === this && x.type === type && x.fn === fn)) listeners.push({ target: this, type, fn });
      return add.call(this, type, fn, options);
    };
    EventTarget.prototype.removeEventListener = function(type, fn, options) {
      const index = listeners.findIndex(x => x.target === this && x.type === type && x.fn === fn);
      if (index >= 0) listeners.splice(index, 1);
      return remove.call(this, type, fn, options);
    };
    window.qaResources = () => ({ urls: urls.size, listeners: listeners.length, frames: document.querySelectorAll('iframe').length, epubInstances: window.qaEpubLive || 0 });
  });
  await page.goto('/');
  const readNowBtn = page.locator('button:has-text("Read now"), button:has-text("Continue"), button:has-text("Read"), button:has-text("Tiếp tục"), button:has-text("Đọc tiếp")').first();
  await expect(readNowBtn).toBeVisible();
  const samples = [];
  for (let i = 0; i < 30; i++) {
    await readNowBtn.click();
    await expect(page.locator('iframe')).toHaveCount(1);
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Home', exact: true })).toBeVisible();
    await expect(page.locator('iframe')).toHaveCount(0);
    samples.push(await page.evaluate(() => window.qaResources()));
  }
  await evidence(page, info, 'reader-after-30-cycles');
  const dir = path.resolve(process.env.PHASE1_OUTPUT_DIR ? path.join(process.env.PHASE1_OUTPUT_DIR, 'acceptance') : 'qa/phase1/acceptance', info.project.name);
  await fs.writeFile(path.join(dir, 'reader-resources.json'), JSON.stringify(samples, null, 2));
  expect(samples.at(-1).urls).toBeLessThanOrEqual(samples[0].urls);
  expect(samples.at(-1).listeners).toBeLessThanOrEqual(samples[0].listeners);
  expect(samples.every(sample => sample.epubInstances === 0)).toBe(true);
  expect(await page.evaluate(() => window.qaEpubCreated)).toBeGreaterThanOrEqual(30);
});
