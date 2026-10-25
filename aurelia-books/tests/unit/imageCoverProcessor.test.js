import { describe, it, expect } from 'vitest';
import { validateImageBytes } from '../../src/utils/imageCoverProcessor';

describe('imageCoverProcessor - validateImageBytes', () => {
  it('accepts valid JPEG magic bytes', async () => {
    const bytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00]);
    const blob = new Blob([bytes], { type: 'image/jpeg' });
    const result = await validateImageBytes(blob);
    expect(result.format).toBe('jpeg');
  });

  it('accepts valid PNG magic bytes', async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00]);
    const blob = new Blob([bytes], { type: 'image/png' });
    const result = await validateImageBytes(blob);
    expect(result.format).toBe('png');
  });

  it('accepts valid WebP magic bytes', async () => {
    // 'RIFF' + 4 length bytes + 'WEBP'
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46,
      0x20, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50,
      0x56, 0x50, 0x38, 0x20,
    ]);
    const blob = new Blob([bytes], { type: 'image/webp' });
    const result = await validateImageBytes(blob);
    expect(result.format).toBe('webp');
  });

  it('strictly rejects SVG files masquerading as images', async () => {
    const svgContent = '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>';
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    await expect(validateImageBytes(blob)).rejects.toThrow(/SVG images are not supported/i);
  });

  it('strictly rejects SVG content starting with <svg', async () => {
    const svgContent = '<svg width="100" height="100"></svg>';
    const blob = new Blob([svgContent], { type: 'image/jpeg' });
    await expect(validateImageBytes(blob)).rejects.toThrow(/SVG images are not supported/i);
  });

  it('rejects files larger than 20MB', async () => {
    const fakeLargeBlob = {
      size: 21 * 1024 * 1024,
      slice: () => new Blob([]),
    };
    await expect(validateImageBytes(fakeLargeBlob)).rejects.toThrow(/exceeds 20MB/i);
  });

  it('rejects non-image binaries like PDF', async () => {
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x35]); // %PDF-1.5
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    await expect(validateImageBytes(blob)).rejects.toThrow(/Unsupported image format/i);
  });
});
