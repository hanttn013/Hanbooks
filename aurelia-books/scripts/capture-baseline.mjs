// scripts/capture-baseline.mjs
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = path.resolve('qa', 'design', 'before');
const BASE_URL = 'http://127.0.0.1:4173';

const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800 },
  { name: '412x915', width: 412, height: 915 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '800x360', width: 800, height: 360 }, // Landscape phone
];

async function ensureServerRunning() {
  try {
    const res = await fetch(BASE_URL);
    if (res.ok) return null;
  } catch {}

  console.log('Khởi động Vite server trên cổng 4173...');
  const server = spawn('npm.cmd', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173'], {
    stdio: 'ignore',
    shell: true,
  });

  const start = Date.now();
  while (Date.now() - start < 30000) {
    try {
      const res = await fetch(BASE_URL);
      if (res.ok) {
        console.log('Vite server đã sẵn sàng!');
        return server;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('Không thể kết nối Vite server sau 30 giây');
}

async function captureAll() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const server = await ensureServerRunning();
  const browser = await chromium.launch({ headless: true });

  console.log('Bắt đầu chụp ảnh Baseline (Giai đoạn 0)...');

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n>>> Đang chụp Viewport: ${vp.name} (${vp.width}x${vp.height})...`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: 'light',
      });
      const page = await context.newPage();
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const capture = async (filenameBase) => {
        // Light mode
        await page.emulateMedia({ colorScheme: 'light' });
        await page.evaluate(() => {
          document.documentElement.setAttribute('data-theme', 'light');
          document.body.setAttribute('data-theme', 'light');
        });
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(OUTPUT_DIR, `${vp.name}-${filenameBase}-light.png`) });

        // Dark mode
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.evaluate(() => {
          document.documentElement.setAttribute('data-theme', 'dark');
          document.body.setAttribute('data-theme', 'dark');
        });
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(OUTPUT_DIR, `${vp.name}-${filenameBase}-dark.png`) });

        // Reset to light
        await page.emulateMedia({ colorScheme: 'light' });
        await page.evaluate(() => {
          document.documentElement.setAttribute('data-theme', 'light');
          document.body.setAttribute('data-theme', 'light');
        });
      };

      const switchTab = async (tabIndex) => {
        await page.evaluate((idx) => {
          const btns = Array.from(document.querySelectorAll('nav[aria-label] button'));
          if (btns[idx]) btns[idx].click();
        }, tabIndex);
        await page.waitForTimeout(400);
      };

      // 1. Home Screen (Tab 0)
      await switchTab(0);
      await capture('01-home');

      // 2. Library Grid (Tab 1)
      await switchTab(1);
      await page.evaluate(() => {
        const gridBtn = document.querySelector('button[aria-label*="Lưới"], button[aria-label*="Grid"]');
        if (gridBtn) gridBtn.click();
      });
      await page.waitForTimeout(300);
      await capture('02-library-grid');

      // 3. Library List (Tab 1)
      await page.evaluate(() => {
        const listBtn = document.querySelector('button[aria-label*="Danh sách"], button[aria-label*="List"]');
        if (listBtn) listBtn.click();
      });
      await page.waitForTimeout(300);
      await capture('03-library-list');

      // Switch back to grid
      await page.evaluate(() => {
        const gridBtn = document.querySelector('button[aria-label*="Lưới"], button[aria-label*="Grid"]');
        if (gridBtn) gridBtn.click();
      });
      await page.waitForTimeout(200);

      // 4. Book Detail Modal
      await page.evaluate(() => {
        const infoBtn = document.querySelector('button[aria-label*="Book info:"], button[aria-label*="Thông tin:"]');
        if (infoBtn) infoBtn.click();
      });
      await page.waitForTimeout(600);
      await capture('04-book-detail');

      // 5. Open Reader from Book Detail
      const openedReader = await page.evaluate(() => {
        const readBtn = document.querySelector('div[role="dialog"] button');
        // Tìm nút Read / Continue / Đọc
        const allBtns = Array.from(document.querySelectorAll('div[role="dialog"] button'));
        const target = allBtns.find(b => /Read|Continue|Đọc/i.test(b.textContent || b.getAttribute('aria-label') || ''));
        if (target) {
          target.click();
          return true;
        }
        return false;
      });

      if (openedReader) {
        await page.waitForTimeout(2000);
        await capture('05-reader-chrome');

        // 6. Reader TOC
        await page.evaluate(() => {
          const tocBtn = document.querySelector('button[aria-label*="Mục lục"], button[aria-label*="TOC"], button[aria-label*="Table of contents"]');
          if (tocBtn) tocBtn.click();
        });
        await page.waitForTimeout(500);
        await capture('06-reader-toc');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        // 7. Reader Search
        await page.evaluate(() => {
          const searchBtn = document.querySelector('button[aria-label*="Tìm kiếm"], button[aria-label*="Search"]');
          if (searchBtn) searchBtn.click();
        });
        await page.waitForTimeout(500);
        await capture('07-reader-search');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        // 8. Reader Settings
        await page.evaluate(() => {
          const setBtn = document.querySelector('button[aria-label*="Cài đặt đọc"], button[aria-label*="Reader settings"]');
          if (setBtn) setBtn.click();
        });
        await page.waitForTimeout(500);
        await capture('08-reader-settings');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        // Close Reader
        await page.evaluate(() => {
          const closeBtn = document.querySelector('button[aria-label*="Đóng"], button[aria-label*="Close"]');
          if (closeBtn) closeBtn.click();
        });
        await page.waitForTimeout(600);
      } else {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }

      // Đảm bảo không còn modal/dialog backdrop nào chặn
      await page.evaluate(() => {
        document.querySelectorAll('div[role="dialog"], div[data-rac][class*="Overlay"]').forEach(el => el.remove());
      });
      await page.waitForTimeout(200);

      // 9. Lists Screen (Tab 2)
      await switchTab(2);
      await capture('09-lists');

      // 10. Settings Screen (Tab 3)
      await switchTab(3);
      await capture('10-settings');

      await context.close();
      console.log(`   Đã hoàn tất Viewport: ${vp.name}`);
    }

    console.log(`\n=====================================================`);
    console.log(`   ĐÃ CHỤP THÀNH CÔNG TOÀN BỘ BASELINE SCREENSHOTS!`);
    console.log(`   Thư mục lưu trữ: ${OUTPUT_DIR}`);
    console.log(`=====================================================`);
  } finally {
    await browser.close();
    if (server) server.kill();
  }
}

captureAll().catch(err => {
  console.error('Lỗi khi chụp baseline:', err);
  process.exit(1);
});
