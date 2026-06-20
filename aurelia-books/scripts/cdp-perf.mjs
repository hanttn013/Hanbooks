const port = process.argv[2] || '9223';
const mode = process.argv[3] || 'read';

async function getTarget() {
  const response = await fetch(`http://127.0.0.1:${port}/json`);
  const pages = await response.json();
  const target = pages.find(page => page.url?.startsWith('https://localhost')) || pages[0];
  if (!target?.webSocketDebuggerUrl) {
    throw new Error('No WebView DevTools target found');
  }
  return target;
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const pending = new Map();
    let id = 0;

    ws.addEventListener('open', () => {
      resolve({
        send(method, params = {}) {
          const callId = ++id;
          ws.send(JSON.stringify({ id: callId, method, params }));
          return new Promise((callResolve, callReject) => {
            pending.set(callId, { resolve: callResolve, reject: callReject });
          });
        },
        close() {
          ws.close();
        },
      });
    });

    ws.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (!message.id || !pending.has(message.id)) return;
      const call = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) call.reject(new Error(message.error.message));
      else call.resolve(message.result);
    });

    ws.addEventListener('error', reject);
  });
}

const startSource = `
(() => {
  window.__hanPerfQa = {
    startedAt: Date.now(),
    longTasks: [],
    layoutShifts: [],
    paints: [],
    marks: [],
  };
  try {
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        window.__hanPerfQa.longTasks.push({
          name: entry.name,
          startTime: Math.round(entry.startTime),
          duration: Math.round(entry.duration),
        });
      }
    }).observe({ entryTypes: ['longtask'] });
  } catch (error) {
    window.__hanPerfQa.longTaskObserverError = String(error);
  }
  try {
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue;
        window.__hanPerfQa.layoutShifts.push({
          value: Number(entry.value.toFixed(4)),
          startTime: Math.round(entry.startTime),
        });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (error) {
    window.__hanPerfQa.layoutShiftObserverError = String(error);
  }
  try {
    window.__hanPerfQa.paints = performance
      .getEntriesByType('paint')
      .map(entry => ({ name: entry.name, startTime: Math.round(entry.startTime) }));
  } catch (error) {
    window.__hanPerfQa.paintError = String(error);
  }
  return window.__hanPerfQa;
})()
`;

const readSource = `
(() => {
  const stats = window.__hanPerfQa || {};
  const longTasks = stats.longTasks || [];
  const layoutShifts = stats.layoutShifts || [];
  const cls = layoutShifts.reduce((sum, entry) => sum + entry.value, 0);
  return {
    startedAt: stats.startedAt || null,
    elapsedMs: stats.startedAt ? Date.now() - stats.startedAt : null,
    longTaskCount: longTasks.length,
    maxLongTaskMs: longTasks.reduce((max, entry) => Math.max(max, entry.duration), 0),
    totalLongTaskMs: longTasks.reduce((sum, entry) => sum + entry.duration, 0),
    layoutShiftCount: layoutShifts.length,
    cls: Number(cls.toFixed(4)),
    paints: stats.paints || [],
    observerErrors: {
      longTask: stats.longTaskObserverError || null,
      layoutShift: stats.layoutShiftObserverError || null,
    },
    recentLongTasks: longTasks.slice(-12),
    recentLayoutShifts: layoutShifts.slice(-12),
  };
})()
`;

const target = await getTarget();
const client = await connect(target.webSocketDebuggerUrl);
try {
  await client.send('Runtime.enable');
  await client.send('Performance.enable');
  const expression = mode === 'start' ? startSource : readSource;
  const runtime = await client.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  const metrics = await client.send('Performance.getMetrics');
  console.log(JSON.stringify({
    target: { title: target.title, url: target.url },
    runtime: runtime.result?.value ?? null,
    metrics: metrics.metrics || [],
  }, null, 2));
} finally {
  client.close();
}
