import fs from 'node:fs/promises';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const SCREENS = ['home', 'library', 'lists', 'settings', 'book-detail', 'reader'];
const BASELINE_ROOT = path.resolve(process.env.BASELINE_OUTPUT_DIR || path.join('qa', 'baseline'));

async function settle(page) {
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(250);
}

test('capture Phase 0 visual, console, and accessibility baseline', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const root = path.join(BASELINE_ROOT, testInfo.project.name);
  const consoleEntries = [];
  const accessibility = {};
  let activeScreen = 'home';

  await fs.mkdir(root, { recursive: true });
  page.on('console', message => {
    if (message.type() === 'warning' || message.type() === 'error') {
      consoleEntries.push({ screen: activeScreen, type: message.type(), text: message.text() });
    }
  });
  page.on('pageerror', error => {
    consoleEntries.push({ screen: activeScreen, type: 'pageerror', text: error.message });
  });

  const capture = async name => {
    activeScreen = name;
    await settle(page);
    await page.screenshot({ path: path.join(root, `${name}.png`), fullPage: true });
    let builder = new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
    if (name === 'reader') builder = builder.exclude('iframe');
    const result = await builder.analyze();
    accessibility[name] = result.violations;
  };

  activeScreen = 'home';
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /^(Home|Trang chủ)$/i })).toBeVisible();
  const readNowBtn = page.locator('button:has-text("Continue"), button:has-text("Đọc tiếp"), button:has-text("Read now"), button:has-text("Đọc ngay")').first();
  await expect(readNowBtn).toBeVisible({ timeout: 30_000 });
  await capture('home');

  activeScreen = 'library';
  await page.locator('[data-tab="library"]:visible').click();
  await expect(page.getByRole('heading', { name: /^(Library|Thư viện)$/i })).toBeVisible();
  await capture('library');

  activeScreen = 'lists';
  await page.locator('[data-tab="lists"]:visible').click();
  await expect(page.getByRole('heading', { name: /^(Lists|Danh sách)$/i })).toBeVisible();
  await capture('lists');

  activeScreen = 'settings';
  await page.locator('[data-tab="settings"]:visible').click();
  await expect(page.getByRole('heading', { name: /^(Settings|Cài đặt)$/i })).toBeVisible();
  await capture('settings');

  activeScreen = 'book-detail';
  await page.locator('[data-tab="home"]:visible').click();
  const infoBtn = page.locator('[data-book-action] button, [data-book-id] button').first();
  await infoBtn.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await capture('book-detail');

  activeScreen = 'reader';
  await page.getByRole('dialog').getByRole('button', { name: /Close|Đóng/i }).first().click();
  await readNowBtn.click();
  await expect(page.getByText(/^(Opening|Đang mở) /)).toBeHidden({ timeout: 30_000 });
  await expect(page.locator('iframe')).toHaveCount(1, { timeout: 30_000 });
  await capture('reader');

  await fs.writeFile(path.join(root, 'console.json'), `${JSON.stringify(consoleEntries, null, 2)}\n`);
  await fs.writeFile(path.join(root, 'accessibility.json'), `${JSON.stringify(accessibility, null, 2)}\n`);
  expect(Object.keys(accessibility)).toEqual(SCREENS);
  expect(consoleEntries.every(entry => SCREENS.includes(entry.screen))).toBe(true);
});
