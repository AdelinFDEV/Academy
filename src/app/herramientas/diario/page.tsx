import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowRight, ShieldCheck, NotebookPen, BarChart3, Search,
  LineChart, Check, X,
  Crown, Camera, HeartPulse,
  Smile, Meh, Plus, BookHeart, MapPin, Paperclip, PenLine, Image as ImageIcon,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { webAppSchema } from "@/lib/schema";
import { MILESTONES, VIVIR_MAX_RED, VIVIR_MIN_OPS, VIVIR_MONTHS } from "@/components/trading/tjStats";
import { PREMIUM_PRICE_EUR, precioEur } from "@/lib/stripe";
import Tecla from "@/components/cuaderno/Tecla";
import TeclaPremium from "@/components/cuaderno/TeclaPremium";
import TarjetaPremium from "@/components/TarjetaPremium";
import InfoSuperHito from "./InfoSuperHito";
import "../ficha.css";
import "./diario.css";

/**
 * Ficha pública del Diario de Trading — punto 13 del plan SEO.
 *
 * Hecha para vender: una hoja del diario en la cabecera, una sección para el
 * riesgo y la ejecución, otra para las sensaciones, el SÚPER HITO como
 * protagonista y la llamada a suscribirse en la cabecera, en el súper hito y en
 * el cierre (la barra fija del móvil se quitó el 17-11-2026: el admin no quiere
 * nada anclado al hacer scroll). Lo común con la ficha del Portfolio sigue en
 * `../ficha.css`; lo propio de esta, en `./diario.css`.
 *
 * Escrita sobre lo que la herramienta hace DE VERDAD, revisado en
 * `src/components/TradingJournal.tsx` y `src/components/trading/`: capital
 * inicial, diez estadísticas, curva de capital y drawdown, rendimiento por
 * periodo, calendario, desglose por par/estrategia/dirección/día/hora, riesgo
 * y ejecución en múltiplos de R (`TjAnalysis.tsx`), sensaciones por día (ánimo
 * y nota, `tjDias.ts` y `TjEmotions.tsx`), capturas de antes y después
 * (`TjCapturas.tsx`), filtros, hitos con niveles y el súper hito «Conseguiste
 * vivir del trading» (`tjStats.ts`: sus reglas salen de las mismas constantes,
 * para que no se desincronicen).
 *
 * **El diario calcula y enseña; no avisa ni interpreta.** No hay avisos,
 * consejos ni lecturas automáticas de los datos: no los anuncies.
 *
 * **Hitos, no retos.** No hay "retos" (objetivos que se aceptan o se
 * proponen): no los anuncies.
 *
 * Las maquetas (hoja, ventana del panel, riesgo y ejecución, ánimos, racha del
 * súper hito) son decorativas (`aria-hidden`): el diario es de cada usuario,
 * así que no hay datos reales que enseñar. Sin rótulo de «ejemplo» por
 * decisión del admin (04-11-2026); las cifras son redondas y no se atribuyen a
 * nadie.
 *
 * Estilo «Cuaderno de estudio» desde el 17-11-2026 (ESTILO.md): el Diario es
 * azul; Premium y el pago, naranja; los hitos, amarillo (logros). Todos los
 * botones son `<Tecla>`. Los hitos salen de `MILESTONES` (tjStats.ts): ni la
 * lista ni la cuenta se escriben a mano.
 */
// Título y descripción (10-11-2026): delante, lo que se busca.
const DESCRIPCION =
  "Diario de trading online en español: apunta cada operación y cómo te sentías, y ve tu win rate, tu curva de capital y tu riesgo calculados solos.";

export const metadata: Metadata = {
  title: "Diario de trading online: estadísticas y riesgo",
  description: DESCRIPCION,
  alternates: { canonical: "/herramientas/diario" },
};

// El precio sale de la misma constante que cobra Stripe: nunca a mano.
const PRECIO = precioEur(PREMIUM_PRICE_EUR);
const PRECIO_DIA = precioEur(Math.round((PREMIUM_PRICE_EUR / 30) * 100) / 100);

/** Los hitos con niveles, de la misma lista que usa el diario (sin el súper hito). */
const HITOS = MILESTONES.filter((m) => m.group !== "leyenda").map((m) => m.title);

/** Lo que trae, en una línea, bajo el botón de la cabecera. */
const INCLUYE_CORTO = ["10 estadísticas", "Riesgo y ejecución", "Sensaciones", `${HITOS.length} logros + el súper hito`];

