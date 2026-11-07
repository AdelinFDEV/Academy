import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, Award, BookOpenText, Check, ClipboardCheck, Clock3, Crown, GraduationCap, Layers, ShieldCheck, Sparkles,
} from "lucide-react";
import { PASOS } from "@/components/aula/ComoFunciona";
import Certificado from "@/components/aula/Certificado";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { cursoPorSlug, cursosPublicados, datosAlumno, duracion, sesionActual, type CursoCompleto } from "@/lib/cursos";
import { iconoCurso } from "@/lib/logros";
import "./catalogo.css";

/**
 * Catálogo de cursos — rehecho el 08-11-2026 para que la página trate solo de
 * los cursos: arriba, la portada del curso destacado; después, lo que vas a
 * aprender, el temario, el catálogo, cómo funciona y el certificado.
 *
 * El contenido no vive aquí: cada curso es una fila de `cursos` en Supabase y
 * esta página solo lo pinta. **Todo lo que se cuenta sale de esos datos**
 * (módulos, lecciones, minutos, objetivos, logro): ni una cifra de adorno.
 *
 * Sin ningún curso publicado, la página sale con `noindex` y sin canónica,
 * y enseña solo un estado vacío: una página vacía indexada es contenido pobre.
 *
 * ⚠️ «Cómo funciona» sale de `PASOS` (ComoFunciona.tsx), que describe lo que
 * hace el aula de verdad. Si cambia una regla, se cambia allí.
 */
export async function generateMetadata(): Promise<Metadata> {
  const cursos = await cursosPublicados();
  return {
    title: "Cursos de trading y criptomonedas",
    description:
      "Cursos por módulos para alumnos Premium: a tu ritmo, con examen en cada módulo, examen final con nota de 0 a 10 y certificado verificable.",
    ...(cursos.length > 0
      ? { alternates: { canonical: "/cursos" } }
      : { robots: { index: false, follow: true } }),
  };
}

/** El botón principal de un curso según quién mire y cómo lo lleva. */
function ctaDe(slug: string, sesion: Awaited<ReturnType<typeof sesionActual>>, estado: "nuevo" | "empezado" | "aprobado") {
  if (!sesion) return { href: "/premium", texto: "Desbloquear con Premium" };
  if (!sesion.esPremium) return { href: "/premium", texto: "Hazte Premium para empezar" };
  if (estado === "aprobado") return { href: "/dashboard/certificados", texto: "Ver tu certificado" };
  if (estado === "empezado") return { href: `/aula/${slug}`, texto: "Continuar el curso" };
  return { href: `/aula/${slug}`, texto: "Empezar el curso" };
}

const nf = (n: number) => new Intl.NumberFormat("es-ES").format(n);

