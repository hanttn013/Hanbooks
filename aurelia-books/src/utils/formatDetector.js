const FORMAT_BY_EXTENSION = Object.freeze({
  epub: 'epub',
  pdf: 'pdf',
  docx: 'docx',
  txt: 'txt',
  md: 'md',
  markdown: 'md',
  html: 'html',
  htm: 'html',
  pptx: 'pptx',
  cbz: 'cbz',
  zip: 'zip',
  rar: 'rar',
  fb2: 'fb2',
  mobi: 'mobi',
  azw3: 'azw3',
  doc: 'doc',
  xls: 'xls',
  ppt: 'ppt',
});

const FORMAT_BY_MIME = Object.freeze({
  'application/epub+zip': 'epub',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.comicbook+zip': 'cbz',
  'application/x-cbz': 'cbz',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/html': 'html',
  'application/zip': 'zip',
  'application/x-rar-compressed': 'rar',
  'application/vnd.rar': 'rar',
  'application/msword': 'doc',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.ms-powerpoint': 'ppt',
});

export const READABLE_FORMATS = Object.freeze(['epub', 'pdf', 'docx', 'txt', 'md', 'html', 'pptx', 'cbz']);
export const ARCHIVE_FORMATS = Object.freeze(['zip', 'rar']);
const LEGACY_OFFICE_FORMATS = new Set(['doc', 'xls', 'ppt']);

export class UnsupportedFormatError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'UnsupportedFormatError';
    this.code = details.code || 'UNSUPPORTED_FORMAT';
    Object.assign(this, details);
  }
}

function extensionOf(name = '') {
  const match = String(name).toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || '';
}

function startsWith(bytes, signature) {
  return signature.every((value, index) => bytes[index] === value);
}

function readUint16(view, offset) {
  return view.getUint16(offset, true);
}

function readUint32(view, offset) {
  return view.getUint32(offset, true);
}

async function listZipEntryNames(blob) {
  const tailSize = Math.min(blob.size, 128 * 1024);
  const tailOffset = blob.size - tailSize;
  const tail = new Uint8Array(await blob.slice(tailOffset).arrayBuffer());
  const tailView = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
  let eocd = -1;
  for (let offset = tail.length - 22; offset >= 0; offset -= 1) {
    if (readUint32(tailView, offset) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) return [];
  const entryCount = readUint16(tailView, eocd + 10);
  const directorySize = readUint32(tailView, eocd + 12);
  const directoryOffset = readUint32(tailView, eocd + 16);
  if (entryCount > 10_000 || directorySize > 4 * 1024 * 1024) {
    throw new UnsupportedFormatError('Archive has too many entries to inspect safely.', {
      code: 'ARCHIVE_LIMIT',
    });
  }
  const directory = new Uint8Array(await blob.slice(directoryOffset, directoryOffset + directorySize).arrayBuffer());
  const view = new DataView(directory.buffer, directory.byteOffset, directory.byteLength);
  const decoder = new TextDecoder('utf-8');
  const names = [];
  let offset = 0;
  while (offset + 46 <= directory.length && names.length < entryCount) {
    if (readUint32(view, offset) !== 0x02014b50) break;
    const nameLength = readUint16(view, offset + 28);
    const extraLength = readUint16(view, offset + 30);
    const commentLength = readUint16(view, offset + 32);
    const nameStart = offset + 46;
    names.push(decoder.decode(directory.slice(nameStart, nameStart + nameLength)).replace(/\\/g, '/'));
    offset = nameStart + nameLength + extraLength + commentLength;
  }
  return names;
}

function classifyZipEntries(names, extension, mimeFormat) {
  const normalized = names.map(name => name.toLowerCase());
  if (normalized.includes('mimetype') && normalized.some(name => name.endsWith('.opf'))) return 'epub';
  if (normalized.some(name => name === 'word/document.xml')) return 'docx';
  if (normalized.some(name => name === 'ppt/presentation.xml')) return 'pptx';
  const files = normalized.filter(name => name && !name.endsWith('/'));
  if (files.length > 0 && files.every(name => /\.(avif|gif|jpe?g|png|webp)$/i.test(name))) return 'cbz';
  if (['epub', 'docx', 'pptx', 'cbz'].includes(extension)) return extension;
  if (['epub', 'docx', 'pptx', 'cbz'].includes(mimeFormat)) return mimeFormat;
  return 'zip';
}

function resultFor(format, confidence, extra = {}) {
  const legacyOffice = LEGACY_OFFICE_FORMATS.has(format);
  const supported = READABLE_FORMATS.includes(format) || ARCHIVE_FORMATS.includes(format);
  let message = supported ? '' : `The ${String(format || 'unknown').toUpperCase()} format is not supported.`;
  if (legacyOffice) {
    message = `${format.toUpperCase()} is a legacy Office format. Convert it to ${format === 'doc' ? 'DOCX or PDF' : format === 'ppt' ? 'PPTX or PDF' : 'PDF'} before importing.`;
  }
  return { format: format || 'unknown', supported, confidence, legacyOffice, message, ...extra };
}

export async function detectDocumentFormat(file) {
  if (!file || typeof file.slice !== 'function') {
    throw new UnsupportedFormatError('Choose a document file to import.', { code: 'MISSING_FILE' });
  }
  if (!file.size) {
    throw new UnsupportedFormatError('Cannot import an empty file.', { code: 'EMPTY_FILE' });
  }

  const extension = FORMAT_BY_EXTENSION[extensionOf(file.name)] || '';
  const mimeFormat = FORMAT_BY_MIME[String(file.type || '').toLowerCase()] || '';
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());

  if (startsWith(head, [0x25, 0x50, 0x44, 0x46, 0x2d])) return resultFor('pdf', 'magic');
  if (startsWith(head, [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07])) return resultFor('rar', 'magic');
  if (startsWith(head, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    return resultFor(LEGACY_OFFICE_FORMATS.has(extension) ? extension : (mimeFormat || 'doc'), 'magic');
  }
  if (startsWith(head, [0x50, 0x4b])) {
    const names = await listZipEntryNames(file);
    return resultFor(classifyZipEntries(names, extension, mimeFormat), 'container', { entriesInspected: names.length });
  }

  if (extension) return resultFor(extension, 'extension');
  if (mimeFormat) return resultFor(mimeFormat, 'mime');

  const preview = new TextDecoder('utf-8', { fatal: false }).decode(await file.slice(0, 4096).arrayBuffer()).trimStart();
  if (/^(?:<!doctype\s+html|<html[\s>])/i.test(preview)) return resultFor('html', 'content');
  if (preview) return resultFor('txt', 'content');
  return resultFor('unknown', 'none');
}

export function assertReadableFormat(detection) {
  if (!detection?.supported || ARCHIVE_FORMATS.includes(detection.format)) {
    throw new UnsupportedFormatError(detection?.message || 'This document format cannot be opened.', {
      format: detection?.format || 'unknown',
    });
  }
  return detection;
}
