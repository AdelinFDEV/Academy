/**
 * Los garabatos del fondo del foro (23-11-2026, pedido por el admin, como los
 * de la página de logros pero de conversación): bocadillos, interrogaciones,
 * exclamaciones, los puntos de «está escribiendo», un check de resuelta, una
 * bombilla, un corazón de «me gusta» y una flecha de respuesta. Hechos «a
 * mano», de tamaños distintos y un poco torcidos, detrás de todo, en todas las
 * pantallas del foro (los pone MarcoForo). No se pulsan ni los lee nadie.
 *
 * Trazos SVG escritos a mano, sin librería: siempre iguales en el servidor y
 * en el navegador. El sitio de cada uno, en foro.css (`.fog-*`).
 */

type Garabato = { id: string; trazos: string[] };

const GARABATOS: Garabato[] = [
  { id: "bocadillo", trazos: ["M18 22c18-4 46-5 64 0 8 2 10 10 10 20s-2 18-10 20c-12 3-26 3-38 2L28 78l4-15c-6-1-11-2-14-4-7-4-9-12-8-20 1-9 2-15 8-17z"] },
  { id: "interrogacion", trazos: ["M32 34c0-14 14-22 27-18 13 4 14 20 4 27-7 5-12 8-12 18", "M51 80v1"] },
  { id: "exclamacion", trazos: ["M50 12c1 18 0 34-1 50", "M49 80v1"] },
  { id: "escribiendo", trazos: ["M10 30c26-6 54-6 80 0 6 2 8 8 8 18s-2 16-8 18c-26 6-54 6-80 0-6-2-8-8-8-18s2-16 8-18z", "M28 48v1", "M50 48v1", "M72 48v1"] },
  { id: "dos", trazos: ["M10 20h44a8 8 0 0 1 8 8v18a8 8 0 0 1-8 8H30l-12 10 3-10h-11a8 8 0 0 1-8-8V28a8 8 0 0 1 8-8z", "M70 46h18a8 8 0 0 1 8 8v14a8 8 0 0 1-8 8h-4l2 9-10-9H70a8 8 0 0 1-8-8"] },
  { id: "check", trazos: ["M14 52c8 6 14 12 20 20 14-22 30-38 50-52"] },
  { id: "bombilla", trazos: ["M50 12c-17 0-28 12-28 27 0 11 7 17 11 23 2 3 3 6 3 10h28c0-4 1-7 3-10 4-6 11-12 11-23 0-15-11-27-28-27z", "M38 82h24", "M42 90h16", "M50 2v4", "M16 16l4 4", "M84 16l-4 4"] },
  { id: "corazon", trazos: ["M50 84C24 66 10 50 14 34c4-14 22-20 34-4 10-16 30-12 36 2 6 16-10 34-34 52z"] },
  { id: "respuesta", trazos: ["M84 28c-30-12-62-2-66 30", "M8 50l10 12 12-8"] },
  { id: "dudas", trazos: ["M20 34c0-10 8-16 16-14 9 2 10 14 3 19-5 3-8 6-8 12", "M31 70v1", "M68 18c1 14 0 26-1 38", "M67 70v1"] },
  { id: "interrogacion2", trazos: ["M32 34c0-14 14-22 27-18 13 4 14 20 4 27-7 5-12 8-12 18", "M51 80v1"] },
  { id: "bocadillo2", trazos: ["M80 24c-18-5-44-5-62 1-8 3-10 11-9 20 1 10 4 16 12 18 10 2 22 2 32 1l20 14-4-16c6-2 10-5 12-10 3-9 2-24-1-28z"] },
  { id: "chispas", trazos: ["M50 10v20", "M50 70v20", "M10 50h20", "M70 50h20"] },
  { id: "espiral", trazos: ["M52 50c-4-6 6-9 9-3 4 8-6 15-14 11-11-5-8-21 4-24 15-4 27 9 22 24-5 17-27 22-40 12-15-12-12-36 5-45"] },
];

export default function GarabatosForo() {
  return (
    <div className="fog" aria-hidden="true">
      {GARABATOS.map((g) => (
        <svg key={g.id} className={`fog-${g.id}`} viewBox="0 0 100 100" fill="none">
          {g.trazos.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </svg>
      ))}
    </div>
  );
}
