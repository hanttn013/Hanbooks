import { expect, test } from '@playwright/test';

test.describe('Visual System & Foundation Tests (Bước 1-3)', () => {
  test('PageHeader alignment, typography, and background consistency across all 4 main tabs', async ({ page }) => {
    await page.goto('/');

    const tabs = [
      { id: 'home', name: 'Home' },
      { id: 'library', name: 'Library' },
      { id: 'lists', name: 'Lists' },
      { id: 'settings', name: 'Settings' },
    ];

    const measurements = [];

    for (const tab of tabs) {
      if (tab.id !== 'home') {
        const tabBtn = page.locator(`button[data-tab="${tab.id}"]:visible`);
        await expect(tabBtn).toBeVisible({ timeout: 10_000 });
        await tabBtn.click();
      }

      const h1 = page.locator('header h1').first();
      await expect(h1).toBeVisible({ timeout: 10_000 });

      const data = await h1.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const computed = window.getComputedStyle(el);
        const bodyComputed = window.getComputedStyle(document.body);
        return {
          tab: el.innerText.trim(),
          left: Math.round(rect.left),
          fontFamily: computed.fontFamily,
          fontSize: computed.fontSize,
          bodyBg: bodyComputed.backgroundColor,
        };
      });

      measurements.push({ tab: tab.name, ...data });

      // Verify no discordant "ShanBooks" or "SHANBOOKS" supertitle exists
      const supertitle = page.locator('[class*="supertitle"]');
      const superCount = await supertitle.count();
      if (superCount > 0) {
        const text = await supertitle.first().innerText();
        expect(text.toLowerCase()).not.toContain('shanbooks');
      }
    }

    console.log('Tab header measurements:', measurements);

    // 1. Left alignment must be identical across tabs (tolerance <= 1px)
    const firstLeft = measurements[0].left;
    for (const m of measurements) {
      expect(Math.abs(m.left - firstLeft)).toBeLessThanOrEqual(1);
    }

    // 2. Title font family must use Lora/serif across all tabs
    for (const m of measurements) {
      expect(m.fontFamily.toLowerCase()).toContain('lora');
    }

    // 3. Body background color must be identical across tabs
    const firstBg = measurements[0].bodyBg;
    for (const m of measurements) {
      expect(m.bodyBg).toBe(firstBg);
    }
  });

  test('Settings backup button group alignment and danger level styling', async ({ page }) => {
    await page.goto('/');
    const settingsTab = page.locator('button[data-tab="settings"]:visible');
    await expect(settingsTab).toBeVisible();
    await settingsTab.click();

    await expect(page.locator('header h1').first()).toBeVisible();

    // Check backup buttons grid alignment
    const backupBtns = page.locator('[class*="backupGrid"] button');
    const count = await backupBtns.count();
    expect(count).toBeGreaterThanOrEqual(4);

    const btnBoxes = [];
    for (let i = 0; i < count; i++) {
      const box = await backupBtns.nth(i).boundingBox();
      btnBoxes.push(box);
    }

    // First row: button 0 (left) and button 1 (right)
    // Left of btn 0 and left of btn 2 should align (<= 1px)
    expect(Math.abs(btnBoxes[0].x - btnBoxes[2].x)).toBeLessThanOrEqual(1);
    // Right of btn 1 and right of btn 3 should align (<= 1px)
    const right1 = btnBoxes[1].x + btnBoxes[1].width;
    const right3 = btnBoxes[3].x + btnBoxes[3].width;
    expect(Math.abs(right1 - right3)).toBeLessThanOrEqual(1);

    // Verify danger level distinction
    const resetBtn = page.locator('button:has-text("Reset"), button:has-text("Đặt lại")').first();
    const deleteAllBtn = page.locator('button:has-text("Delete all"), button:has-text("Xóa toàn bộ")').first();

    await expect(resetBtn).toBeVisible();
    await expect(deleteAllBtn).toBeVisible();

    const resetClasses = await resetBtn.getAttribute('class');
    const deleteClasses = await deleteAllBtn.getAttribute('class');

    expect(resetClasses).toContain('btn-destructive-outline');
    expect(deleteClasses).toContain('btn-destructive');
  });

  test('Book Detail bottom action anchoring and background match', async ({ page }) => {
    await page.goto('/');
    const libTab = page.locator('button[data-tab="library"]:visible');
    await expect(libTab).toBeVisible();
    await libTab.click();

    const bookOptionsBtn = page.getByRole('button', { name: /^(Book options|Book info|Tùy chọn sách):/i }).first();
    await expect(bookOptionsBtn).toBeVisible({ timeout: 10_000 });
    await bookOptionsBtn.click();

    const detailsMenuItem = page.getByRole('menuitem', { name: /Book details|Chi tiết sách/i });
    if (await detailsMenuItem.count() > 0) {
      await detailsMenuItem.click();
    }
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });

    const bottomAction = page.locator('[class*="bottomActionWrapper"]').first();
    await expect(bottomAction).toBeVisible();

    const check = await bottomAction.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      const bg = computed.backgroundColor;
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      return { bg, bodyBg };
    });

    // Background must match body background (no white strip on warm background)
    expect(check.bg).toBe(check.bodyBg);
  });

  test('Layout Contract: 16px page margin and header action flushness', async ({ page }) => {
    await page.goto('/');

    const tabs = ['home', 'library', 'lists', 'settings'];
    for (const tabId of tabs) {
      if (tabId !== 'home') {
        const tabBtn = page.locator(`button[data-tab="${tabId}"]:visible`);
        await expect(tabBtn).toBeVisible();
        await tabBtn.click();
      }

      const header = page.locator('header').first();
      await expect(header).toBeVisible();
      const headerBox = await header.boundingBox();

      const headerTitle = page.locator('header h1').first();
      await expect(headerTitle).toBeVisible();
      const titleBox = await headerTitle.boundingBox();

      // Invariant: Title left is always exactly 16px inside the header container
      expect(Math.abs(titleBox.x - (headerBox.x + 16))).toBeLessThanOrEqual(1.5);

      // Check header actions flush right: action right edge = headerBox.right - 16px
      const headerActions = page.locator('header [class*="headerActions"]');
      if (await headerActions.count() > 0 && await headerActions.isVisible()) {
        const actionBox = await headerActions.boundingBox();
        if (actionBox && headerBox) {
          const actionRight = actionBox.x + actionBox.width;
          const expectedRight = headerBox.x + headerBox.width - 16;
          expect(Math.abs(actionRight - expectedRight)).toBeLessThanOrEqual(1.5);
        }
      }
    }
  });

  test('Layout Contract: Library grid alignment (zero 13px offset), search, and filter rail', async ({ page }) => {
    await page.goto('/');
    const libTab = page.locator('button[data-tab="library"]:visible');
    await libTab.click();

    // Baseline reference: Header title left
    const headerTitle = page.locator('header h1').first();
    await expect(headerTitle).toBeVisible();
    const expectedLeft = (await headerTitle.boundingBox()).x;

    // 1. Search field container left aligns with expectedLeft
    const searchField = page.locator('[class*="searchSection"] > *').first();
    if (await searchField.isVisible()) {
      const searchBox = await searchField.boundingBox();
      expect(Math.abs(searchBox.x - expectedLeft)).toBeLessThanOrEqual(1.5);
    }

    // 2. Filter rail first chip left aligns with expectedLeft
    const filterChip = page.locator('[class*="filterRail"] button').first();
    if (await filterChip.isVisible()) {
      const chipBox = await filterChip.boundingBox();
      expect(Math.abs(chipBox.x - expectedLeft)).toBeLessThanOrEqual(1.5);
    }

    // 3. Tools row (N books count) left aligns with expectedLeft
    const bookCount = page.locator('[class*="toolsRow"] [class*="bookCount"]').first();
    if (await bookCount.isVisible()) {
      const countBox = await bookCount.boundingBox();
      expect(Math.abs(countBox.x - expectedLeft)).toBeLessThanOrEqual(1.5);
    }

    // 4. Tools row height <= 44dp
    const toolsRow = page.locator('[class*="toolsRow"]').first();
    if (await toolsRow.isVisible()) {
      const toolsBox = await toolsRow.boundingBox();
      expect(toolsBox.height).toBeLessThanOrEqual(46);
    }

    // 5. First book card in grid: left MUST align with expectedLeft (no 13px inward shift!)
    const firstCard = page.locator('[class*="libraryGrid"] article').first();
    await expect(firstCard).toBeVisible({ timeout: 10_000 });
    const cardBox = await firstCard.boundingBox();
    expect(Math.abs(cardBox.x - expectedLeft)).toBeLessThanOrEqual(1.5);
  });

  test('Layout Contract: BookCard grid row vertical coordinate alignment', async ({ page }) => {
    await page.goto('/');
    const libTab = page.locator('button[data-tab="library"]:visible');
    await libTab.click();

    const cards = page.locator('[class*="libraryGrid"] article');
    const count = await cards.count();
    if (count >= 2) {
      const box0 = await cards.nth(0).boundingBox();
      const box1 = await cards.nth(1).boundingBox();

      // If cards are in the same row
      if (Math.abs(box0.y - box1.y) <= 2) {
        const title0 = await cards.nth(0).locator('h3').boundingBox();
        const title1 = await cards.nth(1).locator('h3').boundingBox();
        expect(Math.abs(title0.y - title1.y)).toBeLessThanOrEqual(1);

        const author0 = await cards.nth(0).locator('p').first().boundingBox();
        const author1 = await cards.nth(1).locator('p').first().boundingBox();
        expect(Math.abs(author0.y - author1.y)).toBeLessThanOrEqual(1);

        const metaRow0 = await cards.nth(0).locator('[class*="cardMetaRow"]').boundingBox();
        const metaRow1 = await cards.nth(1).locator('[class*="cardMetaRow"]').boundingBox();
        expect(Math.abs(metaRow0.y - metaRow1.y)).toBeLessThanOrEqual(1);
      }
    }
  });

  test('Layout Contract: Continue Reading Hero Card aspect ratio and padding', async ({ page }) => {
    await page.goto('/');
    const heroCard = page.locator('[class*="heroCard"]').first();
    if (await heroCard.isVisible()) {
      const heroCover = heroCard.locator('[class*="heroCover"]').first();
      await expect(heroCover).toBeVisible();
      const coverBox = await heroCover.boundingBox();

      // Ratio height / width must be 1.5 +- 0.05 (2:3 aspect ratio)
      const ratio = coverBox.height / coverBox.width;
      expect(Math.abs(ratio - 1.5)).toBeLessThanOrEqual(0.05);

      // Verify progress percentage text exists
      const pctText = heroCard.locator('[class*="progressPct"]');
      await expect(pctText).toBeVisible();
      const textContent = await pctText.innerText();
      expect(textContent).toMatch(/%/);

      // Verify continue action button exists and is labeled "Tiếp tục" or "Continue"
      const continueBtn = heroCard.locator('button').filter({ hasText: /Tiếp tục|Continue/i }).first();
      await expect(continueBtn).toBeVisible();
    }
  });

  test('Layout Contract: ListCard top offset invariance and 2x2 grid', async ({ page }) => {
    await page.goto('/');
    const listsTab = page.locator('button[data-tab="lists"]:visible');
    await listsTab.click();

    const listCards = page.locator('article[class*="listCard"]');
    const count = await listCards.count();
    if (count >= 2) {
      const offsets = [];
      for (let i = 0; i < count; i++) {
        const cardBox = await listCards.nth(i).boundingBox();
        const titleBox = await listCards.nth(i).locator('h3').first().boundingBox();
        offsets.push(titleBox.y - cardBox.y);
      }
      // Top offset must be equal across all list cards (+- 1px)
      for (let i = 1; i < offsets.length; i++) {
        expect(Math.abs(offsets[i] - offsets[0])).toBeLessThanOrEqual(1.5);
      }
    }
  });

  test('Feature: Long press on BookCard opens Quick Preview modal', async ({ page }) => {
    await page.goto('/');
    const libTab = page.locator('button[data-tab="library"]:visible');
    await libTab.click();

    const firstCard = page.locator('[class*="libraryGrid"] article').first();
    await expect(firstCard).toBeVisible();

    // Perform long press (pointerdown -> wait 650ms -> pointerup)
    const cardBox = await firstCard.boundingBox();
    const centerX = cardBox.x + cardBox.width / 2;
    const centerY = cardBox.y + cardBox.height / 3;

    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.waitForTimeout(650);
    await page.mouse.up();

    // Verify Quick Preview dialog/sheet appears
    const previewContent = page.locator('[class*="quickPreviewContent"]');
    await expect(previewContent).toBeVisible({ timeout: 5000 });

    // Verify preview contains title, format badge, and synopsis
    await expect(previewContent.locator('h2')).toBeVisible();
    await expect(previewContent.locator('[class*="synopsisSection"]')).toBeVisible();

    // Verify Action buttons exist
    const buttons = page.locator('[role="dialog"] button, dialog button');
    expect(await buttons.count()).toBeGreaterThanOrEqual(2);

    // Close modal
    await page.keyboard.press('Escape');
  });
});