/** La racha de la maqueta del súper hito: 9 meses válidos (uno en rojo) y 3 por llegar. */
const RACHA: ("ok" | "red" | "pend")[] = ["ok", "ok", "ok", "red", "ok", "ok", "ok", "ok", "ok", "pend", "pend", "pend"];

const COMPARA: { otros: string; aqui: string }[] = [
  { otros: "«Voy más o menos bien»", aqui: "Tu P&L medio, en una cifra" },
  { otros: "Recuerdas los aciertos, olvidas las pérdidas", aqui: "Todas las operaciones, también las malas" },
  { otros: "Un win rate alto que no dice nada", aqui: "Win rate junto a ganancia y pérdida medias" },
  { otros: "Operas igual de nervioso que tranquilo", aqui: "Ves qué le pasa a tu dinero según tu ánimo" },
  { otros: "No sabes si cumples tu propio plan", aqui: "Lo planeado frente a lo que pasó, medido" },
];

const NO_ES = [
  "No opera por ti",
  "No se conecta a ningún exchange",
  "No te dice qué comprar",
  "No importa tu histórico",
];

const FAQ = [
  {
    q: "¿Qué es un diario de trading?",
    a: "El registro de todas tus operaciones (qué compraste o vendiste, cuánto arriesgaste, cómo salió y por qué entraste) para medir cómo operas de verdad en vez de fiarte de la memoria. También se le llama trading journal o registro de operaciones. Sin él no sabes si ganas por método o por suerte.",
  },
  {
    q: "¿El diario de trading es gratis?",
    a: `No. Forma parte de Premium, que cuesta ${PRECIO} al mes sin permanencia e incluye también el Portfolio Adelin y todos los cursos. Lo que sí es gratis es la guía para hacer tu propio diario, con o sin esta herramienta.`,
  },
  {
    q: "¿Por qué no usar una plantilla de Excel?",
    a: "Un Excel bien llevado funciona, y es mucho mejor que no apuntar nada. La diferencia está en el trabajo. Aquí las estadísticas, la curva de capital, el riesgo en múltiplos de R y el cruce con tu ánimo se calculan solos con cada operación, sin fórmulas que mantener.",
  },
  {
    q: "¿Tengo que apuntar las operaciones a mano?",
    a: "Sí. El diario no se conecta a ningún exchange ni importa operaciones automáticamente. Es más trabajo, y también la razón de que funcione: al escribir por qué entraste te obligas a tener un motivo.",
  },
  {
    q: "¿Cuántas operaciones hacen falta para que los números signifiquen algo?",
    a: "Como referencia, por debajo de treinta casi nada es concluyente: un win rate del 70 % en diez operaciones es ruido. A partir de ahí las medias y las rachas empiezan a describir tu forma de operar.",
  },
  {
    q: "¿Qué es el súper hito?",
    a: `El reconocimiento más difícil del diario: «Conseguiste vivir del trading». Se consigue con ${VIVIR_MONTHS} meses cerrados seguidos, cada uno con ${VIVIR_MIN_OPS} o más operaciones, el año en beneficio y como mucho ${VIVIR_MAX_RED} meses en rojo. Un mes que no cumple reinicia la cuenta. Una vez conseguido, es tuyo para siempre.`,
  },
  {
    q: "¿Tiene más niveles o recompensas?",
    a: `Además del súper hito, ${HITOS.length} hitos con niveles y un aviso cada vez que subes uno. Premian cómo operas más que cuánto: arriesgar poco de forma constante, esperar después de una pérdida antes de volver a entrar, anotar el porqué o cerrar meses en verde.`,
  },
  {
    q: "¿Puedo usarlo si opero en varios mercados?",
    a: "Sí. El par lo escribes tú, así que vale para cripto, índices o lo que operes, y el diario te desglosa el P&L por par para que veas dónde ganas y dónde pierdes.",
  },
  {
    q: "¿Qué más incluye la suscripción?",
    a: `El Portfolio Adelin, mi cartera real con precios en vivo, y todos los cursos, con examen y certificado. Todo va en la misma cuota de ${PRECIO} al mes, sin permanencia: cancelas cuando quieras desde tu cuenta.`,
  },
];

