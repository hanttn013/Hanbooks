import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useReader } from '../../src/hooks/useReader';

const nativeCallbacks = vi.hoisted(() => new Map());
const removeNativeListener = vi.hoisted(() => vi.fn());

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn((eventName, callback) => {
      nativeCallbacks.set(eventName, callback);
      return Promise.resolve({ remove: removeNativeListener });
    }),
  },
}));

describe('useReader lifecycle persistence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-22T10:00:00Z'));
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    nativeCallbacks.clear();
    removeNativeListener.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('persists elapsed reading time when the reader unmounts', () => {
    const { result, unmount } = renderHook(() => useReader('reading-time-book'));

    act(() => result.current.startReading());
    vi.setSystemTime(new Date('2026-10-22T10:02:00Z'));
    unmount();

    const stats = JSON.parse(localStorage.getItem('shanbooks_stats'));
    expect(stats.totalReadingMs).toBe(120_000);
  });

  it('pauses and persists time when the document becomes hidden', () => {
    const { result, unmount } = renderHook(() => useReader('background-book'));
    act(() => result.current.startReading());
    vi.setSystemTime(new Date('2026-10-22T10:01:00Z'));
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });

    act(() => document.dispatchEvent(new Event('visibilitychange')));

    const stats = JSON.parse(localStorage.getItem('shanbooks_stats'));
    expect(stats.totalReadingMs).toBe(60_000);
    unmount();
  });

  it('waits for visibility before starting a requested reading session', () => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    const { result, unmount } = renderHook(() => useReader('hidden-start-book'));

    act(() => result.current.startReading());
    vi.setSystemTime(new Date('2026-10-22T10:01:00Z'));
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    vi.setSystemTime(new Date('2026-10-22T10:02:00Z'));
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    act(() => document.dispatchEvent(new Event('visibilitychange')));

    const stats = JSON.parse(localStorage.getItem('shanbooks_stats'));
    expect(stats.totalReadingMs).toBe(60_000);
    unmount();
  });

  it('does not count time after native backgrounding before the reader starts', () => {
    const { result, unmount } = renderHook(() => useReader('native-background-book'));
    const handleAppState = nativeCallbacks.get('appStateChange');

    act(() => handleAppState({ isActive: false }));
    act(() => result.current.startReading());
    vi.setSystemTime(new Date('2026-10-22T10:01:00Z'));
    act(() => handleAppState({ isActive: true }));
    vi.setSystemTime(new Date('2026-10-22T10:02:00Z'));
    act(() => handleAppState({ isActive: false }));

    const stats = JSON.parse(localStorage.getItem('shanbooks_stats'));
    expect(stats.totalReadingMs).toBe(60_000);
    unmount();
  });
});
