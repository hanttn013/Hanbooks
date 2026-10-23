import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { strToU8, zipSync } from 'fflate';

const outputDir = path.resolve('tests', 'fixtures');
const xml = value => strToU8(value.trim());

function makeZip(entries) {
  return Buffer.from(zipSync(entries, { level: 0 }));
}

function makePdf() {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 400] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    '<< /Length 58 >>\nstream\nBT /F1 18 Tf 36 320 Td (ShanBooks PDF fixture) Tj ET\nendstream',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
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

await mkdir(outputDir, { recursive: true });

await writeFile(path.join(outputDir, 'sample.epub'), makeZip({
  mimetype: strToU8('application/epub+zip'),
  'META-INF/container.xml': xml(`<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`),
  'OEBPS/content.opf': xml(`<?xml version="1.0"?><package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">shanbooks-fixture</dc:identifier><dc:title>Sách thử nghiệm</dc:title><dc:creator>QA ShanBooks</dc:creator><dc:language>vi</dc:language></metadata><manifest><item id="nav" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="chapter" href="chapter1.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="chapter"/></spine></package>`),
  'OEBPS/toc.xhtml': xml(`<!doctype html><html xmlns="http://www.w3.org/1999/xhtml"><body><nav epub:type="toc" xmlns:epub="http://www.idpf.org/2007/ops"><ol><li><a href="chapter1.xhtml">Chương 1</a></li></ol></nav></body></html>`),
  'OEBPS/chapter1.xhtml': xml(`<!doctype html><html xmlns="http://www.w3.org/1999/xhtml"><body><h1>Chương 1</h1><p>Nội dung tiếng Việt dùng cho kiểm thử offline.</p></body></html>`),
}));

await writeFile(path.join(outputDir, 'sample.pdf'), makePdf());

await writeFile(path.join(outputDir, 'sample.docx'), makeZip({
  '[Content_Types].xml': xml(`<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`),
  '_rels/.rels': xml(`<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`),
  'word/document.xml': xml(`<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Tài liệu thử nghiệm</w:t></w:r></w:p><w:p><w:r><w:t>Nội dung DOCX tiếng Việt.</w:t></w:r></w:p><w:sectPr/></w:body></w:document>`),
}));

await writeFile(path.join(outputDir, 'sample.pptx'), makeZip({
  '[Content_Types].xml': xml(`<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>`),
  '_rels/.rels': xml(`<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>`),
  'ppt/presentation.xml': xml(`<?xml version="1.0"?><p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst></p:presentation>`),
  'ppt/_rels/presentation.xml.rels': xml(`<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/></Relationships>`),
  'ppt/slides/slide1.xml': xml(`<?xml version="1.0"?><p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree><p:sp><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>ShanBooks PPTX fixture</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>`),
}));

await writeFile(path.join(outputDir, 'sample.txt'), 'Chương 1\n\nNội dung TXT tiếng Việt dùng cho kiểm thử.\n', 'utf8');
await writeFile(path.join(outputDir, 'sample-utf16le.txt'), Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('Chương 1\r\nNội dung UTF-16.', 'utf16le')]));
await writeFile(path.join(outputDir, 'sample.md'), '# Tài liệu Markdown\n\nNội dung **kiểm thử** ShanBooks.\n', 'utf8');
await writeFile(path.join(outputDir, 'sample.html'), '<!doctype html><html lang="vi"><body><h1>Tài liệu HTML</h1><p>Nội dung an toàn.</p><script>window.fixtureScriptRan=true</script></body></html>', 'utf8');
await writeFile(path.join(outputDir, 'sample.fb2'), '<?xml version="1.0" encoding="utf-8"?><FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0"><description><title-info><book-title>Sách FB2 thử nghiệm</book-title><lang>vi</lang></title-info></description><body><section><title><p>Chương 1</p></title><p>Nội dung thử nghiệm.</p></section></body></FictionBook>', 'utf8');

const onePixelPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
await writeFile(path.join(outputDir, 'sample.cbz'), makeZip({ '001.png': onePixelPng }));
await writeFile(path.join(outputDir, 'corrupt.epub'), 'not an epub archive', 'utf8');
await writeFile(path.join(outputDir, 'empty.txt'), Buffer.alloc(0));
await writeFile(path.join(outputDir, 'legacy.doc'), Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));

await writeFile(path.join(outputDir, 'mixed-documents.zip'), makeZip({
  'library/sample.pdf': await readFile(path.join(outputDir, 'sample.pdf')),
  'library/sample.docx': await readFile(path.join(outputDir, 'sample.docx')),
  'notes/sample.md': await readFile(path.join(outputDir, 'sample.md')),
  'ignored.exe': Buffer.from('not supported'),
}));

await writeFile(path.join(outputDir, 'too-deep.zip'), makeZip({
  '1/2/3/4/5/6/7/8/9/10/11/12/13/sample.txt': Buffer.from('too deep'),
}));

console.log(`Generated deterministic fixtures in ${outputDir}`);
