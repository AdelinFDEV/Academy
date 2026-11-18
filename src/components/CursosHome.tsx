import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import Anotacion from "@/components/cuaderno/Anotacion";
import RetoFinal from "@/components/RetoFinal";
import type { CursoResumen } from "@/lib/cursos";
import "./cursos-home.css";

/**
 * Los cursos en la portada, estilo «Cuaderno de estudio». Color de la
 * sección: lila.
 *
 * Rediseño del 18-11-2026 (pedido por el admin: «exagera en tamaño, visual y
 * de información; que se entienda todo de un vistazo»). El camino estilo
 * Duolingo se queda, porque es como funcionan los cursos de verdad, pero ya no
 * es una columna con los módulos de un curso concreto: es UNA FRANJA
 * HORIZONTAL que cuenta el método de cualquier curso en una lectura:
 * lecciones → examen del módulo → se abre el siguiente → … → examen final →
 * certificado (CURSOS.md §7). Cada parada lleva su nombre debajo, así que no
 * hace falta leyenda. En la portada nadie tiene progreso: la primera late en
 * naranja («empieza aquí») y lo demás espera en gris.
 *
 * Debajo, los cursos publicados como fichas compactas (número de su color,
 * título y una línea de datos reales de la base de datos).
 *
 * Sin cursos publicados, la sección no sale.
 */

/**
 * La duración en horas redondeadas («5 h»): en la ficha compacta, la línea de
 * datos tiene que caber en una línea. La exacta está en la ficha del curso.
 */
const horas = (minutos: number) => (minutos < 60 ? "menos de 1 h" : `${Math.round(minutos / 60)} h`);

/** Alto de la franja del camino, en píxeles (el SVG mide lo mismo). */
const ALTO = 200;

type Parada = {
  clave: string;
  tipo: "actual" | "examen" | "bloq" | "puntos" | "final" | "meta";
  /** Posición horizontal, en % del ancho. */
  x: number;
  /** Posición vertical, en píxeles. */
  y: number;
  /** Su nombre, debajo; sin él, no lleva. */
  nombre?: string;
};

/** El método de un curso, en paradas que suben y bajan como un camino. */
const PARADAS: Parada[] = [
  { clave: "lecciones", tipo: "actual", x: 7, y: 84, nombre: "Lecciones" },
  { clave: "examen-1", tipo: "examen", x: 22, y: 128, nombre: "Examen del módulo" },
  { clave: "siguiente", tipo: "bloq", x: 38, y: 84, nombre: "Se abre el siguiente" },
  { clave: "examen-2", tipo: "examen", x: 51, y: 128 },
  { clave: "puntos", tipo: "puntos", x: 60, y: 100 },
  // Más a la izquierda (18-11-2026): su bocadillo, al pulsarlo, rozaba la
  // tecla «Ver los cursos», que queda justo encima a la derecha.
  { clave: "final", tipo: "final", x: 71, y: 104, nombre: "Examen final" },
  { clave: "meta", tipo: "meta", x: 92, y: 100, nombre: "Tu certificado" },
];

/** El trazo que une las paradas (en un lienzo de 1000 × ALTO). */
function trazo(): string {
  return PARADAS.map((p, i) => {
    const x = p.x * 10;
    if (i === 0) return `M ${x} ${p.y}`;
    const a = PARADAS[i - 1];
    const ax = a.x * 10;
    const medio = (x - ax) / 2;
    return `C ${ax + medio} ${a.y}, ${x - medio} ${p.y}, ${x} ${p.y}`;
  }).join(" ");
}

