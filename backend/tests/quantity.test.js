import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuantity } from '../src/services/quantity.js';

test('quantity: digit only', () => {
  assert.deepEqual(parseQuantity('5 oranges'), { quantity: 5, unit: null });
});

test('quantity: digit + unit', () => {
  assert.deepEqual(parseQuantity('2 bottles of water'), { quantity: 2, unit: 'bottle' });
});

test('quantity: word number', () => {
  assert.deepEqual(parseQuantity('three apples'), { quantity: 3, unit: null });
});

test('quantity: spanish word number', () => {
  assert.deepEqual(parseQuantity('dos botellas de agua'), { quantity: 2, unit: 'bottle' });
});

test('quantity: no quantity defaults to 1', () => {
  assert.deepEqual(parseQuantity('milk'), { quantity: 1, unit: null });
});

test('quantity: invalid quantity sanitized to 1', () => {
  assert.deepEqual(parseQuantity('zero apples'), { quantity: 1, unit: null });
});
