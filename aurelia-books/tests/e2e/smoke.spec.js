import { expect, test } from '@playwright/test';

test('seeded library supports primary navigation and book detail', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Read now', exact: true })).toBeVisible({ timeout: 30_000 });

  await page.getByRole('button', { name: 'Library', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();

  await page.getByTitle('Book info').first().click();
  await expect(page.locator('.modal-sheet')).toBeVisible();
  await expect(page.getByRole('button', { name: /Read|Continue/ }).first()).toBeVisible();
});
