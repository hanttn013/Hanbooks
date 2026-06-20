import ePub from 'epubjs';

const PREVIEW_SECTION_LIMIT = 6;
const PREVIEW_CHAR_LIMIT = 1200;
const WORDS_PER_PAGE = 280;

const FALLBACK_GENRES = [
  'Fiction',
  'Novel',
  'Classic',
  'Literary',
];

function normalizeTextForSearch(text = '') {
  return text
    .replace(/chÆ°Æ¡ng|chÃ†Â°Ã†Â¡ng/gi, 'chuong')
    .replace(/TÃ¡c gi.+?/gi, 'tac gia')
    .replace(/Th.+?lo.+?i/gi, 'the loai')
    .replace(/VÄƒn Ã¡n|VÃ„Æ’n ÃƒÂ¡n/gi, 'van an')
    .replace(/Gi.+?thi.+?u/gi, 'gioi thieu')
    .replace(/Nh.+?n v.+?t/gi, 'nhan vat')
    .replace(/TÃªn g.+?c/gi, 'ten goc')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

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

function countChapterTokens(text = '') {
  const normalized = normalizeTextForSearch(text);
  const matches = normalized.match(/\b(?:chuong|chapter)\s*\d+/g);
  return matches ? matches.length : 0;
}

export function looksLikeTocText(text = '') {
  const normalized = normalizeTextForSearch(text).replace(/\s+/g, ' ').trim();
  if (!normalized) return false;
  if (/^(chuong|chapter)$/.test(normalized)) return true;
  if (/^(chuong|chapter)\s*(\d+)?\s*$/.test(normalized)) return true;
  return countChapterTokens(text) > 8;
}

function flattenToc(items = [], rows = []) {
  items.forEach(item => {
    rows.push(item);
    if (item.subitems?.length) flattenToc(item.subitems, rows);
  });
  return rows;
}

function countChaptersFromNavigation(navigation, fallback = 0) {
  const rows = flattenToc(navigation?.toc || []);
  const numbered = new Set();
  rows.forEach(item => {
    const label = normalizeTextForSearch(item.label?.trim() || '');
    const match = label.match(/(?:chuong|chapter)\s*(\d+)/i);
    if (match) numbered.add(Number(match[1]));
  });
  if (numbered.size > 0) return numbered.size;

  const contentRows = rows.filter(item => {
    const label = normalizeTextForSearch(item.label?.trim() || '');
    return label && !/^(cover|bia|title|nav|toc|muc luc|gioi thieu|introduction)$/.test(label);
  });
  return contentRows.length || fallback;
}

function valueAfterLabel(line, labels) {
  const normalizedLine = normalizeTextForSearch(line);
  for (const label of labels) {
    const normalizedLabel = normalizeTextForSearch(label);
    if (normalizedLine.startsWith(normalizedLabel)) {
      const match = line.match(/[:：-]\s*(.+)$/);
      return match?.[1]?.trim() || '';
    }
  }
  return '';
}

function cleanListValue(value = '') {
  return value
    .replace(/\s+/g, ' ')
    .replace(/,\s*,+/g, ',')
    .trim();
}

function sectionAfterLabels(lines, labels, stopLabels) {
  const startIndex = lines.findIndex(line => {
    const normalized = normalizeTextForSearch(line);
    return labels.some(label => normalized.startsWith(normalizeTextForSearch(label)));
  });
  if (startIndex === -1) return '';

  const firstLine = lines[startIndex];
  const firstValue = firstLine.match(/[:：-]\s*(.+)$/)?.[1]?.trim() || '';
  const collected = firstValue ? [firstValue] : [];

  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const normalized = normalizeTextForSearch(lines[i]);
    const shouldStop = stopLabels.some(label => normalized.startsWith(normalizeTextForSearch(label)))
      || /^(chuong|chapter)\s*\d+/.test(normalized)
      || normalized === 'muc luc';
    if (shouldStop) break;
    collected.push(lines[i]);
  }

  return cleanPreview(collected.join(' '));
}

