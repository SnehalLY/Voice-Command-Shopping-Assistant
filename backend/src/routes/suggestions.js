import { Router } from 'express';
import { listItems, getHistory } from '../db.js';
import {
  getRunningLow,
  getFrequentItems,
  getSeasonal,
  getSubstitutes,
} from '../services/recommendations.js';
import { categorizeItem } from '../services/categorization.js';
import { asyncHandler, badRequest } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/suggestions - smart suggestions split by type:
//   runningLow: interval-based reorder alerts
//   frequentlyBought: frequency-based recommendations
//   seasonal: in-season items
//   substitutes: alternatives for items on the list
router.get(
  '/',
  asyncHandler((req, res) => {
    const month = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1;
    const items = listItems();
    const history = getHistory();

    const runningLow = getRunningLow(history);
    const frequentNames = getFrequentItems(history);
    const frequentlyBought = frequentNames
      .filter((name) => !items.some((i) => normalize(i.name) === normalize(name)))
      .slice(0, 8)
      .map((name) => ({
        name,
        category: categorizeItem(name),
        reason: 'You add this often',
        source: 'frequent',
      }));

    const seasonal = getSeasonal(month);

    const substitutes = items
      .map((i) => ({ for: i.name, options: getSubstitutes(i.name) }))
      .filter((s) => s.options.length > 0);

    res.json({ ok: true, runningLow, frequentlyBought, seasonal, substitutes });
  })
);

// GET /api/suggestions/substitutes?item=milk
router.get(
  '/substitutes',
  asyncHandler((req, res) => {
    const item = req.query.item;
    if (!item) throw badRequest('item query param is required.', 'missing_item');
    res.json({ ok: true, item, substitutes: getSubstitutes(item) });
  })
);

// GET /api/suggestions/seasonal?month=6
router.get(
  '/seasonal',
  asyncHandler((req, res) => {
    const month = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1;
    if (month < 1 || month > 12) throw badRequest('month must be 1-12.', 'invalid_month');
    res.json({ ok: true, month, seasonal: getSeasonal(month) });
  })
);

function normalize(name) {
  return name.trim().toLowerCase();
}

export default router;
