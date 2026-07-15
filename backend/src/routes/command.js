import { Router } from 'express';
import { executeCommand } from '../services/command.js';
import { parseCommand as parseOnly } from '../services/intent.js';
import { asyncHandler, badRequest } from '../middleware/errorHandler.js';

const router = Router();

// POST /api/command - parse + execute a spoken/transcribed utterance.
// Body: { text: string, lang?: 'en'|'es'|'hi' }
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { text, lang } = req.body || {};
    const result = await executeCommand(text || '', lang || 'en');
    const status = result.ok ? 200 : 422;
    res.status(status).json(result);
  })
);

// POST /api/parse - parse only (no DB writes); used to show the UI what the
// assistant understood before acting.
router.post(
  '/parse',
  asyncHandler((req, res) => {
    const { text, lang } = req.body || {};
    if (!text || typeof text !== 'string' || !text.trim()) {
      throw badRequest('Text is required.', 'empty_input');
    }
    res.json({ ok: true, parsed: parseOnly(text, lang || 'en') });
  })
);

export default router;
