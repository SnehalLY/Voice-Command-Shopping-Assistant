import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCommand } from '../src/services/intent.js';
import { categorizeItem } from '../src/services/categorization.js';

// ── English Add ──────────────────────────────────────────────────────────────
test('intent: EN add - simple noun "add milk"', () => {
  const r = parseCommand('add milk', 'en');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'milk');
  assert.equal(r.category, 'Dairy');
});

test('intent: EN add - natural "I need 3 apples"', () => {
  const r = parseCommand('I need 3 apples', 'en');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'apples');
  assert.equal(r.entities.quantity, 3);
  assert.equal(r.category, 'Produce');
});

test('intent: EN add - "I want to buy bananas"', () => {
  const r = parseCommand('I want to buy bananas', 'en');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'bananas');
  assert.equal(r.category, 'Produce');
});

test('intent: EN add - "I\'d like some bread"', () => {
  const r = parseCommand("I'd like some bread", 'en');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'bread');
  assert.equal(r.category, 'Bakery');
});

test('intent: EN add - "please add eggs to my list"', () => {
  const r = parseCommand('please add eggs to my list', 'en');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'eggs');
  assert.equal(r.category, 'Dairy');
});

test('intent: EN add - "put milk on my list"', () => {
  const r = parseCommand('put milk on my list', 'en');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'milk');
});

test('intent: EN add - "get me 2 bottles of water"', () => {
  const r = parseCommand('get me 2 bottles of water', 'en');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'water');
  assert.equal(r.entities.quantity, 2);
  assert.equal(r.entities.unit, 'bottle');
});

test('intent: EN add - "can you add cheese"', () => {
  const r = parseCommand('can you add cheese', 'en');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'cheese');
});

test('intent: EN add - "let\'s add tomatoes"', () => {
  const r = parseCommand("let's add tomatoes", 'en');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'tomatoes');
});

test('intent: EN add - "grab me a loaf of bread"', () => {
  const r = parseCommand('grab me a loaf of bread', 'en');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'bread');
  assert.equal(r.entities.quantity, 1);
  assert.equal(r.entities.unit, 'loaf');
});

// ── English Remove ───────────────────────────────────────────────────────────
test('intent: EN remove - "remove milk from my list"', () => {
  const r = parseCommand('remove milk from my list', 'en');
  assert.equal(r.intent, 'remove');
  assert.equal(r.entities.itemName, 'milk');
});

test('intent: EN remove - "delete bread"', () => {
  const r = parseCommand('delete bread', 'en');
  assert.equal(r.intent, 'remove');
  assert.equal(r.entities.itemName, 'bread');
});

test('intent: EN remove - "I don\'t need eggs"', () => {
  const r = parseCommand("I don't need eggs", 'en');
  assert.equal(r.intent, 'remove');
  assert.equal(r.entities.itemName, 'eggs');
});

test('intent: EN remove - "take out the apples"', () => {
  const r = parseCommand('take out the apples', 'en');
  assert.equal(r.intent, 'remove');
  assert.equal(r.entities.itemName, 'apples');
});

test('intent: EN remove - "get rid of bananas"', () => {
  const r = parseCommand('get rid of bananas', 'en');
  assert.equal(r.intent, 'remove');
  assert.equal(r.entities.itemName, 'bananas');
});

test('intent: EN remove - "cross off cheese"', () => {
  const r = parseCommand('cross off cheese', 'en');
  assert.equal(r.intent, 'remove');
  assert.equal(r.entities.itemName, 'cheese');
});

// ── English Search ───────────────────────────────────────────────────────────
test('intent: EN search - "search for cheese"', () => {
  const r = parseCommand('search for cheese', 'en');
  assert.equal(r.intent, 'search');
  assert.equal(r.entities.itemName, 'cheese');
});

test('intent: EN search - "find me apples"', () => {
  const r = parseCommand('find me apples', 'en');
  assert.equal(r.intent, 'search');
  assert.equal(r.entities.itemName, 'apples');
});

test('intent: EN search - "where is the milk"', () => {
  const r = parseCommand('where is the milk', 'en');
  assert.equal(r.intent, 'search');
  assert.equal(r.entities.itemName, 'milk');
});

test('intent: EN search - "do I have bread"', () => {
  const r = parseCommand('do I have bread', 'en');
  assert.equal(r.intent, 'search');
  assert.equal(r.entities.itemName, 'bread');
});

