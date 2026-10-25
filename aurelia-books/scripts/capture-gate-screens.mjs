// scripts/capture-gate-screens.mjs
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = path.resolve('qa', 'design', 'after-gate');
const BEFORE_DIR = path.resolve('qa', 'design', 'before');
const BASE_URL = 'http://127.0.0.1:4173';

const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800 },
  { name: '412x915', width: 412, height: 915 },
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

async function captureGate() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const server = await ensureServerRunning();
  const browser = await chromium.launch({ headless: true });

  console.log('Bắt đầu chụp ảnh nghiệm thu Cổng Duyệt (AppShell, Library, Home, Lists)...');

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n>>> Chụp Viewport: ${vp.name} (${vp.width}x${vp.height})...`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: 'light',
      });
      const page = await context.newPage();
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const capture = async (screenKey) => {
        for (const mode of ['light', 'dark']) {
          await page.emulateMedia({ colorScheme: mode });
          await page.evaluate((theme) => {
            document.documentElement.setAttribute('data-app-theme', theme);
            document.documentElement.setAttribute('data-theme', theme);
            const frame = document.getElementById('phone-frame');
            if (frame) frame.setAttribute('data-app-theme', theme);
          }, mode);
          await page.waitForTimeout(300);
          const outPath = path.join(OUTPUT_DIR, `${vp.name}-${screenKey}-${mode}.png`);
          await page.screenshot({ path: outPath });
          console.log(`  - Đã lưu: ${path.basename(outPath)}`);
        }
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

      // 1. Home
      await switchTab('home');
      await capture('01-home');

      // 2. Library
      await switchTab('library');
      await capture('02-library');

      // 3. Lists
      await switchTab('lists');
      await capture('03-lists');

      await context.close();
    }

    console.log('\n>>> Đang tạo ảnh so sánh trực tiếp Before vs After (Side-by-Side)...');
    const compPage = await browser.newPage({ viewport: { width: 1000, height: 1200 } });

    const comparisons = [
      {
        title: 'Home Screen (360x800) - Light',
        before: path.join(BEFORE_DIR, '360x800-01-home-light.png'),
        after: path.join(OUTPUT_DIR, '360x800-01-home-light.png'),
        out: path.join(OUTPUT_DIR, 'compare-360-home-light.png'),
      },
      {
        title: 'Home Screen (360x800) - Dark',
        before: path.join(BEFORE_DIR, '360x800-01-home-dark.png'),
        after: path.join(OUTPUT_DIR, '360x800-01-home-dark.png'),
        out: path.join(OUTPUT_DIR, 'compare-360-home-dark.png'),
      },
      {
        title: 'Library Screen (360x800) - Light',
        before: path.join(BEFORE_DIR, '360x800-02-library-grid-light.png'),
        after: path.join(OUTPUT_DIR, '360x800-02-library-light.png'),
        out: path.join(OUTPUT_DIR, 'compare-360-library-light.png'),
      },
      {
        title: 'Library Screen (360x800) - Dark',
        before: path.join(BEFORE_DIR, '360x800-02-library-grid-dark.png'),
        after: path.join(OUTPUT_DIR, '360x800-02-library-dark.png'),
        out: path.join(OUTPUT_DIR, 'compare-360-library-dark.png'),
      },
      {
        title: 'Lists Screen (360x800) - Light',
        before: path.join(BEFORE_DIR, '360x800-05-lists-light.png'),
        after: path.join(OUTPUT_DIR, '360x800-03-lists-light.png'),
        out: path.join(OUTPUT_DIR, 'compare-360-lists-light.png'),
      },
      {
        title: 'Lists Screen (360x800) - Dark',
        before: path.join(BEFORE_DIR, '360x800-05-lists-dark.png'),
        after: path.join(OUTPUT_DIR, '360x800-03-lists-dark.png'),
        out: path.join(OUTPUT_DIR, 'compare-360-lists-dark.png'),
      },
      {
        title: 'Library Screen (412x915) - Light',
        before: path.join(BEFORE_DIR, '412x915-02-library-grid-light.png'),
        after: path.join(OUTPUT_DIR, '412x915-02-library-light.png'),
        out: path.join(OUTPUT_DIR, 'compare-412-library-light.png'),
      },
      {
        title: 'Library Screen (412x915) - Dark',
        before: path.join(BEFORE_DIR, '412x915-02-library-grid-dark.png'),
        after: path.join(OUTPUT_DIR, '412x915-02-library-dark.png'),
        out: path.join(OUTPUT_DIR, 'compare-412-library-dark.png'),
      },
    ];

    for (const c of comparisons) {
      if (!fs.existsSync(c.before) || !fs.existsSync(c.after)) continue;
      const beforeBase64 = fs.readFileSync(c.before).toString('base64');
      const afterBase64 = fs.readFileSync(c.after).toString('base64');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body {
              margin: 0;
              padding: 24px;
              background: #18181B;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #F4F4F5;
              display: inline-block;
            }
            .header {
              font-size: 20px;
              font-weight: 700;
              margin-bottom: 16px;
              letter-spacing: -0.3px;
            }
            .grid {
              display: flex;
              gap: 24px;
            }
            .column {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 8px;
            }
            .label {
              font-size: 13px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.8px;
            }
            .label-before { color: #EF4444; }
            .label-after { color: #10B981; }
            img {
              border-radius: 12px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.5);
              border: 1px solid rgba(255,255,255,0.1);
              display: block;
            }
          </style>
        </head>
        <body>
          <div class="header">${c.title}</div>
          <div class="grid">
            <div class="column">
              <span class="label label-before">BEFORE (Lỗi cũ / Chưa Spectrum)</span>
              <img src="data:image/png;base64,${beforeBase64}" />
            </div>
            <div class="column">
              <span class="label label-after">AFTER (Adobe Spectrum S2 + Lưới 3 cột)</span>
              <img src="data:image/png;base64,${afterBase64}" />
            </div>
          </div>
        </body>
        </html>
      `;

      await compPage.setContent(html);
      await compPage.waitForLoadState('networkidle');
      await compPage.waitForTimeout(300);
      const body = await compPage.$('body');
      await body.screenshot({ path: c.out });
      console.log(`  - Đã xuất ảnh so sánh: ${path.basename(c.out)}`);
    }

    console.log(`\n Hoàn tất toàn bộ ảnh Before/After Cổng Duyệt! Lưu tại: ${OUTPUT_DIR}`);
  } finally {
    await browser.close();
    if (server) server.kill();
  }
}

captureGate().catch(err => {
  console.error('Lỗi thực thi:', err);
  process.exit(1);
});
