import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { detectDocumentFormat, UnsupportedFormatError } from '../../src/utils/formatDetector';
import { hashDocumentFile } from '../../src/utils/contentHash';

async function fixtureFile(name, type = '') {
  const bytes = await readFile(path.resolve('tests', 'fixtures', name));
  return new File([bytes], name, { type });
}

describe('detectDocumentFormat', () => {
  it.each([
    ['sample.epub', 'application/epub+zip', 'epub'],
    ['sample.pdf', 'application/pdf', 'pdf'],
    ['sample.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
    ['sample.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'pptx'],
    ['sample.cbz', 'application/vnd.comicbook+zip', 'cbz'],
    ['sample.txt', 'text/plain', 'txt'],
    ['sample.md', 'text/markdown', 'md'],
    ['sample.html', 'text/html', 'html'],
  ])('recognizes %s as %s', async (name, type, expected) => {
    const result = await detectDocumentFormat(await fixtureFile(name, type));
    expect(result).toMatchObject({ format: expected, supported: true });
  });

  it('prefers PDF magic bytes over a misleading extension and MIME', async () => {
    const source = await fixtureFile('sample.pdf');
    const disguised = new File([await source.arrayBuffer()], 'not-really.epub', {
      type: 'application/epub+zip',
    });
    await expect(detectDocumentFormat(disguised)).resolves.toMatchObject({
      format: 'pdf',
      confidence: 'magic',
    });
  });

  it('identifies OOXML packages from their ZIP entries without an extension', async () => {
    const source = await fixtureFile('sample.docx');
    const unnamed = new File([await source.arrayBuffer()], 'upload.bin');
    await expect(detectDocumentFormat(unnamed)).resolves.toMatchObject({
      format: 'docx',
      confidence: 'container',
    });
  });

  it('returns actionable guidance for legacy Office files', async () => {
    const result = await detectDocumentFormat(await fixtureFile('legacy.doc', 'application/msword'));
    expect(result).toMatchObject({ format: 'doc', supported: false, legacyOffice: true });
    expect(result.message).toMatch(/DOCX.*PDF/i);
  });

  it('rejects an empty file with a typed error', async () => {
    await expect(detectDocumentFormat(await fixtureFile('empty.txt')))
      .rejects.toBeInstanceOf(UnsupportedFormatError);
  });
});

describe('hashDocumentFile', () => {
  it('uses a content hash independent of the uploaded file name', async () => {
    const left = new File(['same bytes'], 'bản-tiếng-Việt.txt');
    const right = new File(['same bytes'], 'renamed.md');
    await expect(hashDocumentFile(left)).resolves.toEqual(await hashDocumentFile(right));
  });
});
