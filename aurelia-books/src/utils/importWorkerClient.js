import { hashDocumentFile } from './contentHash';
import { detectDocumentFormat } from './formatDetector';

let worker;
let sequence = 0;
const pending = new Map();

function rejectPending(error) {
  pending.forEach(task => {
    window.clearTimeout(task.timeout);
    task.reject(error);
  });
  pending.clear();
}

function getWorker() {
  if (typeof Worker === 'undefined') return null;
  if (!worker) {
    worker = new Worker(new URL('../workers/import.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = event => {
      const task = pending.get(event.data?.id);
      if (!task) return;
      pending.delete(event.data.id);
      window.clearTimeout(task.timeout);
      if (event.data.ok) task.resolve(event.data);
      else task.reject(Object.assign(new Error(event.data.error?.message), { code: event.data.error?.code }));
    };
    worker.onerror = event => {
      rejectPending(new Error(event.message || 'Import worker failed.'));
      worker?.terminate();
      worker = null;
    };
    worker.onmessageerror = () => {
      rejectPending(new Error('Import worker returned an unreadable response.'));
      worker?.terminate();
      worker = null;
    };
  }
  return worker;
}

export async function analyzeImportFile(file) {
  const activeWorker = getWorker();
  if (!activeWorker) {
    const [detection, hash] = await Promise.all([detectDocumentFormat(file), hashDocumentFile(file)]);
    return { detection, ...hash };
  }
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      pending.delete(id);
      reject(new Error('File analysis timed out.'));
    }, 120_000);
    pending.set(id, { resolve, reject, timeout });
    try {
      activeWorker.postMessage({ id, file });
    } catch (error) {
      window.clearTimeout(timeout);
      pending.delete(id);
      reject(error);
    }
  });
}

export function destroyImportWorker() {
  worker?.terminate();
  worker = null;
  rejectPending(new Error('Import worker was stopped.'));
}
