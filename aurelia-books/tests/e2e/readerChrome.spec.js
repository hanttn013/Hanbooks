import fs from 'node:fs/promises';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('Reader chrome auto-hides, remains keyboard-reachable and has accessible sheets', async ({ page }, info) => {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('button', { name: 'Library', exact: true }).click();
  await page.locator('input[type="file"]').first().setInputFiles(path.resolve('tests/fixtures/sample.md'));
  await page.getByRole('dialog', { name: 'Import Summary' }).getByRole('button', { name: 'Close', exact: true }).click();
  await page.locator('[data-book-format="md"]').first().click();
  await expect(page.locator('[data-format="md"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close reader' })).toBeHidden({ timeout: 9000 });
  await page.getByRole('button', { name: 'Show reader controls' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Close reader' })).toBeVisible();
  const audits = {};
  for (const [button, name] of [['Reader settings', 'Reading settings'], ['Table of contents', 'Table of contents'], ['Show bookmarks', 'Saved bookmarks']]) {
    await page.getByRole('button', { name: button, exact: true }).click();
    await expect(page.getByRole('dialog', { name, exact: true })).toBeVisible();
    await page.evaluate(() => Promise.all(document.getAnimations().filter(animation => Number.isFinite(animation.effect?.getComputedTiming().endTime)).map(animation => animation.finished.catch(() => {}))));
    const result = await new AxeBuilder({ page }).analyze();
    audits[name] = result.violations;
    expect(result.violations.filter(violation => ['critical', 'serious'].includes(violation.impact)), name).toEqual([]);
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  }
  await page.setViewportSize({ width: 800, height: 360 });
  await expect(page.locator('[data-format="md"]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const directory = path.resolve('qa/phase3', info.project.name);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, 'reader-sheet-accessibility.json'), JSON.stringify(audits, null, 2));
  await page.screenshot({ path: path.join(directory, 'reader-landscape.png'), fullPage: true });
});

test('EPUB keyboard settings dismiss without closing Reader', async ({ page }) => {
  await page.goto('/');
  await page.locator('button:has-text("Continue"), button:has-text("Tiếp tục"), button:has-text("Read now")').first().click();
  await expect(page.getByText(/^Opening /)).toBeHidden({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Show reader controls' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Reading settings', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Reading settings', exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('slider', { name: 'Font size', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('[data-format="epub"]')).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(1);
  expect(await page.locator('iframe').getAttribute('title')).toBeTruthy();
  const prevented = await page.locator('[data-reader-surface]').evaluate(element => {
    const touches = [{ clientX: 12, clientY: 100 }, { clientX: 70, clientY: 180 }];
    return ['touchstart', 'touchmove'].map(type => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'touches', { value: touches });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    });
  });
  expect(prevented).toEqual([false, false]);
  await page.getByRole('button', { name: 'Close reader', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Home', exact: true })).toBeVisible();
});
