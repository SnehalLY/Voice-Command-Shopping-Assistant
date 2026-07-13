import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCommand } from '../src/services/intent.js';

test('intent: add with simple noun', () => {
  const r = parseCommand('add milk', 'en');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'milk');
  assert.equal(r.category, 'Dairy');
});

test('intent: natural phrasing "I need 3 apples"', () => {
  const r = parseCommand('I need 3 apples', 'en');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'apples');
  assert.equal(r.entities.quantity, 3);
  assert.equal(r.category, 'Produce');
});

test('intent: quantity + unit "2 bottles of water"', () => {
  const r = parseCommand('I want to buy 2 bottles of water', 'en');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'water');
  assert.equal(r.entities.quantity, 2);
  assert.equal(r.entities.unit, 'bottle');
});

test('intent: remove', () => {
  const r = parseCommand('remove milk from my list', 'en');
  assert.equal(r.intent, 'remove');
  assert.equal(r.entities.itemName, 'milk');
});

test('intent: search with item', () => {
  const r = parseCommand('search for cheese', 'en');
  assert.equal(r.intent, 'search');
  assert.equal(r.entities.itemName, 'cheese');
});

test('intent: set quantity', () => {
  const r = parseCommand('set bananas to 5', 'en');
  assert.equal(r.intent, 'setQuantity');
  assert.equal(r.entities.itemName, 'bananas');
  assert.equal(r.entities.quantity, 5);
});

test('intent: Spanish add "quiero comprar dos botellas de agua"', () => {
  const r = parseCommand('quiero comprar dos botellas de agua', 'es');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'agua');
  assert.equal(r.entities.quantity, 2);
  assert.equal(r.entities.unit, 'bottle');
});

test('intent: brand + price filter extraction', () => {
  const r = parseCommand('buy organic eggs brand nestle under 5 dollars', 'en');
  assert.equal(r.entities.itemName, 'organic eggs');
  assert.equal(r.entities.brand, 'nestle');
  assert.equal(r.entities.maxPrice, 5);
});

test('intent: empty input is flagged', () => {
  const r = parseCommand('   ', 'en');
  assert.equal(r.intent, 'unknown');
  assert.equal(r.error, 'empty_input');
});

test('categorization: substring bug (watermelon != water)', () => {
  const r = parseCommand('add watermelon', 'en');
  assert.equal(r.category, 'Produce');
});
