import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://loveichiban.co.nz',
  output: 'static',
  integrations: [sitemap()],
  build: {
    assets: 'assets',
  },
});
