// scripts/reproduce-phase-a.mjs
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = path.resolve(__dirname, '../qa/fix/before');

const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800 },
  { name: '412x915', width: 412, height: 915 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '800x360-landscape', width: 800, height: 360 },
];

async function run() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const report = [];

  for (const vp of VIEWPORTS) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme,
      });
      const page = await context.newPage();
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Set theme attribute
      await page.evaluate((th) => {
        document.documentElement.setAttribute('data-app-theme', th);
        document.documentElement.setAttribute('data-theme', th);
      }, theme);

      // Go to Settings tab
      await page.evaluate(() => {
        const btn = document.querySelector('button[data-tab="settings"]');
        if (btn) btn.click();
      });
      await page.waitForTimeout(400);

      // Scroll to bottom
      await page.evaluate(() => {
        const scrollElem = document.querySelector('.screen-scroll') || document.querySelector('main') || document.documentElement;
        if (scrollElem) scrollElem.scrollTop = scrollElem.scrollHeight;
      });
      await page.waitForTimeout(300);

      // Screenshot settings bottom
      const screenshotName = `settings-bottom-${vp.name}-${theme}.png`;
      await page.screenshot({ path: path.join(OUTPUT_DIR, screenshotName) });

      // Check overlap on the Danger Zone / Clear Data button
      const overlapInfo = await page.evaluate(() => {
        const dangerBtn = document.querySelector('section.settings-section:last-child button') ||
                          document.querySelector('button:has-text("Xóa toàn bộ dữ liệu")') ||
                          Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Xóa toàn bộ dữ liệu') || b.textContent.includes('Delete all'));
        
        const nav = document.querySelector('nav[aria-label="Primary navigation"], nav[aria-label="Điều hướng chính"]') ||
                    document.querySelector('.mobileTabBar');

        if (!dangerBtn) return { foundBtn: false };

        const btnRect = dangerBtn.getBoundingClientRect();
        const navRect = nav ? nav.getBoundingClientRect() : null;

        // Center of button
        const cx = btnRect.left + btnRect.width / 2;
        const cy = btnRect.top + btnRect.height / 2;
        const elemAtPoint = document.elementFromPoint(cx, cy);
        const isSelfOrChild = elemAtPoint === dangerBtn || dangerBtn.contains(elemAtPoint);

        let intersectsNav = false;
        if (navRect) {
          intersectsNav = !(
            btnRect.right < navRect.left ||
            btnRect.left > navRect.right ||
            btnRect.bottom < navRect.top ||
            btnRect.top > navRect.bottom
          );
        }

        return {
          foundBtn: true,
          btnRect: { top: btnRect.top, bottom: btnRect.bottom, left: btnRect.left, right: btnRect.right, height: btnRect.height },
          navRect: navRect ? { top: navRect.top, bottom: navRect.bottom, height: navRect.height } : null,
          cx,
          cy,
          elemAtPointTag: elemAtPoint?.tagName,
          elemAtPointClass: elemAtPoint?.className,
          isSelfOrChild,
          intersectsNav,
          btnText: dangerBtn.textContent.trim(),
        };
      });

      report.push({
        viewport: vp.name,
        theme,
        screenshot: screenshotName,
        overlapInfo,
      });

      await context.close();
    }
  }

  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}

run().catch(console.error);
