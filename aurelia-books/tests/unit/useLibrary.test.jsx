import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLibrary } from '../../src/hooks/useLibrary';
import { extractEpubMetadata } from '../../src/utils/epubMetadata';
import { StorageManager } from '../../src/utils/StorageManager';

vi.mock('../../src/utils/epubMetadata', () => ({
  extractEpubMetadata: vi.fn(async (_file, fallback = {}) => ({
    ...fallback,
    title: fallback.title || 'Extracted title',
    author: fallback.author || 'Extracted author',
    metadataExtractedAt: Date.now(),
  })),
  normalizeBookMetadata: vi.fn(value => value),
}));

describe('useLibrary imports', () => {
  beforeEach(() => {
    vi.mocked(extractEpubMetadata).mockImplementation(async (_file, fallback = {}) => ({
      ...fallback,
      title: fallback.title || 'Extracted title',
      author: fallback.author || 'Extracted author',
      metadataExtractedAt: Date.now(),
    }));
    localStorage.setItem('aurelia_seeded_demo', '1');
    localStorage.setItem('aurelia_seeded_default_lists', '1');
    localStorage.setItem('shanbooks_seeded_demo', '1');
    localStorage.setItem('shanbooks_seeded_default_lists', '1');
  });

  it('persists the pending metadata state for a fast import', async () => {
    const { result } = renderHook(() => useLibrary());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const file = new File(['epub-data'], 'Tựa sách - Tác giả.epub', { type: 'application/epub+zip' });

    let imported;
    await act(async () => {
      imported = await result.current.addBook(file, null, { fastMetadata: true });
    });

    expect(imported).toMatchObject({
      title: 'Tựa sách',
      author: 'Tác giả',
      metadataStatus: 'pending',
      metadataAttempts: 0,
      metadataPending: true,
    });
  });

  it('serializes concurrent imports so the same file is only saved once', async () => {
    const { result } = renderHook(() => useLibrary());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const first = new File(['same-epub'], 'Trùng lặp.epub', { type: 'application/epub+zip' });
    const second = new File(['same-epub'], 'Trùng lặp.epub', { type: 'application/epub+zip' });

    let imported;
    await act(async () => {
      imported = await Promise.all([
        result.current.addBook(first, null, { fastMetadata: true }),
        result.current.addBook(second, null, { fastMetadata: true }),
      ]);
    });

    expect(imported.filter(book => book.skippedDuplicate)).toHaveLength(1);
    expect(imported.filter(book => !book.skippedDuplicate)).toHaveLength(1);
  });

  it('rejects an empty file without changing the library', async () => {
    const { result } = renderHook(() => useLibrary());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const before = result.current.allBooksRaw.length;

    await expect(result.current.addBook(
      new File([], 'rỗng.epub', { type: 'application/epub+zip' }),
      null,
      { fastMetadata: true },
    )).rejects.toThrow(/empty/i);
    expect(result.current.allBooksRaw).toHaveLength(before);
  });

  it('retries failed metadata extraction and eventually reaches ready', async () => {
    vi.mocked(extractEpubMetadata)
      .mockRejectedValueOnce(new Error('temporary parse failure'))
      .mockResolvedValueOnce({
        title: 'Đã khôi phục',
        author: 'Tác giả',
        metadataExtractedAt: Date.now(),
      });
    const { result } = renderHook(() => useLibrary());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let imported;
    await act(async () => {
      imported = await result.current.addBook(
        new File(['retry-epub'], 'Cần thử lại.epub', { type: 'application/epub+zip' }),
        null,
        { fastMetadata: true },
      );
    });

    await waitFor(() => {
      const book = result.current.allBooksRaw.find(item => item.id === imported.id);
      expect(book).toMatchObject({ metadataStatus: 'ready', metadataAttempts: 2 });
    }, { timeout: 5000 });
  }, 8000);

  it('resumes a processing metadata job after a reload', async () => {
    const id = `interrupted-${Date.now()}`;
    await StorageManager.saveBook({
      id,
      title: 'Interrupted',
      author: 'Author',
      fileBlob: new Blob(['interrupted-epub'], { type: 'application/epub+zip' }),
      fileSize: 16,
      metadataStatus: 'processing',
      metadataPending: true,
      metadataAttempts: 1,
      addedAt: Date.now(),
      status: 'unread',
    });

    const { result } = renderHook(() => useLibrary());

    await waitFor(() => {
      const book = result.current.allBooksRaw.find(item => item.id === id);
      expect(book?.metadataStatus).toBe('ready');
    }, { timeout: 5000 });
  }, 8000);
});
