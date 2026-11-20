/* Franzshopp · tienda: búsqueda, categorías, filtros, ficha de producto, pedido por WhatsApp */
(() => {
  const FS = window.FS;
  if (!FS) return;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };
  const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const money = (n) => 'S/ ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const P = FS.productos;
  const byId = Object.fromEntries(P.map((p) => [p.id, p]));
  const cats = FS.categorias;
  const catById = Object.fromEntries(cats.map((c) => [c.id, c]));
  P.forEach((p) => { p._q = norm([p.nombre, p.marca, catById[p.cat]?.nombre, p.uso, p.incluye, p.potencia].join(' ')); });

  /* ---------- imagen de producto (con respaldo si no hay foto) ---------- */
  function pic(p, cls = 'pic', eager = false, deco = false) {
    const box = el('div', cls);
    if (p.foto) {
      const img = new Image();
      img.src = p.foto; img.alt = deco ? '' : p.nombre; img.decoding = 'async';
      if (!eager) img.loading = 'lazy';
      img.width = 900; img.height = 900;
      img.addEventListener('error', () => { img.remove(); box.append(noPic(p)); }, { once: true });
      box.append(img);
    } else box.append(noPic(p));
    return box;
  }
  function noPic(p) {
    const n = el('div', 'nopic');
    n.append(el('span', 'nopic__brand', p.marca), el('span', 'nopic__name', p.nombre));
    return n;
  }

  /* ---------- tarjeta ---------- */
  function card(p) {
    const li = el('li', 'card');
    const a = el('a', 'card__open'); a.href = '#' + p.id; a.dataset.open = p.id;
    a.setAttribute('aria-label', 'Ver ' + p.nombre);
    const media = el('div', 'card__media'); media.dataset.tilt = '6';
    media.append(pic(p, 'pic card__pic'));
    if (p.cat === 'cabezales') media.append(el('span', 'badge', 'Sin batería'));
    else if (p.cat === 'combos') media.append(el('span', 'badge badge--accent', 'Combo'));
    a.append(media);
    const body = el('div', 'card__body');
    body.append(el('p', 'card__cat', catById[p.cat]?.corto || ''), el('h3', 'card__name', p.nombre));
    if (p.potencia) body.append(el('p', 'card__spec', p.potencia + (p.incluye ? ' · ' + p.incluye : '')));
    else if (p.uso) body.append(el('p', 'card__spec', p.uso));
    a.append(body);
    const foot = el('div', 'card__foot');
    foot.append(el('span', 'card__price num', money(p.precio)));
    const add = el('button', 'add'); add.type = 'button'; add.dataset.add = p.id;
    add.setAttribute('aria-label', 'Agregar ' + p.nombre + ' al pedido');
    add.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span>Agregar</span>';
    foot.append(add);
    li.append(a, foot);
    return li;
  }

  /* ---------- barra y mosaicos de categorías ---------- */
  const state = { cat: 'todo', q: '', sort: 'rel', min: null, max: null, page: 1 };
  const PAGE = 24;

  const catbar = $('[data-catbar]');
  [{ id: 'todo', corto: 'Todo', total: P.length }, ...cats].forEach((c) => {
    const b = el('button', 'catbar__btn'); b.type = 'button'; b.dataset.cat = c.id;
    b.append(el('span', null, c.corto), el('span', 'catbar__n', String(c.total)));
    catbar.append(b);
  });

  const tiles = $('[data-cat-tiles]');
  const coverFor = (cid) => {
    const prefs = { combos: 'combo-constructor-5-en-1-20v', inalambricas: 'taladro-percutor-66nm-20v', cabezales: 'cabezal-sierra-ingleteadora-20v',
      '42v-16v': 'amoladora-2600w-9-42v', electricas: 'sierra-circular-1600w', baterias: 'bateria-10ah-20v',
      medicion: 'nivel-laser-12-lineas-20v', accesorios: 'set-de-dados-de-alto-impacto-10-piezas', wadfow: 'mesa-de-trabajo' };
    const p = byId[prefs[cid]];
    return p && p.foto ? p : P.find((x) => x.cat === cid && x.foto);
  };
  cats.forEach((c) => {
    const li = el('li');
    const b = el('a', 'tile'); b.href = '#catalogo'; b.dataset.cat = c.id;
    const cp = coverFor(c.id);
    if (cp) b.append(pic(cp, 'pic tile__pic', false, true));
    const t = el('span', 'tile__txt');
    t.append(el('span', 'tile__name', c.nombre), el('span', 'tile__n', c.total + ' productos'));
    b.append(t); li.append(b); tiles.append(li);
  });
  const fc = $('[data-footer-cats]');
  cats.forEach((c) => { const li = el('li'); const a = el('a', null, c.nombre); a.href = '#catalogo'; a.dataset.cat = c.id; li.append(a); fc.append(li); });

  /* filtros laterales */
  const flist = $('[data-filter-list]');
  [{ id: 'todo', nombre: 'Todas', total: P.length }, ...cats].forEach((c) => {
    const li = el('li');
    const lab = el('label', 'radio');
    const inp = el('input'); inp.type = 'radio'; inp.name = 'cat'; inp.value = c.id; inp.checked = c.id === 'todo';
    lab.append(inp, el('span', 'radio__txt', c.nombre), el('span', 'radio__n', String(c.total)));
    li.append(lab); flist.append(li);
  });
  flist.addEventListener('change', (e) => { if (e.target.name === 'cat') setCat(e.target.value, false); });


  /* ---------- carrusel de combos ---------- */
  const rail = $('[data-rail]');
  P.filter((p) => p.cat === 'combos' && p.foto).sort((a, b) => b.precio - a.precio).slice(0, 12).forEach((p) => rail.append(card(p)));
  $('[data-rail-prev]').addEventListener('click', () => rail.scrollBy({ left: -rail.clientWidth * 0.8, behavior: still ? 'auto' : 'smooth' }));
  $('[data-rail-next]').addEventListener('click', () => rail.scrollBy({ left: rail.clientWidth * 0.8, behavior: still ? 'auto' : 'smooth' }));

  /* ---------- catálogo ---------- */
  const grid = $('[data-grid]');
  function results() {
    const terms = norm(state.q).split(/\s+/).filter(Boolean);
    let list = P.filter((p) => (state.cat === 'todo' || p.cat === state.cat)
      && (state.min == null || p.precio >= state.min) && (state.max == null || p.precio <= state.max)
      && terms.every((t) => p._q.includes(t)));
    if (state.sort === 'asc') list.sort((a, b) => a.precio - b.precio);
    else if (state.sort === 'desc') list.sort((a, b) => b.precio - a.precio);
    else if (state.sort === 'az') list.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    else if (terms.length) list.sort((a, b) => score(b, terms) - score(a, terms));
    else list.sort((a, b) => (b.foto ? 1 : 0) - (a.foto ? 1 : 0));
    return list;
  }
  function score(p, terms) { const n = norm(p.nombre); return terms.reduce((s, t) => s + (n.startsWith(t) ? 3 : n.includes(t) ? 2 : 1), 0); }

  function render() {
    const list = results();
    const shown = list.slice(0, state.page * PAGE);
    grid.replaceChildren(...shown.map(card));
    $('[data-more]').hidden = shown.length >= list.length;
    $('[data-more]').textContent = 'Ver más productos (' + (list.length - shown.length) + ')';
    $('[data-empty]').hidden = list.length > 0;
    $('[data-wa-search]').href = `https://wa.me/${FS.whatsapp}?text=${encodeURIComponent('Hola Franzshopp, ¿tienen ' + (state.q || 'este producto') + '?')}`;
    $('[data-result-count]').textContent = list.length === 1 ? '1 producto' : list.length + ' productos';
    // chips de filtros activos
    const act = $('[data-active]'); act.replaceChildren();
    const chip = (txt, fn) => { const b = el('button', 'chip', txt); b.type = 'button'; b.setAttribute('aria-label', 'Quitar filtro ' + txt); b.addEventListener('click', fn); act.append(b); };
    if (state.q) chip('“' + state.q + '”', () => { state.q = ''; q.value = ''; state.page = 1; render(); });
    if (state.cat !== 'todo') chip(catById[state.cat].nombre, () => setCat('todo', false));
    if (state.min != null) chip('Desde ' + money(state.min), () => { state.min = null; $('[data-min]').value = ''; render(); });
    if (state.max != null) chip('Hasta ' + money(state.max), () => { state.max = null; $('[data-max]').value = ''; render(); });
    act.hidden = !act.children.length;
    const nf = (state.cat !== 'todo') + (state.min != null) + (state.max != null);
    const fn = $('[data-filter-n]'); fn.textContent = nf; fn.hidden = !nf;
    $('[data-apply]').textContent = list.length ? `Ver ${list.length} producto${list.length === 1 ? '' : 's'}` : 'Sin resultados';
    $$('.catbar__btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === state.cat)));
    $$('input[name=cat]').forEach((i) => { i.checked = i.value === state.cat; });
    syncCart();
    bindTilt();
  }
  function setCat(id, scroll = true) {
    state.cat = id; state.page = 1; render();
    if (scroll) $('#catalogo').scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
  }
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-cat]');
    if (c) { e.preventDefault(); setCat(c.dataset.cat, true); }
  });
  $('[data-more]').addEventListener('click', () => { state.page++; render(); });
  $('[data-sort]').addEventListener('change', (e) => { state.sort = e.target.value; render(); });
  const num = (v) => (v === '' ? null : Math.max(0, Number(v)));
  $('[data-min]').addEventListener('input', (e) => { state.min = num(e.target.value); state.page = 1; render(); });
  $('[data-max]').addEventListener('input', (e) => { state.max = num(e.target.value); state.page = 1; render(); });
  $('[data-clear]').addEventListener('click', () => {
    Object.assign(state, { cat: 'todo', q: '', sort: 'rel', min: null, max: null, page: 1 });
    q.value = ''; $('[data-sort]').value = 'rel'; $('[data-min]').value = ''; $('[data-max]').value = ''; render();
  });

  /* ---------- panel de filtros (en celular sale desde abajo) ---------- */
  const fPanel = $('[data-filters]'), fBack = $('.sheet-backdrop'), fOpen = $('[data-filters-open]');
  const isSheet = () => !matchMedia('(min-width: 64rem)').matches;
  let lastFocus = null;
  function openFilters() {
    if (!isSheet()) { fPanel.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' }); return; }
    lastFocus = document.activeElement;
    fBack.hidden = false; fPanel.classList.add('is-open'); fOpen.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('no-scroll');
    fPanel.setAttribute('role', 'dialog'); fPanel.setAttribute('aria-modal', 'true');
    requestAnimationFrame(() => $('.filters__head .icon-btn', fPanel).focus());
  }
  function closeFilters() {
    if (!fPanel.classList.contains('is-open')) return;
    fPanel.classList.remove('is-open'); fBack.hidden = true; fOpen.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('no-scroll');
    fPanel.removeAttribute('role'); fPanel.removeAttribute('aria-modal');
    if (lastFocus) lastFocus.focus();
    $('#catalogo').scrollIntoView({ behavior: 'auto', block: 'start' });
  }
  fOpen.addEventListener('click', openFilters);
  $$('[data-filters-close]').forEach((b) => b.addEventListener('click', closeFilters));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFilters(); });
  // deslizar hacia abajo para cerrar
  let y0 = null;
  $('.filters__head', fPanel).addEventListener('pointerdown', (e) => { if (isSheet() && !e.target.closest('button')) { y0 = e.clientY; e.currentTarget.setPointerCapture?.(e.pointerId); } });
  $('.filters__head', fPanel).addEventListener('pointermove', (e) => { if (y0 != null) { const d = Math.max(0, e.clientY - y0); fPanel.style.transform = `translateY(${d}px)`; } });
  const endDrag = (e) => { if (y0 == null) return; const d = e.clientY - y0; y0 = null; fPanel.style.transform = ''; if (d > 90) closeFilters(); };
  $('.filters__head', fPanel).addEventListener('pointerup', endDrag);
  $('.filters__head', fPanel).addEventListener('pointercancel', endDrag);

  /* ---------- buscador con sugerencias ---------- */
  const q = $('#q');
  if (matchMedia('(min-width: 48rem)').matches) q.placeholder = 'Busca taladro, amoladora, batería 4Ah…';
  const sug = $('#suggest');
  let active = -1, t = 0;
  function suggest() {
    const terms = norm(q.value).split(/\s+/).filter(Boolean);
    if (!terms.length) { closeSug(); return; }
    const list = P.filter((p) => terms.every((x) => p._q.includes(x))).sort((a, b) => score(b, terms) - score(a, terms));
    sug.replaceChildren();
    list.slice(0, 6).forEach((p, i) => {
      const li = el('li', 'suggest__item'); li.id = 'sg-' + i; li.setAttribute('role', 'option'); li.dataset.open = p.id;
      li.append(pic(p, 'pic suggest__pic', false, true));
      const tx = el('span', 'suggest__txt'); tx.append(el('span', 'suggest__name', p.nombre), el('span', 'suggest__cat', catById[p.cat]?.nombre || ''));
      li.append(tx, el('span', 'suggest__price num', money(p.precio)));
      sug.append(li);
    });
    const all = el('li', 'suggest__all'); all.setAttribute('role', 'option'); all.id = 'sg-all'; all.dataset.searchAll = '';
    all.textContent = list.length ? `Ver los ${list.length} resultados de “${q.value.trim()}”` : `Sin resultados para “${q.value.trim()}”. Pregúntanos por WhatsApp`;
    sug.append(all);
    sug.hidden = false; q.setAttribute('aria-expanded', 'true'); active = -1;
  }
  function closeSug() { sug.hidden = true; q.setAttribute('aria-expanded', 'false'); q.removeAttribute('aria-activedescendant'); active = -1; }
  function runSearch() {
    state.q = q.value.trim(); state.page = 1; state.cat = 'todo'; closeSug(); render();
    if (!P.some((p) => norm(state.q).split(/\s+/).every((x) => p._q.includes(x))) && state.q) { /* vacío: se muestra el aviso */ }
    $('#catalogo').scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
  }
  q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(suggest, 90); });
  q.addEventListener('focus', () => { if (q.value.trim()) suggest(); });
  q.addEventListener('keydown', (e) => {
    const items = $$('[role=option]', sug);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (sug.hidden) suggest();
      e.preventDefault();
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((it, i) => it.setAttribute('aria-selected', String(i === active)));
      q.setAttribute('aria-activedescendant', items[active].id);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const it = items[active];
      if (it && it.dataset.open) { closeSug(); openProduct(it.dataset.open); } else runSearch();
    } else if (e.key === 'Escape') closeSug();
  });
  sug.addEventListener('mousedown', (e) => e.preventDefault());
  sug.addEventListener('click', (e) => {
    const it = e.target.closest('[role=option]'); if (!it) return;
    if (it.dataset.open) { closeSug(); openProduct(it.dataset.open); } else runSearch();
  });
  q.addEventListener('blur', () => setTimeout(closeSug, 120));
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); q.focus(); }
  });

  /* ---------- ficha de producto ---------- */
  const pd = $('[data-product]');
  let pdItem = null, pdQty = 1;
  function openProduct(id) {
    const p = byId[id]; if (!p) return;
    pdItem = p; pdQty = 1;
    $('[data-pd-img]').replaceChildren(pic(p, 'pic', true));
    $('[data-pd-cat]').textContent = (catById[p.cat]?.nombre || '') + ' · ' + p.marca;
    $('[data-pd-name]').textContent = p.nombre;
    $('[data-pd-price]').textContent = money(p.precio);
    const specs = $('[data-pd-specs]'); specs.replaceChildren();
    [['Potencia', p.potencia], ['Incluye', p.incluye], ['Sirve para', p.uso ? p.uso.charAt(0).toUpperCase() + p.uso.slice(1) : null], ['Garantía', 'Sí, con envío a todo el Perú']]
      .forEach(([k, v]) => { if (!v) return; const d = el('div'); d.append(el('dt', null, k), el('dd', null, v)); specs.append(d); });
    $('[data-pd-qty]').textContent = '1';
    $('[data-pd-wa]').href = `https://wa.me/${FS.whatsapp}?text=${encodeURIComponent('Hola Franzshopp, quiero información de: ' + p.nombre + ' (' + money(p.precio) + ')')}`;
    pd.showModal();
    bindTilt();
  }
  pd.addEventListener('click', (e) => {
    const b = e.target.closest('[data-q]');
    if (b) { pdQty = Math.max(1, pdQty + Number(b.dataset.q)); $('[data-pd-qty]').textContent = pdQty; }
  });
  $('[data-pd-add]').addEventListener('click', () => { if (!pdItem) return; addToCart(pdItem.id, pdQty); pd.close(); });

  /* ---------- pedido ---------- */
  const KEY = 'franzshopp-pedido';
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { cart = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch { /* sin almacenamiento */ } };
  const lines = () => Object.entries(cart).filter(([id, n]) => byId[id] && n > 0).map(([id, n]) => ({ p: byId[id], n }));
  const total = () => lines().reduce((s, l) => s + l.p.precio * l.n, 0);
  function message() {
    const ls = lines();
    if (!ls.length) return 'Hola Franzshopp, quisiera información sobre sus herramientas.';
    return ['Hola Franzshopp, quiero hacer este pedido:', '', ...ls.map((l) => `• ${l.n} x ${l.p.nombre} — ${money(l.p.precio * l.n)}`), '', `Total: ${money(total())}`, '', 'Mi nombre:', 'Ciudad de envío:'].join('\n');
  }
  function addToCart(id, n = 1) {
    cart[id] = (cart[id] || 0) + n; save(); syncCart();
    toast('Agregado: ' + byId[id].nombre);
    const btn = $('[data-cart-open]'); btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
  }
  function syncCart() {
    const n = lines().reduce((s, l) => s + l.n, 0);
    $$('[data-cart-count]').forEach((x) => { x.textContent = n; x.hidden = !n; });
    $$('[data-cart-total]').forEach((x) => { x.textContent = money(total()); });
    const href = `https://wa.me/${FS.whatsapp}?text=${encodeURIComponent(message())}`;
    $$('[data-wa]').forEach((a) => { a.href = href; });
    $$('[data-msg]').forEach((x) => { x.textContent = message(); });
    $$('[data-add]').forEach((b) => { const k = cart[b.dataset.add] || 0; b.classList.toggle('is-in', k > 0); const s = $('span', b); if (s) s.textContent = k ? 'En pedido (' + k + ')' : 'Agregar'; });
    const ul = $('[data-cart-lines]');
    ul.replaceChildren(...lines().map(({ p, n }) => {
      const li = el('li', 'line');
      li.append(pic(p, 'pic line__pic', false, true));
      const info = el('div', 'line__info'); info.append(el('p', 'line__name', p.nombre), el('p', 'line__unit', money(p.precio) + ' c/u'));
      const qty = el('div', 'qty qty--sm'); qty.setAttribute('role', 'group'); qty.setAttribute('aria-label', 'Cantidad de ' + p.nombre);
      const minus = el('button', null, '−'); minus.type = 'button'; minus.setAttribute('aria-label', 'Quitar uno');
      const plus = el('button', null, '+'); plus.type = 'button'; plus.setAttribute('aria-label', 'Agregar uno');
      minus.onclick = () => { cart[p.id] = n - 1; if (cart[p.id] <= 0) delete cart[p.id]; save(); syncCart(); };
      plus.onclick = () => { cart[p.id] = n + 1; save(); syncCart(); };
      qty.append(minus, el('output', null, String(n)), plus);
      info.append(qty);
      li.append(info, el('p', 'line__total num', money(p.precio * n)));
      return li;
    }));
    $('[data-cart-empty]').hidden = lines().length > 0;
  }

  /* ---------- toast ---------- */
  const tst = $('[data-toast]'); let tt = 0;
  function toast(msg) { tst.textContent = msg; tst.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => tst.classList.remove('is-on'), 2200); }

  /* ---------- clics globales ---------- */
  const cartDlg = $('[data-cart]');
  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) { e.stopPropagation(); addToCart(add.dataset.add); return; }
    const op = e.target.closest('[data-open]');
    if (op && !op.closest('#suggest')) { e.preventDefault(); openProduct(op.dataset.open); return; }
    if (e.target.closest('[data-cart-open]')) { cartDlg.showModal(); return; }
    const cl = e.target.closest('[data-close]');
    if (cl) cl.closest('dialog').close();
  });
  $$('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));

  /* ---------- efecto 3D: inclinación sobre la foto ---------- */
  function bindTilt() {
    if (still || !finePointer) return;
    $$('[data-tilt]:not([data-tilt-on])').forEach((node) => {
      node.dataset.tiltOn = '';
      const max = +node.dataset.tilt || 8;
      const inner = $('[data-tilt-inner]', node) || node.firstElementChild || node;
      let raf = 0;
      node.addEventListener('pointermove', (e) => {
        const r = node.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          inner.style.transform = `perspective(900px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) scale(1.02)`;
          node.style.setProperty('--gx', ((x + 0.5) * 100).toFixed(1) + '%');
          node.style.setProperty('--gy', ((y + 0.5) * 100).toFixed(1) + '%');
        });
      });
      node.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); inner.style.transform = ''; });
    });
  }

  /* ---------- carrusel de portada ---------- */
  (function slider() {
    const track = $('[data-slides]'), dotsBox = $('[data-dots]');
    const today = new Date().toISOString().slice(0, 10);
    const banners = (window.FS_BANNERS || []).filter((b) => !b.hasta || b.hasta >= today);
    if (!track || !banners.length) return;
    const minOf = (cid) => Math.min(...P.filter((p) => p.cat === cid).map((p) => p.precio));
    track.replaceChildren();
    banners.forEach((b, i) => {
      const s = el('article', 'slide slide--' + (b.tema || 'noche'));
      s.setAttribute('role', 'group'); s.setAttribute('aria-roledescription', 'pantalla'); s.setAttribute('aria-label', `${i + 1} de ${banners.length}`);
      const copy = el('div', 'slide__copy');
      copy.append(el('p', 'slide__tag', b.etiqueta || ''));
      copy.append(el(i === 0 ? 'p' : 'p', 'slide__title', b.titulo));
      if (b.texto) copy.append(el('p', 'slide__text', b.desde ? b.texto.replace('{desde}', money(minOf(b.desde))) : b.texto));
      const acts = el('div', 'slide__actions');
      const go = b.boton?.ir || '#catalogo';
      const a = el('a', 'btn ' + (b.tema === 'claro' ? 'btn--dark' : 'btn--accent'), b.boton?.texto || 'Ver catálogo');
      if (go === 'whatsapp') { a.href = `https://wa.me/${FS.whatsapp}`; a.dataset.wa = ''; }
      else if (go.startsWith('cat:')) { a.href = '#catalogo'; a.dataset.cat = go.slice(4); }
      else if (go.startsWith('buscar:')) { a.href = '#catalogo'; a.dataset.buscar = go.slice(7); }
      else a.href = go;
      acts.append(a); copy.append(acts);
      const stage = el('div', 'slide__stage');
      (b.productos || []).map((id) => byId[id]).filter(Boolean).slice(0, 3).forEach((p, k) => {
        const c = el('button', 'slide__card slide__card--' + 'abc'[k]); c.type = 'button'; c.dataset.open = p.id; c.dataset.tilt = '10';
        c.setAttribute('aria-label', 'Ver ' + p.nombre + ', ' + money(p.precio));
        const inner = el('span', 'slide__inner'); inner.dataset.tiltInner = '';
        inner.append(pic(p, 'pic', true, true));
        const tag = el('span', 'slide__price');
        const oferta = b.ofertas && b.ofertas[p.id];
        tag.append(el('span', 'slide__pname', p.nombre));
        const pr = el('span', 'slide__prices');
        if (oferta) { pr.append(el('s', 'num', money(p.precio)), el('strong', 'num', money(oferta))); }
        else pr.append(el('strong', 'num', money(p.precio)));
        tag.append(pr); inner.append(tag); c.append(inner); stage.append(c);
      });
      s.append(copy, stage);
      track.append(s);
      const d = el('button', 'slider__dot'); d.type = 'button'; d.setAttribute('aria-label', 'Ir a la pantalla ' + (i + 1) + ': ' + b.titulo);
      d.addEventListener('click', () => goTo(i, true));
      dotsBox.append(d);
    });
    const slides = $$('.slide', track), dots = $$('.slider__dot', dotsBox);
    let cur = 0;
    function mark(i) {
      cur = i;
      dots.forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
      slides.forEach((s, k) => { s.inert = k !== i; s.classList.toggle('is-current', k === i); });
    }
    function goTo(i, user) {
      const n = (i + slides.length) % slides.length;
      track.scrollTo({ left: slides[n].offsetLeft - track.offsetLeft, behavior: still ? 'auto' : 'smooth' });
      mark(n);
      if (user) pause(8000);
    }
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => { if (en.isIntersecting && en.intersectionRatio > 0.6) mark(slides.indexOf(en.target)); });
    }, { root: track, threshold: [0.6] });
    slides.forEach((s) => io.observe(s));
    $('[data-slide-prev]').addEventListener('click', () => goTo(cur - 1, true));
    $('[data-slide-next]').addEventListener('click', () => goTo(cur + 1, true));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(cur + 1, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(cur - 1, true); }
    });
    // pasa solo cada 6 s; se detiene si la persona interactúa o si pidió menos movimiento
    let timer = 0, hold = 0;
    const tick = () => { if (Date.now() > hold && !document.hidden) goTo(cur + 1, false); };
    const pause = (ms) => { hold = Date.now() + ms; };
    if (!still && slides.length > 1) timer = setInterval(tick, 6000);
    ['pointerdown', 'wheel', 'touchstart', 'focusin'].forEach((ev) => track.addEventListener(ev, () => pause(9000), { passive: true }));
    track.addEventListener('mouseenter', () => pause(1e9));
    track.addEventListener('mouseleave', () => pause(2500));
    document.addEventListener('click', (e) => {
      const s = e.target.closest('[data-buscar]');
      if (s) { e.preventDefault(); q.value = s.dataset.buscar; runSearch(); }
    });
    mark(0);
    void timer;
  })();

  const setTop = () => document.documentElement.style.setProperty('--sticky-top', $('.header').offsetHeight + 'px');
  setTop(); addEventListener('resize', setTop);

  render();
  bindTilt();
})();
