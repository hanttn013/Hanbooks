import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UniversalReaderScreen from '../../src/components/Reader/UniversalReaderScreen';
import { createLocator, parseLocator } from '../../src/readers/locator';
import { DEFAULT_SETTINGS } from '../../src/hooks/useSettings';

const harness = vi.hoisted(() => ({
  createReaderAdapter: vi.fn(),
  nativeCallbacks: new Map(),
  removeNativeListener: vi.fn(),
  reader: null,
}));

vi.mock('../../src/readers/readerRegistry', () => ({
  createReaderAdapter: harness.createReaderAdapter,
}));

vi.mock('../../src/hooks/useReader', () => ({
  useReader: () => harness.reader,
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn((eventName, callback) => {
      harness.nativeCallbacks.set(eventName, callback);
      return Promise.resolve({ remove: harness.removeNativeListener });
    }),
  },
}));

function createAdapter() {
  const listeners = new Set();
  let location = { locator: createLocator('txt', { offset: 0 }), percentage: 0 };
  return {
    destroy: vi.fn(),
    emitRelocate(next) {
      location = next;
      listeners.forEach(listener => listener(next));
    },
    getContent: () => '<p>Reader body</p>',
    getLocation: () => location,
    getMetadata: vi.fn().mockResolvedValue({ title: 'Document' }),
    getToc: vi.fn().mockResolvedValue([]),
    goTo: vi.fn().mockResolvedValue(location),
    next: vi.fn().mockResolvedValue(location),
    onRelocate(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    open: vi.fn().mockResolvedValue(undefined),
    prev: vi.fn().mockResolvedValue(location),
    search: vi.fn().mockResolvedValue([]),
  };
}

async function renderReader() {
  const adapter = createAdapter();
  const onClose = vi.fn();
  harness.createReaderAdapter.mockResolvedValue(adapter);
  const view = render(
    <UniversalReaderScreen
      book={{ id: 'txt-book', title: 'Text fixture', status: 'unread', fileBlob: new Blob(['Reader body']) }}
      format="txt"
      settings={DEFAULT_SETTINGS}
      onClose={onClose}
      onBookUpdate={vi.fn()}
    />,
  );
  const body = await screen.findByText('Reader body');
  const content = body.closest('section');
  Object.defineProperties(content, {
    clientHeight: { configurable: true, value: 200 },
    clientWidth: { configurable: true, value: 200 },
    scrollHeight: { configurable: true, value: 1000 },
    scrollTop: { configurable: true, value: 0, writable: true },
    scrollWidth: { configurable: true, value: 200 },
  });
  return { adapter, content, onClose, ...view };
}

function expectSavedOffset(offset, percentage) {
  const calls = harness.reader.saveProgress.mock.calls;
  const [locator, savedPercentage] = calls[calls.length - 1];
  expect(parseLocator(locator).offset).toBeCloseTo(offset);
  expect(savedPercentage).toBeCloseTo(percentage);
}

describe('UniversalReaderScreen progress lifecycle', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    harness.createReaderAdapter.mockReset();
    harness.nativeCallbacks.clear();
    harness.removeNativeListener.mockClear();
    harness.reader = {
      addBookmark: vi.fn().mockResolvedValue(undefined),
      bookmarks: [],
      isBookmarked: vi.fn(() => false),
      progress: null,
      saveProgress: vi.fn().mockResolvedValue(undefined),
      startReading: vi.fn(),
      stopReading: vi.fn(),
    };
  });

  it('converts adapter fractions to stored 0-100 percentages', async () => {
    const { adapter } = await renderReader();

    act(() => {
      adapter.emitRelocate({ locator: createLocator('txt', { offset: 0.37 }), percentage: 0.37 });
    });

    await waitFor(() => expect(harness.reader.saveProgress).toHaveBeenCalled());
    expectSavedOffset(0.37, 37);
  });

  it('flushes a pending reflowable scroll before closing', async () => {
    const { content, onClose } = await renderReader();
    content.scrollTop = 400;
    fireEvent.scroll(content);

    fireEvent.click(screen.getByRole('button', { name: 'Close reader' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expectSavedOffset(0.5, 50);
  });

  it('flushes pending scroll on web, native, and unmount lifecycle boundaries', async () => {
    const { content, unmount } = await renderReader();

    content.scrollTop = 200;
    fireEvent.scroll(content);
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expectSavedOffset(0.25, 25);

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    content.scrollTop = 400;
    fireEvent.scroll(content);
    act(() => harness.nativeCallbacks.get('appStateChange')({ isActive: false }));
    expectSavedOffset(0.5, 50);

    content.scrollTop = 600;
    fireEvent.scroll(content);
    unmount();
    expectSavedOffset(0.75, 75);
  });
});
