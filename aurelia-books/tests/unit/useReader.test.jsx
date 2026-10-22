import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useReader } from '../../src/hooks/useReader';

describe('useReader lifecycle persistence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-22T10:00:00Z'));
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
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
});
