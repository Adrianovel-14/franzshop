// Todo lo que es para Google (SEO): títulos, descripciones, textos de categoría,
// apodos de las herramientas y los "datos estructurados" (JSON-LD) que Google lee para mostrar precio y stock.
import { productos, categorias, catPorId, foto, soles, agotado, negocio, whatsapp, sitio, type Producto } from './datos';

// ---------- dirección completa de una página ----------
export const url = (ruta: string) => sitio + ruta;
export const rutaCategoria = (id: string) => `/categoria/${id}/`;
export const rutaProducto = (id: string) => `/producto/${id}/`;

// ---------- textos de cada categoría (salen en su página y en Google) ----------
const intro: Record<string, string> = {
  combos: 'Kits de herramientas Total 20V en un solo pedido, con baterías y cargador según el combo.',
  inalambricas: 'Herramientas inalámbricas Total de la línea 20V: taladros, llaves de impacto, amoladoras, rotomartillos y más.',
  cabezales: 'Herramientas Total 20V sin batería ni cargador. Si ya tienes baterías 20V de Total, llevas solo la herramienta y ahorras.',
  '42v-16v': 'Herramientas Total de las líneas 42V y 16V: amoladoras, llaves de impacto y taladros.',
  electricas: 'Herramientas eléctricas Total a cable: taladros, amoladoras, sierras, compresoras, hidrolavadoras y más.',
  baterias: 'Baterías y cargadores Total 20V. Funcionan con toda la línea 20V.',
  medicion: 'Niveles láser y herramientas de medición Total.',
  accesorios: 'Sets de dados, brocas, puntas, discos, maletas y accesorios para tus herramientas.',
  wadfow: 'Herramientas y accesorios de la marca Wadfow.',
};
export const textoCategoria = (id: string) => intro[id] ?? '';
export const tituloCategoria = (id: string) => {
  const c = catPorId[id];
  const marca = id === 'wadfow' ? '' : ' Total';
  return `${c?.nombre}${marca} – Precios en Perú | Franzshopp`;
};
export const descripcionCategoria = (id: string) =>
  `${textoCategoria(id)} Precios en soles y envío a todo el Perú desde ${negocio.ciudad}. Pide por WhatsApp.`;

// ---------- apodos: cómo le dice la gente a cada herramienta ----------
// Salen en la ficha ("También le dicen: chicharra, matraca") para que Google la encuentre con esas palabras.
// Son solo los nombres populares del diccionario del buscador (web/diccionario.js), sin errores de tipeo.
// Solo se ponen si el producto ES esa herramienta: el nombre tiene que EMPEZAR con la palabra
// (sin contar "Cabezal" o "Set de"). Así un combo que incluye una amoladora no sale como "esmeril".
// Si agregas uno: 'cómo empieza el nombre del producto': ['apodo 1', 'apodo 2'].
const apodos: Record<string, string[]> = {
  'llave ratchet': ['chicharra', 'matraca'],
  dados: ['copas'],
  amoladora: ['esmeril', 'galletera'],
  'sierra sable': ['serrucho eléctrico'],
  'sierra caladora': ['serrucho eléctrico'],
  motosierra: ['sierra de cadena'],
  dremel: ['mototool', 'minitorno'],
  router: ['rebajadora', 'fresadora'],
  atornillador: ['destornillador eléctrico'],
  'llave de impacto': ['pistola de impacto'],
  rotomartillo: ['martillo eléctrico'],
  'martillo demoledor': ['rompedor', 'rompepavimento'],
  brocas: ['mechas'],
  hidrolavadora: ['lavadora a presión'],
  'pistola calor': ['decapador'],
  wincha: ['cinta métrica', 'flexómetro'],
};
const sinTildes = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export function apodosDe(p: Producto): string[] {
  if (p.cat === 'combos') return [];
  const nombre = sinTildes(p.nombre).replace(/^((cabezal|set de|juego de)\s+)+/, '');
  const lista = Object.entries(apodos).filter(([palabra]) => nombre.startsWith(sinTildes(palabra))).flatMap(([, a]) => a);
  return [...new Set(lista)];
}

