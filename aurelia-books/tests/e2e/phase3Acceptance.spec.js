import fs from 'node:fs/promises';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('Vietnamese default, light/dark/system, English persistence and axe acceptance', async ({ page }, info) => {
  test.setTimeout(180_000);
  const directory = path.resolve('qa/phase3', info.project.name);
  await fs.mkdir(directory, { recursive: true });
  const audits = {};
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Trang chủ', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Đọc ngay', exact: true })).toBeVisible();
  for (const [scheme, option] of [['light', 'Sáng'], ['dark', 'Tối']]) {
    await page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('button', { name: 'Cài đặt', exact: true }).click();
    await page.getByRole('button', { name: /Giao diện ứng dụng/ }).click();
    await page.getByRole('option', { name: option, exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-app-theme', scheme);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('shanbooks_settings')).theme)).toBe('warm-cream');
    for (const [id, label] of [['home', 'Trang chủ'], ['library', 'Thư viện'], ['lists', 'Danh sách'], ['settings', 'Cài đặt']]) {
      await page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('button', { name: label, exact: true }).click();
      await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
      await page.evaluate(() => Promise.all(document.getAnimations().filter(animation => Number.isFinite(animation.effect?.getComputedTiming().endTime)).map(animation => animation.finished.catch(() => {}))));
      const result = await new AxeBuilder({ page }).analyze();
      audits[`${scheme}-${id}`] = result.violations;
      await page.screenshot({ path: path.join(directory, `${scheme}-${id}.png`), fullPage: true });
      expect(result.violations.filter(violation => ['serious', 'critical'].includes(violation.impact)), `${scheme}-${id}`).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
  await page.getByRole('button', { name: /Giao diện ứng dụng/ }).click();
  await page.getByRole('option', { name: 'Theo hệ thống', exact: true }).click();
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await expect(page.locator('html')).toHaveAttribute('data-app-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-app-theme', 'light');
  await page.getByRole('button', { name: /Ngôn ngữ/ }).click();
  await page.getByRole('option', { name: 'English', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Home', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await fs.writeFile(path.join(directory, 'accessibility.json'), JSON.stringify(audits, null, 2));
});

test('Spectrum list editor traps focus, restores it and consumes Back before leaving Lists', async ({ page }, info) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('button', { name: 'Danh sách', exact: true }).click();
  const create = page.getByRole('button', { name: 'Tạo danh sách', exact: true });
  await create.click();
  const dialog = page.getByRole('dialog', { name: 'Danh sách mới', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Tên', exact: true })).toBeFocused();
  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(create).toBeFocused();
  await create.click();
  await expect(dialog).toBeVisible();
  await page.goBack();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Danh sách', exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Trang chủ', exact: true })).toBeVisible();
  const directory = path.resolve('qa/phase3', info.project.name);
  await fs.mkdir(directory, { recursive: true });
  await page.screenshot({ path: path.join(directory, 'dialog-keyboard-back.png'), fullPage: true });
});
