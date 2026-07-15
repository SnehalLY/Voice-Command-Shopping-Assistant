import { addItem, clearAll } from '../db.js';
import db from '../db.js';
import { categorizeItem } from '../services/categorization.js';

// Optional: seed a few items + history so suggestions have something to work with.
const sampleItems = [
  { name: 'milk', quantity: 2, unit: 'liter', brand: 'Maple Hills' },
  { name: 'bread', quantity: 1, brand: 'Artisan Oven' },
  { name: 'bananas', quantity: 6 },
  { name: 'coffee', quantity: 1, brand: 'Starbucks' },
  { name: 'eggs', quantity: 12, brand: 'Pasture Joy' },
  { name: 'toothpaste', quantity: 1, brand: 'Colgate' },
  { name: 'cheese', quantity: 1, brand: 'Kraft' },
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
    brand: it.brand || null,
    maxPrice: null,
  });
}

const now = Date.now();
const DAY_MS = 86400000;
const staleThreshold = Number(process.env.STALE_DAYS ?? 30);
const insertHistory = db.prepare('INSERT INTO history (name, category, created_at) VALUES (?, ?, ?)');
for (let i = 0; i < historyItems.length; i++) {
  const name = historyItems[i];
  const daysAgo = staleThreshold + i + 1;
  const ts = new Date(now - daysAgo * DAY_MS).toISOString();
  insertHistory.run(name, categorizeItem(name), ts);
}

console.log(`Seeded ${sampleItems.length} current items and ${historyItems.length} history events (${staleThreshold}+ days ago for stale demo).`);
