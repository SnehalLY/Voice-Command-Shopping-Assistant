// Emoji helpers for category/product badges used in suggestion + list cards.
const CATEGORY_EMOJI = {
  'Dairy & Eggs': '🥛',
  Dairy: '🥛',
  Produce: '🥬',
  Bakery: '🍞',
  Pantry: '🫙',
  Beverages: '🥤',
  Snacks: '🍪',
  'Meat & Seafood': '🥩',
  Frozen: '🧊',
  Household: '🧼',
  'Personal Care': '🧴',
  Pharmacy: '💊',
  Other: '🛒',
};

const NAME_EMOJI = {
  milk: '🥛',
  cheese: '🧀',
  butter: '🧈',
  yogurt: '🥛',
  egg: '🥚',
  eggs: '🥚',
  bread: '🍞',
  sourdough: '🍞',
  croissant: '🥐',
  bagel: '🥯',
  apple: '🍎',
  banana: '🍌',
  orange: '🍊',
  strawberry: '🍓',
  avocado: '🥑',
  grape: '🍇',
  spinach: '🥬',
  tomato: '🍅',
  potato: '🥔',
  onion: '🧅',
  mango: '🥭',
  watermelon: '🍉',
  peach: '🍑',
  corn: '🌽',
  carrot: '🥕',
  broccoli: '🥦',
  pasta: '🍝',
  rice: '🍚',
  oil: '🫒',
  cereal: '🥣',
  honey: '🍯',
  coffee: '☕',
  tea: '🍵',
  water: '💧',
  soda: '🥤',
  juice: '🧃',
  toothpaste: '🪥',
  shampoo: '🧴',
  soap: '🧼',
  detergent: '🧴',
};

export function categoryEmoji(category) {
  return CATEGORY_EMOJI[category] || CATEGORY_EMOJI.Other;
}

export function itemEmoji(name = '', category = '') {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(NAME_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return categoryEmoji(category);
}
