import { expect, it } from 'vitest';
import { StorageManager } from '../../src/utils/StorageManager';

it('an atomic queue completion cannot recreate a deleted book', async () => {
  const id = 'queue-deleted-record';
  await StorageManager.saveBook({ id, metadataStatus: 'processing' });
  await StorageManager.deleteBook(id);
  expect(await StorageManager.updateExistingBook(id, { metadataStatus: 'ready' })).toBeNull();
  expect((await StorageManager.getAllBooks()).some(book => book.id === id)).toBe(false);
});
