import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

test('seeded library supports primary navigation and book detail', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  await expect(page.locator('button:has-text("Continue"), button:has-text("Tiếp tục"), button:has-text("Read now")').first()).toBeVisible({ timeout: 30_000 });

  await page.locator('button[data-tab="library"]:visible').click();
  await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();

  await page.getByRole('button', { name: /^Book info:/ }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: /Read|Continue/ }).first()).toBeVisible();
});

test('browser Back unwinds Reader to Book Detail, previous tab, then Home', async ({ page }, testInfo) => {
  const evidenceDir = path.resolve(process.env.PHASE1_OUTPUT_DIR || 'qa/phase1', testInfo.project.name);
  await fs.mkdir(evidenceDir, { recursive: true });
  await page.goto('/');
  await expect(page.locator('button[data-tab="library"]:visible')).toBeVisible({ timeout: 30_000 });
  await page.locator('button[data-tab="library"]:visible').click();
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
  await page.locator('button[data-tab="settings"]:visible').click();
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
  const expectedScroll = await page.locator('.screen-scroll').evaluate(element => {
    element.scrollTop = Math.min(360, element.scrollHeight - element.clientHeight);
    return element.scrollTop;
  });
  expect(expectedScroll).toBeGreaterThan(0);

  await page.locator('button[data-tab="home"]:visible').click();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
  await expect.poll(() => page.locator('.screen-scroll').evaluate(element => element.scrollTop))
    .toBe(expectedScroll);
});

test('closing a list detail consumes history instead of reopening it on Back', async ({ page }) => {
  await page.goto('/');
  await page.locator('button[data-tab="lists"]:visible').click();
  await expect(page.getByRole('heading', { name: /^(Lists|Danh sách)$/i, level: 1 })).toBeVisible();
  const wantList = page.locator('.list-tile, [class*="listCard"]').filter({ hasText: /Want to Read|Muốn đọc/i }).first();
  await wantList.click();
  await page.locator('header button:has-text("Lists"), header button:has-text("Danh sách")').first().click();
  await expect(page.getByRole('heading', { name: /^(Lists|Danh sách)$/i, level: 1 })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
});

test('reader flushes reading time when the app goes to background', async ({ page }) => {
  await page.goto('/');
  await page.locator('button:has-text("Continue"), button:has-text("Tiếp tục"), button:has-text("Read now")').first().click();
  await expect(page.locator('iframe')).toHaveCount(1, { timeout: 30_000 });
  await page.waitForTimeout(1100);

  const totalReadingMs = await page.evaluate(() => {
    window.dispatchEvent(new Event('pagehide'));
    return JSON.parse(localStorage.getItem('shanbooks_stats') || '{}').totalReadingMs || 0;
  });

  expect(totalReadingMs).toBeGreaterThan(0);
});
