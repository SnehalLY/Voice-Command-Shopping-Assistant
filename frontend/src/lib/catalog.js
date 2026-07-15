// Static "fresh catalog" used by the Catalog section. These are reference
// products the assistant can add to the list or filter by voice. Images are
// remote (Unsplash) so they work without any backend image lookup.
export const CATALOG_CATEGORIES = [
  'all',
  'Dairy & Eggs',
  'Produce',
  'Pantry',
  'Bakery',
];

export const catalogProducts = [
  { id: 1, name: 'Organic Avocados', price: 1.99, category: 'Produce', brand: 'Fresh Farms', emoji: '🥑', image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=400&q=80' },
  { id: 2, name: 'Whole Sourdough Bread', price: 4.50, category: 'Bakery', brand: 'Artisan Oven', emoji: '🍞', image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=400&q=80' },
  { id: 3, name: 'Organic Strawberries', price: 3.49, category: 'Produce', brand: 'Berry Good', emoji: '🍓', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=400&q=80' },
  { id: 4, name: 'Whole Grass-Fed Milk', price: 4.99, category: 'Dairy & Eggs', brand: 'Maple Hills', emoji: '🥛', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80' },
  { id: 5, name: 'Premium Almond Milk', price: 3.99, category: 'Dairy & Eggs', brand: 'Silk & Nut', emoji: '🥛', image: 'https://images.unsplash.com/photo-1553456558-aff63285bdd1?auto=format&fit=crop&w=400&q=80' },
  { id: 6, name: 'Organic Farm Eggs (Dozen)', price: 5.49, category: 'Dairy & Eggs', brand: 'Pasture Joy', emoji: '🥚', image: 'https://images.unsplash.com/photo-1516448424440-9dbca97779c1?auto=format&fit=crop&w=400&q=80' },
  { id: 7, name: 'Extra Virgin Olive Oil', price: 12.99, category: 'Pantry', brand: 'Tuscany Gold', emoji: '🫒', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80' },
  { id: 8, name: 'All-Natural Toothpaste', price: 4.29, category: 'Pantry', brand: 'Minty Fresh', emoji: '🪥', image: 'https://images.unsplash.com/photo-1559599141-3816a0b26114?auto=format&fit=crop&w=400&q=80' },
  { id: 9, name: 'French Croissants', price: 3.25, category: 'Bakery', brand: 'Artisan Oven', emoji: '🥐', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80' },
  { id: 10, name: 'Fresh Baby Spinach', price: 2.89, category: 'Produce', brand: 'Green Leaf', emoji: '🥬', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&q=80' },
];
