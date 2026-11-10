import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, Award, BookOpenText, Check, ClipboardCheck, Clock3, CreditCard, Crown, GraduationCap, Layers, Lock, Play, ShieldCheck, Zap,
} from "lucide-react";
import { PASOS } from "@/components/aula/ComoFunciona";
import Certificado from "@/components/aula/Certificado";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { cursoPorSlug, cursosPublicados, datosAlumno, duracion, sesionActual, type CursoCompleto } from "@/lib/cursos";
import { estadoCurso, formatoNota } from "@/lib/cursos-progreso";
import { iconoCurso } from "@/lib/logros";
import { PREMIUM_PRICE_EUR, precioEur } from "@/lib/stripe";
import PortadaCurso from "./PortadaCurso";
import TarjetaCurso from "./TarjetaCurso";
import "./catalogo.css";

/**
 * Catálogo de cursos — rehecho el 08-11-2026, a petición del admin, para que
 * lo PRIMERO que se vea debajo de la cabecera sea el listado de cursos, cada
 * uno con su progreso si el alumno ya lo empezó y el botón para entrar. Nada
 * de una portada gigante de un curso concreto: con varios cursos, eso mandaba
 * a todos al mismo.
 *
 * En la cabecera, los totales de todos los cursos juntos (cursos, módulos,
 * lecciones, exámenes y horas), que se suman solos al publicar uno nuevo.
 * Debajo del listado, lo común a todos: cómo funciona y el certificado.
 *
 * El contenido no vive aquí: cada curso es una fila de `cursos` en Supabase y
 * esta página solo lo pinta. **Todo lo que se cuenta sale de esos datos**
 * (módulos, lecciones, minutos, logro): ni una cifra de adorno. El progreso
 * sale de `estadoCurso()`, el mismo cálculo que usan el aula y la ficha.
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

const nf = (n: number) => new Intl.NumberFormat("es-ES").format(n);

// El precio sale de la misma constante que cobra Stripe: nunca a mano.
const PRECIO = precioEur(PREMIUM_PRICE_EUR);
const PRECIO_DIA = precioEur(Math.round((PREMIUM_PRICE_EUR / 30) * 100) / 100);

/**
 * Lo que incluye Premium, para el cierre de venta. Sale de la tarjeta de precio
 * de `/premium`: si cambia allí, se cambia aquí. Nada que el producto no haga.
 */
const INCLUYE = [
  "Todos los cursos, con examen y certificado, también los que se publiquen",
  "Diario de Trading con Nova",
  "Portfolio Adelin: spot y DCA en directo",
  "Insignia de Miembro Fundador en tu perfil",
];

type Sesion = Awaited<ReturnType<typeof sesionActual>>;

/**
 * Cómo lleva el alumno un curso, para la tarjeta del listado. `tramos` es el
 * relleno (0-100) de cada módulo, para la pista de la tarjeta.
 */
type Avance =
  | { tipo: "nuevo"; tramos: number[] }
  | { tipo: "empezado"; tramos: number[]; porcentaje: number; hechas: number; total: number; siguiente: string | null }
  | { tipo: "aprobado"; tramos: number[]; nota: number; cert: NonNullable<Awaited<ReturnType<typeof datosAlumno>>["certificado"]> };

/** El botón principal de un curso según quién mire y cómo lo lleva. */
function ctaDe(slug: string, sesion: Sesion, avance: Avance) {
  if (avance.tipo === "aprobado" && sesion && !sesion.esPremium) return { href: "/dashboard/certificados", texto: "Ver tu certificado" };
  // Directo al pago (10-11-2026, pedido por el admin): /api/checkout manda
  // antes al registro si no hay sesión y vuelve solo a Stripe.
  if (!sesion || !sesion.esPremium) return { href: "/api/checkout", texto: "Desbloquear con Premium", bloqueado: true };
  if (avance.tipo === "aprobado") return { href: `/aula/${slug}`, texto: "Entrar al curso" };
  if (avance.tipo === "empezado") return { href: `/aula/${slug}`, texto: "Continuar el curso" };
  return { href: `/aula/${slug}`, texto: "Empezar el curso" };
}

