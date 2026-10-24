import { BaseReaderAdapter } from './BaseReaderAdapter';
import { createLocator, parseLocator } from './locator';
import { prepareHeadings, sanitizeDocumentHtml } from './sanitizeHtml';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function decodeDocumentText(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return { text: new TextDecoder('utf-16le').decode(bytes.slice(2)), encoding: 'utf-16le' };
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    const swapped = bytes.slice(2);
    for (let index = 0; index + 1 < swapped.length; index += 2) {
      [swapped[index], swapped[index + 1]] = [swapped[index + 1], swapped[index]];
    }
    return { text: new TextDecoder('utf-16le').decode(swapped), encoding: 'utf-16be' };
  }
  const oddNulls = bytes.filter((value, index) => index % 2 === 1 && value === 0).length;
  if (bytes.length > 4 && oddNulls > bytes.length / 5) {
    return { text: new TextDecoder('utf-16le').decode(bytes), encoding: 'utf-16le' };
  }
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes), encoding: 'utf-8' };
  } catch {
    return { text: new TextDecoder('windows-1258').decode(bytes).normalize('NFC'), encoding: 'windows-1258' };
  }
}

function textToHtml(text) {
  const blocks = String(text || '').replace(/\r\n?/g, '\n').split(/\n{2,}/);
  return blocks.map((block, index) => {
    const value = block.trim();
    if (!value) return '';
    const heading = value.match(/^(?:(chương|chuong|chapter|phần|phan|part)\s+[\divxlcdm]+\b|#{1,3}\s+)(.*)$/iu);
    if (heading) return `<h2 id="section-${index + 1}">${escapeHtml(value.replace(/^#{1,3}\s+/, ''))}</h2>`;
    return `<p id="paragraph-${index + 1}">${escapeHtml(value).replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
}

function titleFromName(name = '') {
  return String(name).replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Untitled document';
}

export class TextReaderAdapter extends BaseReaderAdapter {
  async open(blob) {
    this.assertActive();
    this.blob = blob;
    const decoded = decodeDocumentText(await blob.arrayBuffer());
    this.encoding = decoded.encoding;
    this.rawText = decoded.text;
    if (this.format === 'md') {
      const { marked } = await import('marked');
      this.html = await sanitizeDocumentHtml(await marked.parse(decoded.text, { async: true }));
    } else if (this.format === 'html') {
      this.html = await sanitizeDocumentHtml(decoded.text);
    } else {
      this.html = await sanitizeDocumentHtml(textToHtml(decoded.text));
    }
    const prepared = prepareHeadings(this.html);
    this.html = prepared.html;
    this.toc = prepared.toc;
    this.location = { locator: createLocator(this.format, { anchor: this.toc[0]?.id || 'top' }), percentage: 0 };
    return this;
  }

  async getMetadata() {
    return {
      title: titleFromName(this.book?.fileName || this.blob?.name),
      author: 'Unknown Author',
      language: document.documentElement.lang || '',
      format: this.format,
      encoding: this.encoding,
      chapterCount: Math.max(1, this.toc?.length || 0),
      estimatedPages: Math.max(1, Math.ceil((this.rawText?.length || 0) / 1800)),
    };
  }

  async getToc() { return this.toc || []; }

  async goTo(locator) {
    const parsed = parseLocator(locator) || { format: this.format, anchor: 'top' };
    const anchor = parsed.anchor || 'top';
    const offset = Number.isFinite(parsed.offset)
      ? Math.min(1, Math.max(0, parsed.offset))
      : null;
    const index = Math.max(0, (this.toc || []).findIndex(item => item.id === anchor));
    const percentage = offset ?? (this.toc?.length > 1 ? index / (this.toc.length - 1) : 0);
    this.location = {
      locator: createLocator(this.format, { anchor, ...(offset === null ? {} : { offset }), ...(parsed.quote ? { quote: parsed.quote } : {}) }),
      percentage,
    };
    this.emitRelocate(this.location);
    return this.location;
  }

  async next() {
    const parsed = parseLocator(this.location?.locator);
    const current = Math.max(-1, (this.toc || []).findIndex(item => item.id === parsed?.anchor));
    const target = this.toc?.[Math.min(this.toc.length - 1, current + 1)];
    return target ? this.goTo(createLocator(this.format, { anchor: target.id })) : this.location;
  }

  async prev() {
    const parsed = parseLocator(this.location?.locator);
    const current = Math.max(0, (this.toc || []).findIndex(item => item.id === parsed?.anchor));
    const target = this.toc?.[Math.max(0, current - 1)];
    return target ? this.goTo(createLocator(this.format, { anchor: target.id })) : this.location;
  }

  async search(query) {
    const clean = String(query || '').trim().toLocaleLowerCase();
    if (!clean) return [];
    const results = [];
    const document = new DOMParser().parseFromString(this.html, 'text/html');
    for (const element of document.querySelectorAll('h1, h2, h3, p, li, td, th, blockquote')) {
      const text = element.textContent || '';
      const index = text.toLocaleLowerCase().indexOf(clean);
      if (index < 0 || results.length >= 100) continue;
      results.push({ locator: createLocator(this.format, { anchor: element.id, quote: text.slice(index, index + clean.length) }), excerpt: text.slice(Math.max(0, index - 40), index + clean.length + 80) });
    }
    return results;
  }

  getLocation() { return this.location; }
  getContent() { return this.html || ''; }
}
