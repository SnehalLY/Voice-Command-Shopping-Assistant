import { parseCommand } from './intent.js';
import {
  listItems,
  findItemByName,
  addItem,
  updateItem,
  removeItem,
  clearItems,
  getHistory,
} from '../db.js';
import { categorizeItem } from './categorization.js';
import { ensureImage } from './image.js';
import { getRecommendations, getSeasonal, getSubstitutes, getRunningLow } from './recommendations.js';
import { extractSearchFilters } from './filters.js';

/**
 * Executes a parsed voice/text command against the data store and returns a
 * UI-friendly result. This is the single entry point the API uses so the
 * "voice -> parse -> list" loop lives in exactly one place.
 */

function toItemShape(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    quantity: row.quantity,
    unit: row.unit,
    brand: row.brand,
    maxPrice: row.max_price,
    price: row.price,
    imageUrl: row.image_url,
  };
}

export async function executeCommand(text, lang = 'en') {
  const parsed = parseCommand(text, lang);

  if (parsed.needsClarification) {
    return {
      ok: false,
      error: 'needs_clarification',
      message: 'Could you clarify? Say something like "add milk", "remove bread", or "what is seasonal"',
      parsed,
      list: listItems().map(toItemShape),
    };
  }

  if (parsed.intent === 'unknown' || parsed.error === 'empty_input') {
    return {
      ok: false,
      error: 'unrecognized',
      message: 'Sorry, I could not understand that command.',
      parsed,
      list: listItems().map(toItemShape),
    };
  }

  const { intent, entities } = parsed;

  switch (intent) {
    case 'add':
      return handleAdd(entities, lang);
    case 'remove':
      return handleRemove(entities);
    case 'clear':
      return handleClear();
    case 'setQuantity':
      return handleSetQuantity(entities);
    case 'search':
      return handleSearch(entities, text);
    case 'ask':
      return handleAsk(text, entities, lang);
    default:
      return {
        ok: false,
        error: 'unsupported_intent',
        message: `Unsupported intent: ${intent}`,
        parsed,
        list: listItems().map(toItemShape),
      };
  }
}

async function handleAdd(entities, lang) {
  const name = entities.itemName;
  if (!name) {
    return {
      ok: false,
      error: 'missing_item',
      message: 'What would you like to add? Please say an item name.',
      parsed: { intent: 'add', entities },
      list: listItems().map(toItemShape),
    };
  }

  const category = entities.category || categorizeItem(name);
  const existing = findItemByName(name);

  if (existing) {
    const newQty = (entities.quantity ? entities.quantity : 1) + existing.quantity;
    const updated =     updateItem(existing.id, {
      quantity: newQty,
      unit: entities.unit ?? existing.unit,
      brand: entities.brand ?? existing.brand,
      maxPrice: entities.maxPrice ?? existing.max_price,
      category,
    });
    ensureImage(updated.id, name).then((url) => { updated.image_url = url; }).catch(() => {});

    const substitutes = getSubstitutes(name);
    let message = `Updated "${name}" to ${newQty}${entities.unit ? ' ' + entities.unit : ''}.`;
    if (substitutes.length > 0) {
      const names = substitutes.map((s) => s.name).join(', ');
      message += ` Try ${names} as alternatives.`;
    }
    return success('add', message, updated, lang);
  }

  const created = addItem({
    name,
    category,
    quantity: entities.quantity || 1,
    unit: entities.unit,
    brand: entities.brand,
    maxPrice: entities.maxPrice,
    price: entities.maxPrice,
  });
  ensureImage(created.id, name).then((url) => { created.image_url = url; }).catch(() => {});

  const substitutes = getSubstitutes(name);
  let message = `Added "${name}" to ${category}.`;
  if (substitutes.length > 0) {
    const names = substitutes.map((s) => s.name).join(', ');
    message += ` Try ${names} as alternatives.`;
  }

  return success('add', message, created, lang);
}

