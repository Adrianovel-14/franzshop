/* Pistola de impacto que se desarma (despiece) en una pantalla del carrusel (campo `heroe` en web/banners.js).
   Es solo visual (no lleva a ningún producto). Tres fotos sin fondo: cuerpo, dado y batería,
   colocadas sobre un lienzo de 1500 × 980 unidades (medidas en global.css, sección "despiece").

   Recorrido (8,4 s, se repite; empieza armada cada vez que se llega a la pantalla):
   0,4–1,2 s  dispara: vibra, el dado gira, salen ondas y chispas
   1,4 s      se desarma en 1,25 s (curva power2.inOut): el dado va a la izquierda y queda parado,
              la batería va a la derecha y gira 90° (sus rieles miran a la pistola), la cámara se aleja
   2,5 s      aparecen los nombres: Dado de impacto · Pistola de impacto · Batería
   5,6 s      la cámara vuelve en 1,25 s; las piezas esperan 0,15 s y encajan en 1,4 s
   7,15 s     "clic": destello en las dos uniones
   La pantalla dura 8,4 s en el carrusel (Carrusel.tsx) para que se vea completo.
   Con "menos movimiento" en el teléfono se queda quieta y armada. */
import CountUp from './reactbits/CountUp';

export type HeroeSlide = { foto: string; dado: string; bateria: string; cifra?: number; unidad?: string };
export const DURACION_HEROE = 8400;

export default function Heroe({ h, activo, quieto, visita, primera }: {
  h: HeroeSlide; activo: boolean; quieto: boolean; visita: number; primera: boolean;
}) {
  const carga = primera ? 'eager' : 'lazy';
  return (
    <div className="heroe" aria-hidden="true">
      <span className="heroe__foco" />
      <span className="heroe__piso" />

      <span className="heroe__flota">
        {/* key: al volver a la pantalla, la animación arranca de nuevo desde armada */}
        <span className="despiece" key={activo ? `v${visita}` : 'quieto'}>
          <svg className="despiece__guias" viewBox="0 0 1500 980" preserveAspectRatio="none">
            <path d="M268 300L428 214" />
            <path d="M823 790Q1020 850 1182 640" />
          </svg>
          {/* cotas con medidas (salen cuando está desarmada) */}
          <svg className="despiece__cotas" viewBox="0 0 1500 980" preserveAspectRatio="none">
            <path d="M148 186H272M148 174V198M272 174V198" />
            <path d="M430 150H506M430 138V162M506 138V162" />
            <path d="M1185 438H1415M1185 426V450M1415 426V450" />
          </svg>
          <span className="despiece__cota despiece__cota--dado">Ø 27 mm</span>
          <span className="despiece__cota despiece__cota--yunque">3/4″</span>
          <span className="despiece__cota despiece__cota--bateria">20V · 8.0 Ah</span>
          <span className="despiece__pieza despiece__bateria">
            <img src={h.bateria} alt="" width={480} height={335} decoding="async" draggable={false} loading={carga} />
          </span>
          <span className="despiece__pieza despiece__cuerpo">
            <img src={h.foto} alt="" width={644} height={716} decoding="async" draggable={false} loading={carga} />
            <span className="heroe__brillo" style={{ ['--img' as string]: `url("${h.foto}")` }} />
          </span>
          <span className="despiece__pieza despiece__dado">
            <img src={h.dado} alt="" width={360} height={184} decoding="async" draggable={false} loading={carga} />
          </span>

          {/* nombres de las piezas (salen cuando está desarmada) */}
          <span className="despiece__nombre despiece__nombre--dado">Dado de impacto</span>
          <span className="despiece__nombre despiece__nombre--cuerpo">Pistola de impacto</span>
          <span className="despiece__nombre despiece__nombre--bateria">Batería</span>

          {/* golpe en la boca del dado */}
          <span className="heroe__golpe">
            <span className="heroe__giro" />
            <span className="heroe__onda" /><span className="heroe__onda" /><span className="heroe__onda" />
            {Array.from({ length: 7 }, (_, i) => <span key={i} className="heroe__chispa" style={{ ['--a' as string]: `${120 + i * 20}deg` }} />)}
          </span>
          {/* "clic" al encajar */}
          <span className="despiece__clic despiece__clic--dado" />
          <span className="despiece__clic despiece__clic--bateria" />
        </span>
      </span>

      {h.cifra && (
        <p className="heroe__cifra">
          <strong className="num">
            {activo && !quieto
              ? <CountUp key={`h${visita}`} from={0} to={h.cifra} duration={1.4} delay={0.35} trigger="load" separator="" />
              : h.cifra}
          </strong>
          <span>{h.unidad} de torque</span>
        </p>
      )}
    </div>
  );
}
