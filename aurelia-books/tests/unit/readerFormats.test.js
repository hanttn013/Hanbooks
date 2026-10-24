import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createReaderAdapter } from '../../src/readers/readerRegistry';
import { createLocator, parseLocator } from '../../src/readers/locator';

async function fixture(name, type = '') {
  const bytes = await readFile(path.resolve('tests', 'fixtures', name));
  return new File([bytes], name, { type });
}

describe('reflowable reader adapters', () => {
  it('search results navigate to stable paragraph locators', async () => {
    const adapter = await createReaderAdapter('md');
    await adapter.open(new File(['# First\n\nOpening text.\n\n# Second\n\nDistinct needle here.'], 'search.md'));
    const [result] = await adapter.search('needle');
    const target = parseLocator(result.locator);
    expect(target).toMatchObject({ quote: 'needle' });
    expect(adapter.getContent()).toContain(`id="${target.anchor}"`);
    expect(parseLocator((await adapter.goTo(result.locator)).locator)).toMatchObject(target);
    adapter.destroy();
  });

  it('removes inline CSS and external resource requests from HTML', async () => {
    const adapter = await createReaderAdapter('html');
    await adapter.open(new File(['<p style="background:url(https://example.com/track)">Safe</p><iframe src="https://example.com"></iframe>'], 'unsafe.html'));
    expect(adapter.getContent()).not.toMatch(/style=|iframe|example\.com/);
    adapter.destroy();
  });
  it('decodes UTF-16 text and exposes a format-neutral location', async () => {
    const file = await fixture('sample-utf16le.txt', 'text/plain');
    const adapter = await createReaderAdapter('txt', { book: { fileName: file.name } });
    await adapter.open(file);
    expect(adapter.getContent()).toContain('Nội dung UTF-16');
    expect(adapter.getLocation()).toMatchObject({ percentage: 0 });
    expect(await adapter.getMetadata()).toMatchObject({ format: 'txt', encoding: 'utf-16le' });
    const restored = await adapter.goTo(createLocator('txt', { anchor: 'top', offset: 0.42 }));
    expect(parseLocator(restored.locator)).toMatchObject({ anchor: 'top', offset: 0.42 });
    expect(restored.percentage).toBe(0.42);
    adapter.destroy();
  });

  it('renders Markdown but sanitizes executable markup', async () => {
    const adapter = await createReaderAdapter('md');
    await adapter.open(new File(['# Safe\n\n<img src=x onerror=alert(1)><script>bad()</script>'], 'unsafe.md'));
    expect(adapter.getContent()).toContain('>Safe</h1>');
    expect(adapter.getContent()).not.toMatch(/script|onerror/i);
    adapter.destroy();
  });

  it('converts DOCX headings and text to safe HTML', async () => {
    const file = await fixture('sample.docx');
    const adapter = await createReaderAdapter('docx', { book: { fileName: file.name } });
    await adapter.open(file);
    expect(adapter.getContent()).toContain('Nội dung DOCX tiếng Việt');
    expect(await adapter.getToc()).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Tài liệu thử nghiệm' }),
    ]));
    adapter.destroy();
  });
});

describe('fixed-layout reader adapters', () => {
  it('reads PDF page count and searchable text', async () => {
    const file = await fixture('sample.pdf', 'application/pdf');
    const adapter = await createReaderAdapter('pdf', { book: { title: 'Fixture PDF' } });
    await adapter.open(file);
    expect(await adapter.getMetadata()).toMatchObject({ format: 'pdf', estimatedPages: 1 });
    expect(await adapter.search('ShanBooks')).toEqual([
      expect.objectContaining({ page: 1 }),
    ]);
    adapter.destroy();
  });

  it('opens CBZ pages in stable natural order and revokes them on destroy', async () => {
    const file = await fixture('sample.cbz');
    const adapter = await createReaderAdapter('cbz');
    await adapter.open(file);
    expect(await adapter.getMetadata()).toMatchObject({ format: 'cbz', estimatedPages: 1 });
    expect(adapter.getPageUrl()).toMatch(/^blob:/);
    adapter.destroy();
    expect(adapter.pages).toEqual([]);
  });

  it('parses PPTX and declares its fidelity limitations', async () => {
    const file = await fixture('sample.pptx');
    const adapter = await createReaderAdapter('pptx', { book: { title: 'Fixture slides' } });
    await adapter.open(file);
    expect(await adapter.getMetadata()).toMatchObject({ format: 'pptx', estimatedPages: 1 });
    expect((await adapter.getMetadata()).fidelityNotice).toMatch(/may differ/i);
    expect(await adapter.search('ShanBooks')).toEqual([
      expect.objectContaining({ slide: 0 }),
    ]);
    adapter.destroy();
  });
});
