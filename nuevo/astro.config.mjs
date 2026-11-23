// Tienda de Franzshopp (diseño nuevo). Se publica en https://franzshopp.com (Cloudflare Pages).
// Mientras tanto sigue también en GitHub Pages bajo /franzshop/nuevo/ (el workflow pasa BASE, SITE y FOTOS).
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: process.env.SITE ?? 'https://franzshopp.com',
  base: process.env.BASE ?? '/',
  trailingSlash: 'ignore',
  integrations: [react()],
  build: { format: 'directory' },
});
