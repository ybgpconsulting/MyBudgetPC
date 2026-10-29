import sharp from 'sharp';
import { detectImageFormat } from '../src/utils/imageFormat';

export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;

export function getMaxImageUploadSize(configuredValue = process.env.MAX_FILE_SIZE): number {
  if (!configuredValue) return MAX_IMAGE_FILE_SIZE;
  const parsed = Number(configuredValue);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error('MAX_FILE_SIZE must be a positive integer number of bytes.');
  }
  return Math.min(parsed, MAX_IMAGE_FILE_SIZE);
}

export async function normalizeImageToWebp(source: Buffer): Promise<Buffer> {
  if (source.byteLength > MAX_IMAGE_FILE_SIZE) {
    throw new Error('Image exceeds the maximum supported file size.');
  }
  if (!detectImageFormat(source)) {
    throw new Error('Unsupported image file.');
  }
  return sharp(source, { failOn: 'warning', limitInputPixels: 40_000_000 })
    .rotate()
    .webp({ quality: 85 })
    .toBuffer();
}
