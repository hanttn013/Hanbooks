// tests/unit/cleanSynopsis.test.js
import { describe, it, expect } from 'vitest';
import { cleanSynopsis } from '../../src/utils/cleanSynopsis';

describe('cleanSynopsis', () => {
  it('handles empty or non-string inputs', () => {
    expect(cleanSynopsis('')).toBe('');
    expect(cleanSynopsis(null)).toBe('');
    expect(cleanSynopsis(undefined)).toBe('');
  });

  it('preserves inner text from <a> tags without dropping words like "of the or"', () => {
    const html = '<div>Under the terms of the <a href="https://www.gutenberg.org/license">Project Gutenberg License</a> or online at <a href="https://www.gutenberg.org">www.gutenberg.org</a>. A witty novel of manners exploring nineteenth-century social etiquette and misunderstandings between Elizabeth Bennet and Fitzwilliam Darcy.</div>';
    const cleaned = cleanSynopsis(html);
    expect(cleaned).not.toContain('gutenberg');
    expect(cleaned).not.toContain('terms of the or');
    expect(cleaned).toContain('A witty novel of manners');
  });

  it('filters real Pride and Prejudice header metadata and boilerplate', () => {
    const raw = `The Project Gutenberg eBook of Pride and Prejudice
This eBook is for the use of anyone anywhere in the United States and most other parts of the world at no cost and with almost no restrictions whatsoever. You may copy it, give it away or re-use it under the terms of the Project Gutenberg License included with this eBook or online at <a href="https://www.gutenberg.org">www.gutenberg.org</a>.
Title: Pride and Prejudice
Author: Jane Austen
Release date: June 1, 1998 [eBook #1342]
Language: English
Credits: Anonymous
*** START OF THE PROJECT GUTENBERG EBOOK PRIDE AND PREJUDICE ***
It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.
However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families.`;

    const cleaned = cleanSynopsis(raw);
    expect(cleaned).not.toMatch(/gutenberg/i);
    expect(cleaned).not.toMatch(/Title:/i);
    expect(cleaned).not.toMatch(/Author:/i);
    expect(cleaned).not.toMatch(/Release date:/i);
    expect(cleaned).not.toContain('terms of the or');
    expect(cleaned).toContain('It is a truth universally acknowledged');
  });

  it('filters real Dorian Gray header and returns empty string if no genuine synopsis >= 40 chars', () => {
    const rawOnlyHeader = `The Project Gutenberg eBook of The Picture of Dorian Gray
This eBook is for the use of anyone anywhere in the United States and most other parts of the world at no cost and with almost no restrictions whatsoever. You may copy it, give it away or re-use it under the terms of the Project Gutenberg License included with this eBook or online at www.gutenberg.org.
Title: The Picture of Dorian Gray
Author: Oscar Wilde
Release date: October 1, 1994
Language: English
Credits: Judith Boss`;

    // Only header metadata, no real content after filter -> fallback
    const cleaned = cleanSynopsis(rawOnlyHeader);
    expect(cleaned).toBe('');
  });

  it('filters real Jane Eyre header and preserves genuine prologue/story text', () => {
    const raw = `The Project Gutenberg eBook of Jane Eyre: An Autobiography
This eBook is for the use of anyone anywhere in the United States and most other parts of the world at no cost and with almost no restrictions whatsoever. You may copy it, give it away or re-use it under the terms of the Project Gutenberg License included with this eBook or online at <a class="reference external" href="https://www.gutenberg.org">www.gutenberg.org</a>.
Title: Jane Eyre: An Autobiography
Author: Charlotte Brontë
Release date: March 1, 1998 [eBook #1260]
Language: English
Credits: David Price
*** START OF THE PROJECT GUTENBERG EBOOK JANE EYRE: AN AUTOBIOGRAPHY ***
There was no possibility of taking a walk that day. We had been wandering, indeed, in the leafless shrubbery an hour in the morning; but since dinner the cold winter wind had brought clouds.`;

    const cleaned = cleanSynopsis(raw);
    expect(cleaned).not.toMatch(/gutenberg/i);
    expect(cleaned).not.toContain('terms of the or');
    expect(cleaned).toContain('There was no possibility of taking a walk that day.');
  });

  it('preserves genuine Vietnamese book synopsis without alterations', () => {
    const vietnamese = `Cuốn sách kể về hành trình vượt khó đầy xúc động của một gia đình nông dân nghèo giữa bối cảnh thời kỳ đổi mới tại vùng châu thổ sông Hồng. Tác phẩm khắc họa sâu sắc tình phụ tử và khát vọng vươn lên.`;
    const cleaned = cleanSynopsis(vietnamese);
    expect(cleaned).toBe(vietnamese);
  });
});
