import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi as mock } from 'vitest';
import { vi, en, translate } from '../../src/i18n/messages';
import { useSettings } from '../../src/hooks/useSettings';
import { afterOverlaysClosed, consumeOverlayPop, dismissTopOverlay, registerOverlay } from '../../src/components/UI/overlayNavigation';

afterEach(() => { delete window.matchMedia; document.documentElement.removeAttribute('data-app-theme'); });

describe('Phase 3 UI contracts', () => {
  it('defers navigation until all nested dialogs unregister', async () => {
    const parent = registerOverlay('parent', mock.fn(), mock.fn());
    const child = registerOverlay('child', mock.fn(), mock.fn());
    const navigate = mock.fn();
    afterOverlaysClosed(navigate);
    child();
    await Promise.resolve();
    expect(navigate).not.toHaveBeenCalled();
    parent();
    await Promise.resolve();
    expect(navigate).toHaveBeenCalledTimes(1);
  });
  it('defaults to Vietnamese and system app appearance without changing reader theme', () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toMatchObject({ language: 'vi', appTheme: 'system', theme: 'warm-cream' });
    act(() => result.current.updateSetting('appTheme', 'dark'));
    expect(result.current.colorScheme).toBe('dark');
    expect(result.current.settings.theme).toBe('warm-cream');
  });

  it('responds to system appearance changes and removes the media listener', () => {
    let listener;
    const remove = mock.fn();
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: false, addEventListener: (_, callback) => { listener = callback; }, removeEventListener: remove }) });
    const { result, unmount } = renderHook(() => useSettings());
    act(() => listener({ matches: true }));
    expect(result.current.colorScheme).toBe('dark');
    act(() => result.current.updateSetting('theme', 'sepia'));
    expect(result.current.colorScheme).toBe('dark');
    expect(result.current.settings.theme).toBe('sepia');
    unmount();
    expect(remove).toHaveBeenCalledWith('change', listener);
  });

  it('preserves bilingual interpolation and never parses metadata as markup', () => {
    expect(translate('vi', 'processedCount', { count: 7 })).toBe('Đã xử lý 7 tài liệu');
    expect(translate('en', 'processedCount', { count: 7 })).toBe('Processed 7 documents');
    expect(translate('vi', 'Opening document', { title: '<img onerror=bad>' })).toContain('<img onerror=bad>');
    for (const [key, value] of Object.entries(vi)) {
      expect(value.match(/\{\w+\}/g) || [], key).toEqual((en[key] || key).match(/\{\w+\}/g) || []);
    }
  });

  it('consumes only topmost overlay pops before app navigation', () => {
    const close = mock.fn();
    const pop = mock.fn(() => true);
    const unregister = registerOverlay('dialog', close, pop);
    expect(dismissTopOverlay()).toBe(true);
    expect(close).toHaveBeenCalledTimes(1);
    const event = { state: { key: 'reader' } };
    expect(consumeOverlayPop(event)).toBe(true);
    expect(pop).toHaveBeenCalledWith(event);
    unregister();
    expect(consumeOverlayPop(event)).toBe(false);
    expect(dismissTopOverlay()).toBe(false);
  });
});