function Cta({ premium, grande = false, texto = "Empezar mi diario" }: { premium: boolean; grande?: boolean; texto?: string }) {
  if (premium) {
    return (
      <Tecla href="/dashboard/trading" color="azul" tamano={grande ? "grande" : "normal"}>
        Abrir mi diario
        <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
      </Tecla>
    );
  }
  // /api/checkout manda primero al registro si no hay sesión y vuelve solo
  // al pago (ver su ruta): un paso menos que pasar por /premium.
  return (
    <TeclaPremium tamano={grande ? "grande" : "normal"}>{texto}</TeclaPremium>
  );
}

/**
 * La cabecera: el súper hito, a lo grande (19-11-2026, pedido por el admin;
 * sustituye a la hoja del diario). Una medalla dorada colgada con su cinta,
 * «Conseguiste vivir del trading», la racha de doce meses a medio camino y
 * las tres reglas. Decorativa: la racha es una maqueta (`RACHA`), no de nadie;
 * las reglas reales están en la sección del súper hito, más abajo.
 */
function SuperHitoCabecera() {
  return (
    <div className="dj-sh">
      {/* La «i»: abre la explicación exacta del logro (lo único interactivo). */}
      <InfoSuperHito meses={VIVIR_MONTHS} minOps={VIVIR_MIN_OPS} maxRojo={VIVIR_MAX_RED} />
      <div className="dj-sh-dibujo" aria-hidden="true">
      <span className="dj-sh-cinta" />
      <span className="dj-sh-medalla"><Crown size={46} strokeWidth={2} /></span>
      <span className="dj-sh-kicker">Súper hito</span>
      <span className="dj-sh-titulo">Conseguiste <span>vivir del trading</span></span>
      <span className="dj-sh-mano">el logro más difícil del diario</span>

      <span className="dj-sh-racha">
        <span className="dj-sh-racha-cab"><span>Tu racha</span><b>9 <i>de {VIVIR_MONTHS} meses</i></b></span>
        <span className="dj-sh-meses">
          {RACHA.map((m, i) => (
            <span key={i} className={`es-${m}`}>
              {m === "ok" ? <Check size={13} strokeWidth={3.4} /> : m === "red" ? <X size={12} strokeWidth={3.4} /> : null}
            </span>
          ))}
        </span>
      </span>

      <span className="dj-sh-reglas">
        <span><b>{VIVIR_MONTHS}</b> meses seguidos</span>
        <span><b>{VIVIR_MIN_OPS}+</b> operaciones al mes</span>
        <span><b>{VIVIR_MAX_RED}</b> en rojo como mucho</span>
      </span>

      <span className="dj-sh-postit">y es tuyo para siempre</span>
      </div>
    </div>
  );
}