test('intent: EN search - "look up eggs in my list"', () => {
  const r = parseCommand('look up eggs in my list', 'en');
  assert.equal(r.intent, 'search');
  assert.equal(r.entities.itemName, 'eggs');
});

test('intent: EN search - "is there any coffee"', () => {
  const r = parseCommand('is there any coffee', 'en');
  assert.equal(r.intent, 'search');
  assert.equal(r.entities.itemName, 'coffee');
});

// ── English Set Quantity ─────────────────────────────────────────────────────
test('intent: EN setQuantity - "set bananas to 5"', () => {
  const r = parseCommand('set bananas to 5', 'en');
  assert.equal(r.intent, 'setQuantity');
  assert.equal(r.entities.itemName, 'bananas');
  assert.equal(r.entities.quantity, 5);
});

test('intent: EN setQuantity - "change the quantity of apples to 3"', () => {
  const r = parseCommand('change the quantity of apples to 3', 'en');
  assert.equal(r.intent, 'setQuantity');
  assert.equal(r.entities.itemName, 'apples');
  assert.equal(r.entities.quantity, 3);
});

test('intent: EN setQuantity - "make it 2 bottles"', () => {
  const r = parseCommand('make it 2 bottles', 'en');
  assert.equal(r.intent, 'setQuantity');
  assert.equal(r.entities.quantity, 2);
  assert.equal(r.entities.unit, 'bottle');
});

test('intent: EN setQuantity - "bump milk to 4"', () => {
  const r = parseCommand('bump milk to 4', 'en');
  assert.equal(r.intent, 'setQuantity');
  assert.equal(r.entities.itemName, 'milk');
  assert.equal(r.entities.quantity, 4);
});

test('intent: EN setQuantity - "update quantity of bread to 2"', () => {
  const r = parseCommand('update quantity of bread to 2', 'en');
  assert.equal(r.intent, 'setQuantity');
  assert.equal(r.entities.itemName, 'bread');
  assert.equal(r.entities.quantity, 2);
});

// ── English Clear ────────────────────────────────────────────────────────────
test('intent: EN clear - "clear my list"', () => {
  const r = parseCommand('clear my list', 'en');
  assert.equal(r.intent, 'clear');
});

test('intent: EN clear - "empty the list"', () => {
  const r = parseCommand('empty the list', 'en');
  assert.equal(r.intent, 'clear');
});

test('intent: EN clear - "start over"', () => {
  const r = parseCommand('start over', 'en');
  assert.equal(r.intent, 'clear');
});

test('intent: EN clear - "wipe everything"', () => {
  const r = parseCommand('wipe everything', 'en');
  assert.equal(r.intent, 'clear');
});

test('intent: EN clear - "clear everything"', () => {
  const r = parseCommand('clear everything', 'en');
  assert.equal(r.intent, 'clear');
});

// ── Spanish Add ──────────────────────────────────────────────────────────────
test('intent: ES add - "quiero comprar dos botellas de agua"', () => {
  const r = parseCommand('quiero comprar dos botellas de agua', 'es');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'agua');
  assert.equal(r.entities.quantity, 2);
  assert.equal(r.entities.unit, 'bottle');
});

test('intent: ES add - "me gustaría leche"', () => {
  const r = parseCommand('me gustaría leche', 'es');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'leche');
});

test('intent: ES add - "por favor agrega pan"', () => {
  const r = parseCommand('por favor agrega pan', 'es');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'pan');
});

test('intent: ES add - "pon manzanas en mi lista"', () => {
  const r = parseCommand('pon manzanas en mi lista', 'es');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'manzanas');
});

test('intent: ES add - "consígueme huevos"', () => {
  const r = parseCommand('consígueme huevos', 'es');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'huevos');
});

test('intent: ES add - "puedes agregar queso"', () => {
  const r = parseCommand('puedes agregar queso', 'es');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'queso');
});

test('intent: ES add - "trae tomates"', () => {
  const r = parseCommand('trae tomates', 'es');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'tomates');
});

test('intent: ES add - "agrega a mi lista pollo"', () => {
  const r = parseCommand('agrega a mi lista pollo', 'es');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'pollo');
});

// ── Spanish Remove ───────────────────────────────────────────────────────────
test('intent: ES remove - "quitar leche de la lista"', () => {
  const r = parseCommand('quitar leche de la lista', 'es');
  assert.equal(r.intent, 'remove');
  assert.equal(r.entities.itemName, 'leche');
});

