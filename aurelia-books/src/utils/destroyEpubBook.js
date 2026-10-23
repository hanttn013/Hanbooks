// epub.js 0.3.x Archive.destroy revokes cache keys (archive paths), not
// the Blob URL values. Revoke the owned values before destroying the book.
export function destroyEpubBook(book) {
  if (!book) return;
  const urls = [
    ...Object.values(book.archive?.urlCache || {}),
    ...(book.resources?.replacementUrls || []),
    ...Object.values(book.resources?.cssUrls || {}),
  ];
  for (const url of new Set(urls)) {
    if (typeof url === 'string' && url.startsWith('blob:')) URL.revokeObjectURL(url);
  }
  book.destroy();
}
