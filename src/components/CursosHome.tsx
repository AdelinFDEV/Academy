import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Award, BookOpen, ClipboardCheck, Clock3, ListChecks } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import Anotacion from "@/components/cuaderno/Anotacion";
import RetoFinal from "@/components/RetoFinal";
import type { CursoResumen } from "@/lib/cursos";
import { PEGATINA_CURSO } from "@/lib/cursosPegatinas";
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

/** «1.012»: con el punto de los miles también en cuatro cifras (`toLocaleString` no lo pone). */
const miles = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/** Cuántos puntitos del nivel van llenos. */
const NIVELES: Record<CursoResumen["nivel"], number> = { básico: 1, intermedio: 2, avanzado: 3 };

/**
 * Los cursos que salen primero en la portada (18-11-2026, pedido por el
 * admin): en el ordenador son las cuatro fichas que se ven, y en el móvil, las
 * primeras del carrusel. Un slug que no esté publicado se salta solo.
 */
const DESTACADOS = ["analisis-tecnico-sin-humo", "seguridad-cripto", "fiscalidad-cripto-espana", "psicologia-del-trading"];

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
  /** Su nombre, en una etiqueta; sin él, no lleva. */
  nombre?: string;
  /** El nombre, encima del nodo en vez de debajo. */
  arriba?: boolean;
};

/**
 * El método de un curso, en paradas que suben y bajan como un camino. Los
 * nombres, cortos y en el orden del aula (18-11-2026, pedido por el admin):
 * Módulo 1 · Examen · Módulo 2 · Examen · … · Examen final · Certificado. El de
 * «Módulo 2», encima: debajo chocaba con el examen de al lado.
 */
