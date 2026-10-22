import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BookDetailModal from '../../src/components/Library/BookDetailModal';
import { StorageManager } from '../../src/utils/StorageManager';

vi.mock('../../src/utils/StorageManager', () => ({
  StorageManager: {
    getBookmarks: vi.fn(),
    addBookmark: vi.fn(),
  },
}));

vi.mock('../../src/utils/epubMetadata', () => ({
  extractEpubMetadata: vi.fn(),
  looksLikeTocText: vi.fn(() => false),
}));

const pendingBook = {
  id: 'pending-book',
  title: 'Sách thử nghiệm',
  author: 'QA',
  status: 'unread',
  metadataStatus: 'pending',
  metadataExtractedAt: null,
  fileBlob: new Blob(['epub']),
  chapterCount: 0,
  estimatedPages: 1,
  addedAt: 1,
};

describe('BookDetailModal metadata bootstrap', () => {
  beforeEach(() => {
    StorageManager.getBookmarks.mockResolvedValue([]);
  });

  it('loads bookmarks once and starts one background metadata repair', async () => {
    const repairMetadata = vi.fn().mockResolvedValue();

    render(
      <BookDetailModal
        book={pendingBook}
        onClose={vi.fn()}
        onOpen={vi.fn()}
        library={{ lists: [], repairMetadata }}
      />,
    );

    await waitFor(() => {
      expect(StorageManager.getBookmarks).toHaveBeenCalledTimes(1);
      expect(repairMetadata).toHaveBeenCalledTimes(1);
      expect(repairMetadata).toHaveBeenCalledWith('pending-book');
    });
  });
});
