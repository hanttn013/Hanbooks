import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useSettings } from '../../src/hooks/useSettings';

describe('useSettings storage migration', () => {
  it('moves legacy Aurelia settings to the ShanBooks key', () => {
    localStorage.setItem('aurelia_settings', JSON.stringify({
      theme: 'night',
      fontSize: 21,
      pageTurnEffect: 'realistic',
      chapterFlow: 'manual',
    }));

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.theme).toBe('night');
    expect(result.current.settings.fontSize).toBe(21);
    expect(result.current.settings).not.toHaveProperty('pageTurnEffect');
    expect(result.current.settings).not.toHaveProperty('chapterFlow');
    expect(JSON.parse(localStorage.getItem('shanbooks_settings')).fontSize).toBe(21);
    expect(localStorage.getItem('aurelia_settings')).toBeNull();
  });

  it('keeps existing ShanBooks settings and removes obsolete reader options', () => {
    localStorage.setItem('aurelia_settings', JSON.stringify({ fontSize: 21 }));
    localStorage.setItem('shanbooks_settings', JSON.stringify({
      fontSize: 19,
      pageTurnEffect: 'realistic',
      chapterFlow: 'manual',
    }));

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.fontSize).toBe(19);
    expect(result.current.settings).not.toHaveProperty('pageTurnEffect');
    expect(result.current.settings).not.toHaveProperty('chapterFlow');
    expect(localStorage.getItem('aurelia_settings')).toBeNull();
    expect(JSON.parse(localStorage.getItem('shanbooks_settings'))).not.toHaveProperty('pageTurnEffect');
  });
});
