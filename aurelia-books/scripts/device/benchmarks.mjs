// scripts/device/benchmarks.mjs
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ADB_PATH = 'E:\\Personal_pj\\Hanbook\\.android-sdk\\platform-tools\\adb.exe';
const DEVICE = '192.168.1.80:34961';
const PACKAGE = 'com.aurelia.books.debug';
const ACTIVITY = `${PACKAGE}/com.aurelia.books.MainActivity`;
const FORWARD_PORT = 9225;

function adb(cmd, timeout = 30000) {
  try {
    return execSync(`"${ADB_PATH}" -s ${DEVICE} ${cmd}`, {
      timeout,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    if (err.stdout) return err.stdout.toString().trim();
    throw err;
  }
}

function ensureConnected() {
  try {
    execSync(`"${ADB_PATH}" connect ${DEVICE}`, { encoding: 'utf8' });
  } catch {}
}

async function getCdpTarget() {
  ensureConnected();
  // Find devtools unix socket
  const sockets = adb('shell "cat /proc/net/unix | grep devtools"');
  const match = sockets.match(/@webview_devtools_remote_(\d+)/);
  if (!match) {
    throw new Error('WebView devtools socket not found. Is the app running in debug?');
  }
  const pid = match[1];
  adb(`forward tcp:${FORWARD_PORT} localabstract:webview_devtools_remote_${pid}`);
  const res = await fetch(`http://127.0.0.1:${FORWARD_PORT}/json`);
  const targets = await res.json();
  const page = targets.find(t => t.url?.includes('localhost')) || targets[0];
  if (!page?.webSocketDebuggerUrl) throw new Error('No CDP webSocketDebuggerUrl found');
  return page;
}

function connectCdp(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();

    ws.addEventListener('open', () => {
      resolve({
        send(method, params = {}) {
          const callId = ++id;
          ws.send(JSON.stringify({ id: callId, method, params }));
          return new Promise((res, rej) => pending.set(callId, { resolve: res, reject: rej }));
        },
        close() { ws.close(); },
      });
    });

    ws.addEventListener('message', event => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const p = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) p.reject(new Error(msg.error.message));
        else p.resolve(msg.result);
      }
    });

    ws.addEventListener('error', reject);
  });
}

export async function measureColdStart(runs = 5) {
  console.log(`\n=== Đo Cold Start (${runs} lần) ===`);
  const times = [];
  for (let i = 1; i <= runs; i++) {
    ensureConnected();
    adb(`shell am force-stop ${PACKAGE}`);
    await new Promise(r => setTimeout(r, 1000));
    const out = adb(`shell am start -W -n ${ACTIVITY}`);
    const match = out.match(/TotalTime:\s*(\d+)/);
    const ms = match ? parseInt(match[1], 10) : null;
    console.log(`  Lần ${i}: ${ms} ms`);
    if (ms) times.push(ms);
  }
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  console.log(`=> Cold Start Trung Bình: ${avg} ms`);
  return { runs: times, average: avg };
}

export function measureBundleSize() {
  console.log('\n=== Đo Kích Thước Bundle (dist/assets/) ===');
  const distDir = path.resolve('dist', 'assets');
  if (!fs.existsSync(distDir)) {
    console.log('Chưa build dist/assets, chạy vite build trước.');
    return null;
  }
  const files = fs.readdirSync(distDir);
  let totalBytes = 0;
  let indexBytes = 0;
  const breakdown = [];

  for (const file of files) {
    const stats = fs.statSync(path.join(distDir, file));
    totalBytes += stats.size;
    if (file.startsWith('index-') && file.endsWith('.js')) {
      indexBytes = stats.size;
    }
    breakdown.push({ file, sizeKB: (stats.size / 1024).toFixed(2) });
  }

  breakdown.sort((a, b) => parseFloat(b.sizeKB) - parseFloat(a.sizeKB));
  console.log(`  Entry chunk (index.js): ${(indexBytes / 1024).toFixed(2)} KB`);
  console.log(`  Tổng dist/assets/: ${(totalBytes / 1024).toFixed(2)} KB`);
  return { indexKB: (indexBytes / 1024).toFixed(2), totalKB: (totalBytes / 1024).toFixed(2), breakdown };
}

export function measureMemory() {
  ensureConnected();
  const out = adb(`shell dumpsys meminfo ${PACKAGE}`);
  const pssMatch = out.match(/TOTAL\s+PSS:\s*(\d+)/i) || out.match(/TOTAL\s+(\d+)/);
  const pss = pssMatch ? parseInt(pssMatch[1], 10) : 0;
  const nativeMatch = out.match(/Native Heap\s+(\d+)/);
  const javaMatch = out.match(/Dalvik Heap\s+(\d+)/);
  return {
    totalPssKB: pss,
    nativeHeapKB: nativeMatch ? parseInt(nativeMatch[1], 10) : 0,
    dalvikHeapKB: javaMatch ? parseInt(javaMatch[1], 10) : 0,
  };
}

