// Reglas para los buscadores: franzshopp.com/robots.txt
// Deja que Google vea toda la tienda y le dice dónde está el mapa del sitio.
import type { APIRoute } from 'astro';
import { url } from '../lib/seo';

export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${url('/sitemap.xml')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
