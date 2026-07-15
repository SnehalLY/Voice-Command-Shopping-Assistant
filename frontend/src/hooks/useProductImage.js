import { useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_BASE || '';

/**
 * Resolve a product image from the backend image endpoint. The backend serves
 * curated grocery photos (no external API key required for the common items)
 * and returns { ok, url } where url may be null. We fall back to `emoji` on
 * null/error so cards always render something.
 */
export function useProductImage(name) {
  const [url, setUrl] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    setDone(false);
    setUrl(null);
    if (!name) {
      setDone(true);
      return;
    }
    fetch(`${BASE}/api/image?q=${encodeURIComponent(name)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active) return;
        setUrl(data?.url || null);
        setDone(true);
      })
      .catch(() => {
        if (active) {
          setUrl(null);
          setDone(true);
        }
      });
    return () => {
      active = false;
    };
  }, [name]);

  return { url, done };
}
