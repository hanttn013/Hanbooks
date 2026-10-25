// src/utils/imageCoverProcessor.js

const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB
const TARGET_SIZE = 384; // 384x384 square cover for crisp 2x/3x display

/**
 * Validates image magic bytes to strictly allow JPEG, PNG, and WebP,
 * while rejecting SVGs, XML, HTML, and executables.
 */
export async function validateImageBytes(fileOrBlob) {
  if (!fileOrBlob) throw new Error('No file provided');
  if (fileOrBlob.size > MAX_IMAGE_BYTES) {
    throw new Error('Image size exceeds 20MB limit');
  }

  const headerBuffer = await fileOrBlob.slice(0, 16).arrayBuffer();
  const bytes = new Uint8Array(headerBuffer);

  // JPEG: FF D8 FF
  const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4E &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0D &&
    bytes[5] === 0x0A &&
    bytes[6] === 0x1A &&
    bytes[7] === 0x0A;

  // WebP: 'RIFF' .... 'WEBP'
  const isRiff =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46;
  const isWebp =
    isRiff &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;

  // SVG / XML detection: check text signature
  const textSample = new TextDecoder().decode(bytes).toLowerCase();
  const isSvg = textSample.includes('<svg') || textSample.includes('<?xml');

  if (isSvg || fileOrBlob.type === 'image/svg+xml') {
    throw new Error('SVG images are not supported for covers');
  }

  if (!isJpeg && !isPng && !isWebp) {
    throw new Error('Unsupported image format. Please select JPEG, PNG, or WebP.');
  }

  return { format: isJpeg ? 'jpeg' : isPng ? 'png' : 'webp' };
}

/**
 * Resizes and center-crops an image file into a compact WebP 384x384 dataURL.
 * Uses createImageBitmap pre-decode downsampling where supported to avoid OOM on >= 12MP photos.
 */
export async function processListCoverImage(file) {
  // 1. Validate magic bytes & security
  await validateImageBytes(file);

  // 2. Decode & resize bitmap
  let sourceWidth = 0;
  let sourceHeight = 0;
  let drawableSource = null;

  try {
    if (typeof createImageBitmap === 'function') {
      try {
        // First try downsampling directly via createImageBitmap options
        drawableSource = await createImageBitmap(file, {
          resizeWidth: TARGET_SIZE * 2, // 768px max intermediate to maintain sharpness
          resizeQuality: 'high',
        });
        sourceWidth = drawableSource.width;
        sourceHeight = drawableSource.height;
      } catch {
        // Fallback to basic createImageBitmap without resize options
        drawableSource = await createImageBitmap(file);
        sourceWidth = drawableSource.width;
        sourceHeight = drawableSource.height;
      }
    }
  } catch (err) {
    console.warn('createImageBitmap failed, falling back to HTMLImageElement:', err);
  }

  if (!drawableSource) {
    // Fallback using Image element + ObjectURL
    drawableSource = await new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not load image'));
      };
      img.src = url;
    });
    sourceWidth = drawableSource.naturalWidth || drawableSource.width;
    sourceHeight = drawableSource.naturalHeight || drawableSource.height;
  }

  // 3. Center-crop to 1:1 square
  const canvas = document.createElement('canvas');
  canvas.width = TARGET_SIZE;
  canvas.height = TARGET_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Compute square center crop coordinates
  const side = Math.min(sourceWidth, sourceHeight);
  const sx = Math.floor((sourceWidth - side) / 2);
  const sy = Math.floor((sourceHeight - side) / 2);

  ctx.drawImage(
    drawableSource,
    sx,
    sy,
    side,
    side,
    0,
    0,
    TARGET_SIZE,
    TARGET_SIZE
  );

  // Close ImageBitmap if applicable
  if (typeof drawableSource.close === 'function') {
    drawableSource.close();
  }

  // 4. Export as WebP dataURL (compact ~20-40KB)
  let dataUrl = canvas.toDataURL('image/webp', 0.85);
  // Fallback to jpeg if browser doesn't support webp export
  if (!dataUrl.startsWith('data:image/webp')) {
    dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  }

  return {
    success: true,
    dataUrl,
    width: TARGET_SIZE,
    height: TARGET_SIZE,
  };
}
