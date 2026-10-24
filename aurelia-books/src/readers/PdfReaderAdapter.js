import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { BaseReaderAdapter } from './BaseReaderAdapter';
import { createLocator, parseLocator } from './locator';

export class PdfReaderAdapter extends BaseReaderAdapter {
  async open(blob) {
    this.assertActive();
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    if (import.meta.env.MODE === 'test') {
      globalThis.pdfjsWorker = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs');
    } else {
      pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    }
    this.pdfjs = pdfjs;
    this.blob = blob;
    this.loadingTask = pdfjs.getDocument({
      data: new Uint8Array(await blob.arrayBuffer()),
      useSystemFonts: true,
    });
    this.document = await this.loadingTask.promise;
    this.page = 1;
    this.location = { locator: createLocator('pdf', { page: 1, offset: 0 }), percentage: 0 };
    return this;
  }

  async getMetadata() {
    const data = await this.document.getMetadata().catch(() => ({ info: {}, metadata: null }));
    return {
      title: data.info?.Title || this.book?.title || this.blob?.name?.replace(/\.pdf$/i, '') || 'PDF document',
      author: data.info?.Author || 'Unknown Author',
      format: 'pdf',
      chapterCount: this.document.numPages,
      estimatedPages: this.document.numPages,
    };
  }

  async getToc() {
    const outline = await this.document.getOutline();
    const flattened = [];
    const visit = async (items, level = 1) => {
      for (const item of items || []) {
        const destination = typeof item.dest === 'string' ? await this.document.getDestination(item.dest) : item.dest;
        let page = 1;
        if (destination?.[0]) page = (await this.document.getPageIndex(destination[0])) + 1;
        flattened.push({ id: `outline-${flattened.length}`, label: item.title, destination, page, level });
        await visit(item.items, level + 1);
      }
    };
    await visit(outline);
    return flattened;
  }

  async getCover() {
    const canvas = document.createElement('canvas');
    await this.renderPage(canvas, 1, { maxWidth: 420 });
    return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82));
  }

  async renderPage(canvas, pageNumber = this.page, { maxWidth = 960, scale = 1 } = {}) {
    const page = await this.document.getPage(pageNumber);
    this.renderTasks ||= new WeakMap();
    this.renderTasks.get(canvas)?.cancel?.();
    const base = page.getViewport({ scale: 1 });
    const effectiveScale = (maxWidth / base.width) * scale;
    const viewport = page.getViewport({ scale: effectiveScale });
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(viewport.width * ratio);
    canvas.height = Math.ceil(viewport.height * ratio);
    canvas.style.width = `${Math.ceil(viewport.width)}px`;
    canvas.style.height = `${Math.ceil(viewport.height)}px`;
    const context = canvas.getContext('2d');
    const renderTask = page.render({ canvasContext: context, viewport, transform: ratio === 1 ? null : [ratio, 0, 0, ratio, 0, 0] });
    this.renderTasks.set(canvas, renderTask);
    try {
      await renderTask.promise;
    } finally {
      if (this.renderTasks.get(canvas) === renderTask) this.renderTasks.delete(canvas);
    }
    const text = await page.getTextContent();
    return { page, viewport, text };
  }

  async goTo(locator) {
    const parsed = parseLocator(locator) || { page: 1, offset: 0 };
    this.page = Math.min(this.document.numPages, Math.max(1, Number(parsed.page) || 1));
    const percentage = this.document.numPages > 1 ? (this.page - 1) / (this.document.numPages - 1) : 0;
    this.location = { locator: createLocator('pdf', { page: this.page, offset: parsed.offset || 0 }), percentage };
    this.emitRelocate(this.location);
    return this.location;
  }

  async next() { return this.goTo(createLocator('pdf', { page: this.page + 1, offset: 0 })); }
  async prev() { return this.goTo(createLocator('pdf', { page: this.page - 1, offset: 0 })); }

  async search(query) {
    const needle = String(query || '').trim().toLocaleLowerCase();
    if (!needle) return [];
    const results = [];
    for (let pageNumber = 1; pageNumber <= this.document.numPages; pageNumber += 1) {
      const page = await this.document.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items.map(item => item.str).join(' ');
      if (text.toLocaleLowerCase().includes(needle)) results.push({ page: pageNumber, excerpt: text.slice(0, 180) });
    }
    return results;
  }

  getLocation() { return this.location; }

  destroy() {
    this.loadingTask?.destroy?.();
    this.document?.destroy?.();
    this.document = null;
    super.destroy();
  }
}
