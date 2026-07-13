import { Router } from 'express';
import {
  listItems,
  addItem,
  updateItem,
  removeItem,
  clearItems,
} from '../db.js';
import { categorizeItem } from '../services/categorization.js';
import { asyncHandler, badRequest } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/items - full shopping list
router.get(
  '/',
  asyncHandler((req, res) => {
    res.json({ ok: true, items: listItems() });
  })
);

// POST /api/items - add a single item (UI fallback when not using voice)
router.post(
  '/',
  asyncHandler((req, res) => {
    const { name, quantity, unit, brand, maxPrice } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw badRequest('Item name is required.', 'missing_name');
    }
    const item = addItem({
      name: name.trim(),
      category: categorizeItem(name),
      quantity: Number.isFinite(quantity) ? quantity : 1,
      unit: unit || null,
      brand: brand || null,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : null,
    });
    res.status(201).json({ ok: true, item });
  })
);

// PUT /api/items/:id - update fields (quantity, unit, brand, etc.)
router.put(
  '/:id',
  asyncHandler((req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw badRequest('Invalid item id.', 'invalid_id');
    const updated = updateItem(id, req.body || {});
    if (!updated) throw badRequest('Item not found.', 'not_found');
    res.json({ ok: true, item: updated });
  })
);

// DELETE /api/items/:id - remove one item
router.delete(
  '/:id',
  asyncHandler((req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw badRequest('Invalid item id.', 'invalid_id');
    const removed = removeItem(id);
    if (!removed) throw badRequest('Item not found.', 'not_found');
    res.json({ ok: true, removed });
  })
);

// DELETE /api/items - clear the whole list
router.delete(
  '/',
  asyncHandler((req, res) => {
    clearItems();
    res.json({ ok: true, message: 'List cleared.' });
  })
);

export default router;
