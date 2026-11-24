/* Carrusel de portada: campañas de web/banners.js.
   - Se desliza igual que la tienda actual: las pantallas van una al lado de la otra y el dedo
     las arrastra de verdad (scroll nativo con imán), así se siente suelto en el celular.
   - Pasa solo cada 6 s (la pantalla de la pistola que se desarma, 8,4 s); se detiene un rato si la persona lo toca, y no se mueve solo
     si el teléfono pide menos movimiento.
   - Toques de React Bits en la pantalla visible: título con desenfoque, brillo en la etiqueta
     y precio "desde" que cuenta. */
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import BlurText from './reactbits/BlurText';
import CountUp from './reactbits/CountUp';
import ShinyText from './reactbits/ShinyText';
import Navidad from './Navidad';
import Heroe, { DURACION_HEROE, type HeroeSlide } from './Heroe';

export type SlideProducto = { id: string; nombre: string; precio: number; oferta?: number; foto: string; href: string };
export type Slide = {
  tema: string; etiqueta: string; titulo: string; texto: string;
  boton: { texto: string; href: string; cat?: string; wa?: boolean };
  productos: SlideProducto[];
  destacado?: { texto: string; valor: number };
  lugar?: string;
  heroe?: HeroeSlide;
};

const CADA = 6000;
const soles = (n: number) => 'S/ ' + n.toLocaleString('es-PE', { maximumFractionDigits: 2 });
const brillo: Record<string, [string, string]> = {
  noche: ['#7fe3ef', '#ffffff'], total: ['#ffffff', '#06363d'], navidad: ['#f3cf7a', '#fff6dc'], turquesa: ['#e8fbfd', '#ffffff'], claro: ['#0b7d8f', '#7fe3ef'],
};

