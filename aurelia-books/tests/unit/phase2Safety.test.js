import { afterEach, describe, expect, it, vi } from 'vitest';
import { hashDocumentFile } from '../../src/utils/contentHash';
import { extractArchiveInWorker } from '../../src/utils/archiveWorkerClient';

afterEach(() => vi.unstubAllGlobals());

describe('Phase 2 worker and content identity safety', () => {
  it('hashes every block of a large file, including previously unsampled positions', async () => {
    const blockSize = 1024 * 1024;
    const createFile = changed => ({
      size: 65 * blockSize,
      slice: vi.fn(start => ({ arrayBuffer: async () => new Uint8Array([start / blockSize, changed && start === 7 * blockSize ? 1 : 0]).buffer })),
    });
    const original = createFile(false);
    const changed = createFile(true);
    const first = await hashDocumentFile(original);
    const second = await hashDocumentFile(changed);
    expect(original.slice).toHaveBeenCalledTimes(65);
    expect(first.strategy).toBe('sha256-all-blocks-v1');
    expect(first.hash).not.toBe(second.hash);
  });

  it('terminates the archive worker and restores folder grouping after structured clone', async () => {
    let worker;
    class FakeWorker {
      constructor() { worker = this; }
      terminate = vi.fn();
      postMessage = vi.fn();
    }
    vi.stubGlobal('Worker', FakeWorker);
    const archive = new File(['zip'], 'batch.zip');
    const pending = extractArchiveInWorker(archive);
    worker.onmessage({ data: { ok: true, result: { listName: 'batch' }, files: [{ file: new File(['text'], 'book.txt'), archivePath: 'Vietnamese/book.txt' }] } });
    const result = await pending;
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(result.files[0].archivePath).toBe('Vietnamese/book.txt');
    expect(result.groups[0].name).toBe('Vietnamese');
  });
});
