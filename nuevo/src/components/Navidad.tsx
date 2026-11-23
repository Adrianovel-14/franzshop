/* Ambientación de la pantalla de Navidad del carrusel:
   - nieve que cae (bolitas redondas de distintos tamaños, con un vaivén suave),
   - guirnalda de luces que titilan arriba,
   - bolas de Navidad colgando que se mecen,
   - nieve acumulada abajo.
   La nieve solo se anima cuando la pantalla está a la vista y la pestaña abierta;
   con "reducir movimiento" queda quieta (se dibuja una sola vez). */
import { useEffect, useRef } from 'react';

type Copo = { x: number; y: number; r: number; vy: number; amp: number; fase: number; vf: number; a: number };

export default function Navidad({ activo, quieto }: { activo: boolean; quieto: boolean }) {
  const lienzo = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = lienzo.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    let w = 0, h = 0, copos: Copo[] = [], raf = 0, antes = 0;

    const nuevo = (arriba: boolean): Copo => {
      const r = Math.random() < 0.18 ? 2.6 + Math.random() * 2.4 : 0.9 + Math.random() * 1.7; // algunas bolas grandes
      return {
        x: Math.random() * w, y: arriba ? -10 - Math.random() * 40 : Math.random() * h,
        r, vy: 18 + r * 9 + Math.random() * 14, amp: 6 + Math.random() * 16,
        fase: Math.random() * Math.PI * 2, vf: 0.6 + Math.random() * 0.9, a: 0.55 + Math.random() * 0.4,
      };
    };
    const medir = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(140, Math.round((w * h) / 7000));
      copos = Array.from({ length: n }, () => nuevo(false));
    };
    const dibujar = () => {
      ctx.clearRect(0, 0, w, h);
      for (const c of copos) {
        const x = c.x + Math.sin(c.fase) * c.amp;
        if (c.r > 2.4) {
          const g = ctx.createRadialGradient(x - c.r * 0.3, c.y - c.r * 0.3, 0, x, c.y, c.r);
          g.addColorStop(0, `rgba(255,255,255,${c.a})`);
          g.addColorStop(1, `rgba(255,255,255,${c.a * 0.35})`);
          ctx.fillStyle = g;
        } else ctx.fillStyle = `rgba(255,255,255,${c.a})`;
        ctx.beginPath(); ctx.arc(x, c.y, c.r, 0, Math.PI * 2); ctx.fill();
      }
    };
    const paso = (t: number) => {
      const dt = Math.min(0.05, (t - (antes || t)) / 1000); antes = t;
      for (let k = 0; k < copos.length; k++) {
        const c = copos[k];
        c.y += c.vy * dt; c.fase += c.vf * dt;
        if (c.y - c.r > h) copos[k] = nuevo(true);
      }
      dibujar();
      raf = requestAnimationFrame(paso);
    };

    medir(); dibujar();
    const ro = new ResizeObserver(() => { medir(); dibujar(); });
    ro.observe(cv);
    const arrancar = () => { if (!raf && activo && !quieto && !document.hidden) { antes = 0; raf = requestAnimationFrame(paso); } };
    const parar = () => { cancelAnimationFrame(raf); raf = 0; };
    const vis = () => (document.hidden ? parar() : arrancar());
    document.addEventListener('visibilitychange', vis);
    arrancar();
    return () => { parar(); ro.disconnect(); document.removeEventListener('visibilitychange', vis); };
  }, [activo, quieto]);

  // luces de la guirnalda: posición a lo largo de una curva y color
  const colores = ['#ff5a4e', '#ffd25e', '#5ee08a', '#6cc8ff', '#ffd25e'];
  const luces = Array.from({ length: 15 }, (_, k) => {
    const x = 20 + k * (960 / 14);
    const y = 14 + Math.sin((k / 14) * Math.PI * 3) * 9 + 8;
    return { x, y, c: colores[k % colores.length], d: (k % 4) * 0.45 };
  });

  return (
    <div className="xmas" aria-hidden="true">
      <svg className="xmas__luces" viewBox="0 0 1000 60" preserveAspectRatio="none">
        <path d={`M0 18 ${luces.map((l) => `L${l.x} ${l.y - 6}`).join(' ')} L1000 18`} fill="none" stroke="rgba(20,40,25,.9)" strokeWidth="2" />
        {luces.map((l, k) => (
          <g key={k} className="xmas__luz" style={{ animationDelay: `${l.d}s` }}>
            <rect x={l.x - 3} y={l.y - 7} width="6" height="5" rx="1" fill="#2b3a2e" />
            <ellipse cx={l.x} cy={l.y + 5} rx="5" ry="8" fill={l.c} />
          </g>
        ))}
      </svg>

      <div className="xmas__bolas">
        <span className="xmas__bola xmas__bola--1"><i /></span>
        <span className="xmas__bola xmas__bola--2"><i /></span>
        <span className="xmas__bola xmas__bola--3"><i /></span>
      </div>

      <canvas ref={lienzo} className="xmas__nieve" />

      <svg className="xmas__suelo" viewBox="0 0 1000 80" preserveAspectRatio="none">
        <path d="M0 50 C80 30 160 44 240 38 C330 30 400 52 500 44 C600 36 680 22 780 36 C860 46 930 30 1000 40 V80 H0Z" fill="rgba(255,255,255,.92)" />
        <path d="M0 62 C120 50 220 66 340 58 C460 50 560 70 700 60 C820 52 900 64 1000 56 V80 H0Z" fill="#eaf2f8" />
      </svg>
    </div>
  );
}
