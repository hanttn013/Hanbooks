import { extractDocumentsFromArchive, groupArchiveFiles } from './archiveImport';

export function extractArchiveInWorker(file) {
  if (typeof Worker === 'undefined') return extractDocumentsFromArchive(file);
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/archive.worker.js', import.meta.url), { type: 'module' });
    const timer = window.setTimeout(() => { worker.terminate(); reject(new Error('Archive extraction timed out.')); }, 120000);
    const finish = () => { window.clearTimeout(timer); worker.terminate(); };
    worker.onmessage = event => {
      finish();
      if (!event.data.ok) return reject(new Error(event.data.message));
      const files = event.data.files.map(({ file, archivePath }) => {
        Object.defineProperty(file, 'archivePath', { value: archivePath });
        return file;
      });
      resolve({ ...event.data.result, files, groups: groupArchiveFiles(files, file.name) });
    };
    worker.onerror = event => { finish(); reject(new Error(event.message || 'Archive worker failed.')); };
    try { worker.postMessage({ file }); } catch (error) { finish(); reject(error); }
  });
}
