import { unzipSync } from 'fflate';
import { createExtractorFromData } from 'node-unrar-js/esm/index.esm.js';
import unrarWasmUrl from 'node-unrar-js/esm/js/unrar.wasm?url';

const EPUB_EXT = /\.epub$/i;
const ZIP_EXT = /\.zip$/i;
const RAR_EXT = /\.rar$/i;

let unrarWasmPromise = null;

function cleanArchiveName(name) {
  return (name || 'Imported archive')
    .replace(/\.(zip|rar)$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim() || 'Imported archive';
}

function baseName(path) {
  return String(path || '')
    .split(/[\\/]/)
    .filter(Boolean)
    .pop() || 'book.epub';
}

function isHiddenOrSystemPath(path) {
  const normalized = String(path || '').replace(/\\/g, '/');
  return normalized.startsWith('__MACOSX/')
    || normalized.split('/').some(part => part.startsWith('.') || part === 'Thumbs.db');
}

function bytesToFile(bytes, name) {
  const source = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const copy = source.slice();
  return new File([copy], baseName(name), { type: 'application/epub+zip' });
}

async function getUnrarWasmBinary() {
  if (!unrarWasmPromise) {
    unrarWasmPromise = fetch(unrarWasmUrl).then(response => {
      if (!response.ok) throw new Error('Could not load RAR engine.');
      return response.arrayBuffer();
    });
  }
  return unrarWasmPromise;
}

async function extractZip(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const entries = unzipSync(bytes);
  return Object.entries(entries)
    .filter(([path]) => EPUB_EXT.test(path) && !isHiddenOrSystemPath(path))
    .map(([path, data]) => bytesToFile(data, path));
}

async function extractRar(file) {
  const [data, wasmBinary] = await Promise.all([
    file.arrayBuffer(),
    getUnrarWasmBinary(),
  ]);
  const extractor = await createExtractorFromData({ data, wasmBinary });
  const extracted = extractor.extract({
    files: header => EPUB_EXT.test(header.name) && !header.flags?.directory && !isHiddenOrSystemPath(header.name),
  });
  return [...extracted.files]
    .filter(item => item.extraction && EPUB_EXT.test(item.fileHeader.name))
    .map(item => bytesToFile(item.extraction, item.fileHeader.name));
}

export function isArchiveFile(file) {
  return ZIP_EXT.test(file?.name || '') || RAR_EXT.test(file?.name || '');
}

export function isSupportedImportFile(file) {
  const name = file?.name || '';
  return EPUB_EXT.test(name) || ZIP_EXT.test(name) || RAR_EXT.test(name);
}

export async function extractEpubsFromArchive(file) {
  const name = file?.name || '';
  if (ZIP_EXT.test(name)) {
    return {
      listName: cleanArchiveName(name),
      sourceName: name,
      files: await extractZip(file),
    };
  }
  if (RAR_EXT.test(name)) {
    return {
      listName: cleanArchiveName(name),
      sourceName: name,
      files: await extractRar(file),
    };
  }
  throw new Error('Unsupported archive. Use ZIP or RAR.');
}
