import { Router } from 'express';
import { resolveImageUrl } from '../services/image.js';
import { asyncHandler, badRequest } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/image?q=milk -> { ok, url }  (url may be null -> use icon fallback)
// Proxies Pexels server-side so the API key never reaches the frontend.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = req.query.q;
    if (!q || typeof q !== 'string') {
      throw badRequest('query param q is required.', 'missing_q');
    }
    const url = await resolveImageUrl(q);
    res.json({ ok: true, url });
  })
);

export default router;
