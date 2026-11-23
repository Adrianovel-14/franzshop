// Lee el catálogo y las campañas de la tienda actual (web/data.js y web/banners.js).
// Así hay una sola fuente: si cambias un precio o una oferta allí, cambia en las dos tiendas.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

export type Producto = {
  id: string; nombre: string; marca: string; cat: string; precio: number;
  potencia?: string; incluye?: string; uso?: string; texto?: string; foto?: string;
};
export type Categoria = { id: string; nombre: string; corto: string; total: number };
export type Banner = {
  tema?: string; etiqueta?: string; titulo: string; texto?: string;
  boton?: { texto: string; ir: string }; productos?: string[];
  ofertas?: Record<string, number>; desde?: string; hasta?: string; lugar?: string;
};

function leer(archivo: string) {
  const window: Record<string, unknown> = {};
  const ruta = resolve(process.cwd(), '../web', archivo);
  if (!existsSync(ruta)) return window;
  runInNewContext(readFileSync(ruta, 'utf8'), { window });
  return window;
}
const w = { ...leer('data.js'), ...leer('banners.js'), ...leer('agotados.js') } as any;

export const tienda = w.FS as { tienda: string; whatsapp: string; categorias: Categoria[]; productos: Producto[] };
export const productos = tienda.productos;
export const categorias = tienda.categorias;
export const whatsapp = tienda.whatsapp;
export const porId = Object.fromEntries(productos.map((p) => [p.id, p]));
export const catPorId = Object.fromEntries(categorias.map((c) => [c.id, c]));
export const banners: Banner[] = w.FS_BANNERS ?? [];

// Productos sin stock (web/agotados.js). Si un código no existe, se avisa al compilar.
const listaAgotados: string[] = Array.isArray(w.FS_AGOTADOS) ? w.FS_AGOTADOS.map((s: unknown) => String(s).trim()).filter(Boolean) : [];
for (const id of listaAgotados) {
  if (!porId[id]) console.warn(`[agotados.js] No existe ningún producto con el código "${id}". Revisa que esté bien escrito.`);
}
const setAgotados = new Set(listaAgotados);
export const agotado = (id: string) => setAgotados.has(id);

// Datos del negocio (pie de página, mensajes y, más adelante, Google)
export const negocio = {
  ciudad: 'Arequipa',
  //   = espacio que no se corta (para que "p. m." no quede partido en dos líneas)
  horario: 'lunes a sábado, 8:30 a. m. a 10:30 p. m.',
  recojo: 'Recojo en almacén en Arequipa, coordinando por WhatsApp',
};

export const soles = (n: number) =>
  'S/ ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
// Dirección completa de la tienda (para links que se mandan por WhatsApp)
export const sitio = (process.env.SITE ?? 'https://franzshopp.com') + base;
export const avisameTexto = (p: Producto) =>
  `Hola Franzshopp, ¿me avisan cuando tengan stock de: ${p.nombre}? ${sitio}/producto/${p.id}/`;
// En franzshopp.com las fotos van dentro de la propia tienda (/fotos).
// En la copia de GitHub Pages se toman de la tienda actual (/franzshop/fotos) para no subirlas dos veces.
export const fotosBase = process.env.FOTOS ?? base;
export const foto = (p?: Producto) => (p?.foto ? `${fotosBase}/${p.foto}` : '');
export const waLink = (texto: string) => `https://wa.me/${whatsapp}?text=${encodeURIComponent(texto)}`;
export const minimoDe = (cat: string) => Math.min(...productos.filter((p) => p.cat === cat).map((p) => p.precio));

// Foto de portada de cada categoría (las mismas que la tienda actual)
const portadas: Record<string, string> = {
  combos: 'combo-constructor-5-en-1-20v', inalambricas: 'taladro-percutor-66nm-20v', cabezales: 'cabezal-sierra-ingleteadora-20v',
  '42v-16v': 'amoladora-2600w-9-42v', electricas: 'sierra-circular-1600w', baterias: 'bateria-10ah-20v',
  medicion: 'nivel-laser-12-lineas-20v', accesorios: 'set-de-dados-de-alto-impacto-10-piezas', wadfow: 'mesa-de-trabajo',
};
export const portada = (cid: string) => {
  const p = porId[portadas[cid]];
  return p?.foto ? p : productos.find((x) => x.cat === cid && x.foto);
};
