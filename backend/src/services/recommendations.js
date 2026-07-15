import seasonalData from '../data/seasonal.json' with { type: 'json' };
import substitutesData from '../data/substitutes.json' with { type: 'json' };
import pairingsData from '../data/pairings.json' with { type: 'json' };
import { categorizeItem } from './categorization.js';

/**
 * Rule-based suggestion engine. All logic is data-driven from the static
 * JSON datasets (seasonal.json, substitutes.json, pairings.json) plus the
 * local history table. No external APIs. Four sources of suggestions:
 *   1. Running low: interval-based detection of items the user should reorder.
 *   2. Frequently bought: items added often but not currently on the list.
 *   3. Pairings: items commonly bought with what's already on the list.
 *   4. Seasonal: in-season items for the current month.
 */

const STALE_DAYS = Number(process.env.STALE_DAYS ?? 30);
const RUNNING_LOW_MIN_EVENTS = 3;
const RUNNING_LOW_THRESHOLD = 0.9;

function normalize(name) {
  return name.trim().toLowerCase();
}

function onCurrentList(name, currentItems) {
  return currentItems.some((i) => normalize(i.name) === normalize(name));
}

export function getFrequentItems(history) {
  const freq = new Map();
  for (const row of history) {
    const key = normalize(row.name);
    freq.set(key, (freq.get(key) || 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name]) => name);
}

/**
 * @param {Array} currentItems - items currently on the list
 * @param {Array} history - append-only history rows {name, category, created_at}
 * @returns {Array<{name, category, reason, source}>}
 */
export function getRecommendations(currentItems = [], history = []) {
  const recs = [];
  const seen = new Set();

  // 1) Stale items: last added more than STALE_DAYS ago, not on list now.
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

  // 2) Frequently added items (ranked by count) not already on the list or already recommended.
  for (const name of getFrequentItems(history)) {
    if (onCurrentList(name, currentItems) || seen.has(name)) continue;
    seen.add(name);
    recs.push({
      name,
      category: categorizeItem(name),
      reason: 'You add this often',
      source: 'frequent',
    });
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

/**
 * @param {Array} history - append-only history rows {name, created_at}
 * @returns {Array<{name, category, reason, source}>}
 */
export function getRunningLow(history = []) {
  const events = new Map();
  for (const row of history) {
    const key = normalize(row.name);
    if (!events.has(key)) events.set(key, []);
    events.get(key).push(new Date(row.created_at).getTime());
  }

  const now = Date.now();
  const runningLow = [];

  for (const [name, timestamps] of events) {
    if (timestamps.length < RUNNING_LOW_MIN_EVENTS) continue;
    timestamps.sort((a, b) => a - b);

    let totalInterval = 0;
    for (let i = 1; i < timestamps.length; i++) {
      totalInterval += timestamps[i] - timestamps[i - 1];
    }
    const avgInterval = totalInterval / (timestamps.length - 1);
    const lastAdded = timestamps[timestamps.length - 1];
    const daysSinceLast = (now - lastAdded) / (1000 * 60 * 60 * 24);
    const avgDays = avgInterval / (1000 * 60 * 60 * 24);

    if (daysSinceLast > avgDays * RUNNING_LOW_THRESHOLD) {
      runningLow.push({
        name,
        category: categorizeItem(name),
        reason: `Running low (avg ${avgDays.toFixed(1)} days, ${daysSinceLast.toFixed(1)} days since last)`,
        source: 'running_low',
      });
    }
  }

  return runningLow.slice(0, 8);
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
  for (const [k, alts] of Object.entries(substitutesData.substitutes)) {
    if (key.includes(k) || k.includes(key)) {
      return alts.map((s) => ({ name: s, category: categorizeItem(s) }));
    }
  }
  return [];
}
