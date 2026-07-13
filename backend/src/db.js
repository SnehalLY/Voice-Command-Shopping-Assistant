import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// SQLite file lives in a local data dir (git-ignored). Swapping to a hosted
// DB later only requires changing this connection string / client.
const DATA_DIR = join(__dirname, '..', 'data-store');
mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = process.env.DB_PATH || join(DATA_DIR, 'shopping.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Other',
    quantity REAL NOT NULL DEFAULT 1,
    unit TEXT,
    brand TEXT,
    max_price REAL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- Append-only log of every add event. Drives "frequently bought" and
  -- "haven't bought in N days" recommendations without storing raw history UI.
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
  CREATE INDEX IF NOT EXISTS idx_history_name ON history(name);
`);

const NOW = () => new Date().toISOString();

/* ----------------------------- Items CRUD ----------------------------- */

export function listItems() {
  return db
    .prepare('SELECT * FROM items ORDER BY category, name')
    .all();
}

export function findItemByName(name) {
  return db
    .prepare('SELECT * FROM items WHERE LOWER(name) = LOWER(?) LIMIT 1')
    .get(name);
}

export function addItem({ name, category, quantity, unit, brand, maxPrice }) {
  const now = NOW();
  const info = db
    .prepare(
      `INSERT INTO items (name, category, quantity, unit, brand, max_price, created_at, updated_at)
       VALUES (@name, @category, @quantity, @unit, @brand, @maxPrice, @now, @now)`
    )
    .run({ name, category, quantity, unit, brand, maxPrice, now });

  // Log the add to history for recommendation logic.
  db.prepare(
    'INSERT INTO history (name, category, created_at) VALUES (?, ?, ?)'
  ).run(name, category, now);

  return getItemById(info.lastInsertRowid);
}

export function updateItem(id, fields) {
  const existing = getItemById(id);
  if (!existing) return null;
  const merged = {
    name: fields.name ?? existing.name,
    category: fields.category ?? existing.category,
    quantity: fields.quantity ?? existing.quantity,
    unit: fields.unit !== undefined ? fields.unit : existing.unit,
    brand: fields.brand !== undefined ? fields.brand : existing.brand,
    maxPrice: fields.maxPrice !== undefined ? fields.maxPrice : existing.maxPrice,
  };
  db.prepare(
    `UPDATE items SET name=@name, category=@category, quantity=@quantity,
       unit=@unit, brand=@brand, max_price=@maxPrice, updated_at=@now
     WHERE id=@id`
  ).run({ ...merged, id, now: NOW() });
  return getItemById(id);
}

export function removeItem(id) {
  const existing = getItemById(id);
  if (!existing) return null;
  db.prepare('DELETE FROM items WHERE id=?').run(id);
  return existing;
}

export function clearItems() {
  db.prepare('DELETE FROM items').run();
}

function getItemById(id) {
  return db.prepare('SELECT * FROM items WHERE id=?').get(id);
}

/* ----------------------------- History ----------------------------- */

export function getHistory() {
  return db.prepare('SELECT * FROM history ORDER BY created_at DESC').all();
}

export function clearAll() {
  db.prepare('DELETE FROM items').run();
  db.prepare('DELETE FROM history').run();
}

export default db;
