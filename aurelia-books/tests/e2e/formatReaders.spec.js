import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const DOCUMENTS = [
  ['pdf', 'sample.pdf'],
  ['docx', 'sample.docx'],
  ['txt', 'sample.txt'],
  ['md', 'sample.md'],
  ['html', 'sample.html'],
  ['pptx', 'sample.pptx'],
  ['cbz', 'sample.cbz'],
];

test('imports and opens every Phase 2 reader format', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const evidenceDir = path.resolve(process.env.PHASE2_OUTPUT_DIR || 'qa/phase2', testInfo.project.name);
  await fs.mkdir(evidenceDir, { recursive: true });

  await page.goto('/');
  await page.locator('[data-tab="library"]:visible').click();
  await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();

  const fixturePaths = DOCUMENTS.map(([, name]) => path.resolve('tests', 'fixtures', name));
  await page.locator('input[type="file"]').first().setInputFiles(fixturePaths);
  await expect(page.getByText(/Processed 7 documents/)).toBeVisible({ timeout: 60_000 });
  await page.screenshot({ path: path.join(evidenceDir, 'import-summary.png'), fullPage: true });
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();

  for (const [format] of DOCUMENTS) {
    const card = page.locator(`[data-book-format="${format}"]`).first();
    await expect(card).toBeVisible({ timeout: 30_000 });
    await card.click();
    await expect(page.getByText(/^Opening /)).toBeHidden({ timeout: 30_000 });
    await expect(page.locator(`[data-format="${format}"]`)).toBeVisible({ timeout: 30_000 });
    if (format === 'md') {
      await page.getByRole('button', { name: 'Reader settings' }).click();
      await expect(page.getByRole('group', { name: 'Reader font size', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Close', exact: true }).click();
      await page.getByRole('button', { name: 'Show bookmarks' }).click();
      await expect(page.getByText(/No bookmarks/)).toBeVisible();
      await page.getByRole('button', { name: 'Close', exact: true }).click();
    }
    if (format === 'pdf') {
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible();
      await expect.poll(() => canvas.evaluate(element => element.width)).toBeGreaterThan(0);
      await page.getByRole('button', { name: 'Reader settings' }).click();
      await page.getByRole('button', { name: 'Fit width' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
    }
    await page.screenshot({ path: path.join(evidenceDir, `${format}.png`), fullPage: true });
    await page.getByRole('button', { name: 'Close reader' }).click();
    await expect(page.locator(`[data-format="${format}"]`)).toHaveCount(0);
  }
});
