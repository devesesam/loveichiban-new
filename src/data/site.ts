// Single source of truth for business details.
// Edit here — every component (header, footer, contact blocks, JSON-LD) reads from this.

export interface OpeningHours {
  days: string; // e.g. "Mon – Fri"
  open: string; // e.g. "11:00am"
  close: string; // e.g. "8:00pm"
}

export const SITE = {
  name: 'Ichiban Pokedon',
  legalName: 'Ichiban',
  tagline: 'Fresh Japanese Poke & Donburi',
  url: 'https://loveichiban.co.nz',

  phone: '027 371 6608',
  phoneHref: 'tel:+64273716608',
  email: 'talktoichiban@hotmail.com',

  address: {
    venue: 'The Historic Village',
    street: '17th Ave West',
    suburb: 'Tauranga South',
    city: 'Tauranga',
    region: 'Bay of Plenty',
    country: 'New Zealand',
  },

  // PLACEHOLDER: awaiting confirmed hours from Diego.
  // While this array is empty the site shows a "call us for current hours" line.
  // Fill like: { days: 'Mon – Fri', open: '11:00am', close: '8:00pm' },
  hours: [] as OpeningHours[],

  socials: {
    facebook: 'https://facebook.com/ichiban.caravan',
    instagram: 'https://instagram.com/ichiban.caravan',
    instagramHandle: '@ichiban.caravan',
  },

  // Query-based embed: needs no API key, geocodes the address server-side.
  mapsEmbedSrc:
    'https://www.google.com/maps?q=The+Historic+Village,+17th+Ave+West,+Tauranga&output=embed',
  mapsLink:
    'https://www.google.com/maps/search/?api=1&query=The+Historic+Village+17th+Ave+West+Tauranga',

  nav: [
    { label: 'About', href: '/' },
    { label: 'Menu', href: '/menu' },
    { label: 'Catering', href: '/catering' },
    { label: 'Contact', href: '/contact' },
  ],
} as const;

export function formatAddress(): string {
  const a = SITE.address;
  return `${a.venue}, ${a.street}, ${a.suburb}, ${a.city}`;
}