async function avanceDe(sesion: Sesion, curso: CursoCompleto): Promise<Avance> {
  const vacios = curso.modulos.map(() => 0);
  if (!sesion) return { tipo: "nuevo", tramos: vacios };
  const datos = await datosAlumno(sesion.userId, curso);
  if (datos.certificado) return { tipo: "aprobado", tramos: curso.modulos.map(() => 100), nota: datos.certificado.nota_final, cert: datos.certificado };
  if (!datos.inscripcion && datos.completadas.size === 0) return { tipo: "nuevo", tramos: vacios };
  const estado = estadoCurso(curso.modulos, datos.completadas, datos.intentos, { esAdmin: sesion.esAdmin });
  const tramos = estado.modulos.map((m) =>
    m.examen.tipo === "aprobado" ? 100 : m.modulo.lecciones.length ? Math.round((m.hechas / m.modulo.lecciones.length) * 100) : 0,
  );
  const sig = estado.siguiente;
  const siguiente = !sig ? null : sig.tipo === "final" ? "el examen final" : sig.tipo === "examen" ? `examen del módulo ${sig.moduloOrden}` : sig.titulo;
  return { tipo: "empezado", tramos, porcentaje: estado.porcentaje, hechas: estado.leccionesHechas, total: estado.leccionesTotales, siguiente };
}

