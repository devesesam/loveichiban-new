import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://loveichiban.co.nz',
  output: 'static',
  build: {
    assets: 'assets',
  },
});
