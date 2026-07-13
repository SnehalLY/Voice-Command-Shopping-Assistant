// Thin API client. All calls go through here so the rest of the app never
// touches fetch directly. Base URL comes from VITE_API_BASE; when empty we use
// a relative path and rely on Vite's dev proxy (or same-origin in prod).
const BASE = import.meta.env.VITE_API_BASE || '';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON responses (shouldn't happen for our API).
    data = null;
  }

  if (!res.ok) {
    const message =
      data?.message || `Request failed with status ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  getItems: () => request('/api/items'),
  addItem: (item) => request('/api/items', { method: 'POST', body: JSON.stringify(item) }),
  updateItem: (id, fields) =>
    request(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(fields) }),
  removeItem: (id) => request(`/api/items/${id}`, { method: 'DELETE' }),
  clearItems: () => request('/api/items', { method: 'DELETE' }),

  // Voice/text command: parse + execute in one call. Returns updated list.
  sendCommand: (text, lang) =>
    request('/api/command', { method: 'POST', body: JSON.stringify({ text, lang }) }),

  // Parse-only (no DB write) — used to preview what the assistant understood.
  parse: (text, lang) =>
    request('/api/command/parse', { method: 'POST', body: JSON.stringify({ text, lang }) }),

  getSuggestions: (month) =>
    request(`/api/suggestions${month ? `?month=${month}` : ''}`),
};
