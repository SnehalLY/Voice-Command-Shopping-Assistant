# Voice Command Shopping Assistant

A voice-controlled shopping list app with smart suggestions. Speak commands in
multiple languages to add, remove, search, and update items; the app
categorizes items, parses quantities/units, and recommends seasonal items,
substitutes, and pairings — all without any paid APIs.

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Voice:** Web Speech API (`SpeechRecognition`) — browser-native, multilingual
- **Backend:** Node.js + Express (REST API)
- **Database:** SQLite via `better-sqlite3` (file-based, zero-config)
- **NLP:** Rule-based intent + entity extraction (regex/keyword dictionaries)
- **Suggestions:** Static JSON datasets (categories, seasonal, substitutes, pairings)

## Project Structure

```
voice-shopping-assistant/
├── backend/                 # Express API + SQLite + NLP/suggestion logic
│   ├── src/
│   │   ├── server.js        # Express app + routes wiring
│   │   ├── db.js            # SQLite schema + items/history repository
│   │   ├── routes/          # items, command, suggestions routers
│   │   ├── services/        # intent, quantity, categorization, recommendations
│   │   ├── data/            # static JSON datasets (categories, seasonal, ...)
│   │   ├── middleware/      # async error handler + validation helpers
│   │   └── scripts/seed.js  # optional demo data seeder
│   └── tests/               # node:test unit + API integration tests
└── frontend/                # React SPA
    └── src/
        ├── api/client.js            # fetch wrapper
        ├── hooks/useSpeechRecognition.js  # Web Speech API wrapper
        ├── lib/languages.js         # multilingual config
        └── components/              # VoiceBar, ShoppingList, SuggestionsPanel, ...
```

## Prerequisites

- Node.js >= 18 (tested on v22)
- A Chromium-based browser (Chrome/Edge) for full Web Speech API support.
  Firefox/Safari have limited or no `SpeechRecognition`; the app falls back to
  the manual text input in that case.

## Run Locally

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # optional; defaults work out of the box
npm run seed              # (optional) seed demo items + history
npm run dev              # http://localhost:4000
```

### 2. Frontend (separate terminal)

```bash
cd frontend
npm install
cp .env.example .env     # leave VITE_API_BASE empty to use Vite's dev proxy
npm run dev              # http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:4000`, so no CORS
setup is needed in development.

### 3. Try it

Click the mic (or type) and say things like:

- `add milk`
- `I need 3 apples`
- `add 2 bottles of water`
- `remove bread`
- `search cheese`
- `set bananas to 5`
- `buy organic eggs brand nestle under 5 dollars` (brand + price filter)

Switch language with the toggle (English / Español / हिन्दी).

## Tests

```bash
cd backend
npm test        # node:test — intent parsing, quantity parsing, API integration
```

## Deployment

### Backend (Render / Railway free tier)

- Set **Root Directory** to `backend`, build `npm install`, start `npm start`.
- Set env `ALLOWED_ORIGIN` to your frontend URL and `PORT` (4000).
- A `render.yaml` and `Procfile` are included.

### Frontend (Vercel / Netlify)

- Build command `npm run build`, output `dist` (auto-detected as Vite).
- Set `VITE_API_BASE` to your deployed backend URL **before building** so the
  client knows where to send requests.
- A `vercel.json` is included; for Netlify add a `netlify.toml`
  (`command = "npm run build"`, `publish = "dist"`).

> Note: SQLite on Render's free tier uses an ephemeral filesystem — data
> resets on redeploy. For durable storage, mount a disk or switch `DB_PATH` to
> a hosted database. The data layer (`db.js`) is isolated behind a small
> repository API, so swapping the store is localized.

## Architecture Overview

```
Browser (Web Speech API)
   │  transcript (text + lang)
   ▼
React app  ──POST /api/command──▶  Express
                                      │
                                      ▼
                              parseCommand()  ── rule-based NLP
                                      │  intent + entities
                                      ▼
                              executeCommand() ── CRUD on SQLite
                                      │  + recommendations()
                                      ▼
                              JSON { message, list, ... } ──▶ UI updates
```

The "voice → parse → list" loop lives entirely in `services/command.js`, so
there is a single source of truth for how an utterance becomes a list change.

## Key Design Decisions

- **Rule-based NLP, not an LLM.** The command set is small and bounded
  (add/remove/search/set-quantity), so keyword + regex parsing is deterministic,
  free, fast, and explainable — ideal for an assessment and easy to test.
- **Single command endpoint.** `POST /api/command` parses *and* executes, so
  the frontend sends one request and gets back the confirmation + updated list.
- **Data-driven suggestions.** All suggestion logic reads static JSON datasets
  plus a lightweight `history` table — no external APIs, no network latency.
- **Isolated data layer.** Swapping SQLite for another store only touches `db.js`.

## Known Limitations

- **Browser support:** Web Speech API is best in Chrome/Edge. Other browsers
  fall back to typing. Hindi (`hi-IN`) rule parsing is basic — Devanagari
  keyword coverage is limited; English/Spanish are well covered.
- **Ephemeral DB on some free hosts** (see Deployment note).
- **No auth/multi-user.** Single shared list; fine for a demo.
- **Simple fuzzy matching.** Item name extraction is token-based; heavily
  misspelled speech may need the manual text fallback.
- **Seasonal data** is Northern-Hemisphere-centric and illustrative.
