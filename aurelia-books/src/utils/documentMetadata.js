import { extractEpubMetadata } from './epubMetadata';
import { createReaderAdapter, hasReaderAdapter } from '../readers/readerRegistry';

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function extractDocumentMetadata(file, format, fallback = {}) {
  if (format === 'epub') return extractEpubMetadata(file, fallback);
  if (!hasReaderAdapter(format)) throw new Error(`Metadata extraction is not available for ${format}.`);
  const adapter = await createReaderAdapter(format, {
    book: { ...fallback, title: fallback.title, fileName: file.name, format },
  });
  try {
    await adapter.open(file);
    const metadata = await adapter.getMetadata();
    let coverUrl = null;
    if (format === 'pdf' || format === 'cbz') {
      const cover = await adapter.getCover();
      const coverBlob = typeof cover === 'string' ? await fetch(cover).then(response => response.blob()) : cover;
      if (coverBlob instanceof Blob) coverUrl = await blobToDataUrl(coverBlob);
    }
    return {
      ...fallback,
      ...metadata,
      coverUrl,
      fileSize: file.size,
      metadataPending: false,
      metadataStatus: 'ready',
      metadataExtractedAt: Date.now(),
    };
  } finally {
    adapter.destroy();
  }
}
