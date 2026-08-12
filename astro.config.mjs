import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://loveichiban.co.nz',
  output: 'static',
  integrations: [
    sitemap({
      // The catering brochure page is unlisted (QR-code access only) and carries
      // a noindex tag — keep it out of the sitemap too.
      filter: (page) => !page.includes('/event-catering-guide-2026'),
    }),
  ],
  build: {
    assets: 'assets',
  },
});
