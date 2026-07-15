import { useState } from 'react';
import Icon from './Icons.jsx';
import { itemEmoji } from '../lib/emoji.js';

// Lightweight local parser for the quick-add bar (bare text, no verb needed).
// Mirrors the reference app's manual-add heuristic; quantity + name are sent to
// the backend which performs categorization + image lookup.
function parseQuickAdd(raw) {
  let base = raw.trim();
  let quantity = 1;
  const m = base.match(/^(\d+)\s*(?:bottles?|packs?|cartons?|pieces?|litres?|bags?|units?|cans?|dozen)?\s*(?:of)?\s*(.*)$/i);
  if (m) {
    quantity = parseInt(m[1], 10);
    base = m[2].trim() || base;
  }
  const name = base.charAt(0).toUpperCase() + base.slice(1);
  return { name, quantity: Number.isFinite(quantity) ? quantity : 1 };
}

/**
 * ShoppingList — grouped, category-sorted list with check toggle, quantity
 * stepper, delete, and a quick-add bar. Renders product images (or emoji
 * fallback) and an empty state.
 */
export default function ShoppingList({ items, onRemove, onUpdate, onClear, onAdd }) {
  const [text, setText] = useState('');
  const [checked, setChecked] = useState(() => new Set());

  if (!items || items.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-800">
        <Header onClear={onClear} count={0} />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-100 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
            <Icon name="shopping-basket" className="h-8 w-8" />
          </div>
          <p className="font-bold text-slate-700 dark:text-slate-300">Your shopping list is empty</p>
          <p className="mt-1 max-w-[280px] text-xs text-slate-400">
            Try saying "Add 2 packs of organic eggs" or type an item below.
          </p>
        </div>
        <QuickAdd text={text} setText={setText} onAdd={onAdd} />
      </div>
    );
  }

  const groups = {};
  for (const item of items) {
    const cat = item.category || 'Other';
    (groups[cat] ||= []).push(item);
  }

  const toggleCheck = (id) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-800">
      <Header onClear={onClear} count={items.length} />

      <QuickAdd text={text} setText={setText} onAdd={onAdd} />

      <div className="space-y-6">
        {Object.entries(groups).map(([category, groupItems]) => (
          <div key={category} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {category}
              </span>
              <div className="h-px flex-1 bg-slate-100 dark:bg-slate-700/60" />
            </div>
            <div className="space-y-2">
              {groupItems.map((item) => {
                const isChecked = checked.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3 transition-all hover:bg-slate-100/50 dark:bg-slate-900/40 dark:hover:bg-slate-800/40 ${
                      isChecked ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleCheck(item.id)}
                        aria-label={isChecked ? 'Uncheck item' : 'Check item'}
                        className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all ${
                          isChecked
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-slate-300 hover:border-emerald-500 dark:border-slate-600'
                        }`}
                      >
                        {isChecked && <Icon name="check" className="h-4 w-4" />}
                      </button>

                      <Thumb item={item} />

                      <span
                        className={`truncate text-sm font-semibold tracking-tight ${
                          isChecked
                            ? 'text-slate-400 line-through'
                            : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center rounded-xl border border-slate-200 bg-white px-1.5 py-1 dark:border-slate-700 dark:bg-slate-800">
                        <button
                          type="button"
                          onClick={() => onUpdate(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          aria-label="Decrease quantity"
                        >
                          <Icon name="minus" className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdate(item.id, { quantity: item.quantity + 1 })}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          aria-label="Increase quantity"
                        >
                          <Icon name="plus" className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        className="rounded-xl p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Icon name="trash-2" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Header({ onClear, count }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">My Shopping List</h2>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
          {count} item{count !== 1 ? 's' : ''}
        </span>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="rounded-xl p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
        title="Clear All List Items"
      >
        <Icon name="trash-2" className="h-5 w-5" />
      </button>
    </div>
  );
}

function QuickAdd({ text, setText, onAdd }) {
  const submit = (e) => {
    e.preventDefault();
    const raw = text.trim();
    if (!raw) return;
    const { name, quantity } = parseQuickAdd(raw);
    onAdd({ name, quantity });
    setText('');
  };
  return (
    <form onSubmit={submit} className="mb-6 flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type grocery item & press Enter (e.g., 2 Litres Whole Milk)"
        className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-100"
      />
      <button
        type="submit"
        className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/15 transition-all hover:bg-emerald-600 active:scale-95"
      >
        <Icon name="plus" className="h-4 w-4" /> Add
      </button>
    </form>
  );
}

function Thumb({ item }) {
  const emoji = itemEmoji(item.name, item.category);
  if (item.imageUrl) {
    return (
      <img
        src={item.imageUrl}
        alt={item.name}
        loading="lazy"
        className="h-10 w-10 shrink-0 rounded-lg object-cover"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg dark:bg-slate-800">
      {emoji}
    </span>
  );
}
