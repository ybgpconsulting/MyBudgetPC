import assert from 'node:assert/strict';
import test from 'node:test';
import { canTransitionInventoryStatus, assertInventoryTransition } from '../server/domain/inventory';

test('inventory lifecycle permits reservation, release, and sale transitions', () => {
  assert.equal(canTransitionInventoryStatus('available', 'reserved'), true);
  assert.equal(canTransitionInventoryStatus('reserved', 'available'), true);
  assert.equal(canTransitionInventoryStatus('available', 'sold'), true);
  assert.equal(canTransitionInventoryStatus('reserved', 'sold'), true);
});

test('sold and retired inventory can be restored only to available', () => {
  assert.equal(canTransitionInventoryStatus('sold', 'available'), true);
  assert.equal(canTransitionInventoryStatus('sold', 'reserved'), false);
  assert.equal(canTransitionInventoryStatus('retired', 'available'), true);
});

test('transition validator rejects invalid status changes and permits valid ones', () => {
  assert.doesNotThrow(() => assertInventoryTransition('available', 'reserved'));
  assert.doesNotThrow(() => assertInventoryTransition('reserved', 'available'));
  assert.doesNotThrow(() => assertInventoryTransition('available', 'retired'));

  assert.throws(() => assertInventoryTransition('available', 'available'));
  assert.throws(() => assertInventoryTransition('reserved', 'retired'));
  assert.doesNotThrow(() => assertInventoryTransition('sold', 'available'));
});
