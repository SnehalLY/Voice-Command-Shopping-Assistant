import seasonalData from '../data/seasonal.json' with { type: 'json' };
import substitutesData from '../data/substitutes.json' with { type: 'json' };
import pairingsData from '../data/pairings.json' with { type: 'json' };
import { categorizeItem } from './categorization.js';

/**
 * Rule-based suggestion engine. All logic is data-driven from the static
 * JSON datasets (seasonal.json, substitutes.json, pairings.json) plus the
 * local history table. No external APIs. Three sources of suggestions:
 *   1. Frequently / recently added items the user hasn't put on the list yet.
 *   2. Common pairings derived from what's already on the list.
 *   3. Seasonal items for the current month.
 */

const STALE_DAYS = 30; // "haven't added in N days" threshold

function normalize(name) {
  return name.trim().toLowerCase();
}

function onCurrentList(name, currentItems) {
  return currentItems.some((i) => normalize(i.name) === normalize(name));
}

/**
 * @param {Array} currentItems - items currently on the list
 * @param {Array} history - append-only history rows {name, category, created_at}
 * @returns {Array<{name, category, reason, source}>}
 */
export function getRecommendations(currentItems = [], history = []) {
  const recs = [];
  const seen = new Set();

  // 1) Frequently added items (ranked by count) not already on the list.
  const freq = new Map();
  for (const row of history) {
    const key = normalize(row.name);
    freq.set(key, (freq.get(key) || 0) + 1);
  }
  const frequent = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  for (const [name] of frequent) {
    if (onCurrentList(name, currentItems) || seen.has(name)) continue;
    seen.add(name);
    recs.push({
      name,
      category: categorizeItem(name),
      reason: 'You add this often',
      source: 'frequent',
    });
  }

  // 2) Stale items: last added more than STALE_DAYS ago, not on list now.
  const lastSeen = new Map();
  for (const row of history) {
    const key = normalize(row.name);
    const t = new Date(row.created_at).getTime();
    if (!lastSeen.has(key) || t > lastSeen.get(key)) lastSeen.set(key, t);
  }
  const now = Date.now();
  for (const [name, t] of lastSeen.entries()) {
    if (onCurrentList(name, currentItems) || seen.has(name)) continue;
    const days = (now - t) / (1000 * 60 * 60 * 24);
    if (days >= STALE_DAYS) {
      seen.add(name);
      recs.push({
        name,
        category: categorizeItem(name),
        reason: `Not added in ${Math.floor(days)} days`,
        source: 'stale',
      });
    }
  }

  // 3) Pairings: items commonly bought with what's already on the list.
  for (const item of currentItems) {
    const pairs = pairingsData.pairings[normalize(item.name)];
    if (!pairs) continue;
    for (const p of pairs) {
      if (onCurrentList(p, currentItems) || seen.has(p)) continue;
      seen.add(p);
      recs.push({
        name: p,
        category: categorizeItem(p),
        reason: `Pairs well with ${item.name}`,
        source: 'pairing',
      });
    }
  }

  return recs.slice(0, 12);
}

/** Seasonal items for a given month (1-12). */
export function getSeasonal(month) {
  const m = String(month);
  return (seasonalData.seasonal[m] || []).map((s) => ({
    ...s,
    category: categorizeItem(s.name),
  }));
}

/** Substitute alternatives for an item name (exact or partial match). */
export function getSubstitutes(itemName) {
  if (!itemName) return [];
  const key = normalize(itemName);
  if (substitutesData.substitutes[key]) {
    return substitutesData.substitutes[key].map((s) => ({
      name: s,
      category: categorizeItem(s),
    }));
  }
  // Try partial match (e.g. "oat milk" -> matches "milk").
  for (const [k, alts] of Object.entries(substitutesData.substitutes)) {
    if (key.includes(k) || k.includes(key)) {
      return alts.map((s) => ({ name: s, category: categorizeItem(s) }));
    }
  }
  return [];
}
