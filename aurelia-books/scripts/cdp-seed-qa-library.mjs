const port = process.argv[2] || '9223';
const targets = await fetch(`http://127.0.0.1:${port}/json`).then(res => res.json());
const target = targets.find(item => item.url === 'https://localhost/') || targets[0];
if (!target?.webSocketDebuggerUrl) {
  throw new Error(`No debuggable WebView target found on port ${port}`);
}

const expression = String.raw`
(async () => {
  const openDB = () => new Promise((resolve, reject) => {
    const request = indexedDB.open('aurelia_db', 4);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('books')) db.createObjectStore('books', { keyPath: 'id' });
      let bookmarkStore;
      if (!db.objectStoreNames.contains('bookmarks')) bookmarkStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
      else bookmarkStore = event.target.transaction.objectStore('bookmarks');
      if (bookmarkStore && !bookmarkStore.indexNames.contains('bookId')) bookmarkStore.createIndex('bookId', 'bookId', { unique: false });
      if (!db.objectStoreNames.contains('progress')) db.createObjectStore('progress', { keyPath: 'bookId' });
      if (!db.objectStoreNames.contains('lists')) db.createObjectStore('lists', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('backups')) db.createObjectStore('backups', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const putAll = (store, items) => {
    for (const item of items) store.put(item);
  };
  const now = Date.now();
  const realSources = [
    ['qa-real-jane', 'Jane Eyre', 'Charlotte Bronte', '/books/jane-eyre.epub', 38, 441],
    ['qa-real-dorian', 'The Picture of Dorian Gray', 'Oscar Wilde', '/books/picture-of-dorian-gray.epub', 20, 66],
    ['qa-real-pride', 'Pride and Prejudice', 'Jane Austen', '/books/pride-and-prejudice.epub', 61, 3550],
  ];
  const realBooks = [];
  for (const [id, title, author, url, chapterCount, estimatedPages] of realSources) {
    const blob = await fetch(url).then(res => res.blob());
    realBooks.push({
      id,
      title,
      author,
      isDemo: false,
      coverColor: '#073D6E',
      coverAccent: '#E98243',
      coverUrl: null,
      fileBlob: blob,
      status: 'unread',
      isFavorite: false,
      addedAt: now,
      lastOpenedAt: null,
      totalLocations: 0,
      genre: 'Fiction',
      description: title + ' seeded for ShanBooks Android QA.',
      publisher: 'QA Seed',
      language: 'en',
      publishedAt: 'Unknown',
      fileSize: blob.size,
      chapterCount,
      estimatedPages,
      metadataExtractedAt: now,
      titleAuthorKey: title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + '|' + author.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(),
      fileKey: blob.size + '|qa-' + id,
      sourcePath: url,
    });
  }
  const keywords = ['Bach Nguyet Quang', 'Alpha', 'Tong Tai', 'Tien Hiep', 'Do Thi', 'Ngon Tinh', 'Truyen Ngan'];
  const clones = Array.from({ length: 1196 }, (_, index) => {
    const n = index + 1;
    const keyword = keywords[index % keywords.length];
    return {
      id: 'qa-meta-' + String(n).padStart(4, '0'),
      title: keyword + ' ' + String(n).padStart(4, '0'),
      author: 'QA Author ' + (n % 31),
      isDemo: false,
      coverColor: ['#073D6E', '#1A312C', '#333D6D', '#4647AE'][index % 4],
      coverAccent: '#E98243',
      coverUrl: null,
      fileBlob: null,
      status: n % 5 === 0 ? 'reading' : 'unread',
      isFavorite: false,
      addedAt: now - n * 1000,
      lastOpenedAt: n % 5 === 0 ? now - n * 500 : null,
      totalLocations: 0,
      genre: n % 2 === 0 ? 'Ngon tinh' : 'Fiction',
      description: 'Metadata-only QA book ' + n + ' for large library search and scroll.',
      publisher: 'ShanBooks QA',
      language: n % 3 === 0 ? 'vi' : 'en',
      publishedAt: '2026',
      fileSize: 512000 + n,
      chapterCount: 20 + (n % 80),
      estimatedPages: 60 + (n % 400),
      metadataPending: true,
      metadataExtractedAt: now,
      titleAuthorKey: keyword.toLowerCase() + ' ' + n + '|qa author ' + (n % 31),
      fileKey: 'meta-' + n,
      sourcePath: 'qa/meta/' + n + '.epub',
    };
  });
  const books = [...realBooks, ...clones];
  const lists = [
    { id: 'qa-ngon-tinh', name: 'Ngôn tình', description: 'QA Vietnamese folder list', coverStyle: 'forest', bookIds: books.slice(0, 80).map(book => book.id), sortBy: 'addedAt', createdAt: now, updatedAt: now },
    { id: 'qa-tien-hiep', name: 'Tiên hiệp', description: 'QA Vietnamese folder list', coverStyle: 'indigo', bookIds: books.slice(80, 160).map(book => book.id), sortBy: 'addedAt', createdAt: now, updatedAt: now },
    { id: 'qa-do-thi', name: 'Đô thị', description: 'QA Vietnamese folder list', coverStyle: 'gold', bookIds: books.slice(160, 240).map(book => book.id), sortBy: 'addedAt', createdAt: now, updatedAt: now },
    { id: 'qa-truyen-ngan', name: 'Truyện ngắn', description: 'QA Vietnamese folder list', coverStyle: 'burgundy', bookIds: books.slice(240, 320).map(book => book.id), sortBy: 'addedAt', createdAt: now, updatedAt: now },
  ];
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(['books', 'lists', 'bookmarks', 'progress'], 'readwrite');
    putAll(tx.objectStore('books'), books);
    putAll(tx.objectStore('lists'), lists);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  localStorage.setItem('aurelia_seeded_demo', '1');
  localStorage.setItem('aurelia_seeded_default_lists', '1');
  localStorage.setItem('aurelia_sort', 'addedAt');
  location.reload();
  return { books: books.length, lists: lists.length, realBooks: realBooks.length };
})()
`;

let nextId = 1;
const send = (socket, method, params = {}) => new Promise((resolve, reject) => {
  const id = nextId++;
  const onMessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id !== id) return;
    socket.removeEventListener('message', onMessage);
    if (data.error) reject(new Error(JSON.stringify(data.error)));
    else resolve(data.result);
  };
  socket.addEventListener('message', onMessage);
  socket.send(JSON.stringify({ id, method, params }));
});

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

await send(socket, 'Runtime.enable');
const result = await send(socket, 'Runtime.evaluate', {
  expression,
  awaitPromise: true,
  returnByValue: true,
  timeout: 120000,
});
socket.close();

if (result.exceptionDetails) {
  console.error(JSON.stringify(result.exceptionDetails, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(result.result.value, null, 2));
