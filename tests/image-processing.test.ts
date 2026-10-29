import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import { detectImageFormat } from '../src/utils/imageFormat';
import { getMaxImageUploadSize, MAX_IMAGE_FILE_SIZE, normalizeImageToWebp } from '../server/imageProcessing';

test('image uploads are identified from file bytes, not submitted MIME metadata', async () => {
  const png = await sharp({
    create: { width: 2, height: 2, channels: 3, background: '#2563eb' },
  }).png().toBuffer();

  const uploadedFile = { mimetype: 'text/html', buffer: png };
  assert.deepEqual(detectImageFormat(png), { mimeType: 'image/png', extension: 'png' });
  const webp = await normalizeImageToWebp(uploadedFile.buffer);
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
  assert.equal(detectImageFormat(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), null);
});

test('image processing enforces a hard maximum and caps configured upload limits', async () => {
  assert.equal(getMaxImageUploadSize(), MAX_IMAGE_FILE_SIZE);
  assert.equal(getMaxImageUploadSize(String(MAX_IMAGE_FILE_SIZE + 1)), MAX_IMAGE_FILE_SIZE);
  assert.equal(getMaxImageUploadSize('1024'), 1024);
  assert.throws(() => getMaxImageUploadSize('0'), /positive integer/);
  await assert.rejects(
    normalizeImageToWebp(Buffer.alloc(MAX_IMAGE_FILE_SIZE + 1)),
    /maximum supported file size/,
  );
});
