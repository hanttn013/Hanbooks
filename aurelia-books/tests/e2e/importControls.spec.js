import path from 'node:path';
import { expect, test } from '@playwright/test';

test('Spectrum duplicate controls implement skip, keep and replace', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('button', { name: 'Library', exact: true }).click();
  const file = path.resolve('tests/fixtures/sample.txt');
  const importFile = async choice => {
    await page.locator('input[type="file"]').first().setInputFiles(file);
    if (choice) {
      const dialog = page.getByRole('dialog', { name: 'Duplicate document' });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: choice, exact: true }).click();
    }
    await expect(page.getByRole('dialog', { name: 'Import Summary' })).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  };
  await importFile();
  await expect(page.locator('[data-book-format="txt"]')).toHaveCount(1);
  await importFile('Close');
  await expect(page.locator('[data-book-format="txt"]')).toHaveCount(1);
  await importFile('Keep both');
  await expect(page.locator('[data-book-format="txt"]')).toHaveCount(2);
  await importFile('Replace');
  await expect(page.locator('[data-book-format="txt"]')).toHaveCount(2);
  await page.getByRole('button', { name: 'Select', exact: true }).click();
  await page.locator('[data-book-format="txt"]').first().click();
  await expect(page.getByText('1 selected', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Choose list/ }).click();
  await page.getByRole('option', { name: 'Want to Read', exact: true }).click();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText('1 selected', { exact: true })).toHaveCount(0);
});
