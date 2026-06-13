const STATS_KEY = 'aurelia_stats';

function readReaderStats() {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY)) || {};
  } catch {
    return {};
  }
}

function progressFor(book) {
  return parseFloat(localStorage.getItem(`aurelia_pct_${book.id}`) || (book.status === 'finished' ? 100 : 0));
}

export function formatBytes(bytes) {
  if (!bytes) return '0 MB';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatDuration(ms) {
  if (!ms) return '0m';
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function getLibraryStats(books = [], lists = [], bookmarkCount = 0) {
  const readerStats = readReaderStats();
  const totalBooks = books.length;
  const readingBooks = books.filter(book => book.status === 'reading').length;
  const finishedBooks = books.filter(book => book.status === 'finished').length;
  const unreadBooks = books.filter(book => book.status === 'unread').length;
  const favoriteBooks = books.filter(book => book.isFavorite).length;
  const totalStorageBytes = books.reduce((sum, book) => {
    return sum + (book.fileSize || book.fileBlob?.size || 0);
  }, 0);
  const totalPages = books.reduce((sum, book) => sum + (book.estimatedPages || book.totalLocations || 0), 0);
  const averageProgress = totalBooks
    ? Math.round(books.reduce((sum, book) => sum + progressFor(book), 0) / totalBooks)
    : 0;
  const lastRead = books
    .map(book => book.lastOpenedAt || 0)
    .sort((a, b) => b - a)[0] || null;

  return {
    totalBooks,
    readingBooks,
    finishedBooks,
    unreadBooks,
    favoriteBooks,
    totalLists: lists.length,
    bookmarkCount,
    totalPages,
    averageProgress,
    totalStorageBytes,
    totalStorageLabel: formatBytes(totalStorageBytes),
    streak: readerStats.streak || 0,
    totalReadingLabel: formatDuration(readerStats.totalReadingMs || 0),
    pagesReadToday: readerStats.pagesReadToday || 0,
    lastRead,
  };
}
