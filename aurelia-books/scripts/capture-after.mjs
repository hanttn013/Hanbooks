// scripts/capture-after.mjs
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = path.resolve('qa', 'design', 'after');
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

  console.log('Bắt đầu chụp ảnh After (Giai đoạn 2 - Library + Home)...');

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
          document.documentElement.setAttribute('data-app-theme', 'light');
          document.documentElement.setAttribute('data-theme', 'light');
          const frame = document.getElementById('phone-frame');
          if (frame) frame.setAttribute('data-app-theme', 'light');
        });
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(OUTPUT_DIR, `${vp.name}-${filenameBase}-light.png`) });

        // Dark mode
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.evaluate(() => {
          document.documentElement.setAttribute('data-app-theme', 'dark');
          document.documentElement.setAttribute('data-theme', 'dark');
          const frame = document.getElementById('phone-frame');
          if (frame) frame.setAttribute('data-app-theme', 'dark');
        });
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(OUTPUT_DIR, `${vp.name}-${filenameBase}-dark.png`) });

        // Reset to light
        await page.emulateMedia({ colorScheme: 'light' });
        await page.evaluate(() => {
          document.documentElement.setAttribute('data-app-theme', 'light');
          document.documentElement.setAttribute('data-theme', 'light');
          const frame = document.getElementById('phone-frame');
          if (frame) frame.setAttribute('data-app-theme', 'light');
        });
      };

      const switchTab = async (tabId) => {
        await page.evaluate((id) => {
          const btns = Array.from(document.querySelectorAll(`button[data-tab="${id}"]`));
          const visible = btns.find(b => {
            const rect = b.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && window.getComputedStyle(b).display !== 'none';
          });
          if (visible) visible.click();
          else if (btns[0]) btns[0].click();
        }, tabId);
        await page.waitForTimeout(500);
      };

      // 1. Home Screen
      await switchTab('home');
      await capture('01-home');

      // 2. Library Grid
      await switchTab('library');
      await capture('02-library-grid');

      // 3. Library List View
      await page.evaluate(() => {
        const toggleBtn = Array.from(document.querySelectorAll('button[aria-label]'))
          .find(b => b.getAttribute('aria-label')?.includes('view') || b.getAttribute('aria-label')?.includes('hiển thị'));
        if (toggleBtn) toggleBtn.click();
      });
      await page.waitForTimeout(300);
      await capture('02-library-list');

      // Reset back to grid
      await page.evaluate(() => {
        const toggleBtn = Array.from(document.querySelectorAll('button[aria-label]'))
          .find(b => b.getAttribute('aria-label')?.includes('view') || b.getAttribute('aria-label')?.includes('hiển thị'));
        if (toggleBtn) toggleBtn.click();
      });

      // 4. Style Guide Screen (/#/dev/design)
      await page.goto(`${BASE_URL}/#/dev/design`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);
      await capture('dev-design-system');

      await context.close();
    }

    console.log(`\n Hoàn thành chụp ảnh After! Đã lưu ảnh vào ${OUTPUT_DIR}`);
  } finally {
    await browser.close();
    if (server) server.kill();
  }
}

captureAll().catch(err => {
  console.error('Lỗi chụp ảnh:', err);
  process.exit(1);
});
