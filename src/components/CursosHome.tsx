import Link from "next/link";
import Tecla from "@/components/cuaderno/Tecla";
import { duracion, type CursoResumen } from "@/lib/cursos";
import "./cursos-home.css";

/**
 * Los cursos en la portada, estilo «Cuaderno de estudio» (17-11-2026).
 * Referencia: «El camino de un curso» en disenos/sistema.html y el bloque de
 * cursos de disenos/version-o-equilibrio.html. Color de la sección: lila.
 *
 * · A la derecha, EL CAMINO de un curso real (el primero publicado): un nodo
 *   por módulo con el examen de ese módulo al lado, el examen final y el
 *   certificado como meta. Es el recorrido que de verdad hace el aula
 *   (CURSOS.md §7): el módulo siguiente se abre al aprobar el examen del
 *   anterior, y el certificado se emite al aprobar el final.
 * · En la portada nadie tiene progreso: no hay nodos «hechos» ni porcentajes.
 *   El primero late en naranja («empieza aquí») y el resto espera en gris.
 * · A la izquierda, la lista de cursos publicados con su color y sus cifras
 *   reales (módulos, lecciones y duración salen de la base de datos).
 *
 * Sin cursos publicados, la sección no sale.
 */

/** Por dónde serpentea el camino: la posición horizontal de cada fila, en %. */
const ZIGZAG = [30, 62, 74, 56, 28, 40, 66, 74, 52];
/** Alto de cada fila del camino, en píxeles. */
const PASO = 94;
/** Margen arriba y abajo del camino, para que quepan el bocadillo y la meta. */
const MARGEN = 64;

const NIVEL: Record<CursoResumen["nivel"], string> = {
  básico: "ch-nivel--basico",
  intermedio: "ch-nivel--intermedio",
  avanzado: "ch-nivel--avanzado",
};

type Parada =
  | { tipo: "modulo"; n: number; x: number; y: number; examenX: number }
  | { tipo: "final"; x: number; y: number }
  | { tipo: "meta"; x: number; y: number };

/** Las paradas del camino de un curso, con su sitio. */
function paradasDe(modulos: number): Parada[] {
  const paradas: Parada[] = [];
  const fila = (i: number) => ({ x: ZIGZAG[i % ZIGZAG.length], y: MARGEN + i * PASO });
  for (let i = 0; i < modulos; i++) {
    const { x, y } = fila(i);
    // El examen del módulo, a su lado, hacia el centro: ahí hay sitio.
    paradas.push({ tipo: "modulo", n: i + 1, x, y, examenX: x < 50 ? x + 24 : x - 24 });
  }
  paradas.push({ tipo: "final", ...fila(modulos) });
  paradas.push({ tipo: "meta", x: 50, y: MARGEN + (modulos + 1) * PASO + 8 });
  return paradas;
}

/** El trazo que une las paradas: curvas que salen y llegan en vertical. */
function trazoDe(paradas: Parada[]): string {
  return paradas
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const a = paradas[i - 1];
      const medio = (p.y - a.y) / 2;
      return `C ${a.x} ${a.y + medio}, ${p.x} ${p.y - medio}, ${p.x} ${p.y}`;
    })
    .join(" ");
}

