import JSZip from 'jszip';
import fs from 'node:fs/promises';

for (const name of ['pride-and-prejudice.epub', 'picture-of-dorian-gray.epub', 'jane-eyre.epub']) {
  const buf = await fs.readFile('public/books/' + name);
  const zip = await JSZip.loadAsync(buf);
  console.log('=== ' + name + ' ===');
  // find html/xhtml files
  const htmlFiles = Object.keys(zip.files).filter(k => /\.(x?html|htm)$/i.test(k));
  for (const hf of htmlFiles.slice(0, 3)) {
    const text = await zip.file(hf)?.async('text');
    if (text && text.includes('Gutenberg')) {
      console.log(`--- ${hf} (len: ${text.length}) ---`);
      console.log(text.slice(0, 800));
      break;
    }
  }
}
