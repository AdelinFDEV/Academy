import Image from "next/image";

/**
 * La portada de cada tarjeta del catálogo de cursos (08-11-2026).
 *
 * Dos capas, y la primera que exista manda:
 *
 * 1. **Una ilustración** del curso (`PORTADA_IMAGEN`): una imagen en
 *    `public/cursos/<slug>/portada.webp`, apaisada (1600 × 560 o similar), con
 *    el color del curso y el motivo centrado-derecha, porque a la izquierda van
 *    las etiquetas. Los prompts para generarlas están en CURSOS.md.
 * 2. **Arte en SVG** dibujado con el color del curso (`currentColor`): un
 *    motivo por tema (`MOTIVO`) y, sin entrada, uno genérico que varía con el
 *    slug. Así un curso nuevo nunca sale con la portada vacía.
 *
 * Todo es estático: nada se anima, para no castigar al móvil.
 */

/** Ilustración de cada curso. Sin entrada, el arte en SVG. */
const PORTADA_IMAGEN: Record<string, string> = {
  "psicologia-del-trading": "/cursos/psicologia-del-trading/portada.webp",
  "seguridad-cripto": "/cursos/seguridad-cripto/portada.webp",
  "coinmarketcap-y-coingecko": "/cursos/coinmarketcap-y-coingecko/portada.webp",
  "bitcoin-y-dca": "/cursos/bitcoin-y-dca/portada.webp",
  "futuros-y-apalancamiento": "/cursos/futuros-y-apalancamiento/portada.webp",
  "analisis-tecnico-sin-humo": "/cursos/analisis-tecnico-sin-humo/portada.webp",
  "defi-y-stablecoins": "/cursos/defi-y-stablecoins/portada.webp",
};

type Motivo = "pulso" | "escudo" | "datos" | "peldanos" | "balanza" | "velas" | "vasos" | "generico";
const MOTIVO: Record<string, Motivo> = {
  "psicologia-del-trading": "pulso",
  "seguridad-cripto": "escudo",
  "coinmarketcap-y-coingecko": "datos",
  "bitcoin-y-dca": "peldanos",
  "futuros-y-apalancamiento": "balanza",
  "analisis-tecnico-sin-humo": "velas",
  "defi-y-stablecoins": "vasos",
};

/** Un número estable a partir del slug, para variar el arte genérico. */
function semilla(slug: string): number {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** Una línea de electrocardiograma de lado a lado, con su latido en `x`. */
function latido(y: number, x: number, alto: number): string {
  return [
    `M0 ${y}`,
    `L${x - 40} ${y}`,
    `L${x - 28} ${y - alto * 0.18}`,
    `L${x - 18} ${y}`,
    `L${x - 8} ${y}`,
    `L${x} ${y - alto}`,
    `L${x + 10} ${y + alto * 0.55}`,
    `L${x + 20} ${y}`,
    `L${x + 34} ${y}`,
    `L${x + 46} ${y - alto * 0.24}`,
    `L${x + 60} ${y}`,
    `L400 ${y}`,
  ].join(" ");
}

function ArtePulso() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={latido(30 + i * 22, 250 + i * 18, 14)} fill="none" stroke="currentColor" strokeWidth="1" opacity={0.12 + i * 0.03} />
      ))}
      <path d={latido(96, 300, 58)} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" opacity="0.85" />
      {[26, 48, 70].map((r, i) => (
        <circle key={r} cx="300" cy="62" r={r} fill="none" stroke="currentColor" strokeWidth="1" opacity={0.28 - i * 0.07} />
      ))}
      <circle cx="300" cy="38" r="3.5" fill="currentColor" />
    </>
  );
}

