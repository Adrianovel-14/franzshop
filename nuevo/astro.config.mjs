// Tienda nueva de Franzshopp. Se publica en /franzshop/nuevo/ junto a la tienda actual.
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://adrianovel-14.github.io',
  base: process.env.BASE ?? '/franzshop/nuevo',
  trailingSlash: 'ignore',
  integrations: [react()],
  build: { format: 'directory' },
});
