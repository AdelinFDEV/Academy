import type { CSSProperties, ReactNode } from "react";
import rough from "roughjs";
import TrazoVisible from "./TrazoVisible";
import type { ColorCuaderno } from "./colores";
import "./simbolo-estudio.css";

/**
 * Los símbolos que alguien que estudia dibuja al margen del cuaderno: la
 * estrella de «importante», la flecha que señala, el «¡ojo!», el check de lo
 * que está bien, el asterisco de la nota, el «NB» y el aro que rodea un número
 * de paso. Más `Llave`, la llave «}» que agrupa una lista.
 *
 * Son decoración: van con `aria-hidden`, no llevan texto y no cambian nada de
 * lo que leen Google o un lector de pantalla. Se dibujan con roughjs, con una
 * semilla fija, en el servidor (no hace falta JavaScript para verlos) y se
 * trazan solos al entrar en pantalla (TrazoVisible).
 *
 * Al margen (`margen`): en pantallas anchas salen a la izquierda del párrafo,
 * fuera del texto; en el móvil se quedan junto a la primera palabra. Para eso
 * tienen que ser el PRIMER hijo del párrafo.
 *
 * Nació en la guía de Ethereum (17-11-2026), pensado para todas las guías.
 */

export type TipoSimbolo = "estrella" | "flecha" | "exclamacion" | "check" | "asterisco" | "nb" | "aro";

type Trazo = { d: string; relleno: boolean };

const generador = rough.generator();
type Dibujo = ReturnType<typeof generador.line>;

/** Dos decimales sobran para un dibujo de 40 px: el HTML pesa menos. */
const recortar = (d: string) => d.replace(/-?\d+\.\d+/g, (n) => String(Math.round(Number(n) * 10) / 10));

const base = { roughness: 1.1, strokeWidth: 2.6, bowing: 1.2 };

/** Cada símbolo en una caja de 40 × 40. */
function dibujar(tipo: TipoSimbolo, seed: number): Trazo[] {
  const o = { ...base, seed };
  const g = generador;
  let formas: Dibujo[];
  switch (tipo) {
    case "estrella":
      formas = [g.polygon([[20, 3], [24.6, 14.6], [37, 15.4], [27.2, 23.2], [30.8, 36], [20, 28.6], [9.2, 36], [12.8, 23.2], [3, 15.4], [15.4, 14.6]], o)];
      break;
    case "flecha":
      formas = [
        g.curve([[3, 9], [14, 5], [26, 10], [34, 25]], o),
        g.linearPath([[26, 21], [34.5, 26], [36, 16]], { ...o, roughness: 0.8 }),
      ];
      break;
    case "exclamacion":
      formas = [
        g.line(20, 4, 19, 25, { ...o, strokeWidth: 3.4 }),
        g.ellipse(19.4, 33.5, 5.5, 5.5, { ...o, roughness: 0.4, fill: "currentColor", fillStyle: "solid", strokeWidth: 1 }),
      ];
      break;
    case "check":
      formas = [g.linearPath([[5, 21], [15, 32], [36, 6]], { ...o, strokeWidth: 3.2 })];
      break;
    case "asterisco":
      formas = [g.line(20, 5, 20, 35, o), g.line(7, 12, 33, 28, o), g.line(7, 28, 33, 12, o)];
      break;
    case "nb":
      formas = [g.path("M4 31 L5 10 L15 31 L16 9 M22 31 L22 9 C31 8 32 19 22 19 C34 18 34 32 22 31", { ...o, roughness: 0.7 })];
      break;
    case "aro":
      formas = [g.ellipse(20, 20, 38, 34, { ...o, roughness: 1.3, strokeWidth: 2.2 })];
      break;
  }
  return formas.flatMap((f) =>
    generador.toPaths(f).map((p) => ({ d: recortar(p.d), relleno: Boolean(p.fill && p.fill !== "none") })),
  );
}

const cache = new Map<string, Trazo[]>();
function trazos(tipo: TipoSimbolo, seed: number): Trazo[] {
  const clave = `${tipo}:${seed}`;
  let t = cache.get(clave);
  if (!t) {
    t = dibujar(tipo, seed);
    cache.set(clave, t);
  }
  return t;
}

function Caminos({ lista, escalable = false }: { lista: Trazo[]; escalable?: boolean }) {
  return lista.map((t, i) =>
    t.relleno ? (
      <path key={i} d={t.d} className="se-r" fill="currentColor" stroke="none" />
    ) : (
      <path
        key={i}
        d={t.d}
        className={escalable ? undefined : "se-t"}
        pathLength={escalable ? undefined : 1}
        fill="none"
        stroke="currentColor"
        strokeWidth={escalable ? 2.4 : 2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect={escalable ? "non-scaling-stroke" : undefined}
      />
    ),
  );
}

export default function SimboloEstudio({
  tipo,
  color = "naranja",
  margen = false,
  giro = 0,
  tamano,
  semilla = 3,
  retraso = 0,
  animar = true,
  className,
}: {
  tipo: TipoSimbolo;
  color?: ColorCuaderno;
  /** Al margen izquierdo del párrafo en escritorio; junto al texto en el móvil. */
  margen?: boolean;
  /** Giro en grados: para que una flecha apunte a donde toca. */
  giro?: number;
  /** Lado en px. Por defecto, algo más que la letra (o 30 px al margen). */
  tamano?: number;
  /** Otra semilla, otro trazo: dos estrellas iguales delatan la máquina. */
  semilla?: number;
  /** Milisegundos de espera antes de trazarse. */
  retraso?: number;
  /** Con `false`, ya dibujado: para no pasar de dos o tres trazos animados por pantalla. */
  animar?: boolean;
  className?: string;
}) {
  const estilo = {
    ...(giro ? { "--se-giro": `${giro}deg` } : {}),
    ...(tamano ? { "--se-tam": `${tamano}px` } : {}),
  } as CSSProperties;
  const clases = ["se", `se--${tipo}`, `se--${color}`, margen ? "se--margen" : "", className ?? ""].filter(Boolean).join(" ");
  const dibujo = (
    <svg viewBox="0 0 40 40" focusable="false">
      <Caminos lista={trazos(tipo, semilla)} />
    </svg>
  );
  if (!animar) {
    return (
      <span aria-hidden="true" className={clases} style={estilo}>
        {dibujo}
      </span>
    );
  }
  return (
    <TrazoVisible className={clases} style={estilo} retraso={retraso}>
      {dibujo}
    </TrazoVisible>
  );
}

const LLAVE = "M3 2 C13 2 11 12 11 30 L11 82 C11 95 14 100 21 100 C14 100 11 105 11 118 L11 170 C11 188 13 198 3 198";

/**
 * La llave «}» a la derecha de una lista: «todo esto va junto». Envuelve el
 * bloque (una <ul>, por ejemplo) sin tocarlo; la llave se estira a su alto.
 */
export function Llave({
  children,
  color = "azul",
  semilla = 5,
  className,
}: {
  children: ReactNode;
  color?: ColorCuaderno;
  semilla?: number;
  className?: string;
}) {
  const lista = generador
    .toPaths(generador.path(LLAVE, { ...base, roughness: 0.9, seed: semilla }))
    .map((p) => ({ d: recortar(p.d), relleno: false }));
  return (
    <div className={["se-llave", `se--${color}`, className ?? ""].filter(Boolean).join(" ")}>
      {children}
      <TrazoVisible className="se se-llave-trazo se--revela">
        <svg viewBox="0 0 24 200" preserveAspectRatio="none" focusable="false">
          <Caminos lista={lista} escalable />
        </svg>
      </TrazoVisible>
    </div>
  );
}