function ArteEscudo({ id }: { id: string }) {
  const escudo = (e: number) =>
    `M300 ${70 - 54 * e} L${300 + 42 * e} ${70 - 38 * e} V${70 + 2 * e} C${300 + 42 * e} ${70 + 32 * e} ${300 + 22 * e} ${70 + 50 * e} 300 ${70 + 60 * e} C${300 - 22 * e} ${70 + 50 * e} ${300 - 42 * e} ${70 + 32 * e} ${300 - 42 * e} ${70 + 2 * e} V${70 - 38 * e} Z`;
  return (
    <>
      <defs>
        <pattern id={`${id}-hex`} width="28" height="48.5" patternUnits="userSpaceOnUse" patternTransform="scale(0.9)">
          <path d="M14 0 L28 8.08 V24.25 L14 32.33 L0 24.25 V8.08 Z M14 32.33 V48.5" fill="none" stroke="currentColor" strokeWidth="0.8" />
        </pattern>
        <radialGradient id={`${id}-desv`} cx="75%" cy="50%" r="60%">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}-mask`}>
          <rect width="400" height="140" fill={`url(#${id}-desv)`} />
        </mask>
      </defs>
      <rect width="400" height="140" fill={`url(#${id}-hex)`} opacity="0.35" mask={`url(#${id}-mask)`} />
      {[1.25, 1, 0.75].map((e, i) => (
        <path key={e} d={escudo(e)} fill="none" stroke="currentColor" strokeWidth={i === 2 ? 2.2 : 1} strokeLinejoin="round" opacity={i === 2 ? 0.9 : 0.25 + i * 0.12} />
      ))}
      <circle cx="300" cy="62" r="7" fill="none" stroke="currentColor" strokeWidth="2.2" opacity="0.9" />
      <path d="M300 69 V84" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.9" />
    </>
  );
}

/** Una tabla de datos: barras de distinta altura y una lupa sobre una de ellas. */
function ArteDatos() {
  const barras = [34, 52, 28, 70, 46, 88, 60, 40, 76];
  return (
    <>
      {[30, 55, 80, 105].map((y) => (
        <line key={y} x1="190" y1={y} x2="400" y2={y} stroke="currentColor" strokeWidth="1" opacity="0.1" />
      ))}
      {barras.map((alto, i) => (
        <rect key={i} x={204 + i * 21} y={118 - alto} width="11" height={alto} rx="2" fill="currentColor" opacity={i === 5 ? 0.85 : 0.2 + (i % 3) * 0.06} />
      ))}
      <circle cx="314" cy="52" r="30" fill="none" stroke="currentColor" strokeWidth="2.2" opacity="0.9" />
      <circle cx="314" cy="52" r="42" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.22" />
      <path d="M336 74 L360 98" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
    </>
  );
}

/** Compras iguales, una al mes: columnas del mismo ancho que suben a paso fijo, y una moneda. */
function ArtePeldanos() {
  const columnas = Array.from({ length: 10 }, (_, i) => 14 + i * 9);
  return (
    <>
      {[30, 55, 80, 105].map((y) => (
        <line key={y} x1="180" y1={y} x2="400" y2={y} stroke="currentColor" strokeWidth="1" opacity="0.1" />
      ))}
      {columnas.map((alto, i) => (
        <rect key={i} x={196 + i * 19} y={122 - alto} width="12" height={alto} rx="2" fill="currentColor" opacity={0.16 + i * 0.03} />
      ))}
      <path d={columnas.map((alto, i) => `${i === 0 ? "M" : "L"}${202 + i * 19} ${116 - alto}`).join(" ")} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      <circle cx="246" cy="42" r="20" fill="none" stroke="currentColor" strokeWidth="2.2" opacity="0.9" />
      <circle cx="246" cy="42" r="30" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.22" />
      <path d="M246 33 V51" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.9" />
    </>
  );
}

/** Una balanza vencida hacia un lado y, detrás, un precio que cae en escalones. */
function ArteBalanza() {
  return (
    <>
      {[30, 55, 80, 105].map((y) => (
        <line key={y} x1="180" y1={y} x2="400" y2={y} stroke="currentColor" strokeWidth="1" opacity="0.1" />
      ))}
      <path d="M196 26 H236 V48 H268 V44 H300 V82 H336 V78 H372 V118 H400" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.28" />
      <path d="M296 30 V112 M272 112 H320" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
      <path d="M236 58 L356 34" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
      <path d="M222 86 L236 58 L250 86 A14 9 0 0 1 222 86 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" opacity="0.6" />
      <path d="M334 74 L356 34 L378 74 A22 13 0 0 1 334 74 Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" opacity="0.9" />
      <circle cx="296" cy="30" r="4" fill="currentColor" />
    </>
  );
}

