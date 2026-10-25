import net from 'node:net';

const ip = '192.168.1.16';
const start = 30000;
const end = 49999;
const concurrency = 200;

async function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    socket.setTimeout(80);
    socket.on('connect', () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(port);
      }
    });
    socket.on('error', () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(null);
      }
    });
    socket.on('timeout', () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(null);
      }
    });
    socket.connect(port, ip);
  });
}

async function run() {
  console.log(`Scanning ${ip} from ${start} to ${end}...`);
  const openPorts = [];
  for (let p = start; p <= end; p += concurrency) {
    const batch = [];
    for (let i = p; i < p + concurrency && i <= end; i++) {
      batch.push(checkPort(i));
    }
    const results = await Promise.all(batch);
    for (const res of results) {
      if (res) {
        console.log(`Found open port: ${res}`);
        openPorts.push(res);
      }
    }
  }
  console.log('Done scanning. Open ports:', openPorts);
}

run();
