import { performance } from 'node:perf_hooks';
import { includesSearchText } from '../src/utils/searchText.js';

const sizes = [500, 1000, 5000];
const queries = [
  ['title-accent', 'Bạch Nguyệt Quang'],
  ['title-no-accent', 'Bach Nguyet Quang'],
  ['author', 'Dieu Tam'],
  ['genre', 'bach hop'],
  ['typo', 'Bach Nguyt Quang'],
];

function makeBooks(count) {
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1;
    return {
      id: `bench-${n}`,
      title: n % 7 === 0 ? `Bạch Nguyệt Quang ${n}` : `Truyện Benchmark ${n}`,
      author: n % 5 === 0 ? 'Diêu Tam' : `Tác giả ${n % 31}`,
      genre: n % 3 === 0 ? 'Bách Hợp, Trọng Sinh' : 'Fiction',
      description: `Văn án benchmark ${n}`,
      publisher: 'Hanbooks Bench',
      listNames: n % 11 === 0 ? 'Reading Now Favorites' : '',
      status: n % 4 === 0 ? 'reading' : 'unread',
      isFavorite: n % 13 === 0,
    };
  });
}

function searchBooks(books, query) {
  return books.filter(book => {
    const haystack = [
      book.title,
      book.author,
      book.genre,
      book.description,
      book.publisher,
      book.listNames,
    ].join(' ');
    return includesSearchText(haystack, query);
  });
}

const results = [];
for (const size of sizes) {
  const books = makeBooks(size);
  for (const [id, query] of queries) {
    const started = performance.now();
    const matches = searchBooks(books, query);
    results.push({
      size,
      id,
      query,
      matches: matches.length,
      elapsedMs: Number((performance.now() - started).toFixed(3)),
      status: id === 'typo' ? 'expected-no-fuzzy' : 'pass',
    });
  }
}

console.log(JSON.stringify({
  testedAt: new Date().toISOString(),
  results,
}, null, 2));
