import { connectCDP } from './device-helper.mjs';

const cdp = await connectCDP();
const res = await cdp.evalJs(`
  (() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.map(b => ({
      text: b.innerText,
      aria: b.getAttribute('aria-label'),
      rect: b.getBoundingClientRect()
    }));
  })()
`);
console.log('All buttons:', JSON.stringify(res.filter(b => b.text || b.aria), null, 2));
const dpr = await cdp.evalJs('window.devicePixelRatio');
console.log('window.innerWidth / Height:', await cdp.evalJs('({ w: window.innerWidth, h: window.innerHeight })'));
console.log('DPR:', dpr);
cdp.close();
