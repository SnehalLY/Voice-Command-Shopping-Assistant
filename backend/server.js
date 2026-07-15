// Convenience entry point so `node server.js` works from the backend root.
// The real application lives in ./src/server.js (this just imports the app
// and starts listening). `npm start` / `npm run dev` call ./src/server.js
// directly; the guard there skips listening when imported, so this is safe.
import app from './src/server.js';

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Voice Shopping Assistant API listening on http://localhost:${PORT}`);
});