test('intent: ES remove - "no quiero pan"', () => {
  const r = parseCommand('no quiero pan', 'es');
  assert.equal(r.intent, 'remove');
  assert.equal(r.entities.itemName, 'pan');
});

test('intent: ES remove - "elimina de mi lista los huevos"', () => {
  const r = parseCommand('elimina de mi lista los huevos', 'es');
  assert.equal(r.intent, 'remove');
  assert.equal(r.entities.itemName, 'huevos');
});

test('intent: ES remove - "quita el queso"', () => {
  const r = parseCommand('quita el queso', 'es');
  assert.equal(r.intent, 'remove');
  assert.equal(r.entities.itemName, 'queso');
});

test('intent: ES remove - "borra de la lista los tomates"', () => {
  const r = parseCommand('borra de la lista los tomates', 'es');
  assert.equal(r.intent, 'remove');
  assert.equal(r.entities.itemName, 'tomates');
});

// ── Spanish Search ───────────────────────────────────────────────────────────
test('intent: ES search - "buscar leche"', () => {
  const r = parseCommand('buscar leche', 'es');
  assert.equal(r.intent, 'search');
  assert.equal(r.entities.itemName, 'leche');
});

test('intent: ES search - "busca en mi lista pan"', () => {
  const r = parseCommand('busca en mi lista pan', 'es');
  assert.equal(r.intent, 'search');
  assert.equal(r.entities.itemName, 'pan');
});

test('intent: ES search - "dime si tengo huevos"', () => {
  const r = parseCommand('dime si tengo huevos', 'es');
  assert.equal(r.intent, 'search');
  assert.equal(r.entities.itemName, 'huevos');
});

test('intent: ES search - "muéstrame el queso"', () => {
  const r = parseCommand('muéstrame el queso', 'es');
  assert.equal(r.intent, 'search');
  assert.equal(r.entities.itemName, 'queso');
});

test('intent: ES search - "localiza los tomates"', () => {
  const r = parseCommand('localiza los tomates', 'es');
  assert.equal(r.intent, 'search');
  assert.equal(r.entities.itemName, 'tomates');
});

// ── Spanish Set Quantity ─────────────────────────────────────────────────────
test('intent: ES setQuantity - "cambiar cantidad de manzanas a 5"', () => {
  const r = parseCommand('cambiar cantidad de manzanas a 5', 'es');
  assert.equal(r.intent, 'setQuantity');
  assert.equal(r.entities.itemName, 'manzanas');
  assert.equal(r.entities.quantity, 5);
});

test('intent: ES setQuantity - "haz que sean 3 botellas"', () => {
  const r = parseCommand('haz que sean 3 botellas', 'es');
  assert.equal(r.intent, 'setQuantity');
  assert.equal(r.entities.quantity, 3);
  assert.equal(r.entities.unit, 'bottle');
});

test('intent: ES setQuantity - "pon la cantidad de leche en 2"', () => {
  const r = parseCommand('pon la cantidad de leche en 2', 'es');
  assert.equal(r.intent, 'setQuantity');
  assert.equal(r.entities.itemName, 'leche');
  assert.equal(r.entities.quantity, 2);
});

// ── Spanish Clear ────────────────────────────────────────────────────────────
test('intent: ES clear - "vaciar la lista"', () => {
  const r = parseCommand('vaciar la lista', 'es');
  assert.equal(r.intent, 'clear');
});

test('intent: ES clear - "limpiar todo"', () => {
  const r = parseCommand('limpiar todo', 'es');
  assert.equal(r.intent, 'clear');
});

test('intent: ES clear - "empezar de nuevo"', () => {
  const r = parseCommand('empezar de nuevo', 'es');
  assert.equal(r.intent, 'clear');
});

// ── Hindi Add ────────────────────────────────────────────────────────────────
test('intent: HI add - "दूध जोड़ें"', () => {
  const r = parseCommand('दूध जोड़ें', 'hi');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'दूध');
});

test('intent: HI add - "सेब लाना"', () => {
  const r = parseCommand('सेब लाना', 'hi');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'सेब');
});

test('intent: HI remove - "ब्रेड हटा दो"', () => {
  const r = parseCommand('ब्रेड हटा दो', 'hi');
  assert.equal(r.intent, 'remove');
  assert.equal(r.entities.itemName, 'ब्रेड');
});

