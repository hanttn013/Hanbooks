import { describe, expect, it } from 'vitest';
import { includesSearchText, normalizeSearchText } from '../../src/utils/searchText';

describe('Vietnamese search normalization', () => {
  it('matches Vietnamese text without diacritics', () => {
    expect(normalizeSearchText('Đường về mùa Hạ')).toBe('duong ve mua ha');
    expect(includesSearchText('Đường về mùa Hạ', 'duong ve')).toBe(true);
  });

  it('does not silently turn search into fuzzy matching', () => {
    expect(includesSearchText('ShanBooks', 'shanboks')).toBe(false);
  });
});
