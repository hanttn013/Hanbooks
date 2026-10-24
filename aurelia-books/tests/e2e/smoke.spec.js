import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

test('seeded library supports primary navigation and book detail', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Read now', exact: true })).toBeVisible({ timeout: 30_000 });

  await page.getByRole('button', { name: 'Library', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();

  await page.getByRole('button', { name: /^Book info:/ }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: /Read|Continue/ }).first()).toBeVisible();
});

test('browser Back unwinds Reader to Book Detail, previous tab, then Home', async ({ page }, testInfo) => {
  const evidenceDir = path.resolve(process.env.PHASE1_OUTPUT_DIR || 'qa/phase1', testInfo.project.name);
  await fs.mkdir(evidenceDir, { recursive: true });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Library', exact: true })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Library', exact: true }).click();
  await page.getByRole('button', { name: /^Book info:/ }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: /^(Read|Continue)$/ }).click();
  await expect(page.locator('iframe')).toHaveCount(1, { timeout: 30_000 });
  await page.screenshot({ path: path.join(evidenceDir, 'reader.png'), fullPage: true });

  await page.goBack();
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.screenshot({ path: path.join(evidenceDir, 'detail-after-back.png'), fullPage: true });

  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();
  await page.screenshot({ path: path.join(evidenceDir, 'library-after-back.png'), fullPage: true });

  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  await page.screenshot({ path: path.join(evidenceDir, 'home-after-back.png'), fullPage: true });
});

test('history restores the previous tab and its scroll position', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
  const expectedScroll = await page.locator('.screen-scroll').evaluate(element => {
    element.scrollTop = Math.min(360, element.scrollHeight - element.clientHeight);
    return element.scrollTop;
  });
  expect(expectedScroll).toBeGreaterThan(0);

  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
  await expect.poll(() => page.locator('.screen-scroll').evaluate(element => element.scrollTop))
    .toBe(expectedScroll);
});

test('closing a list detail consumes history instead of reopening it on Back', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Lists', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Lists', exact: true })).toBeVisible();
  await page.locator('.list-tile').filter({ has: page.getByRole('heading', { name: 'Want to Read', exact: true }) }).getByRole('button').click();
  await page.locator('header').getByRole('button', { name: 'Lists', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Lists', exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Home', exact: true })).toBeVisible();
});

test('reader flushes reading time when the app goes to background', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Read now', exact: true }).click();
  await expect(page.locator('iframe')).toHaveCount(1, { timeout: 30_000 });
  await page.waitForTimeout(1100);

  const totalReadingMs = await page.evaluate(() => {
    window.dispatchEvent(new Event('pagehide'));
    return JSON.parse(localStorage.getItem('shanbooks_stats') || '{}').totalReadingMs || 0;
  });

  expect(totalReadingMs).toBeGreaterThan(0);
});
