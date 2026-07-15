# Voice Command Shopping Assistant

A voice-controlled shopping list app with smart suggestions. Speak commands in
English, Spanish, or Hindi to add, remove, search, and update items; the app
categorizes items, parses quantities/units, filters search by brand/price, and
recommends seasonal items, substitutes, and reorder ("running low") alerts —
all without any paid APIs or LLMs.

Built for the Voice Command Shopping Assistant technical assessment, scoped to
fit the 8-hour time budget while covering every listed requirement.

## Requirements coverage

| Assignment requirement | Status | Where it lives |
|---|---|---|
| Voice command recognition | ✅ | `frontend/src/hooks/useSpeechRecognition.js` (Web Speech API) |
| NLP for varied phrasing ("add milk" vs "I need apples") | ✅ | `backend/src/services/intent.js` (keyword + regex classification) |
| Multilingual support | ✅ | English + Spanish full coverage; Hindi basic coverage — `backend/src/services/intent.js`, `frontend/src/lib/languages.js` |
| Add / remove / modify items by voice | ✅ | `POST /api/command` → `backend/src/routes/command.js` |
| Quantity parsing ("2 bottles of water") | ✅ | `backend/src/services/quantity.js` |
| Automatic categorization (dairy, produce, etc.) | ✅ | `backend/src/services/categorization.js` |
| Product recommendations from history ("running low") | ✅ | `backend/src/services/recommendations.js` — interval-based, needs ≥3 historical adds |
| Frequently-bought recommendations | ✅ | Same file, frequency-based, tracked separately from "running low" |
| Seasonal recommendations | ✅ | `backend/src/data/seasonal.json` |
| Substitutes | ✅ | `backend/src/data/substitutes.json` |
| Voice-activated item search | ✅ | `search` intent → SQLite query |
| Price range / brand filtering ("under $5") | ✅ | `backend/src/services/filters.js` |
| Real-time visual feedback | ✅ | List/toast/status updates on every command; applied search filters echoed back in the API response |
| Minimalist, mobile-friendly UI | ✅ | Single-column responsive layout, large thumb-reachable mic button |
| Error handling | ✅ | Mic permission denied, unsupported browser, no speech detected, API/network errors, no-match search results all handled with clear user-facing messages |
| Loading states | ✅ | Listening state, "processing" state while awaiting `/api/command`, loading state for suggestions/catalog fetch |
| Documentation of approach | ✅ | See "Approach" section below (≤200 words) |
| Hosting | ⏳ Pending | Deployment is the next step after this development pass — see Known Limitations |

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Voice:** Web Speech API (`SpeechRecognition`) — browser-native, no API key
- **Backend:** Node.js + Express (REST API)
- **Database:** SQLite via `better-sqlite3` (file-based, zero-config)
- **NLP:** Rule-based intent + entity extraction (regex/keyword dictionaries) — deliberately no LLM, so the app has zero external dependency and zero latency/cost per command
- **Suggestions:** Static JSON datasets + interval-based running-low detection derived from real usage history

## Why this approach

The assignment gave full technical freedom and an 8-hour budget. Rather than
reaching for a paid NLP/LLM API to "sound smarter," this project uses a
rule-based pipeline that is fast, free, fully offline-capable, deterministic
(easy to test and debug), and transparent about what it can and can't parse —
all real trade-offs a production team would weigh under the same constraints.
The suggestion engine is grounded in actual stored history rather than mock
data, so "running low" and "frequently bought" reflect genuine usage patterns
instead of hardcoded examples.

## Project Structure

```
voice-shopping-assistant/
├── backend/                 # Express API + SQLite + NLP/suggestion logic
│   ├── src/
│   │   ├── server.js        # Express app + routes wiring
│   │   ├── db.js            # SQLite schema + items/history repository
│   │   ├── routes/          # items, command, suggestions routers
│   │   ├── services/        # intent, quantity, categorization, recommendations, filters
│   │   ├── data/             # static JSON datasets (categories, seasonal, ...)
│   │   ├── middleware/      # async error handler + validation helpers
│   │   └── scripts/seed.js  # optional demo data seeder
│   └── tests/               # node:test unit + API integration tests
└── frontend/                # React SPA
    └── src/
        ├── api/client.js                    # fetch wrapper
        ├── hooks/useSpeechRecognition.js    # Web Speech API wrapper
        ├── lib/languages.js                 # multilingual config
        └── components/                      # VoiceBar, ShoppingList, SuggestionsPanel, ...
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
npm run dev                # http://localhost:4000
```

### 2. Frontend (separate terminal)

```bash
cd frontend
npm install
cp .env.example .env     # leave VITE_API_BASE empty to use Vite's dev proxy
npm run dev               # http://localhost:5173
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
- `find organic apples`
- `find toothpaste under $5`
- `find milk over $2`
- `find Colgate toothpaste`

Switch language with the toggle (English / Español / हिन्दी).

## Tests

```bash
cd backend
npm test        # node:test — intent parsing, quantity parsing, API integration
```

## Approach (assignment write-up, ≤200 words)

Voice capture uses the browser-native Web Speech API with language-specific
intent dictionaries for English, Spanish, and Hindi — no paid API or LLM. The
frontend sends transcripts to `POST /api/command`, where a rule-based NLP
pipeline (keyword + regex) classifies intent (add/remove/search/setQuantity/
clear/ask) and extracts entities: item name, quantity, unit, brand, and price
filters. Matched changes execute against SQLite, which stores items plus an
append-only `history` log. That history powers two distinct recommendation
types: frequency-based "frequently bought" and interval-based "running low"
(computed from the average gap between past purchases of an item, so it only
fires once there's enough real history to support it). Seasonal picks and
substitutes come from static JSON datasets. Voice search supports brand and
price-ceiling/floor filters, echoing the applied filters back so the UI can
confirm what was understood. Every action produces immediate visual feedback
(list update, toast, status text) and the UI handles denied mic permission,
unsupported browsers, and network errors gracefully. This design favors
speed, determinism, and zero external cost over LLM-based flexibility.