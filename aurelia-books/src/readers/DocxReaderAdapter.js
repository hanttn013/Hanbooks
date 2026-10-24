import { TextReaderAdapter } from './TextReaderAdapter';
import { createLocator } from './locator';
import { prepareHeadings, sanitizeDocumentHtml } from './sanitizeHtml';
import { assertZipSafety } from '../utils/archiveImport';

export class DocxReaderAdapter extends TextReaderAdapter {
  async open(blob) {
    this.assertActive();
    this.blob = blob;
    const buffer = await blob.arrayBuffer();
    assertZipSafety(new Uint8Array(buffer), blob.size);
    let result;
    if (typeof Worker !== 'undefined') {
      result = await new Promise((resolve, reject) => {
        const worker = new Worker(new URL('../workers/docx.worker.js', import.meta.url), { type: 'module' });
        this.worker = worker;
        const finish = () => {
          window.clearTimeout(timer);
          worker.terminate();
          this.worker = null;
          this.cancelConversion = null;
        };
        const timer = window.setTimeout(() => {
          finish();
          reject(new Error('DOCX conversion timed out.'));
        }, 120_000);
        this.cancelConversion = () => {
          finish();
          reject(new Error('DOCX conversion cancelled.'));
        };
        worker.onmessage = event => {
          finish();
          if (event.data.ok) resolve(event.data);
          else reject(new Error(event.data.message));
        };
        worker.onerror = event => {
          finish();
          reject(new Error(event.message || 'DOCX worker failed.'));
        };
        worker.postMessage({ buffer }, [buffer]);
      });
    } else {
      const { default: mammoth } = await import('mammoth/mammoth.browser');
      result = await mammoth.convertToHtml({ arrayBuffer: buffer }, { externalFileAccess: false });
    }
    this.messages = result.messages || [];
    this.html = await sanitizeDocumentHtml(result.value);
    this.rawText = new DOMParser().parseFromString(this.html, 'text/html').body.textContent || '';
    const prepared = prepareHeadings(this.html);
    this.html = prepared.html;
    this.toc = prepared.toc;
    this.location = { locator: createLocator('docx', { anchor: this.toc[0]?.id || 'top' }), percentage: 0 };
    return this;
  }

  async getMetadata() {
    const base = await super.getMetadata();
    return { ...base, format: 'docx', fidelityNotice: 'DOCX is converted to reflowable text; complex layouts, headers and page breaks may differ from Word.', conversionWarnings: this.messages?.map(item => item.message) || [] };
  }

  destroy() {
    this.cancelConversion?.();
    this.worker?.terminate();
    this.worker = null;
    super.destroy();
  }
}
