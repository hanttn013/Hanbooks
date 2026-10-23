import { describe, expect, it, vi } from 'vitest';
import { BaseReaderAdapter } from '../../src/readers/BaseReaderAdapter';
import { createLocator, locatorFromProgress } from '../../src/readers/locator';

class TestAdapter extends BaseReaderAdapter {
  async open(blob) {
    this.blob = blob;
    return this;
  }
}

describe('ReaderAdapter contract', () => {
  it('provides a disposable relocate event', () => {
    const adapter = new TestAdapter({ format: 'txt' });
    const listener = vi.fn();
    const unsubscribe = adapter.onRelocate(listener);
    adapter.emitRelocate({ locator: createLocator('txt', { anchor: 'p-1' }), percentage: 0.2 });
    unsubscribe();
    adapter.emitRelocate({ locator: createLocator('txt', { anchor: 'p-2' }), percentage: 0.4 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('destroys listeners and rejects calls after destruction', async () => {
    const adapter = new TestAdapter({ format: 'txt' });
    await adapter.open(new Blob(['hello']));
    adapter.destroy();
    expect(() => adapter.onRelocate(() => {})).toThrow(/destroyed/i);
  });
});

describe('format-neutral locators', () => {
  it('serializes structured positions predictably', () => {
    expect(createLocator('pdf', { page: 3, offset: 0.25 })).toBe(
      JSON.stringify({ format: 'pdf', page: 3, offset: 0.25 }),
    );
  });

  it('migrates legacy CFI progress without discarding the old field', () => {
    expect(locatorFromProgress({ cfi: 'epubcfi(/6/2)', percentage: 0.5 })).toEqual({
      format: 'epub',
      cfi: 'epubcfi(/6/2)',
    });
  });
});
