// tests/e2e/captureReaderFeatures.spec.js
import fs from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const OUT_DIR = path.resolve('.artifacts/reader');

test.describe('In-book Reader Features Capture (Antislop & Editorial)', () => {
  test.use({
    viewport: { width: 390, height: 844 }, // Mobile device viewport
    deviceScaleFactor: 2.75, // Matching real phone high density
  });

  test('captures all reader states cleanly', async ({ page }) => {
    test.setTimeout(90_000);
    await fs.mkdir(OUT_DIR, { recursive: true });

    // Set Vietnamese language in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('shanbooks_settings', JSON.stringify({ language: 'vi', theme: 'warm-cream' }));
    });

    await page.goto('/');

    // Wait for app to load
    await expect(page.locator('button[data-tab="library"]:visible')).toBeVisible({ timeout: 30_000 });

    // Open Library
    await page.locator('button[data-tab="library"]:visible').click();

    // Click first book card
    const firstBook = page.locator('[class*="bookCard"], [class*="card"]').first();
    await expect(firstBook).toBeVisible({ timeout: 15_000 });
    await firstBook.click();

    // In Quick Preview or Book Detail modal, click "Tiếp tục" or "Đọc" if present
    const readBtn = page.getByRole('button', { name: /Tiếp tục|Đọc|Read|Continue/i }).first();
    try {
      if (await readBtn.isVisible({ timeout: 2000 })) {
        await readBtn.click();
      }
    } catch {
      // Quick preview modal may not be open
    }

    // Wait for reader surface to render
    const readerSurface = page.locator('[data-reader-surface], [class*="viewer"]');
    await expect(readerSurface).toBeVisible({ timeout: 30_000 });

    // Ensure reading content is loaded
    await page.waitForTimeout(2000);

    const isChromeActive = async () => {
      const chrome = page.locator('[data-reader-chrome="true"]');
      if (await chrome.count() === 0) return false;
      const opacity = await chrome.evaluate(el => window.getComputedStyle(el).opacity);
      return opacity !== '0';
    };

    const toggleChrome = async () => {
      const footer = page.locator('div[class*="miniFooter"]').first();
      if (await footer.isVisible()) {
        await footer.click();
      } else {
        await page.mouse.click(195, 400);
      }
      await page.waitForTimeout(500);
    };

    // 1. Capture Clean Reader Surface (Chrome hidden)
    if (await isChromeActive()) {
      await toggleChrome();
    }
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT_DIR, '01-reader-surface.png') });

    // 2. Capture Reader Controls (Top Bar & Bottom Progress Bar)
    if (!(await isChromeActive())) {
      await toggleChrome();
    }
    await expect(page.locator('[data-reader-chrome="true"]')).toBeVisible();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT_DIR, '02-reader-chrome.png') });

    // 3. Capture Progress Bar Scrubber Interaction
    const progressSlider = page.locator('[data-reader-chrome="true"] input[type="range"]');
    if (await progressSlider.isVisible()) {
      await progressSlider.evaluate(el => {
        el.value = '65';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await page.waitForTimeout(400);
    }
    await page.screenshot({ path: path.join(OUT_DIR, '03-reader-progress-scrubber.png') });

    // 4. Capture Bookmark Toggle Action (Toast notification)
    if (!(await isChromeActive())) await toggleChrome();
    const toolButtons = page.locator('nav[class*="toolsRow"] button');
    await expect(toolButtons.first()).toBeVisible({ timeout: 10_000 });
    // toolButtons[0] is Bookmark
    await toolButtons.nth(0).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT_DIR, '04-reader-bookmark-toast.png') });

    // Wait for toast to fade
    await page.waitForTimeout(1500);

    const closeSheet = async () => {
      const closeBtn = page.locator('[data-reader-sheet="true"] button[aria-label*="Đóng"], [data-reader-sheet="true"] button[aria-label*="Close"]').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(600);
    };

    // 5. Capture Bookmarks Modal / Sheet (toolButtons[1] is Ghi chú / Dấu trang)
    if (!(await isChromeActive())) await toggleChrome();
    await toolButtons.nth(1).click();
    await page.waitForTimeout(600);
    await expect(page.locator('[data-reader-sheet="true"]')).toBeVisible();
    await page.screenshot({ path: path.join(OUT_DIR, '05-reader-bookmarks-sheet.png') });
    await closeSheet();

    // 6. Capture Table of Contents (TOC) Sheet (toolButtons[3] is Mục lục)
    if (!(await isChromeActive())) await toggleChrome();
    await toolButtons.nth(3).click();
    await page.waitForTimeout(600);
    await expect(page.locator('[data-reader-sheet="true"]')).toBeVisible();
    await page.screenshot({ path: path.join(OUT_DIR, '06-reader-toc-sheet.png') });
    await closeSheet();

    // 7. Capture Reading Settings Panel (toolButtons[2] is Aa Appearance)
    if (!(await isChromeActive())) await toggleChrome();
    await toolButtons.nth(2).click();
    await page.waitForTimeout(600);
    await expect(page.locator('[data-reader-sheet="true"]')).toBeVisible();
    await page.screenshot({ path: path.join(OUT_DIR, '07-reader-settings-panel.png') });
    await closeSheet();

    // 8. Capture Search Modal from TopBar More menu
    if (!(await isChromeActive())) await toggleChrome();
    const moreBtn = page.locator('header button[aria-label*="thêm"], header button[aria-label*="More"]');
    if (await moreBtn.isVisible()) {
      await moreBtn.click();
      await page.waitForTimeout(400);

      const searchMenuItem = page.locator('[role="menuitem"]').filter({ hasText: /Tìm|Search/i }).first();
      if (await searchMenuItem.isVisible()) {
        await searchMenuItem.click();
        await page.waitForTimeout(600);
        await expect(page.locator('[data-reader-sheet="true"]')).toBeVisible();

        const searchInput = page.locator('[data-reader-sheet="true"] input[type="search"], [data-reader-sheet="true"] input[type="text"]').first();
        if (await searchInput.isVisible()) {
          await searchInput.fill('Darcy');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1600);
        }

        await page.screenshot({ path: path.join(OUT_DIR, '08-reader-search-modal.png') });
        await closeSheet();
      }
    }
  });
});
