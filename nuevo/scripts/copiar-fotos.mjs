// Copia las fotos de la tienda actual (web/fotos) a public/fotos para no tenerlas dos veces en git.
import { cpSync, existsSync } from 'node:fs';
const src = new URL('../../web/fotos', import.meta.url);
const dst = new URL('../public/fotos', import.meta.url);
if (existsSync(src)) cpSync(src, dst, { recursive: true });
console.log('fotos listas');
