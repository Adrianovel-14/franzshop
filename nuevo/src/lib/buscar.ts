/* Motor del buscador de Franzshopp.
   Entiende: tildes y mayúsculas, plurales (taladros = taladro), 1 letra de error en palabras largas (taldro = taladro),
   palabras a medio escribir (tala → taladro), y el diccionario de web/diccionario.js (chicharra → ratchet).
   Si no hay resultados exactos, "parecidos" devuelve lo que comparte alguna palabra con la búsqueda. */

export const norm = (s: string) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const palabras = (s: string) => norm(s).split(/[^a-z0-9ñ]+/).filter(Boolean);

// Palabras que no ayudan a buscar
const VACIAS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'para', 'con', 'y', 'e', 'en', 'un', 'una', 'unos', 'unas', 'por', 'a', 'al', 'mi', 'me', 'que', 'o', 'tienen', 'tienes', 'hay', 'quiero', 'busco', 'precio']);

// Raíz simple para español: quita plural y vocal final (taladros → taladr, amoladoras → amolador, sierra → sierr)
export function raiz(w: string) {
  if (w.length <= 3 || /\d/.test(w)) return w;
  if (w.endsWith('es') && w.length > 5 && !/[aeiou]es$/.test(w.slice(-3))) w = w.slice(0, -2);
  else if (w.endsWith('s')) w = w.slice(0, -1);
  if (w.length > 4 && /[aeo]$/.test(w)) w = w.slice(0, -1);
  return w;
}

// ¿Están a 1 letra de distancia? (una letra de más, de menos, cambiada o dos letras volteadas)
function casi(a: string, b: string) {
  if (a === b) return true;
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  while (i < la && i < lb && a[i] === b[i]) i++;
  if (la === lb) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true; // cambiada
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2); // volteadas
  }
  return la > lb ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

type Doc = { nombre: string[]; resto: string[]; raices: Set<string>; raicesNombre: Set<string> };
export type Indice<T> = { items: T[]; docs: Doc[]; dic: [string[], string[][]][] };

/** dic: líneas "palabra = opción, opción" ya leídas del diccionario */
export function indexar<T>(items: T[], nombre: (x: T) => string, resto: (x: T) => string, dic: string[]): Indice<T> {
  const docs = items.map((x) => {
    const n = palabras(nombre(x)), r = palabras(resto(x));
    return { nombre: n, resto: r, raices: new Set([...n, ...r].map(raiz)), raicesNombre: new Set(n.map(raiz)) };
  });
  const d = dic.map((l) => l.split('=')).filter((p) => p.length === 2)
    .map(([k, v]) => [palabras(k).filter((w) => !VACIAS.has(w)).map(raiz), v.split(',').map((o) => palabras(o).filter((w) => !VACIAS.has(w))).filter((o) => o.length)] as [string[], string[][]])
    .filter(([k, v]) => k.length && v.length)
    .sort((a, b) => b[0].length - a[0].length); // primero las frases largas ("pistola de impacto" antes que "pistola")
  return { items, docs, dic: d };
}

// Una búsqueda = lista de condiciones; cada condición tiene opciones (basta que se cumpla una);
// cada opción es un grupo de palabras que deben estar todas.
type Condicion = string[][];
function entender(q: string, dic: Indice<unknown>['dic']): Condicion[] {
  const ws = palabras(q);
  const rs = ws.map(raiz);
  const conds: Condicion[] = [];
  let i = 0;
  while (i < ws.length) {
    if (VACIAS.has(ws[i])) { i++; continue; }
    let usada = false;
    for (const [k, opciones] of dic) {
      // compara saltando palabras vacías ("pistola de impacto" = "pistola impacto")
      let j = i, m = 0;
      while (m < k.length && j < ws.length) {
        if (VACIAS.has(ws[j])) { j++; continue; }
        if (rs[j] !== k[m]) break;
        j++; m++;
      }
      if (m === k.length) {
        // la palabra original también vale como opción (por si el producto se llama así)
        const original = ws.slice(i, j).filter((w) => !VACIAS.has(w));
        conds.push([...opciones, original]);
        i = j; usada = true; break;
      }
    }
    if (!usada) { conds.push([[ws[i]]]); i++; }
  }
  return conds;
}

// Extra si la palabra es lo primero del nombre ("Taladro percutor..." antes que "Set de ... + taladro")
function alInicio(d: Doc, ok: (x: string) => boolean) {
  if (ok(d.nombre[0] || '')) return 2;
  if (d.nombre[0] === 'cabezal' && ok(d.nombre[1] || '')) return 1;
  return 0;
}

// Puntaje de una palabra en un producto: 0 = no está
function puntos(w: string, d: Doc, final: boolean) {
  const r = raiz(w);
  let mejor = 0;
  if (d.raicesNombre.has(r)) mejor = 4 + alInicio(d, (x) => raiz(x) === r);
  else if (d.raices.has(r)) mejor = 2;
  if (mejor < 4 && w.length >= 2) {
    // a medio escribir: solo la última palabra de la búsqueda (mientras se escribe)
    if (final || w.length >= 4) {
      if (d.nombre.some((x) => x.startsWith(w))) mejor = Math.max(mejor, 3 + alInicio(d, (x) => x.startsWith(w)));
      else if (!mejor && d.resto.some((x) => x.startsWith(w))) mejor = 1;
    }
  }
  if (!mejor && w.length >= 5 && !/\d/.test(w)) {
    const parecida = (x: string) => x.length >= 4 && (casi(w, x) || casi(r, raiz(x)));
    if (d.nombre.some(parecida)) mejor = 2 + alInicio(d, parecida);
    else if (d.resto.some((x) => x.length >= 5 && parecida(x))) mejor = 1;
  }
  return mejor;
}
function cumple(c: Condicion, d: Doc, final: boolean) {
  let mejor = 0;
  for (const grupo of c) {
    let s = 0;
    for (let g = 0; g < grupo.length; g++) {
      const p = puntos(grupo[g], d, final && g === grupo.length - 1);
      if (!p) { s = 0; break; }
      s += p;
    }
    if (s > mejor) mejor = s;
  }
  return mejor;
}

/** Devuelve los productos que cumplen TODAS las palabras, del más al menos parecido. */
export function buscar<T>(ix: Indice<T>, q: string) {
  const conds = entender(q, ix.dic);
  if (!conds.length) return { vacia: true, lista: ix.items.slice(), puntaje: new Map<T, number>() };
  const puntaje = new Map<T, number>();
  ix.docs.forEach((d, i) => {
    let total = 0;
    for (let c = 0; c < conds.length; c++) {
      const s = cumple(conds[c], d, c === conds.length - 1);
      if (!s) return;
      total += s;
    }
    puntaje.set(ix.items[i], total);
  });
  return { vacia: false, lista: [...puntaje.keys()], puntaje };
}

/** Si no hubo resultados: los que comparten más palabras con la búsqueda. */
export function parecidos<T>(ix: Indice<T>, q: string, max = 8) {
  const conds = entender(q, ix.dic);
  if (!conds.length) return [];
  const res: [T, number][] = [];
  ix.docs.forEach((d, i) => {
    let s = 0, n = 0;
    for (const c of conds) { const p = cumple(c, d, false); if (p) { s += p; n++; } }
    if (n) res.push([ix.items[i], n * 10 + s]);
  });
  return res.sort((a, b) => b[1] - a[1]).slice(0, max).map(([x]) => x);
}