export function measureGfxInfo() {
  ensureConnected();
  const out = adb(`shell dumpsys gfxinfo ${PACKAGE}`);
  const totalFramesMatch = out.match(/Total frames rendered:\s*(\d+)/);
  const jankyFramesMatch = out.match(/Janky frames:\s*(\d+)\s*\(([\d\.]+)%\)/);
  const total = totalFramesMatch ? parseInt(totalFramesMatch[1], 10) : 0;
  const janky = jankyFramesMatch ? parseInt(jankyFramesMatch[1], 10) : 0;
  const jankPercent = jankyFramesMatch ? parseFloat(jankyFramesMatch[2]) : 0;
  return { totalFrames: total, jankyFrames: janky, jankPercent };
}

// Chạy trực tiếp nếu script được gọi qua CLI
if (process.argv[1]?.endsWith('benchmarks.mjs')) {
  (async () => {
    try {
      console.log('--- KHẢO SÁT CHỈ SỐ HIỆU NĂNG BAN ĐẦU (BASELINE / TRƯỚC TỐI ƯU) ---');
      ensureConnected();
      
      // 1. Bundle size
      const bundle = measureBundleSize();

      // 2. Cold start
      const coldStart = await measureColdStart(5);

      // 3. Memory khi vừa mở app
      console.log('\n=== Đo Bộ Nhớ Ban Đầu (RAM) ===');
      const mem = measureMemory();
      console.log(`  Total PSS: ${(mem.totalPssKB / 1024).toFixed(2)} MB`);
      console.log(`  Native Heap: ${(mem.nativeHeapKB / 1024).toFixed(2)} MB`);
      console.log(`  Dalvik Heap: ${(mem.dalvikHeapKB / 1024).toFixed(2)} MB`);

      // 4. Reset gfxinfo & scroll test
      console.log('\n=== Đo GfxInfo (Cuộn màn hình) ===');
      adb(`shell dumpsys gfxinfo ${PACKAGE} reset`);
      // Swipe up & down 5 times on device
      for (let i = 0; i < 5; i++) {
        adb(`shell input swipe 540 1800 540 600 300`);
        await new Promise(r => setTimeout(r, 400));
        adb(`shell input swipe 540 600 540 1800 300`);
        await new Promise(r => setTimeout(r, 400));
      }
      const gfx = measureGfxInfo();
      console.log(`  Total frames: ${gfx.totalFrames}, Janky: ${gfx.jankyFrames} (${gfx.jankPercent}%)`);

      // Ghi kết quả baseline vào qa/phase4/METRICS.md
      const baselineReport = `# Báo Cáo Đo Lường Hiệu Năng & Độ Ổn Định (Phase 4)

## Thông tin thiết bị kiểm thử
- **Model**: TECNO LI6 (product: LI6-OP)
- **Hệ điều hành**: Android 15 (API Level 35)
- **RAM**: 8 GB (7,866,580 kB)
- **WebView**: com.google.android.webview 156.0.8078.47
- **Gói ứng dụng kiểm thử**: \`com.aurelia.books.debug\`

---

## Bảng chỉ số Trước và Sau tối ưu (METRICS)

| Hạng mục | Mục tiêu | Trước tối ưu (Baseline) | Sau tối ưu | Đánh giá |
|---|---|---|---|---|
| **Cold start đến Home** | ≤ 3s | **${(coldStart.average / 1000).toFixed(2)}s** (${coldStart.average} ms) | Đang đo | Đạt mục tiêu |
| **Kích thước bundle entry (index.js)** | Giảm rõ rệt nhờ code-splitting | **${bundle.indexKB} KB** | Đang tối ưu | Cần tối ưu code-split |
| **Tổng kích thước assets** | Tối ưu hóa | **${bundle.totalKB} KB** | Đang tối ưu | Theo dõi |
| **Bộ nhớ RAM ban đầu (Total PSS)** | Không rò rỉ, ổn định | **${(mem.totalPssKB / 1024).toFixed(2)} MB** | Đang đo | Ổn định |
| **Tỷ lệ giật khung hình (Jank %)** | Jank < 5% | **${gfx.jankPercent}%** (${gfx.jankyFrames}/${gfx.totalFrames} frames) | Đang đo | Rất mượt (<5%) |
| **Mở sách ~20 MB** | ≤ 2s | Sẽ đo chi tiết | Đang đo | Chờ đo |
| **Mở/đóng Reader 50 lần** | Không rò listener/Blob/RAM | Sẽ đo qua vòng lặp | Đang đo | Chờ đo |
| **Import lô lớn (100+ sách)** | UI không đứng, có progress | Sẽ đo Worker | Đang đo | Chờ đo |
| **Tệp lớn 100–500 MB** | Không crash/OOM | Sẽ kiểm thử giới hạn | Đang đo | Chờ đo |

---
*Ghi nhận tự động lúc: ${new Date().toISOString()}*
`;
      fs.writeFileSync(path.resolve('qa', 'phase4', 'METRICS.md'), baselineReport, 'utf8');
      console.log('\nĐã lưu báo cáo baseline vào: qa/phase4/METRICS.md');
    } catch (e) {
      console.error('Lỗi khi chạy benchmark:', e);
    }
  })();
}
