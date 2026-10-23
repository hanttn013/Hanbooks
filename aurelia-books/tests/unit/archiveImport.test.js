import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { extractDocumentsFromArchive } from '../../src/utils/archiveImport';

beforeAll(async () => {
  const { spawn } = await import('node:child_process');
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/generate-test-fixtures.mjs'], { stdio: 'ignore' });
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Fixture generator exited ${code}`)));
  });
});

async function fixture(name) {
  const bytes = await readFile(path.resolve('tests', 'fixtures', name));
  return new File([bytes], name, { type: 'application/zip' });
}

describe('mixed archive import', () => {
  it('extracts supported document formats and ignores unrelated entries', async () => {
    const result = await extractDocumentsFromArchive(await fixture('mixed-documents.zip'));
    expect(result.files.map(file => file.name).sort()).toEqual(['sample.docx', 'sample.md', 'sample.pdf']);
    expect(result.groups.map(group => group.name).sort()).toEqual(['library', 'notes']);
  });

  it('rejects excessive archive path depth before extraction', async () => {
    await expect(extractDocumentsFromArchive(await fixture('too-deep.zip'))).rejects.toThrow(/depth/i);
  });
});
