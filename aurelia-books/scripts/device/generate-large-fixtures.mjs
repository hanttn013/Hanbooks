// scripts/device/generate-large-fixtures.mjs
import fs from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { strToU8, zipSync } from 'fflate';

const outputDir = path.resolve('tests', 'fixtures', 'large');
await mkdir(outputDir, { recursive: true });

console.log('Generating large fixtures in:', outputDir);

// 1. Thư viện 1.000 sách giả (JSON snapshot for StorageManager.importLibrarySnapshot)
console.log('1/7 Generating 1,000 synthetic books snapshot...');
const formats = ['epub', 'pdf', 'docx', 'txt', 'md', 'pptx', 'cbz'];
const books = [];
const lists = [
  { id: 'list-fav', name: 'Sách yêu thích', color: '#ff4d4f', bookIds: [] },
  { id: 'list-study', name: 'Tài liệu nghiên cứu', color: '#1890ff', bookIds: [] },
  { id: 'list-reading', name: 'Đang đọc dở', color: '#52c41a', bookIds: [] },
];

for (let i = 1; i <= 1000; i++) {
  const id = `synthetic-book-${String(i).padStart(4, '0')}`;
  const format = formats[i % formats.length];
  const progress = (i * 7) % 101;
  const isFinished = progress === 100;
  const book = {
    id,
    title: `Tác phẩm thử nghiệm số ${i}`,
    author: `Tác giả ${(i % 50) + 1}`,
    format,
    fileSize: 1024 * ((i % 500) + 10),
    fileHash: `synthetic-hash-${i}`,
    addedAt: Date.now() - i * 3600000,
    lastOpenedAt: progress > 0 ? Date.now() - (i % 24) * 3600000 : null,
    readingProgress: progress,
    finished: isFinished,
    coverColor: ['#1d39c4', '#eb2f96', '#fa8c16', '#52c41a', '#13c2c2', '#722ed1'][i % 6],
    metadataStatus: 'ready',
  };
  books.push(book);
  if (i % 3 === 0) lists[0].bookIds.push(id);
  if (i % 5 === 0) lists[1].bookIds.push(id);
  if (progress > 0 && !isFinished) lists[2].bookIds.push(id);
}

await writeFile(path.join(outputDir, 'library-1000-books.json'), JSON.stringify({
  version: 4,
  timestamp: Date.now(),
  books,
  lists,
}, null, 2));

// 2. TXT 20 MB
console.log('2/7 Generating 20 MB TXT file...');
const txtPath = path.join(outputDir, 'large-20mb.txt');
const txtStream = fs.createWriteStream(txtPath);
const chapterChunk = 'Chương thử nghiệm hiệu năng ShanBooks.\n' +
  'Đây là đoạn văn bản tiếng Việt mẫu dùng để kiểm tra bộ đọc văn bản dung lượng lớn trên thiết bị di động.\n' +
  'Ứng dụng cần đọc nhanh, cuộn mượt và không bị nghẽn giao diện.\n'.repeat(40);
let writtenBytes = 0;
const target20MB = 20 * 1024 * 1024;
let chapterIdx = 1;
while (writtenBytes < target20MB) {
  const heading = `\n\n=== CHƯƠNG ${chapterIdx++} ===\n\n`;
  const block = heading + chapterChunk;
  const buf = Buffer.from(block, 'utf8');
  txtStream.write(buf);
  writtenBytes += buf.length;
}
await new Promise(resolve => txtStream.end(resolve));