test('intent: HI add - "कृपया अंडा जोड़ें"', () => {
  const r = parseCommand('कृपया अंडा जोड़ें', 'hi');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'अंडा');
});

test('intent: HI add - "मेरी सूची में चावल डालो"', () => {
  const r = parseCommand('मेरी सूची में चावल डालो', 'hi');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'चावल');
});

test('intent: HI add - "पनीर चाहिए"', () => {
  const r = parseCommand('पनीर चाहिए', 'hi');
  assert.equal(r.intent, 'add');
  assert.equal(r.entities.itemName, 'पनीर');
});

// ── Hindi Remove ─────────────────────────────────────────────────────────────
test('intent: HI remove - "दूध हटाओ"', () => {
  const r = parseCommand('दूध हटाओ', 'hi');
  assert.equal(r.intent, 'remove');
  assert.equal(r.entities.itemName, 'दूध');
});

test('intent: HI remove - "सेब निकाल दो"', () => {
  const r = parseCommand('सेब निकाल दो', 'hi');
  assert.equal(r.intent, 'remove');
  assert.equal(r.entities.itemName, 'सेब');
});

test('intent: HI remove - "मेरी सूची से ब्रेड हटाओ"', () => {
  const r = parseCommand('मेरी सूची से ब्रेड हटाओ', 'hi');
  assert.equal(r.intent, 'remove');
  assert.equal(r.entities.itemName, 'ब्रेड');
});

// ── Hindi Search ─────────────────────────────────────────────────────────────
test('intent: HI search - "दूध खोज"', () => {
  const r = parseCommand('दूध खोज', 'hi');
  assert.equal(r.intent, 'search');
  assert.equal(r.entities.itemName, 'दूध');
});

test('intent: HI search - "मेरी सूची में सेब ढूंढो"', () => {
  const r = parseCommand('मेरी सूची में सेब ढूंढो', 'hi');
  assert.equal(r.intent, 'search');
  assert.equal(r.entities.itemName, 'सेब');
});

test('intent: HI search - "बताओ क्या पनीर है"', () => {
  const r = parseCommand('बताओ क्या पनीर है', 'hi');
  assert.equal(r.intent, 'search');
  assert.equal(r.entities.itemName, 'पनीर');
});

// ── Hindi Set Quantity ───────────────────────────────────────────────────────
test('intent: HI setQuantity - "सेब की मात्रा 5 करो"', () => {
  const r = parseCommand('सेब की मात्रा 5 करो', 'hi');
  assert.equal(r.intent, 'setQuantity');
  assert.equal(r.entities.itemName, 'सेब');
  assert.equal(r.entities.quantity, 5);
});

test('intent: HI setQuantity - "दूध को 2 लीटर करो"', () => {
  const r = parseCommand('दूध को 2 लीटर करो', 'hi');
  assert.equal(r.intent, 'setQuantity');
  assert.equal(r.entities.itemName, 'दूध');
  assert.equal(r.entities.quantity, 2);
  assert.equal(r.entities.unit, 'liter');
});

// ── Hindi Clear ──────────────────────────────────────────────────────────────
test('intent: HI clear - "मेरी सूची खाली करो"', () => {
  const r = parseCommand('मेरी सूची खाली करो', 'hi');
  assert.equal(r.intent, 'clear');
});

test('intent: HI clear - "साफ करो"', () => {
  const r = parseCommand('साफ करो', 'hi');
  assert.equal(r.intent, 'clear');
});

// ── Brand + Price (English) ──────────────────────────────────────────────────
test('intent: EN brand + price - "buy organic eggs brand nestle under 5 dollars"', () => {
  const r = parseCommand('buy organic eggs brand nestle under 5 dollars', 'en');
  assert.equal(r.entities.itemName, 'organic eggs');
  assert.equal(r.entities.brand, 'nestle');
  assert.equal(r.entities.maxPrice, 5);
});

test('intent: EN brand + price - "get coca cola under 3 dollars"', () => {
  const r = parseCommand('get coca cola under 3 dollars', 'en');
  assert.equal(r.entities.itemName, 'coca cola');
  assert.equal(r.entities.maxPrice, 3);
});

// ── Edge Cases ───────────────────────────────────────────────────────────────
test('intent: empty input is flagged', () => {
  const r = parseCommand('   ', 'en');
  assert.equal(r.intent, 'unknown');
  assert.equal(r.error, 'empty_input');
});

