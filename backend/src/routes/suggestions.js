import { Router } from 'express';
import { listItems, getHistory } from '../db.js';
import {
  getRecommendations,
  getSeasonal,
  getSubstitutes,
} from '../services/recommendations.js';
import { asyncHandler, badRequest } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/suggestions - combined smart suggestions for the panel:
//   - recommendations (frequent / stale / pairings)
//   - seasonal items for the requested (or current) month
//   - substitutes for items already on the list
router.get(
  '/',
  asyncHandler((req, res) => {
    const month = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1;
    const items = listItems();
    const history = getHistory();

    const recommendations = getRecommendations(items, history);
    const seasonal = getSeasonal(month);

    // Suggest substitutes for items currently on the list.
    const substitutes = items
      .map((i) => ({ for: i.name, options: getSubstitutes(i.name) }))
      .filter((s) => s.options.length > 0);

    res.json({ ok: true, recommendations, seasonal, substitutes });
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

export default router;
