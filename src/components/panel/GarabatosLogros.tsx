/**
 * Los garabatos del fondo de la página de logros (23-11-2026, pedido por el
 * admin): espirales, estrellas, rizos, zigzags, flechas y tachones hechos «a
 * mano», de tamaños distintos y un poco torcidos, como los márgenes de un
 * cuaderno. Van detrás de todo, no se pueden pulsar y no los lee nadie.
 *
 * Los trazos son SVG escritos a mano (sin librería) para que sean siempre los
 * mismos y no cambien entre el servidor y el navegador. El sitio de cada uno,
 * en logros.css (`.lgg-*`).
 */

type Garabato = {
  /** Su clase de posición en logros.css. */
  id: string;
  /** El tamaño de su lienzo (viewBox cuadrado). */
  caja: number;
  trazos: string[];
};

const GARABATOS: Garabato[] = [
  { id: "espiral", caja: 100, trazos: ["M52 50c-4-6 6-9 9-3 4 8-6 15-14 11-11-5-8-21 4-24 15-4 27 9 22 24-5 17-27 22-40 12-15-12-12-36 5-45 19-10 43-1 49 19"] },
  { id: "estrella", caja: 100, trazos: ["M50 12l9 26 27 1-21 17 8 27-23-16-22 15 7-26-21-17 27-1z"] },
  { id: "rizo", caja: 160, trazos: ["M8 80c18-30 34-30 30-6s-26 26-14 2 40-38 46-10-22 32-8 10 44-34 50-6-20 30-6 8 38-30 46-4"] },
  { id: "zigzag", caja: 140, trazos: ["M6 60l16-22 14 26 15-28 14 27 16-26 14 25 16-24 14 22"] },
  { id: "flecha", caja: 120, trazos: ["M10 92c20-6 44-22 58-46 6-10 10-20 12-30", "M64 22l17-8 3 19"] },
  { id: "circulo", caja: 110, trazos: ["M58 14c-28-2-48 18-46 42s26 40 50 36 38-26 32-48-28-30-46-26c-10 2-16 8-18 12"] },
  { id: "chispas", caja: 90, trazos: ["M45 8v22M45 60v22M8 45h22M60 45h22", "M20 20l10 10M60 60l10 10M70 20l-10 10M20 70l10-10"] },
  { id: "corazon", caja: 100, trazos: ["M50 84C24 66 10 50 14 34c4-14 22-20 34-4 10-16 30-12 36 2 6 16-10 34-34 52z"] },
  { id: "tachon", caja: 130, trazos: ["M10 40c22-6 48-8 72-4 14 2 26 6 36 10", "M14 62c26-8 52-8 78-4 10 2 18 4 26 8", "M18 84c24-6 46-6 70-2"] },
  { id: "bucle", caja: 150, trazos: ["M10 100c30 0 40-60 70-60 20 0 22 26 4 26-20 0-14-40 18-40 26 0 30 30 40 46"] },
  { id: "estrellita", caja: 60, trazos: ["M30 6l6 17 18 1-14 11 5 18-15-10-15 10 5-18-14-11 18-1z"] },
  { id: "ondas", caja: 140, trazos: ["M8 40c12-12 24-12 36 0s24 12 36 0 24-12 36 0", "M8 66c12-12 24-12 36 0s24 12 36 0 24-12 36 0"] },
  { id: "espiral2", caja: 90, trazos: ["M46 46c3-4 9 0 6 5-4 6-14 2-12-6 2-10 18-12 23-2 6 12-6 24-19 22-16-2-22-20-12-32 12-14 36-10 41 8"] },
  { id: "cruz", caja: 70, trazos: ["M14 16c14 12 28 26 40 40", "M54 14C42 28 28 42 16 56"] },
];

export default function GarabatosLogros() {
  return (
    <div className="lgg" aria-hidden="true">
      {GARABATOS.map((g) => (
        <svg key={g.id} className={`lgg-${g.id}`} viewBox={`0 0 ${g.caja} ${g.caja}`} fill="none">
          {g.trazos.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </svg>
      ))}
    </div>
  );
}
