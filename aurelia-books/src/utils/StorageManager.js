// src/utils/StorageManager.js
import { progressStorageKey, STORAGE_KEYS } from './storageKeys';
import { assertZipSafety } from './archiveImport';
import { migrateBookRecord, migrateBookmarkRecord, migrateProgressRecord } from './bookModelMigration';

const DB_NAME = 'aurelia_db';
const DB_VERSION = 4;
const AUTO_BACKUP_LIMIT = 3;
const FULL_BACKUP_LIMIT = 500 * 1024 * 1024;

const MIME_BY_FORMAT = Object.freeze({
  epub: 'application/epub+zip',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
  md: 'text/markdown',
  html: 'text/html',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  cbz: 'application/vnd.comicbook+zip',
});

function readBlobArrayBuffer(blob) {
  if (typeof blob?.arrayBuffer === 'function') return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

export class StorageManager {
  static dbPromise = null;

  static openDB() {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('books')) {
          db.createObjectStore('books', { keyPath: 'id' });
        }
        let bookmarkStore;
        if (!db.objectStoreNames.contains('bookmarks')) {
          bookmarkStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
        } else {
          bookmarkStore = e.target.transaction.objectStore('bookmarks');
        }
        if (bookmarkStore && !bookmarkStore.indexNames.contains('bookId')) {
          bookmarkStore.createIndex('bookId', 'bookId', { unique: false });
        }
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'bookId' });
        }
        if (!db.objectStoreNames.contains('lists')) {
          db.createObjectStore('lists', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('backups')) {
          db.createObjectStore('backups', { keyPath: 'id' });
        }
      };

      request.onsuccess = (e) => {
        const db = e.target.result;
        db.onversionchange = () => {
          db.close();
          this.dbPromise = null;
        };
        resolve(db);
      };
      request.onerror = (e) => {
        this.dbPromise = null;
        reject(e.target.error);
      };
    });
    return this.dbPromise;
  }

  static async getAllBooks() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('books', 'readonly');
      const store = transaction.objectStore('books');
      const request = store.getAll();
      request.onsuccess = () => resolve((request.result || []).map(migrateBookRecord));
      request.onerror = () => reject(request.error);
    });
  }

  static async saveBook(book) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('books', 'readwrite');
      const store = transaction.objectStore('books');
      const request = store.put(book);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async updateExistingBook(id, updates) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('books', 'readwrite');
      const store = tx.objectStore('books');
      let updated = null;
      const request = store.get(id);
      request.onsuccess = () => {
        if (!request.result) return;
        updated = { ...request.result, ...updates };
        store.put(updated);
      };
      tx.oncomplete = () => resolve(updated);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Book update aborted.'));
    });
  }

  static async deleteBook(id) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['books', 'bookmarks', 'progress', 'lists'], 'readwrite');
      
      // Delete book
      transaction.objectStore('books').delete(id);
      
      // Delete progress
      transaction.objectStore('progress').delete(id);
      
      // Delete bookmarks (requires querying by index or filtering)
      const bookmarkStore = transaction.objectStore('bookmarks');
      const index = bookmarkStore.index('bookId');
      const request = index.openCursor(IDBKeyRange.only(id));
      request.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          bookmarkStore.delete(cursor.primaryKey);
          cursor.continue();
        }
      };

      const listStore = transaction.objectStore('lists');
      const listRequest = listStore.getAll();
      listRequest.onsuccess = () => {
        (listRequest.result || []).forEach(list => {
          if (!Array.isArray(list.bookIds) || !list.bookIds.includes(id)) return;
          listStore.put({
            ...list,
            bookIds: list.bookIds.filter(bookId => bookId !== id),
            updatedAt: Date.now(),
          });
        });
      };
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  static async getProgress(bookId) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('progress', 'readonly');
      const store = transaction.objectStore('progress');
      const request = store.get(bookId);
      request.onsuccess = () => resolve(migrateProgressRecord(request.result || null));
      request.onerror = () => reject(request.error);
    });
  }

  static async saveProgress(progress) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('progress', 'readwrite');
      const store = transaction.objectStore('progress');
      const request = store.put(progress);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async getBookmarks(bookId) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('bookmarks', 'readonly');
      const store = transaction.objectStore('bookmarks');
      const index = store.index('bookId');
      const request = index.getAll(IDBKeyRange.only(bookId));
      request.onsuccess = () => resolve((request.result || []).map(migrateBookmarkRecord));
      request.onerror = () => reject(request.error);
    });
  }

  static async getAllBookmarks() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('bookmarks', 'readonly');
      const store = transaction.objectStore('bookmarks');
      const request = store.getAll();
      request.onsuccess = () => resolve((request.result || []).map(migrateBookmarkRecord));
      request.onerror = () => reject(request.error);
    });
  }

  static async addBookmark(bookmark) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('bookmarks', 'readwrite');
      const store = transaction.objectStore('bookmarks');
      const request = store.put(bookmark);
      request.onsuccess = () => resolve(bookmark);
      request.onerror = () => reject(request.error);
    });
  }

  static async removeBookmark(id) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('bookmarks', 'readwrite');
      const store = transaction.objectStore('bookmarks');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async getAllLists() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('lists', 'readonly');
      const store = transaction.objectStore('lists');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  static async saveList(list) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('lists', 'readwrite');
      const store = transaction.objectStore('lists');
      const request = store.put(list);
      request.onsuccess = () => resolve(list);
      request.onerror = () => reject(request.error);
    });
  }

  static async deleteList(id) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('lists', 'readwrite');
      const store = transaction.objectStore('lists');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async clearAllData() {
    if (this.dbPromise) {
      try {
        const db = await this.dbPromise;
        db.close();
      } finally {
        this.dbPromise = null;
      }
    }
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
      deleteRequest.onblocked = () => {
        reject(new Error('Database is busy. Close and reopen the app, then try again.'));
      };
    });
  }

  static stripBookForExport(book) {
    const { fileBlob, coverUrl, ...rest } = book;
    return {
      ...rest,
      hasFileBlob: Boolean(fileBlob),
      coverUrl: typeof coverUrl === 'string' && coverUrl.startsWith('data:') ? null : coverUrl,
      exportedWithoutFile: true,
    };
  }

  static async exportLibrarySnapshot() {
    const [books, bookmarks, lists] = await Promise.all([
      this.getAllBooks(),
      this.getAllBookmarks(),
      this.getAllLists(),
    ]);

    const progress = await this.getAllProgress();
    const settings = (() => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || '{}');
      } catch {
        return {};
      }
    })();

    return {
      app: 'ShanBooks',
      type: 'library-backup',
      version: 2,
      exportedAt: Date.now(),
      note: 'This data-only backup stores metadata, lists, bookmarks, progress, and settings. Original document files are not embedded.',
      books: books.map(book => this.stripBookForExport(book)),
      bookmarks,
      progress,
      lists,
      settings,
    };
  }

  static async getAllProgress() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('progress', 'readonly');
      const store = transaction.objectStore('progress');
      const request = store.getAll();
      request.onsuccess = () => resolve((request.result || []).map(migrateProgressRecord));
      request.onerror = () => reject(request.error);
    });
  }

  static async importLibrarySnapshot(snapshot, { merge = true, filesByBookId = new Map() } = {}) {
    if (!snapshot || snapshot.type !== 'library-backup') {
      throw new Error('Invalid ShanBooks backup file.');
    }
    for (const name of ['books', 'bookmarks', 'progress', 'lists']) {
      const records = snapshot[name] || [];
      const key = name === 'progress' ? 'bookId' : 'id';
      if (!Array.isArray(records) || records.some(record => !record || typeof record[key] !== 'string' || !record[key].trim())) {
        throw new Error(`Invalid backup records: ${name}.`);
      }
      if (new Set(records.map(record => record[key])).size !== records.length) throw new Error(`Duplicate backup keys: ${name}.`);
    }

    const db = await this.openDB();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(['books', 'bookmarks', 'progress', 'lists'], 'readwrite');
      const stores = {
        books: transaction.objectStore('books'),
        bookmarks: transaction.objectStore('bookmarks'),
        progress: transaction.objectStore('progress'),
        lists: transaction.objectStore('lists'),
      };

      if (!merge) {
        stores.books.clear();
        stores.bookmarks.clear();
        stores.progress.clear();
        stores.lists.clear();
      }

      (snapshot.books || []).forEach(book => {
        const write = existing => {
          const restoredFile = filesByBookId.get(book.id) || (merge ? existing?.fileBlob : null) || null;
          stores.books.put({
            ...migrateBookRecord(book),
            fileBlob: restoredFile,
            missingFile: !restoredFile,
            coverUrl: book.coverUrl || (merge ? existing?.coverUrl : null) || null,
            restoredFromBackup: true,
            restoredAt: Date.now(),
          });
        };
        if (merge) {
          const request = stores.books.get(book.id);
          request.onsuccess = () => write(request.result);
        } else write(null);
      });
      (snapshot.bookmarks || []).forEach(bookmark => stores.bookmarks.put(bookmark));
      (snapshot.progress || []).forEach(item => stores.progress.put(item));
      (snapshot.lists || []).forEach(list => stores.lists.put(list));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    if (snapshot.settings && typeof snapshot.settings === 'object') {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(snapshot.settings));
    }
    for (const progress of snapshot.progress || []) {
      if (progress.bookId && Number.isFinite(progress.percentage)) localStorage.setItem(progressStorageKey(progress.bookId), String(progress.percentage));
    }
  }

  static async createAutoBackup(reason = 'auto') {
    const snapshot = await this.exportLibrarySnapshot();
    const db = await this.openDB();
    const item = {
      id: `snapshot-${Date.now()}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`,
      reason,
      createdAt: Date.now(),
      snapshot,
    };
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('backups', 'readwrite');
      const request = transaction.objectStore('backups').put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    const backups = await this.getAutoBackups();
    if (backups.length > AUTO_BACKUP_LIMIT) {
      const dbForCleanup = await this.openDB();
      await new Promise((resolve, reject) => {
        const transaction = dbForCleanup.transaction('backups', 'readwrite');
        const store = transaction.objectStore('backups');
        backups.slice(AUTO_BACKUP_LIMIT).forEach(backup => store.delete(backup.id));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    }
    localStorage.setItem(STORAGE_KEYS.lastBackupAt, String(item.createdAt));
    return item;
  }

  static async getLatestAutoBackup() {
    const backups = await this.getAutoBackups();
    return backups[0] || null;
  }

  static async getAutoBackups() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('backups', 'readonly');
      const request = transaction.objectStore('backups').getAll();
      request.onsuccess = () => resolve((request.result || []).sort((left, right) => right.createdAt - left.createdAt));
      request.onerror = () => reject(request.error);
    });
  }

  static async exportFullBackup() {
    const [{ zipSync, strToU8 }, snapshot, books] = await Promise.all([
      import('fflate'),
      this.exportLibrarySnapshot(),
      this.getAllBooks(),
    ]);
    const entries = {};
    const fileManifest = {};
    let totalBytes = 0;
    for (const book of books) {
      if (!book.fileBlob) continue;
      totalBytes += book.fileBlob.size;
      if (totalBytes > FULL_BACKUP_LIMIT) {
        throw new Error('Full backup is limited to 500 MB. Use the data-only backup for larger libraries.');
      }
      const extension = book.format || 'epub';
      const path = `books/${encodeURIComponent(book.id)}.${extension}`;
      entries[path] = new Uint8Array(await readBlobArrayBuffer(book.fileBlob));
      fileManifest[book.id] = path;
    }
    const manifest = { ...snapshot, type: 'library-backup-full', fileManifest };
    entries['manifest.json'] = strToU8(JSON.stringify(manifest));
    return new Blob([zipSync(entries, { level: 0 })], { type: 'application/zip' });
  }

  static async importFullBackup(blob, { merge = true } = {}) {
    const { unzipSync, strFromU8 } = await import('fflate');
    if (!blob?.size || blob.size > FULL_BACKUP_LIMIT) throw new Error('Full backup is empty or exceeds the 500 MB limit.');
    const bytes = new Uint8Array(await readBlobArrayBuffer(blob));
    assertZipSafety(bytes, blob.size, FULL_BACKUP_LIMIT);
    const entries = unzipSync(bytes);
    if (!entries['manifest.json']) throw new Error('Full backup manifest is missing.');
    const manifest = JSON.parse(strFromU8(entries['manifest.json']));
    if (manifest.type !== 'library-backup-full') throw new Error('This is not a ShanBooks full backup.');
    const filesByBookId = new Map();
    (manifest.books || []).forEach(book => {
      const path = manifest.fileManifest?.[book.id];
      const bytes = path ? entries[path] : null;
      if (bytes) filesByBookId.set(book.id, new Blob([bytes], { type: MIME_BY_FORMAT[book.format] || 'application/octet-stream' }));
    });
    await this.importLibrarySnapshot({ ...manifest, type: 'library-backup' }, { merge, filesByBookId });
    return { restoredBooks: manifest.books?.length || 0, restoredFiles: filesByBookId.size };
  }
}
