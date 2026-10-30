import assert from 'node:assert/strict';
import test from 'node:test';
import { buildStorePath, categoryFromSlug, parseStoreRoute, slugifyCategory } from '../src/utils/storeRoutes';

test('store navigation uses distinct canonical paths for its main pages', () => {
  assert.equal(buildStorePath('home'), '/');
  assert.equal(buildStorePath('stock'), '/shop');
  assert.equal(buildStorePath('stock', undefined, 'Laptops'), '/shop/laptops');
  assert.equal(buildStorePath('stock', undefined, 'Desktop Computers'), '/shop/desktop-computers');
  assert.equal(buildStorePath('checkout'), '/enquiry');
  assert.equal(buildStorePath('login'), '/login');
  assert.equal(buildStorePath('detail', 'product 123'), '/product/product%20123');
});

test('store routes restore catalogue category and product detail from their URL', () => {
  assert.deepEqual(parseStoreRoute('/shop'), { view: 'stock' });
  assert.deepEqual(parseStoreRoute('/accessories'), { view: 'stock', categorySlug: 'accessories' });
  assert.deepEqual(parseStoreRoute('/shop/custom-pc-builds'), {
    view: 'stock',
    categorySlug: 'custom-pc-builds',
  });
  assert.deepEqual(parseStoreRoute('/catalog/graphics-cards?sort=price-asc'), {
    view: 'stock',
    categorySlug: 'graphics-cards',
  });
  assert.deepEqual(parseStoreRoute('/product/product%20123'), {
    view: 'detail',
    productId: 'product 123',
  });
  assert.deepEqual(parseStoreRoute('/enquiry'), { view: 'checkout' });
  assert.deepEqual(parseStoreRoute('/login'), { view: 'login' });
});

test('category URL slugs are normalized and readable', () => {
  assert.equal(slugifyCategory('Custom PC Builds'), 'custom-pc-builds');
  assert.equal(slugifyCategory('Power & Cooling'), 'power-and-cooling');
  assert.equal(categoryFromSlug('graphics-cards'), 'Graphics Cards');
  assert.equal(categoryFromSlug('ram'), 'RAM');
});