export default async function CursosPage() {
  const [sesion, resumen] = await Promise.all([sesionActual(), cursosPublicados()]);
  const completos = (await Promise.all(resumen.map((r) => cursoPorSlug(r.slug)))).filter(
    (c): c is CursoCompleto => c !== null,
  );

  const destacado = completos[0] ?? null;
  const resDestacado = resumen[0] ?? null;

  // Cómo lleva el alumno Premium el curso destacado, para el botón.
  let estado: "nuevo" | "empezado" | "aprobado" = "nuevo";
  if (destacado && sesion?.esPremium) {
    const datos = await datosAlumno(sesion.userId, destacado);
    estado = datos.certificado ? "aprobado" : datos.inscripcion ? "empezado" : "nuevo";
  }

  const totalModulos = resumen.reduce((t, c) => t + c.modulos, 0);
  const totalLecciones = resumen.reduce((t, c) => t + c.lecciones, 0);
  const totalMinutos = resumen.reduce((t, c) => t + c.minutos, 0);
  const totalExamenes = totalModulos + resumen.length;

  return (
    <div className="blog-page cx">
      <div className="bg-ambient" />
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Inicio", path: "/" },
            { name: "Cursos", path: "/cursos" },
          ]),
        ]}
      />

      <SiteNav user={!!sesion} isPremium={sesion?.esPremium} userName={sesion?.nombre} isAdmin={sesion?.esAdmin} />

      {!destacado || !resDestacado ? (
        <main className="cx-main">
          <section className="cx-vacio">
            <span className="cx-vacio-icono" aria-hidden="true"><GraduationCap size={30} strokeWidth={1.6} /></span>
            <h1 className="cx-h2">Los cursos están en preparación</h1>
            <p className="cx-p">
              Cuando se publique el primero aparecerá aquí. Mientras tanto, las <Link href="/guias">guías</Link> cubren
              los fundamentos y el <Link href="/glosario">diccionario</Link> explica cada término.
            </p>
          </section>
        </main>
      ) : (
        <main className="cx-main" style={{ "--cx-c": destacado.curso.color } as React.CSSProperties}>
          {/* ── Hero: la portada del curso destacado ── */}
          <section className="cx-hero">
            <div className="cx-hero-fondo" aria-hidden="true">
              <span className="cx-rejilla" />
              <span className="cx-luz cx-luz--1" />
              <span className="cx-luz cx-luz--2" />
            </div>

            <div className="cx-hero-texto">
              <nav className="cx-migas" aria-label="Migas de pan">
                <Link href="/">Inicio</Link>
                <span aria-hidden="true">/</span>
                <span>Cursos</span>
              </nav>

              <span className="cx-pildora">
                <span className="cx-pildora-punto" aria-hidden="true" />
                Nuevo curso · Incluido en Premium
              </span>

              <h1 className="cx-titulo">
                Aprende con método.
                <span className="cx-titulo-grad">Demuéstralo con examen.</span>
              </h1>

              <p className="cx-lead">
                Cursos completos, módulo a módulo, a tu ritmo. Cada módulo se cierra con un examen y el último te da
                un certificado verificable. El primero ya está abierto: <strong>{destacado.curso.titulo}</strong>.
              </p>

              <div className="cx-acciones">
                {(() => {
                  const cta = ctaDe(destacado.curso.slug, sesion, estado);
                  return (
                    <Link href={cta.href} className="cx-btn">
                      {cta.texto} <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
                    </Link>
                  );
                })()}
                <Link href={`/cursos/${destacado.curso.slug}`} className="cx-btn cx-btn--ghost">
                  Ver el temario completo
                </Link>
              </div>

              <dl className="cx-cifras">
                <div><dt>Módulos</dt><dd>{nf(totalModulos)}</dd></div>
                <div><dt>Lecciones</dt><dd>{nf(totalLecciones)}</dd></div>
                <div><dt>Exámenes</dt><dd>{nf(totalExamenes)}</dd></div>
                <div><dt>De contenido</dt><dd>{duracion(totalMinutos)}</dd></div>
              </dl>
            </div>

            {/* La portada: el curso como un objeto, con sus módulos apilados. */}
            <Link href={`/cursos/${destacado.curso.slug}`} className="cx-portada" aria-label={`Ver el curso ${destacado.curso.titulo}`}>
              <span className="cx-orbita cx-orbita--1" aria-hidden="true" />
              <span className="cx-orbita cx-orbita--2" aria-hidden="true" />
              {/* Detrás de la carta asoma la muestra del certificado que se gana al aprobar. */}
              <span className="cx-portada-cert" aria-hidden="true">
                <span className="cx-portada-cert-etiqueta"><Award size={12} /> Tu certificado al aprobar</span>
                <Certificado
                  muestra
                  nombre={sesion?.nombre ?? "Tu nombre aquí"}
                  curso={destacado.curso.titulo}
                  logro={destacado.curso.logro}
                  notaFinal={8.75}
                  notaModulos={8.4}
                  notaExamen={9}
                  fecha={destacado.curso.updated_at}
                  codigo="XXXXXXXXXX"
                  color={destacado.curso.color}
                />
              </span>
              <span className="cx-portada-carta">
                <span className="cx-portada-cab">
                  <span className="cx-portada-sello" aria-hidden="true">{iconoCurso(destacado.curso.slug, 26)}</span>
                  <span className="cx-portada-nivel">{destacado.curso.nivel}</span>
                </span>
                <span className="cx-portada-kicker">Curso Premium</span>
                <span className="cx-portada-titulo">{destacado.curso.titulo}</span>
                {destacado.curso.subtitulo && <span className="cx-portada-sub">{destacado.curso.subtitulo}</span>}
                <span className="cx-portada-modulos" aria-hidden="true">
                  {destacado.modulos.map((m) => (
                    <span key={m.id} className="cx-portada-mod">
                      <span>{String(m.orden).padStart(2, "0")}</span>
                      <span>{m.titulo}</span>
                    </span>
                  ))}
                </span>
                <span className="cx-portada-pie">
                  <span><Award size={14} aria-hidden="true" /> Logro «{destacado.curso.logro}»</span>
                  <span>{duracion(resDestacado.minutos)}</span>
                </span>
              </span>
            </Link>
          </section>

          {/* ── Franja: lo que vas a aprender ── */}
          {destacado.curso.objetivos.length > 0 && (
            <section className="cx-franja" aria-label="Lo que vas a aprender">
              <div className="cx-franja-pista">
                {[0, 1].map((copia) => (
                  <ul key={copia} className="cx-franja-lista" aria-hidden={copia === 1 ? true : undefined}>
                    {destacado.curso.objetivos.map((o) => (
                      <li key={o}><Sparkles size={14} aria-hidden="true" /> {o}</li>
                    ))}
                  </ul>
                ))}
              </div>
            </section>
          )}

          {/* ── 01 · El curso, a fondo ── */}
          <section className="cx-seccion cx-destacado">
            <header className="cx-cab">
              <span className="cx-num">01</span>
              <div>
                <span className="cx-kicker">El curso del momento</span>
                <h2 className="cx-h2">{destacado.curso.titulo}</h2>
                {destacado.curso.descripcion && <p className="cx-p">{destacado.curso.descripcion}</p>}
              </div>
            </header>

            <div className="cx-destacado-rejilla">
              <div className="cx-panel">
                <h3 className="cx-h3">Al terminar sabrás</h3>
                <ul className="cx-objetivos">
                  {destacado.curso.objetivos.map((o) => (
                    <li key={o}><span className="cx-check" aria-hidden="true"><Check size={13} strokeWidth={3} /></span>{o}</li>
                  ))}
                </ul>
                <ul className="cx-incluye">
                  <li><Layers size={16} aria-hidden="true" /><strong>{destacado.modulos.length} módulos</strong> en orden</li>
                  <li><BookOpenText size={16} aria-hidden="true" /><strong>{resDestacado.lecciones} lecciones</strong> con minijuegos</li>
                  <li><ClipboardCheck size={16} aria-hidden="true" /><strong>{destacado.modulos.length + 1} exámenes</strong> corregidos al momento</li>
                  <li><Clock3 size={16} aria-hidden="true" /><strong>{duracion(resDestacado.minutos)}</strong> a tu ritmo</li>
                </ul>
              </div>

              <div className="cx-panel cx-temario">
                <h3 className="cx-h3">El temario</h3>
                <ol className="cx-temario-lista">
                  {destacado.modulos.map((m) => (
                    <li key={m.id}>
                      <span className="cx-temario-num">{String(m.orden).padStart(2, "0")}</span>
                      <span className="cx-temario-txt">
                        <strong>{m.titulo}</strong>
                        <span>{m.lecciones.length} lecciones · {duracion(m.lecciones.reduce((t, l) => t + l.minutos, 0))} · examen al final</span>
                      </span>
                    </li>
                  ))}
                  <li className="is-final">
                    <span className="cx-temario-num"><Award size={15} aria-hidden="true" /></span>
                    <span className="cx-temario-txt">
                      <strong>Examen final y certificado</strong>
                      <span>{destacado.curso.preguntas_final} preguntas · nota de 0 a 10</span>
                    </span>
                  </li>
                </ol>
                <Link href={`/cursos/${destacado.curso.slug}`} className="cx-enlace">
                  Ver todas las lecciones <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>

          {/* ── 02 · Catálogo (solo si hay más de un curso) ── */}
          {completos.length > 1 && (
            <section className="cx-seccion">
              <header className="cx-cab">
                <span className="cx-num">02</span>
                <div>
                  <span className="cx-kicker">Catálogo</span>
                  <h2 className="cx-h2">Todos los cursos</h2>
                  <p className="cx-p">Todos van incluidos en la misma suscripción.</p>
                </div>
              </header>
              <ul className="cx-catalogo">
                {completos.map((c, i) => {
                  const r = resumen[i];
                  return (
                    <li key={c.curso.slug} style={{ "--cx-c": c.curso.color } as React.CSSProperties}>
                      <Link href={`/cursos/${c.curso.slug}`} className="cx-tarjeta">
                        <span className="cx-tarjeta-cab">
                          <span className="cx-portada-sello" aria-hidden="true">{iconoCurso(c.curso.slug, 22)}</span>
                          <span className="cx-portada-nivel">{c.curso.nivel}</span>
                        </span>
                        <span className="cx-tarjeta-titulo">{c.curso.titulo}</span>
                        {c.curso.subtitulo && <span className="cx-tarjeta-sub">{c.curso.subtitulo}</span>}
                        <span className="cx-tarjeta-barras" aria-hidden="true">
                          {c.modulos.map((m) => <i key={m.id} />)}
                        </span>
                        <span className="cx-tarjeta-pie">
                          <span>{r?.modulos} módulos · {r?.lecciones} lecciones · {duracion(r?.minutos ?? 0)}</span>
                          <ArrowRight size={16} aria-hidden="true" />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* ── Cómo funciona ── */}
          <section className="cx-seccion">
            <header className="cx-cab">
              <span className="cx-num">{completos.length > 1 ? "03" : "02"}</span>
              <div>
                <span className="cx-kicker">Cómo funciona</span>
                <h2 className="cx-h2">Pensado para que termines lo que empiezas</h2>
              </div>
            </header>
            <ol className="cx-pasos">
              {PASOS.map((p, i) => {
                const Icon = p.icon;
                return (
                  <li key={p.titulo} className="cx-paso" style={{ "--i": i } as React.CSSProperties}>
                    <span className="cx-paso-icono" aria-hidden="true"><Icon size={20} strokeWidth={1.9} /></span>
                    <span className="cx-paso-num">Paso {i + 1}</span>
                    <strong className="cx-paso-titulo">{p.titulo}</strong>
                    <span className="cx-paso-texto">{p.texto}</span>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* ── El certificado ── */}
          <section className="cx-seccion cx-cert">
            <div className="cx-cert-texto">
              <span className="cx-kicker">La recompensa</span>
              <h2 className="cx-h2">Un certificado con tu nombre, que cualquiera puede verificar</h2>
              <p className="cx-p">
                Al aprobar el examen final recibes tu certificado con la nota, un código único y una página pública
                de verificación. Se guarda en tu vitrina del panel para descargarlo en PDF siempre que quieras, y
                desbloquea el logro del curso en tu perfil.
              </p>
              <ul className="cx-cert-lista">
                <li><ShieldCheck size={16} aria-hidden="true" /> Código de verificación único</li>
                <li><Award size={16} aria-hidden="true" /> Logro «{destacado.curso.logro}» en tu perfil</li>
                <li><GraduationCap size={16} aria-hidden="true" /> Tuyo para siempre, también si cambias de plan</li>
              </ul>
            </div>
            <div className="cx-cert-muestra" aria-hidden="true">
              <Certificado
                muestra
                nombre="Tu nombre aquí"
                curso={destacado.curso.titulo}
                logro={destacado.curso.logro}
                notaFinal={8.75}
                notaModulos={8.4}
                notaExamen={9}
                fecha={destacado.curso.updated_at}
                codigo="XXXXXXXXXX"
                color={destacado.curso.color}
              />
            </div>
          </section>

          {/* ── Cierre ── */}
          <section className="cx-final">
            <span className="cx-final-glow" aria-hidden="true" />
            <span className="cx-pildora"><Crown size={13} aria-hidden="true" /> Incluido en Premium</span>
            <h2 className="cx-final-titulo">
              {sesion?.esPremium ? "Tu curso te está esperando" : "Todos los cursos, en una sola suscripción"}
            </h2>
            <p className="cx-p">
              {sesion?.esPremium
                ? "Ya lo tienes incluido: entra al aula y empieza por el primer módulo."
                : "Sin compras sueltas: cada curso que se publique entra en la misma suscripción que el Diario de Trading y el Portfolio Adelin."}
            </p>
            {(() => {
              const cta = ctaDe(destacado.curso.slug, sesion, estado);
              return (
                <Link href={cta.href} className="cx-btn cx-btn--grande">
                  {cta.texto} <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
                </Link>
              );
            })()}
          </section>
        </main>
      )}

      <Footer />
    </div>
  );
}