const PARADAS: Parada[] = [
  { clave: "lecciones", tipo: "actual", x: 7, y: 84, nombre: "Módulo 1" },
  { clave: "examen-1", tipo: "examen", x: 22, y: 128, nombre: "Examen" },
  { clave: "siguiente", tipo: "bloq", x: 38, y: 84, nombre: "Módulo 2", arriba: true },
  { clave: "examen-2", tipo: "examen", x: 51, y: 128, nombre: "Examen" },
  { clave: "puntos", tipo: "puntos", x: 60, y: 100 },
  // Más a la izquierda (18-11-2026): su bocadillo, al pulsarlo, rozaba la
  // tecla «Ver los cursos», que queda justo encima a la derecha.
  { clave: "final", tipo: "final", x: 71, y: 104, nombre: "Examen final" },
  { clave: "meta", tipo: "meta", x: 92, y: 100, nombre: "Certificado" },
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

export default function CursosHome({ cursos, preguntas = null }: { cursos: CursoResumen[]; preguntas?: number | null }) {
  if (cursos.length === 0) return null;
  const primero = cursos[0];
  // Las fichas: primero los cursos destacados, en su orden; después, el resto
  // en el orden del catálogo.
  const enOrden = [
    ...DESTACADOS.map((slug) => cursos.find((c) => c.slug === slug)).filter((c): c is CursoResumen => !!c),
    ...cursos.filter((c) => !DESTACADOS.includes(c.slug)),
  ];
  const horasTotales = Math.round(cursos.reduce((total, c) => total + c.minutos, 0) / 60);
  const lecciones = cursos.reduce((total, c) => total + c.lecciones, 0);
  // Un examen por módulo y el final de cada curso.
  const examenes = cursos.reduce((total, c) => total + c.modulos + 1, 0);

  return (
    <section id="cursos" className="ch" aria-labelledby="ch-titulo">
      {/* Garabatos de estudio en el fondo, detrás de la hoja blanca: asoman
          por los lados en pantallas anchas (18-11-2026, pedido por el admin). */}
      <span className="ch-garabatos" aria-hidden="true">
        <svg className="ch-g ch-g--libro" viewBox="0 0 40 40"><path d="M20 10c-4-3-10-4-16-3v24c6-1 12 0 16 3 4-3 10-4 16-3V7c-6-1-12 0-16 3zM20 10v24" /></svg>
        <svg className="ch-g ch-g--lapiz" viewBox="0 0 40 40"><path d="M8 32l2-8L28 6l6 6-18 18zM24 10l6 6M10 24l6 6" /></svg>
        <svg className="ch-g ch-g--estrella" viewBox="0 0 40 40"><path d="M20 4l4.5 10 10.5 1-8 7 2.5 10.5L20 27l-9.5 5.5L13 22l-8-7 10.5-1z" /></svg>
        <svg className="ch-g ch-g--bombilla" viewBox="0 0 40 40"><path d="M20 4c-7 0-12 5-12 11 0 5 3 7 5 10v4h14v-4c2-3 5-5 5-10 0-6-5-11-12-11zM15 33h10M16 37h8" /></svg>
        <svg className="ch-g ch-g--birrete" viewBox="0 0 40 40"><path d="M4 15l16-7 16 7-16 7zM10 18v8c5 4 15 4 20 0v-8M36 15v9" /></svg>
      </span>
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
              {/* El reloj, solo en el móvil (cursos-home.css). */}
              <span className="ch-horas-reloj" aria-hidden="true"><Clock3 size={16} strokeWidth={2.6} /></span>
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

        {/* En el móvil (18-11-2026, pedido por el admin), la tarjeta de cifras
            del ordenador, partida en dos: encima de la carretera, el título y
            lecciones, exámenes y preguntas; debajo, el resto con la tecla. En
            el ordenador no sale: allí va la tarjeta entera (cursos-home.css). */}
        <div className="ch-datos-movil ch-datos-movil--arriba">
          <p className="ch-resumen-titulo">
            <span className="ch-resumen-cifra">{cursos.length}</span> cursos para aprender <span className="ch-resumen-mano">paso a paso</span>
          </p>
          <ul className="ch-resumen-datos">
            <li className="ch-dato ch-dato--lecciones">
              <span className="ch-dato-icono" aria-hidden="true"><BookOpen size={16} strokeWidth={2.5} /></span>
              <b>{lecciones}</b> <span>lecciones</span>
            </li>
            <li className="ch-dato ch-dato--examenes">
              <span className="ch-dato-icono" aria-hidden="true"><ClipboardCheck size={16} strokeWidth={2.5} /></span>
              <b>{examenes}</b> <span>exámenes</span>
            </li>
            {preguntas != null && preguntas > 0 && (
              <li className="ch-dato ch-dato--preguntas">
                <span className="ch-dato-icono" aria-hidden="true"><ListChecks size={16} strokeWidth={2.5} /></span>
                <b>{miles(preguntas)}</b> <span>preguntas</span>
              </li>
            )}
            {/* Horas y certificados, en la segunda fila, a lo ancho (antes iban
                debajo de la carretera; subidos el 18-11-2026). */}
            {horasTotales > 0 && (
              <li className="ch-dato ch-dato--horas ch-dato--fila">
                <span className="ch-dato-icono" aria-hidden="true"><Clock3 size={16} strokeWidth={2.5} /></span>
                <b>{horasTotales}</b> <span>horas de clase</span>
              </li>
            )}
            <li className="ch-dato ch-dato--certificado ch-dato--fila">
              <span className="ch-dato-icono" aria-hidden="true"><Award size={16} strokeWidth={2.5} /></span>
              <b>{cursos.length}</b> <span>certificados</span>
            </li>
          </ul>
        </div>

        {/* El método, en una franja que se desliza en pantallas estrechas. */}
        <div className="ch-camino-caja">
          <div className="ch-camino" style={{ height: `${ALTO}px` }}>
            <svg className="ch-trazo" viewBox={`0 0 1000 ${ALTO}`} preserveAspectRatio="none" aria-hidden="true">
              {/* La carretera: el arcén (más ancho y oscuro), el asfalto encima
                  y la línea discontinua del centro. */}
              <path className="ch-trazo-arcen" d={trazo()} />
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
                  {p.nombre && (
                    <span className={`ch-paso ch-paso--${p.tipo}${p.arriba ? " ch-paso--arriba" : ""}`}>{p.nombre}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* En el móvil, debajo de la carretera, la tecla de todos los cursos
            (cursos-home.css). */}
        <div className="ch-datos-movil ch-datos-movil--abajo">
          <Tecla href="/cursos" color="lila" ancho className="ch-resumen-tecla">
            Ver todos los cursos
            <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
          </Tecla>
        </div>

        {/* En el ordenador, cuatro fichas a la izquierda y, a la derecha, la
            tarjeta con las cifras de todos los cursos y su tecla (18-11-2026,
            pedido por el admin). En la tableta, todas; en el móvil, dos y un
            enlace a todos (cursos-home.css). */}
        {/* En el móvil, las fichas se deslizan de lado: una nota a mano lo dice. */}
        <p className="ch-desliza" aria-hidden="true">desliza y elige tu curso →</p>
        <div className="ch-zona">
        <ul className="ch-cursos">
          {enOrden.map((c, i) => (
            <li key={c.slug}>
              <Link href={`/cursos/${c.slug}`} className="ch-curso" style={{ "--c": c.color } as React.CSSProperties}>
                {/* El hueco cuadrado de la ilustración de cada curso (solo en el
                    ordenador). Mientras no esté, su color con el número en
                    grande; cuando esté, va aquí como imagen. */}
                <span className="ch-curso-foto" aria-hidden="true">
                  {PEGATINA_CURSO[c.slug] ? (
                    <Image src={PEGATINA_CURSO[c.slug]} alt="" width={330} height={270} className="ch-curso-foto-img" draggable={false} />
                  ) : (
                    <span className="ch-curso-foto-n">{String(i + 1).padStart(2, "0")}</span>
                  )}
                </span>
                <span className="ch-curso-n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <span className="ch-curso-cuerpo">
                  {/* El nivel, con tres puntitos: uno lleno en básico, dos en intermedio y tres en avanzado. */}
                  <span className="ch-curso-nivel">
                    {c.nivel}
                    <span className="ch-curso-nivel-puntos" aria-hidden="true">
                      {[1, 2, 3].map((n) => (
                        <i key={n} className={n <= NIVELES[c.nivel] ? "is-lleno" : undefined} />
                      ))}
                    </span>
                  </span>
                  <span className="ch-curso-titulo"><span className="ch-curso-titulo-txt">{c.titulo}</span></span>
                  {c.subtitulo && <span className="ch-curso-sub">{c.subtitulo}</span>}
                  {/* Los datos reales del curso, en el ordenador (cursos-home.css). */}
                  <span className="ch-curso-cifras">
                    <span className="ch-cifra ch-cifra--modulos"><b>{c.modulos}</b> {c.modulos === 1 ? "módulo" : "módulos"}</span>
                    <span className="ch-cifra ch-cifra--lecciones"><b>{c.lecciones}</b> lecciones</span>
                    <span className="ch-cifra ch-cifra--examenes"><b>{c.modulos + 1}</b> exámenes</span>
                    {c.minutos > 0 && (
                      <span className="ch-cifra ch-cifra--horas">
                        <Clock3 size={12} strokeWidth={2.8} aria-hidden="true" /> <b>{horas(c.minutos).replace(" h", "")}</b> h
                      </span>
                    )}
                  </span>
                  <span className="ch-curso-datos">
                    {/* Un puntito por módulo: el camino del curso en pequeño. */}
                    <span className="ch-curso-puntos" aria-hidden="true">
                      {Array.from({ length: c.modulos }, (_, m) => <i key={m} />)}
                    </span>
                    {c.modulos} {c.modulos === 1 ? "módulo" : "módulos"}
                    {c.minutos > 0 && <> · {horas(c.minutos)}</>}
                  </span>
                </span>
                {/* La flecha que dice que la ficha se abre. */}
                <span className="ch-curso-ir" aria-hidden="true"><ArrowRight size={16} strokeWidth={2.8} /></span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Las cifras salen de la base de datos: módulos, lecciones y minutos
            de cada curso, y las preguntas de sus bancos de examen. Exámenes:
            uno por módulo y el final de cada curso (CURSOS.md §7). */}
        <aside className="ch-resumen" aria-label="Todos los cursos, en cifras">
          <p className="ch-resumen-titulo">
            <span className="ch-resumen-cifra">{cursos.length}</span> cursos para aprender <span className="ch-resumen-mano">paso a paso</span>
          </p>
          <ul className="ch-resumen-datos">
            <li className="ch-dato ch-dato--lecciones">
              <span className="ch-dato-icono" aria-hidden="true"><BookOpen size={17} strokeWidth={2.5} /></span>
              <b>{lecciones}</b> <span>lecciones</span>
            </li>
            <li className="ch-dato ch-dato--examenes">
              <span className="ch-dato-icono" aria-hidden="true"><ClipboardCheck size={17} strokeWidth={2.5} /></span>
              <b>{examenes}</b> <span>exámenes</span>
            </li>
            {preguntas != null && preguntas > 0 && (
              <li className="ch-dato ch-dato--preguntas">
                <span className="ch-dato-icono" aria-hidden="true"><ListChecks size={17} strokeWidth={2.5} /></span>
                <b>{miles(preguntas)}</b> <span>preguntas</span>
              </li>
            )}
            {horasTotales > 0 && (
              <li className="ch-dato ch-dato--horas">
                <span className="ch-dato-icono" aria-hidden="true"><Clock3 size={17} strokeWidth={2.5} /></span>
                <b>{horasTotales}</b> <span>horas de clase</span>
              </li>
            )}
            <li className="ch-dato ch-dato--certificado">
              <span className="ch-dato-icono" aria-hidden="true"><Award size={17} strokeWidth={2.5} /></span>
              <b>{cursos.length}</b> <span>certificados</span>
            </li>
          </ul>
          <Tecla href="/cursos" color="lila" ancho className="ch-resumen-tecla">
            Ver todos los cursos
            <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
          </Tecla>
        </aside>
        </div>

        {cursos.length > 2 && (
          <Link href="/cursos" className="ch-mas">
            Ver los {cursos.length} cursos
          </Link>
        )}
      </div>
    </section>
  );
}
