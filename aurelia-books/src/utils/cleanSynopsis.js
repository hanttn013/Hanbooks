// src/utils/cleanSynopsis.js

/**
 * Cleans synopsis text from EPUB metadata:
 * 1. Preserves inner text from all HTML tags (specifically replacing <a> with inner text, never dropping child text).
 * 2. Uses DOMParser + textContent and collapses whitespace.
 * 3. Filters out Project Gutenberg legal boilerplates, license text, and metadata lines (Title/Author/Release date/Language/Credits).
 * 4. Cuts from marker "*** START OF".
 * 5. If the resulting text has fewer than 40 characters, returns '' so the UI shows "Chưa có giới thiệu" instead of raw metadata.
 */
export function cleanSynopsis(raw) {
  if (!raw || typeof raw !== 'string') return '';

  let text = raw;

  // 1. Decode HTML / entities if present
  if (/<[a-z][\s\S]*>/i.test(text) || /&[a-z0-9#]+;/i.test(text)) {
    try {
      if (typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        // Remove scripts/styles
        doc.querySelectorAll('script, style').forEach(el => el.remove());

        // Replace <a> tags with their exact inner text content (never dropping children)
        doc.querySelectorAll('a').forEach(a => {
          const textNode = doc.createTextNode(a.textContent || '');
          a.replaceWith(textNode);
        });

        text = doc.body.textContent || '';
      } else {
        // Fallback for non-DOM environments: replace <a ...>text</a> with text
        text = text
          .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1')
          .replace(/<[^>]+>/g, ' ');
      }
    } catch {
      text = text
        .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1')
        .replace(/<[^>]+>/g, ' ');
    }
  }

  // 2. Normalize line breaks
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 3. Cut from "*** START OF" if present
  const startMarkerIndex = text.search(/\*{3,}\s*START OF/i);
  if (startMarkerIndex !== -1) {
    const afterMarker = text.slice(startMarkerIndex);
    const lineBreakAfter = afterMarker.indexOf('\n');
    if (lineBreakAfter !== -1) {
      text = afterMarker.slice(lineBreakAfter + 1);
    } else {
      text = '';
    }
  }

  // Also cut at "*** END OF" if present
  const endMarkerIndex = text.search(/\*{3,}\s*END OF/i);
  if (endMarkerIndex !== -1) {
    text = text.slice(0, endMarkerIndex);
  }

  // 4. Remove Gutenberg boilerplate sentences and patterns
  text = text
    .replace(/(?:^|\n)\s*The\s+(?:Project\s+Gutenberg\s+eBook\s+)?of\s+[^\n.]*(?:\.|\n)?/gi, '')
    .replace(/This (?:eBook|work) is for the use of anyone anywhere[^\n.]*(?:\.|\n)?/gi, '')
    .replace(/(?:You may copy it|give it away|re-use it under the terms)[^.\n]*(?:license|Project Gutenberg|gutenberg\.org|restrictions)[^.\n]*[.!?]?/gi, '')
    .replace(/[^.\n]*(?:Project Gutenberg License|gutenberg\.org)[^.\n]*[.!?]?/gi, '')
    .replace(/If you are not located in the United States[^.\n]*[.!?]?/gi, '')
    .replace(/\bhttps?:\/\/(?:www\.)?gutenberg\S*/gi, '')
    .replace(/\bwww\.gutenberg\S*/gi, '')
    .replace(/terms of the or online at/gi, '');

  // 5. Line-by-line filtering of metadata headers
  const lines = text.split('\n');
  const filteredLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Filter metadata header lines: Title:/Author:/Release date:/Language:/Credits:
    if (/^(title|author|release date|language|credits|illustrator|original publication|most recently updated|posting date|character set encoding)\s*[:：]/i.test(trimmed)) {
      continue;
    }

    // Filter decorative separator lines
    if (/^(\*{3,}|={3,}|-{3,})/.test(trimmed)) continue;

    const cleanedLine = trimmed.replace(/\s+/g, ' ').trim();
    if (cleanedLine) {
      filteredLines.push(cleanedLine);
    }
  }

  const cleaned = filteredLines.join('\n\n').trim();

  // 6. Must have at least 40 characters to be considered a genuine synopsis
  if (cleaned.length < 40) {
    return '';
  }

  return cleaned;
}
