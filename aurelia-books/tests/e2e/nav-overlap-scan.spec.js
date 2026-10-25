import { expect, test } from '@playwright/test';

const THEMES = ['light', 'dark'];

test.describe('Automated Navigation Overlap Scanner', () => {
  for (const theme of THEMES) {
    test(`scans all screens and overlays for obscured elements [${theme}]`, async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();

      // Set theme
      await page.evaluate(t => {
        document.documentElement.setAttribute('data-app-theme', t);
        const frame = document.getElementById('phone-frame');
        if (frame) frame.setAttribute('data-app-theme', t);
      }, theme);

      const checkScreenElements = async (screenName) => {
        // Scroll container to bottom
        await page.evaluate(() => {
          const scroller = document.querySelector('.screen-scroll') || document.querySelector('#app-content');
          if (scroller) scroller.scrollTop = scroller.scrollHeight;
        });
        await page.waitForTimeout(100);

        // Get fixed bottom nav bar rect if visible
        const navRect = await page.evaluate(() => {
          const nav = document.querySelector('nav[class*="mobileTabBar"]');
          if (!nav) return null;
          const style = window.getComputedStyle(nav);
          if (style.display === 'none' || style.visibility === 'hidden') return null;
          const r = nav.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height };
        });

        // Scan all visible interactive elements in viewport
        const overlapViolations = await page.evaluate((navBox) => {
          const violations = [];
          const interactiveSelectors = 'button, a[href], input, select, textarea, [role="button"], [role="tab"]';
          const activeDialog = document.querySelector('[role="dialog"]');
          const root = activeDialog || document;
          const elements = Array.from(root.querySelectorAll(interactiveSelectors));

          for (const el of elements) {
            // Ignore elements inside the bottom nav itself or navigation aside
            if (el.closest('nav[class*="mobileTabBar"]') || el.closest('aside[class*="navRail"]') || el.closest('aside[class*="desktopSidebar"]')) {
              continue;
            }

            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

            // Ignore React Aria hidden native select elements generated for Picker/ComboBox
            if (el.tagName === 'SELECT' && (el.tabIndex === -1 || el.getAttribute('aria-hidden') === 'true' || parseFloat(style.opacity) < 0.05)) {
              continue;
            }

            const rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) continue;

            const scroller = el.closest('.screen-scroll');
            const scrollerTop = scroller ? scroller.getBoundingClientRect().top : 0;
            const scrollerBottom = scroller ? scroller.getBoundingClientRect().bottom : window.innerHeight;

            // Element must be inside visible scroll area
            if (rect.bottom <= scrollerTop || rect.top >= scrollerBottom) continue;
            if (rect.bottom <= 0 || rect.top >= window.innerHeight) continue;

            const centerX = Math.floor(rect.left + rect.width / 2);
            const centerY = Math.floor(rect.top + rect.height / 2);

            // Skip elements whose center is outside visible scroller area
            if (centerY < scrollerTop || centerY > scrollerBottom) continue;

            if (centerX >= 0 && centerX < window.innerWidth && centerY >= 0 && centerY < window.innerHeight) {
              const topEl = document.elementFromPoint(centerX, centerY);
              const isSelfOrDescendant = topEl === el || el.contains(topEl) || (topEl && topEl.closest('button, a, input, select, textarea, [role="button"]') === el) || (el.type === 'range' && (el.parentElement?.contains(topEl) || topEl?.closest('[class*="CPUPs"]')));

              // Check if intersects fixed bottom navigation bar
              let intersectsNav = false;
              if (navBox && navBox.height > 0) {
                const xOverlap = Math.max(0, Math.min(rect.right, navBox.right) - Math.max(rect.left, navBox.left));
                const yOverlap = Math.max(0, Math.min(rect.bottom, navBox.bottom) - Math.max(rect.top, navBox.top));
                if (xOverlap > 0 && yOverlap > 0) {
                  intersectsNav = true;
                }
              }

              if (!isSelfOrDescendant || intersectsNav) {
                violations.push({
                  tag: el.tagName,
                  text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40),
                  rect: { top: Math.round(rect.top), bottom: Math.round(rect.bottom), height: Math.round(rect.height) },
                  navTop: navBox ? Math.round(navBox.top) : null,
                  topElement: topEl ? `${topEl.tagName}.${topEl.className}` : 'null',
                  intersectsNav,
                });
              }
            }
          }
          return violations;
        }, navRect);

        expect(overlapViolations, `Screen "${screenName}" has obscured interactive elements`).toEqual([]);
      };

      // 1. Check Settings (scrolled to bottom: Danger zone Reset Settings & Delete all data)
      await page.locator('button[data-tab="settings"]:visible').click();
      await page.waitForTimeout(200);
      await checkScreenElements('Settings');

      // 2. Check Home
      await page.locator('button[data-tab="home"]:visible').click();
      await page.waitForTimeout(200);
      await checkScreenElements('Home');

      // 3. Check Library
      await page.locator('button[data-tab="library"]:visible').click();
      await page.waitForTimeout(200);
      await checkScreenElements('Library');

      // 4. Check Lists
      await page.locator('button[data-tab="lists"]:visible').click();
      await page.waitForTimeout(200);
      await checkScreenElements('Lists');

      // 5. Check Book Detail Modal
      await page.locator('button[data-tab="library"]:visible').click();
      await page.waitForTimeout(200);
      const infoBtn = page.getByRole('button', { name: /^Book info:/ }).first();
      if (await infoBtn.count() > 0) {
        await infoBtn.click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.waitForTimeout(200);
        await checkScreenElements('BookDetailModal');
        await page.keyboard.press('Escape');
      }
    });
  }

  // Viewport-specific check for 412x915 and 800x360 landscape
  test('scans additional viewports (412x915 and landscape 800x360)', async ({ page }) => {
    for (const [w, h] of [[412, 915], [800, 360]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto('/');
      await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();

      // Go to Settings and scroll to bottom
      await page.locator('button[data-tab="settings"]:visible').click();
      await page.waitForTimeout(200);

      await page.evaluate(() => {
        const scroller = document.querySelector('.screen-scroll');
        if (scroller) scroller.scrollTop = scroller.scrollHeight;
      });
      await page.waitForTimeout(200);

      // Verify Reset settings and Delete all app data buttons are accessible via elementFromPoint
      const buttonsAccessible = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button')).filter(b =>
          b.textContent.includes('Reset') || b.textContent.includes('Delete all') || b.textContent.includes('Xóa') || b.textContent.includes('Đặt lại')
        );
        return buttons.map(b => {
          b.scrollIntoView({ block: 'center' });
          const r = b.getBoundingClientRect();
          const cx = Math.floor(r.left + r.width / 2);
          const cy = Math.floor(r.top + r.height / 2);
          const topEl = document.elementFromPoint(cx, cy);
          return {
            text: b.textContent.trim(),
            accessible: topEl === b || b.contains(topEl),
            topEl: topEl ? `${topEl.tagName}.${topEl.className}` : 'null',
          };
        });
      });

      for (const item of buttonsAccessible) {
        expect(item.accessible, `Button "${item.text}" should be accessible at ${w}x${h}, was blocked by ${item.topEl}`).toBe(true);
      }
    }
  });
});
