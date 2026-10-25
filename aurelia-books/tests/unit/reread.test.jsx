import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLibrary } from '../../src/hooks/useLibrary';
import { StorageManager } from '../../src/utils/StorageManager';
import { progressStorageKey } from '../../src/utils/storageKeys';

vi.mock('../../src/utils/importWorkerClient', () => ({
  analyzeImportFile: vi.fn(async file => ({ detection: { format: 'epub', supported: true }, hash: await file.text() })),
}));

vi.mock('../../src/utils/epubMetadata', () => ({
  extractEpubMetadata: vi.fn(async (_file, fallback = {}) => ({
    ...fallback,
    title: fallback.title || 'Book Title',
    author: fallback.author || 'Author',
    metadataExtractedAt: Date.now(),
  })),
  normalizeBookMetadata: vi.fn(value => value),
}));

describe('Re-read (Đọc lại) workflow and progress reset', () => {
  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem('shanbooks_seeded_demo', '1');
    localStorage.setItem('shanbooks_seeded_default_lists', '1');
    const db = await StorageManager.openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(['books', 'progress', 'bookmarks'], 'readwrite');
      tx.objectStore('books').clear();
      tx.objectStore('progress').clear();
      tx.objectStore('bookmarks').clear();
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  });

  it('resets progress to 0, status to reading, and clears saved locator while keeping bookmarks', async () => {
    const { result } = renderHook(() => useLibrary());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const file = new File(['content'], 'sample.epub', { type: 'application/epub+zip' });
    let book;
    await act(async () => {
      book = await result.current.addBook(file, { title: 'Finished Book', author: 'Author' });
    });

    // Mark book as finished at 100%
    await act(async () => {
      await result.current.updateBook(book.id, {
        progress: 1,
        progressPercent: 100,
        status: 'finished',
      });
      await StorageManager.saveProgress({
        bookId: book.id,
        cfi: 'epubcfi(/6/14[chapter_end]!/4/2/1:0)',
        percentage: 100,
        updatedAt: Date.now(),
      });
      localStorage.setItem(progressStorageKey(book.id), JSON.stringify({
        cfi: 'epubcfi(/6/14[chapter_end]!/4/2/1:0)',
        percentage: 100,
      }));
      await StorageManager.addBookmark({
        id: 'bm-1',
        bookId: book.id,
        cfi: 'epubcfi(/6/4[chapter_1]!/4/2/1:0)',
        title: 'Important quote',
        createdAt: Date.now(),
      });
    });

    // Verify book is finished and progress is saved
    const savedBefore = await StorageManager.getProgress(book.id);
    expect(savedBefore?.cfi).toBe('epubcfi(/6/14[chapter_end]!/4/2/1:0)');
    const bookmarksBefore = await StorageManager.getBookmarks(book.id);
    expect(bookmarksBefore.length).toBe(1);

    // Call resetBookProgress (triggered by "Đọc lại")
    await act(async () => {
      await result.current.resetBookProgress(book.id);
    });

    // Verify progress is 0, status is reading
    const updatedBook = result.current.allBooksRaw.find(b => b.id === book.id);
    expect(updatedBook.progress).toBe(0);
    expect(updatedBook.progressPercent).toBe(0);
    expect(updatedBook.status).toBe('reading');

    // Verify stored progress is wiped in IndexedDB and localStorage
    const savedAfter = await StorageManager.getProgress(book.id);
    expect(savedAfter).toBeNull();
    expect(localStorage.getItem(progressStorageKey(book.id))).toBeNull();

    // Verify user bookmarks remain completely intact
    const bookmarksAfter = await StorageManager.getBookmarks(book.id);
    expect(bookmarksAfter.length).toBe(1);
    expect(bookmarksAfter[0].id).toBe('bm-1');
  });
});
