// Tienda de Franzshopp (diseño nuevo). Se publica en https://franzshopp.com (Cloudflare Pages).
// BASE, SITE y FOTOS se pueden cambiar con variables de entorno (antes se usaban para la copia en GitHub Pages).
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: process.env.SITE ?? 'https://franzshopp.com',
  base: process.env.BASE ?? '/',
  trailingSlash: 'ignore',
  integrations: [react()],
  build: { format: 'directory' },
});
