import { Capacitor } from '@capacitor/core';

const EXTENSION_BY_MIME = Object.freeze({
  'application/pdf': 'pdf',
  'application/epub+zip': 'epub',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/zip': 'zip',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/html': 'html',
});

function ensureExtension(name, mimeType) {
  const clean = name || 'shared-document';
  if (/\.[a-z0-9]+$/i.test(clean)) return clean;
  const extension = EXTENSION_BY_MIME[mimeType] || 'bin';
  return `${clean}.${extension}`;
}

export async function initializeNativeShareTarget(onFiles) {
  if (!Capacitor.isNativePlatform()) return () => {};
  const { CapacitorShareTarget } = await import('@capgo/capacitor-share-target');
  const handle = await CapacitorShareTarget.addListener('shareReceived', async event => {
    const files = [];
    for (const shared of event.files || []) {
      const response = await fetch(Capacitor.convertFileSrc(shared.uri));
      if (!response.ok) throw new Error(`Could not read shared file: ${shared.name}`);
      const blob = await response.blob();
      files.push(new File([blob], ensureExtension(shared.name, shared.mimeType), { type: shared.mimeType || blob.type }));
    }
    if (!files.length && event.texts?.length) {
      files.push(new File([event.texts.join('\n\n')], 'shared-text.txt', { type: 'text/plain' }));
    }
    if (files.length) await onFiles(files);
  });
  return () => handle.remove();
}
