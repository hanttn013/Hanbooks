import { unzipSync } from 'fflate';
import { BaseReaderAdapter } from './BaseReaderAdapter';
import { createLocator, parseLocator } from './locator';
import { assertZipSafety } from '../utils/archiveImport';

const IMAGE_PATTERN = /\.(?:avif|gif|jpe?g|png|webp)$/i;

export class CbzReaderAdapter extends BaseReaderAdapter {
  async open(blob) {
    this.assertActive();
    const bytes = new Uint8Array(await blob.arrayBuffer());
    assertZipSafety(bytes, blob.size);
    const archive = unzipSync(bytes);
    this.pages = Object.entries(archive)
      .filter(([name]) => IMAGE_PATTERN.test(name))
      .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true }))
      .map(([name, bytes]) => ({ name, url: URL.createObjectURL(new Blob([bytes])) }));
    if (!this.pages.length) throw new Error('This CBZ archive does not contain readable images.');
    this.pageIndex = 0;
    this.location = { locator: createLocator('cbz', { page: 0 }), percentage: 0 };
    return this;
  }

  async getMetadata() {
    return { title: this.book?.title || 'Comic archive', author: 'Unknown Author', format: 'cbz', chapterCount: this.pages.length, estimatedPages: this.pages.length };
  }

  async getCover() { return this.pages[0]?.url || null; }
  async getToc() { return this.pages.map((page, index) => ({ id: `page-${index}`, label: `Page ${index + 1}`, page: index })); }
  getPageUrl() { return this.pages[this.pageIndex]?.url || ''; }

  async goTo(locator) {
    const parsed = parseLocator(locator) || { page: 0 };
    const last = this.pages.length - 1;
    this.pageIndex = Math.min(last, Math.max(0, Number(parsed.page) || 0));
    const percentage = last > 0 ? this.pageIndex / last : 0;
    this.location = { locator: createLocator('cbz', { page: this.pageIndex }), percentage };
    this.emitRelocate(this.location);
    return this.location;
  }

  async next() { return this.goTo(createLocator('cbz', { page: this.pageIndex + 1 })); }
  async prev() { return this.goTo(createLocator('cbz', { page: this.pageIndex - 1 })); }
  async search() { return []; }
  getLocation() { return this.location; }

  destroy() {
    this.pages?.forEach(page => URL.revokeObjectURL(page.url));
    this.pages = [];
    super.destroy();
  }
}