/** Una fila de velas japonesas; la última, destacada, deja escapar una voluta de humo. */
function ArteVelas() {
  // [x, mínimo, máximo, base del cuerpo, alto del cuerpo]
  const velas: [number, number, number, number, number][] = [
    [204, 70, 112, 82, 22], [226, 60, 104, 70, 26], [248, 66, 100, 72, 18], [270, 48, 94, 58, 28],
    [292, 54, 88, 60, 20], [314, 36, 84, 46, 30], [358, 30, 70, 38, 22], [380, 22, 60, 28, 24],
  ];
  return (
    <>
      {[30, 55, 80, 105].map((y) => (
        <line key={y} x1="180" y1={y} x2="400" y2={y} stroke="currentColor" strokeWidth="1" opacity="0.1" />
      ))}
      {velas.map(([x, min, max, base, alto], i) => (
        <g key={x} opacity={0.22 + (i % 3) * 0.06}>
          <line x1={x} y1={min} x2={x} y2={max} stroke="currentColor" strokeWidth="1.2" />
          <rect x={x - 5} y={base} width="10" height={alto} rx="2" fill="currentColor" />
        </g>
      ))}
      <line x1="336" y1="40" x2="336" y2="112" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
      <rect x="328" y="56" width="16" height="42" rx="3" fill="none" stroke="currentColor" strokeWidth="2.2" opacity="0.9" />
      <path d="M336 36 C328 28 344 22 336 14 C330 8 340 4 338 -2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
    </>
  );
}

/** Dos depósitos comunicados por un tubo, al mismo nivel, sobre una red de nodos. */
function ArteVasos() {
  const nodos: [number, number][] = [[196, 28], [232, 104], [262, 20], [300, 124], [344, 16], [378, 96], [392, 44]];
  return (
    <>
      {nodos.map(([x, y], i) => {
        const [x2, y2] = nodos[(i + 2) % nodos.length];
        return <line key={i} x1={x} y1={y} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1" opacity="0.1" />;
      })}
      {nodos.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" fill="currentColor" opacity="0.28" />
      ))}
      <rect x="252" y="34" width="38" height="78" rx="6" fill="none" stroke="currentColor" strokeWidth="2.2" opacity="0.9" />
      <rect x="322" y="34" width="38" height="78" rx="6" fill="none" stroke="currentColor" strokeWidth="2.2" opacity="0.9" />
      <rect x="255" y="70" width="32" height="39" rx="3" fill="currentColor" opacity="0.28" />
      <rect x="325" y="70" width="32" height="39" rx="3" fill="currentColor" opacity="0.28" />
      <path d="M290 100 H322" stroke="currentColor" strokeWidth="5" opacity="0.55" />
      <path d="M252 70 H290 M322 70 H360" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
    </>
  );
}

function ArteGenerico({ slug }: { slug: string }) {
  const s = semilla(slug);
  const cx = 260 + (s % 80);
  const giro = s % 60;
  return (
    <>
      {[18, 34, 52, 72, 94].map((r, i) => (
        <circle key={r} cx={cx} cy="70" r={r} fill="none" stroke="currentColor" strokeWidth={i === 1 ? 2 : 1} opacity={i === 1 ? 0.8 : 0.3 - i * 0.04} />
      ))}
      <g transform={`rotate(${giro} ${cx} 70)`} opacity="0.18">
        {Array.from({ length: 14 }, (_, i) => (
          <line key={i} x1={cx - 160 + i * 24} y1="-40" x2={cx - 100 + i * 24} y2="180" stroke="currentColor" strokeWidth="1" />
        ))}
      </g>
      <circle cx={cx + 34} cy="70" r="4" fill="currentColor" />
    </>
  );
}

export default function PortadaCurso({ slug, titulo }: { slug: string; titulo: string }) {
  const imagen = PORTADA_IMAGEN[slug];
  if (imagen) {
    return (
      <Image
        src={imagen}
        alt={`Ilustración del curso ${titulo}`}
        fill
        sizes="(max-width: 600px) 100vw, 560px"
        className="cx-portada-img"
      />
    );
  }
  const motivo = MOTIVO[slug] ?? "generico";
  const id = `pc-${slug}`;
  return (
    <svg className="cx-portada-arte" viewBox="0 0 400 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {motivo === "pulso" && <ArtePulso />}
      {motivo === "escudo" && <ArteEscudo id={id} />}
      {motivo === "datos" && <ArteDatos />}
      {motivo === "peldanos" && <ArtePeldanos />}
      {motivo === "balanza" && <ArteBalanza />}
      {motivo === "velas" && <ArteVelas />}
      {motivo === "vasos" && <ArteVasos />}
      {motivo === "generico" && <ArteGenerico slug={slug} />}
    </svg>
  );
}
