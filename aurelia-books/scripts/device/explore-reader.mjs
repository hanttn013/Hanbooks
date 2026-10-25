// scripts/device/explore-reader.mjs
import { connectCDP } from './device-helper.mjs';

const cdp = await connectCDP();

console.log('Navigating to Reader or finding books...');
// Check what books are in IndexedDB or visible on screen
const info = await cdp.evalJs(`
  (() => {
    return {
      hash: window.location.hash,
      buttons: Array.from(document.querySelectorAll('button, [role="button"], a')).map(el => ({
        tag: el.tagName,
        text: el.innerText?.trim()?.slice(0, 30),
        aria: el.getAttribute('aria-label'),
        rect: el.getBoundingClientRect()
      })).filter(b => b.text || b.aria)
    };
  })()
`);

console.log('Current Screen Info:', JSON.stringify(info, null, 2));

cdp.close();
