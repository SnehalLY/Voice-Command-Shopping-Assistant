import Icon from './Icons.jsx';
import { itemEmoji } from '../lib/emoji.js';

/**
 * SearchResults — displays items returned by a search/find command (from the
 * list, or a seasonal/recommendation fallback). Shows applied voice filters
 * (price/brand) as visual feedback. Each result can be added to the
 * list via onAdd.
 */
export default function SearchResults({ query, results, appliedFilters, onDismiss, onAdd }) {
  const filterLabel = [];
  if (appliedFilters?.brand) filterLabel.push(`brand: ${appliedFilters.brand}`);
  if (appliedFilters?.maxPrice) filterLabel.push(`under $${appliedFilters.maxPrice}`);
  if (appliedFilters?.minPrice) filterLabel.push(`over $${appliedFilters.minPrice}`);

  return (
    <div className="rounded-3xl border border-emerald-200/50 bg-white p-6 shadow-sm dark:border-emerald-900/60 dark:bg-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-emerald-700 dark:text-emerald-400">
          Results for &ldquo;{query}&rdquo;
        </h3>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500 transition-all hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:hover:text-slate-200"
        >
          Back to list
        </button>
      </div>

      {filterLabel.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Showing results {filterLabel.join(' · ')}
          </span>
        </div>
      )}

      <p className="mb-4 text-xs text-slate-400">
        {results.length} match{results.length !== 1 ? 'es' : ''}
      </p>

      {results.length === 0 ? (
        <p className="text-sm text-slate-400">No items match your search.</p>
      ) : (
        <ul className="space-y-2">
          {results.map((item) => {
            const emoji = itemEmoji(item.name, item.category);
            return (
              <li
                key={item.id || item.name}
                className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg dark:bg-slate-800">
                      {emoji}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium capitalize text-slate-800 dark:text-slate-100">{item.name}</p>
                    <p className="truncate text-xs text-slate-400">
                      {item.category}
                      {item.reason ? ` · ${item.reason}` : ''}
                      {item.price != null ? ` · $${item.price.toFixed(2)}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onAdd({ name: item.name, quantity: item.quantity || 1 })}
                  className="flex shrink-0 items-center gap-1 rounded-xl bg-emerald-500 px-3 py-1.5 text-sm font-bold text-white transition-all hover:bg-emerald-600 active:scale-95"
                >
                  <Icon name="plus" className="h-3.5 w-3.5" /> Add
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
