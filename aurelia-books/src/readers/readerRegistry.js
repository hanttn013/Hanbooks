const LOADERS = Object.freeze({
  pdf: async () => (await import('./PdfReaderAdapter')).PdfReaderAdapter,
  docx: async () => (await import('./DocxReaderAdapter')).DocxReaderAdapter,
  txt: async () => (await import('./TextReaderAdapter')).TextReaderAdapter,
  md: async () => (await import('./TextReaderAdapter')).TextReaderAdapter,
  html: async () => (await import('./TextReaderAdapter')).TextReaderAdapter,
  pptx: async () => (await import('./PptxReaderAdapter')).PptxReaderAdapter,
  cbz: async () => (await import('./CbzReaderAdapter')).CbzReaderAdapter,
});

export async function createReaderAdapter(format, options = {}) {
  const loader = LOADERS[format];
  if (!loader) throw new Error(`No reader adapter is registered for ${format || 'unknown'}.`);
  const Adapter = await loader();
  return new Adapter({ ...options, format });
}

export function hasReaderAdapter(format) {
  return Boolean(LOADERS[format]);
}
