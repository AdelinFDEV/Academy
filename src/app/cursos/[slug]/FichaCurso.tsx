import { Fragment } from "react";
import Link from "next/link";
import {
  ArrowRight, Award, BookOpenText, CalendarCheck, Check, ChevronDown, ClipboardCheck, Clock3, Download, GraduationCap, Hourglass,
  Layers, Lock, Play, ShieldCheck, Sparkles, X,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import Certificado from "@/components/aula/Certificado";
import Anotacion from "@/components/cuaderno/Anotacion";
import Postit from "@/components/cuaderno/Postit";
import SimboloEstudio, { Llave } from "@/components/cuaderno/SimboloEstudio";
import Tecla, { type ColorTecla } from "@/components/cuaderno/Tecla";
import Termino from "@/components/Termino";
import type { CursoCompleto, DatosAlumno, Sesion } from "@/lib/cursos";
import { duracion, fechaLarga, formatoNota, minutosTotales, NOTA_MINIMA_FINAL, type EstadoCurso } from "@/lib/cursos-progreso";
import type { CursoSeo } from "@/lib/cursos-seo";
import { iconoCurso } from "@/lib/logros";
import { PREMIUM_PRICE_EUR, precioEur } from "@/lib/stripe";
import { caminoDe, cuandoRepetir, notaCorta, type EstadoNodo, type ParadaExamen } from "../camino";
import PasosCurso from "../PasosCurso";
import PortadaCurso from "../PortadaCurso";

/**
 * Enlaza al diccionario la PRIMERA aparición de cada término de `mapa` en
 * `texto`. `usados` se comparte entre todos los textos de la página, en el
 * orden en que se pintan, para que cada término se enlace una sola vez.
 */
function conTerminos(texto: string, mapa: Record<string, string> | undefined, usados: Set<string>): React.ReactNode {
  if (!mapa) return texto;
  const partes: React.ReactNode[] = [];
  let resto = texto;
  for (;;) {
    let mejor: { termino: string; i: number } | null = null;
    for (const termino of Object.keys(mapa)) {
      if (usados.has(termino)) continue;
      const i = resto.indexOf(termino);
      if (i > -1 && (!mejor || i < mejor.i || (i === mejor.i && termino.length > mejor.termino.length))) {
        mejor = { termino, i };
      }
    }
    if (!mejor) break;
    usados.add(mejor.termino);
    partes.push(resto.slice(0, mejor.i));
    partes.push(<Termino key={mejor.termino} slug={mapa[mejor.termino]}>{mejor.termino}</Termino>);
    resto = resto.slice(mejor.i + mejor.termino.length);
  }
  if (partes.length === 0) return texto;
  partes.push(resto);
  return partes;
}

/**
 * Por dónde serpentea el camino del temario: la posición de cada parada en
 * el raíl, en %. Entre 30 y 70 para que el nodo quepa también en el móvil.
 */
const ZIGZAG = [36, 62, 68, 48, 32, 42, 64, 68, 50];
const xDe = (k: number) => ZIGZAG[k % ZIGZAG.length];

/** El tramo de vía de una parada a la siguiente (viewBox 0 0 100 100, estirado). */
function Via({ desde, hasta, hecha }: { desde: number; hasta: number; hecha: boolean }) {
  return (
    <svg className={`fc-via${hecha ? " is-hecha" : ""}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d={`M ${desde} 0 C ${desde} 50, ${hasta} 50, ${hasta} 100`} />
    </svg>
  );
}

/**
 * La cara del nodo de un examen. Los mismos signos que el camino del aula
 * (CaminoCurso): visto, reloj de arena si hay que esperar, candado si aún no
 * se abre (solo con progreso: sin él, el camino enseña qué es cada parada) y
 * «?» si se puede hacer.
 */
function caraExamen(e: ParadaExamen, conProgreso: boolean, grande: boolean): React.ReactNode {
  if (e.nodo === "hecho") return <Check size={grande ? 30 : 22} strokeWidth={3.4} />;
  if (e.nodo === "espera") return <Hourglass size={grande ? 26 : 20} strokeWidth={2.6} />;
  if (e.nodo === "bloq" && conProgreso) return <Lock size={grande ? 22 : 18} strokeWidth={2.8} />;
  return "?";
}

/** Qué dice cada estado de un examen, para quien lleva el curso. */
function textoExamen(e: ParadaExamen, bloqueado: string): string {
  if (e.nodo === "hecho" && e.nota !== null) return `Aprobado con un ${formatoNota(e.nota)}`;
  if (e.espera) return `Suspendido con un ${formatoNota(e.espera.ultimaNota)}: podrás repetirlo a partir del ${cuandoRepetir(e.espera.disponibleEn)}`;
  if (e.nodo === "actual" || e.nodo === "abierto") return "Disponible: ya puedes hacerlo";
  return bloqueado;
}

const ESTADO_MODULO: Record<EstadoNodo, string> = {
  hecho: "Lecciones completadas",
  actual: "Vas por aquí",
  abierto: "Abierto",
  espera: "Abierto",
  bloq: "Se abre al aprobar el examen anterior",
};

/**
 * La ficha pública de un curso, solo la parte que se pinta (estilo «Cuaderno
 * de estudio», 17-11-2026; color de la sección: LILA, y el color propio del
 * curso como acento, `--c`). Los datos los lee `page.tsx`; aquí no hay ninguna
 * consulta, así que lo que se ve depende únicamente de lo que llega por props.
 *
 * El temario es EL CAMINO del curso (`camino.ts`): módulo, su examen, el
 * siguiente módulo… el examen final y el certificado como meta. Con progreso,
 * cada parada dice cómo la lleva el alumno; sin él, el camino tal cual.
 *
 * El texto de las lecciones NO llega aquí nunca: `CursoCompleto` trae títulos
 * y minutos, no `contenido`.
 */

interface Props {
  c: CursoCompleto;
  sesion: Sesion | null;
  alumno: DatosAlumno | null;
  progreso: EstadoCurso | null;
  seo?: CursoSeo;
}

export default function FichaCurso({ c, sesion, alumno, progreso, seo }: Props) {
  const { curso, modulos } = c;
  const slug = curso.slug;
  const terminosUsados = new Set<string>();
  const enlazar = (texto: string) => conTerminos(texto, seo?.terminos, terminosUsados);
  // Las secciones numeradas van seguidas aunque falte alguna opcional.
  const tieneFaq = !!seo?.faq?.length;
  let n = 0;
  const num = {
    para: seo?.para ? ++n : 0,
    objetivos: curso.objetivos.length > 0 ? ++n : 0,
    alDia: seo?.alDia ? ++n : 0,
    temario: ++n,
    certificado: ++n,
    como: ++n,
    faq: tieneFaq ? ++n : 0,
  };
  const dos = (x: number) => String(x).padStart(2, "0");
  const lecciones = modulos.reduce((t, m) => t + m.lecciones.length, 0);
  const total = minutosTotales(modulos);
  const cert = alumno?.certificado ?? null;
  const camino = caminoDe(modulos, progreso, !!cert);
  const premium = !!sesion?.esPremium;
  // Dónde está el certificado del alumno: en el aula si es Premium; si dejó
  // de serlo, en su vitrina del panel (lo ganado se descarga siempre).
  const hrefCert = premium ? `/aula/${slug}/certificado` : "/dashboard/certificados";

  type Boton = { href: string; texto: string; color: ColorTecla };
  const cta: Boton & { secundario: Boton | null } = !sesion
    ? { href: "/premium", texto: "Ver qué incluye Premium", color: "naranja", secundario: { href: `/login?next=/cursos/${slug}`, texto: "Ya tengo cuenta", color: "blanca" } }
    : !premium
      ? { href: "/api/checkout", texto: "Hazte Premium para empezar", color: "naranja", secundario: cert ? { href: hrefCert, texto: "Ver tu certificado", color: "blanca" } : null }
      : cert
        ? { href: hrefCert, texto: "Ver tu certificado", color: "amarillo", secundario: { href: `/aula/${slug}`, texto: "Entrar al curso", color: "blanca" } }
        : progreso
          ? { href: `/aula/${slug}`, texto: "Continuar el curso", color: "lila", secundario: null }
          : { href: `/aula/${slug}`, texto: "Empezar el curso", color: "lila", secundario: null };
  const prefetch = (href: string) => (href.startsWith("/api/") ? false : undefined);

  const incluye = [
    { icono: Layers, cifra: `${modulos.length} módulos`, texto: "En orden, cada uno con su examen" },
    { icono: BookOpenText, cifra: `${lecciones} lecciones`, texto: "Con gráficos animados y minijuegos" },
    { icono: Clock3, cifra: duracion(total), texto: "A tu ritmo, con tu propio cronograma" },
    { icono: ClipboardCheck, cifra: `${modulos.length + 1} exámenes`, texto: "Uno por módulo y el final" },
  ];

  // Qué módulo sale desplegado: el que toca; sin progreso, el primero.
  const desplegado = camino.modulos.find((p) => p.nodo === "actual")?.modulo.id ?? modulos[0]?.id;
  // Cada parada ocupa un puesto en el zigzag: módulo, su examen, el siguiente…
  const kFinal = modulos.length * 2;

  // El cierre, según cómo lo lleve quien mira.
  const cierre = !premium
    ? { titulo: "Incluido en Premium, sin pagar nada aparte", texto: "Todos los cursos entran en la misma suscripción que las herramientas y la comunidad." }
    : cert
      ? { titulo: "Curso terminado", texto: "Tu certificado y tu logro ya son tuyos. Puedes volver al curso cuando quieras, y rehacerlo para mejorar la nota." }
      : progreso
        ? { titulo: "Tu curso te espera", texto: `Llevas el ${progreso.porcentaje} %. Sigue por donde lo dejaste.` }
        : { titulo: "Tu curso te espera", texto: "Elige tu ritmo y empieza por el primer módulo. Puedes cambiar el ritmo cuando quieras." };

  return (
    <div className="blog-page cu-pagina">
      <SiteNav user={!!sesion} isPremium={sesion?.esPremium} userName={sesion?.nombre} isAdmin={sesion?.esAdmin} />

      <main className="cu fc" style={{ "--c": curso.color } as React.CSSProperties}>
        <nav className="cu-migas" aria-label="Migas de pan">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true">/</span>
          <Link href="/cursos">Cursos</Link>
          <span aria-hidden="true">/</span>
          <span>{curso.titulo}</span>
        </nav>

        {!curso.published && (
          <p className="cu-aviso cu-aviso--coral">Borrador: solo lo ves tú, como admin. No está en el catálogo ni en el sitemap.</p>
        )}

        {/* ── Hero ── */}
        <header className="fc-hero">
          <div className="fc-hero-texto">
            <div className="fc-chips">
              <span className="cu-chip cu-chip--lila"><GraduationCap size={14} aria-hidden="true" /> Curso online</span>
              <span className="cu-chip cu-chip--gris">Nivel {curso.nivel}</span>
              <span className="cu-chip cu-chip--naranja">Incluido en Premium · {precioEur(PREMIUM_PRICE_EUR)}/mes</span>
            </div>

            <h1 className="fc-titulo">
              <Anotacion tipo="underline" color="var(--c)" retraso={300}>{seo?.h1 ?? curso.titulo}</Anotacion>
              {curso.subtitulo && <span className="fc-titulo-sub">{curso.subtitulo}</span>}
            </h1>
            {curso.descripcion && <p className="fc-lead">{enlazar(curso.descripcion)}</p>}

            <div className="fc-acciones">
              <Tecla href={cta.href} color={cta.color} tamano="grande" prefetch={prefetch(cta.href)}>
                {cta.texto}
                <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
              </Tecla>
              {cta.secundario && (
                <Tecla href={cta.secundario.href} color={cta.secundario.color} tamano="grande">{cta.secundario.texto}</Tecla>
              )}
            </div>

            <ul className="fc-confianza">
              {curso.revisado && (
                <li><CalendarCheck size={15} aria-hidden="true" /> Revisado el {fechaLarga(new Date(curso.revisado))}</li>
              )}
              <li><ShieldCheck size={15} aria-hidden="true" /> Certificado verificable</li>
              <li><Sparkles size={15} aria-hidden="true" /> Sin pagar nada aparte</li>
            </ul>
          </div>

          <aside className="fc-ficha" aria-label="Lo que incluye el curso">
            <div className="fc-foto">
              <span className="cu-cinta cu-cinta--izq" aria-hidden="true" />
              <span className="cu-cinta cu-cinta--dcha" aria-hidden="true" />
              <div className="fc-foto-portada">
                <PortadaCurso slug={slug} titulo={curso.titulo} sizes="(max-width: 960px) 100vw, 460px" />
              </div>
              <span className="fc-sello" aria-hidden="true">{iconoCurso(slug, 30)}</span>
            </div>
            <p className="cu-etiqueta">Lo que incluye</p>
            <ul className="fc-incluye">
              {incluye.map(({ icono: Icono, cifra, texto }) => (
                <li key={cifra}>
                  <span className="fc-incluye-ic" aria-hidden="true"><Icono size={18} strokeWidth={2.3} /></span>
                  <span>
                    <strong>{cifra}</strong>
                    <span>{texto}</span>
                  </span>
                </li>
              ))}
              <li className="fc-incluye-cert">
                <span className="fc-incluye-ic" aria-hidden="true"><Award size={18} strokeWidth={2.3} /></span>
                <span>
                  <strong>Certificado y logro</strong>
                  <span>Con tu nombre, tu nota y un código para verificarlo</span>
                </span>
              </li>
            </ul>
            {progreso && (
              <div className="fc-progreso">
                <div className="fc-progreso-cab">
                  <span>Tu progreso</span>
                  <strong>{progreso.porcentaje} %</strong>
                </div>
                <span
                  className="cu-barra"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progreso.porcentaje}
                  aria-label={`Tu progreso en ${curso.titulo}`}
                >
                  <i style={{ width: `${progreso.porcentaje}%` }} />
                </span>
                <span className="fc-progreso-pie">
                  {progreso.leccionesHechas} de {progreso.leccionesTotales} lecciones
                </span>
              </div>
            )}
          </aside>
        </header>

        {/* ── Para quién es ── */}
        {seo?.para && (
          <section className="cu-seccion" aria-labelledby="fc-para">
            <header className="cu-seccion-cab">
              <p className="cu-num">{dos(num.para)}</p>
              <h2 id="fc-para" className="cu-h2">Para quién es este curso</h2>
              <p className="cu-sub">Y para quién no, que también conviene saberlo antes de empezar.</p>
            </header>
            {/* Dos pósits (ESTILO.md, marcas de estudio): menta lo que está bien,
                coral lo que no; cada título con su trazo y su símbolo en la esquina. */}
            <div className="fc-para">
              <Postit color="menta" giro={-1.2} className="fc-para-col fc-para-col--si">
                <SimboloEstudio tipo="check" color="menta" className="postit-esquina" retraso={300} />
                <p className="fc-para-titulo">
                  <Anotacion tipo="underline" color="var(--menta)" grosor={2.5} iteraciones={1} animar={false}>Te sirve si…</Anotacion>
                </p>
                <ul>
                  {seo.para.si.map((t) => (
                    <li key={t}><span className="fc-para-ic" aria-hidden="true"><Check size={14} strokeWidth={3.4} /></span><span>{enlazar(t)}</span></li>
                  ))}
                </ul>
              </Postit>
              <Postit color="coral" giro={1.2} className="fc-para-col fc-para-col--no">
                <SimboloEstudio tipo="exclamacion" color="coral" className="postit-esquina" semilla={9} animar={false} />
                <p className="fc-para-titulo">
                  <Anotacion tipo="underline" color="var(--coral)" grosor={2.5} iteraciones={1} retraso={300}>No es para ti si…</Anotacion>
                </p>
                <ul>
                  {seo.para.no.map((t) => (
                    <li key={t}><span className="fc-para-ic" aria-hidden="true"><X size={14} strokeWidth={3.4} /></span><span>{enlazar(t)}</span></li>
                  ))}
                </ul>
              </Postit>
            </div>
          </section>
        )}

        {/* ── Lo que sabrás hacer: una hoja de cuaderno con renglones ── */}
        {curso.objetivos.length > 0 && (
          <section className="cu-seccion" aria-labelledby="fc-objetivos">
            <header className="cu-seccion-cab">
              <p className="cu-num">{dos(num.objetivos)}</p>
              <h2 id="fc-objetivos" className="cu-h2">Lo que sabrás hacer al terminar</h2>
              <p className="cu-sub">No es teoría para aprobar: es lo que vas a poder hacer por tu cuenta.</p>
            </header>
            {/* La llave lila al lado: todo esto entra en los exámenes. Cada
                número, rodeado a boli. */}
            <Llave color="lila" className="fc-objetivos-llave">
              <ol className="fc-objetivos">
                {curso.objetivos.map((o, i) => (
                  <li key={o}>
                    <span className="fc-objetivo-num" aria-hidden="true">
                      <SimboloEstudio tipo="aro" color="lila" className="fc-objetivo-aro" semilla={40 + i} animar={false} />
                      {i + 1}
                    </span>
                    <p>{enlazar(o)}</p>
                  </li>
                ))}
              </ol>
            </Llave>
          </section>
        )}

        {/* ── Al día: lo reciente que el temario ya recoge ── */}
        {seo?.alDia && (
          <section className="cu-seccion" aria-labelledby="fc-aldia">
            <header className="cu-seccion-cab">
              <p className="cu-num">{dos(num.alDia)}</p>
              <h2 id="fc-aldia" className="cu-h2">Al día a {seo.alDia.fecha}: lo que ya recoge el temario</h2>
              <p className="cu-sub">
                La tributación de las criptomonedas cambia cada año. Esto es lo más reciente, y está dentro del curso.
              </p>
            </header>
            {/* Un pósit amarillo de nota, con su «NB»: lo último que hay que saber. */}
            <Postit color="amarillo" giro={-0.8} className="fc-aldia-postit">
              <SimboloEstudio tipo="nb" color="naranja" className="postit-esquina" retraso={300} />
              <ul className="fc-aldia">
                {seo.alDia.puntos.map((p) => (
                  <li key={p}><span className="fc-aldia-ic" aria-hidden="true"><CalendarCheck size={16} strokeWidth={2.4} /></span><span>{enlazar(p)}</span></li>
                ))}
              </ul>
            </Postit>
          </section>
        )}

        {/* ── El temario: el camino del curso ── */}
        <section className="cu-seccion" aria-labelledby="fc-temario">
          <header className="cu-seccion-cab">
            <p className="cu-num">{dos(num.temario)}</p>
            <h2 id="fc-temario" className="cu-h2">El temario completo</h2>
            <p className="cu-sub">
              {modulos.length} módulos en orden. Cada uno se abre al aprobar el examen del anterior, y al final te
              espera tu certificado. Toca un módulo para ver sus lecciones.
            </p>
          </header>

          <ol className={`fc-camino${camino.conProgreso ? " is-progreso" : ""}`}>
            {camino.modulos.map((p, i) => {
              const m = p.modulo;
              const k = i * 2;
              const minutosMod = m.lecciones.reduce((t, l) => t + l.minutos, 0);
              const ultimo = i === camino.modulos.length - 1;
              return (
                <Fragment key={m.id}>
                  {/* El módulo */}
                  <li className={`fc-parada is-${p.nodo}`} style={{ "--x": xDe(k) } as React.CSSProperties}>
                    <Via desde={xDe(k)} hasta={xDe(k + 1)} hecha={p.nodo === "hecho"} />
                    <span className={`fc-nodo is-${p.nodo}`} aria-hidden="true">
                      {p.nodo === "hecho" ? <Check size={30} strokeWidth={3.4} /> : m.orden}
                      {p.nodo === "actual" && (
                        <span className="fc-bocadillo">{camino.conProgreso ? "Vas por aquí" : "Empieza aquí"}</span>
                      )}
                    </span>
                    <div className="fc-tarjeta fc-mod">
                      <p className="fc-mod-kicker">
                        Módulo {m.orden}
                        {camino.conProgreso && <span className={`fc-estado is-${p.nodo}`}>{ESTADO_MODULO[p.nodo]}</span>}
                      </p>
                      <h3 className="fc-mod-titulo">{m.titulo}</h3>
                      {m.descripcion && <p className="fc-mod-desc">{m.descripcion}</p>}
                      <ul className="fc-pills">
                        <li><BookOpenText size={13} aria-hidden="true" /> {m.lecciones.length} lecciones</li>
                        <li><Clock3 size={13} aria-hidden="true" /> {duracion(minutosMod)}</li>
                        {p.hechas !== null && <li className="fc-pill-hechas"><Check size={13} strokeWidth={3} aria-hidden="true" /> {p.hechas} de {m.lecciones.length} hechas</li>}
                      </ul>
                      <details className="fc-lecciones" open={m.id === desplegado}>
                        <summary>
                          <span>Las {m.lecciones.length} lecciones</span>
                          <ChevronDown size={18} strokeWidth={2.6} aria-hidden="true" />
                        </summary>
                        <ol>
                          {m.lecciones.map((l, j) => {
                            const hecha = alumno?.completadas.has(l.id);
                            return (
                              <li key={l.id} className={hecha ? "is-hecha" : undefined}>
                                <span className="fc-leccion-ic" aria-hidden="true">
                                  {hecha ? <Check size={14} strokeWidth={3.4} /> : <Play size={12} fill="currentColor" />}
                                </span>
                                <span className="fc-leccion-texto">
                                  <span className="fc-leccion-tit">
                                    <span className="fc-leccion-num">{m.orden}.{j + 1}</span>
                                    {l.titulo}
                                    {hecha && <span className="sr-only"> (completada)</span>}
                                  </span>
                                  {l.resumen && <span className="fc-leccion-resumen">{l.resumen}</span>}
                                </span>
                                <span className="fc-leccion-min">{l.minutos} min</span>
                              </li>
                            );
                          })}
                        </ol>
                      </details>
                    </div>
                  </li>

                  {/* Su examen */}
                  <li className={`fc-parada fc-parada--examen is-${p.examen.nodo}`} style={{ "--x": xDe(k + 1) } as React.CSSProperties}>
                    <Via desde={xDe(k + 1)} hasta={xDe(k + 2)} hecha={p.examen.nodo === "hecho"} />
                    <span className={`fc-nodo fc-nodo--examen is-${p.examen.nodo}`} aria-hidden="true">
                      {caraExamen(p.examen, camino.conProgreso, false)}
                      {p.examen.nodo === "actual" && <span className="fc-bocadillo">Te toca el examen</span>}
                    </span>
                    <div className="fc-tarjeta fc-examen">
                      <p className="fc-examen-titulo">Examen del módulo {m.orden}</p>
                      <p className="fc-examen-texto">
                        {m.preguntas_examen} preguntas al azar · se aprueba con un {notaCorta(m.nota_minima)} · abre{" "}
                        {ultimo ? "el examen final" : "el módulo siguiente"}
                      </p>
                      {camino.conProgreso && (
                        <p className={`fc-estado is-${p.examen.nodo}`}>
                          {textoExamen(p.examen, "Se abre al completar todas las lecciones del módulo")}
                        </p>
                      )}
                    </div>
                  </li>
                </Fragment>
              );
            })}

            {/* El examen final */}
            <li className={`fc-parada fc-parada--final is-${camino.final.nodo}`} style={{ "--x": xDe(kFinal) } as React.CSSProperties}>
              <Via desde={xDe(kFinal)} hasta={50} hecha={camino.final.nodo === "hecho"} />
              <span className={`fc-nodo fc-nodo--examen fc-nodo--final is-${camino.final.nodo}`} aria-hidden="true">
                {caraExamen(camino.final, camino.conProgreso, true)}
                {camino.final.nodo === "actual" && <span className="fc-bocadillo">Último examen</span>}
              </span>
              <div className="fc-tarjeta fc-examen fc-examen--final">
                <p className="fc-mod-kicker">El último paso</p>
                <h3 className="fc-mod-titulo">Examen final</h3>
                <p className="fc-examen-texto">
                  {curso.preguntas_final} preguntas de todo el curso · se aprueba con un {notaCorta(NOTA_MINIMA_FINAL)}
                </p>
                {camino.conProgreso && (
                  <p className={`fc-estado is-${camino.final.nodo}`}>
                    {textoExamen(camino.final, "Se abre al aprobar todos los módulos")}
                  </p>
                )}
              </div>
            </li>

            {/* La meta: el certificado */}
            <li className={`fc-parada fc-parada--meta is-${camino.meta}`} style={{ "--x": 50 } as React.CSSProperties}>
              <span className={`fc-nodo fc-nodo--meta is-${camino.meta}`} aria-hidden="true">
                {camino.meta === "hecho" ? <Award size={34} strokeWidth={2.2} /> : <>Certi-<br />ficado</>}
              </span>
              <div className="fc-tarjeta fc-meta">
                <p className="fc-mod-kicker">La meta</p>
                <h3 className="fc-mod-titulo">Tu certificado y el logro «{curso.logro}»</h3>
                {cert ? (
                  <>
                    <p className="fc-estado is-hecho">Conseguido con un {formatoNota(cert.nota_final)}</p>
                    <Tecla href={hrefCert} color="amarillo" tamano="peq">Ver tu certificado</Tecla>
                  </>
                ) : (
                  <p className="fc-examen-texto">
                    Al aprobar el examen final: tu certificado con tu nombre y tu nota, y el logro en tu perfil.
                  </p>
                )}
              </div>
            </li>
          </ol>

          <ul className="fc-leyenda" aria-label="Qué es cada parada del camino">
            <li><i className="fc-punto fc-punto--actual" />{camino.conProgreso ? "Vas por aquí" : "Empieza aquí"}</li>
            {camino.conProgreso && <li><i className="fc-punto fc-punto--hecho" />Hecho</li>}
            <li><i className="fc-punto fc-punto--bloq" />{camino.conProgreso ? "Bloqueado" : "Módulo"}</li>
            <li><i className="fc-punto fc-punto--examen" />Examen</li>
            <li><i className="fc-punto fc-punto--meta" />Certificado</li>
          </ul>
        </section>

        {/* ── El certificado ── */}
        <section className="cu-seccion cu-cert" aria-labelledby="fc-cert-titulo">
          <div className="cu-cert-texto">
            <p className="cu-num">{dos(num.certificado)}</p>
            <h2 id="fc-cert-titulo" className="cu-h2">
              Un certificado que <span className="fluor">cualquiera puede comprobar</span>
            </h2>
            <p className="cu-p">
              Al aprobar el examen final recibes tu certificado con tu nombre y tu nota. Un PDF se puede retocar;
              este lleva un código, y en su página pública cualquiera comprueba que lo emitió la academia, a quién
              y con qué nota.
            </p>
            <ul className="cu-lista-check">
              <li><span className="cu-ic cu-ic--lila" aria-hidden="true"><Check size={16} strokeWidth={3} /></span> Con tu nombre y tu nota final de 0 a 10</li>
              <li><span className="cu-ic cu-ic--lila" aria-hidden="true"><ClipboardCheck size={16} strokeWidth={2.4} /></span> Nota: 40 % la media de los módulos y 60 % el examen final</li>
              <li><span className="cu-ic cu-ic--menta" aria-hidden="true"><ShieldCheck size={16} strokeWidth={2.4} /></span> Código de verificación con página pública</li>
              <li><span className="cu-ic cu-ic--cielo" aria-hidden="true"><Download size={16} strokeWidth={2.6} /></span> Descargable en PDF, listo para imprimir</li>
            </ul>
            <div className="cu-logro">
              <span className="cu-logro-sello" aria-hidden="true">{iconoCurso(slug, 28)}</span>
              <span>
                <span className="cu-logro-nota">y además, un logro en tu perfil</span>
                <strong>{curso.logro}</strong>
              </span>
            </div>
          </div>
          <div className="cu-marco">
            <span className="cu-cinta cu-cinta--izq" aria-hidden="true" />
            <span className="cu-cinta cu-cinta--dcha" aria-hidden="true" />
            {cert ? (
              /* Quien ya lo aprobó ve el suyo, no la muestra. */
              <Link href={hrefCert} className="cu-marco-enlace" aria-label={`Ver tu certificado de ${curso.titulo}`}>
                <Certificado
                  nombre={cert.nombre}
                  curso={curso.titulo}
                  logro={curso.logro}
                  notaFinal={cert.nota_final}
                  notaModulos={cert.nota_modulos}
                  notaExamen={cert.nota_examen}
                  fecha={cert.created_at}
                  codigo={cert.codigo}
                  color={curso.color}
                />
              </Link>
            ) : (
              <div aria-hidden="true">
                <Certificado
                  muestra
                  nombre="Tu nombre aquí"
                  curso={curso.titulo}
                  logro={curso.logro}
                  notaFinal={8.75}
                  notaModulos={8.4}
                  notaExamen={9}
                  fecha={new Date().toISOString()}
                  codigo="XXXXXXXXXX"
                  color={curso.color}
                />
              </div>
            )}
            <span className="cu-marco-nota" aria-hidden="true">{cert ? "el tuyo" : "así será el tuyo"}</span>
          </div>
        </section>

        {/* ── Cómo funciona ── */}
        <section className="cu-seccion" aria-labelledby="fc-como">
          <header className="cu-seccion-cab">
            <p className="cu-num">{dos(num.como)}</p>
            <h2 id="fc-como" className="cu-h2">Cómo funciona</h2>
            <p className="cu-sub">Igual en todos los cursos de la academia.</p>
          </header>
          <PasosCurso />
        </section>

        {/* ── Preguntas frecuentes ── */}
        {seo?.faq && seo.faq.length > 0 && (
          <section className="cu-seccion" aria-labelledby="fc-faq">
            <header className="cu-seccion-cab">
              <p className="cu-num">{dos(num.faq)}</p>
              {/* Con el nombre largo del curso: es el <h2> que lleva la consulta (Fase 6.5). */}
              <h2 id="fc-faq" className="cu-h2">Preguntas frecuentes sobre el {(seo?.h1 ?? "curso").replace(/^Curso\b/, "curso")}</h2>
            </header>
            <div className="fc-faq">
              {seo.faq.map((f) => (
                <details key={f.q} className="fc-faq-item">
                  <summary>
                    <span>{f.q}</span>
                    <span className="fc-faq-mas" aria-hidden="true" />
                  </summary>
                  <p>
                    {f.a}
                    {f.enlace && <> <Link href={f.enlace.href}>{f.enlace.texto}</Link>.</>}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        <DisclaimerRiesgo variante={curso.aviso} />

        {/* ── Cierre ── */}
        <section className={`fc-final${premium ? " fc-final--alumno" : ""}`} aria-labelledby="fc-final-titulo">
          <span className="fc-final-sello" aria-hidden="true">{iconoCurso(slug, 34)}</span>
          <h2 id="fc-final-titulo" className="fc-final-titulo">{cierre.titulo}</h2>
          <p className="fc-final-sub">{cierre.texto}</p>
          <Tecla href={cta.href} color={cta.color} tamano="grande" prefetch={prefetch(cta.href)}>
            {cta.texto}
            <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
          </Tecla>
        </section>
      </main>

      <Footer />
    </div>
  );
}
