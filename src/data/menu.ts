// Menu content. Edit prices/items here — the menu page renders whatever this exports.
// Items without a price render cleanly with no price shown (awaiting prices from Diego
// for Breakfast, Sides and Extras).

export interface MenuItem {
  name: string;
  description?: string;
  price?: string; // single price, e.g. "$6"
  prices?: { regular: string; large: string };
  badge?: string; // e.g. "Most Popular"
  dietary?: ('V' | 'VG' | 'GF')[];
}

export interface MenuCategory {
  id: string;
  title: string;
  note?: string;
  items: MenuItem[];
}

export const MENU: MenuCategory[] = [
  {
    id: 'bowls',
    title: 'Bowls',
    note: 'Poke & donburi — Regular $18 / Large $20',
    items: [
      {
        name: 'Japanese Fried Chicken',
        description: 'Crispy, juicy karaage chicken over fresh rice',
        prices: { regular: '$18', large: '$20' },
        badge: 'Most Popular',
      },
      {
        name: 'Salmon',
        description: 'Fresh marinated salmon with vibrant toppings',
        prices: { regular: '$18', large: '$20' },
      },
      {
        name: 'Crispy Prawns',
        description: 'Lightly battered prawns with a golden crunch',
        prices: { regular: '$18', large: '$20' },
      },
      {
        name: 'Calamari',
        description: 'Golden-fried calamari with a hint of spice',
        prices: { regular: '$18', large: '$20' },
      },
      {
        name: 'Tuna',
        description: 'Premium tuna with a light, fresh flavour',
        prices: { regular: '$18', large: '$20' },
      },
      {
        name: 'Tofu',
        description: 'Crispy tofu with fresh vegetables and bold sauce',
        prices: { regular: '$18', large: '$20' },
        dietary: ['VG'],
      },
    ],
  },
  {
    id: 'breakfast',
    title: 'Breakfast',
    items: [
      { name: 'Coffee' },
      { name: 'Matcha' },
      { name: 'Avocado Toast' },
      { name: 'Sandos', description: 'Japanese-style sandwiches' },
      { name: 'Fruit Cups' },
      { name: 'Açaí' },
    ],
  },
  {
    id: 'sides',
    title: 'Sides',
    items: [
      { name: 'Chicken Bites' },
      { name: 'Prawn Tempura', description: 'Lightly battered prawns with a crispy crunch' },
      { name: 'Miso Soup' },
    ],
  },
  {
    id: 'extras',
    title: 'Extras',
    items: [
      { name: 'Extra Avocado' },
      { name: 'Extra Protein' },
      { name: 'Brown Rice Upgrade' },
    ],
  },
];

// The three bowls featured on the homepage.
export const BEST_SELLERS = ['Japanese Fried Chicken', 'Salmon', 'Crispy Prawns'];
