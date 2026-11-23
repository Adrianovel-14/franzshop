/* Franzshopp (tienda nueva): buscador, catálogo con filtros, pedido por WhatsApp. */
type P = { id: string; n: string; c: string; p: number; f: string; k: string; a?: number; _q?: string };
type C = { id: string; n: string; s: string; t: number };

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as T[];
const norm = (s: string) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const soles = (n: number) => 'S/ ' + Number(n).toLocaleString('es-PE', { maximumFractionDigits: 2 });
const quieto = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, txt?: string) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt != null) n.textContent = txt;
  return n;
}

export function iniciarTienda() {
  const D = JSON.parse($('#fs-datos')!.textContent!) as { wa: string; base: string; sitio: string; p: P[]; c: C[] };
  const P = D.p, base = D.base;
  const cats = Object.fromEntries(D.c.map((c) => [c.id, c]));
  const byId = Object.fromEntries(P.map((p) => [p.id, p]));
  P.forEach((p) => { p._q = norm([p.n, cats[p.c]?.n, p.k].join(' ')); });
  const link = (id: string) => `${base}/producto/${id}/`;
  const wa = (t: string) => `https://wa.me/${D.wa}?text=${encodeURIComponent(t)}`;
  const avisame = (p: P) => wa(`Hola Franzshopp, ¿me avisan cuando tengan stock de: ${p.n}? ${D.sitio}/producto/${p.id}/`);
  const hay = (id: string) => Object.hasOwn(byId, id);
  // en "Recomendados" y en búsquedas, lo que no tiene stock va al final
  const stockPrimero = (a: P, b: P) => (a.a ? 1 : 0) - (b.a ? 1 : 0);
  const score = (p: P, terms: string[]) => { const n = norm(p.n); return terms.reduce((s, t) => s + (n.startsWith(t) ? 3 : n.includes(t) ? 2 : 1), 0); };
  const busca = (q: string) => {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    return { terms, list: P.filter((p) => terms.every((t) => p._q!.includes(t))) };
  };

  /* ---------- foto ---------- */
  function pic(p: P, cls: string, alt = '') {
    const box = el('span', cls);
    if (p.f) {
      const img = new Image(600, 600);
      img.src = p.f; img.alt = alt; img.loading = 'lazy'; img.decoding = 'async';
      img.addEventListener('error', () => { img.remove(); box.append(el('span', 'nopic', p.n)); }, { once: true });
      box.append(img);
    } else box.append(el('span', 'nopic', p.n));
    return box;
  }

  /* ---------- pedido ---------- */
  const KEY = 'franzshopp-pedido-nuevo';
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch { /* sin almacenamiento */ } };
  // Se lee el pedido guardado y se limpia: solo productos que existen, con stock y cantidades enteras de 1 a 999.
  let cart: Record<string, number> = {};
  const quitados: string[] = [];
  try {
    const crudo = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (crudo && typeof crudo === 'object' && !Array.isArray(crudo)) {
      for (const [id, v] of Object.entries(crudo)) {
        const n = Math.floor(Number(v));
        if (!hay(id) || !Number.isFinite(n) || n < 1) continue;
        if (byId[id].a) { quitados.push(byId[id].n); continue; }
        cart[id] = Math.min(n, 999);
      }
    }
  } catch { cart = {}; }
  save();
  const lines = () => Object.entries(cart).filter(([id, n]) => hay(id) && !byId[id].a && n > 0).map(([id, n]) => ({ p: byId[id], n }));
  const total = () => lines().reduce((s, l) => s + l.p.p * l.n, 0);
  function mensaje() {
    const ls = lines();
    if (!ls.length) return 'Hola Franzshopp, quisiera información sobre sus herramientas.';
    return ['Hola Franzshopp, quiero hacer este pedido:', '', ...ls.map((l) => `• ${l.n} x ${l.p.n} — ${soles(l.p.p * l.n)}`), '', `Total: ${soles(total())}`, '', 'Mi nombre:', 'Envío (ciudad) o recojo en almacén:'].join('\n');
  }
  function add(id: string, n = 1) {
    if (!hay(id) || byId[id].a) return;
    n = Math.max(1, Math.floor(n) || 1);
    cart[id] = Math.min((cart[id] || 0) + n, 999); save(); sync();
    toast('Agregado: ' + byId[id].n);
    const b = $('[data-cart-open]')!; b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
  }
  function sync() {
    const n = lines().reduce((s, l) => s + l.n, 0);
    $$('[data-cart-count]').forEach((x) => { x.textContent = String(n); x.hidden = !n; });
    $$('[data-cart-total]').forEach((x) => { x.textContent = soles(total()); });
    $$<HTMLAnchorElement>('[data-wa]').forEach((a) => { a.href = wa(mensaje()); });
    $$('[data-msg]').forEach((x) => { x.textContent = mensaje(); });
    $$('[data-add]').forEach((b) => {
      const k = cart[b.dataset.add!] || 0;
      b.classList.toggle('is-in', k > 0);
      const s = $('span', b); if (s && !b.hasAttribute('data-qty-from')) s.textContent = k ? `En pedido (${k})` : 'Agregar';
    });
    const ul = $('[data-cart-lines]')!;
    ul.replaceChildren(...lines().map(({ p, n }) => {
      const li = el('li', 'line');
      li.append(pic(p, 'line__pic'));
      const info = el('div', 'line__info');
      const name = el('a', 'line__name', p.n); name.href = link(p.id);
      info.append(name, el('p', 'line__unit', soles(p.p) + ' c/u'));
      const qty = el('div', 'qty qty--sm'); qty.setAttribute('role', 'group'); qty.setAttribute('aria-label', 'Cantidad de ' + p.n);
      const minus = el('button', '', '−'); minus.type = 'button'; minus.setAttribute('aria-label', 'Quitar uno');
      const plus = el('button', '', '+'); plus.type = 'button'; plus.setAttribute('aria-label', 'Agregar uno');
      minus.onclick = () => { cart[p.id] = n - 1; if (cart[p.id] <= 0) delete cart[p.id]; save(); sync(); };
      plus.onclick = () => { cart[p.id] = Math.min(n + 1, 999); save(); sync(); };
      qty.append(minus, el('output', 'num', String(n)), plus);
      info.append(qty);
      li.append(info, el('p', 'line__total num', soles(p.p * n)));
      return li;
    }));
    $('[data-cart-empty]')!.hidden = lines().length > 0;
  }

  const tst = $('[data-toast]')!; let tt = 0;
  function toast(m: string, ms = 2200) { tst.textContent = m; tst.classList.add('is-on'); clearTimeout(tt); tt = window.setTimeout(() => tst.classList.remove('is-on'), ms); }
  if (quitados.length) toast(`Se quitó de tu pedido porque se agotó: ${quitados.join(', ')}`, 5000);

  /* ---------- tarjeta de producto ---------- */
  function card(p: P) {
    const li = el('li', p.a ? 'card card--agotado' : 'card');
    const a = el('a', 'card__open'); a.href = link(p.id);
    const media = el('span', 'card__media');
    media.append(pic(p, 'card__pic', p.n));
    if (p.a) media.append(el('span', 'badge badge--agotado', 'Sin stock'));
    else if (p.c === 'cabezales') media.append(el('span', 'badge', 'Sin batería'));
    else if (p.c === 'combos') media.append(el('span', 'badge badge--accent', 'Combo'));
    a.append(media);
    const body = el('span', 'card__body');
    body.append(el('span', 'card__cat', cats[p.c]?.s || ''), el('span', 'card__name', p.n));
    a.append(body);
    const foot = el('div', 'card__foot');
    foot.append(el('span', 'card__price num', soles(p.p)));
    if (p.a) {
      const w = el('a', 'add add--avisame'); w.href = avisame(p); w.target = '_blank'; w.rel = 'noopener';
      w.setAttribute('aria-label', 'Sin stock. Pedir aviso por WhatsApp cuando llegue ' + p.n);
      w.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0"/></svg><span>Avísame</span>';
      foot.append(w);
    } else {
      const b = el('button', 'add'); b.type = 'button'; b.dataset.add = p.id;
      b.setAttribute('aria-label', 'Agregar ' + p.n + ' al pedido');
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span>Agregar</span>';
      foot.append(b);
    }
    li.append(a, foot);
    return li;
  }

  /* ---------- catálogo (solo en la portada) ---------- */
  const grid = $('[data-grid]');
  const params = new URLSearchParams(location.search);
  const state = { cat: params.get('cat') && cats[params.get('cat')!] ? params.get('cat')! : 'todo', q: params.get('q') || '', sort: 'rel', min: null as number | null, max: null as number | null, page: 1 };
  const PAGE = 24;
  const q = $<HTMLInputElement>('#q')!;
  q.value = state.q;

  function results() {
    const { terms, list: l0 } = busca(state.q);
    const list = l0.filter((p) => (state.cat === 'todo' || p.c === state.cat) && (state.min == null || p.p >= state.min) && (state.max == null || p.p <= state.max));
    if (state.sort === 'asc') list.sort((a, b) => a.p - b.p);
    else if (state.sort === 'desc') list.sort((a, b) => b.p - a.p);
    else if (state.sort === 'az') list.sort((a, b) => a.n.localeCompare(b.n, 'es'));
    else if (terms.length) list.sort((a, b) => stockPrimero(a, b) || score(b, terms) - score(a, terms));
    else list.sort((a, b) => stockPrimero(a, b) || (b.f ? 1 : 0) - (a.f ? 1 : 0));
    return list;
  }
  function render() {
    if (!grid) return;
    const list = results();
    const shown = list.slice(0, state.page * PAGE);
    grid.replaceChildren(...shown.map(card));
    const more = $('[data-more]')!;
    more.hidden = shown.length >= list.length;
    more.textContent = `Ver más productos (${list.length - shown.length})`;
    $('[data-empty]')!.hidden = list.length > 0;
    $<HTMLAnchorElement>('[data-wa-search]')!.href = wa('Hola Franzshopp, ¿tienen ' + (state.q || 'este producto') + '?');
    $('[data-result-count]')!.textContent = list.length === 1 ? '1 producto' : list.length + ' productos';
    const act = $('[data-active]')!; act.replaceChildren();
    const chip = (txt: string, fn: () => void) => { const b = el('button', 'chip', txt); b.type = 'button'; b.setAttribute('aria-label', 'Quitar filtro ' + txt); b.onclick = fn; act.append(b); };
    if (state.q) chip('“' + state.q + '”', () => { state.q = ''; q.value = ''; state.page = 1; render(); });
    if (state.cat !== 'todo') chip(cats[state.cat].n, () => setCat('todo', false));
    if (state.min != null) chip('Desde ' + soles(state.min), () => { state.min = null; $<HTMLInputElement>('[data-min]')!.value = ''; render(); });
    if (state.max != null) chip('Hasta ' + soles(state.max), () => { state.max = null; $<HTMLInputElement>('[data-max]')!.value = ''; render(); });
    act.hidden = !act.children.length;
    const nf = Number(state.cat !== 'todo') + Number(state.min != null) + Number(state.max != null);
    const fn = $('[data-filter-n]')!; fn.textContent = String(nf); fn.hidden = !nf;
    $('[data-apply]')!.textContent = list.length ? `Ver ${list.length} producto${list.length === 1 ? '' : 's'}` : 'Sin resultados';
    $$('.catbar__btn').forEach((b) => b.setAttribute('aria-current', String(b.dataset.cat === state.cat)));
    $$<HTMLInputElement>('input[name=cat]').forEach((i) => { i.checked = i.value === state.cat; });
    // la dirección refleja siempre la búsqueda y categoría actuales (al recargar se ve lo mismo)
    const u = new URL(location.href);
    if (state.q) u.searchParams.set('q', state.q); else u.searchParams.delete('q');
    if (state.cat !== 'todo') u.searchParams.set('cat', state.cat); else u.searchParams.delete('cat');
    if (u.href !== location.href) history.replaceState(null, '', u);
    sync();
  }
  const toCatalog = () => $('#catalogo')?.scrollIntoView({ behavior: quieto() ? 'auto' : 'smooth', block: 'start' });
  function setCat(id: string, scroll = true) {
    state.cat = id; state.page = 1; render();
    if (scroll) toCatalog();
  }

  if (grid) {
    const flist = $('[data-filter-list]')!;
    [{ id: 'todo', n: 'Todas', t: P.length }, ...D.c].forEach((c) => {
      const li = el('li'); const lab = el('label', 'radio');
      const inp = el('input'); inp.type = 'radio'; inp.name = 'cat'; inp.value = c.id;
      lab.append(inp, el('span', 'radio__txt', c.n), el('span', 'radio__n num', String(c.t)));
      li.append(lab); flist.append(li);
    });
    flist.addEventListener('change', (e) => { const t = e.target as HTMLInputElement; if (t.name === 'cat') setCat(t.value, false); });
    $('[data-more]')!.addEventListener('click', () => { state.page++; render(); });
    $<HTMLSelectElement>('[data-sort]')!.addEventListener('change', (e) => { state.sort = (e.target as HTMLSelectElement).value; render(); });
    const num = (v: string) => (v === '' ? null : Math.max(0, Number(v)));
    $('[data-min]')!.addEventListener('input', (e) => { state.min = num((e.target as HTMLInputElement).value); state.page = 1; render(); });
    $('[data-max]')!.addEventListener('input', (e) => { state.max = num((e.target as HTMLInputElement).value); state.page = 1; render(); });
    $('[data-clear]')!.addEventListener('click', () => {
      Object.assign(state, { cat: 'todo', q: '', sort: 'rel', min: null, max: null, page: 1 });
      q.value = ''; $<HTMLSelectElement>('[data-sort]')!.value = 'rel'; $<HTMLInputElement>('[data-min]')!.value = ''; $<HTMLInputElement>('[data-max]')!.value = ''; render();
    });

    // filtros: en celular salen desde abajo
    const fPanel = $('[data-filters]')!, fBack = $('.sheet-backdrop')!, fOpen = $('[data-filters-open]')!;
    const isSheet = () => !matchMedia('(min-width: 64rem)').matches;
    let lastFocus: HTMLElement | null = null;
    const open = () => {
      if (!isSheet()) { fPanel.scrollIntoView({ behavior: quieto() ? 'auto' : 'smooth', block: 'start' }); return; }
      lastFocus = document.activeElement as HTMLElement;
      fBack.hidden = false; fPanel.classList.add('is-open'); fOpen.setAttribute('aria-expanded', 'true');
      document.documentElement.classList.add('no-scroll');
      fPanel.setAttribute('role', 'dialog'); fPanel.setAttribute('aria-modal', 'true');
      requestAnimationFrame(() => $('.filters__head .icon-btn', fPanel)?.focus());
    };
    const close = () => {
      if (!fPanel.classList.contains('is-open')) return;
      fPanel.classList.remove('is-open'); fBack.hidden = true; fOpen.setAttribute('aria-expanded', 'false');
      document.documentElement.classList.remove('no-scroll');
      fPanel.removeAttribute('role'); fPanel.removeAttribute('aria-modal');
      lastFocus?.focus(); toCatalog();
    };
    fOpen.addEventListener('click', open);
    $$('[data-filters-close]').forEach((b) => b.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    // si se gira la tablet y pasa a vista de computadora, se cierra el panel (si no, la página queda sin desplazarse)
    matchMedia('(min-width: 64rem)').addEventListener('change', (e) => { if (e.matches) close(); });
    const head = $('.filters__head', fPanel)!;
    let y0: number | null = null;
    head.addEventListener('pointerdown', (e) => { if (isSheet() && !(e.target as Element).closest('button')) { y0 = e.clientY; head.setPointerCapture(e.pointerId); } });
    head.addEventListener('pointermove', (e) => { if (y0 != null) fPanel.style.transform = `translateY(${Math.max(0, e.clientY - y0)}px)`; });
    const end = (e: PointerEvent) => { if (y0 == null) return; const d = e.clientY - y0; y0 = null; fPanel.style.transform = ''; if (d > 90) close(); };
    head.addEventListener('pointerup', end); head.addEventListener('pointercancel', end);

    render();
    if (state.q || params.has('cat')) requestAnimationFrame(toCatalog);
  }

  /* ---------- buscador con sugerencias ---------- */
  const form = $<HTMLFormElement>('[data-search]')!;
  const sug = $('#suggest')!;
  let active = -1, t = 0;
  function suggest() {
    const { terms, list } = busca(q.value);
    if (!terms.length) { closeSug(); return; }
    list.sort((a, b) => stockPrimero(a, b) || score(b, terms) - score(a, terms));
    sug.replaceChildren();
    list.slice(0, 6).forEach((p, i) => {
      const li = el('li', 'suggest__item'); li.id = 'sg-' + i; li.setAttribute('role', 'option'); li.dataset.href = link(p.id);
      li.append(pic(p, 'suggest__pic'));
      const tx = el('span', 'suggest__txt'); tx.append(el('span', 'suggest__name', p.n), el('span', 'suggest__cat', p.a ? 'Sin stock por ahora' : cats[p.c]?.n || ''));
      li.append(tx, el('span', 'suggest__price num', soles(p.p)));
      sug.append(li);
    });
    const all = el('li', 'suggest__all'); all.setAttribute('role', 'option'); all.id = 'sg-all';
    all.textContent = list.length ? `Ver los ${list.length} resultados de “${q.value.trim()}”` : `Sin resultados para “${q.value.trim()}”. Pregúntanos por WhatsApp`;
    sug.append(all);
    sug.hidden = false; q.setAttribute('aria-expanded', 'true'); active = -1;
  }
  function closeSug() { sug.hidden = true; q.setAttribute('aria-expanded', 'false'); q.removeAttribute('aria-activedescendant'); active = -1; }
  function runSearch() {
    if (!grid) { form.submit(); return; }
    state.q = q.value.trim(); state.page = 1; state.cat = 'todo'; closeSug(); render();
    toCatalog();
  }
  form.addEventListener('submit', (e) => { if (grid) { e.preventDefault(); runSearch(); } });
  q.addEventListener('input', () => { clearTimeout(t); t = window.setTimeout(suggest, 90); });
  q.addEventListener('focus', () => { if (q.value.trim()) suggest(); });
  q.addEventListener('keydown', (e) => {
    const items = $$('[role=option]', sug);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (sug.hidden) suggest();
      e.preventDefault();
      if (!items.length) return;
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((it, i) => it.setAttribute('aria-selected', String(i === active)));
      q.setAttribute('aria-activedescendant', items[active].id);
    } else if (e.key === 'Enter') {
      const it = items[active];
      if (it?.dataset.href) { e.preventDefault(); location.href = it.dataset.href; }
    } else if (e.key === 'Escape') closeSug();
  });
  sug.addEventListener('mousedown', (e) => e.preventDefault());
  sug.addEventListener('click', (e) => {
    const it = (e.target as Element).closest<HTMLElement>('[role=option]'); if (!it) return;
    if (it.dataset.href) location.href = it.dataset.href; else runSearch();
  });
  q.addEventListener('blur', () => setTimeout(closeSug, 120));
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !/input|textarea|select/i.test((document.activeElement as Element).tagName)) { e.preventDefault(); q.focus(); }
  });

  /* ---------- clics globales ---------- */
  const cartDlg = $<HTMLDialogElement>('[data-cart]')!;
  document.addEventListener('click', (e) => {
    const tg = e.target as Element;
    const a = tg.closest<HTMLElement>('[data-add]');
    if (a) {
      e.preventDefault();
      const from = a.dataset.qtyFrom ? Number($(a.dataset.qtyFrom)?.textContent || 1) : 1;
      add(a.dataset.add!, from);
      return;
    }
    if (tg.closest('[data-cart-open]')) { cartDlg.showModal(); return; }
    const cl = tg.closest('[data-close]');
    if (cl) { cl.closest('dialog')?.close(); return; }
    const c = tg.closest<HTMLElement>('[data-cat]');
    if (c && grid) { e.preventDefault(); setCat(c.dataset.cat!, true); }
  });
  cartDlg.addEventListener('click', (e) => { if (e.target === cartDlg) cartDlg.close(); });

  // cantidad en la ficha de producto
  $$('[data-step]').forEach((b) => b.addEventListener('click', () => {
    const out = $(b.dataset.target!)!;
    out.textContent = String(Math.max(1, Number(out.textContent) + Number(b.dataset.step)));
  }));

  // inclinación suave de la foto con el mouse (solo computadora)
  if (!quieto() && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('[data-tilt]').forEach((node) => {
      const max = Number(node.dataset.tilt) || 6;
      const inner = node.firstElementChild as HTMLElement;
      let raf = 0;
      node.addEventListener('pointermove', (e) => {
        const r = node.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          inner.style.transform = `perspective(900px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg)`;
          node.style.setProperty('--gx', ((x + 0.5) * 100).toFixed(1) + '%');
          node.style.setProperty('--gy', ((y + 0.5) * 100).toFixed(1) + '%');
        });
      });
      node.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); inner.style.transform = ''; });
    });
  }

  const setTop = () => document.documentElement.style.setProperty('--sticky-top', ($('.header') as HTMLElement).offsetHeight + 'px');
  setTop(); addEventListener('resize', setTop);
  sync();
}
