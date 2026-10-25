import JSZip from 'jszip';
import fs from 'node:fs/promises';

for (const name of ['pride-and-prejudice.epub', 'picture-of-dorian-gray.epub', 'jane-eyre.epub']) {
  const buf = await fs.readFile('public/books/' + name);
  const zip = await JSZip.loadAsync(buf);
  const container = await zip.file('META-INF/container.xml')?.async('text');
  const opfMatch = container?.match(/full-path="([^"]+)"/);
  const opfPath = opfMatch ? opfMatch[1] : null;
  const opf = opfPath ? await zip.file(opfPath)?.async('text') : null;
  const descMatch = opf?.match(/<dc:description[^>]*>([\s\S]*?)<\/dc:description>/i);
  console.log('=== ' + name + ' ===');
  console.log(descMatch ? descMatch[1] : 'NO DESCRIPTION IN OPF');
}
