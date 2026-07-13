import { parseCommand } from './intent.js';
import {
  listItems,
  findItemByName,
  addItem,
  updateItem,
  removeItem,
  clearItems,
} from '../db.js';
import { categorizeItem } from './categorization.js';

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
  };
}

export function executeCommand(text, lang = 'en') {
  const parsed = parseCommand(text, lang);

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
      return handleSearch(entities);
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

function handleAdd(entities, lang) {
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
    // Merge quantity: explicit number replaces, otherwise bump by 1.
    const newQty = entities.quantity
      ? entities.quantity
      : existing.quantity + 1;
    const updated = updateItem(existing.id, {
      quantity: newQty,
      unit: entities.unit ?? existing.unit,
      brand: entities.brand ?? existing.brand,
      maxPrice: entities.maxPrice ?? existing.max_price,
      category,
    });
    return success('add', `Updated "${name}" to ${newQty}${entities.unit ? ' ' + entities.unit : ''}.`, updated, lang);
  }

  const created = addItem({
    name,
    category,
    quantity: entities.quantity || 1,
    unit: entities.unit,
    brand: entities.brand,
    maxPrice: entities.maxPrice,
  });
  return success('add', `Added "${name}" to ${category}.`, created, lang);
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

function handleSearch(entities) {
  const all = listItems();
  const q = (entities.itemName || '').toLowerCase();
  let results = all;
  if (q) {
    results = results.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.category || '').toLowerCase().includes(q)
    );
  }
  if (entities.brand) {
    results = results.filter(
      (i) => (i.brand || '').toLowerCase().includes(entities.brand.toLowerCase())
    );
  }
  if (entities.maxPrice != null) {
    results = results.filter(
      (i) => i.max_price == null || i.max_price <= entities.maxPrice
    );
  }
  return {
    ok: true,
    intent: 'search',
    action: { type: 'search', query: entities.itemName, count: results.length },
    message:
      results.length > 0
        ? `Found ${results.length} item(s) matching "${entities.itemName || 'your filters'}".`
        : `No items match "${entities.itemName || 'your filters'}".`,
    results: results.map(toItemShape),
    list: all.map(toItemShape),
  };
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
