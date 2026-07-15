import { useState } from 'react';
import Icon from './Icons.jsx';
import { catalogProducts, CATALOG_CATEGORIES } from '../lib/catalog.js';

/**
 * Catalog — interactive fresh-product grid with a category filter and a manual
 * search box. A voice "search X under $Y" command sets `searchQuery` / `maxPrice`
 * from the parent (App), which filters the grid and shows the search banner.
 */
export default function Catalog({ searchQuery = '', maxPrice = null, onClearSearch, onAdd }) {
  const [category, setCategory] = useState('all');
  const [textQuery, setTextQuery] = useState('');

  const activeQuery = searchQuery || textQuery;

  const filtered = catalogProducts.filter((prod) => {
    const matchesCat = category === 'all' || prod.category === category;
    const matchesQuery =
      !activeQuery ||
      prod.name.toLowerCase().includes(activeQuery.toLowerCase()) ||
      prod.category.toLowerCase().includes(activeQuery.toLowerCase()) ||
      prod.brand.toLowerCase().includes(activeQuery.toLowerCase());
    const matchesPrice = maxPrice == null || prod.price <= maxPrice;
    return matchesCat && matchesQuery && matchesPrice;
  });

  const clearLocal = () => {
    setTextQuery('');
    onClearSearch?.();
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-800">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Organic & Premium Fresh Catalog
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400">
            Explore and search live fresh products with pricing filters
          </p>
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="self-start rounded-xl border border-slate-100 bg-slate-50 py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-600 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 md:self-auto"
        >
          {CATALOG_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'All Fresh Produce' : c}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={textQuery}
            onChange={(e) => setTextQuery(e.target.value)}
            placeholder="Search the catalog…"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
          No catalog items found matching filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {filtered.map((prod) => (
            <div
              key={prod.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 transition-all hover:border-emerald-500/20 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="relative mb-3 flex h-28 w-full items-center justify-center overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="absolute left-2 top-2 rounded-lg bg-white/90 px-1.5 py-0.5 text-sm shadow-sm backdrop-blur-sm dark:bg-slate-800/90">
                    {prod.emoji}
                  </span>
                </div>
                <div className="flex items-center justify-between px-1">
                  <span className="rounded-md bg-emerald-100/50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {prod.category}
                  </span>
                  <span className="text-[9px] text-slate-400">{prod.brand}</span>
                </div>
                <h4 className="px-1 pt-1 text-sm font-bold text-slate-800 transition-colors group-hover:text-emerald-500 dark:text-slate-100">
                  {prod.name}
                </h4>
              </div>

              <div className="flex items-center justify-between p-3">
                <span className="text-sm font-extrabold text-slate-900 dark:text-slate-200">
                  ${prod.price.toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => onAdd({ name: prod.name, quantity: 1 })}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-all hover:bg-emerald-500 hover:text-white active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-emerald-500 dark:hover:text-white"
                  title="Quick Add"
                >
                  <Icon name="plus" className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
