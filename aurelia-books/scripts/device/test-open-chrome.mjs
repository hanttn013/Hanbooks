import { connectCDP } from './device-helper.mjs';

const cdp = await connectCDP();
console.log('Tapping ☰ button...');
await cdp.tapSelector('button', '☰');
await new Promise(r => setTimeout(r, 800));

const res = await cdp.evalJs(`
  (() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    return btns.map(b => ({
      text: b.innerText,
      aria: b.getAttribute('aria-label')
    })).filter(b => b.text || b.aria);
  })()
`);
console.log('Buttons visible now with Chrome:', JSON.stringify(res, null, 2));

cdp.screenshot('qa/reader/before-device/02-reader-chrome-progress-bar.png');

cdp.close();
