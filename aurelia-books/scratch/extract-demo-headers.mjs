import JSZip from 'jszip';
import fs from 'node:fs/promises';

for (const name of ['pride-and-prejudice.epub', 'picture-of-dorian-gray.epub', 'jane-eyre.epub']) {
  const buf = await fs.readFile('public/books/' + name);
  const zip = await JSZip.loadAsync(buf);
  const htmlFiles = Object.keys(zip.files).filter(k => /\.(x?html|htm)$/i.test(k));
  // find file containing Gutenberg
  for (const hf of htmlFiles) {
    const text = await zip.file(hf)?.async('text');
    if (text && text.includes('Gutenberg')) {
      console.log(`=== ${name} (${hf}) ===`);
      console.log(text.slice(0, 1500));
      break;
    }
  }
}
