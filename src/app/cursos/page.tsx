import type { Metadata } from "next";
import Link from "next/link";
import { Award, BookOpenText, ClipboardCheck, Clock3, GraduationCap, Layers, Play, ShieldCheck } from "lucide-react";
import Certificado from "@/components/aula/Certificado";
import Anotacion from "@/components/cuaderno/Anotacion";
import Tecla from "@/components/cuaderno/Tecla";
import TeclaPremium from "@/components/cuaderno/TeclaPremium";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import { cursoPorSlug, cursosPublicados, datosAlumno, duracion, sesionActual, type CursoCompleto, type Sesion } from "@/lib/cursos";
import { estadoCurso } from "@/lib/cursos-progreso";
import { PREMIUM_PRICE_EUR, precioEur } from "@/lib/stripe";
import { caminoDe } from "./camino";
import PasosCurso from "./PasosCurso";
import TarjetaCurso, { type Avance } from "./TarjetaCurso";
import Paginas from "@/components/cuaderno/Paginas";
import RetoFinal from "@/components/RetoFinal";
import SimboloEstudio from "@/components/cuaderno/SimboloEstudio";
import TarjetaPremium from "@/components/TarjetaPremium";
import "./cursos.css";
import "./catalogo.css";

/**
 * Catálogo de cursos, estilo «Cuaderno de estudio» (17-11-2026; color de la
 * sección: LILA). La lógica es la del 08-11-2026, que pidió el admin para
 * todos los cursos futuros (CURSOS.md §4): lo PRIMERO bajo la cabecera es el
 * listado, cada curso con su progreso si el alumno ya lo empezó y la tecla
 * para entrar. Nada de una portada gigante de un curso concreto.
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

/** Cómo lleva el alumno un curso, para su tarjeta. */
async function avanceDe(sesion: Sesion | null, c: CursoCompleto): Promise<Avance> {
  if (!sesion) return { tipo: "nuevo", camino: caminoDe(c.modulos, null, false) };
  const datos = await datosAlumno(sesion.userId, c);
  const empezado = !!datos.inscripcion || datos.completadas.size > 0 || datos.intentos.length > 0;
  const estado = empezado || datos.certificado
    ? estadoCurso(c.modulos, datos.completadas, datos.intentos, { esAdmin: sesion.esAdmin })
    : null;
  const camino = caminoDe(c.modulos, estado, !!datos.certificado);
  if (datos.certificado) return { tipo: "aprobado", camino, nota: datos.certificado.nota_final, cert: datos.certificado };
  if (!estado) return { tipo: "nuevo", camino };
  const sig = estado.siguiente;
  const siguiente = !sig ? null : sig.tipo === "final" ? "el examen final" : sig.tipo === "examen" ? `examen del módulo ${sig.moduloOrden}` : sig.titulo;
  return { tipo: "empezado", camino, porcentaje: estado.porcentaje, hechas: estado.leccionesHechas, total: estado.leccionesTotales, siguiente };
}

/** El que va segundo en /cursos, tras el más reciente (19-11-2026, pedido por el admin). */
const SEGUNDO = "analisis-tecnico-sin-humo";

