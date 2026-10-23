import { act, renderHook } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useLibrary } from '../../src/hooks/useLibrary';
import { StorageManager } from '../../src/utils/StorageManager';
import { extractDocumentMetadata } from '../../src/utils/documentMetadata';

const state = vi.hoisted(() => ({ books: new Map() }));
vi.mock('../../src/utils/documentMetadata', () => ({ extractDocumentMetadata: vi.fn() }));
vi.mock('../../src/utils/StorageManager', () => ({ StorageManager: {
  getAllBooks: vi.fn(async () => [...state.books.values()]),
  getAllLists: vi.fn(async () => []), getAllBookmarks: vi.fn(async () => []),
  createAutoBackup: vi.fn(async () => {}),
  saveBook: vi.fn(async book => state.books.set(book.id, book)),
  updateExistingBook: vi.fn(async (id, updates) => {
    if (!state.books.has(id)) return null;
    const book = { ...state.books.get(id), ...updates };
    state.books.set(id, book); return book;
  }),
  deleteBook: vi.fn(async id => state.books.delete(id)),
} }));
vi.mock('../../src/utils/importWorkerClient', () => ({ analyzeImportFile: vi.fn(async file => ({ detection: { format: 'epub', supported: true }, hash: file.name.normalize('NFC') })) }));

const advance = async ms => act(async () => { await vi.advanceTimersByTimeAsync(ms); });
const seed = (id, extra = {}) => state.books.set(id, { id, title: id, format: 'epub', fileBlob: new Blob(['data']), metadataStatus: 'pending', metadataAttempts: 0, ...extra });
async function mount() {
  const hook = renderHook(() => useLibrary());
  await advance(1);
  return hook;
}
describe('persistent bounded metadata queue', () => {
  beforeEach(() => {
    vi.useFakeTimers(); state.books.clear(); vi.clearAllMocks();
    localStorage.setItem('shanbooks_seeded_demo', '1');
    localStorage.setItem('shanbooks_seeded_default_lists', '1');
    vi.mocked(extractDocumentMetadata).mockResolvedValue({ title: 'Done' });
  });
  afterEach(() => vi.useRealTimers());

  it('never exceeds two tasks when 50 books arrive together, including manual starts', async () => {
    let active = 0; let maximum = 0; const releases = [];
    vi.mocked(extractDocumentMetadata).mockImplementation(() => new Promise(resolve => {
      active++; maximum = Math.max(maximum, active);
      releases.push(() => { active--; resolve({}); });
    }));
    const hook = await mount();
    await act(async () => {
      await Promise.all(Array.from({ length: 50 }, (_, i) => hook.result.current.addBook(new File(['data'], `book-${i}.epub`), null, { fastMetadata: true })));
    });
    for (let round = 0; round < 51; round++) {
      await advance(250);
      act(() => { void hook.result.current.repairMetadata(hook.result.current.allBooksRaw.find(b => b.metadataStatus === 'pending')?.id); });
      expect(active).toBeLessThanOrEqual(2);
      await act(async () => { releases.splice(0).forEach(release => release()); });
    }
    expect(maximum).toBe(2);
    expect([...state.books.values()].every(book => book.metadataStatus === 'ready')).toBe(true);
    hook.unmount();
  });

  it('backs off and stops after three failures with the reason persisted', async () => {
    seed('retry'); vi.mocked(extractDocumentMetadata).mockRejectedValue(new Error('Damaged EPUB'));
    const hook = await mount();
    await advance(250);
    expect(extractDocumentMetadata).toHaveBeenCalledTimes(1);
    const retryAt = state.books.get('retry').metadataNextRetryAt;
    await advance(999); expect(extractDocumentMetadata).toHaveBeenCalledTimes(1);
    await advance(1); expect(Date.now()).toBe(retryAt);
    await advance(250);
    expect(extractDocumentMetadata).toHaveBeenCalledTimes(2);
    await advance(4999); expect(extractDocumentMetadata).toHaveBeenCalledTimes(2);
    await advance(1);
    await advance(250); expect(extractDocumentMetadata).toHaveBeenCalledTimes(3);
    expect(state.books.get('retry')).toMatchObject({ metadataStatus: 'failed', metadataAttempts: 3, metadataError: 'Damaged EPUB', metadataNextRetryAt: null });
    await advance(60000); expect(extractDocumentMetadata).toHaveBeenCalledTimes(3);
    hook.unmount();
  });

  it.each(['processing', 'running'])('reload returns interrupted %s to pending', async status => {
    seed('reload', { metadataStatus: status });
    const hook = await mount();
    expect(state.books.get('reload').metadataStatus).toBe('pending');
    await advance(250); expect(state.books.get('reload').metadataStatus).toBe('ready');
    hook.unmount();
  });

  it('preserves backoff through remount and releases slots after an initial storage failure', async () => {
    seed('storage');
    vi.mocked(StorageManager.updateExistingBook).mockRejectedValueOnce(new Error('Temporary quota error'));
    let hook = await mount(); await advance(250);
    expect(hook.result.current.metadataProcessingCount).toBe(0);
    expect(state.books.get('storage')).toMatchObject({ metadataStatus: 'pending', metadataAttempts: 1, metadataError: 'Temporary quota error' });
    const retryAt = state.books.get('storage').metadataNextRetryAt;
    hook.unmount(); hook = await mount();
    await advance(Math.max(0, retryAt - Date.now() - 1));
    expect(extractDocumentMetadata).not.toHaveBeenCalled();
    await advance(1); await advance(250);
    expect(state.books.get('storage').metadataStatus).toBe('ready');
    hook.unmount();
  });

  it('deleting pending and active books never resurrects a record', async () => {
    seed('active'); seed('pending'); seed('third');
    const releases = []; vi.mocked(extractDocumentMetadata).mockImplementation(() => new Promise(resolve => { releases.push(resolve); }));
    const hook = await mount();
    await act(async () => hook.result.current.deleteBook('pending'));
    await advance(250);
    await act(async () => hook.result.current.deleteBook('active'));
    await act(async () => releases.forEach(release => release({ title: 'Late result' })));
    expect(state.books.has('active')).toBe(false);
    expect(state.books.has('pending')).toBe(false);
    expect(StorageManager.updateExistingBook).toHaveBeenCalled();
    hook.unmount();
  });

  it('serializes two parallel batches and consecutive duplicate imports, including NFD', async () => {
    localStorage.setItem('shanbooks_metadata_paused', '1');
    const hook = await mount();
    const file = name => new File(['same'], name);
    let results;
    await act(async () => { results = await Promise.all([
      hook.result.current.addBook(file('Tiếng Việt.epub'), null, { fastMetadata: true }),
      hook.result.current.addBook(file('Tiếng Việt.epub'.normalize('NFD')), null, { fastMetadata: true }),
      hook.result.current.addBook(file('Other.epub'), null, { fastMetadata: true }),
      hook.result.current.addBook(file('Other.epub'), null, { fastMetadata: true }),
    ]); });
    expect(results.filter(book => book.skippedDuplicate)).toHaveLength(2);
    await act(async () => { const repeated = await hook.result.current.addBook(file('Other.epub'), null, { fastMetadata: true }); expect(repeated.skippedDuplicate).toBe(true); });
    expect(state.books.size).toBe(2); hook.unmount();
  });
});
