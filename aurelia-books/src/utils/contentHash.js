const SMALL_FILE_LIMIT = 64 * 1024 * 1024;
const BLOCK_SIZE = 1024 * 1024;

function toHex(bytes) {
  return [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
}

async function digest(parts) {
  const size = parts.reduce((total, part) => total + part.byteLength, 0);
  const combined = new Uint8Array(size);
  let offset = 0;
  parts.forEach(part => {
    combined.set(new Uint8Array(part), offset);
    offset += part.byteLength;
  });
  return toHex(await crypto.subtle.digest('SHA-256', combined));
}

export async function hashDocumentFile(file) {
  if (file.size <= SMALL_FILE_LIMIT) {
    return { hash: await digest([await file.arrayBuffer()]), strategy: 'sha256-full' };
  }
  const offsets = [
    0,
    Math.max(0, Math.floor(file.size * 0.25) - BLOCK_SIZE / 2),
    Math.max(0, Math.floor(file.size * 0.5) - BLOCK_SIZE / 2),
    Math.max(0, Math.floor(file.size * 0.75) - BLOCK_SIZE / 2),
    Math.max(0, file.size - BLOCK_SIZE),
  ];
  const parts = await Promise.all(offsets.map(offset => file.slice(offset, offset + BLOCK_SIZE).arrayBuffer()));
  parts.push(new TextEncoder().encode(String(file.size)).buffer);
  return { hash: await digest(parts), strategy: 'sha256-blocks' };
}