export default async function CursosPage() {
  const [sesion, resumen] = await Promise.all([sesionActual(), cursosPublicados()]);
  const publicados = (await Promise.all(resumen.map((r) => cursoPorSlug(r.slug)))).filter(
    (c): c is CursoCompleto => c !== null,
  );
  // El más reciente, según el orden de publicación (antes de reordenar).
  const slugReciente = publicados.length > 1 ? publicados[publicados.length - 1].curso.slug : null;
  // El orden de la lista (19-11-2026, pedido por el admin): primero el más
  // reciente, que cambia solo al publicar otro; luego Análisis técnico sin
  // humo; y el resto, en su orden de siempre.
  const primeros = [slugReciente ?? publicados[0]?.curso.slug, SEGUNDO].filter(
    (slug, i, lista): slug is string => !!slug && lista.indexOf(slug) === i,
  );
  const completos = [
    ...primeros.map((slug) => publicados.find((c) => c.curso.slug === slug)).filter((c): c is CursoCompleto => !!c),
    ...publicados.filter((c) => !primeros.includes(c.curso.slug)),
  ];
  const avances = await Promise.all(completos.map((c) => avanceDe(sesion, c)));
  const muestra = completos[0] ?? null;

  // El primer curso que el alumno tiene a medias, para «Continúa donde lo dejaste».
  const iEnMarcha = avances.findIndex((a) => a.tipo === "empezado");
  const avEnMarcha = iEnMarcha >= 0 ? avances[iEnMarcha] : null;
  const enMarcha =
    avEnMarcha && avEnMarcha.tipo === "empezado"
      ? { curso: completos[iEnMarcha].curso, porcentaje: avEnMarcha.porcentaje, siguiente: avEnMarcha.siguiente }
      : null;

  // Los totales de TODOS los cursos publicados: se suman solos con cada curso
  // nuevo, porque salen de `cursosPublicados()`. Un examen por módulo + el final.
  const totalModulos = resumen.reduce((t, c) => t + c.modulos, 0);
  const totalLecciones = resumen.reduce((t, c) => t + c.lecciones, 0);
  const totalMinutos = resumen.reduce((t, c) => t + c.minutos, 0);
  const totalExamenes = totalModulos + resumen.length;

  // Las cifras, cada una con su color; la duración va aparte, en su franja
  // (rediseño del 19-11-2026, pedido por el admin).
  const cifras = [
    { icono: GraduationCap, etiqueta: resumen.length === 1 ? "curso" : "cursos", valor: nf(resumen.length), color: "lila" },
    { icono: Layers, etiqueta: "módulos", valor: nf(totalModulos), color: "azul" },
    { icono: BookOpenText, etiqueta: "lecciones", valor: nf(totalLecciones), color: "menta" },
    { icono: ClipboardCheck, etiqueta: "exámenes", valor: nf(totalExamenes), color: "coral" },
  ];

  return (
    <div className="blog-page cu-pagina">
      <SiteNav user={!!sesion} isPremium={sesion?.esPremium} userName={sesion?.nombre} isAdmin={sesion?.esAdmin} />

      {!muestra ? (
        <main className="cu">
          <section className="cu-vacio">
            <span className="cu-vacio-icono" aria-hidden="true"><GraduationCap size={34} strokeWidth={2} /></span>
            <h1 className="cu-h2">Los cursos están en preparación</h1>
            <p className="cu-p">
              Cuando se publique el primero aparecerá aquí. Mientras tanto, las <Link href="/guias">guías</Link> cubren
              los fundamentos y el <Link href="/glosario">diccionario</Link> explica cada término.
            </p>
          </section>
        </main>
      ) : (
        <main className="cu">
          {/* ── Cabecera: título, frase, la oferta o «sigue donde lo dejaste», y los totales ── */}
          <header className="cu-cab">
            {/* Solo en el ordenador (19-11-2026, pedido por el admin): garabatos
                de estudio y retos detrás de la cabecera: libros, un birrete,
                un lápiz, una bombilla, un trofeo, una diana y una estrella. */}
            <span className="cu-cab-garabatos" aria-hidden="true">
              <svg className="cu-cg cu-cg--libros" viewBox="0 0 80 70"><path d="M6.4 60.2c22.6-.4 45.6.3 67.8-.2M10.2 60.4c-.4-15.6.3-31.6-.2-47.2 4.6-.3 9.2.2 13.8-.1.4 15.8-.2 31.6.2 47.4M24.2 60.2c-.3-12.4.2-25-.1-37.6 4.4-.2 8.8.3 13.2 0 .3 12.6-.2 25.2.1 37.8M38.6 60.4L45.2 18.6l13.4 2.4-6.6 41.4M14.4 22.8c2-.2 4 .1 5.8-.1M28.2 32.4c2.2-.2 4.2.1 6.2-.1" /></svg>
              <svg className="cu-cg cu-cg--birrete" viewBox="0 0 40 40"><path d="M4 15l16-7 16 7-16 7zM10 18v8c5 4 15 4 20 0v-8M36 15v9" /></svg>
              <svg className="cu-cg cu-cg--lapiz" viewBox="0 0 60 60"><path d="M9.6 50.8l3.1-11.9L41.3 9.7c2.6-2.3 6.2-1.8 8.6.9 2.4 2.7 2.2 6.1-.4 8.6L21.1 47.9zM12.9 38.6c3.4.2 6.7 2.9 8.1 9.1M36.6 14.2c3.7.6 7.2 3.7 8.4 8.4" /></svg>
              <svg className="cu-cg cu-cg--bombilla" viewBox="0 0 40 40"><path d="M20 4c-7 0-12 5-12 11 0 5 3 7 5 10v4h14v-4c2-3 5-5 5-10 0-6-5-11-12-11zM15 33h10M16 37h8" /></svg>
              <svg className="cu-cg cu-cg--trofeo" viewBox="0 0 60 60"><path d="M18.4 8.6c7.8-.3 15.6.2 23.4-.1.4 9.6-2.2 19.4-11.6 22.2-9.6-2.6-12.2-12.2-11.8-22.1zM18.6 12.4c-4.4-.6-9.4.2-9.6 4.4-.2 5.2 5 7.8 10.4 8.4M41.6 12.4c4.4-.6 9.4.2 9.6 4.4.2 5.2-5 7.8-10.4 8.4M30.2 30.8c.2 4.6-.2 9.2.1 13.6M20.6 52.2c6.4-.4 12.8.2 19.2-.2-.2-2.8.1-5.4-.2-8-6.2.2-12.6-.2-18.8.1-.3 2.8.1 5.4-.2 8.1z" /></svg>
              <svg className="cu-cg cu-cg--diana" viewBox="0 0 60 60"><path d="M30.4 8.1c11.9-.5 21.6 9.4 21.2 21.4-.3 11.4-10 21.1-21.6 20.7C18.2 49.8 8.7 40.6 9.1 28.9 9.6 17.4 18.8 8.6 30.4 8.1zM30.1 19.4c5.7-.3 10.6 4.6 10.3 10.4-.3 5.4-4.9 9.9-10.4 9.6-5.5-.2-9.9-4.9-9.6-10.4.3-5.2 4.6-9.4 9.7-9.6zM30.2 29.6L50.8 9.4M45.3 8.9l5.8.3-.2 5.6" /></svg>
              <svg className="cu-cg cu-cg--estrella" viewBox="0 0 40 40"><path d="M20.3 4.6l4.2 9.8 10.7.6-8.4 7.3 2.9 10.6-9.6-5.7-9.3 5.9 2.3-10.9-8.1-7 10.8-1.2z" /></svg>
            </span>
            {/* Sin «Inicio / Cursos» (19-11-2026, pedido por el admin); con él
                se fue su JSON-LD: no se declara lo que no se ve. */}
            <div className="cu-cab-fila">
              <div className="cu-cab-texto">
                <p className="cu-nota">Formación con examen y certificado</p>
                <h1 className="cu-titulo">
                  Cursos de trading y cripto, <Anotacion tipo="underline" color="var(--lila)" retraso={300}><span className="cu-titulo-mano">módulo a módulo</span></Anotacion>
                </h1>
                <p className="cu-lead">
                  A tu ritmo. Cada módulo se cierra con un examen y el final te da un certificado verificable con tu nota.
                </p>
              </div>

              {!sesion?.esPremium ? (
                /* Sin Premium: el precio y la llamada, a la vista desde el principio. */
                <div className="cu-oferta">
                  <span className="cu-oferta-cinta" aria-hidden="true" />
                  {/* Rediseñada el 19-11-2026 (pedido por el admin): que quede
                      claro que entran todos los cursos de hoy Y los que vengan. */}
                  <span className="cu-oferta-cab">Con Premium entran</span>
                  <span className="cu-oferta-dos">
                    <span className="cu-oferta-pieza cu-oferta-pieza--hoy">
                      <b>{nf(resumen.length)}</b>
                      <small>{resumen.length === 1 ? "curso de hoy" : "cursos de hoy"}</small>
                    </span>
                    <span className="cu-oferta-mas" aria-hidden="true">+</span>
                    <span className="cu-oferta-pieza cu-oferta-pieza--futuro">
                      <b>todos</b>
                      <small>los que lleguen</small>
                    </span>
                  </span>
                  <span className="cu-oferta-mano">sin pagar nada más</span>
                  <span className="cu-oferta-precio">
                    <strong>{PRECIO}</strong>
                    <span className="cu-oferta-mes">al mes</span>
                  </span>
                  <span className="cu-oferta-dia">unos {PRECIO_DIA} al día</span>
                  <span className="cu-oferta-garantias">
                    <span>Sin permanencia</span>
                    <span>Cancelas cuando quieras</span>
                  </span>
                  <TeclaPremium ancho />
                  <Link href="/premium" className="cu-enlace">Ver todo lo que incluye</Link>
                </div>
              ) : enMarcha ? (
                /* Con Premium y un curso empezado: volver a él en un clic. */
                <div className="cu-reanudar" style={{ "--c": enMarcha.curso.color } as React.CSSProperties}>
                  <span className="cu-reanudar-nota">sigue donde lo dejaste</span>
                  <strong className="cu-reanudar-titulo">{enMarcha.curso.titulo}</strong>
                  <span
                    className="cu-barra"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={enMarcha.porcentaje}
                    aria-label={`Progreso en ${enMarcha.curso.titulo}`}
                  >
                    <i style={{ width: `${enMarcha.porcentaje}%` }} />
                  </span>
                  <span className="cu-reanudar-datos">
                    {enMarcha.porcentaje} %{enMarcha.siguiente && <> · Siguiente: {enMarcha.siguiente}</>}
                  </span>
                  <Tecla href={`/aula/${enMarcha.curso.slug}`} color="lila" ancho>
                    <Play size={15} fill="currentColor" aria-hidden="true" /> Continuar
                  </Tecla>
                </div>
              ) : (
                <span className="cu-pegatina">Incluidos en tu Premium</span>
              )}
            </div>

            {/* «Lo que hay dentro», rehecha de cero (19-11-2026, pedido por el
                admin): una ficha con contorno de rotulador; las cuatro cifras
                en su color, separadas por raya discontinua, y la duración
                total en una franja amarilla abajo. Salen de la base de datos:
                crecen solas al publicar un curso. */}
            <div className="cu-dentro">
              <p className="cu-dentro-titulo">Todo lo que hay dentro</p>
              <dl className="cu-dentro-cifras" aria-label="Todos los cursos juntos">
                {cifras.map(({ icono: Icono, etiqueta, valor, color }) => (
                  <div key={etiqueta} className={`cu-dentro-cifra cu-dentro-cifra--${color}`}>
                    <dd>{valor}</dd>
                    <dt><Icono size={14} strokeWidth={2.6} aria-hidden="true" /> {etiqueta}</dt>
                  </div>
                ))}
              </dl>
              <p className="cu-dentro-horas">
                <Clock3 size={18} strokeWidth={2.6} aria-hidden="true" />
                <strong>{duracion(totalMinutos)}</strong> de clase, a tu ritmo
              </p>
            </div>
          </header>

          {/* ── El listado: una tarjeta por curso, del mismo formato para todos ── */}
          {/* De 2 en 2, en el móvil y en el ordenador (19-11-2026,
              pedido por el admin). */}
          <Paginas claseLista="cu-lista" movil={2} pc={2} etiqueta="Páginas de cursos">
            {completos.map((c, i) => (
              <TarjetaCurso
                key={c.curso.slug}
                curso={c.curso}
                resumen={resumen.find((r) => r.slug === c.curso.slug)}
                modulos={c.modulos}
                reciente={c.curso.slug === slugReciente}
                sesion={sesion}
                avance={avances[i]}
              />
            ))}
          </Paginas>

          {/* ── El certificado, justo debajo de los cursos (19-11-2026, pedido por el admin) ── */}
          <section className="cu-seccion cu-cert" aria-labelledby="cu-cert-titulo" style={{ "--c": muestra.curso.color } as React.CSSProperties}>
            <div className="cu-cert-texto">
              <p className="cu-nota">La recompensa</p>
              <h2 id="cu-cert-titulo" className="cu-h2">
                Un certificado con <span className="cu-cert-nombre">tu nombre</span>, que <span className="fluor">cualquiera puede verificar</span>
              </h2>
              {/* El jefe final, rehecho de cero (19-11-2026, pedido por el admin):
                  el villano en el centro, con sitio arriba para su bocadillo
                  (habla al verse y al pulsarlo), y una sola frase directa. */}
              <div className="cu-cert-reto">
                {/* Garabatos de pelea detrás del jefe: rayos, espadas
                    cruzadas, un cronómetro, una interrogación y un «¡!». */}
                <span className="cu-reto-garabatos" aria-hidden="true">
                  <svg className="cu-rg cu-rg--rayo1" viewBox="0 0 40 60"><path d="M24.6 3.8L9.4 31.2l12.8.4-7.6 25.2 21-31.6-13.4-.2 9.2-21.4z" /></svg>
                  <svg className="cu-rg cu-rg--rayo2" viewBox="0 0 40 60"><path d="M24.6 3.8L9.4 31.2l12.8.4-7.6 25.2 21-31.6-13.4-.2 9.2-21.4z" /></svg>
                  <svg className="cu-rg cu-rg--espadas" viewBox="0 0 70 70"><path d="M8.4 7.6c13.2 13.6 27.4 27.2 40.6 40.4M6.2 15.8l2.4-8.4 8.6-2.2M42.4 52.6l10.2-10.4M48.6 50.2l9.8 10.2M62.2 7.8C48.8 21.4 34.6 35 21.4 48.2M64.2 15.8l-2.4-8.4-8.6-2.2M27.8 52.4L17.6 42M21.6 50l-9.8 10.2" /></svg>
                  <svg className="cu-rg cu-rg--reloj" viewBox="0 0 60 70"><path d="M30.4 16.2c11.4-.3 20.6 8.8 20.2 20.2-.4 11-9.6 20-20.6 19.6-11-.4-19.6-9.6-19.2-20.6.4-10.4 9-18.8 19.6-19.2zM30.2 24.6c.2 4.2-.1 8.2.2 12.2 3.4 1.6 6.6 3.4 9.8 5.2M24.6 6.4c3.8-.2 7.6.2 11.4-.1M30.4 6.6c-.2 3.2.1 6.4-.1 9.4M47.2 16.4l4.4-4.6" /></svg>
                  <svg className="cu-rg cu-rg--pregunta" viewBox="0 0 40 60"><path d="M9.2 17.6C8.4 9.1 15.3 4.2 21.8 5c7.4.8 11.6 7.9 8.4 14.2-2.8 5.4-9.4 7.4-10 14.6-.2 2.1.3 4.4.1 6.2M19.6 50.4c.9-.6 2.1-.4 2.4.6.3 1.2-.8 2.1-1.9 1.7-1-.4-1.2-1.6-.5-2.3z" /></svg>
                  <svg className="cu-rg cu-rg--ojo" viewBox="0 0 40 60"><path d="M14.2 6.4c.4 11.8-.2 23.6.2 35.2M14.6 51.6c.8-.6 2-.4 2.3.6.3 1.1-.8 2-1.8 1.6-1-.4-1.2-1.6-.5-2.2zM27.4 6.2c.3 11.8-.3 23.6.2 35.4M27.8 51.4c.8-.6 2-.4 2.3.6.3 1.1-.8 2-1.8 1.6-1-.4-1.2-1.6-.5-2.2z" /></svg>
                </span>
                <span className="cu-cert-mano">Jefe final</span>
                <span className="cu-cert-villano"><RetoFinal /></span>
                {/* Solo en el ordenador: la flecha a mano del jefe al certificado
                    (quitada y vuelta a poner el 19-11-2026, sin su texto). */}
                <span className="cu-cert-flecha" aria-hidden="true">
                  <SimboloEstudio tipo="flecha" color="coral" giro={-8} tamano={110} semilla={31} retraso={400} />
                </span>
                <p>
                  Vence al <strong className="cu-cert-jefe">examen final</strong> y <span className="cu-cert-tuyo">el certificado es tuyo</span>.
                </p>
              </div>
              <ul className="cu-cert-checks">
                <li className="cu-cert-check cu-cert-check--lila"><ShieldCheck size={17} strokeWidth={2.4} aria-hidden="true" /> <span><span className="cu-cert-marca cu-cert-marca--lila">Código</span> de verificación único</span></li>
                <li className="cu-cert-check cu-cert-check--amarillo"><Award size={17} strokeWidth={2.4} aria-hidden="true" /> <span>El <span className="cu-cert-marca cu-cert-marca--amarillo">logro</span> de cada curso, en tu perfil</span></li>
                <li className="cu-cert-check cu-cert-check--menta"><GraduationCap size={17} strokeWidth={2.4} aria-hidden="true" /> <span><span className="cu-cert-marca cu-cert-marca--menta">Tuyo para siempre</span>, también si cambias de plan</span></li>
              </ul>
            </div>
            <div className="cu-marco" aria-hidden="true">
              <span className="cu-cinta cu-cinta--izq" />
              <span className="cu-cinta cu-cinta--dcha" />
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

          {/* ── Cómo funciona ── */}
          <section className="cu-seccion" aria-labelledby="cu-como">
            <header className="cu-seccion-cab">
              <p className="cu-nota">Igual en todos los cursos</p>
              <h2 id="cu-como" className="cu-h2">Pensado para que <span className="cu-como-marca">termines</span> lo que <span className="cu-como-mano">empiezas</span></h2>
            </header>
            <PasosCurso />
          </section>


          {/* ── Cierre de venta: solo para quien aún no tiene los cursos. La
              tarjeta Premium del portfolio, con los cursos destacados
              (19-11-2026, pedido por el admin). ── */}
          {!sesion?.esPremium && <TarjetaPremium aqui="cursos" />}

        </main>
      )}

      <Footer />
    </div>
  );
}