function handleRemove(entities) {
  const name = entities.itemName;
  if (!name) {
    return {
      ok: false,
      error: 'missing_item',
      message: 'What would you like to remove?',
      parsed: { intent: 'remove', entities },
      list: listItems().map(toItemShape),
    };
  }

  // Exact (case-insensitive) match on item name only — no substring fallback,
  // so "remove apple" can never accidentally delete "pineapple".
  const needle = name.toLowerCase();
  const all = listItems();
  const matches = all.filter((i) => i.name.toLowerCase() === needle);
  if (matches.length === 0) {
    return {
      ok: false,
      error: 'not_found',
      message: `I couldn't find "${name}" on your list.`,
      parsed: { intent: 'remove', entities },
      list: all.map(toItemShape),
    };
  }
  const removed = matches.map((m) => {
    removeItem(m.id);
    return m.name;
  });
  return {
    ok: true,
    intent: 'remove',
    action: { type: 'remove', items: removed },
    message: `Removed ${removed.join(', ')}.`,
    list: listItems().map(toItemShape),
  };
}

// Distinct "clear the list" intent (e.g. "clear my list"). Reached only when
// the parser classifies the utterance as `clear`, so a plain "remove all"
// (intent=remove, itemName="all") can never wipe the list by accident.
function handleClear() {
  clearItems();
  return {
    ok: true,
    intent: 'clear',
    action: { type: 'clear' },
    message: 'Cleared your shopping list.',
    list: [],
  };
}

function handleSetQuantity(entities) {
  const name = entities.itemName;
  if (!name) {
    return {
      ok: false,
      error: 'missing_item',
      message: 'Which item should I change the quantity for?',
      parsed: { intent: 'setQuantity', entities },
      list: listItems().map(toItemShape),
    };
  }
  if (!entities.quantity) {
    return {
      ok: false,
      error: 'missing_quantity',
      message: `How many ${name} do you want?`,
      parsed: { intent: 'setQuantity', entities },
      list: listItems().map(toItemShape),
    };
  }
  const existing = findItemByName(name);
  if (!existing) {
    return {
      ok: false,
      error: 'not_found',
      message: `I couldn't find "${name}" on your list.`,
      parsed: { intent: 'setQuantity', entities },
      list: listItems().map(toItemShape),
    };
  }
  const updated = updateItem(existing.id, { quantity: entities.quantity, unit: entities.unit ?? existing.unit });
  return {
    ok: true,
    intent: 'setQuantity',
    action: { type: 'setQuantity', item: updated.name },
    message: `Set ${updated.name} to ${entities.quantity}${entities.unit ? ' ' + entities.unit : ''}.`,
    list: listItems().map(toItemShape),
  };
}