function extractIntroMetadata(rawText = '') {
  const lines = rawText
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const intro = {
    title: '',
    author: '',
    genre: '',
    description: '',
    characters: '',
    originalTitle: '',
    editor: '',
    beta: '',
  };

  for (const line of lines) {
    intro.author ||= valueAfterLabel(line, ['tac gia', 'author']);
    intro.genre ||= valueAfterLabel(line, ['the loai', 'genre', 'tags']);
    intro.originalTitle ||= valueAfterLabel(line, ['ten goc', 'original']);
    intro.characters ||= valueAfterLabel(line, ['nhan vat', 'characters']);
    intro.editor ||= valueAfterLabel(line, ['editor']);
    intro.beta ||= valueAfterLabel(line, ['beta']);
  }

  const synopsis = sectionAfterLabels(lines, ['van an', 'synopsis', 'summary'], ['chuong', 'chapter', 'muc luc']);
  const introText = sectionAfterLabels(lines, ['gioi thieu', 'introduction'], ['chuong', 'chapter', 'muc luc']);
  intro.description = synopsis || (!looksLikeTocText(introText) ? introText : '');

  const firstTitle = lines.find(line => {
    const normalized = normalizeTextForSearch(line);
    return line.length <= 80
      && !/^(tac gia|author|the loai|genre|gioi thieu|van an|editor|beta|chuong|chapter|muc luc)\b/.test(normalized);
  });
  intro.title = firstTitle || '';
  intro.genre = cleanListValue(intro.genre);
  intro.author = cleanListValue(intro.author);
  intro.characters = cleanListValue(intro.characters);

  return intro;
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
  let introMetadata = {};

  for (const item of items) {
    if (inspected >= PREVIEW_SECTION_LIMIT) break;
    try {
      await item.load(book.load.bind(book));
      const doc = item.document;
      const text = doc?.body?.innerText || doc?.body?.textContent || '';
      const cleaned = text.replace(/\s+/g, ' ').trim();
      if (cleaned) {
        totalWords += cleaned.split(/\s+/).filter(Boolean).length;
        const structured = extractIntroMetadata(text);
        if (!introMetadata.description && structured.description) {
          introMetadata = structured;
        }
        if (collected.length < PREVIEW_CHAR_LIMIT && !looksLikeTocText(cleaned)) {
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
    ...introMetadata,
    description: introMetadata.description || cleanPreview(collected),
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
    const title = metadata.title || preview.title || fallback.title || fallback.fileName?.replace(/\.epub$/i, '') || 'Untitled Book';
    const author = normalizeCreator(metadata.creator) || preview.author || fallback.author || 'Unknown Author';
    const genre = normalizeSubject(metadata.subject) || preview.genre || fallback.genre || FALLBACK_GENRES[0];
    const rawDescription = metadata.description || '';
    const description = (!rawDescription || looksLikeTocText(rawDescription))
      ? (preview.description || (!looksLikeTocText(fallback.description) ? fallback.description : '') || '')
      : rawDescription;
    const chapterCount = countChaptersFromNavigation(
      navigation,
      book?.spine?.spineItems?.length || fallback.chapterCount || 0
    );

    return {
      title,
      author,
      coverUrl,
      genre,
      description,
      characters: preview.characters || fallback.characters || '',
      originalTitle: preview.originalTitle || fallback.originalTitle || '',
      editor: preview.editor || fallback.editor || '',
      beta: preview.beta || fallback.beta || '',
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
      description: looksLikeTocText(fallback.description) ? '' : (fallback.description || ''),
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
    description: looksLikeTocText(book.description) ? '' : (book.description || ''),
    characters: book.characters || '',
    originalTitle: book.originalTitle || '',
    editor: book.editor || '',
    beta: book.beta || '',
    publisher: book.publisher || '',
    language: book.language || '',
    publishedAt: book.publishedAt || '',
    fileSize: book.fileSize || book.fileBlob?.size || 0,
    chapterCount: book.chapterCount || 0,
    estimatedPages: book.estimatedPages || book.totalLocations || 0,
    metadataExtractedAt: book.metadataExtractedAt || null,
  };
}
