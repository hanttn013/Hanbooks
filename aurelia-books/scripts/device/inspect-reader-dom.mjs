import { connectCDP } from './device-helper.mjs';

const cdp = await connectCDP();
const readerDom = await cdp.evalJs(`
  (() => {
    const root = document.querySelector('main, #root, [class*="reader"], [class*="Reader"]');
    return {
      outerHTML: root ? root.outerHTML.slice(0, 800) : 'No root',
      classes: Array.from(document.querySelectorAll('*')).map(el => el.className).filter(Boolean).slice(0, 20)
    };
  })()
`);
console.log('Reader DOM info:', readerDom);
cdp.close();
