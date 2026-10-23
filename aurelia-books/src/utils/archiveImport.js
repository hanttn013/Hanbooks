const DOCUMENT_EXT = /\.(?:epub|pdf|docx|txt|md|markdown|html?|pptx|cbz)$/i;
const ZIP_EXT = /\.zip$/i;
const RAR_EXT = /\.rar$/i;
const MAX_ARCHIVE_BYTES = 500 * 1024 * 1024;
const MAX_EXTRACTED_BYTES = 1024 * 1024 * 1024;
const MAX_ENTRY_BYTES = 500 * 1024 * 1024;
const MAX_ENTRIES = 2000;
const MAX_DEPTH = 12;
const MAX_COMPRESSION_RATIO = 100;

const MIME_BY_EXTENSION = Object.freeze({
  epub: 'application/epub+zip',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
  md: 'text/markdown',
  markdown: 'text/markdown',
  html: 'text/html',
  htm: 'text/html',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  cbz: 'application/vnd.comicbook+zip',
});

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

function folderName(path, archiveName) {
  const parts = String(path || '')
    .replace(/\\/g, '/')
    .split('/')
    .filter(part => part && part !== '.' && part !== '..');
  if (parts.length > 1) return parts[0].trim() || cleanArchiveName(archiveName);
  return cleanArchiveName(archiveName);
}

function isHiddenOrSystemPath(path) {
  const normalized = String(path || '').replace(/\\/g, '/');
  return normalized.startsWith('__MACOSX/')
    || normalized.split('/').some(part => part.startsWith('.') || part === 'Thumbs.db');
}

function bytesToFile(bytes, name) {
  const source = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const copy = source.slice();
  const extension = baseName(name).toLowerCase().split('.').pop();
  const file = new File([copy], baseName(name), { type: MIME_BY_EXTENSION[extension] || 'application/octet-stream' });
  Object.defineProperty(file, 'archivePath', { value: String(name || ''), enumerable: true });
  return file;
}

async function getUnrarWasmBinary() {
  if (!unrarWasmPromise) {
    unrarWasmPromise = import('node-unrar-js/esm/js/unrar.wasm?url').then(({ default: unrarWasmUrl }) => fetch(unrarWasmUrl)).then(response => {
      if (!response.ok) throw new Error('Could not load RAR engine.');
      return response.arrayBuffer();
    });
  }
  return unrarWasmPromise;
}

function assertZipSafety(bytes, compressedBytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 128 * 1024); offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) throw new Error('Invalid ZIP archive: central directory is missing.');
  const entryCount = view.getUint16(eocd + 10, true);
  const directoryOffset = view.getUint32(eocd + 16, true);
  if (entryCount > MAX_ENTRIES) throw new Error(`Archive contains more than ${MAX_ENTRIES} entries.`);
  const decoder = new TextDecoder('utf-8');
  let offset = directoryOffset;
  let totalOriginal = 0;
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50) {
      throw new Error('Invalid ZIP archive directory.');
    }
    const originalSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const name = decoder.decode(bytes.slice(offset + 46, offset + 46 + nameLength)).replace(/\\/g, '/');
    const depth = name.split('/').filter(Boolean).length - 1;
    if (depth > MAX_DEPTH) throw new Error(`Archive path depth exceeds the limit: ${name}`);
    if (originalSize > MAX_ENTRY_BYTES) throw new Error(`Archive entry is larger than 500 MB: ${name}`);
    totalOriginal += originalSize;
    if (totalOriginal > MAX_EXTRACTED_BYTES || totalOriginal > Math.max(compressedBytes, 1) * MAX_COMPRESSION_RATIO) {
      throw new Error('Archive exceeds the decompression safety limit.');
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
}

async function extractZip(file) {
  if (file.size > MAX_ARCHIVE_BYTES) throw new Error('Archive is larger than the 500 MB safety limit.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  assertZipSafety(bytes, file.size);
  const { unzip } = await import('fflate');
  const entries = await new Promise((resolve, reject) => {
    unzip(bytes, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
  const candidates = Object.entries(entries)
    .filter(([path]) => DOCUMENT_EXT.test(path) && !isHiddenOrSystemPath(path));
  if (Object.keys(entries).length > MAX_ENTRIES) throw new Error(`Archive contains more than ${MAX_ENTRIES} entries.`);
  let total = 0;
  return candidates.map(([path, data]) => {
    const depth = String(path).replace(/\\/g, '/').split('/').filter(Boolean).length - 1;
    if (depth > MAX_DEPTH) throw new Error(`Archive path depth exceeds the limit: ${path}`);
    if (data.byteLength > MAX_ENTRY_BYTES) throw new Error(`Archive entry is larger than 500 MB: ${path}`);
    total += data.byteLength;
    if (total > MAX_EXTRACTED_BYTES || total > Math.max(file.size, 1) * MAX_COMPRESSION_RATIO) {
      throw new Error('Archive exceeds the decompression safety limit.');
    }
    return bytesToFile(data, path);
  });
}

async function extractRar(file) {
  if (file.size > MAX_ARCHIVE_BYTES) throw new Error('Archive is larger than the 500 MB safety limit.');
  const [data, wasmBinary, { createExtractorFromData }] = await Promise.all([
    file.arrayBuffer(),
    getUnrarWasmBinary(),
    import('node-unrar-js/esm/index.esm.js'),
  ]);
  const extractor = await createExtractorFromData({ data, wasmBinary });
  let entryCount = 0;
  let declaredTotal = 0;
  const extracted = extractor.extract({
    files: header => {
      entryCount += 1;
      const entrySize = Number(header.unpSize || header.unpackedSize || 0);
      declaredTotal += entrySize;
      if (entryCount > MAX_ENTRIES || entrySize > MAX_ENTRY_BYTES || declaredTotal > MAX_EXTRACTED_BYTES) {
        throw new Error('RAR archive exceeds the extraction safety limit.');
      }
      return DOCUMENT_EXT.test(header.name) && !header.flags?.directory && !isHiddenOrSystemPath(header.name);
    },
  });
  return [...extracted.files]
    .filter(item => item.extraction && DOCUMENT_EXT.test(item.fileHeader.name))
    .map(item => bytesToFile(item.extraction, item.fileHeader.name));
}

export function isArchiveFile(file) {
  return ZIP_EXT.test(file?.name || '') || RAR_EXT.test(file?.name || '');
}

export function isSupportedImportFile(file) {
  const name = file?.name || '';
  return DOCUMENT_EXT.test(name) || ZIP_EXT.test(name) || RAR_EXT.test(name);
}

export async function extractDocumentsFromArchive(file) {
  const name = file?.name || '';
  if (ZIP_EXT.test(name)) {
    const files = await extractZip(file);
    return {
      listName: cleanArchiveName(name),
      sourceName: name,
      files,
      groups: groupArchiveFiles(files, name),
    };
  }
  if (RAR_EXT.test(name)) {
    const files = await extractRar(file);
    return {
      listName: cleanArchiveName(name),
      sourceName: name,
      files,
      groups: groupArchiveFiles(files, name),
    };
  }
  throw new Error('Unsupported archive. Use ZIP or RAR.');
}

export const extractEpubsFromArchive = extractDocumentsFromArchive;

export function groupArchiveFiles(files, archiveName) {
  const groups = new Map();
  for (const file of files || []) {
    const name = folderName(file.archivePath || file.name, archiveName);
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(file);
  }
  return [...groups.entries()].map(([name, groupFiles]) => ({ name, files: groupFiles }));
}