function handleSearch(entities, raw) {
  const all = listItems();
  let q = (entities.itemName || '').toLowerCase();
  const filters = extractSearchFilters(raw || '', 'en');
  const brandFilter = entities.brand || filters.brand;
  const maxPriceFilter = entities.maxPrice != null ? entities.maxPrice : filters.maxPrice;
  const minPriceFilter = entities.minPrice != null ? entities.minPrice : filters.minPrice;

  if (brandFilter && q) {
    const brandLower = brandFilter.toLowerCase();
    if (q.includes(brandLower)) {
      q = q.replace(brandLower, '').replace(/\s+/g, ' ').trim();
    }
  }

  const priceWords = ['under', 'below', 'cheaper than', 'less than', 'within', 'maximum', 'max', 'over', 'above', 'more than'];
  for (const w of priceWords) {
    if (q.includes(w)) {
      q = q.replace(new RegExp('\\b' + w.replace(/ /g, '\\s+') + '\\b', 'gi'), '').replace(/\s+/g, ' ').trim();
    }
  }

  let results = all;
  if (q) {
    results = results.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.category || '').toLowerCase().includes(q)
    );
  }
  if (brandFilter) {
    const brandLower = brandFilter.toLowerCase();
    results = results.filter(
      (i) => (i.brand || '').toLowerCase().includes(brandLower)
    );
  }
  if (maxPriceFilter != null) {
    results = results.filter(
      (i) => i.max_price == null || i.max_price <= maxPriceFilter
    );
  }
  if (minPriceFilter != null) {
    results = results.filter(
      (i) => i.max_price == null || i.max_price >= minPriceFilter
    );
  }

  if (results.length > 0) {
    return {
      ok: true,
      intent: 'search',
      action: { type: 'search', query: entities.itemName, count: results.length },
      message: `Found ${results.length} item(s) matching "${entities.itemName || 'your filters'}".`,
      results: results.map(toItemShape),
      list: all.map(toItemShape),
      appliedFilters: {
        brand: brandFilter || null,
        maxPrice: maxPriceFilter,
        minPrice: minPriceFilter,
      },
    };
  }

  // Nothing on the list matched. Fall back to helpful suggestions so an empty
  // list never produces a dead end (e.g. "find me some fresh fruits").
  const month = new Date().getMonth() + 1;
  const qLabel = entities.itemName || 'that';
  const isProduce = /fruit|vegetable|produce|veg|fresh|salad|season|healthy|snack/i.test(q);
  if (isProduce) {
    const seasonal = getSeasonal(month);
    if (seasonal.length > 0) {
      return {
        ok: true,
        intent: 'search',
        action: { type: 'search', query: entities.itemName, count: seasonal.length, fallback: 'seasonal' },
        message: `No items on your list match "${qLabel}". Here are this month's seasonal picks:`,
        results: seasonal.map((s) => ({ id: s.name, name: s.name, category: s.category, quantity: 1, reason: s.reason })),
        list: all.map(toItemShape),
        appliedFilters: {
          brand: brandFilter || null,
          maxPrice: maxPriceFilter,
          minPrice: minPriceFilter,
        },
      };
    }
  }
  const recs = getRecommendations(all, getHistory()).slice(0, 6);
  if (recs.length > 0) {
    return {
      ok: true,
      intent: 'search',
      action: { type: 'search', query: entities.itemName, count: recs.length, fallback: 'recommend' },
      message: `No items match "${qLabel}". Here are some suggestions:`,
      results: recs.map((r) => ({ id: r.name, name: r.name, category: r.category, quantity: 1, reason: r.reason })),
      list: all.map(toItemShape),
      appliedFilters: {
        brand: brandFilter || null,
        maxPrice: maxPriceFilter,
        minPrice: minPriceFilter,
      },
    };
  }
  return {
    ok: true,
    intent: 'search',
    action: { type: 'search', query: entities.itemName, count: 0 },
    message: `No items match "${qLabel}".`,
    results: [],
    list: all.map(toItemShape),
    appliedFilters: {
      brand: brandFilter || null,
      maxPrice: maxPriceFilter,
      minPrice: minPriceFilter,
    },
  };
}

