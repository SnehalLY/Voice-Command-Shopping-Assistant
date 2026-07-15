import intentsData from '../data/intents.json' with { type: 'json' };
import { parseQuantity, NUMBER_WORDS } from './quantity.js';
import { categorizeItem } from './categorization.js';

/**
 * Rule-based intent + entity parser.
 *
 * WHY RULE-BASED (not an LLM):
 *   - Deterministic: same input -> same output, easy to test and explain.
 *   - Free & fast: no API calls, no tokens, sub-millisecond, runs on the server.
 *   - Bounded domain: the command set (add/remove/search/set-quantity/ask) is small,
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

const INTENT_PRIORITY = ['search', 'clear', 'remove', 'setQuantity', 'ask', 'add'];

// Intent detection log for debugging accuracy issues.
const intentLog = [];

export function getIntentLog() {
  return intentLog.slice(-50);
}

export function clearIntentLog() {
  intentLog.length = 0;
}

// Generic filler tokens that are never part of an item name (any language).
const GENERIC_STOP = new Set([
  'of', 'my', 'the', 'list', 'from', 'to', 'on', 'in', 'for', 'please',
  'i', 'me', 'some', 'a', 'an', 'with', 'and', 'also', 'want', 'need', 'buy',
  'any', 'is', 'are', 'there',
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

function normalizeForMatch(text) {
  return text.toLowerCase().replace(/[^\w\s\u00c0-\u024f\u0900-\u097f]/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectIntent(text, lang) {
  const lower = normalizeForMatch(text);
  let best = null;
  let bestScore = 0;

  for (const intent of INTENT_PRIORITY) {
    const verbs = INTENTS[intent][lang] || [];
    let score = 0;
    for (const v of verbs) {
      const vNorm = normalizeForMatch(v);
      if (lower.includes(vNorm)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }

  let confidence;
  if (best && bestScore > 0) {
    confidence = Math.min(0.95, 0.6 + bestScore * 0.15);
  } else {
    const stop = buildStopSet(lang);
    const remainingTokens = tokenize(text).filter((t) => !stop.has(t));
    if (remainingTokens.length <= 2) {
      confidence = 0.5;
    } else {
      confidence = 0.15;
    }
  }

  const finalIntent = best || 'add';
  const entry = {
    timestamp: new Date().toISOString(),
    raw: text,
    lang,
    intent: finalIntent,
    confidence,
    matched: !!best,
    bestScore,
  };
  intentLog.push(entry);
  if (intentLog.length > 200) intentLog.splice(0, intentLog.length - 200);

  if (!best || bestScore === 0) {
    const stop = buildStopSet(lang);
    const remainingTokens = tokenize(text).filter((t) => !stop.has(t));
    if (remainingTokens.length > 2) {
      return { intent: 'unknown', matched: false, confidence, needsClarification: true };
    }
    return { intent: 'add', matched: false, confidence };
  }
  return { intent: best, matched: true, confidence };
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

function extractMinPrice(text, lang) {
  const triggers = (PRICE_TRIGGERS[lang] || []).concat(PRICE_TRIGGERS.en || []);
  const floorWords = ['over', 'above', 'more than'];
  for (const t of triggers) {
    const re = new RegExp(`(?:${floorWords.map(escapeRegex).join('|')})\\s+${escapeRegex(t)}\\s*\\$?\\s*(\\d+(?:\\.\\d+)?)`, 'i');
    const m = text.match(re);
    if (m) return parseFloat(m[1]);
  }
  for (const fw of floorWords) {
    const re = new RegExp(`${escapeRegex(fw)}\\s+\\$?\\s*(\\d+(?:\\.\\d+)?)`, 'i');
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

  const { intent, confidence, needsClarification } = detectIntent(text, lang);
  const quantityInfo = parseQuantity(text);
  const brand = extractBrand(text, lang);
  const itemName = extractItemName(text, lang, brand);
  const maxPrice = extractPrice(text, lang);
  const minPrice = extractMinPrice(text, lang);

  const entities = {
    itemName: itemName || null,
    quantity: quantityInfo.quantity,
    unit: quantityInfo.unit,
    brand: brand || null,
    maxPrice: maxPrice != null ? maxPrice : null,
    minPrice: minPrice != null ? minPrice : null,
  };

  const category = entities.itemName ? categorizeItem(entities.itemName) : null;

  return {
    intent,
    entities,
    category,
    confidence,
    raw: text,
    needsClarification: needsClarification || false,
  };
}

export { INTENT_PRIORITY };
