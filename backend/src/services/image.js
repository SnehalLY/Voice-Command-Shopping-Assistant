import { updateItem } from '../db.js';

const PEXELS_KEY = process.env.PEXELS_API_KEY;
const memoryCache = new Map();

const CURATED_IMAGES = {
  milk: 'https://images.pexels.com/photos/2487530/pexels-photo-2487530.jpeg?auto=compress&cs=tinysrgb&w=200',
  eggs: 'https://images.pexels.com/photos/1627120/pexels-photo-1627120.jpeg?auto=compress&cs=tinysrgb&w=200',
  bread: 'https://images.pexels.com/photos/209206/pexels-photo-209206.jpeg?auto=compress&cs=tinysrgb&w=200',
  apples: 'https://images.pexels.com/photos/1510392/pexels-photo-1510392.jpeg?auto=compress&cs=tinysrgb&w=200',
  bananas: 'https://images.pexels.com/photos/2872755/pexels-photo-2872755.jpeg?auto=compress&cs=tinysrgb&w=200',
  oranges: 'https://images.pexels.com/photos/327098/pexels-photo-327098.jpeg?auto=compress&cs=tinysrgb&w=200',
  chicken: 'https://images.pexels.com/photos/616354/pexels-photo-616354.jpeg?auto=compress&cs=tinysrgb&w=200',
  rice: 'https://images.pexels.com/photos/4110509/pexels-photo-4110509.jpeg?auto=compress&cs=tinysrgb&w=200',
  pasta: 'https://images.pexels.com/photos/1527603/pexels-photo-1527603.jpeg?auto=compress&cs=tinysrgb&w=200',
  cheese: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=200',
  butter: 'https://images.pexels.com/photos/6621611/pexels-photo-6621611.jpeg?auto=compress&cs=tinysrgb&w=200',
  tomatoes: 'https://images.pexels.com/photos/533780/pexels-photo-533780.jpeg?auto=compress&cs=tinysrgb&w=200',
  watermelon: 'https://images.pexels.com/photos/1313269/pexels-photo-1313269.jpeg?auto=compress&cs=tinysrgb&w=200',
  peaches: 'https://images.pexels.com/photos/113320/pexels-photo-113320.jpeg?auto=compress&cs=tinysrgb&w=200',
  corn: 'https://images.pexels.com/photos/2320/pexels-photo-2320.jpeg?auto=compress&cs=tinysrgb&w=200',
  coffee: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=200',
  yogurt: 'https://images.pexels.com/photos/219927/pexels-photo-219927.jpeg?auto=compress&cs=tinysrgb&w=200',
  spinach: 'https://images.pexels.com/photos/2329674/pexels-photo-2329674.jpeg?auto=compress&cs=tinysrgb&w=200',
  carrots: 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=200',
  broccoli: 'https://images.pexels.com/photos/4061536/pexels-photo-4061536.jpeg?auto=compress&cs=tinysrgb&w=200',
  strawberries: 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg?auto=compress&cs=tinysrgb&w=200',
  grapes: 'https://images.pexels.com/photos/2288085/pexels-photo-2288085.jpeg?auto=compress&cs=tinysrgb&w=200',
  pumpkin: 'https://images.pexels.com/photos/1656666/pexels-photo-1656666.jpeg?auto=compress&cs=tinysrgb&w=200',
  'sweet potato': 'https://images.pexels.com/photos/40780/pumpkin-autumn-vegetables-squash-40780.jpeg?auto=compress&cs=tinysrgb&w=200',
  'ice cream': 'https://images.pexels.com/photos/3734349/pexels-photo-3734349.jpeg?auto=compress&cs=tinysrgb&w=200',
  sugar: 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=200',
  flour: 'https://images.pexels.com/photos/5638732/pexels-photo-5638732.jpeg?auto=compress&cs=tinysrgb&w=200',
  oil: 'https://images.pexels.com/photos/7431284/pexels-photo-7431284.jpeg?auto=compress&cs=tinysrgb&w=200',
  salt: 'https://images.pexels.com/photos/4197598/pexels-photo-4197598.jpeg?auto=compress&cs=tinysrgb&w=200',
  chicken: 'https://images.pexels.com/photos/616354/pexels-photo-616354.jpeg?auto=compress&cs=tinysrgb&w=200',
  beef: 'https://images.pexels.com/photos/899929/pexels-photo-899929.jpeg?auto=compress&cs=tinysrgb&w=200',
  'peanut butter': 'https://images.pexels.com/photos/5569136/pexels-photo-5569136.jpeg?auto=compress&cs=tinysrgb&w=200',
  'almond milk': 'https://images.pexels.com/photos/8965577/pexels-photo-8965577.jpeg?auto=compress&cs=tinysrgb&w=200',
  'soy milk': 'https://images.pexels.com/photos/8965577/pexels-photo-8965577.jpeg?auto=compress&cs=tinysrgb&w=200',
  'coconut milk': 'https://images.pexels.com/photos/4465838/pexels-photo-4465838.jpeg?auto=compress&cs=tinysrgb&w=200',
  'green tea': 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=200',
  'black tea': 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=200',
  honey: 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=200',
  lemon: 'https://images.pexels.com/photos/1427899/pexels-photo-1427899.jpeg?auto=compress&cs=tinysrgb&w=200',
  'olive oil': 'https://images.pexels.com/photos/7431284/pexels-photo-7431284.jpeg?auto=compress&cs=tinysrgb&w=200',
  'chickpeas': 'https://images.pexels.com/photos/4110509/pexels-photo-4110509.jpeg?auto=compress&cs=tinysrgb&w=200',
  'zucchini': 'https://images.pexels.com/photos/4397840/pexels-photo-4397840.jpeg?auto=compress&cs=tinysrgb&w=200',
  'eggplant': 'https://images.pexels.com/photos/1459410/pexels-photo-1459410.jpeg?auto=compress&cs=tinysrgb&w=200',
  'brussels sprouts': 'https://images.pexels.com/photos/40780/pumpkin-autumn-vegetables-squash-40780.jpeg?auto=compress&cs=tinysrgb&w=200',
  pears: 'https://images.pexels.com/photos/113320/pexels-photo-113320.jpeg?auto=compress&cs=tinysrgb&w=200',
  cranberries: 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg?auto=compress&cs=tinysrgb&w=200',
  'pomegranate': 'https://images.pexels.com/photos/113320/pexels-photo-113320.jpeg?auto=compress&cs=tinysrgb&w=200',
  mango: 'https://images.pexels.com/photos/1438624/pexels-photo-1438624.jpeg?auto=compress&cs=tinysrgb&w=200',
  cherries: 'https://images.pexels.com/photos/1445243/pexels-photo-1445243.jpeg?auto=compress&cs=tinysrgb&w=200',
  cucumber: 'https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?auto=compress&cs=tinysrgb&w=200',
  lettuce: 'https://images.pexels.com/photos/1656666/pexels-photo-1656666.jpeg?auto=compress&cs=tinysrgb&w=200',
  peas: 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=200',
  asparagus: 'https://images.pexels.com/photos/40780/pumpkin-autumn-vegetables-squash-40780.jpeg?auto=compress&cs=tinysrgb&w=200',
  'grapefruit': 'https://images.pexels.com/photos/327098/pexels-photo-327098.jpeg?auto=compress&cs=tinysrgb&w=200',
  'sourdough': 'https://images.pexels.com/photos/209206/pexels-photo-209206.jpeg?auto=compress&cs=tinysrgb&w=200',
  bagels: 'https://images.pexels.com/photos/209206/pexels-photo-209206.jpeg?auto=compress&cs=tinysrgb&w=200',
  croissants: 'https://images.pexels.com/photos/209206/pexels-photo-209206.jpeg?auto=compress&cs=tinysrgb&w=200',
};

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getCuratedImage(name) {
  const lower = (name || '').toLowerCase().trim();
  if (!lower) return null;
  if (CURATED_IMAGES[lower]) return CURATED_IMAGES[lower];

  // Singular/plural alignment (e.g. "tomato" <-> "tomatoes").
  for (const [key, url] of Object.entries(CURATED_IMAGES)) {
    if (lower === `${key}s` || `${lower}s` === key) return url;
  }

  // Whole-word containment, longest key wins. This avoids false positives from
  // the old loose substring match (e.g. "water" no longer matches "watermelon",
  // and "olive oil" isn't shadowed by the bare "oil" key).
  let best = null;
  let bestLen = 0;
  for (const [key, url] of Object.entries(CURATED_IMAGES)) {
    if (key.length > bestLen && new RegExp(`\\b${escapeRegex(key)}\\b`).test(lower)) {
      best = url;
      bestLen = key.length;
    }
  }
  return best;
}

export async function resolveImageUrl(name) {
  const key = (name || '').trim().toLowerCase();
  if (!key) return null;
  if (memoryCache.has(key)) return memoryCache.get(key);

  const curated = getCuratedImage(name);
  if (curated) {
    memoryCache.set(key, curated);
    return curated;
  }

  if (!PEXELS_KEY) {
    memoryCache.set(key, null);
    return null;
  }

  const query = `${encodeURIComponent(key)} food product grocery`;
  const url = `https://api.pexels.com/v1/search?query=${query}&per_page=1&orientation=squarish`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(url, {
      headers: { Authorization: PEXELS_KEY },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const photo = data.photos && data.photos[0];
    const img = photo ? photo.src.medium || photo.src.small || photo.src.large : null;
    if (img) memoryCache.set(key, img);
    return img;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function ensureImage(id, name) {
  try {
    const url = await resolveImageUrl(name);
    if (url) updateItem(id, { imageUrl: url });
    return url;
  } catch {
    return null;
  }
}
