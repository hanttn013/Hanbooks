import { extractDocumentsFromArchive } from '../utils/archiveImport';

self.onmessage = async event => {
  try {
    const result = await extractDocumentsFromArchive(event.data.file);
    const files = result.files.map(file => ({ file, archivePath: file.archivePath || file.name }));
    self.postMessage({ ok: true, result: { listName: result.listName, sourceName: result.sourceName }, files });
  } catch (error) {
    self.postMessage({ ok: false, message: error.message || 'Could not extract archive.' });
  }
};
