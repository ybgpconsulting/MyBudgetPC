import assert from 'node:assert/strict';
import test from 'node:test';
import { DEMO_PRODUCTS, DEMO_PRODUCT_CATEGORIES } from '../src/data/demoProducts';

test('demo catalog includes detailed examples for every storefront category', () => {
  for (const category of DEMO_PRODUCT_CATEGORIES) {
    const products = DEMO_PRODUCTS.filter((product) => product.category === category);
    assert.ok(products.length >= 2, `Expected at least two demo products in ${category}`);

    for (const product of products) {
      assert.ok(product.brand);
      assert.ok(product.model);
      assert.ok(product.storage);
      assert.ok(product.condition);
      assert.ok(product.conditionDescription.includes('sample') || product.conditionDescription.includes('Sample') || product.conditionDescription.includes('illustrative') || product.conditionDescription.includes('Illustrative'));
      assert.ok(product.price > 0);
      assert.ok(product.stockTag?.startsWith('DEMO-'));
      assert.equal(product.status, 'Available');
      assert.ok(product.images.length > 0);
      assert.ok(product.keyFeatures.length >= 3);
      assert.equal(product.inBox.warrantyApplicable, false);
    }
  }
});
