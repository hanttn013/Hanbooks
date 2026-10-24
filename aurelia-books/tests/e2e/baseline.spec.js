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
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Read now', exact: true })).toBeVisible({ timeout: 30_000 });
  await capture('home');

  activeScreen = 'library';
  await page.getByRole('button', { name: 'Library', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();
  await capture('library');

  activeScreen = 'lists';
  await page.getByRole('button', { name: 'Lists', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Lists' })).toBeVisible();
  await capture('lists');

  activeScreen = 'settings';
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
  await capture('settings');

  activeScreen = 'book-detail';
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.getByRole('button', { name: 'Info', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await capture('book-detail');

  activeScreen = 'reader';
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Read now', exact: true }).click();
  await expect(page.getByText(/^Opening /)).toBeHidden({ timeout: 30_000 });
  await expect(page.locator('iframe')).toHaveCount(1, { timeout: 30_000 });
  await capture('reader');

  await fs.writeFile(path.join(root, 'console.json'), `${JSON.stringify(consoleEntries, null, 2)}\n`);
  await fs.writeFile(path.join(root, 'accessibility.json'), `${JSON.stringify(accessibility, null, 2)}\n`);
  expect(Object.keys(accessibility)).toEqual(SCREENS);
  expect(consoleEntries.every(entry => SCREENS.includes(entry.screen))).toBe(true);
});
