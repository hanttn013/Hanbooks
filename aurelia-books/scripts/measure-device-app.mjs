

async function main() {
  const listRes = await fetch('http://127.0.0.1:9223/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.type === 'page');
  if (!page) throw new Error('No page found');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(res => ws.addEventListener('open', res, { once: true }));

  let id = 1;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === msgId) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  console.log('--- MEASURING DEVICE STATE ---');

  const insets = await evaluate(`(() => {
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:0;left:0;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);';
    document.body.appendChild(div);
    const cs = window.getComputedStyle(div);
    const top = cs.paddingTop;
    const bottom = cs.paddingBottom;
    document.body.removeChild(div);
    return { top, bottom };
  })()`);
  console.log('Device safe-area insets:', insets);

  const mainContainerPadding = await evaluate(`(() => {
    const mc = document.querySelector('[class*="mainContainer"]');
    return mc ? window.getComputedStyle(mc).paddingTop : 'not found';
  })()`);
  console.log('AppShell mainContainer paddingTop:', mainContainerPadding);

  // Measure all 4 tabs
  const tabIds = ['home', 'library', 'lists', 'settings'];
  const tabMeasurements = [];

  for (const tid of tabIds) {
    // Switch to tab
    await evaluate(`(() => {
      const btn = Array.from(document.querySelectorAll('button[data-tab="${tid}"]')).find(b => b.offsetWidth > 0 && b.offsetHeight > 0);
      if (btn) btn.click();
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const m = await evaluate(`(() => {
      const h1 = document.querySelector('header h1, [class*="pageTitle"]');
      if (!h1) return { error: 'h1 not found' };
      const rect = h1.getBoundingClientRect();
      const cs = window.getComputedStyle(h1);
      const bodyCs = window.getComputedStyle(document.body);
      return {
        text: h1.innerText.trim(),
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        bodyBg: bodyCs.backgroundColor,
      };
    })()`);
    tabMeasurements.push({ tab: tid, ...m });
  }
  console.log('Tab measurements:', JSON.stringify(tabMeasurements, null, 2));

  // In Settings: measure backup buttons
  const settingsButtons = await evaluate(`(() => {
    const grid = document.querySelector('[class*="backupGrid"]');
    if (!grid) return { error: 'backupGrid not found' };
    const gridRect = grid.getBoundingClientRect();
    const btns = Array.from(grid.querySelectorAll('button')).map(b => {
      const r = b.getBoundingClientRect();
      return {
        text: b.innerText.trim(),
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
        height: Math.round(r.height),
      };
    });
    const reset = document.querySelector('button[class*="btn-destructive-outline"]');
    const delAll = document.querySelector('button[class*="btn-destructive"]:not([class*="btn-destructive-outline"])');
    return {
      gridWidth: Math.round(gridRect.width),
      btns,
      hasResetOutline: !!reset,
      hasDelAllDestructive: !!delAll,
    };
  })()`);
  console.log('Settings buttons measurement:', JSON.stringify(settingsButtons, null, 2));

  // In Library: measure Book Detail bottom action
  await evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('button[data-tab="library"]')).find(b => b.offsetWidth > 0 && b.offsetHeight > 0);
    if (btn) btn.click();
  })()`);
  await new Promise(r => setTimeout(r, 600));

  await evaluate(`(() => {
    const infoBtn = document.querySelector('button[aria-label^="Book info"]');
    if (infoBtn) infoBtn.click();
  })()`);
  await new Promise(r => setTimeout(r, 600));

  const bookDetailBottom = await evaluate(`(() => {
    const bar = document.querySelector('[class*="bottomActionWrapper"]');
    if (!bar) return { error: 'bottomActionWrapper not found' };
    const cs = window.getComputedStyle(bar);
    const rect = bar.getBoundingClientRect();
    return {
      bg: cs.backgroundColor,
      paddingBottom: cs.paddingBottom,
      top: Math.round(rect.top),
      bottom: Math.round(rect.bottom),
      height: Math.round(rect.height),
    };
  })()`);
  console.log('Book Detail bottom action measurement:', JSON.stringify(bookDetailBottom, null, 2));

  // Close Book Detail modal
  await evaluate(`(() => {
    const backBtn = document.querySelector('[class*="backBtn"], button[aria-label="Close"]');
    if (backBtn) backBtn.click();
  })()`);

  ws.close();
}

main().catch(err => {
  console.error('Measurement error:', err);
  process.exit(1);
});
