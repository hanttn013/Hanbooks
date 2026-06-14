import ePub from 'epubjs';

const PREVIEW_SECTION_LIMIT = 10;
const PREVIEW_CHAR_LIMIT = 1200;
const WORDS_PER_PAGE = 280;
const CHAPTER_TOKEN_RE = /\b(?:chương|chÆ°Æ¡ng|chapter)\s*\d+/gi;
const CHAPTER_LABEL_RE = /(?:chương|chÆ°Æ¡ng|chapter)\s*(\d+)/i;
const LABELS = {
  author: 'Tác giả|TÃ¡c giáº£|Tac gia|Author',
  genre: 'Thể loại|Thá»ƒ loáº¡i|The loai|Genre|Tags',
  originalTitle: 'Tên gốc|TÃªn gá»‘c|Ten goc|Original',
  characters: 'Nhân vật|NhÃ¢n váº­t|Nhan vat|Characters?',
  synopsis: 'Văn án|VÄƒn Ã¡n|Van an|Synopsis|Summary',
  intro: 'Giới thiệu|Giá»›i thiá»‡u|Gioi thieu|Introduction',
  toc: 'Mục lục|Má»¥c lá»¥c|Muc luc',
};

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

function countChapterTokens(text = '') {
  const matches = text.match(CHAPTER_TOKEN_RE);
  return matches ? matches.length : 0;
}

function looksLikeTocText(text = '') {
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
    const label = item.label?.trim() || '';
    const match = label.match(CHAPTER_LABEL_RE);
    if (match) numbered.add(Number(match[1]));
  });
  if (numbered.size > 0) return numbered.size;

  const contentRows = rows.filter(item => {
    const label = item.label?.trim().toLowerCase() || '';
    return label && !/^(cover|bìa|bia|title|nav|toc|mục lục|muc luc|giới thiệu|gioi thieu|introduction)$/i.test(label);
  });
  return contentRows.length || fallback;
}

function valueAfterLabel(line, label) {
  const match = line.match(new RegExp(`^(?:${label})\\s*[:：-]\\s*(.+)$`, 'i'));
  return match?.[1]?.trim() || '';
}

function cleanListValue(value = '') {
  return value
    .replace(/\s+/g, ' ')
    .replace(/,\s*,+/g, ',')
    .trim();
}

function extractIntroMetadata(rawText = '') {
  const text = rawText.replace(/\r/g, '\n');
  const lines = text
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const joined = lines.join('\n');

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
    intro.author ||= valueAfterLabel(line, LABELS.author);
    intro.genre ||= valueAfterLabel(line, LABELS.genre);
    intro.originalTitle ||= valueAfterLabel(line, LABELS.originalTitle);
    intro.editor ||= valueAfterLabel(line, 'Editor');
    intro.beta ||= valueAfterLabel(line, 'Beta');
  }

  const characterMatch = joined.match(new RegExp(`(?:${LABELS.characters})\\s*[:：-]?\\s*([\\s\\S]*?)(?:\\n\\s*(?:${LABELS.synopsis}|${LABELS.intro}|chương\\s*\\d+|chÆ°Æ¡ng\\s*\\d+|chapter\\s*\\d+)\\b|$)`, 'i'));
  if (characterMatch) intro.characters = cleanListValue(characterMatch[1]);

  const synopsisMatch = joined.match(new RegExp(`(?:${LABELS.synopsis})\\s*[:：-]?\\s*([\\s\\S]*?)(?:\\n\\s*(?:chương\\s*\\d+|chÆ°Æ¡ng\\s*\\d+|chapter\\s*\\d+|${LABELS.toc})\\b|$)`, 'i'));
  if (synopsisMatch) {
    intro.description = cleanPreview(synopsisMatch[1]);
  } else {
    const introMatch = joined.match(new RegExp(`(?:${LABELS.intro})\\s*[:：-]?\\s*([\\s\\S]*?)(?:\\n\\s*(?:chương\\s*\\d+|chÆ°Æ¡ng\\s*\\d+|chapter\\s*\\d+|${LABELS.toc})\\b|$)`, 'i'));
    if (introMatch && !looksLikeTocText(introMatch[1])) {
      intro.description = cleanPreview(introMatch[1]);
    }
  }

  const firstTitle = lines.find(line => {
    return line.length <= 80
      && !/^(tác giả|tac gia|author|thể loại|the loai|genre|giới thiệu|gioi thieu|văn án|van an|editor|beta|chương|chapter)\b/i.test(line);
  });
  intro.title = firstTitle || '';
  intro.genre = cleanListValue(intro.genre);
  intro.author = cleanListValue(intro.author);

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
      ? (preview.description || fallback.description || '')
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
