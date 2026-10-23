import { hashDocumentFile } from '../utils/contentHash';
import { detectDocumentFormat } from '../utils/formatDetector';

self.onmessage = async event => {
  const { id, file } = event.data || {};
  try {
    const [detection, hash] = await Promise.all([
      detectDocumentFormat(file),
      hashDocumentFile(file),
    ]);
    self.postMessage({ id, ok: true, detection, ...hash });
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: { message: error?.message || 'Could not inspect this file.', code: error?.code || 'IMPORT_ANALYSIS_FAILED' },
    });
  }
};