export default async function FichaDiarioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const role = profile?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";

  return (
    <div className="blog-page fh-pagina">
      <JsonLd
        data={[
          webAppSchema({
            path: "/herramientas/diario",
            name: "Diario de Trading",
            description: DESCRIPCION,
            precioMensualEur: PREMIUM_PRICE_EUR,
          }),
          {
            "@type": "FAQPage",
            mainEntity: FAQ.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]}
      />

      <SiteNav user={!!user} isPremium={isPremium} isAdmin={role === "admin"} />

      <main className="fh fh-c-azul dj">
        {/* Sin «Inicio › Diario de Trading» (19-11-2026, pedido por el admin);
            con él se fue su JSON-LD: no se declara lo que no se ve. */}

        {/* ── Cabecera: la promesa, el botón y la hoja del diario ── */}
        <section className="fh-hero dj-hero">
          <div className="fh-hero-texto">
            {/* La cabecera, rehecha (19-11-2026, pedido por el admin): solo el
                diario de trading, vendido como uno de los más completos; el
                diario tradicional se presenta al final de la página. Pósit,
                título con su frase a mano, tres apuntes, el botón y el precio. */}
            <span className="dj-cab-posit">
              <NotebookPen size={15} strokeWidth={2.4} aria-hidden="true" />
              El diario de trading más completo en español
            </span>

            <h1 className="fh-titulo dj-cab-titulo">
              Diario de <span className="dj-cab-marca">Trading</span>
              <span className="fh-titulo-2 dj-cab-frase">
                Tú apuntas la operación. <span className="dj-cab-subraya">Él hace las cuentas.</span>
              </span>
            </h1>

            <ul className="dj-cab-apuntes">
              <li className="dj-cab-apunte dj-cab-apunte--azul">
                <span className="dj-cab-icono" aria-hidden="true"><NotebookPen size={16} strokeWidth={2.4} /></span>
                <span>Apunta cada operación <strong>y cómo te sentías</strong>.</span>
              </li>
              <li className="dj-cab-apunte dj-cab-apunte--lila">
                <span className="dj-cab-icono" aria-hidden="true"><BarChart3 size={16} strokeWidth={2.4} /></span>
                <span>Este diario de trading calcula <strong>diez estadísticas</strong>, tu curva de capital y tu riesgo.</span>
              </li>
              <li className="dj-cab-apunte dj-cab-apunte--menta">
                <span className="dj-cab-icono" aria-hidden="true"><Search size={16} strokeWidth={2.4} /></span>
                <span>Y te enseña <strong>dónde ganas y dónde pierdes</strong>.</span>
              </li>
            </ul>

            <div className="fh-cta dj-cab-cta">
              <Cta premium={isPremium} grande texto="Quiero mi diario" />
              {!isPremium && (
                <div className="dj-cab-precio">
                  <p className="dj-cab-cifra">
                    <strong>{PRECIO}</strong>
                    <span>al mes</span>
                  </p>
                  <p className="dj-cab-dia">unos {PRECIO_DIA} al día: menos que una mala operación</p>
                  <ul className="dj-cab-garantias">
                    <li><ShieldCheck size={14} strokeWidth={2.6} aria-hidden="true" /> Sin permanencia</li>
                    <li><Check size={14} strokeWidth={3} aria-hidden="true" /> Cancelas cuando quieras</li>
                  </ul>
                </div>
              )}
              {!user && (
                <p className="fh-cta-login dj-cab-login">
                  ¿Ya eres Premium?{" "}
                  <Link href={`/login?next=${encodeURIComponent("/dashboard/trading")}`}>Inicia sesión</Link>
                </p>
              )}
            </div>

            <ul className="dj-incluye-corto dj-cab-chips">
              {INCLUYE_CORTO.map((t) => (
                <li key={t}><Check size={14} strokeWidth={3} aria-hidden="true" />{t}</li>
              ))}
            </ul>
          </div>

          <SuperHitoCabecera />
        </section>

        {/* ── La respuesta, arriba (10-11-2026): quien busca «diario de trading»
            casi siempre quiere saber qué es antes que comprar. Se le contesta
            aquí en dos frases, y quien quiere aprender a llevarlo tiene la guía
            gratuita. ── */}
        <section className="fh-bloque fh-bloque--estrecho fh-papel dj-que-es">
          <p className="fh-mano">primero, lo básico</p>
          <h2 className="fh-h2">Qué es un diario de trading</h2>
          {/* Mejorada el 19-11-2026 (pedido por el admin): la definición en
              grande, lo que se apunta en cuatro etiquetas, el porqué en un
              pósit y la guía al final. Mismas palabras clave (SEO). */}
          <p className="dj-qe-def">
            Un <Link href="/glosario/diario-de-trading">diario de trading</Link> es{" "}
            <span className="dj-qe-marca">el registro de todas tus operaciones</span>:
          </p>
          <ul className="dj-qe-chips">
            <li className="dj-qe-chip dj-qe-chip--azul">qué hiciste</li>
            <li className="dj-qe-chip dj-qe-chip--coral">cuánto arriesgaste</li>
            <li className="dj-qe-chip dj-qe-chip--menta">cómo salió</li>
            <li className="dj-qe-chip dj-qe-chip--lila">por qué entraste</li>
          </ul>
          <p className="dj-qe-tambien">
            En inglés, <em>trading journal</em>; también se le llama registro de operaciones.
          </p>
          <p className="dj-qe-posit">
            Sirve para medir cómo operas <strong>de verdad</strong>: la memoria recuerda los aciertos y olvida las
            pérdidas. El diario, no.
          </p>
          <p className="dj-p dj-qe-guia">
            Puedes llevarlo en un cuaderno o en un Excel, y en la guía{" "}
            <Link href="/guias/como-hacer-un-diario-de-trading">cómo hacer un diario de trading</Link> te explico
            qué apuntar y qué cifras mirar. <strong>Este diario hace las cuentas por ti.</strong>
          </p>
        </section>

        {/* ── Los dos diarios y cómo se mezclan (19-11-2026, pedido por el
            admin; sustituye a «Sensaciones», «Así funciona» y «Y además»).
            El diario de trading y el diario tradicional, conectados: el día a
            día entero, documentado. El admin decidió presentarlos ya como
            disponibles (TAREAS.md, 00j). ── */}
        <section className="fh-bloque dj-dos" aria-labelledby="dj-dos-titulo">
          <p className="fh-mano">dos diarios, un solo cuaderno</p>
          <h2 id="dj-dos-titulo" className="fh-h2 dj-dos-h2">
            Lo que <span className="dj-dos-marca dj-dos-marca--azul">operas</span> y lo que{" "}
            <span className="dj-dos-marca dj-dos-marca--coral">vives</span>, en el mismo sitio
          </h2>
          <p className="dj-p dj-dos-lead">
            Tu día a día de trader, documentado de verdad: las operaciones con sus cifras, y lo que pasó alrededor
            de ellas. Porque cómo duermes, dónde estás y cómo te sientes también acaban en tu cuenta.
          </p>

          <div className="dj-dos-par">
            <article className="dj-dos-ficha dj-dos-ficha--trading">
              <span className="dj-dos-cinta" aria-hidden="true" />
              <span className="dj-dos-etiqueta"><NotebookPen size={15} strokeWidth={2.4} aria-hidden="true" /> Diario de trading</span>
              <h3 className="dj-dos-ficha-titulo">Las cifras de cada operación</h3>
              {/* Las cifras que más se miran, en grande (19-11-2026, pedido por
                  el admin). Ejemplo con cifras redondas: todas las calcula el
                  diario de verdad (win rate, P&L del mes, ratio, rachas). */}
              <span className="dj-dos-cifras" aria-hidden="true">
                <span className="dj-dos-cifra dj-dos-cifra--menta"><small>Win rate</small><b>58 %</b></span>
                <span className="dj-dos-cifra dj-dos-cifra--amarillo"><small>Este mes</small><b className="es-sube">+1.240 $</b></span>
                <span className="dj-dos-cifra dj-dos-cifra--lila"><small>Ratio R/B</small><b>1 : 2</b></span>
                <span className="dj-dos-cifra dj-dos-cifra--coral"><small>Racha</small><b>5 <i>ganando</i></b></span>
              </span>
              <ul className="dj-dos-lista">
                <li><BarChart3 size={16} strokeWidth={2.4} aria-hidden="true" /> Par, dirección, riesgo y resultado, en un minuto</li>
                <li><Smile size={16} strokeWidth={2.4} aria-hidden="true" /> Cómo te sentías al entrar</li>
                <li><Camera size={16} strokeWidth={2.4} aria-hidden="true" /> El gráfico de antes y el de después</li>
                <li><LineChart size={16} strokeWidth={2.4} aria-hidden="true" /> Diez estadísticas y tu curva de capital</li>
                <li><Search size={16} strokeWidth={2.4} aria-hidden="true" /> Dónde ganas y dónde pierdes</li>
              </ul>
            </article>

            <span className="dj-dos-mas" aria-hidden="true">+</span>

            <article className="dj-dos-ficha dj-dos-ficha--tradicional">
              <span className="dj-dos-cinta" aria-hidden="true" />
              <span className="dj-dos-etiqueta"><BookHeart size={15} strokeWidth={2.4} aria-hidden="true" /> Diario tradicional</span>
              <h3 className="dj-dos-ficha-titulo">Lo que pasó ese día</h3>
              <ul className="dj-dos-lista">
                <li><PenLine size={16} strokeWidth={2.4} aria-hidden="true" /> Escribe tu día, con tus palabras</li>
                <li><Paperclip size={16} strokeWidth={2.4} aria-hidden="true" /> Adjunta las operaciones de ese día</li>
                <li><HeartPulse size={16} strokeWidth={2.4} aria-hidden="true" /> Apunta cómo te sientes</li>
                <li><ImageIcon size={16} strokeWidth={2.4} aria-hidden="true" /> Añade tus fotos</li>
                <li><MapPin size={16} strokeWidth={2.4} aria-hidden="true" /> Guarda dónde estabas</li>
              </ul>
            </article>
          </div>

          {/* La página de un día: cómo quedan mezclados. Maqueta decorativa. */}
          <div className="dj-dia" aria-hidden="true">
            <span className="dj-dia-anillas"><i /><i /><i /><i /><i /></span>
            <span className="dj-dia-cab">
              <span className="dj-dia-fecha">martes</span>
              <span className="dj-dia-nota">así queda un día</span>
            </span>
            <span className="dj-dia-texto">
              Dormí poco y lo noté. Esperé a la ruptura del máximo semanal y entré con la mitad de lo normal.
            </span>
            <span className="dj-dia-op">
              <Paperclip size={15} strokeWidth={2.6} />
              <b>BTC/USDT · Long</b>
              <span>riesgo 0,5 %</span>
              <b className="es-sube">+184 $</b>
            </span>
            <span className="dj-dia-chips">
              <span className="dj-dia-chip dj-dia-chip--animo"><Meh size={14} strokeWidth={2.6} /> cansado</span>
              <span className="dj-dia-chip dj-dia-chip--lugar"><MapPin size={14} strokeWidth={2.6} /> en casa</span>
            </span>
            <span className="dj-dia-foto"><ImageIcon size={26} strokeWidth={2} /></span>
          </div>

          <ol className="dj-dos-pasos">
            <li><span className="dj-dos-num">1</span><span><b>Operas y la apuntas</b> en el diario de trading.</span></li>
            <li><span className="dj-dos-num">2</span><span><b>Escribes tu día</b> y le adjuntas esa operación.</span></li>
            <li><span className="dj-dos-num">3</span><span><b>Ves qué le pasa a tu dinero</b> según cómo vives.</span></li>
          </ol>
        </section>

        {/* ── Frente a lo habitual ── */}
        <section className="fh-bloque">
          <h2 className="fh-h2">Sin diario, y con él</h2>
          {/* En acordeón (19-11-2026, pedido por el admin): cada fila enseña
              lo de sin diario; al abrirla, lo que cambia con él. */}
          <div className="dj-sc">
            {COMPARA.map((c, i) => (
              <details key={c.aqui} className="dj-sc-item" open={i === 0}>
                <summary>
                  <span className="dj-sc-no"><X size={14} strokeWidth={3.2} aria-hidden="true" /></span>
                  <span className="dj-sc-otros">{c.otros}</span>
                  <span className="dj-sc-mas" aria-hidden="true"><Plus size={18} strokeWidth={3} /></span>
                </summary>
                <p className="dj-sc-aqui">
                  <span className="dj-sc-si"><Check size={14} strokeWidth={3.4} aria-hidden="true" /></span>
                  <span><span className="dj-sc-con">Con el diario:</span> {c.aqui}</span>
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Qué no es ── */}
        {/* Rediseñada el 19-11-2026 (pedido por el admin), como la del
            portfolio: un pósit azul con celo, lo que no es en líneas con su
            aspa a rotulador y la nota final a mano. */}
        <section className="fh-bloque dj-noes" aria-labelledby="dj-noes-titulo">
          <h2 id="dj-noes-titulo" className="dj-noes-titulo">
            Para que nadie se lleve <span className="dj-noes-mano">otra idea</span>
          </h2>
          <ul className="dj-noes-lista">
            {NO_ES.map((n) => (
              <li key={n}>
                <span className="dj-noes-aspa" aria-hidden="true"><X size={14} strokeWidth={3.4} /></span>
                {n}
              </li>
            ))}
          </ul>
          <p className="dj-noes-nota">
            Las operaciones las apuntas tú, desde la próxima. El diario mira hacia atrás, no hacia delante:
            no hay señales.
          </p>
        </section>

        {/* ── Precio y llamada final: la tarjeta Premium de toda la web
            (TarjetaPremium.tsx), con el Diario destacado (19-11-2026). ── */}
        <TarjetaPremium aqui="diario" esPremium={isPremium} accionPremium={<Cta premium grande />} />

        {/* ── FAQ ── */}
        {/* Más aire y otro aspecto (19-11-2026, pedido por el admin): nota a
            mano, título con marca y cada pregunta en una ficha de su color. */}
        <section className="fh-bloque fh-bloque--estrecho dj-faq">
          <p className="fh-mano">las dudas de siempre</p>
          <h2 className="fh-h2">Preguntas <span className="dj-faq-marca">frecuentes</span></h2>
          <div className="fh-faq">
            {FAQ.map((f, i) => (
              <details key={f.q} className="fh-faq-item">
                <summary>
                  <span className="fh-faq-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <span className="fh-faq-q">{f.q}</span>
                  <span className="fh-faq-icono" aria-hidden="true"><ArrowRight size={16} strokeWidth={3} /></span>
                </summary>
                <div className="fh-faq-respuesta"><p>{f.a}</p></div>
              </details>
            ))}
          </div>
        </section>

        {/* Sin descargo propio (19-11-2026, pedido por el admin): ya lo cubre
            el aviso de riesgo del pie de página. */}

      </main>

      <Footer />
    </div>
  );
}
