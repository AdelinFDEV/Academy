import Link from "next/link";
import {
  ArrowRight, Award, BadgeCheck, BarChart3, BookOpenText, CalendarCheck, ChevronDown, CircleCheckBig, CircleX,
  ClipboardCheck, Clock3, Crown, Download, GraduationCap, Layers, Medal, PlayCircle, ShieldCheck, Sparkles,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import ComoFunciona from "@/components/aula/ComoFunciona";
import Certificado from "@/components/aula/Certificado";
import Termino from "@/components/Termino";
import type { CursoCompleto, DatosAlumno, Sesion } from "@/lib/cursos";
import { duracion, fechaLarga, minutosTotales, type EstadoCurso } from "@/lib/cursos-progreso";
import type { CursoSeo } from "@/lib/cursos-seo";
import { PREMIUM_PRICE_EUR, precioEur } from "@/lib/stripe";

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
 * La ficha pública de un curso, solo la parte que se pinta. Los datos los
 * lee `page.tsx`; aquí no hay ninguna consulta, así que lo que se ve depende
 * únicamente de lo que llega por props.
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
  // Las secciones numeradas van seguidas aunque falte alguna opcional. El
  // certificado no enseña su número, pero ocupa el suyo.
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

  const cta = !sesion
    ? { href: "/premium", texto: "Ver qué incluye Premium", secundario: { href: `/login?next=/cursos/${slug}`, texto: "Ya tengo cuenta" } }
    : !sesion.esPremium
      ? { href: "/api/checkout", texto: "Hazte Premium para empezar", secundario: null }
      : alumno?.certificado
        ? { href: `/aula/${slug}/certificado`, texto: "Ver tu certificado", secundario: { href: `/aula/${slug}`, texto: "Entrar al curso" } }
        : alumno?.inscripcion
          ? { href: `/aula/${slug}`, texto: "Continuar el curso", secundario: null }
          : { href: `/aula/${slug}`, texto: "Empezar el curso", secundario: null };

  const incluye = [
    { icono: Layers, cifra: `${modulos.length} módulos`, texto: "En orden, cada uno con su examen" },
    { icono: BookOpenText, cifra: `${lecciones} lecciones`, texto: "Con gráficos animados y minijuegos" },
    { icono: Clock3, cifra: duracion(total), texto: "A tu ritmo, con tu propio cronograma" },
    { icono: ClipboardCheck, cifra: `${modulos.length + 1} exámenes`, texto: "Uno por módulo y el final" },
  ];

  return (
    <div className="blog-page">
      <div className="bg-ambient" />
      <SiteNav user={!!sesion} isPremium={sesion?.esPremium} userName={sesion?.nombre} isAdmin={sesion?.esAdmin} />

      <main className="blog-main det-main cf" style={{ "--det-accent": curso.color, "--cf-acento": curso.color } as React.CSSProperties}>
        <div className="det-backdrop" aria-hidden="true">
          <span className="det-backdrop-grid" />
          <span className="det-orb det-orb--1" />
          <span className="det-orb det-orb--2" />
          <span className="det-orb det-orb--3" />
        </div>

        <nav className="det-breadcrumb" aria-label="Migas de pan">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true">›</span>
          <Link href="/cursos">Cursos</Link>
          <span aria-hidden="true">›</span>
          <span>{curso.titulo}</span>
        </nav>

        {!curso.published && (
          <p className="cur-borrador">Borrador: solo lo ves tú, como admin. No está en el catálogo ni en el sitemap.</p>
        )}

        {/* ── Hero ── */}
        <header className="cf-hero">
          <div className="cf-hero-texto">
            <div className="cf-chips">
              <span className="cf-chip"><GraduationCap size={14} aria-hidden="true" /> Curso online</span>
              <span className="cf-chip"><BarChart3 size={14} aria-hidden="true" /> Nivel {curso.nivel}</span>
              <span className="cf-chip cf-chip--oro"><Crown size={14} aria-hidden="true" /> Incluido en Premium · {precioEur(PREMIUM_PRICE_EUR)}/mes</span>
            </div>

            <h1 className="cf-titulo">
              {seo?.h1 ?? curso.titulo}
              {curso.subtitulo && <span className="cf-titulo-grad">{curso.subtitulo}</span>}
            </h1>
            {curso.descripcion && <p className="cf-lead">{enlazar(curso.descripcion)}</p>}

            <div className="cf-acciones">
              <Link href={cta.href} prefetch={cta.href.startsWith("/api/") ? false : undefined} className="cf-btn">
                {cta.texto}
                <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
              </Link>
              {cta.secundario && (
                <Link href={cta.secundario.href} className="cf-btn cf-btn--ghost">{cta.secundario.texto}</Link>
              )}
            </div>

            <ul className="cf-confianza">
              {curso.revisado && (
                <li><CalendarCheck size={15} aria-hidden="true" /> Revisado el {fechaLarga(new Date(curso.revisado))}</li>
              )}
              <li><ShieldCheck size={15} aria-hidden="true" /> Certificado verificable</li>
              <li><Sparkles size={15} aria-hidden="true" /> Sin pagar nada aparte</li>
            </ul>
          </div>

          <aside className="cf-panel" aria-label="Lo que incluye el curso">
            <span className="cf-panel-kicker">Lo que incluye</span>
            <ul className="cf-incluye">
              {incluye.map(({ icono: Icono, cifra, texto }) => (
                <li key={cifra}>
                  <span className="cf-icono" aria-hidden="true"><Icono size={19} strokeWidth={2} /></span>
                  <span>
                    <strong>{cifra}</strong>
                    <span>{texto}</span>
                  </span>
                </li>
              ))}
              <li className="cf-incluye-cert">
                <span className="cf-icono cf-icono--oro" aria-hidden="true"><Award size={20} strokeWidth={2} /></span>
                <span>
                  <strong>Certificado y logro</strong>
                  <span>Con tu nombre, tu nota y un código para verificarlo</span>
                </span>
              </li>
            </ul>
            {progreso && alumno?.inscripcion && (
              <div className="cf-progreso">
                <div className="cf-progreso-cab">
                  <span>Tu progreso</span>
                  <strong>{progreso.porcentaje} %</strong>
                </div>
                <span className="cf-barra"><i style={{ width: `${progreso.porcentaje}%` }} /></span>
              </div>
            )}
          </aside>
        </header>

        {/* ── Para quién es ── */}
        {seo?.para && (
          <section className="det-seccion">
            <header className="det-sechead">
              <span className="det-sechead-num">{dos(num.para)}</span>
              <div className="det-sechead-text">
                <h2 className="det-h2">Para quién es este curso</h2>
                <p className="det-sechead-sub">Y para quién no, que también conviene saberlo antes de empezar.</p>
              </div>
            </header>
            <div className="cf-para">
              <div className="cf-para-col cf-para-col--si">
                <p className="cf-para-titulo">Te sirve si…</p>
                <ul>
                  {seo.para.si.map((t) => (
                    <li key={t}><CircleCheckBig size={17} strokeWidth={2.2} aria-hidden="true" /><span>{enlazar(t)}</span></li>
                  ))}
                </ul>
              </div>
              <div className="cf-para-col cf-para-col--no">
                <p className="cf-para-titulo">No es para ti si…</p>
                <ul>
                  {seo.para.no.map((t) => (
                    <li key={t}><CircleX size={17} strokeWidth={2.2} aria-hidden="true" /><span>{enlazar(t)}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* ── Lo que sabrás hacer ── */}
        {curso.objetivos.length > 0 && (
          <section className="det-seccion">
            <header className="det-sechead">
              <span className="det-sechead-num">{dos(num.objetivos)}</span>
              <div className="det-sechead-text">
                <h2 className="det-h2">Lo que sabrás hacer al terminar</h2>
                <p className="det-sechead-sub">No es teoría para aprobar: es lo que vas a poder hacer con tu propia declaración.</p>
              </div>
            </header>
            <ul className="cf-objetivos">
              {curso.objetivos.map((o, i) => (
                <li key={o}>
                  <span className="cf-objetivo-icono" aria-hidden="true"><CircleCheckBig size={18} strokeWidth={2.2} /></span>
                  <span className="cf-objetivo-num">{String(i + 1).padStart(2, "0")}</span>
                  <p>{enlazar(o)}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Al día: lo reciente que el temario ya recoge ── */}
        {seo?.alDia && (
          <section className="det-seccion">
            <header className="det-sechead">
              <span className="det-sechead-num">{dos(num.alDia)}</span>
              <div className="det-sechead-text">
                <h2 className="det-h2">Al día a {seo.alDia.fecha}: lo que ya recoge el temario</h2>
                <p className="det-sechead-sub">
                  La tributación de las criptomonedas cambia cada año. Esto es lo más reciente, y está dentro del curso.
                </p>
              </div>
            </header>
            <ul className="cf-aldia">
              {seo.alDia.puntos.map((p) => (
                <li key={p}><CalendarCheck size={17} strokeWidth={2.1} aria-hidden="true" /><span>{enlazar(p)}</span></li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Temario ── */}
        <section className="det-seccion">
          <header className="det-sechead">
            <span className="det-sechead-num">{dos(num.temario)}</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">El temario completo</h2>
              <p className="det-sechead-sub">
                {modulos.length} módulos en orden. Cada uno se abre al aprobar el examen del anterior. Toca un módulo para ver sus lecciones.
              </p>
            </div>
          </header>

          <ol className="cf-temario">
            {modulos.map((m, i) => {
              const estadoMod = progreso?.modulos.find((e) => e.modulo.id === m.id);
              const aprobado = estadoMod?.examen.tipo === "aprobado";
              const minutosMod = m.lecciones.reduce((t, l) => t + l.minutos, 0);
              return (
                <li key={m.id} className={`cf-mod${aprobado ? " is-hecho" : ""}`}>
                  <span className="cf-mod-nodo" aria-hidden="true">
                    {aprobado ? <BadgeCheck size={18} strokeWidth={2.4} /> : String(m.orden).padStart(2, "0")}
                  </span>
                  <details className="cf-mod-card" open={i === 0}>
                    <summary>
                      <span className="cf-mod-cab">
                        <span className="cf-mod-kicker">Módulo {m.orden}</span>
                        <span className="cf-mod-titulo">{m.titulo}</span>
                        {m.descripcion && <span className="cf-mod-desc">{m.descripcion}</span>}
                        <span className="cf-mod-pills">
                          <span><BookOpenText size={13} aria-hidden="true" /> {m.lecciones.length} lecciones</span>
                          <span><Clock3 size={13} aria-hidden="true" /> {duracion(minutosMod)}</span>
                          <span><ClipboardCheck size={13} aria-hidden="true" /> Examen</span>
                        </span>
                      </span>
                      <span className="cf-mod-flecha" aria-hidden="true"><ChevronDown size={18} /></span>
                    </summary>
                    <ul className="cf-lecciones">
                      {m.lecciones.map((l, j) => {
                        const hecha = alumno?.completadas.has(l.id);
                        return (
                          <li key={l.id} className={hecha ? "is-hecha" : undefined}>
                            <span className="cf-leccion-icono" aria-hidden="true">
                              {hecha ? <CircleCheckBig size={16} strokeWidth={2.4} /> : <PlayCircle size={16} strokeWidth={2} />}
                            </span>
                            <span className="cf-leccion-texto">
                              <span className="cf-leccion-tit">
                                <span className="cf-leccion-num">{m.orden}.{j + 1}</span>
                                {l.titulo}
                              </span>
                              {l.resumen && <span className="cf-leccion-resumen">{l.resumen}</span>}
                            </span>
                            <span className="cf-leccion-min">{l.minutos} min</span>
                          </li>
                        );
                      })}
                      <li className="cf-leccion-examen">
                        <span className="cf-leccion-icono" aria-hidden="true"><ClipboardCheck size={16} strokeWidth={2.2} /></span>
                        <span className="cf-leccion-texto">
                          Examen del módulo
                          <span className="cf-leccion-resumen">
                            {m.preguntas_examen} preguntas al azar · se aprueba con un {String(m.nota_minima).replace(".", ",")} · abre el módulo siguiente
                          </span>
                        </span>
                      </li>
                    </ul>
                  </details>
                </li>
              );
            })}
            <li className="cf-mod cf-mod--final">
              <span className="cf-mod-nodo" aria-hidden="true"><Award size={19} strokeWidth={2.2} /></span>
              <div className="cf-mod-card">
                <span className="cf-mod-cab">
                  <span className="cf-mod-kicker">La meta</span>
                  <span className="cf-mod-titulo">Examen final y certificado</span>
                  <span className="cf-mod-desc">
                    {curso.preguntas_final} preguntas de todo el curso. Al aprobarlo, tu certificado y el logro «{curso.logro}».
                  </span>
                </span>
              </div>
            </li>
          </ol>
        </section>

        {/* ── El certificado ── */}
        <section className="cf-cert" aria-labelledby="cf-cert-titulo">
          <div className="cf-cert-texto">
            <span className="cf-cert-kicker"><Award size={15} aria-hidden="true" /> Tu meta</span>
            <h2 id="cf-cert-titulo" className="cf-cert-titulo">
              Un certificado que <span>cualquiera puede comprobar</span>
            </h2>
            <p className="cf-cert-lead">
              Al aprobar el examen final recibes tu certificado con tu nombre y tu nota. Un PDF se puede retocar;
              este lleva un código, y en su página pública cualquiera comprueba que lo emitió la academia, a quién
              y con qué nota.
            </p>
            <ul className="cf-cert-lista">
              <li><span className="cf-icono cf-icono--oro" aria-hidden="true"><BadgeCheck size={17} /></span> Con tu nombre y tu nota final de 0 a 10</li>
              <li><span className="cf-icono cf-icono--oro" aria-hidden="true"><BarChart3 size={17} /></span> Nota: 40 % la media de los módulos y 60 % el examen final</li>
              <li><span className="cf-icono cf-icono--oro" aria-hidden="true"><ShieldCheck size={17} /></span> Código de verificación con página pública</li>
              <li><span className="cf-icono cf-icono--oro" aria-hidden="true"><Download size={17} /></span> Descargable en PDF, listo para imprimir</li>
            </ul>
            <div className="cf-logro">
              <span className="cf-logro-medalla" aria-hidden="true"><Medal size={26} strokeWidth={1.8} /></span>
              <span>
                <span className="cf-logro-kicker">Y además, un logro en tu perfil</span>
                <strong>{curso.logro}</strong>
              </span>
            </div>
          </div>
          <div className="cf-cert-muestra">
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
        </section>

        {/* ── Cómo funciona ── */}
        <section className="det-seccion det-seccion--panel">
          <header className="det-sechead">
            <span className="det-sechead-num">{dos(num.como)}</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">Cómo funciona</h2>
              <p className="det-sechead-sub">Igual en todos los cursos de la academia.</p>
            </div>
          </header>
          <ComoFunciona />
        </section>

        {/* ── Preguntas frecuentes ── */}
        {seo?.faq && seo.faq.length > 0 && (
          <section className="det-seccion">
            <header className="det-sechead">
              <span className="det-sechead-num">{dos(num.faq)}</span>
              <div className="det-sechead-text">
                {/* Con el nombre largo del curso: es el <h2> que lleva la consulta (Fase 6.5). */}
                <h2 className="det-h2">Preguntas frecuentes sobre el {(seo?.h1 ?? "curso").replace(/^Curso\b/, "curso")}</h2>
              </div>
            </header>
            <div className="det-faq">
              {seo.faq.map((f) => (
                <details key={f.q} className="det-faq-item">
                  <summary>{f.q}</summary>
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
        <section className="cf-final">
          <span className="cf-final-icono" aria-hidden="true"><GraduationCap size={30} strokeWidth={1.8} /></span>
          <h2 className="cf-final-titulo">
            {sesion?.esPremium ? "Tu curso te espera" : "Incluido en Premium, sin pagar nada aparte"}
          </h2>
          <p className="cf-final-sub">
            {sesion?.esPremium
              ? "Elige tu ritmo y empieza por el primer módulo. Puedes cambiar el ritmo cuando quieras."
              : "Todos los cursos entran en la misma suscripción que las herramientas y la comunidad."}
          </p>
          <Link href={cta.href} prefetch={cta.href.startsWith("/api/") ? false : undefined} className="cf-btn">
            {cta.texto}
            <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
