/* Franzshopp · lógica compartida de las maquetas: catálogo, filtros, carrito y pedido por WhatsApp.
   Los datos vienen de data.js (generado desde data/catalogo.json). */
(() => {
  const FS = window.FS;
  if (!FS) return;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const byId = Object.fromEntries(FS.productos.map((p) => [p.id, p]));
  const catName = Object.fromEntries(FS.categorias.map((c) => [c.id, c.nombre]));
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover: hover) and (pointer: fine)').matches;
  const money = (n) => 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 0 });

  /* ---------- tarjetas desde la <template> de cada página ---------- */
  function fill(tpl, p) {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.dataset.id = p.id;
    $$('[data-f]', node).forEach((el) => {
      const f = el.dataset.f;
      const v = f === 'precio' ? money(p.precio) : f === 'cat' ? catName[p.cat] : f === 'marca' ? p.marca : p[f];
      if (v) el.textContent = v; else el.remove();
    });
    const slot = $('[data-slot]', node);
    if (slot) { slot.dataset.slot = 'p-' + p.id; slot.dataset.alt = p.nombre; const n = $('[data-stand]', slot); if (n) n.textContent = p.nombre; }
    $$('[data-add]', node).forEach((b) => { b.dataset.add = p.id; b.setAttribute('aria-label', 'Agregar ' + p.nombre + ' al pedido'); });
    return node;
  }

  /* listas fijas: data-list="combos" o data-list="ids:a,b,c" */
  $$('[data-list]').forEach((host) => {
    const tpl = $(host.dataset.tpl || '#card');
    const spec = host.dataset.list;
    const max = +host.dataset.max || 99;
    let items = spec.startsWith('ids:') ? spec.slice(4).split(',').map((i) => byId[i]).filter(Boolean) : FS.productos.filter((p) => p.cat === spec);
    if (host.dataset.sort === 'precio') items = [...items].sort((a, b) => a.precio - b.precio);
    items.slice(0, max).forEach((p) => host.append(fill(tpl, p)));
  });

  /* categorías */
  $$('[data-cats]').forEach((host) => {
    const tpl = $(host.dataset.tpl || '#cat');
    FS.categorias.forEach((c) => {
      const n = tpl.content.firstElementChild.cloneNode(true);
      $$('[data-f]', n).forEach((el) => { el.textContent = el.dataset.f === 'total' ? c.total + (c.total === 1 ? ' producto' : ' productos') : c.nombre; });
      const a = n.matches('a') ? n : $('a', n);
      if (a) { a.href = '#catalogo'; a.addEventListener('click', () => setFilter(c.id)); }
      host.append(n);
    });
  });

  /* catálogo con filtros y búsqueda */
  const cat = $('[data-catalog]');
  let filter = 'todo', query = '', expanded = false;
  function setFilter(id) {
    filter = id;
    $$('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === id)));
    renderCatalog();
  }
  function renderCatalog() {
    if (!cat) return;
    const grid = $('[data-grid]', cat), tpl = $(cat.dataset.tpl || '#card');
    const q = query.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const list = FS.productos.filter((p) => (filter === 'todo' || p.cat === filter) &&
      (!q || (p.nombre + ' ' + (p.uso || '') + ' ' + (p.incluye || '')).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(q)));
    const step = +cat.dataset.page || 0;
    const shown = step && !expanded ? list.slice(0, step) : list;
    grid.replaceChildren(...shown.map((p) => fill(tpl, p)));
    const more = $('[data-more]', cat);
    if (more) { more.hidden = shown.length >= list.length; more.textContent = 'Ver los ' + list.length + ' productos'; }
    const c = $('[data-count]', cat);
    if (c) c.textContent = list.length ? list.length + (list.length === 1 ? ' producto' : ' productos') : 'Nada con ese nombre. Escríbenos y te decimos si lo conseguimos.';
    tilt();
  }
  if (cat) {
    const chips = $('[data-chips]', cat);
    if (chips) {
      [{ id: 'todo', nombre: 'Todo' }, ...FS.categorias].forEach((c) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'chip'; b.dataset.filter = c.id; b.textContent = c.nombre;
        b.setAttribute('aria-pressed', String(c.id === 'todo'));
        b.addEventListener('click', () => setFilter(c.id));
        chips.append(b);
      });
    }
    const more = $('[data-more]', cat);
    if (more) more.addEventListener('click', () => { expanded = true; renderCatalog(); });
    const input = $('[data-search]', cat);
    if (input) input.addEventListener('input', () => { query = input.value.trim(); renderCatalog(); });
    renderCatalog();
  }

  /* ---------- carrito ---------- */
  const KEY = 'fs-carrito';
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { cart = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch {} };
  const lines = () => Object.entries(cart).filter(([id, q]) => byId[id] && q > 0).map(([id, q]) => ({ p: byId[id], q }));
  const total = () => lines().reduce((s, l) => s + l.p.precio * l.q, 0);

  function message() {
    const ls = lines();
    if (!ls.length) return 'Hola Franzshopp, quisiera información sobre sus herramientas.';
    return ['Hola Franzshopp, quiero hacer este pedido:', '',
      ...ls.map((l) => `• ${l.q} x ${l.p.nombre} (${l.p.marca}) — ${money(l.p.precio * l.q)}`),
      '', `Total: ${money(total())}`, '', 'Mi nombre:', 'Ciudad de envío:'].join('\n');
  }
  const waHref = () => `https://wa.me/${FS.whatsapp}?text=${encodeURIComponent(message())}`;

  function renderCart() {
    const n = lines().reduce((s, l) => s + l.q, 0);
    $$('[data-cart-count]').forEach((el) => { el.textContent = n; el.hidden = n === 0; });
    $$('[data-cart-total]').forEach((el) => { el.textContent = money(total()); });
    $$('[data-wa]').forEach((a) => { a.href = waHref(); });
    $$('[data-msg]').forEach((el) => { el.textContent = message(); });
    $$('[data-add]').forEach((b) => { const q = cart[b.dataset.add] || 0; b.dataset.state = q ? 'in' : ''; const t = $('[data-add-label]', b); if (t) t.textContent = q ? 'En el pedido (' + q + ')' : 'Agregar'; });
    const list = $('[data-cart-lines]');
    if (list) {
      const ls = lines();
      list.replaceChildren(...ls.map(({ p, q }) => {
        const li = document.createElement('li');
        li.innerHTML = '<span class="cl-name"></span><span class="cl-qty"><button type="button" class="qty" data-dec aria-label="Quitar uno">−</button><output></output><button type="button" class="qty" data-inc aria-label="Agregar uno">+</button></span><span class="cl-price"></span>';
        $('.cl-name', li).textContent = p.nombre; $('output', li).textContent = q; $('.cl-price', li).textContent = money(p.precio * q);
        $('[data-dec]', li).onclick = () => { cart[p.id] = q - 1; if (cart[p.id] <= 0) delete cart[p.id]; save(); renderCart(); };
        $('[data-inc]', li).onclick = () => { cart[p.id] = q + 1; save(); renderCart(); };
        return li;
      }));
      $$('[data-cart-empty]').forEach((el) => { el.hidden = ls.length > 0; });
    }
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]');
    if (b && b.dataset.add) { cart[b.dataset.add] = (cart[b.dataset.add] || 0) + 1; save(); renderCart(); return; }
    const o = e.target.closest('[data-cart-open]');
    if (o) { const d = $('[data-cart]'); if (d && d.showModal) d.showModal(); return; }
    const c = e.target.closest('[data-cart-close]');
    if (c) { const d = $('[data-cart]'); if (d) d.close(); }
  });
  const dlg = $('[data-cart]');
  if (dlg) dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

  /* ---------- 3D sobre la foto: inclinación siguiendo el puntero ---------- */

  function tilt() {
    if (still) return;
    $$('[data-tilt]:not([data-tilt-on])').forEach((el) => {
      el.dataset.tiltOn = '';
      const max = +el.dataset.tilt || 10;
      const inner = $('[data-tilt-inner]', el) || el;
      let raf = 0;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          inner.style.transform = `perspective(900px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) translateZ(0)`;
          el.style.setProperty('--gx', (x + 0.5) * 100 + '%'); el.style.setProperty('--gy', (y + 0.5) * 100 + '%');
        });
      });
      el.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); inner.style.transform = ''; });
    });
  }
  tilt();
  renderCart();
  window.FSCart = { renderCart, message };
})();