function handleAsk(text, entities, lang) {
  // Match against the ORIGINAL utterance, not the stripped entity name — the
  // "options for" / "instead of" triggers are removed during entity extraction,
  // so checking the cleaned name would miss them (e.g. "options for milk").
  const raw = text.toLowerCase();
  const all = listItems();
  const month = new Date().getMonth() + 1;

  const seasonalKeywords = ['seasonal', 'season', 'fruits', 'vegetables', 'in season', 'what\'s in season', 'what is in season'];
  const recommendKeywords = ['suggest', 'recommend', 'should i buy', 'what should i', 'any suggestion', 'good this week', 'what\'s good'];
  const substituteKeywords = ['instead of', 'substitute', 'substitutes', 'replacement', 'alternative', 'alternatives', 'use instead', 'can i use', 'options for', 'option for', 'options', 'option', 'alternatives for', 'alternatives to', 'swap for', 'swaps for'];
  const listQueryKeywords = ['on my list', 'what do i have', 'what\'s on', 'in my list', 'do i have'];

  const has = (keywords) => keywords.some((k) => raw.includes(k));

  // Pull the item name out of a substitute-style query. Prefers the text that
  // follows a trigger phrase (e.g. "options for milk" -> "milk") and falls back
  // to stripping trigger/filler words when no clear pattern matches.
  const SUB_PHRASE = /(?:instead of|substitute for|substitutes for|replacement for|alternative to|alternatives to|alternatives for|options for|option for|swap for|swaps for|use instead of|can i use instead of|can i use)\s+(?:the\s+)?(.+)/i;
  const stripSubs = (s) =>
    s
      .replace(/instead of|substitute for|substitutes for|replacement for|alternative to|alternatives to|alternatives for|options for|option for|swap for|swaps for|use instead of|can i use|substitute|substitutes|alternative|alternatives|options|option|swap|swaps|what|are|the|me|show|for/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  if (has(substituteKeywords) && raw) {
    const phraseMatch = raw.match(SUB_PHRASE);
    const itemName = phraseMatch ? phraseMatch[1].trim() : stripSubs(raw);
    const subs = getSubstitutes(itemName);
    if (subs.length > 0) {
      const names = subs.map((s) => s.name).join(', ');
      const message = `For ${itemName}, try ${names}.`;
      return { ok: true, intent: 'ask', action: { type: 'ask', subtype: 'substitutes', item: itemName }, message, list: all.map(toItemShape) };
    }
    return { ok: true, intent: 'ask', action: { type: 'ask', subtype: 'substitutes', item: itemName }, message: `I don't have substitutes for ${itemName} yet.`, list: all.map(toItemShape) };
  }

  if (has(seasonalKeywords)) {
    const seasonal = getSeasonal(month);
    const names = seasonal.slice(0, 6).map((s) => s.name).join(', ');
    const reason = seasonal[0]?.reason || 'in season now';
    const message = `This month's seasonal picks are ${names}. ${reason}`;
    return { ok: true, intent: 'ask', action: { type: 'ask', subtype: 'seasonal', month }, message, list: all.map(toItemShape) };
  }

  if (has(recommendKeywords)) {
    const recs = getRecommendations(all, getHistory());
    const top = recs.slice(0, 5);
    if (top.length > 0) {
      const names = top.map((r) => r.name).join(', ');
      const message = `I'd suggest ${names}. ${top[0].reason}.`;
      return { ok: true, intent: 'ask', action: { type: 'ask', subtype: 'recommendations' }, message, list: all.map(toItemShape) };
    }
    return { ok: true, intent: 'ask', action: { type: 'ask', subtype: 'recommendations' }, message: 'Your list looks well-stocked! Try adding something seasonal.', list: all.map(toItemShape) };
  }

  if (has(listQueryKeywords)) {
    if (all.length === 0) {
      return { ok: true, intent: 'ask', action: { type: 'ask', subtype: 'list_summary' }, message: 'Your list is empty. Say "add milk" to get started.', list: [] };
    }
    const names = all.map((i) => `${i.name} (${i.quantity}${i.unit ? ' ' + i.unit : ''})`).join(', ');
    return { ok: true, intent: 'ask', action: { type: 'ask', subtype: 'list_summary' }, message: `You have ${all.length} item(s): ${names}.`, list: all.map(toItemShape) };
  }

  const recs = getRecommendations(all, getHistory());
  const seasonal = getSeasonal(month);
  const parts = [];
  if (seasonal.length > 0) {
    parts.push(`Seasonal: ${seasonal.slice(0, 3).map((s) => s.name).join(', ')}`);
  }
  if (recs.length > 0) {
    parts.push(`Suggestions: ${recs.slice(0, 3).map((r) => r.name).join(', ')}`);
  }
  const message = parts.length > 0 ? parts.join('. ') : 'Your list is up to date. Try adding something or asking about seasonal items.';
  return { ok: true, intent: 'ask', action: { type: 'ask', subtype: 'general' }, message, list: all.map(toItemShape) };
}

function success(intent, message, item, lang) {
  return {
    ok: true,
    intent,
    action: { type: intent, item: item.name },
    message,
    item: toItemShape(item),
    list: listItems().map(toItemShape),
  };
}