export default function CursosHome({ cursos }: { cursos: CursoResumen[] }) {
  if (cursos.length === 0) return null;
  const primero = cursos[0];
  const horasTotales = Math.round(cursos.reduce((total, c) => total + c.minutos, 0) / 60);

  return (
    <section id="cursos" className="ch" aria-labelledby="ch-titulo">
      <div className="ch-papel">
        <header className="ch-cabecera">
          <div>
            <p className="ch-nota">Cursos Premium</p>
            <h2 id="ch-titulo" className="ch-titulo">
              <span className="ch-titulo-mano">Un camino,</span>{" "}
              <Anotacion tipo="underline" color="var(--lila)" grosor={4} retraso={300}>módulo a módulo</Anotacion>
            </h2>
            <p className="ch-lead">Aprende, demuestra lo aprendido y avanza. Al final, tu certificado.</p>
          </div>
          {/* Las horas de clase de todos los cursos publicados, sumadas de la
              duración real de cada lección (base de datos): crece sola cuando
              se publica un curso o se añaden lecciones (18-11-2026). */}
          {horasTotales > 0 && (
            <p className="ch-horas">
              <span className="ch-horas-cifra">{horasTotales}</span>
              <span className="ch-horas-texto">
                horas de clase
                <span className="ch-horas-sub">
                  en {cursos.length} {cursos.length === 1 ? "curso" : "cursos"}
                </span>
              </span>
            </p>
          )}
          <Tecla href="/cursos" color="lila" className="ch-ver">
            Ver los cursos
            <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
          </Tecla>
        </header>

        {/* El método, en una franja que se desliza en pantallas estrechas. */}
        <div className="ch-camino-caja">
          <div className="ch-camino" style={{ height: `${ALTO}px` }}>
            <svg className="ch-trazo" viewBox={`0 0 1000 ${ALTO}`} preserveAspectRatio="none" aria-hidden="true">
              <path className="ch-trazo-camino" d={trazo()} />
              {/* La línea discontinua del centro, como en una carretera. */}
              <path className="ch-trazo-linea" d={trazo()} />
            </svg>

            <ol
              className="ch-paradas"
              aria-label="Cómo es cada curso: lecciones, un examen por módulo que abre el siguiente, el examen final y el certificado"
            >
              {PARADAS.map((p) => (
                <li key={p.clave} className="ch-parada" style={{ left: `${p.x}%`, top: `${p.y}px` }}>
                  {p.tipo === "actual" ? (
                    <Link href={`/cursos/${primero.slug}`} className="ch-nodo ch-nodo--actual">
                      1<span className="sr-only">Lecciones del módulo 1: empieza aquí</span>
                      <span className="ch-bocadillo" aria-hidden="true">Empieza aquí</span>
                    </Link>
                  ) : p.tipo === "puntos" ? (
                    <span className="ch-puntos" aria-hidden="true"><i /><i /><i /></span>
                  ) : p.tipo === "final" ? (
                    // El examen final, distinto de los demás: el «reto final», una
                    // pegatina del cuaderno (ESTILO.md) con capa y las manos en
                    // jarra, desafiante (pedida por el admin el 18-11-2026).
                    // Al pulsarlo, suelta una frase de villano (RetoFinal.tsx).
                    <RetoFinal />
                  ) : p.tipo === "meta" ? (
                    // La meta: la pegatina del certificado, con su roseta.
                    <Image
                      src="/cuaderno/certificado-pegatina.webp"
                      alt=""
                      width={300}
                      height={299}
                      className="ch-certificado"
                      draggable={false}
                    />
                  ) : (
                    <span className={`ch-nodo ch-nodo--${p.tipo}`} aria-hidden="true">
                      {p.tipo === "bloq" ? "2" : "?"}
                    </span>
                  )}
                  {p.nombre && <span className="ch-paso">{p.nombre}</span>}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <ul className="ch-cursos">
          {cursos.map((c, i) => (
            <li key={c.slug}>
              <Link href={`/cursos/${c.slug}`} className="ch-curso" style={{ "--c": c.color } as React.CSSProperties}>
                <span className="ch-curso-n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <span className="ch-curso-cuerpo">
                  <span className="ch-curso-titulo">{c.titulo}</span>
                  <span className="ch-curso-datos">
                    {/* Un puntito por módulo: el camino del curso en pequeño. */}
                    <span className="ch-curso-puntos" aria-hidden="true">
                      {Array.from({ length: c.modulos }, (_, m) => <i key={m} />)}
                    </span>
                    {c.modulos} {c.modulos === 1 ? "módulo" : "módulos"}
                    {c.minutos > 0 && <> · {horas(c.minutos)}</>}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
