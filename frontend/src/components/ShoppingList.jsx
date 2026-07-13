/**
 * ShoppingList — renders the current list grouped by category.
 *
 * Each group shows a header + its items with quantity/unit, plus per-item
 * remove and quick quantity stepper controls. Shows an empty state when the
 * list is empty.
 */
export default function ShoppingList({ items, onRemove, onUpdate, onClear }) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-lg font-medium text-slate-600">Your list is empty</p>
        <p className="mt-1 text-sm text-slate-400">
          Speak or type a command like “Add milk” to get started.
        </p>
      </div>
    );
  }

  // Group by category, preserving a stable category order.
  const groups = {};
  for (const item of items) {
    const cat = item.category || 'Other';
    (groups[cat] ||= []).push(item);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-700">
          Shopping List <span className="text-slate-400">({items.length})</span>
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-medium text-red-600 hover:text-red-700"
        >
          Clear all
        </button>
      </div>

      {Object.entries(groups).map(([category, groupItems]) => (
        <div key={category} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center gap-2 px-1">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              {category}
            </span>
            <span className="text-xs text-slate-400">{groupItems.length}</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {groupItems.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-2 pl-1">
                <span className="flex-1">
                  <span className="font-medium capitalize text-slate-800">{item.name}</span>
                  <span className="ml-2 text-sm text-slate-500">
                    {formatQty(item)}
                    {item.brand && <span className="ml-1 text-xs text-slate-400">· {item.brand}</span>}
                  </span>
                </span>

                <div className="flex items-center gap-1">
                  <QtyButton label="-" onClick={() => onUpdate(item.id, { quantity: Math.max(1, item.quantity - 1) })} />
                  <span className="w-6 text-center text-sm tabular-nums text-slate-700">{item.quantity}</span>
                  <QtyButton label="+" onClick={() => onUpdate(item.id, { quantity: item.quantity + 1 })} />
                </div>

                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function formatQty(item) {
  const q = Number.isInteger(item.quantity) ? item.quantity : item.quantity;
  return item.unit ? `${q} ${item.unit}` : `${q}`;
}

function QtyButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
    >
      {label}
    </button>
  );
}

function TrashIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
