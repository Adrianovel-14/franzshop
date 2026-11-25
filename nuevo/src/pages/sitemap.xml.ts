// Mapa del sitio para Google: franzshopp.com/sitemap.xml
// Lista todas las páginas que Google debe conocer: inicio, categorías y cada producto.
// Se arma solo al compilar: si se agrega un producto, aparece aquí sin tocar nada.
import type { APIRoute } from 'astro';
import { todasLasRutas, url } from '../lib/seo';

export const GET: APIRoute = () => {
  const hoy = new Date().toISOString().slice(0, 10);
  const items = todasLasRutas()
    .map((r) => `  <url><loc>${url(r)}</loc><lastmod>${hoy}</lastmod></url>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
