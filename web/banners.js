/* Pantallas del carrusel de portada.
   Para cambiar una campaña (Navidad, Día del Padre, Cyber, etc.) edita solo este archivo.

   Campos de cada pantalla:
   - tema:      'noche' | 'navidad' | 'turquesa' | 'claro'  (colores de la pantalla)
   - lugar:     (opcional) sale con un pin de ubicación y el dibujo del Misti (solo en el diseño nuevo)
   - etiqueta:  texto chico de arriba
   - titulo:    frase principal (corta, hasta ~7 palabras)
   - texto:     una línea de apoyo
   - boton:     { texto, ir } donde ir puede ser:
                  'cat:combos'      → abre el catálogo filtrado por esa categoría
                  'buscar:taladro'  → busca esa palabra en el catálogo
                  'whatsapp'        → abre WhatsApp
                  '#catalogo'       → baja al catálogo
   - productos: ids de productos (ver data/catalogo.json) que salen en la foto de la pantalla
   - ofertas:   (opcional) precio de oferta por producto, ej. { 'combo-carpintero-pro-4-en-1-20v': 599 }
                Si pones una oferta, el precio normal sale tachado. No inventes ofertas: pon solo las reales.
   - desde:     (opcional) id de categoría; reemplaza {desde} en el texto por el precio más bajo de esa categoría
   - hasta:     (opcional) fecha 'AAAA-MM-DD'; después de esa fecha la pantalla deja de salir
*/
window.FS_BANNERS = [
  {
    tema: 'navidad',
    etiqueta: 'Navidad 2026',
    titulo: 'Regala herramientas esta Navidad',
    texto: 'Combos con baterías, cargador y maletín, listos para regalar.',
    boton: { texto: 'Ver combos para regalar', ir: 'cat:combos' },
    productos: ['combo-carpintero-pro-4-en-1-20v', 'combo-mecanico-4-en-1-20v', 'combo-corta-perfora-y-atornilla-5-en-1-20v'],
    ofertas: {},
    hasta: '2026-12-31',
  },
  {
    tema: 'noche',
    etiqueta: 'Distribuidor de herramientas Total',
    titulo: 'Herramientas Total, listas para tu obra',
    texto: 'Elige, agrega al pedido y lo cerramos por WhatsApp.',
    boton: { texto: 'Ver catálogo', ir: '#catalogo' },
    productos: ['combo-constructor-5-en-1-20v', 'llave-de-impacto-1750nm-20v', 'amoladora-1200-20v'],
  },
  {
    tema: 'turquesa',
    etiqueta: '¿Ya tienes baterías 20V?',
    titulo: 'Lleva solo la herramienta',
    texto: 'Cabezales sin batería desde {desde}. Funcionan con toda la línea 20V.',
    desde: 'cabezales',
    boton: { texto: 'Ver cabezales', ir: 'cat:cabezales' },
    productos: ['cabezal-sierra-ingleteadora-20v', 'cabezal-llave-de-impacto-1750nm-20v', 'cabezal-motosierra-12-20v'],
  },
  {
    tema: 'claro',
    lugar: 'Arequipa, Perú',
    etiqueta: 'Somos de Arequipa',
    titulo: 'Desde Arequipa a todo el Perú',
    texto: 'Despachamos desde nuestro almacén en Arequipa, o recoge tu pedido ahí. Te confirmamos stock y envío por WhatsApp.',
    boton: { texto: 'Escribir por WhatsApp', ir: 'whatsapp' },
    productos: ['nivel-laser-12-lineas-20v', 'bateria-10ah-20v', 'taladro-percutor-166nm-20v'],
  },
];
