import assert from 'node:assert/strict';
import test from 'node:test';
import { createProductSchema } from '../server/schemas';

test('omitted package contents are not reported as included by default', () => {
  const product = createProductSchema.parse({
    brand: 'Example',
    model: 'Unspecified model',
    priceInr: 1000,
  });

  assert.deepEqual(product.inBox, {
    chargerIncluded: false,
    originalBox: false,
    taxInvoiceProvided: false,
    cableIncluded: false,
    warrantyApplicable: false,
  });
});
