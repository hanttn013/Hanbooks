// scripts/download-fonts.mjs
import fs from 'node:fs';
import path from 'node:path';

const FONTS_DIR = path.resolve('public', 'fonts');
fs.mkdirSync(FONTS_DIR, { recursive: true });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function downloadFont(name, url) {
  const cssRes = await fetch(url, { headers: { 'User-Agent': UA } });
  const css = await cssRes.text();

  // Match all @font-face blocks for latin, latin-ext, vietnamese
  const fontFaceRegex = /@font-face\s*\{([^}]+)\}/g;
  let match;
  let localCss = '';
  let count = 0;

  while ((match = fontFaceRegex.exec(css)) !== null) {
    const block = match[1];
    const srcMatch = block.match(/src:\s*url\((https:[^)]+)\)\s*format\('([^']+)'\)/);
    const weightMatch = block.match(/font-weight:\s*(\d+)/);
    const styleMatch = block.match(/font-style:\s*(\w+)/);
    const rangeMatch = block.match(/unicode-range:\s*([^;]+);/);

    if (srcMatch) {
      const remoteUrl = srcMatch[1];
      const format = srcMatch[2];
      const weight = weightMatch ? weightMatch[1] : '400';
      const style = styleMatch ? styleMatch[1] : 'normal';
      count++;
      const localFileName = `${name.toLowerCase().replace(/\s+/g, '-')}-${style}-${weight}-${count}.${format}`;
      const localFilePath = path.join(FONTS_DIR, localFileName);

      console.log(`Đang tải font: ${localFileName}...`);
      const fileRes = await fetch(remoteUrl);
      const buffer = await fileRes.arrayBuffer();
      fs.writeFileSync(localFilePath, Buffer.from(buffer));

      localCss += `@font-face {\n  font-family: '${name}';\n  font-style: ${style};\n  font-weight: ${weight};\n  font-display: swap;\n  src: url('/fonts/${localFileName}') format('${format}');\n  unicode-range: ${rangeMatch ? rangeMatch[1] : 'U+0000-00FF'};\n}\n\n`;
    }
  }

  return localCss;
}

async function main() {
  console.log('Bắt đầu tải các font cục bộ hỗ trợ tiếng Việt (SIL OFL 1.1)...');
  
  // 1. Be Vietnam Pro (UI / Sans)
  const beVietnamCss = await downloadFont(
    'Be Vietnam Pro',
    'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap'
  );

  // 2. Lora (Editorial / Serif)
  const loraCss = await downloadFont(
    'Lora',
    'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;1,400&display=swap'
  );

  const fullCss = `/* ===================================================
   LOCAL BUNDLED FONTS (SIL Open Font License 1.1)
   - Be Vietnam Pro (Humanist UI Sans, optimized for Vietnamese diacritics)
   - Lora (Contemporary Editorial Serif for Book Titles & Literature)
   =================================================== */\n\n${beVietnamCss}\n${loraCss}`;

  fs.writeFileSync(path.join(FONTS_DIR, 'fonts.css'), fullCss, 'utf8');
  console.log('Hoàn tất tải và cấu hình font cục bộ tại public/fonts/fonts.css!');
}

main().catch(err => {
  console.error('Lỗi khi tải font:', err);
  process.exit(1);
});
