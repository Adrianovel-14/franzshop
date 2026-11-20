// Importa el JSON exportado del catálogo de WhatsApp: separa fotos y arma data/catalogo.json
import fs from 'node:fs';
import path from 'node:path';
const src = process.argv[2];
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const raw = JSON.parse(fs.readFileSync(src, 'utf8'));

const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fixes = [
  [/PEECUTOR/g, 'PERCUTOR'], [/EMBASE/g, 'ENVASE'], [/DREMMELS?/g, 'DREMEL'], [/MINIDREMMEL/g, 'MINIDREMEL'], [/ENGRAMPADORA/g, 'ENGRAPADORA'],
  [/LUMINES/g, 'LÚMENES'], [/LASER/g, 'LÁSER'], [/LINEAS/g, 'LÍNEAS'], [/BATERIAS/g, 'BATERÍAS'], [/BATERIA/g, 'BATERÍA'],
  [/MECANICAS/g, 'MECÁNICAS'], [/MECANICO/g, 'MECÁNICO'], [/ELECTRICO/g, 'ELÉCTRICO'], [/ELECTRICAS/g, 'ELÉCTRICAS'], [/METALICO/g, 'METÁLICO'],
  [/TELESCOPICA/g, 'TELESCÓPICA'], [/PROTECCION/g, 'PROTECCIÓN'], [/TERMOFUSION/g, 'TERMOFUSIÓN'], [/SUCCION/g, 'SUCCIÓN'], [/MAQUINA/g, 'MÁQUINA'],
  [/AUTOMATICO/g, 'AUTOMÁTICO'], [/MALETIN/g, 'MALETÍN'], [/POLIESTER/g, 'POLIÉSTER'], [/TRIPODE/g, 'TRÍPODE'], [/CAUTIL/g, 'CAUTÍN'],
  [/71\/4"/g, '7¼"'], [/5 1\/2"/g, '5½"'],
];
const unit = (w) => {
  if (/^\d+(\.\d+)?NM$/.test(w)) return w.replace('NM', 'Nm');
  if (/^\d+(\.\d+)?AH$/.test(w)) return w.replace('AH', 'Ah');
  if (/^\d+(\.\d+)?MM$/.test(w)) return w.replace('MM', 'mm');
  if (/^\d+(\.\d+)?M$/.test(w)) return w.replace('M', ' m');
  if (/^\d+(\.\d+)?(V|W|J|A|L|KG)$/i.test(w)) return w.toUpperCase().replace('KG', ' kg');
  if (/^(MIG|MMA|TIG|SDS|DC|AC|PPR|II)$/.test(w)) return w;
  return null;
};
function nice(name) {
  let n = name.trim();
  fixes.forEach(([a, b]) => { n = n.replace(a, b); });
  let marca = 'Total';
  if (/WADFOW/.test(n)) marca = 'Wadfow';
  if (/BOMTEX/.test(n)) marca = 'Bomtex';
  n = n.replace(/\s+(TOTAL|WADFOW|BOMTEX)$/,'').replace(/^(.*) (WADFOW|BOMTEX) (.*)$/, '$1 $3');
  const words = n.split(/\s+/).map((w, i) => unit(w) ?? (i === 0 ? w.charAt(0) + w.slice(1).toLowerCase() : w.toLowerCase()));
  return { nombre: words.join(' ').replace(/ \+ ?/g, ' + ').replace(/\s+/g, ' '), marca };
}
const boiler = /\s*(Producto con garant[ií]a\.?|Productos? con diferentes granos|Empresa (100% )?[Cc]onfiable|(Hacemos|Realizamos|realizamos) env[ií]os? a todo el [Pp]er[uú]\.?)\s*/g;
function parse(desc) {
  const d = desc.replace(boiler, ' ').replace(/\s+/g, ' ').trim();
  const grab = (re) => { const m = d.match(re); return m ? m[1].trim().replace(/[.,]$/, '') : undefined; };
  const potencia = grab(/[Pp]r?o?tencia:?\s*([\d.,]+\s?(?:V|W|HP)(?:\s?-\s?[\d.]+V)?)/);
  const incluye = grab(/[Ii]ncluye:?\s*(.+?)(?=\s+Utilidad|\s+utilidad|$)/);
  const uso = grab(/[Uu]tilidad:?,?\s*(?:para |en )?(.+)$/);
  return { potencia, incluye, uso, texto: d };
}
function cat(N) {
  if (/^COMBO|^SET DE HERRAMIENTAS .*\+/.test(N)) return 'combos';
  if (/WADFOW/.test(N)) return 'wadfow';
  if (/^CABEZAL/.test(N)) return 'cabezales';
  if (/BATERIA DE AUTO/.test(N)) return 'electricas';
  if (/BATERIAS? (DE )?\d|^BATERIA|^CARGADOR \d|ESTACION DE BATERIAS/.test(N)) return 'baterias';
  if (/^SET DE |^DISCO|^CLAVOS|^GRAPAS|^ADAPTADOR|^TORQUIMETRO|^MALET/.test(N)) return 'accesorios';
  if (/^MOTOSIERRA 16/.test(N)) return 'inalambricas';
  if (/NIVEL LASER|TRIPODE|DETECTOR|MULTITESTER|WINCHA/.test(N)) return 'medicion';
  if (/\b(42V|16V)\b/.test(N)) return '42v-16v';
  if (/\b20V\b|\b4V\b/.test(N)) return 'inalambricas';
  if (/\d+W\b|COMPRESORA|SOLDAR \d|MAQUINA DE SOLDAR|\d+A\b/.test(N)) return 'electricas';
  return 'accesorios';
}
const categorias = [
  { id: 'combos', nombre: 'Combos', corto: 'Combos' },
  { id: 'inalambricas', nombre: 'Inalámbricas 20V', corto: 'Inalámbricas' },
  { id: 'cabezales', nombre: 'Cabezales sin batería', corto: 'Cabezales' },
  { id: '42v-16v', nombre: 'Línea 42V y 16V', corto: '42V y 16V' },
  { id: 'electricas', nombre: 'Eléctricas a cable', corto: 'Eléctricas' },
  { id: 'baterias', nombre: 'Baterías y cargadores', corto: 'Baterías' },
  { id: 'medicion', nombre: 'Láser y medición', corto: 'Medición' },
  { id: 'accesorios', nombre: 'Accesorios y sets', corto: 'Accesorios' },
  { id: 'wadfow', nombre: 'Wadfow', corto: 'Wadfow' },
];
const fotosDir = path.join(root, 'web', 'fotos');
fs.mkdirSync(fotosDir, { recursive: true });
const seen = {};
const productos = raw.productos.map((p) => {
  const { nombre, marca } = nice(p.nombre);
  let id = slug(nombre); if (seen[id]) id += '-' + (++seen[id]); else seen[id] = 1;
  let foto = null;
  if (p.foto) {
    const b64 = p.foto.split(',')[1];
    foto = `fotos/${id}.webp`;
    fs.writeFileSync(path.join(root, 'web', foto), Buffer.from(b64, 'base64'));
  }
  return { id, nombre, marca, cat: cat(p.nombre), precio: p.precio, ...parse(p.desc), foto, original: p.nombre };
});
categorias.forEach((c) => { c.total = productos.filter((p) => p.cat === c.id).length; });
const out = {
  tienda: 'Franzshopp', whatsapp: '51955769076',
  fuente: 'Catálogo de WhatsApp Business de Franzshopp, ' + raw.fecha,
  lema: 'En nuestra tienda online encontrará productos de la mejor calidad y garantía, asesoría constante y el mejor servicio',
  categorias, productos,
};
fs.writeFileSync(path.join(root, 'data', 'catalogo.json'), JSON.stringify(out, null, 1));
console.log(productos.length, 'productos ·', productos.filter((p) => p.foto).length, 'con foto');
console.log(categorias.map((c) => c.id + ':' + c.total).join(' '));
console.log(productos.filter((p) => !p.foto).map((p) => p.nombre).join(' | '));
console.log(productos.slice(0, 200).map((p) => p.cat.padEnd(12) + p.nombre + ' — ' + p.precio).join('\n'));
fs.writeFileSync(path.join(root, 'web', 'data.js'), 'window.FS = ' + JSON.stringify(out) + ';\n');
