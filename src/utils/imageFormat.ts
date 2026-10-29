export interface SupportedImageFormat {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
  extension: 'jpg' | 'png' | 'webp' | 'gif';
}

const IMAGE_SIGNATURES: Array<{ format: SupportedImageFormat; matches: (bytes: Uint8Array) => boolean }> = [
  {
    format: { mimeType: 'image/jpeg', extension: 'jpg' },
    matches: (bytes) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  {
    format: { mimeType: 'image/png', extension: 'png' },
    matches: (bytes) => bytes.length >= 8
      && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
      && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a,
  },
  {
    format: { mimeType: 'image/webp', extension: 'webp' },
    matches: (bytes) => bytes.length >= 12
      && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
      && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50,
  },
  {
    format: { mimeType: 'image/gif', extension: 'gif' },
    matches: (bytes) => bytes.length >= 6
      && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46
      && bytes[3] === 0x38 && (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61,
  },
];

export function detectImageFormat(bytes: Uint8Array): SupportedImageFormat | null {
  return IMAGE_SIGNATURES.find(({ matches }) => matches(bytes))?.format || null;
}
