import assert from 'node:assert/strict';
import test from 'node:test';
import { serializeInventoryUnit, serializeProductInspection } from '../server/utils/productResponses';

const inventoryUnit = {
  id: 'unit-id',
  product_id: 'product-id',
  stock_tag: 'internal-tag',
  imei: '123456789012345',
  status: 'available',
  sale_price_inr: 42000,
  inspection: { notes: 'Internal staff notes' },
  created_at: '2026-10-29T00:00:00.000Z',
  updated_at: '2026-10-29T00:00:00.000Z',
};

test('public product responses omit inventory identifiers and inspection data', () => {
  const response = serializeInventoryUnit(inventoryUnit, false);

  assert.deepEqual(response, { status: 'available', salePriceInr: 42000 });
  assert.equal('id' in response, false);
  assert.equal('imei' in response, false);
  assert.equal('inspection' in response, false);
});

test('authenticated staff product responses retain inventory details', () => {
  const response = serializeInventoryUnit(inventoryUnit, true);

  assert.equal(response.id, inventoryUnit.id);
  assert.equal(response.imei, inventoryUnit.imei);
  assert.deepEqual(response.inspection, inventoryUnit.inspection);
});

test('product inspection data is staff-only', () => {
  const inspection = {
    overall_pass: true,
    physical_condition: 'Refurbished, light wear',
    created_at: '2026-10-29T00:00:00.000Z',
  };

  assert.equal(serializeProductInspection(inspection, false), undefined);
  assert.deepEqual(serializeProductInspection(inspection, true), {
    overallPass: true,
    physicalCondition: inspection.physical_condition,
    inspectedAt: inspection.created_at,
  });
});
