// src/utils/cleanToc.js

/**
 * Cleans and normalizes Table of Contents (TOC) chapter labels.
 * Solves the known bug where illustration captions or preceding sentences
 * in Gutenberg EPUBs get concatenated into chapter titles
 * (e.g. "I hope Mr. Bingley will like it. CHAPTER II." -> "CHAPTER II").
 */
export function cleanTocLabel(raw) {
  if (!raw) return '';
  let str = String(raw).replace(/\s+/g, ' ').trim();

  // Pattern: Sentence ending with punctuation/quotes followed by Chapter/Chương/Book/Part/Volume or Roman numeral
  const chapterMatch = str.match(/^(?:.*?[.!?"”’]\s+)?((?:Chapter|Chương|Book|Part|Volume|Section|Hồi|Quyển)\s+(?:[IVXLCDM\d]+|[A-Za-z]+).*)$/i);
  if (chapterMatch) {
    str = chapterMatch[1];
  }

  // Remove trailing period, dots, or trailing punctuation
  str = str.replace(/[.\s]+$/, '').trim();

  return str;
}

export function cleanTocItems(items = []) {
  return items.map(item => ({
    ...item,
    label: cleanTocLabel(item.label),
    subitems: item.subitems ? cleanTocItems(item.subitems) : [],
  }));
}
