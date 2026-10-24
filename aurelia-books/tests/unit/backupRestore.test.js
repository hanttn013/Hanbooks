import { afterEach, describe, expect, it } from 'vitest';
import { Blob as NodeBlob } from 'node:buffer';
import { StorageManager } from '../../src/utils/StorageManager';

afterEach(async () => {
  await StorageManager.clearAllData().catch(() => {});
});

describe('backup and restore', () => {
  it('round-trips original document blobs in a full ZIP backup', async () => {
    await StorageManager.saveBook({
      id: 'pdf-1',
      title: 'Offline PDF',
      format: 'pdf',
      fileBlob: new NodeBlob(['pdf bytes'], { type: 'application/pdf' }),
      addedAt: 1,
    });
    await StorageManager.saveProgress({ bookId: 'pdf-1', locator: JSON.stringify({ format: 'pdf', page: 2 }), percentage: 0.5 });
    const backup = await StorageManager.exportFullBackup();
    await StorageManager.clearAllData();
    const result = await StorageManager.importFullBackup(backup, { merge: false });
    const [book] = await StorageManager.getAllBooks();
    expect(result).toEqual({ restoredBooks: 1, restoredFiles: 1 });
    expect(book).toMatchObject({ id: 'pdf-1', format: 'pdf', missingFile: false });
    expect(book.fileBlob).toBeTruthy();
    expect(await StorageManager.getProgress('pdf-1')).toMatchObject({ percentage: 0.5 });
  });

  it('marks missing originals in a data-only restore', async () => {
    await StorageManager.importLibrarySnapshot({
      type: 'library-backup',
      books: [{ id: 'missing', title: 'Missing file', format: 'docx', hasFileBlob: true }],
      bookmarks: [],
      progress: [],
      lists: [],
    });
    await expect(StorageManager.getAllBooks()).resolves.toEqual([
      expect.objectContaining({ id: 'missing', missingFile: true, fileBlob: null }),
    ]);
  });

  it('retains the three newest automatic snapshots', async () => {
    for (let index = 0; index < 4; index += 1) await StorageManager.createAutoBackup(`test-${index}`);
    const backups = await StorageManager.getAutoBackups();
    expect(backups).toHaveLength(3);
    expect(backups.map(item => item.reason)).toContain('test-3');
  });

  it('preserves original files when merging a data-only backup', async () => {
    await StorageManager.saveBook({ id: 'local', title: 'Local', fileBlob: new NodeBlob(['original']) });
    await StorageManager.importLibrarySnapshot({ type: 'library-backup', books: [{ id: 'local', title: 'Restored' }], bookmarks: [], progress: [], lists: [] });
    const [book] = await StorageManager.getAllBooks();
    expect(book).toMatchObject({ title: 'Restored', missingFile: false });
    expect(book.fileBlob.size).toBe(8);
  });

  it('rejects an invalid ZIP without altering the current library', async () => {
    await StorageManager.saveBook({ id: 'safe', title: 'Keep me' });
    await expect(StorageManager.importFullBackup(new NodeBlob(['not a ZIP']))).rejects.toThrow();
    expect(await StorageManager.getAllBooks()).toEqual([expect.objectContaining({ id: 'safe' })]);
  });

  it('validates all backup records before clearing existing data', async () => {
    await StorageManager.saveBook({ id: 'safe', title: 'Keep me' });
    await expect(StorageManager.importLibrarySnapshot({ type: 'library-backup', books: [{ title: 'No ID' }] }, { merge: false })).rejects.toThrow('Invalid backup records');
    expect(await StorageManager.getAllBooks()).toEqual([expect.objectContaining({ id: 'safe' })]);
  });
});
