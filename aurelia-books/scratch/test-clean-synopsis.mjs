import { JSDOM } from 'jsdom';

// Candidate implementation of cleanSynopsis
export function cleanSynopsis(raw) {
  if (!raw || typeof raw !== 'string') return '';

  let text = raw;

  // 1. Decode HTML / entities using DOMParser (or JSDOM in Node environment)
  if (/<[a-z][\s\S]*>/i.test(text) || /&[a-z0-9#]+;/i.test(text)) {
    try {
      const Parser = typeof DOMParser !== 'undefined' ? DOMParser : new JSDOM().window.DOMParser;
      const doc = new Parser().parseFromString(text, 'text/html');
      
      // Remove unwanted script/style elements
      doc.querySelectorAll('script, style').forEach(el => el.remove());
      
      // Replace <a> tags with their textContent explicitly to guarantee no tag drop
      doc.querySelectorAll('a').forEach(a => {
        const textNode = doc.createTextNode(a.textContent || '');
        a.replaceWith(textNode);
      });

      text = doc.body.textContent || '';
    } catch {
      // Fallback
      text = text.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1').replace(/<[^>]+>/g, ' ');
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

  // Also remove "*** END OF" if present
  const endMarkerIndex = text.search(/\*{3,}\s*END OF/i);
  if (endMarkerIndex !== -1) {
    text = text.slice(0, endMarkerIndex);
  }

  // 4. Filter out lines or paragraphs containing boilerplate
  const lines = text.split('\n');
  const filteredLines = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line contains forbidden Gutenberg strings
    if (/project\s*gutenberg/i.test(trimmed)) continue;
    if (/gutenberg\.org/i.test(trimmed)) continue;
    if (/use of anyone anywhere/i.test(trimmed)) continue;
    if (/re-use it under the terms/i.test(trimmed)) continue;
    if (/under the terms of/i.test(trimmed) && /license/i.test(trimmed)) continue;
    if (/terms of the or online/i.test(trimmed)) continue;

    // Filter lines of format "Title:/Author:/Release date:/Language:/Credits:"
    if (/^(title|author|release date|language|credits|illustrator|original publication|most recently updated|posting date|character set encoding)\s*[:：]/i.test(trimmed)) {
      continue;
    }

    // Filter decorative marker lines
    if (/^(\*{3,}|={3,}|-{3,})/.test(trimmed)) continue;

    filteredLines.push(trimmed.replace(/\s+/g, ' '));
  }

  let cleaned = filteredLines.join('\n\n').trim();

  // 5. Must have at least 40 chars, otherwise return '' so fallback is shown
  if (cleaned.length < 40) {
    return '';
  }

  return cleaned;
}

// Test with Jane Eyre text
const sampleJaneEyre = `The Project Gutenberg eBook of Jane Eyre: An Autobiography
This eBook is for the use of anyone anywhere in the United States and most other parts of the world at no cost and with almost no restrictions whatsoever. You may copy it, give it away or re-use it under the terms of the Project Gutenberg License included with this eBook or online at www.gutenberg.org.
Title: Jane Eyre: An Autobiography
Author: Charlotte Brontë
Release date: March 1, 1998
Language: English
Credits: David Price
*** START OF THE PROJECT GUTENBERG EBOOK JANE EYRE: AN AUTOBIOGRAPHY ***
JANE EYRE
AN AUTOBIOGRAPHY
by Charlotte Brontë
London SERVICE & PATON 1897
There was no possibility of taking a walk that day. We had been wandering, indeed, in the leafless shrubbery an hour in the morning; but since dinner (Mrs. Reed, when there was no company, dined early) the cold winter wind had brought with it clouds so sombre, and a rain so penetrating, that further outdoor exercise was now out of the question.`;

console.log('--- Jane Eyre Cleaned ---');
console.log(cleanSynopsis(sampleJaneEyre));

// Test with only Gutenberg boilerplate (should return '')
const onlyBoilerplate = `This eBook is for the use of anyone anywhere. Title: Pride and Prejudice. Author: Jane Austen. Release date: 1998. www.gutenberg.org`;
console.log('--- Only Boilerplate (expected empty string): ---', JSON.stringify(cleanSynopsis(onlyBoilerplate)));

// Test Vietnamese string
const vietnamese = `Cuốn sách kể về hành trình đầy gian nan thử thách nhưng thấm đẫm tình người của những con người bình dị nơi thôn dã miền Trung Việt Nam.`;
console.log('--- Vietnamese Cleaned ---');
console.log(cleanSynopsis(vietnamese));
