import intentsData from '../data/intents.json' with { type: 'json' };
import { parseQuantity, NUMBER_WORDS } from './quantity.js';
import { categorizeItem } from './categorization.js';

/**
 * Rule-based intent + entity parser.
 *
 * WHY RULE-BASED (not an LLM):
 *   - Deterministic: same input -> same output, easy to test and explain.
 *   - Free & fast: no API calls, no tokens, sub-millisecond, runs on the server.
 *   - Bounded domain: the command set (add/remove/search/set-quantity) is small,
 *     so a keyword + regex approach covers it well without ML overhead.
 *
 * The parser is language-aware: intent verbs, connectors and units are looked
 * up per language code (en, es, hi). Item names themselves are mostly
 * language-agnostic product words, so extraction is script-agnostic.
 */

const INTENTS = intentsData.intents;
const CONNECTORS = intentsData.connectors;
const PRICE_TRIGGERS = intentsData.priceTriggers;
const BRAND_TRIGGERS = intentsData.brandTriggers;
const UNITS = intentsData.units;

const INTENT_PRIORITY = ['search', 'clear', 'remove', 'setQuantity', 'add'];

// Generic filler tokens that are never part of an item name (any language).
const GENERIC_STOP = new Set([
  'of', 'my', 'the', 'list', 'from', 'to', 'on', 'in', 'for', 'please',
  'i', 'me', 'some', 'a', 'an', 'with', 'and', 'also', 'want', 'need', 'buy',
  // currency words left behind after price extraction
  'dollars', 'dollar', 'rupees', 'rupee', 'euros', 'euro', 'pesos', 'peso',
  'rs', 'inr', 'usd', 'cents', 'cent',
]);

function tokenize(text) {
  // Keep letters (incl. accented Latin and Devanagari) and digits; split elsewhere.
  return text
    .toLowerCase()
    .split(/[^a-z0-9\u00c0-\u024f\u0900-\u097f]+/i)
    .filter(Boolean);
}

function buildStopSet(lang) {
  const stop = new Set(GENERIC_STOP);
  const langs = [lang, 'en'].filter(Boolean);
  for (const l of langs) {
    for (const verbs of Object.values(INTENTS)) {
      for (const v of verbs[l] || []) {
        // Only add single-word verbs as stop tokens; multi-word phrases
        // handled separately during phrase stripping.
        if (!v.includes(' ')) stop.add(v);
      }
    }
    for (const c of CONNECTORS[l] || []) if (!c.includes(' ')) stop.add(c);
    for (const t of PRICE_TRIGGERS[l] || []) if (!t.includes(' ')) stop.add(t);
    for (const t of BRAND_TRIGGERS[l] || []) if (!t.includes(' ')) stop.add(t);
  }
  for (const aliases of Object.values(UNITS)) {
    for (const a of aliases) if (!a.includes(' ')) stop.add(a);
  }
  return stop;
}

function detectIntent(text, lang) {
  const lower = text.toLowerCase();
  let best = null;
  let bestScore = 0;

  for (const intent of INTENT_PRIORITY) {
    const verbs = INTENTS[intent][lang] || [];
    let score = 0; // count how many verb phrases match
    for (const v of verbs) {
      if (lower.includes(v)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }

  // Default to "add" when no keyword matched (most utterances are adds).
  if (!best) return { intent: 'add', matched: false, confidence: 0.6 };
  return { intent: best, matched: true, confidence: 0.95 };
}

function extractPrice(text, lang) {
  const triggers = (PRICE_TRIGGERS[lang] || []).concat(PRICE_TRIGGERS.en || []);
  for (const t of triggers) {
    const re = new RegExp(`${escapeRegex(t)}\\s*\\$?\\s*(\\d+(?:\\.\\d+)?)`, 'i');
    const m = text.match(re);
    if (m) return parseFloat(m[1]);
  }
  return null;
}

function extractBrand(text, lang) {
  const triggers = (BRAND_TRIGGERS[lang] || []).concat(BRAND_TRIGGERS.en || []);
  for (const t of triggers) {
    const re = new RegExp(`${escapeRegex(t)}\\s+([a-z0-9\\u00c0-\\u024f\\u0900-\\u097f]+)`, 'i');
    const m = text.match(re);
    if (m) return m[1];
  }
  return null;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractItemName(text, lang, brand) {
  const stop = buildStopSet(lang);
  if (brand) stop.add(brand.toLowerCase());
  const lower = text.toLowerCase();

  // Strip known multi-word intent/connector phrases so they don't leak in.
  const phraseBlacklist = [];
  for (const verbs of Object.values(INTENTS)) {
    for (const v of (verbs[lang] || []).concat(verbs.en || [])) {
      if (v.includes(' ')) phraseBlacklist.push(v);
    }
  }
  for (const c of (CONNECTORS[lang] || []).concat(CONNECTORS.en || [])) {
    if (c.includes(' ')) phraseBlacklist.push(c);
  }
  let cleaned = lower;
  for (const p of phraseBlacklist) {
    cleaned = cleaned.replace(new RegExp(escapeRegex(p), 'g'), ' ');
  }

  const tokens = tokenize(cleaned).filter((tok) => {
    if (stop.has(tok)) return false;
    if (NUMBER_WORDS.has(tok)) return false; // "two", "dos", etc. are quantities
    if (/^\d+$/.test(tok)) return false; // numbers are quantities, not names
    return true;
  });

  return tokens.join(' ').trim();
}

/**
 * Parses a raw utterance into a structured command.
 * @param {string} text - the recognized/transcribed text
 * @param {string} lang - language code (en, es, hi)
 * @returns {{intent, entities, category, confidence, raw}}
 */
export function parseCommand(text, lang = 'en') {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return {
      intent: 'unknown',
      entities: {},
      category: null,
      confidence: 0,
      raw: text || '',
      error: 'empty_input',
    };
  }

  const { intent, confidence } = detectIntent(text, lang);
  const quantityInfo = parseQuantity(text);
  const brand = extractBrand(text, lang);
  const itemName = extractItemName(text, lang, brand);
  const maxPrice = extractPrice(text, lang);

  const entities = {
    itemName: itemName || null,
    quantity: quantityInfo.quantity,
    unit: quantityInfo.unit,
    brand: brand || null,
    maxPrice: maxPrice != null ? maxPrice : null,
  };

  const category = entities.itemName ? categorizeItem(entities.itemName) : null;

  return {
    intent,
    entities,
    category,
    confidence,
    raw: text,
  };
}

export { INTENT_PRIORITY };
