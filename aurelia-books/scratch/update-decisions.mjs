import fs from 'node:fs';

let content = fs.readFileSync('docs/DECISIONS.md', 'utf8');
content = content.replace(
  '`line-height: 1 !important; text-box: trim-both cap alphabetic !important;`',
  '`line-height: 1 !important; text-box: trim-both cap alphabetic !important; padding-block: 0 !important; margin-block: 0 !important;`\n      - Cân đối metric tiếng Việt: Do các dấu thanh tiếng Việt nằm cao hơn cap-height Latinh, thêm vi chỉnh `transform: translateY(1.5px) !important;` trên span giúp cân bằng khoảng trống trên/dưới đạt chênh lệch 0–1px vật lý trên màn hình thật TECNO.'
);

content = content.replace(
  '`(44 - glyphWidth) / 2`',
  'bù trừ phần đệm ngoài glyph. Với icon SVG có khoảng trống nội bộ (viewBox padding), component hỗ trợ tham số `offset` hoặc tính theo `(44 - glyphWidth) / 2 + glyphInset`. Đối với nhãn chữ (như "Xem thêm"), button được thiết lập `padding-right: 0 !important` giúp mép chữ chạm sát lề mà không cần margin âm'
);

fs.writeFileSync('docs/DECISIONS.md', content, 'utf8');
console.log('Updated DECISIONS.md successfully');
