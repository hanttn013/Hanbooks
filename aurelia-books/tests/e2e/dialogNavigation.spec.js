import path from 'node:path';
import { expect, test } from '@playwright/test';

test('closing reader settings preserves the Reader destination', async ({ page }) => {
  await page.addInitScript(() => {
    window.qaHistory = [];
    for (const method of ['pushState', 'replaceState', 'back']) {
      const original = history[method].bind(history);
      history[method] = (...args) => { window.qaHistory.push([method, args[0] || null]); return original(...args); };
    }
    window.addEventListener('popstate', event => window.qaHistory.push(['popstate', event.state]), true);
  });
  await page.goto('/');
  await page.locator('[data-tab="library"]:visible').click();
  await page.locator('input[type="file"]').first().setInputFiles(path.resolve('tests/fixtures/sample.pdf'));
  await expect(page.getByRole('dialog', { name: 'Import Summary' })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('[data-book-format="pdf"]').first().click();
  await expect(page.locator('[data-format="pdf"]')).toBeVisible();
  await page.getByRole('button', { name: 'Reader settings' }).click();
  await expect(page.getByRole('dialog', { name: 'Reading settings' })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const log = await page.evaluate(() => window.qaHistory);
  await expect(page.locator('[data-format="pdf"]'), JSON.stringify(log)).toBeVisible();
  await page.getByRole('button', { name: 'Close reader' }).click();
  await expect(page.getByRole('heading', { name: 'Library', exact: true }), JSON.stringify(log)).toBeVisible();
});