export default async function CursosPage() {
  const [sesion, resumen] = await Promise.all([sesionActual(), cursosPublicados()]);
  const completos = (await Promise.all(resumen.map((r) => cursoPorSlug(r.slug)))).filter(
    (c): c is CursoCompleto => c !== null,
  );
  const avances = await Promise.all(completos.map((c) => avanceDe(sesion, c)));
  const muestra = completos[0] ?? null;

  // El primer curso que el alumno tiene a medias, para «Continúa donde lo dejaste».
  const iEnMarcha = avances.findIndex((a) => a.tipo === "empezado");
  const avEnMarcha = iEnMarcha >= 0 ? avances[iEnMarcha] : null;
  const enMarcha =
    avEnMarcha && avEnMarcha.tipo === "empezado"
      ? { curso: completos[iEnMarcha].curso, porcentaje: avEnMarcha.porcentaje, siguiente: avEnMarcha.siguiente }
      : null;

  // La aurora del escaparate, con los colores de todos los cursos: cambia sola
  // al publicar uno nuevo. Una mancha por curso, repartidas a lo ancho.
  const aurora = completos
    .map((c, i) => {
      const x = completos.length === 1 ? 50 : Math.round(10 + (80 * i) / (completos.length - 1));
      return `radial-gradient(45% 60% at ${x}% ${i % 2 ? 70 : 35}%, color-mix(in srgb, ${c.curso.color} 22%, transparent), transparent 70%)`;
    })
    .join(", ");

  // Los totales de TODOS los cursos publicados: se suman solos con cada curso
  // nuevo, porque salen de `cursosPublicados()`. Un examen por módulo + el final.
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

      {!muestra ? (
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
        <main className="cx-main">
          {/* ── Cabecera: título, frase y los totales de todos los cursos ── */}
          <header className="cx-cabecera">
            <div className="cx-cabecera-fondo" aria-hidden="true">
              <span className="cx-rejilla" />
              <span className="cx-halo" />
            </div>

            <nav className="cx-migas" aria-label="Migas de pan">
              <Link href="/">Inicio</Link>
              <span aria-hidden="true">/</span>
              <span>Cursos</span>
            </nav>

            <div className="cx-cabecera-fila">
              <div className="cx-cabecera-texto">
                <span className="cx-sobretitulo">
                  <GraduationCap size={15} aria-hidden="true" /> Formación con examen y certificado
                </span>
                <h1 className="cx-titulo">
                  Cursos<span className="cx-titulo-punto">.</span>
                </h1>
                <p className="cx-lead">
                  Módulo a módulo y a tu ritmo. Cada módulo se cierra con un examen y el final te da un certificado
                  verificable con tu nota.
                </p>
              </div>
              {!sesion?.esPremium ? (
                /* Sin Premium: el precio y la llamada, a la vista desde el principio. */
                <div className="cx-oferta">
                  <span className="cx-oferta-cab"><Crown size={14} aria-hidden="true" /> Todos incluidos en Premium</span>
                  <span className="cx-oferta-precio"><strong>{PRECIO}</strong>/mes · sin permanencia</span>
                  <Link href="/api/checkout" prefetch={false} className="cx-btn cx-oferta-btn">
                    Desbloquear {resumen.length === 1 ? "el curso" : `los ${nf(resumen.length)} cursos`}
                    <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
                  </Link>
                  <Link href="/premium" className="cx-oferta-enlace">Ver todo lo que incluye</Link>
                </div>
              ) : enMarcha ? (
                /* Con Premium y un curso empezado: volver a él en un clic. */
                <Link
                  href={`/aula/${enMarcha.curso.slug}`}
                  className="cx-reanudar"
                  style={{ "--cx-c": enMarcha.curso.color, "--pct": enMarcha.porcentaje } as React.CSSProperties}
                >
                  <span className="cx-reanudar-anillo" aria-hidden="true"><Play size={16} fill="currentColor" /></span>
                  <span className="cx-reanudar-texto">
                    <small>Continúa donde lo dejaste · {enMarcha.porcentaje}%</small>
                    <strong>{enMarcha.curso.titulo}</strong>
                    {enMarcha.siguiente && <span>Siguiente: {enMarcha.siguiente}</span>}
                  </span>
                  <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
                </Link>
              ) : (
                <span className="cx-pildora"><Crown size={13} aria-hidden="true" /> Incluidos en tu Premium</span>
              )}
            </div>

            <dl className="cx-cifras" aria-label="Todos los cursos juntos">
              <div>
                <dt><GraduationCap size={14} aria-hidden="true" /> {resumen.length === 1 ? "Curso" : "Cursos"}</dt>
                <dd>{nf(resumen.length)}</dd>
              </div>
              <div>
                <dt><Layers size={14} aria-hidden="true" /> Módulos</dt>
                <dd>{nf(totalModulos)}</dd>
              </div>
              <div>
                <dt><BookOpenText size={14} aria-hidden="true" /> Lecciones</dt>
                <dd>{nf(totalLecciones)}</dd>
              </div>
              <div>
                <dt><ClipboardCheck size={14} aria-hidden="true" /> Exámenes</dt>
                <dd>{nf(totalExamenes)}</dd>
              </div>
              <div>
                <dt><Clock3 size={14} aria-hidden="true" /> De contenido</dt>
                <dd>{duracion(totalMinutos)}</dd>
              </div>
            </dl>
          </header>

          {/* ── El listado, en su escaparate: una aurora con los colores de todos
               los cursos, un grano fino y un foco bajo cada tarjeta ── */}
          <div className="cx-escaparate" style={{ "--cx-aurora": aurora } as React.CSSProperties}>
          <span className="cx-escaparate-fondo" aria-hidden="true" />
          <ul className="cx-lista">
            {completos.map((c, i) => {
              const r = resumen[i];
              const avance = avances[i];
              const cta = ctaDe(c.curso.slug, sesion, avance);
              const pct = avance.tipo === "aprobado" ? 100 : avance.tipo === "empezado" ? avance.porcentaje : 0;
              return (
                <TarjetaCurso key={c.curso.slug} className={`cx-curso cx-curso--${avance.tipo}`} style={{ "--cx-c": c.curso.color } as React.CSSProperties}>
                  <span className="cx-curso-brillo" aria-hidden="true" />
                  {/* La portada: el color del curso, su sello y su número. */}
                  <div className="cx-curso-portada">
                    <PortadaCurso slug={c.curso.slug} titulo={c.curso.titulo} />
                    {avance.tipo === "aprobado" ? (
                      /* El certificado del alumno, asomando: premia al que termina. */
                      <Link href="/dashboard/certificados" className="cx-curso-cert" aria-label={`Ver tu certificado de ${c.curso.titulo}`}>
                        <Certificado
                          nombre={avance.cert.nombre}
                          curso={c.curso.titulo}
                          logro={c.curso.logro}
                          notaFinal={avance.cert.nota_final}
                          notaModulos={avance.cert.nota_modulos}
                          notaExamen={avance.cert.nota_examen}
                          fecha={avance.cert.created_at}
                          codigo={avance.cert.codigo}
                          color={c.curso.color}
                        />
                      </Link>
                    ) : sesion?.esPremium ? (
                      <span className="cx-curso-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                    ) : null}
                    {!sesion?.esPremium && avance.tipo !== "aprobado" && (
                      <span className="cx-curso-candado"><Lock size={12} strokeWidth={2.6} aria-hidden="true" /> Premium</span>
                    )}
                    <span className="cx-curso-chips">
                      <span className="cx-chip">{c.curso.nivel}</span>
                      {avance.tipo === "aprobado" && (
                        <span className="cx-chip cx-chip--ok"><Check size={12} strokeWidth={3} aria-hidden="true" /> Aprobado</span>
                      )}
                      {avance.tipo === "empezado" && <span className="cx-chip cx-chip--curso">En curso</span>}
                      {avance.tipo === "nuevo" && completos.length > 1 && i === completos.length - 1 && (
                        <span className="cx-chip cx-chip--nuevo">El más reciente</span>
                      )}
                    </span>
                  </div>

                  <div className="cx-curso-cuerpo">
                    <span className="cx-curso-sello" aria-hidden="true">{iconoCurso(c.curso.slug, 26)}</span>
                    <h2 className="cx-curso-titulo">
                      <Link href={`/cursos/${c.curso.slug}`}>{c.curso.titulo}</Link>
                    </h2>
                    {c.curso.subtitulo && <p className="cx-curso-sub">{c.curso.subtitulo}</p>}

                    <ul className="cx-curso-meta">
                      <li><Layers size={14} aria-hidden="true" /> {r?.modulos} módulos</li>
                      <li><BookOpenText size={14} aria-hidden="true" /> {r?.lecciones} lecciones</li>
                      <li><Clock3 size={14} aria-hidden="true" /> {duracion(r?.minutos ?? 0)}</li>
                    </ul>

                    {avance.tipo === "nuevo" ? (
                      /* Sin empezar: lo que se aprende, módulo a módulo. */
                      <ol className="cx-curso-temario" aria-label={`Módulos de ${c.curso.titulo}`}>
                        {c.modulos.map((m) => (
                          <li key={m.id}>
                            <span>{String(m.orden).padStart(2, "0")}</span>
                            {m.titulo}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      /* El progreso: un anillo con el porcentaje y una pista con un tramo por módulo. */
                      <div className="cx-progreso">
                        <span
                          className="cx-anillo"
                          style={{ "--pct": pct } as React.CSSProperties}
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={pct}
                          aria-label={`Progreso en ${c.curso.titulo}`}
                        >
                          <strong>{pct}%</strong>
                        </span>
                        <span className="cx-progreso-texto">
                          <strong>
                            {avance.tipo === "aprobado"
                              ? `Completado con un ${formatoNota(avance.nota)}`
                              : `${avance.hechas} de ${avance.total} lecciones`}
                          </strong>
                          <span>
                            {avance.tipo === "aprobado"
                              ? <><Award size={13} aria-hidden="true" /> Logro «{c.curso.logro}» conseguido</>
                              : avance.siguiente
                                ? `Siguiente: ${avance.siguiente}`
                                : <><Award size={13} aria-hidden="true" /> Al aprobar: certificado y logro «{c.curso.logro}»</>}
                          </span>
                          <span className="cx-tramos" aria-hidden="true">
                            {avance.tramos.map((t, k) => (
                              <i key={k}><b style={{ width: `${t}%` }} /></i>
                            ))}
                          </span>
                        </span>
                      </div>
                    )}

                    <div className="cx-curso-acciones">
                      <Link href={cta.href} prefetch={cta.href.startsWith("/api/") ? false : undefined} className="cx-btn">
                        {"bloqueado" in cta && <Lock size={15} strokeWidth={2.4} aria-hidden="true" />}
                        {cta.texto} <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
                      </Link>
                      <Link href={`/cursos/${c.curso.slug}`} className="cx-btn cx-btn--ghost">
                        Ver temario
                      </Link>
                    </div>
                  </div>
                </TarjetaCurso>
              );
            })}
          </ul>
          </div>

          {/* ── Cómo funciona ── */}
          <section className="cx-seccion">
            <header className="cx-cab">
              <span className="cx-kicker">Cómo funciona</span>
              <h2 className="cx-h2">Pensado para que termines lo que empiezas</h2>
            </header>
            <ol className="cx-pasos">
              {PASOS.map((p, i) => {
                const Icon = p.icon;
                return (
                  <li key={p.titulo} className="cx-paso">
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
          <section className="cx-seccion cx-cert" style={{ "--cx-c": muestra.curso.color } as React.CSSProperties}>
            <div className="cx-cert-texto">
              <span className="cx-kicker">La recompensa</span>
              <h2 className="cx-h2">Un certificado con tu nombre, que cualquiera puede verificar</h2>
              <p className="cx-p">
                Al aprobar el examen final de un curso recibes su certificado con la nota, un código único y una página
                pública de verificación. Se guarda en tu vitrina del panel para descargarlo en PDF siempre que quieras,
                y desbloquea el logro del curso en tu perfil.
              </p>
              <ul className="cx-cert-lista">
                <li><ShieldCheck size={16} aria-hidden="true" /> Código de verificación único</li>
                <li><Award size={16} aria-hidden="true" /> El logro de cada curso, en tu perfil</li>
                <li><GraduationCap size={16} aria-hidden="true" /> Tuyo para siempre, también si cambias de plan</li>
              </ul>
            </div>
            <div className="cx-cert-muestra" aria-hidden="true">
              <Certificado
                muestra
                nombre="Tu nombre aquí"
                curso={muestra.curso.titulo}
                logro={muestra.curso.logro}
                notaFinal={8.75}
                notaModulos={8.4}
                notaExamen={9}
                fecha={muestra.curso.updated_at}
                codigo="XXXXXXXXXX"
                color={muestra.curso.color}
              />
            </div>
          </section>

          {/* ── Cierre de venta: solo para quien aún no tiene los cursos ── */}
          {!sesion?.esPremium && (
            <section className="cx-final" aria-labelledby="cx-final-titulo">
              <span className="cx-final-glow" aria-hidden="true" />
              <div className="cx-final-texto">
                <span className="cx-pildora"><Crown size={13} aria-hidden="true" /> Un solo plan, todo incluido</span>
                <h2 id="cx-final-titulo" className="cx-final-titulo">Todos los cursos, en una sola suscripción</h2>
                <p className="cx-p">
                  Sin compras sueltas: cada curso que se publique entra en la misma suscripción que el Diario de Trading
                  y el Portfolio Adelin. Y tu precio queda fijado mientras la mantengas.
                </p>
                <ul className="cx-final-lista">
                  {INCLUYE.map((t) => (
                    <li key={t}><span className="cx-check" aria-hidden="true"><Check size={13} strokeWidth={3} /></span>{t}</li>
                  ))}
                </ul>
              </div>
              <div className="cx-final-precio">
                <span className="cx-final-sello">Premium</span>
                <div className="cx-final-importe">{PRECIO}<small>/mes</small></div>
                <p className="cx-final-dia">Unos {PRECIO_DIA} al día · sin permanencia</p>
                <Link href="/api/checkout" prefetch={false} className="cx-btn cx-btn--grande cx-final-btn">
                  <Crown size={18} aria-hidden="true" /> {sesion ? "Hazme Premium" : "Empezar ahora"}
                  <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
                </Link>
                <ul className="cx-confianza">
                  <li><CreditCard size={14} aria-hidden="true" /> Pago seguro con Stripe</li>
                  <li><Zap size={14} aria-hidden="true" /> Acceso inmediato</li>
                  <li><ShieldCheck size={14} aria-hidden="true" /> Cancela cuando quieras</li>
                </ul>
                {!sesion && (
                  <p className="cx-final-login">¿Ya tienes cuenta? <Link href="/login?next=/api/checkout">Inicia sesión</Link></p>
                )}
              </div>
            </section>
          )}

          {/* ── Barra fija en el móvil, sin Premium: el precio y el botón siempre a mano ── */}
          {!sesion?.esPremium && (
            <div className="cx-barra-movil">
              <span><strong>{PRECIO}</strong>/mes · todos los cursos</span>
              <Link href="/api/checkout" prefetch={false} className="cx-btn">
                Desbloquear <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
              </Link>
            </div>
          )}
        </main>
      )}

      <Footer />
    </div>
  );
}
