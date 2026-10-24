import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

test('cold reload, lazy readers and full backup restore work without network', async ({ page, context }, testInfo) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Library', exact: true }).click();
  const formats = ['txt', 'md', 'html', 'pdf', 'docx', 'pptx', 'cbz'];
  await page.locator('input[type="file"]').first().setInputFiles(formats.map(format => path.resolve('tests/fixtures', `sample.${format}`)));
  await expect(page.getByText(/Đã xử lý 7 tài liệu/)).toBeVisible({ timeout: 90_000 });
  await page.locator('.modal-sheet .btn-icon').first().click();
  for (const format of formats) {
    await page.locator(`[data-book-format="${format}"]`).first().click();
    await expect(page.getByText(/^Opening /)).toBeHidden({ timeout: 45_000 });
    await expect(page.locator(`[data-format="${format}"]`)).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await page.getByRole('button', { name: 'Close reader' }).click();
  }
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export full library/ }).click();
  const download = await downloadPromise;
  const backupPath = testInfo.outputPath('offline-full-backup.zip');
  await download.saveAs(backupPath);
  // Clear this test context's records, not browser storage/cache, so the restore
  // must reconstruct files rather than accidentally reuse existing blobs.
  await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('aurelia_db');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const names = ['books', 'bookmarks', 'progress', 'lists'];
      const transaction = db.transaction(names, 'readwrite');
      names.forEach(name => transaction.objectStore(name).clear());
      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onerror = () => { db.close(); reject(transaction.error); };
    };
  }));
  page.on('dialog', dialog => dialog.accept());
  await page.locator('input[accept*=".zip"]').setInputFiles(backupPath);
  await page.waitForLoadState('load');
  await page.getByRole('button', { name: 'Library', exact: true }).click();
  for (const format of formats) {
    await page.locator(`[data-book-format="${format}"]`).first().click();
    await expect(page.getByText(/^Opening /)).toBeHidden({ timeout: 45_000 });
    await expect(page.locator(`[data-format="${format}"]`)).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await page.getByRole('button', { name: 'Close reader' }).click();
  }
  const directory = path.resolve('qa/phase2/offline');
  await fs.mkdir(directory, { recursive: true });
  await page.screenshot({ path: path.join(directory, 'cold-reload-and-seven-readers.png'), fullPage: true });
});
