import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveImageUrl } from '../src/api/client';

test('relative server-upload images resolve against the configured API origin', () => {
  assert.equal(
    resolveImageUrl('/uploads/product.webp', 'https://api.example.test/'),
    'https://api.example.test/uploads/product.webp',
  );
  assert.equal(
    resolveImageUrl('/api/uploads/file/product.webp', 'https://api.example.test'),
    'https://api.example.test/api/uploads/file/product.webp',
  );
});

test('storefront assets and absolute image URLs keep their original origins', () => {
  assert.equal(resolveImageUrl('/demo-products/laptop.svg', 'https://api.example.test'), '/demo-products/laptop.svg');
  assert.equal(resolveImageUrl('https://images.example.test/product.webp', 'https://api.example.test'), 'https://images.example.test/product.webp');
  assert.equal(resolveImageUrl('/uploads/product.webp', ''), '/uploads/product.webp');
});