// ---------- título y descripción de cada producto ----------
// Ej.: "Llave de impacto 1750Nm 20V Total – Precio en Perú | Franzshopp"
// Google corta los títulos de más de ~70 letras: si no entra, se quita primero la marca y luego "Precio en Perú".
export function tituloProducto(p: Producto) {
  const marca = sinTildes(p.nombre).includes(sinTildes(p.marca)) ? '' : ' ' + p.marca;
  const opciones = [
    `${p.nombre}${marca} – Precio en Perú | Franzshopp`,
    `${p.nombre} – Precio en Perú | Franzshopp`,
    `${p.nombre}${marca} | Franzshopp`,
  ];
  return opciones.find((t) => t.length <= 70) ?? `${p.nombre} | Franzshopp`;
}
export function descripcionProducto(p: Producto) {
  const partes = [
    `${p.nombre} ${p.marca} a ${soles(p.precio)}.`,
    p.incluye ? `Incluye ${p.incluye.replace(/\s*-\s+/g, ', ').replace(/^,\s*/, '')}.` : '',
    `Envío a todo el Perú desde ${negocio.ciudad}. Pide por WhatsApp.`,
  ].filter(Boolean);
  let d = partes.join(' ').replace(/\s+/g, ' ');
  // Google muestra ~155 letras: si es más largo, se acorta el "Incluye" sin cortar palabras
  if (d.length > 160) {
    const fin = ` Envío a todo el Perú desde ${negocio.ciudad}. Pide por WhatsApp.`;
    const inicio = partes.slice(0, 2).join(' ');
    d = inicio.slice(0, 160 - fin.length - 1).replace(/\s+\S*$/, '').replace(/[,.;:]$/, '') + '…' + fin;
  }
  // nombres muy largos: se corta al final sin partir palabras
  if (d.length > 160) d = d.slice(0, 157).replace(/\s+\S*$/, '') + '…';
  return d;
}

// ---------- datos estructurados (JSON-LD) ----------
// Google los lee (no se ven en la página) para entender qué es cada página:
// la tienda, un producto con su precio y stock, y la ruta Inicio > Categoría > Producto.
const tienda = {
  '@type': 'OnlineStore',
  '@id': url('/#tienda'),
  name: 'Franzshopp',
  url: url('/'),
  logo: url('/logo-franzshopp.png'),
  description: 'Herramientas Total con envío a todo el Perú desde Arequipa. Pedidos por WhatsApp.',
  telephone: '+' + whatsapp,
  address: { '@type': 'PostalAddress', addressLocality: negocio.ciudad, addressCountry: 'PE' },
  areaServed: { '@type': 'Country', name: 'Perú' },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'ventas',
    telephone: '+' + whatsapp,
    availableLanguage: 'es',
    hoursAvailable: { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '08:30', closes: '22:30' },
  },
};

export const schemaInicio = () => ({
  '@context': 'https://schema.org',
  '@graph': [tienda, { '@type': 'WebSite', '@id': url('/#web'), url: url('/'), name: 'Franzshopp', inLanguage: 'es-PE', publisher: { '@id': url('/#tienda') } }],
});

const migas = (items: [string, string][]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, ruta], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url(ruta) })),
});

export function schemaProducto(p: Producto) {
  const c = catPorId[p.cat];
  const imagen = p.foto ? new URL(foto(p), sitio + '/').href : undefined;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: p.nombre,
        sku: p.id,
        brand: { '@type': 'Brand', name: p.marca },
        category: c?.nombre,
        description: descripcionProducto(p),
        ...(imagen ? { image: imagen } : {}),
        offers: {
          '@type': 'Offer',
          url: url(rutaProducto(p.id)),
          price: p.precio.toFixed(2),
          priceCurrency: 'PEN',
          availability: agotado(p.id) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: { '@id': url('/#tienda') },
        },
      },
      migas([['Inicio', '/'], [c?.nombre ?? 'Catálogo', rutaCategoria(p.cat)], [p.nombre, rutaProducto(p.id)]]),
    ],
  };
}

export function schemaCategoria(id: string) {
  const c = catPorId[id];
  const lista = productos.filter((p) => p.cat === id);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: c?.nombre,
        url: url(rutaCategoria(id)),
        description: descripcionCategoria(id),
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: lista.length,
          itemListElement: lista.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: url(rutaProducto(p.id)), name: p.nombre })),
        },
      },
      migas([['Inicio', '/'], [c?.nombre ?? 'Catálogo', rutaCategoria(id)]]),
    ],
  };
}

// Para el mapa del sitio
export const todasLasRutas = () => ['/', ...categorias.map((c) => rutaCategoria(c.id)), ...productos.map((p) => rutaProducto(p.id))];