export default function Carrusel({ slides }: { slides: Slide[] }) {
  const quieto = useReducedMotion();
  const pista = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState(0);
  const [visita, setVisita] = useState(0); // vuelve a animar el título cada vez que se llega a una pantalla
  const actualRef = useRef(0);
  const espera = useRef(0);
  const n = slides.length;

  const pausar = (ms: number) => { espera.current = Date.now() + ms; };

  const ir = (k: number, porPersona: boolean) => {
    const el = pista.current; if (!el) return;
    const destino = ((k % n) + n) % n;
    const s = el.children[destino] as HTMLElement;
    el.scrollTo({ left: s.offsetLeft - el.offsetLeft, behavior: quieto ? 'auto' : 'smooth' });
    if (porPersona) pausar(8000);
  };

  // qué pantalla se ve (la que ocupa más del 60 %)
  useEffect(() => {
    const el = pista.current; if (!el) return;
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => {
        if (en.isIntersecting && en.intersectionRatio > 0.6) {
          const k = Array.prototype.indexOf.call(el.children, en.target);
          if (k !== actualRef.current) { actualRef.current = k; setActual(k); setVisita((v) => v + 1); }
        }
      });
    }, { root: el, threshold: [0.6] });
    Array.from(el.children).forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [n]);

  // avance automático: cada pantalla dura CADA (la de la pistola que se desarma, un poco más).
  // Si la persona la está tocando o la pestaña no se ve, vuelve a probar en 1 s.
  useEffect(() => {
    if (quieto || n < 2) return;
    let t = 0;
    const tick = () => {
      if (Date.now() > espera.current && !document.hidden) ir(actualRef.current + 1, false);
      else t = window.setTimeout(tick, 1000);
    };
    t = window.setTimeout(tick, slides[actual]?.heroe ? DURACION_HEROE : CADA);
    return () => clearTimeout(t);
  }, [quieto, n, actual]);

  return (
    <section className="slider" aria-roledescription="carrusel" aria-label="Campañas y ofertas">
      <div
        ref={pista}
        className="slider__track"
        tabIndex={0}
        onPointerDown={() => pausar(9000)}
        onTouchStart={() => pausar(9000)}
        onWheel={() => pausar(9000)}
        onFocus={() => pausar(9000)}
        onMouseEnter={() => pausar(1e9)}
        onMouseLeave={() => pausar(2500)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); ir(actual + 1, true); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); ir(actual - 1, true); }
        }}
      >
        {slides.map((s, k) => {
          const ve = k === actual;
          const [c1, c2] = brillo[s.tema] ?? brillo.noche;
          return (
            <article
              key={k}
              className={`slide slide--${s.tema}${ve ? ' is-current' : ''}`}
              role="group"
              aria-roledescription="pantalla"
              aria-label={`${k + 1} de ${n}: ${s.titulo}`}
              inert={!ve || undefined}
            >
              {s.tema === 'navidad' && <Navidad activo={ve} quieto={!!quieto} />}
              {s.lugar && (
                <svg className="slide__misti" viewBox="0 0 600 220" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
                  <path d="M0 220 L120 150 L170 168 L330 40 Q345 30 362 40 L470 118 L520 104 L600 150 V220Z" />
                  <path className="slide__misti-nieve" d="M300 66 L330 40 Q345 30 362 40 L394 64 L378 72 L362 62 L346 76 L330 64 L316 74Z" />
                </svg>
              )}
              <div className="slide__copy">
                {s.lugar && (
                  <p className="slide__place">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
                    {s.lugar}
                  </p>
                )}
                <p className="slide__tag">
                  {quieto ? s.etiqueta : <ShinyText text={s.etiqueta} color={c1} shineColor={c2} speed={3.2} delay={1.2} trigger="loop" />}
                </p>
                <h2 className="slide__title">
                  {ve && !quieto
                    ? <BlurText key={`t${visita}`} text={s.titulo} animateBy="words" direction="bottom" trigger="load" delay={60} stepDuration={0.34} blur={10} />
                    : s.titulo}
                </h2>
                {s.texto && <p className="slide__text">{s.texto}</p>}
                {s.destacado && (
                  <p className="slide__stat">
                    <span>{s.destacado.texto}</span>
                    <strong className="num">
                      S/{' '}
                      {ve && !quieto ? <CountUp key={`c${visita}`} from={0} to={s.destacado.valor} duration={1.1} delay={0.2} trigger="load" separator="," /> : s.destacado.valor}
                    </strong>
                  </p>
                )}
                <div className="slide__actions">
                  <a
                    className={`btn ${s.tema === 'claro' ? 'btn--dark' : 'btn--accent'}`}
                    href={s.boton.href}
                    data-cat={s.boton.cat}
                    data-wa={s.boton.wa ? '' : undefined}
                    draggable={false}
                  >{s.boton.texto}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></a>
                </div>
              </div>

              <div className={`slide__stage${s.heroe ? ' slide__stage--heroe' : ''}`}>
                {s.heroe && <Heroe h={s.heroe} activo={ve} quieto={!!quieto} visita={visita} primera={k === 0} />}
                {!s.heroe && s.productos.map((p, j) => (
                  <a
                    key={p.id}
                    className={`slide__card slide__card--${'abc'[j]}`}
                    href={p.href}
                    draggable={false}
                    aria-label={`Ver ${p.nombre}, ${soles(p.oferta ?? p.precio)}`}
                  >
                    <span className="slide__inner">
                      <img src={p.foto} alt="" width={600} height={600} decoding="async" draggable={false}
                        loading={k === 0 ? 'eager' : 'lazy'} fetchPriority={k === 0 && j === 0 ? 'high' : 'auto'} />
                      <span className="slide__price">
                        <span className="slide__pname">{p.nombre}</span>
                        <span className="slide__prices">
                          {p.oferta ? (<><s className="num">{soles(p.precio)}</s><strong className="num">{soles(p.oferta)}</strong></>) : <strong className="num">{soles(p.precio)}</strong>}
                        </span>
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      {n > 1 && (
        <div className="slider__ui">
          <button type="button" className="slider__btn" onClick={() => ir(actual - 1, true)} aria-label="Pantalla anterior">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
          </button>
          <div className="slider__dots" role="group" aria-label="Elegir pantalla">
            {slides.map((sl, k) => (
              <button key={k} type="button" className="slider__dot" aria-current={k === actual}
                aria-label={`Ir a la pantalla ${k + 1}: ${sl.titulo}`} onClick={() => ir(k, true)} />
            ))}
          </div>
          <button type="button" className="slider__btn" onClick={() => ir(actual + 1, true)} aria-label="Pantalla siguiente">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
          </button>
        </div>
      )}
    </section>
  );
}
