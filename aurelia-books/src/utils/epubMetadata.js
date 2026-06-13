import ePub from 'epubjs';

const PREVIEW_SECTION_LIMIT = 5;
const PREVIEW_CHAR_LIMIT = 700;
const WORDS_PER_PAGE = 280;

const FALLBACK_GENRES = [
  'Fiction',
  'Novel',
  'Classic',
  'Literary',
];

function normalizeCreator(creator) {
  if (Array.isArray(creator)) return creator.filter(Boolean).join(', ');
  if (creator && typeof creator === 'object') {
    return creator.name || creator.value || String(creator);
  }
  return creator || '';
}

function normalizeSubject(subject) {
  const raw = Array.isArray(subject) ? subject[0] : subject;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (raw && typeof raw === 'object') return raw.name || raw.value || '';
  return '';
}

function cleanPreview(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/project gutenberg.*?ebook/ig, '')
    .replace(/table of contents/ig, '')
    .replace(/copyright.*?reserved/ig, '')
    .trim()
    .slice(0, PREVIEW_CHAR_LIMIT)
    .replace(/\s+\S*$/, '');
}

async function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

async function extractCover(book) {
  try {
    const coverPath = await book.coverUrl();
    if (!coverPath) return null;
    const res = await fetch(coverPath);
    const blob = await res.blob();
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

async function extractPreviewAndStats(book) {
  const items = book?.spine?.spineItems || [];
  let collected = '';
  let totalWords = 0;
  let inspected = 0;

  for (const item of items) {
    if (inspected >= PREVIEW_SECTION_LIMIT) break;
    try {
      await item.load(book.load.bind(book));
      const doc = item.document;
      const text = doc?.body?.innerText || doc?.body?.textContent || '';
      const cleaned = text.replace(/\s+/g, ' ').trim();
      if (cleaned) {
        totalWords += cleaned.split(/\s+/).filter(Boolean).length;
        if (collected.length < PREVIEW_CHAR_LIMIT) {
          collected += ` ${cleaned}`;
        }
        inspected += 1;
      }
      item.unload();
    } catch {
      try { item.unload(); } catch { /* ignore unload failure */ }
    }
  }

  return {
    description: cleanPreview(collected),
    estimatedPages: Math.max(1, Math.ceil(totalWords / WORDS_PER_PAGE)),
  };
}

export async function extractEpubMetadata(fileOrBlob, fallback = {}) {
  let book = null;
  try {
    const arrayBuffer = await fileOrBlob.arrayBuffer();
    book = ePub(arrayBuffer);
    await book.ready;

    const metadata = await book.loaded.metadata.catch(() => ({}));
    const navigation = await book.loaded.navigation.catch(() => null);
    const preview = await extractPreviewAndStats(book);
    const coverUrl = await extractCover(book);
    const title = metadata.title || fallback.title || fallback.fileName?.replace(/\.epub$/i, '') || 'Untitled Book';
    const author = normalizeCreator(metadata.creator) || fallback.author || 'Unknown Author';
    const genre = normalizeSubject(metadata.subject) || fallback.genre || FALLBACK_GENRES[0];
    const description = metadata.description || preview.description || fallback.description || '';
    const chapterCount = navigation?.toc?.length || book?.spine?.spineItems?.length || fallback.chapterCount || 0;

    return {
      title,
      author,
      coverUrl,
      genre,
      description,
      publisher: metadata.publisher || '',
      language: metadata.language || '',
      publishedAt: metadata.pubdate || metadata.date || '',
      chapterCount,
      estimatedPages: fallback.estimatedPages || preview.estimatedPages,
      fileSize: fileOrBlob.size || fallback.fileSize || 0,
      metadataExtractedAt: Date.now(),
    };
  } catch (err) {
    console.warn('EPUB metadata extraction failed:', err);
    return {
      title: fallback.title || fallback.fileName?.replace(/\.epub$/i, '') || 'Untitled Book',
      author: fallback.author || 'Unknown Author',
      coverUrl: fallback.coverUrl || null,
      genre: fallback.genre || FALLBACK_GENRES[0],
      description: fallback.description || '',
      publisher: '',
      language: '',
      publishedAt: '',
      chapterCount: fallback.chapterCount || 0,
      estimatedPages: fallback.estimatedPages || 0,
      fileSize: fileOrBlob?.size || fallback.fileSize || 0,
      metadataExtractedAt: Date.now(),
    };
  } finally {
    try { book?.destroy(); } catch { /* ignore destroy failure */ }
  }
}

export function normalizeBookMetadata(book) {
  return {
    genre: book.genre || 'Fiction',
    description: book.description || '',
    publisher: book.publisher || '',
    language: book.language || '',
    publishedAt: book.publishedAt || '',
    fileSize: book.fileSize || book.fileBlob?.size || 0,
    chapterCount: book.chapterCount || 0,
    estimatedPages: book.estimatedPages || book.totalLocations || 0,
    metadataExtractedAt: book.metadataExtractedAt || null,
  };
}
