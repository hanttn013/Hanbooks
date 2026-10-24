import { BaseReaderAdapter } from './BaseReaderAdapter';
import { createLocator, parseLocator } from './locator';
import PptxParseWorker from '@web-ppt/core/worker?worker';
import { assertZipSafety } from '../utils/archiveImport';

export class PptxReaderAdapter extends BaseReaderAdapter {
  async open(blob) {
    this.assertActive();
    const bytes = new Uint8Array(await blob.arrayBuffer());
    assertZipSafety(bytes, blob.size);
    const [core, { unzipSync }] = await Promise.all([import('@web-ppt/core'), import('fflate')]);
    this.core = core;
    const archive = unzipSync(bytes);
    const decoder = new TextDecoder('utf-8');
    this.fallbackSlideTexts = Object.entries(archive)
      .filter(([name]) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
      .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true }))
      .map(([, content]) => [...decoder.decode(content).matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/gi)]
        .map(match => match[1]
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'"))
        .join(' '));
    if (typeof Worker !== 'undefined') {
      this.worker = new PptxParseWorker();
      this.presentation = await this.core.parseInWorker(this.worker, bytes.buffer);
    } else {
      this.presentation = await this.core.parse(bytes, { lazy: true });
    }
    this.slideIndex = 0;
    this.location = { locator: createLocator('pptx', { slide: 0 }), percentage: 0 };
    return this;
  }

  async getMetadata() {
    return {
      title: this.presentation?.title || this.book?.title || 'Presentation',
      author: this.presentation?.author || 'Unknown Author',
      format: 'pptx',
      chapterCount: this.presentation?.slides?.length || 0,
      estimatedPages: this.presentation?.slides?.length || 0,
      fidelityNotice: 'Some PowerPoint effects, fonts, media, and advanced layouts may differ from the original.',
    };
  }

  async getToc() {
    return Promise.all((this.presentation?.slides || []).map(async (slide, index) => ({
      id: `slide-${index}`,
      label: this.getSlideText(slide, index).trim().slice(0, 80) || `Slide ${index + 1}`,
      slide: index,
    })));
  }

  getSlideText(slide, index) {
    return this.core.slideText(slide).trim() || this.fallbackSlideTexts?.[index] || '';
  }

  async getSlideSvg(index = this.slideIndex) {
    const slide = this.presentation?.slides?.[index];
    return slide ? this.core.slideToSvgFile(this.presentation, slide) : '';
  }

  async goTo(locator) {
    const parsed = parseLocator(locator) || { slide: 0 };
    const last = Math.max(0, (this.presentation?.slides?.length || 1) - 1);
    this.slideIndex = Math.min(last, Math.max(0, Number(parsed.slide) || 0));
    const percentage = last > 0 ? this.slideIndex / last : 0;
    this.location = { locator: createLocator('pptx', { slide: this.slideIndex }), percentage };
    this.emitRelocate(this.location);
    return this.location;
  }

  async next() { return this.goTo(createLocator('pptx', { slide: this.slideIndex + 1 })); }
  async prev() { return this.goTo(createLocator('pptx', { slide: this.slideIndex - 1 })); }

  async search(query) {
    const needle = String(query || '').trim().toLocaleLowerCase();
    if (!needle) return [];
    return (this.presentation?.slides || []).map((slide, index) => ({ index, text: this.getSlideText(slide, index) }))
      .filter(item => item.text.toLocaleLowerCase().includes(needle))
      .map(item => ({ slide: item.index, excerpt: item.text.slice(0, 180) }));
  }

  getLocation() { return this.location; }

  destroy() {
    this.worker?.terminate();
    this.worker = null;
    this.presentation?.dispose?.();
    this.presentation = null;
    super.destroy();
  }
}
