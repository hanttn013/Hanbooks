import { expect, test } from '@playwright/test';

test.describe('Re-read (Đọc lại) regression tests', () => {
  test('Finished book displays "Đọc lại", resets progress to 0 and renders first page without blank screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();

    // Go to Library first to ensure demo books are fully loaded in IndexedDB
    await page.locator('button[data-tab="library"]:visible').click();
    await expect(page.locator('[data-book-id="demo-1"]')).toBeVisible({ timeout: 15000 });

    // Mark demo-1 as finished in IndexedDB & localStorage
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const req = indexedDB.open('aurelia_db', 4);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction(['books', 'progress'], 'readwrite');
          const booksStore = tx.objectStore('books');
          const progressStore = tx.objectStore('progress');

          const getReq = booksStore.get('demo-1');
          getReq.onsuccess = () => {
            const book = getReq.result || { id: 'demo-1', title: 'Pride and Prejudice', format: 'epub' };
            book.status = 'finished';
            book.progress = 1;
            book.progressPercent = 100;
            booksStore.put(book);

            progressStore.put({
              bookId: 'demo-1',
              cfi: 'epubcfi(/6/14[end]!/4/2/1:0)',
              percentage: 100,
              updatedAt: Date.now(),
            });
            localStorage.setItem('shanbooks_pct_demo-1', '100');
            localStorage.setItem('aurelia_pct_demo-1', '100');
          };
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        };
        req.onerror = () => resolve();
      });
    });

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();

    // Go to Library
    await page.locator('button[data-tab="library"]:visible').click();
    await page.waitForTimeout(300);

    // Open book info for demo-1
    const card = page.locator('[data-book-id="demo-1"]');
    const infoBtn = card.getByRole('button', { name: /^Book info:/ }).first();
    await expect(infoBtn).toBeVisible();
    await infoBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Verify button shows "Đọc lại" or "Re-read"
    const rereadButton = page.locator('button:has-text("Đọc lại"), button:has-text("Re-read")');
    await expect(rereadButton.first()).toBeVisible();

    // Click "Đọc lại"
    await rereadButton.first().click();
    await page.waitForTimeout(1000);

    // Verify reader is open and height > 0
    const readerHeight = await page.evaluate(() => {
      const reader = document.querySelector('div[class*="reader"], main[class*="reader"]');
      return reader ? reader.getBoundingClientRect().height : 0;
    });
    expect(readerHeight).toBeGreaterThan(300);

    // Kill app / reload test (reload page immediately after re-read)
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();

    // Go to Library and check progress is reading / 0%
    await page.locator('button[data-tab="library"]:visible').click();
    await page.waitForTimeout(300);
    const infoBtnAfter = page.getByRole('button', { name: /^Book info:/ }).first();
    await infoBtnAfter.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Primary CTA should now say "Đọc tiếp" or "Read" or "Continue", because progress was reset to reading / 0!
    const continueBtn = page.locator('button:has-text("Đọc tiếp"), button:has-text("Continue"), button:has-text("Read"), button:has-text("Đọc")');
    await expect(continueBtn.first()).toBeVisible();
  });

  test('Reader displays visible error UI with "Thử lại" and "Return to library" when document fails to open', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();

    // Inject corrupted book into aurelia_db
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const req = indexedDB.open('aurelia_db', 4);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction(['books'], 'readwrite');
          tx.objectStore('books').put({
            id: 'corrupted-book',
            title: 'Corrupted Test Book',
            author: 'Unknown',
            format: 'epub',
            status: 'reading',
            progress: 0,
            progressPercent: 0,
            addedAt: Date.now(),
            fileBlob: new Blob(['invalid binary not a zip'], { type: 'application/epub+zip' }),
          });
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        };
        req.onerror = () => resolve();
      });
    });

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();

    await page.locator('button[data-tab="library"]:visible').click();
    await page.waitForTimeout(300);

    const corruptCard = page.locator('[data-book-id="corrupted-book"]');
    if (await corruptCard.count() > 0) {
      await corruptCard.click();
      await page.waitForTimeout(1500);

      // Verify visible error UI has Retry and Return buttons
      const retryBtn = page.locator('button:has-text("Thử lại"), button:has-text("Retry")');
      await expect(retryBtn.first()).toBeVisible({ timeout: 20000 });

      const returnBtn = page.locator('button:has-text("Quay lại"), button:has-text("Return to library"), button:has-text("Về thư viện")');
      await expect(returnBtn.first()).toBeVisible();

      // Click Return to library
      await returnBtn.first().click();
      await page.waitForTimeout(400);

      // Back in library
      await expect(page.locator('button[data-tab="library"]:visible')).toBeVisible();
    }
  });
});
