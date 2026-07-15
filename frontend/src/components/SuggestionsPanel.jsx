import { useState } from 'react';
import Icon from './Icons.jsx';
import { useProductImage } from '../hooks/useProductImage.js';
import { itemEmoji } from '../lib/emoji.js';

/**
 * SuggestionsPanel — smart suggestions in four tabs:
 *   - Seasonal Deals: in-season items for the current month
 *   - Frequently Bought: items purchased often
 *   - Running Low: items whose reorder interval is overdue
 *   - Healthy Swaps: substitute alternatives for items on the list
 *
 * Each card resolves a product image (with emoji fallback) and is clickable to
 * add the item via onAdd.
 */
export default function SuggestionsPanel({ suggestions, loading, onAdd }) {
  const [tab, setTab] = useState('seasonal');

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-400 shadow-sm dark:border-slate-700/60 dark:bg-slate-800">
        Loading suggestions…
      </div>
    );
  }
  if (!suggestions) return null;

  const { runningLow = [], frequentlyBought = [], seasonal = [], substitutes = [] } = suggestions;

  const tabs = [
    { key: 'seasonal', label: 'Seasonal Deals' },
    { key: 'frequent', label: 'Frequently Bought' },
    { key: 'runningLow', label: 'Running Low' },
    { key: 'subs', label: 'Healthy Swaps' },
  ];

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-800">
      <div className="mb-5 flex items-center gap-2">
        <div className="rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-950/40">
          <Icon name="sparkles" className="m-2 h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Smart Recommendations
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400">
            Contextual grocery deals, reorder alerts, and alternative choices
          </p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-4 rounded-2xl bg-slate-50 p-1 dark:bg-slate-900">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-2 py-2 text-xs font-bold transition-all md:px-3 ${
              tab === t.key
                ? 'border border-slate-100 bg-white text-slate-800 shadow-sm dark:border-slate-700/50 dark:bg-slate-800 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {tab === 'seasonal' &&
          (seasonal.length === 0 ? (
            <Empty text="No seasonal items for this month." />
          ) : (
            seasonal.map((s, i) => (
              <Card key={`${s.name}-${i}`} name={s.name} reason={s.reason} tag="Seasonal" onAdd={onAdd} />
            ))
          ))}

        {tab === 'frequent' &&
          (frequentlyBought.length === 0 ? (
            <Empty text="No recommendations yet — add a few items and we'll learn your habits." />
          ) : (
            frequentlyBought.map((r, i) => (
              <Card key={`${r.name}-${i}`} name={r.name} reason={r.reason} tag="For you" onAdd={onAdd} />
            ))
          ))}

        {tab === 'runningLow' &&
          (runningLow.length === 0 ? (
            <Empty text="Add items a few times and we'll alert you when it's time to restock." />
          ) : (
            runningLow.map((r, i) => (
              <Card key={`${r.name}-${i}`} name={r.name} reason={r.reason} tag="Running Low" onAdd={onAdd} />
            ))
          ))}

        {tab === 'subs' &&
          (substitutes.length === 0 ? (
            <Empty text="Add items like milk or eggs to see healthy swaps." />
          ) : (
            substitutes.flatMap((group) =>
              group.options.map((opt) => (
                <Card
                  key={`${group.for}-${opt.name}`}
                  name={opt.name}
                  reason={`Healthy swap for ${group.for}`}
                  tag="Healthy Swap"
                  onAdd={onAdd}
                />
              ))
            )
          ))}
      </div>
    </div>
  );
}

function Empty({ text }) {
  return <p className="col-span-full text-sm text-slate-400">{text}</p>;
}

function Card({ name, reason, tag, onAdd }) {
  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 transition-all hover:scale-[1.01] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex gap-3 p-4">
        <ImageThumb name={name} />
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-1.5">
            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-800 dark:bg-amber-950 dark:text-amber-400">
              {tag}
            </span>
          </div>
          <h4 className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{name}</h4>
          <p className="mt-1 text-xs leading-snug text-slate-400 dark:text-slate-500">{reason}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onAdd({ name })}
        className="mt-2 flex w-full items-center justify-center gap-2 border-t border-slate-100 bg-white py-2 text-xs font-bold text-slate-700 transition-all hover:bg-emerald-500 hover:text-white dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-emerald-500 dark:hover:text-white"
      >
        <Icon name="shopping-cart" className="h-3.5 w-3.5" /> Add item
      </button>
    </div>
  );
}

function ImageThumb({ name }) {
  const { url } = useProductImage(name);
  if (url) {
    return (
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-200 shadow-sm dark:bg-slate-800">
        <img
          src={url}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  }
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-3xl dark:bg-slate-800">
      {itemEmoji(name)}
    </div>
  );
}
