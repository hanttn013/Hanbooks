import { createLocator } from '../readers/locator';

function inferBookFormat(book = {}) {
  const source = String(book.fileName || book.sourcePath || '').toLowerCase();
  const extension = source.match(/\.([a-z0-9]+)$/)?.[1];
  return extension || 'epub';
}

export function migrateBookRecord(book) {
  if (!book) return book;
  const migrated = {
    ...book,
    format: book.format || inferBookFormat(book),
    locatorVersion: book.locatorVersion || 1,
  };
  if (book.metadataPending === true && !book.metadataStatus) {
    migrated.metadataStatus = 'pending';
    migrated.metadataAttempts = book.metadataAttempts || 0;
    migrated.metadataNextRetryAt = book.metadataNextRetryAt || null;
    migrated.metadataError = book.metadataError || null;
  }
  return migrated;
}

export function migrateProgressRecord(progress) {
  if (!progress) return progress;
  if (progress.locator) return { ...progress, locatorVersion: progress.locatorVersion || 1 };
  return {
    ...progress,
    locator: progress.cfi ? createLocator('epub', { cfi: progress.cfi }) : '',
    locatorVersion: 1,
  };
}

export function migrateBookmarkRecord(bookmark) {
  if (!bookmark) return bookmark;
  if (bookmark.locator) return { ...bookmark, locatorVersion: bookmark.locatorVersion || 1 };
  return {
    ...bookmark,
    locator: bookmark.cfi ? createLocator('epub', { cfi: bookmark.cfi }) : '',
    locatorVersion: 1,
  };
}