export default function CursosHome({ cursos }: { cursos: CursoResumen[] }) {
  if (cursos.length === 0) return null;

  // El camino enseña el primer curso del catálogo, en el orden del admin.
  const ejemplo = cursos[0];
  const modulos = Math.max(1, ejemplo.modulos);
  const paradas = paradasDe(modulos);
  const alto = paradas[paradas.length - 1].y + MARGEN + 20;

  return (
    <section className="ch" aria-labelledby="ch-titulo">
      <div className="ch-papel">
        <div className="ch-inner">
          <div className="ch-texto">
            <p className="ch-nota">Cursos Premium</p>
            <h2 id="ch-titulo" className="ch-titulo">
              Un camino, <span className="fluor">módulo a módulo</span>
            </h2>
            <p className="ch-lead">
              Cada curso es un recorrido: lecciones por módulos, un examen al final de cada módulo que abre el
              siguiente y, tras el examen final, tu certificado.
            </p>

            <ul className="ch-fichas">
              {cursos.map((c, i) => (
                <li key={c.slug}>
                  <Link
                    href={`/cursos/${c.slug}`}
                    className="ch-ficha"
                    style={{ "--c": c.color } as React.CSSProperties}
                  >
                    <span className="ch-ficha-ic" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="ch-ficha-cuerpo">
                      <span className="ch-ficha-titulo">{c.titulo}</span>
                      <span className="ch-ficha-datos">
                        <span className={`ch-nivel ${NIVEL[c.nivel]}`}>{c.nivel}</span>
                        <span>
                          {c.modulos} {c.modulos === 1 ? "módulo" : "módulos"} · {c.lecciones}{" "}
                          {c.lecciones === 1 ? "lección" : "lecciones"}
                          {c.minutos > 0 && <> · {duracion(c.minutos)}</>}
                        </span>
                      </span>
                    </span>
                    <span className="ch-ficha-flecha" aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="ch-acciones">
              <Tecla href="/cursos" color="lila">Ver los cursos</Tecla>
            </div>
          </div>

          <div className="ch-camino-caja">
            <p className="ch-camino-nota" aria-hidden="true">así es el camino de «{ejemplo.titulo}»</p>

            <div className="ch-camino" style={{ height: `${alto}px` }}>
              <svg className="ch-trazo" viewBox={`0 0 100 ${alto}`} preserveAspectRatio="none" aria-hidden="true">
                <path className="ch-trazo-camino" d={trazoDe(paradas)} />
                {paradas.map((p) =>
                  p.tipo === "modulo" ? (
                    <line key={`t${p.n}`} className="ch-trazo-examen" x1={p.x} y1={p.y} x2={p.examenX} y2={p.y} />
                  ) : null,
                )}
              </svg>

              <ol
                className="ch-paradas"
                aria-label={`El recorrido del curso ${ejemplo.titulo}: ${modulos} ${modulos === 1 ? "módulo" : "módulos"} con su examen, el examen final y el certificado`}
              >
                {paradas.map((p) => {
                  // Cada parada es una fila a lo ancho, a su altura; dentro, los
                  // nodos se colocan en % del ancho del camino.
                  const fila = { top: `${p.y}px` };
                  if (p.tipo === "modulo") {
                    const primero = p.n === 1;
                    return (
                      <li key={`m${p.n}`} className="ch-parada" style={fila}>
                        {primero ? (
                          <Link href={`/cursos/${ejemplo.slug}`} className="ch-nodo ch-nodo--actual" style={{ left: `${p.x}%` }}>
                            {p.n}
                            <span className="sr-only">Módulo {p.n}: empieza aquí</span>
                            <span className="ch-bocadillo" aria-hidden="true">Empieza aquí</span>
                          </Link>
                        ) : (
                          <span className="ch-nodo ch-nodo--bloq" style={{ left: `${p.x}%` }}>
                            {p.n}
                            <span className="sr-only">Módulo {p.n}</span>
                          </span>
                        )}
                        <span className="ch-nodo ch-nodo--examen" style={{ left: `${p.examenX}%` }}>
                          <span aria-hidden="true">?</span>
                          <span className="sr-only">y el examen del módulo {p.n}</span>
                        </span>
                      </li>
                    );
                  }
                  if (p.tipo === "final") {
                    return (
                      <li key="final" className="ch-parada" style={fila}>
                        <span className="ch-nodo ch-nodo--examen ch-nodo--final" style={{ left: `${p.x}%` }}>
                          <span aria-hidden="true">?</span>
                          <span className={`ch-etiqueta${p.x > 50 ? " ch-etiqueta--izq" : ""}`}>Examen final</span>
                        </span>
                      </li>
                    );
                  }
                  return (
                    <li key="meta" className="ch-parada" style={fila}>
                      <span className="ch-nodo ch-nodo--meta" style={{ left: `${p.x}%` }}>
                        <span aria-hidden="true">Certi-<br />ficado</span>
                        <span className="sr-only">Certificado</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>

            <ul className="ch-leyenda" aria-label="Qué es cada parada">
              <li><i className="ch-punto ch-punto--actual" />Empieza aquí</li>
              <li><i className="ch-punto ch-punto--bloq" />Módulo</li>
              <li><i className="ch-punto ch-punto--examen" />Examen</li>
              <li><i className="ch-punto ch-punto--meta" />Certificado</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
