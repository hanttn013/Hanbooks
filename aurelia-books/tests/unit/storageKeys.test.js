import { describe, expect, it } from 'vitest';
import {
  migrateLegacyLocalStorage,
  progressStorageKey,
  STORAGE_KEYS,
} from '../../src/utils/storageKeys';

describe('legacy localStorage migration', () => {
  it('moves every fixed key and per-book progress without losing values', () => {
    const fixedMigrations = [
      ['aurelia_settings', STORAGE_KEYS.settings, '{"fontSize":22}'],
      ['aurelia_stats', STORAGE_KEYS.stats, '{"totalReadingMs":1234}'],
      ['aurelia_sort', STORAGE_KEYS.sort, 'title'],
      ['aurelia_metadata_paused', STORAGE_KEYS.metadataPaused, '1'],
      ['aurelia_seeded_demo', STORAGE_KEYS.seededDemo, '1'],
      ['aurelia_seeded_default_lists', STORAGE_KEYS.seededDefaultLists, '1'],
      ['aurelia_last_backup_at', STORAGE_KEYS.lastBackupAt, '123456789'],
      ['aurelia_progress', STORAGE_KEYS.legacyProgress, '{"book-1":{"chapterTitle":"One"}}'],
    ];
    fixedMigrations.forEach(([oldKey, , value]) => localStorage.setItem(oldKey, value));
    localStorage.setItem('aurelia_pct_book-1', '47');

    const result = migrateLegacyLocalStorage();

    expect(result).toEqual({ copied: 9, removed: 9 });
    fixedMigrations.forEach(([oldKey, newKey, value]) => {
      expect(localStorage.getItem(newKey)).toBe(value);
      expect(localStorage.getItem(oldKey)).toBeNull();
    });
    expect(localStorage.getItem(progressStorageKey('book-1'))).toBe('47');
    expect(localStorage.getItem('aurelia_pct_book-1')).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.migrationVersion)).toBe('1');
  });

  it('keeps existing ShanBooks values for fixed and dynamic progress keys', () => {
    localStorage.setItem('aurelia_sort', 'author');
    localStorage.setItem(STORAGE_KEYS.sort, 'lastOpenedAt');
    localStorage.setItem('aurelia_pct_book-1', '47');
    localStorage.setItem(progressStorageKey('book-1'), '83');

    const result = migrateLegacyLocalStorage();

    expect(result).toEqual({ copied: 0, removed: 2 });
    expect(localStorage.getItem(STORAGE_KEYS.sort)).toBe('lastOpenedAt');
    expect(localStorage.getItem(progressStorageKey('book-1'))).toBe('83');
    expect(localStorage.getItem('aurelia_sort')).toBeNull();
    expect(localStorage.getItem('aurelia_pct_book-1')).toBeNull();
  });

  it('uses the migration marker to avoid rescanning storage', () => {
    let lengthWasRead = false;
    const storage = {
      get length() {
        lengthWasRead = true;
        return 0;
      },
      getItem(key) {
        return key === STORAGE_KEYS.migrationVersion ? '1' : null;
      },
    };

    expect(migrateLegacyLocalStorage(storage)).toEqual({ copied: 0, removed: 0 });
    expect(lengthWasRead).toBe(false);
  });

  it.each(['getItem', 'setItem', 'removeItem'])(
    'does not throw when storage.%s is blocked',
    (blockedMethod) => {
      const values = new Map([['aurelia_settings', '{"fontSize":22}']]);
      const storage = {
        get length() { return values.size; },
        key(index) { return [...values.keys()][index] ?? null; },
        getItem(key) {
          if (blockedMethod === 'getItem') throw new DOMException('Blocked', 'SecurityError');
          return values.get(String(key)) ?? null;
        },
        setItem(key, value) {
          if (blockedMethod === 'setItem') throw new DOMException('Blocked', 'SecurityError');
          values.set(String(key), String(value));
        },
        removeItem(key) {
          if (blockedMethod === 'removeItem') throw new DOMException('Blocked', 'SecurityError');
          values.delete(String(key));
        },
      };

      expect(() => migrateLegacyLocalStorage(storage)).not.toThrow();
      if (blockedMethod !== 'getItem') {
        expect(values.get('aurelia_settings')).toBe('{"fontSize":22}');
      }
    },
  );

  it('does not throw when access to global localStorage is blocked', () => {
    const originalStorage = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Blocked', 'SecurityError');
      },
    });

    try {
      expect(() => migrateLegacyLocalStorage()).not.toThrow();
    } finally {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: originalStorage,
      });
    }
  });
});
