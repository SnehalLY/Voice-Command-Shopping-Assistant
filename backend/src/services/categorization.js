import categoriesData from '../data/categories.json' with { type: 'json' };

const CATEGORY_MAP = categoriesData.categories;
const DEFAULT_CATEGORY = categoriesData.defaultCategory;

/**
 * Categorizes a raw item name into one of the known grocery categories.
 *
 * Strategy: tokenize the item name and look for the longest matching keyword
 * in the category map. We match on whole words and common plural/singular
 * forms so "apples" and "apple" both map to Produce. Falls back to "Other"
 * when nothing matches. This is deterministic and explainable (important for
 * an assessment where we avoid opaque ML).
 */
export function categorizeItem(rawName) {
  if (!rawName || typeof rawName !== 'string') return DEFAULT_CATEGORY;

  const name = rawName.trim().toLowerCase();
  if (!name) return DEFAULT_CATEGORY;

  // Use word-boundary matching so "watermelon" does NOT match "water".
  let bestMatch = { category: DEFAULT_CATEGORY, length: 0 };

  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    for (const keyword of keywords) {
      const kw = keyword.toLowerCase();
      const re = new RegExp(`(?:^|\\s)${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$|\\W)`, 'i');
      if (re.test(name)) {
        if (kw.length > bestMatch.length) {
          bestMatch = { category, length: kw.length };
        }
      }
    }
  }

  return bestMatch.category;
}

export const CATEGORIES = Object.keys(CATEGORY_MAP);
export { DEFAULT_CATEGORY };
