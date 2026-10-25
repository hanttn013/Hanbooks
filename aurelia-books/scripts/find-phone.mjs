import net from 'node:net';

const base = '192.168.1.';
const ips = Array.from({ length: 254 }, (_, i) => base + (i + 1));

console.log('Scanning subnet for responsive hosts...');

async function testHost(ip) {
  // Test common ports or try connecting to adb port range
  for (const port of [5555, 38039, 45577, 80, 8080]) {
    try {
      await new Promise((resolve, reject) => {
        const s = new net.Socket();
        s.setTimeout(150);
        s.on('connect', () => {
          s.destroy();
          resolve(port);
        });
        s.on('error', () => { s.destroy(); reject(); });
        s.on('timeout', () => { s.destroy(); reject(); });
        s.connect(port, ip);
      });
      return { ip, port };
    } catch {
      // ignore
    }
  }
  return null;
}

const batchSize = 30;
for (let i = 0; i < ips.length; i += batchSize) {
  const batch = ips.slice(i, i + batchSize);
  const results = await Promise.all(batch.map(testHost));
  for (const r of results) {
    if (r) console.log('Active host:', r.ip, 'port:', r.port);
  }
}

console.log('Subnet scan complete.');
