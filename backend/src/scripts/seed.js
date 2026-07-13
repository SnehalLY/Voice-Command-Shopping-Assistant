import { addItem, clearAll } from '../db.js';
import { categorizeItem } from '../services/categorization.js';

// Optional: seed a few items + history so suggestions have something to work with.
const sampleItems = [
  { name: 'milk', quantity: 2, unit: 'liter' },
  { name: 'bread', quantity: 1 },
  { name: 'bananas', quantity: 6 },
  { name: 'coffee', quantity: 1 },
  { name: 'eggs', quantity: 12 },
];

const historyItems = [
  'milk', 'bread', 'bananas', 'coffee', 'eggs', 'milk', 'bread',
  'apples', 'cheese', 'rice', 'chicken', 'tomatoes', 'onions',
];

clearAll();
for (const it of sampleItems) {
  addItem({
    name: it.name,
    category: categorizeItem(it.name),
    quantity: it.quantity,
    unit: it.unit || null,
    brand: null,
    maxPrice: null,
  });
}
for (const h of historyItems) {
  addItem({ name: h, category: categorizeItem(h), quantity: 1, unit: null, brand: null, maxPrice: null });
}

console.log(`Seeded ${sampleItems.length} current items and ${historyItems.length} history events.`);
