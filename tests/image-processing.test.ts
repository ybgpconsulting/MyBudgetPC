import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import { detectImageFormat } from '../src/utils/imageFormat';
import { normalizeImageToWebp } from '../server/imageProcessing';

test('image uploads are identified from file contents, not their MIME metadata', async () => {
  const png = await sharp({
    create: { width: 2, height: 2, channels: 3, background: '#2563eb' },
  }).png().toBuffer();

  assert.deepEqual(detectImageFormat(png), { mimeType: 'image/png', extension: 'png' });
  const webp = await normalizeImageToWebp(png);
  assert.deepEqual(detectImageFormat(webp), { mimeType: 'image/webp', extension: 'webp' });

  const metadata = await sharp(webp).metadata();
  assert.equal(metadata.format, 'webp');
});

test('image uploads reject HTML and malformed data even with an image signature prefix', async () => {
  const html = Buffer.from('<!doctype html><script>alert(1)</script>');
  const malformedJpeg = Buffer.from([0xff, 0xd8, 0xff, ...Buffer.from('<html>')]);

  assert.equal(detectImageFormat(html), null);
  await assert.rejects(normalizeImageToWebp(html));
  assert.deepEqual(detectImageFormat(malformedJpeg), { mimeType: 'image/jpeg', extension: 'jpg' });
  await assert.rejects(normalizeImageToWebp(malformedJpeg));
});
