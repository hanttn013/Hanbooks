// scripts/reproduce-phase-b.mjs
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 412, height: 915 } });

  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleLogs.push(`[PAGE_ERROR] ${err.message}`));

  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  // Let's inspect demo books or books in IndexedDB
  const books = await page.evaluate(async () => {
    // Open IndexedDB
    return new Promise((resolve) => {
      const req = indexedDB.open('ShanBooksDB', 1);
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('books')) return resolve([]);
        const tx = db.transaction('books', 'readonly');
        const store = tx.objectStore('books');
        const getAll = store.getAll();
        getAll.onsuccess = () => resolve(getAll.result);
        getAll.onerror = () => resolve([]);
      };
      req.onerror = () => resolve([]);
    });
  });

  console.log('IndexedDB books count:', books.length);
  if (books.length > 0) {
    console.log('First book:', { id: books[0].id, title: books[0].title, format: books[0].format, status: books[0].status });
  }

  // Set the first book to finished state in DB and localStorage
  const testBookId = books[0]?.id || 'demo-book-1';
  await page.evaluate(async (id) => {
    return new Promise((resolve) => {
      const req = indexedDB.open('ShanBooksDB', 1);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction(['books', 'progress'], 'readwrite');
        const bStore = tx.objectStore('books');
        const pStore = tx.objectStore('progress');

        const bReq = bStore.get(id);
        bReq.onsuccess = () => {
          const b = bReq.result;
          if (b) {
            b.status = 'finished';
            b.progress = 100;
            b.progressPercent = 100;
            bStore.put(b);
          }
        };

        // Put a finished progress record with an end CFI
        pStore.put({
          bookId: id,
          percentage: 100,
          cfi: 'epubcfi(/6/14[chapter-end]!/4/2/100/1:0)',
          locator: 'epub:cfi=epubcfi(/6/14[chapter-end]!/4/2/100/1:0)',
          chapterTitle: 'Final Chapter',
          lastReadAt: Date.now(),
        });

        tx.oncomplete = () => {
          localStorage.setItem(`shanbooks_progress_${id}`, '100');
          resolve(true);
        };
      };
    });
  }, testBookId);

  // Reload page to pick up changes
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Open the book
  console.log('Opening finished book...');
  await page.evaluate((id) => {
    const card = document.querySelector(`[data-book-id="${id}"]`) || document.querySelector('article[role="button"]');
    if (card) card.click();
  }, testBookId);

  await page.waitForTimeout(3000);

  // Take screenshot of what reader or modal shows
  await page.screenshot({ path: 'qa/fix/before/reader-finished-open.png' });

  // Check reader state
  const readerState = await page.evaluate(() => {
    const readerSurface = document.querySelector('[data-reader-surface]');
    const loading = document.querySelector('[class*="loading"]');
    const error = document.querySelector('[class*="error"]');
    const iframes = Array.from(document.querySelectorAll('iframe')).map(f => ({
      src: f.src,
      hasContent: Boolean(f.contentDocument?.body?.innerText?.trim()),
    }));
    return {
      hasReaderSurface: Boolean(readerSurface),
      hasLoading: Boolean(loading),
      hasError: Boolean(error),
      errorText: error?.textContent,
      iframes,
    };
  });

  console.log('Reader state:', JSON.stringify(readerState, null, 2));
  console.log('Console logs sample:', consoleLogs.slice(-10));

  await browser.close();
}

run().catch(console.error);
