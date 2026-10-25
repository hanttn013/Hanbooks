// scripts/device/probe.mjs
import { connectCDP } from './device-helper.mjs';

try {
  const cdp = await connectCDP();
  console.log('Connected to CDP successfully!');
  const title = await cdp.evalJs('document.title');
  const url = await cdp.evalJs('window.location.href');
  console.log(`Page Title: "${title}", URL: "${url}"`);
  cdp.screenshot('qa/reader/before-device/00-current-screen.png');
  cdp.close();
} catch (err) {
  console.error('Probe failed:', err);
}
