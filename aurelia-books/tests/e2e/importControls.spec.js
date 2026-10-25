import path from 'node:path';
import { expect, test } from '@playwright/test';

test('Spectrum duplicate controls implement skip, keep and replace', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-tab="library"]:visible').click();
  const file = path.resolve('tests/fixtures/sample.txt');
  const importFile = async choice => {
    await page.locator('input[type="file"]').first().setInputFiles(file);
    if (choice) {
      const dialog = page.getByRole('dialog', { name: /Duplicate document|Tài liệu trùng lặp/i });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: new RegExp(choice, 'i') }).click();
    }
    await expect(page.getByRole('dialog', { name: /Import Summary|Kết quả nhập/i })).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /Close|Đóng/i }).first().click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  };
  await importFile();
  await expect(page.locator('[data-book-format="txt"]')).toHaveCount(1);
  await importFile('Close|Bỏ qua|Đóng');
  await expect(page.locator('[data-book-format="txt"]')).toHaveCount(1);
  await importFile('Keep both|Giữ cả hai');
  await expect(page.locator('[data-book-format="txt"]')).toHaveCount(2);
  await importFile('Replace|Thay thế');
  await expect(page.locator('[data-book-format="txt"]')).toHaveCount(2);
  await page.locator('button:has-text("Select"), button:has-text("Chọn")').first().click();
  await page.locator('[data-book-format="txt"]').first().click();
  await expect(page.locator('text=/1 selected|1 đã chọn/i')).toBeVisible();
  await page.getByRole('button', { name: /Choose list|Chọn danh sách/i }).click();
  await page.getByRole('option').first().click();
  await page.locator('button:has-text("Add"), button:has-text("Thêm")').first().click();
  await expect(page.locator('text=/1 selected|1 đã chọn/i')).toHaveCount(0);
});
