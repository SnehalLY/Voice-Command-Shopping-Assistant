# Approach (for submission)

I built a fully working voice-controlled shopping assistant as a React (Vite +
Tailwind) frontend talking to a Node/Express + SQLite backend. The core "voice
→ parse → list" loop was the priority: the browser's native Web Speech API
captures speech and returns text, which the React app sends to
`POST /api/command`; the backend parses intent and entities, executes the
change against SQLite, and returns a confirmation plus the updated list.

For NLP I deliberately chose a **rule-based** approach (keyword dictionaries +
regex) over an LLM. The command space is small and bounded (add, remove,
search, set-quantity), so deterministic parsing is free, instant, testable, and
explainable — exactly what an 8-hour assessment needs, with no API keys or
tokens. Multilingual support is data-driven: each language supplies its own
intent verbs, connectors, and number words (English, Spanish, Hindi), while
product names stay language-agnostic.

Smart suggestions are also rule-based over static JSON datasets: frequently/stale
items and pairings from a `history` table, plus seasonal and substitute maps.
The data layer is isolated behind a small repository API so the store can be
swapped without touching business logic. I validated the build with a Vite
production build and a `node:test` suite (intent parsing, quantity parsing, and
a full API integration test) — all passing. The UI ships loading, empty, and
error states (including mic-permission handling) and is mobile-responsive.
