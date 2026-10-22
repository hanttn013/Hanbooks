import { describe, expect, it } from 'vitest';
import {
  migrateLegacyLocalStorage,
  progressStorageKey,
  STORAGE_KEYS,
} from '../../src/utils/storageKeys';

describe('legacy localStorage migration', () => {
  it('moves settings, stats, flags, and per-book progress without losing values', () => {
    localStorage.setItem('aurelia_settings', '{"fontSize":22}');
    localStorage.setItem('aurelia_stats', '{"totalReadingMs":1234}');
    localStorage.setItem('aurelia_sort', 'title');
    localStorage.setItem('aurelia_pct_book-1', '47');

    const result = migrateLegacyLocalStorage();

    expect(result).toEqual({ copied: 4, removed: 4 });
    expect(localStorage.getItem(STORAGE_KEYS.settings)).toBe('{"fontSize":22}');
    expect(localStorage.getItem(STORAGE_KEYS.stats)).toBe('{"totalReadingMs":1234}');
    expect(localStorage.getItem(STORAGE_KEYS.sort)).toBe('title');
    expect(localStorage.getItem(progressStorageKey('book-1'))).toBe('47');
    expect(localStorage.getItem('aurelia_settings')).toBeNull();
    expect(localStorage.getItem('aurelia_pct_book-1')).toBeNull();
  });

  it('keeps an existing ShanBooks value when both old and new keys exist', () => {
    localStorage.setItem('aurelia_sort', 'author');
    localStorage.setItem(STORAGE_KEYS.sort, 'lastOpenedAt');

    migrateLegacyLocalStorage();

    expect(localStorage.getItem(STORAGE_KEYS.sort)).toBe('lastOpenedAt');
    expect(localStorage.getItem('aurelia_sort')).toBeNull();
  });
});
