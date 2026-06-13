// src/utils/StorageManager.js
const DB_NAME = 'aurelia_db';
const DB_VERSION = 3;

export class StorageManager {
  static openDB() {
    return new Promise((resolve, reject) => {
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
      };

      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  static async getAllBooks() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('books', 'readonly');
      const store = transaction.objectStore('books');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
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
      request.onsuccess = () => resolve(request.result || null);
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
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  static async getAllBookmarks() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('bookmarks', 'readonly');
      const store = transaction.objectStore('bookmarks');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
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
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
      deleteRequest.onblocked = () => {
        reject(new Error('Database is busy. Close and reopen the app, then try again.'));
      };
    });
  }
}
