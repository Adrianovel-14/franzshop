// Sirve las dos tiendas como quedan publicadas:
//   http://localhost:5174/franzshop/        → tienda actual (web/)
//   http://localhost:5174/franzshop/nuevo/  → tienda nueva (nuevo/dist, hay que compilarla antes)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const root = new URL('..', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const port = Number(process.env.PORT || 5174);
createServer(async (req, res) => {
  let url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (url === '/' ) { res.writeHead(302, { location: '/franzshop/' }); return res.end(); }
  let dir;
  if (url.startsWith('/franzshop/nuevo')) { dir = join(root, 'nuevo/dist'); url = url.slice('/franzshop/nuevo'.length); }
  else if (url.startsWith('/franzshop')) { dir = join(root, 'web'); url = url.slice('/franzshop'.length); }
  else { res.writeHead(404); return res.end(); }
  let file = normalize(join(dir, url || '/'));
  if (!file.startsWith(dir)) { res.writeHead(403); return res.end(); }
  try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); } catch { /* sigue */ }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': tipos[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('No encontrado'); }
}).listen(port, () => console.log(`Tienda actual: http://localhost:${port}/franzshop/\nTienda nueva:  http://localhost:${port}/franzshop/nuevo/`));
