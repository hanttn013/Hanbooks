export class BaseReaderAdapter {
  constructor({ format, book } = {}) {
    this.format = format || book?.format || 'unknown';
    this.book = book || null;
    this.destroyed = false;
    this.relocateListeners = new Set();
  }

  assertActive() {
    if (this.destroyed) throw new Error('Reader adapter has been destroyed.');
  }

  async open() { throw new Error('open(blob) must be implemented by the reader adapter.'); }
  async getMetadata() { return {}; }
  async getCover() { return null; }
  async getToc() { return []; }
  async goTo() { return null; }
  async next() { return null; }
  async prev() { return null; }
  async search() { return []; }
  getLocation() { return null; }
  applyTheme() {}

  onRelocate(listener) {
    this.assertActive();
    if (typeof listener !== 'function') throw new TypeError('onRelocate requires a function.');
    this.relocateListeners.add(listener);
    return () => this.relocateListeners.delete(listener);
  }

  emitRelocate(location) {
    if (this.destroyed) return;
    this.relocateListeners.forEach(listener => listener(location));
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.relocateListeners.clear();
  }
}