test('categorization: substring bug (watermelon != water)', () => {
  const r = parseCommand('add watermelon', 'en');
  assert.equal(r.category, 'Produce');
});

test('categorization: peanut butter vs butter', () => {
  const pb = categorizeItem('peanut butter');
  const butter = categorizeItem('butter');
  assert.equal(pb, 'Pantry');
  assert.equal(butter, 'Dairy');
});

test('categorization: ice cream vs cream', () => {
  const iceCream = categorizeItem('ice cream');
  const cream = categorizeItem('cream');
  assert.equal(iceCream, 'Frozen');
  assert.equal(cream, 'Dairy');
});

test('categorization: sweet potato vs potato', () => {
  const sp = categorizeItem('sweet potato');
  const potato = categorizeItem('potato');
  assert.equal(sp, 'Produce');
  assert.equal(potato, 'Produce');
});

test('categorization: Hindi "दूध" -> Dairy', () => {
  assert.equal(categorizeItem('दूध'), 'Dairy');
});

test('categorization: Hindi "पनीर" -> Dairy', () => {
  assert.equal(categorizeItem('पनीर'), 'Dairy');
});

test('categorization: Hindi "चावल" -> Pantry', () => {
  assert.equal(categorizeItem('चावल'), 'Pantry');
});

test('categorization: Hindi "सेब" -> Produce', () => {
  assert.equal(categorizeItem('सेब'), 'Produce');
});

test('categorization: Hindi "ब्रेड" -> Bakery', () => {
  assert.equal(categorizeItem('ब्रेड'), 'Bakery');
});

test('categorization: Hindi "चाय" -> Beverages', () => {
  assert.equal(categorizeItem('चाय'), 'Beverages');
});

// ── Ask Intent (conversational queries) ──────────────────────────────────────
test('intent: EN ask - "what are the seasonal fruits"', () => {
  const r = parseCommand('what are the seasonal fruits', 'en');
  assert.equal(r.intent, 'ask');
  assert.ok(r.confidence > 0, 'should have positive confidence');
});

test('intent: EN ask - "what should I buy"', () => {
  const r = parseCommand('what should I buy', 'en');
  assert.equal(r.intent, 'ask');
});

test('intent: EN ask - "any suggestions"', () => {
  const r = parseCommand('any suggestions', 'en');
  assert.equal(r.intent, 'ask');
});

test('intent: EN ask - "what can I use instead of milk"', () => {
  const r = parseCommand('what can I use instead of milk', 'en');
  assert.equal(r.intent, 'ask');
  assert.equal(r.entities.itemName, 'milk');
});

test('intent: EN ask - "substitute for eggs"', () => {
  const r = parseCommand('substitute for eggs', 'en');
  assert.equal(r.intent, 'ask');
  assert.equal(r.entities.itemName, 'eggs');
});

test('intent: EN ask - "what\'s on my list"', () => {
  const r = parseCommand("what's on my list", 'en');
  assert.equal(r.intent, 'ask');
});

test('intent: EN ask - "what do I have"', () => {
  const r = parseCommand('what do I have', 'en');
  assert.equal(r.intent, 'search');
});

test('intent: EN ask - "tell me suggestions"', () => {
  const r = parseCommand('tell me suggestions', 'en');
  assert.equal(r.intent, 'ask');
});

test('intent: ES ask - "qué está de temporada"', () => {
  const r = parseCommand('qué está de temporada', 'es');
  assert.equal(r.intent, 'ask');
});

test('intent: HI ask - "मौसमी क्या है"', () => {
  const r = parseCommand('मौसमी क्या है', 'hi');
  assert.equal(r.intent, 'ask');
});

// ── Needs Clarification (no match, not a simple add) ─────────────────────────
test('intent: ambiguous query triggers needs_clarification', () => {
  const r = parseCommand('hello world test today', 'en');
  assert.equal(r.needsClarification, true);
  assert.notEqual(r.intent, 'add');
});

// ── Intent log exists and is populated ───────────────────────────────────────
test('intent: getIntentLog returns recent entries', async () => {
  const { getIntentLog, clearIntentLog } = await import('../src/services/intent.js');
  clearIntentLog();
  parseCommand('add milk', 'en');
  parseCommand('remove bread', 'en');
  const log = getIntentLog();
  assert.equal(log.length, 2);
  assert.equal(log[0].intent, 'add');
  assert.equal(log[1].intent, 'remove');
});
