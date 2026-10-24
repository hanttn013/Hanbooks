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
  const parts = [];
  for (let offset = 0; offset < file.size; offset += BLOCK_SIZE) {
    const block = await file.slice(offset, offset + BLOCK_SIZE).arrayBuffer();
    parts.push(new Uint8Array(await crypto.subtle.digest('SHA-256', block)).buffer);
  }
  parts.push(new TextEncoder().encode(String(file.size)).buffer);
  return { hash: await digest(parts), strategy: 'sha256-all-blocks-v1' };
}
