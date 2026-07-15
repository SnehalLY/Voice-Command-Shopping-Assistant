export function extractSearchFilters(text, lang = 'en') {
  const lower = text.toLowerCase();
  const filters = { maxPrice: null, minPrice: null, brand: null };

  const ceilingPatterns = [
    /under\s+\$?\s*(\d+(?:\.\d+)?)/i,
    /below\s+\$?\s*(\d+(?:\.\d+)?)/i,
    /cheaper\s+than\s+\$?\s*(\d+(?:\.\d+)?)/i,
    /less\s+than\s+\$?\s*(\d+(?:\.\d+)?)/i,
    /within\s+\$?\s*(\d+(?:\.\d+)?)/i,
    /maximum\s+\$?\s*(\d+(?:\.\d+)?)/i,
    /max\s+\$?\s*(\d+(?:\.\d+)?)/i,
  ];

  const floorPatterns = [
    /over\s+\$?\s*(\d+(?:\.\d+)?)/i,
    /above\s+\$?\s*(\d+(?:\.\d+)?)/i,
    /more\s+than\s+\$?\s*(\d+(?:\.\d+)?)/i,
  ];

  for (const pat of ceilingPatterns) {
    const m = lower.match(pat);
    if (m) { filters.maxPrice = parseFloat(m[1]); break; }
  }
  for (const pat of floorPatterns) {
    const m = lower.match(pat);
    if (m) { filters.minPrice = parseFloat(m[1]); break; }
  }

  const knownItemWords = new Set([
    'milk', 'bread', 'eggs', 'cheese', 'butter', 'yogurt', 'cream', 'curd', 'paneer', 'ghee',
    'apple', 'apples', 'banana', 'bananas', 'orange', 'oranges', 'mango', 'tomato', 'tomatoes',
    'potato', 'potatoes', 'onion', 'onions', 'lettuce', 'spinach', 'carrot', 'carrots',
    'broccoli', 'cucumber', 'lemon', 'lime', 'avocado', 'ginger', 'garlic', 'cilantro', 'mint',
    'strawberry', 'strawberries', 'grape', 'grapes', 'pear', 'pears', 'pepper', 'peppers',
    'watermelon', 'peach', 'peaches', 'corn', 'berry', 'berries', 'pumpkin',
    'rice', 'flour', 'sugar', 'salt', 'oil', 'dal', 'lentil', 'lentils', 'beans', 'pasta',
    'noodles', 'sauce', 'ketchup', 'spices', 'masala', 'honey', 'jam', 'peanut butter',
    'cereal', 'oats', 'vinegar', 'soy sauce', 'mayonnaise',
    'water', 'juice', 'coffee', 'tea', 'soda', 'cola', 'beer', 'wine', 'smoothie', 'lemonade',
    'toothpaste', 'toothbrush', 'deodorant', 'lotion', 'razor', 'face wash', 'sanitizer', 'mask',
    'soap', 'detergent', 'shampoo', 'toilet paper', 'tissue', 'paper towel', 'dishwasher', 'cleaner',
    'chicken', 'beef', 'pork', 'mutton', 'fish', 'salmon', 'shrimp', 'prawns', 'lamb', 'bacon',
    'sausage', 'sausages', 'tuna',
    'bread', 'bun', 'buns', 'bagel', 'bagels', 'croissant', 'croissants', 'cake', 'muffin',
    'muffins', 'pastry', 'pastries', 'tortilla', 'toast',
    'chips', 'biscuit', 'biscuits', 'cookie', 'cookies', 'crackers', 'nuts', 'popcorn',
    'chocolate', 'candy', 'pretzel', 'pretzels', 'namkeen', 'samosa',
    'medicine', 'medication', 'vitamin', 'painkiller', 'tablet', 'syrup', 'bandage',
  ]);

  const stopWords = new Set([
    'the', 'a', 'an', 'of', 'my', 'from', 'to', 'on', 'in', 'for', 'with', 'and',
    'some', 'any', 'is', 'are', 'there', 'do', 'i', 'have', 'me', 'please',
    'organic', 'fresh', 'whole', 'premium', 'natural', 'all', 'pure', 'farm', 'farms',
    'litre', 'liter', 'bottle', 'bottles', 'pack', 'packs', 'carton', 'cartons',
    'piece', 'pieces',
    'under', 'below', 'cheaper', 'less', 'than', 'within', 'maximum', 'max',
    'over', 'above', 'more',
    'dollars', 'dollar', 'rupees', 'rupee', 'euros', 'euro', 'pesos', 'peso',
    'rs', 'inr', 'usd', 'cents', 'cent',
  ]);

  const cleaned = text
    .replace(/\b(find|search|look for|show|where is|do i have|is there|check|locate|look up|do you have|tell me if you have|search for|find me|show me|look for in my list|buscar|encontrar|busca|muestra|dónde está|tengo|hay|verifica|localizar|busca en mi lista|dime si tengo|localiza|encuentra|muéstrame|खोज|खोजो|दिखा|ढूंढ|ढूंढो|चेक|है क्या|मेरी सूची में खोज|बताओ|बताओ क्या है|दिखाओ|तलाश)\b/gi, ' ')
    .replace(/\b(brand|by|from|marca|de la marca|ब्रांड|की)\b/gi, ' ')
    .replace(/\$?\d+(?:\.\d+)?/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const candidates = tokens.filter(w => {
    const lw = w.toLowerCase();
    return w.length > 2 && !knownItemWords.has(lw) && !stopWords.has(lw) && /^[a-zA-Z0-9&.'-]+$/.test(w);
  });

  if (candidates.length > 0) {
    filters.brand = candidates.join(' ').replace(/[^a-zA-Z0-9\s&.'-]/g, '').trim();
    if (filters.brand.length < 2) filters.brand = null;
  }

  return filters;
}
