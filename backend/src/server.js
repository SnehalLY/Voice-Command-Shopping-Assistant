import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pathToFileURL } from 'url';
import itemsRouter from './routes/items.js';
import commandRouter from './routes/command.js';
import suggestionsRouter from './routes/suggestions.js';
import imageRouter from './routes/image.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 4000;

// CORS is open in dev; lock down via ALLOWED_ORIGIN in production.
const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(
  cors({
    origin: allowedOrigin ? allowedOrigin.split(',') : true,
  })
);
app.use(express.json());

// Health check (useful for uptime pings on Render/Railway).
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'voice-shopping-assistant', time: new Date().toISOString() });
});

app.use('/api/items', itemsRouter);
app.use('/api/command', commandRouter);
app.use('/api/suggestions', suggestionsRouter);
app.use('/api/image', imageRouter);

// 404 for unknown routes.
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'not_found', message: 'Route not found.' });
});

app.use(errorHandler);

// Only auto-start when run directly (node src/server.js), not when imported
// by the test suite. Tests spin up their own listener on an ephemeral port.
const isMainModule =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  app.listen(PORT, () => {
    console.log(`Voice Shopping Assistant API listening on http://localhost:${PORT}`);
  });
}

export default app;
