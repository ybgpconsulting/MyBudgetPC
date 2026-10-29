import assert from 'node:assert/strict';
import test from 'node:test';
import { readBulkStockRows } from '../src/utils/bulkStockImport';

test('CSV bulk import reads quoted fields and preserves the template headers', async () => {
  const file = new File([
    'Category,Brand,Model,Price\nComponents,Example,"Board, revision 2",12500\n',
  ], 'inventory.csv', { type: 'text/csv' });

  assert.deepEqual(await readBulkStockRows(file), [{
    Category: 'Components',
    Brand: 'Example',
    Model: 'Board, revision 2',
    Price: '12500',
  }]);
});

test('bulk import rejects unsupported, oversized, and duplicate-header files', async () => {
  await assert.rejects(readBulkStockRows(new File(['data'], 'inventory.xls')), /\.xlsx or \.csv/);
  await assert.rejects(readBulkStockRows(new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'inventory.csv')), /10MB/);

  const duplicateHeaders = new File(['Brand,Brand\nExample,Other\n'], 'inventory.csv');
  await assert.rejects(readBulkStockRows(duplicateHeaders), /duplicate column headers/);
  await assert.rejects(readBulkStockRows(new File(['not a workbook'], 'inventory.xlsx')));
});
