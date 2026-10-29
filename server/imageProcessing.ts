import sharp from 'sharp';
import { detectImageFormat } from '../src/utils/imageFormat';

export async function normalizeImageToWebp(source: Buffer): Promise<Buffer> {
  if (!detectImageFormat(source)) {
    throw new Error('Unsupported image file.');
  }
  return sharp(source, { failOn: 'warning', limitInputPixels: 40_000_000 })
    .rotate()
    .webp({ quality: 85 })
    .toBuffer();
}
