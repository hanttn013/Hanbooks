import { describe, expect, it } from 'vitest';
import { migrateBookRecord, migrateBookmarkRecord, migrateProgressRecord } from '../../src/utils/bookModelMigration';

describe('v4 book model migration', () => {
  it('keeps old EPUB records readable without changing their IDs or blobs', () => {
    const blob = new Blob(['book']);
    const migrated = migrateBookRecord({ id: 'old-book', title: 'Old', fileBlob: blob });
    expect(migrated).toMatchObject({ id: 'old-book', format: 'epub', locatorVersion: 1, fileBlob: blob });
  });

  it('promotes legacy CFI progress and bookmarks to generic locators', () => {
    expect(JSON.parse(migrateProgressRecord({ bookId: 'old-book', cfi: 'epubcfi(/6/2)' }).locator)).toEqual({
      format: 'epub', cfi: 'epubcfi(/6/2)',
    });
    expect(JSON.parse(migrateBookmarkRecord({ id: 'mark', bookId: 'old-book', cfi: 'epubcfi(/6/4)' }).locator)).toEqual({
      format: 'epub', cfi: 'epubcfi(/6/4)',
    });
  });
});