// Helper: Make Minimal PDF
function makePdfMultiPage(pageCount, paddingBytes = 0) {
  const objects = [];
  const kids = [];
  // 1: Catalog, 2: Pages
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  
  let pageObjStart = 3;
  for (let i = 0; i < pageCount; i++) {
    const pageObjId = pageObjStart + i * 2;
    const contentObjId = pageObjId + 1;
    kids.push(`${pageObjId} 0 R`);
  }
  objects.push(`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pageCount} >>`);

  const fontObjId = pageObjStart + pageCount * 2;
  const paddingText = 'X'.repeat(Math.max(0, Math.floor(paddingBytes / pageCount)));

  for (let i = 0; i < pageCount; i++) {
    const contentObjId = pageObjStart + i * 2 + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${contentObjId} 0 R /Resources << /Font << /F1 ${fontObjId} 0 R >> >> >>`);
    const streamContent = `BT /F1 16 Tf 50 780 Td (Trang ${i + 1} / ${pageCount} - ShanBooks PDF Performance Benchmark) Tj ET\n% ${paddingText}\n`;
    objects.push(`<< /Length ${Buffer.byteLength(streamContent)} >>\nstream\n${streamContent}\nendstream`);
  }
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  let body = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((value, index) => {
    offsets.push(Buffer.byteLength(body));
    body += `${index + 1} 0 obj\n${value}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(body, 'ascii');
}

// 3. PDF ~100 trang (~150 KB)
console.log('3/7 Generating 100-page PDF...');
await writeFile(path.join(outputDir, 'large-100pages.pdf'), makePdfMultiPage(100));

// 4. PDF ~100 MB
console.log('4/7 Generating ~100 MB PDF...');
await writeFile(path.join(outputDir, 'large-100mb.pdf'), makePdfMultiPage(50, 100 * 1024 * 1024));

// 5. EPUB ~20 MB
console.log('5/7 Generating ~20 MB EPUB...');
const dummyPayload = Buffer.alloc(19 * 1024 * 1024, 0x61); // 19 MB 'a'
const epubZipEntries = {
  mimetype: strToU8('application/epub+zip'),
  'META-INF/container.xml': strToU8(`<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`),
  'OEBPS/content.opf': strToU8(`<?xml version="1.0"?><package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">shanbooks-perf-20mb</dc:identifier><dc:title>Sách Thử Nghiệm 20MB</dc:title><dc:creator>QA Performance</dc:creator><dc:language>vi</dc:language></metadata><manifest><item id="nav" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="ch1" href="ch1.xhtml" media-type="application/xhtml+xml"/><item id="data" href="data.bin" media-type="application/octet-stream"/></manifest><spine><itemref idref="ch1"/></spine></package>`),
  'OEBPS/toc.xhtml': strToU8(`<!doctype html><html xmlns="http://www.w3.org/1999/xhtml"><body><nav epub:type="toc" xmlns:epub="http://www.idpf.org/2007/ops"><ol><li><a href="ch1.xhtml">Chương 1: Khởi động 20MB</a></li></ol></nav></body></html>`),
  'OEBPS/ch1.xhtml': strToU8(`<!doctype html><html xmlns="http://www.w3.org/1999/xhtml"><body><h1>Chương 1: Khởi động 20MB</h1><p>Đây là tệp EPUB dung lượng lớn ~20MB nhằm kiểm thử tốc độ giải nén và mở trang đọc sách.</p></body></html>`),
  'OEBPS/data.bin': new Uint8Array(dummyPayload),
};
await writeFile(path.join(outputDir, 'large-20mb.epub'), Buffer.from(zipSync(epubZipEntries, { level: 0 })));

// 6. DOCX nhiều ảnh (~12 MB)
console.log('6/7 Generating DOCX with images...');
// Create a 1x1 valid PNG buffer and pad it to 1 MB per image
const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5, 0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
const paddedImg = Buffer.concat([pngHeader, Buffer.alloc(800 * 1024, 0x42)]); // ~800 KB each

const docxEntries = {
  '[Content_Types].xml': strToU8(`<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`),
  '_rels/.rels': strToU8(`<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`),
  'word/_rels/document.xml.rels': strToU8(`<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${Array.from({length: 12}, (_, i) => `<Relationship Id="rId${i+2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${i+1}.png"/>`).join('')}</Relationships>`),
  'word/document.xml': strToU8(`<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Tài liệu DOCX nhiều hình ảnh thử nghiệm hiệu năng.</w:t></w:r></w:p>${Array.from({length: 12}, (_, i) => `<w:p><w:r><w:t>Hình ảnh minh họa số ${i+1}</w:t></w:r></w:p>`).join('')}<w:sectPr/></w:body></w:document>`),
};
for (let i = 1; i <= 12; i++) {
  docxEntries[`word/media/image${i}.png`] = new Uint8Array(paddedImg);
}
await writeFile(path.join(outputDir, 'large-images.docx'), Buffer.from(zipSync(docxEntries, { level: 0 })));

// 7. Oversized file ~500 MB (Sparse/Streamed)
console.log('7/7 Generating ~500 MB limit test file...');
const oversizedPath = path.join(outputDir, 'oversized-500mb.bin');
const oversizedStream = fs.createWriteStream(oversizedPath);
const chunk1MB = Buffer.alloc(1024 * 1024, 0x5a); // 1 MB of 'Z'
for (let i = 0; i < 500; i++) {
  oversizedStream.write(chunk1MB);
}
await new Promise(resolve => oversizedStream.end(resolve));

console.log('All 7 large fixtures generated successfully!');
