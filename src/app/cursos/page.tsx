import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, BookOpenText, Check, ClipboardCheck, Clock3, CreditCard, GraduationCap, Layers, Play, ShieldCheck, Zap } from "lucide-react";
import Certificado from "@/components/aula/Certificado";
import Anotacion from "@/components/cuaderno/Anotacion";
import Tecla from "@/components/cuaderno/Tecla";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { cursoPorSlug, cursosPublicados, datosAlumno, duracion, sesionActual, type CursoCompleto, type Sesion } from "@/lib/cursos";
import { estadoCurso } from "@/lib/cursos-progreso";
import { PREMIUM_PRICE_EUR, precioEur } from "@/lib/stripe";
import { caminoDe } from "./camino";
import PasosCurso from "./PasosCurso";
import TarjetaCurso, { type Avance } from "./TarjetaCurso";
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

  // Los totales de TODOS los cursos publicados: se suman solos con cada curso
  // nuevo, porque salen de `cursosPublicados()`. Un examen por módulo + el final.
  const totalModulos = resumen.reduce((t, c) => t + c.modulos, 0);
  const totalLecciones = resumen.reduce((t, c) => t + c.lecciones, 0);
  const totalMinutos = resumen.reduce((t, c) => t + c.minutos, 0);
  const totalExamenes = totalModulos + resumen.length;

  const cifras = [
    { icono: GraduationCap, etiqueta: resumen.length === 1 ? "Curso" : "Cursos", valor: nf(resumen.length) },
    { icono: Layers, etiqueta: "Módulos", valor: nf(totalModulos) },
    { icono: BookOpenText, etiqueta: "Lecciones", valor: nf(totalLecciones) },
    { icono: ClipboardCheck, etiqueta: "Exámenes", valor: nf(totalExamenes) },
    { icono: Clock3, etiqueta: "De contenido", valor: duracion(totalMinutos) },
  ];

  return (
    <div className="blog-page cu-pagina">
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
            <nav className="cu-migas" aria-label="Migas de pan">
              <Link href="/">Inicio</Link>
              <span aria-hidden="true">/</span>
              <span>Cursos</span>
            </nav>

            <div className="cu-cab-fila">
              <div className="cu-cab-texto">
                <p className="cu-nota">Formación con examen y certificado</p>
                <h1 className="cu-titulo">
                  Cursos de trading y cripto, <Anotacion tipo="underline" color="var(--lila)" retraso={300}>módulo a módulo</Anotacion>
                </h1>
                <p className="cu-lead">
                  A tu ritmo. Cada módulo se cierra con un examen y el final te da un certificado verificable con tu nota.
                </p>
              </div>

              {!sesion?.esPremium ? (
                /* Sin Premium: el precio y la llamada, a la vista desde el principio. */
                <div className="cu-oferta">
                  <span className="cu-oferta-cinta" aria-hidden="true" />
                  <span className="cu-oferta-cab">Todos incluidos en Premium</span>
                  <span className="cu-oferta-precio"><strong>{PRECIO}</strong>/mes</span>
                  <span className="cu-oferta-nota">sin permanencia</span>
                  <Tecla href="/api/checkout" prefetch={false} ancho>
                    Desbloquear {resumen.length === 1 ? "el curso" : `los ${nf(resumen.length)} cursos`}
                  </Tecla>
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

            <dl className="cu-cifras" aria-label="Todos los cursos juntos">
              {cifras.map(({ icono: Icono, etiqueta, valor }) => (
                <div key={etiqueta}>
                  <dt><Icono size={15} strokeWidth={2.4} aria-hidden="true" /> {etiqueta}</dt>
                  <dd>{valor}</dd>
                </div>
              ))}
            </dl>
          </header>

          {/* ── El listado: una tarjeta por curso, del mismo formato para todos ── */}
          <ul className="cu-lista">
            {completos.map((c, i) => (
              <TarjetaCurso
                key={c.curso.slug}
                curso={c.curso}
                resumen={resumen.find((r) => r.slug === c.curso.slug)}
                modulos={c.modulos}
                numero={i + 1}
                reciente={completos.length > 1 && i === completos.length - 1}
                sesion={sesion}
                avance={avances[i]}
              />
            ))}
          </ul>

          {/* ── Cómo funciona ── */}
          <section className="cu-seccion" aria-labelledby="cu-como">
            <header className="cu-seccion-cab">
              <p className="cu-nota">Igual en todos los cursos</p>
              <h2 id="cu-como" className="cu-h2">Pensado para que termines lo que empiezas</h2>
            </header>
            <PasosCurso />
          </section>

          {/* ── El certificado ── */}
          <section className="cu-seccion cu-cert" aria-labelledby="cu-cert-titulo" style={{ "--c": muestra.curso.color } as React.CSSProperties}>
            <div className="cu-cert-texto">
              <p className="cu-nota">La recompensa</p>
              <h2 id="cu-cert-titulo" className="cu-h2">
                Un certificado con tu nombre, que <span className="fluor">cualquiera puede verificar</span>
              </h2>
              <p className="cu-p">
                Al aprobar el examen final de un curso recibes su certificado con la nota, un código único y una página
                pública de verificación. Se guarda en tu vitrina del panel para descargarlo en PDF siempre que quieras,
                y desbloquea el logro del curso en tu perfil.
              </p>
              <ul className="cu-lista-check">
                <li><span className="cu-ic cu-ic--lila" aria-hidden="true"><ShieldCheck size={17} strokeWidth={2.4} /></span> Código de verificación único</li>
                <li><span className="cu-ic cu-ic--amarillo" aria-hidden="true"><Award size={17} strokeWidth={2.4} /></span> El logro de cada curso, en tu perfil</li>
                <li><span className="cu-ic cu-ic--menta" aria-hidden="true"><GraduationCap size={17} strokeWidth={2.4} /></span> Tuyo para siempre, también si cambias de plan</li>
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

          {/* ── Cierre de venta: solo para quien aún no tiene los cursos. Premium
               cierra en un bloque de tinta (ESTILO.md). ── */}
          {!sesion?.esPremium && (
            <section className="cu-premium" aria-labelledby="cu-premium-titulo">
              <div className="cu-premium-texto">
                <p className="cu-premium-nota">Un solo plan, todo incluido</p>
                <h2 id="cu-premium-titulo" className="cu-premium-titulo">Todos los cursos, en una sola suscripción</h2>
                <p className="cu-premium-p">
                  Sin compras sueltas: cada curso que se publique entra en la misma suscripción que el Diario de Trading
                  y el Portfolio Adelin. Y tu precio queda fijado mientras la mantengas.
                </p>
                <ul className="cu-premium-lista">
                  {INCLUYE.map((t) => (
                    <li key={t}><span className="cu-premium-check" aria-hidden="true"><Check size={14} strokeWidth={3.4} /></span>{t}</li>
                  ))}
                </ul>
              </div>
              <div className="cu-premium-precio">
                <span className="cu-premium-sello">Premium</span>
                <div className="cu-premium-importe">{PRECIO}<small>/mes</small></div>
                <p className="cu-premium-dia">Unos {PRECIO_DIA} al día · sin permanencia</p>
                <Tecla href="/api/checkout" prefetch={false} tamano="grande" ancho>
                  {sesion ? "Hazme Premium" : "Empezar ahora"}
                  <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
                </Tecla>
                <ul className="cu-premium-confianza">
                  <li><CreditCard size={14} aria-hidden="true" /> Pago seguro con Stripe</li>
                  <li><Zap size={14} aria-hidden="true" /> Acceso inmediato</li>
                  <li><ShieldCheck size={14} aria-hidden="true" /> Cancela cuando quieras</li>
                </ul>
                {!sesion && (
                  <p className="cu-premium-login">¿Ya tienes cuenta? <Link href="/login?next=/api/checkout">Inicia sesión</Link></p>
                )}
              </div>
            </section>
          )}

        </main>
      )}

      <Footer />
    </div>
  );
}
