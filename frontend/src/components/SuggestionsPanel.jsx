import { useState } from 'react';

/**
 * SuggestionsPanel — smart suggestions in three tabs:
 *   - For you: frequent / stale / pairing recommendations
 *   - Seasonal: items in season this month
 *   - Substitutes: alternative products for items already on the list
 *
 * Each suggestion is clickable to add it to the list via onAdd.
 */
export default function SuggestionsPanel({ suggestions, loading, onAdd }) {
  const [tab, setTab] = useState('recommend');

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
        Loading suggestions…
      </div>
    );
  }
  if (!suggestions) return null;

  const { recommendations = [], seasonal = [], substitutes = [] } = suggestions;
  const tabs = [
    { key: 'recommend', label: 'For you', count: recommendations.length },
    { key: 'seasonal', label: 'Seasonal', count: seasonal.length },
    { key: 'substitutes', label: 'Substitutes', count: substitutes.reduce((n, s) => n + s.options.length, 0) },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-700">Smart Suggestions</h2>

      <div className="mb-3 flex gap-1 rounded-lg bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-2 py-1.5 text-sm font-medium transition ${
              tab === t.key ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label} {t.count > 0 && <span className="text-xs">({t.count})</span>}
          </button>
        ))}
      </div>

      {tab === 'recommend' && (
        <SuggestionList
          items={recommendations}
          empty="No recommendations yet — add a few items and we'll learn your habits."
          onAdd={onAdd}
          showReason
        />
      )}

      {tab === 'seasonal' && (
        <SuggestionList
          items={seasonal.map((s) => ({ ...s, reason: s.reason }))}
          empty="No seasonal items for this month."
          onAdd={onAdd}
          showReason
        />
      )}

      {tab === 'substitutes' &&
        (substitutes.length === 0 ? (
          <p className="text-sm text-slate-400">Add items like milk or eggs to see substitutes.</p>
        ) : (
          <div className="space-y-3">
            {substitutes.map((group) => (
              <div key={group.for}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Instead of {group.for}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((opt) => (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => onAdd(opt.name)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:border-brand-400 hover:bg-brand-50"
                    >
                      + {opt.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}

function SuggestionList({ items, empty, onAdd, showReason }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-slate-400">{empty}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item, idx) => (
        <li
          key={`${item.name}-${idx}`}
          className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2"
        >
          <div className="min-w-0">
            <p className="truncate font-medium capitalize text-slate-800">{item.name}</p>
            {showReason && item.reason && (
              <p className="truncate text-xs text-slate-400">{item.reason}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onAdd(item.name)}
            className="shrink-0 rounded-md bg-brand-600 px-3 py-1 text-sm font-medium text-white hover:bg-brand-700"
          >
            Add
          </button>
        </li>
      ))}
    </ul>
  );
}
