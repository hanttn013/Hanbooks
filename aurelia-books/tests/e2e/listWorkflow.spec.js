import { expect, test } from '@playwright/test';

test('Spectrum list create, add books, edit and delete preserve navigation', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-tab="lists"]:visible').click();
  await page.locator('button:has-text("Create list"), button:has-text("Tạo danh sách")').first().click();
  let dialog = page.getByRole('dialog', { name: /New list|Danh sách mới/i });
  await dialog.getByRole('textbox', { name: /Name|Tên/i }).fill('QA Spectrum');
  await dialog.getByRole('textbox', { name: /Description|Mô tả/i }).fill('Keyboard-managed collection');
  await dialog.getByRole('button', { name: /Create list|Tạo danh sách/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('article').filter({ has: page.getByRole('heading', { name: 'QA Spectrum', exact: true }) }).click();
  await page.locator('header button:has-text("Add"), header button:has-text("Thêm")').first().click();
  dialog = page.getByRole('dialog', { name: /Add books|Thêm sách/i });
  await dialog.getByRole('checkbox').first().focus();
  await page.keyboard.press('Space');
  await dialog.getByRole('checkbox').nth(1).focus();
  await page.keyboard.press('Space');
  await dialog.getByRole('button', { name: /Add|Thêm/i }).first().click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('main [data-book-id]')).toHaveCount(2);

  // Open list options ActionMenu in header to edit
  await page.getByRole('button', { name: /List options|Tùy chọn danh sách/i }).first().click();
  await page.getByRole('menuitem', { name: /Edit list|Sửa danh sách/i }).click();

  dialog = page.getByRole('dialog', { name: /Edit list|Sửa danh sách/i });
  await dialog.getByRole('textbox', { name: /Name|Tên/i }).fill('QA Updated');
  await dialog.getByRole('button', { name: /Save|Lưu/i }).first().click();
  await expect(page.getByRole('heading', { name: 'QA Updated', exact: true })).toBeVisible();

  // Open list options ActionMenu in header to delete
  await page.getByRole('button', { name: /List options|Tùy chọn danh sách/i }).first().click();
  await page.getByRole('menuitem', { name: /Delete list|Xóa danh sách/i }).click();

  const confirmBtn = page.getByRole('dialog').getByRole('button', { name: /Confirm|Xác nhận|Delete|Xóa/i }).first();
  await confirmBtn.click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await expect(page.locator('header h1')).toHaveText(/Lists|Danh sách/i);
  await expect(page.getByRole('heading', { name: 'QA Updated', exact: true })).toHaveCount(0);
  await page.goBack();
  await expect(page.locator('header h1')).toHaveText(/Home|Trang chủ/i);
});

test('List custom cover upload, persistence after reload, and reset to automatic', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-tab="lists"]:visible').click();

  // Create list with custom cover
  await page.locator('button:has-text("Create list"), button:has-text("Tạo danh sách")').first().click();
  const dialog = page.getByRole('dialog', { name: /New list|Danh sách mới/i });
  await dialog.getByRole('textbox', { name: /Name|Tên/i }).fill('List With Custom Cover');

  // 1x1 valid PNG in base64
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const fileInput = dialog.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: 'custom-cover.png',
    mimeType: 'image/png',
    buffer: Buffer.from(pngBase64, 'base64'),
  });

  // Verify "Use automatic cover" button appears in dialog
  await expect(dialog.getByRole('button', { name: /Use automatic cover|Dùng bìa tự động/i })).toBeVisible({ timeout: 5000 });

  // Save list
  await dialog.getByRole('button', { name: /Create list|Tạo danh sách/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Verify list card rendered with an image (not composite fallback)
  const listCard = page.locator('article').filter({ has: page.getByRole('heading', { name: 'List With Custom Cover', exact: true }) });
  await expect(listCard).toBeVisible();
  const coverImg = listCard.locator('img[class*="coverImage"]');
  await expect(coverImg).toBeVisible();

  // Reload page to verify persistence across page reloads
  await page.reload();
  await page.locator('[data-tab="lists"]:visible').click();
  const reloadedCard = page.locator('article').filter({ has: page.getByRole('heading', { name: 'List With Custom Cover', exact: true }) });
  await expect(reloadedCard).toBeVisible();
  await expect(reloadedCard.locator('img[class*="coverImage"]')).toBeVisible();

  // Edit list and reset to automatic cover
  await reloadedCard.click();
  await page.getByRole('button', { name: /List options|Tùy chọn danh sách/i }).first().click();
  await page.getByRole('menuitem', { name: /Edit list|Sửa danh sách/i }).click();

  const editDialog = page.getByRole('dialog', { name: /Edit list|Sửa danh sách/i });
  const resetBtn = editDialog.getByRole('button', { name: /Use automatic cover|Dùng bìa tự động/i });
  await expect(resetBtn).toBeVisible();
  await resetBtn.click();
  await editDialog.getByRole('button', { name: /Save|Lưu/i }).first().click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Return to lists tab and clean up
  await page.goBack();
});

