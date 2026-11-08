import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowRight, Lock, ShieldCheck, NotebookPen, BarChart3, Search,
  LineChart, CalendarRange, Crosshair, EyeOff, Trophy, Check, X,
  CreditCard, RefreshCw, Crown, Sparkles, Gauge, ListChecks, MousePointerClick, Cpu, HeartPulse, Scale,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import { ANIMOS } from "@/components/trading/tjDias";
import { VIVIR_MAX_RED, VIVIR_MIN_OPS, VIVIR_MONTHS } from "@/components/trading/tjStats";
import { PREMIUM_PRICE_EUR, precioEur } from "@/lib/stripe";
import NovaSaludo from "./NovaSaludo";
import NovaMini from "@/components/NovaMini";
import "../ficha.css";
import "./diario.css";

/**
 * Ficha pública del Diario de Trading — punto 13 del plan SEO.
 *
 * Rehecha el 08-11-2026, a petición del admin, para vender: Nova en grande en
 * la cabecera con su saludo, una sección para Nova y su pulso, otra para las
 * sensaciones, el SÚPER HITO como protagonista y la llamada a suscribirse en la
 * cabecera, en el cierre y en la barra del móvil. Lo común con la ficha del
 * Portfolio sigue en `../ficha.css`; lo propio de esta, en `./diario.css`.
 *
 * Escrita sobre lo que la herramienta hace DE VERDAD, revisado en
 * `src/components/trading/`: capital inicial, diez estadísticas, curva de
 * capital, rendimiento por periodo, calendario, desglose por par/estrategia/
 * día/hora, análisis del riesgo en múltiplos de R, sensaciones por día (ánimo y
 * nota, `tjDias.ts`), Nova con su pulso de 0 a 100 en cuatro partes y mensajes
 * priorizados (`tjNova.ts`, reglas sobre los datos, no IA), siete hitos con
 * niveles y el súper hito «Conseguiste vivir del trading» (`tjStats.ts`: sus
 * reglas salen de las mismas constantes, para que no se desincronicen).
 *
 * **Hitos, no retos.** No hay "retos" (objetivos que se aceptan o se
 * proponen): no los anuncies.
 *
 * Las maquetas (ventana del panel, mensajes de Nova, pulso, ánimos, racha del
 * súper hito) son decorativas (`aria-hidden`): el diario es de cada usuario,
 * así que no hay datos reales que enseñar. Sin rótulo de «ejemplo» por
 * decisión del admin (04-11-2026); las cifras son redondas y no se atribuyen a
 * nadie.
 */
export const metadata: Metadata = {
  title: "Diario de trading con Nova y 10 estadísticas",
  description:
    "Anota cada operación y tus sensaciones: diez estadísticas, tu curva de capital, tu riesgo y Nova, que te dice cada día lo más importante. Privado y solo tuyo.",
  alternates: { canonical: "/herramientas/diario" },
};

// El precio sale de la misma constante que cobra Stripe: nunca a mano.
const PRECIO = precioEur(PREMIUM_PRICE_EUR);
const PRECIO_DIA = precioEur(Math.round((PREMIUM_PRICE_EUR / 30) * 100) / 100);

/** Cifras de la maqueta del panel. Redondas y coherentes entre sí. */
const DEMO = {
  pl: "+1.240 $",
  plPct: "+12,4 %",
  winRate: 58,
  operaciones: 47,
  plMedio: "+26 $",
};

const DEMO_OPS = [
  { par: "BTC", dir: "Long", estrategia: "Ruptura", res: "+184 $", tono: "es-sube" },
  { par: "ETH", dir: "Short", estrategia: "Rango", res: "−62 $", tono: "es-baja" },
  { par: "SOL", dir: "Long", estrategia: "Tendencia", res: "+97 $", tono: "es-sube" },
];

/** La curva de la maqueta: puntos de un SVG de 320 × 110. */
const CURVA: [number, number][] = [
  [0, 92], [27, 86], [53, 89], [80, 74], [107, 78], [133, 64], [160, 68],
  [187, 52], [213, 57], [240, 40], [267, 44], [293, 28], [320, 18],
];
const CURVA_PUNTOS = CURVA.map(([x, y]) => `${x},${y}`).join(" ");
const [CURVA_X, CURVA_Y] = CURVA[CURVA.length - 1];

/** Circunferencia del anillo del win rate (r = 15.9, la del 100 = 100). */
const ANILLO = 2 * Math.PI * 15.9;

/** Lo que trae, en una línea, bajo el botón de la cabecera. */
const INCLUYE_CORTO = ["Nova y su pulso", "10 estadísticas", "Sensaciones", "7 hitos + el súper hito"];

/** Los mensajes de Nova de la maqueta: los tres tonos que usa (bien, aviso, dato). */
const NOVA_MENSAJES = [
  { tono: "es-bien", texto: "Riesgo bajo control: ninguna operación pasa del 2 % de la cuenta." },
  { tono: "es-aviso", texto: "Cierras las ganadoras antes de tiempo: te quedas con el 45 % del objetivo." },
  { tono: "", texto: "Racha de 4 ganadas: cuidado con subir el tamaño por euforia." },
];

const NOVA_PUNTOS = [
  { icon: Gauge, title: "Tu pulso, de 0 a 100", text: "Cómo vas ahora mismo, en cuatro partes de 25: riesgo, resultados, emociones y constancia. Desglosado, para que sepas qué mejorar." },
  { icon: ListChecks, title: "Lo importante, primero", text: "Lo urgente sale antes y destacado. Nada de leer veinte gráficos para enterarte de lo que importa." },
  { icon: MousePointerClick, title: "Consejos con botón", text: "Cuando tiene sentido, el consejo trae un botón que te lleva a hacer justo lo que propone." },
  { icon: Cpu, title: "Sin inventarse nada", text: "Reglas sobre tus propios datos, no una IA que se lo imagina: instantáneo, y siempre sobre lo que has apuntado." },
];

/** Cómo funciona, en el orden en que pasa. */
const PASOS: { icon: typeof Sparkles; nova?: boolean; title: string; text: string }[] = [
  { icon: NotebookPen, title: "Apuntas la operación", text: "Par, dirección, riesgo, resultado, por qué entraste y cómo te sentías. Un minuto." },
  { icon: BarChart3, title: "El diario hace las cuentas", text: "Diez estadísticas, tu curva de capital y tu riesgo, al día con cada operación." },
  { icon: Sparkles, nova: true, title: "Nova te lo cuenta", text: "Lo que va bien, lo que se tuerce y qué hacer, en frases cortas." },
];

/** Las diez métricas reales del panel, con lo que dicen en una línea. */
const METRICAS: [string, string][] = [
  ["P&L total", "Lo ganado o perdido en total"],
  ["Win rate", "Qué parte de tus operaciones gana"],
  ["Operaciones", "Cuántas llevas apuntadas"],
  ["P&L medio", "Lo que deja cada operación"],
  ["Ganancia media", "Cuánto ganas al acertar"],
  ["Pérdida media", "Cuánto pierdes al fallar"],
  ["Mejor operación", "Tu mayor acierto"],
  ["Peor operación", "Tu mayor pérdida"],
  ["Racha ganando", "La más larga sin fallar"],
  ["Racha perdiendo", "La mala más larga"],
];

const ADEMAS = [
  { icon: LineChart, title: "Curva de capital", text: "Desde el capital que indiques, operación a operación." },
  { icon: CalendarRange, title: "Calendario y periodos", text: "El resultado de cada día, y tu rendimiento por mes, trimestre y año." },
  {
    icon: Scale,
    title: "Tu riesgo, medido",
    text: "Qué parte de tu capital arriesgas en cada operación, tus resultados en múltiplos de R y el acierto mínimo para no perder con tu ratio.",
    termino: { texto: "múltiplos de R", href: "/glosario/r-multiplo" },
  },
  {
    icon: Crosshair,
    title: "El plan frente a lo que pasó",
    text: "Si cerraste antes o el stop-loss se deslizó, el diario mide la diferencia.",
    termino: { texto: "stop-loss", href: "/glosario/stop-loss" },
  },
  { icon: Search, title: "Dónde se te va el dinero", text: "Tu P&L desglosado por par, estrategia, día de la semana y hora." },
  { icon: EyeOff, title: "Privado de verdad", text: "Nadie más ve tus operaciones: ni otros suscriptores ni un ranking." },
];

const HITOS = [
  "Muestra fiable",
  "Disciplina de riesgo",
  "Diario con porqué",
  "Sin revancha",
  "Meses en verde",
  "Rentabilidad sobre tu capital",
  "Vuelta a máximos",
];

/** La racha de la maqueta del súper hito: 9 meses válidos (uno en rojo) y 3 por llegar. */
const RACHA: ("ok" | "red" | "pend")[] = ["ok", "ok", "ok", "red", "ok", "ok", "ok", "ok", "ok", "pend", "pend", "pend"];

const COMPARA: { otros: string; aqui: string }[] = [
  { otros: "«Voy más o menos bien»", aqui: "Tu P&L medio, en una cifra" },
  { otros: "Recuerdas los aciertos, olvidas las pérdidas", aqui: "Todas las operaciones, también las malas" },
  { otros: "Un win rate alto que no dice nada", aqui: "Win rate junto a ganancia y pérdida medias" },
  { otros: "Operas igual de nervioso que tranquilo", aqui: "Ves qué le pasa a tu dinero según tu ánimo" },
  { otros: "Nadie te avisa cuando te tuerces", aqui: "Nova te lo dice, con lo que puedes hacer" },
];

const NO_ES = [
  "No opera por ti",
  "No se conecta a ningún exchange",
  "No te dice qué comprar",
  "No importa tu histórico",
];

const FAQ = [
  {
    q: "¿Qué es Nova?",
    a: "La asistente que vive dentro del diario. Lee lo que apuntas (operaciones, sensaciones e hitos) y te cuenta lo más importante en frases cortas, con una nota de 0 a 100 de cómo vas ahora, repartida en riesgo, resultados, emociones y constancia. Son reglas sobre tus propios datos, no una IA que se inventa respuestas: no opera por ti ni te dice qué comprar.",
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
    a: "Además del súper hito, siete hitos con niveles y un aviso cada vez que subes uno. Premian cómo operas más que cuánto: arriesgar poco de forma constante, esperar después de una pérdida antes de volver a entrar, anotar el porqué o cerrar meses en verde.",
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

/** Enlaza al diccionario la primera aparición de un término dentro de un texto plano. */
function ConTermino({ text, termino }: { text: string; termino?: { texto: string; href: string } }) {
  const i = termino ? text.indexOf(termino.texto) : -1;
  if (!termino || i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <Link href={termino.href}>{termino.texto}</Link>
      {text.slice(i + termino.texto.length)}
    </>
  );
}

/** El botón principal. Quien ya es Premium abre su diario; el resto paga. */
function Cta({ premium, grande = false, texto = "Empezar mi diario" }: { premium: boolean; grande?: boolean; texto?: string }) {
  const clase = `fh-btn${grande ? " fh-btn--grande" : ""}`;
  if (premium) {
    return (
      <Link href="/dashboard/trading" className={clase}>
        Abrir mi diario
        <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
      </Link>
    );
  }
  // /api/checkout manda primero al registro si no hay sesión y vuelve solo
  // al pago (ver su ruta): un paso menos que pasar por /premium.
  return (
    <Link href="/api/checkout" prefetch={false} className={clase}>
      <Lock size={16} strokeWidth={2.4} aria-hidden="true" />
      {texto}
      <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
    </Link>
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
    <div className="blog-page">
      <div className="bg-ambient" />
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Inicio", path: "/" },
            { name: "Diario de Trading", path: "/herramientas/diario" },
          ]),
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

      <main
        className={`fh dj${isPremium ? "" : " fh--con-barra"}`}
        style={{ "--fh-acento": "#ff9a4d", "--fh-acento-2": "#ffcfa3" } as React.CSSProperties}
      >
        <nav className="fh-migas" aria-label="Migas de pan">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true">›</span>
          <span>Diario de Trading</span>
        </nav>

        {/* ── Cabecera: Nova en grande, saludando, y la llamada ── */}
        <section className="fh-hero dj-hero">
          <div className="fh-hero-texto">
            <span className="fh-eyebrow">
              <span className="fh-eyebrow-punto" aria-hidden="true" />
              El diario de trading más completo en español
            </span>

            <h1 className="fh-titulo">
              Diario de Trading
              <span>Con Nova, que lee tus números por ti.</span>
            </h1>

            <p className="fh-lead">
              Apunta cada operación y cómo te sentías. El diario calcula diez estadísticas, tu curva de capital y tu
              riesgo, y Nova te dice cada día lo más importante, en frases cortas.
            </p>

            <div className="fh-cta">
              <Cta premium={isPremium} />
              {!isPremium && (
                <p className="fh-cta-nota">
                  <ShieldCheck size={14} aria-hidden="true" />
                  {PRECIO}/mes · Sin permanencia · Cancela en 1 clic
                </p>
              )}
              {!user && (
                <p className="fh-cta-login">
                  ¿Ya eres Premium?{" "}
                  <Link href={`/login?next=${encodeURIComponent("/dashboard/trading")}`}>Inicia sesión</Link>
                </p>
              )}
            </div>

            <ul className="dj-incluye-corto">
              {INCLUYE_CORTO.map((t) => (
                <li key={t}><Check size={14} strokeWidth={2.8} aria-hidden="true" />{t}</li>
              ))}
            </ul>
          </div>

          <NovaSaludo />
        </section>

        {/* ── Nova ── */}
        <section className="fh-bloque dj-nova">
          <div className="dj-nova-texto">
            <span className="dj-kicker"><NovaMini size={22} /> Tu asistente de trading</span>
            <h2 className="fh-h2">Nova lee tu diario y te dice lo que importa</h2>
            <p className="dj-p">
              Un diario lleno de números no sirve si nadie los lee. Nova los lee por ti cada vez que apuntas algo, y
              te lo cuenta como lo haría un compañero que se fija en todo.
            </p>
            <div className="dj-nova-puntos">
              {NOVA_PUNTOS.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.title} className="dj-nova-punto">
                    <span className="dj-icono" aria-hidden="true"><Icon size={18} strokeWidth={2} /></span>
                    <div>
                      <h3>{p.title}</h3>
                      <p>{p.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="dj-nova-panel" aria-hidden="true">
            <div className="dj-nova-panel-cab">
              <span>
                <strong>Lo más importante</strong>
                <small>Hoy, según tus últimas operaciones</small>
              </span>
              <b>82<i>/100</i></b>
            </div>
            <ul className="dj-nova-mensajes">
              {NOVA_MENSAJES.map((m) => (
                <li key={m.texto} className={m.tono}>{m.texto}</li>
              ))}
            </ul>
            <span className="dj-nova-accion">Revisar mis operaciones <ArrowRight size={14} /></span>
          </div>
        </section>

        {/* ── El panel ── */}
        <section className="fh-bloque dj-panel">
          <div className="dj-centro">
            <span className="dj-kicker"><BarChart3 size={14} aria-hidden="true" /> El panel</span>
            <h2 className="fh-h2">Todo tu trading, en una pantalla</h2>
          </div>

          {/* Maqueta del panel. Decorativa: las cifras ilustran cómo se ve,
              no son de nadie. El admin pidió el 04-11-2026 no rotularla. */}
          <div className="fh-ventana-marco dj-ventana" aria-hidden="true">
            <div className="fh-ventana fh-ventana--diario">
              <div className="fh-ventana-barra">
                <span className="fh-ventana-puntos"><i /><i /><i /></span>
                <span className="fh-ventana-nombre">Mi diario de trading</span>
                <span className="fh-periodos">
                  <span>Semana</span>
                  <span className="is-activo">Mes</span>
                  <span>Año</span>
                </span>
              </div>

              <div className="fh-dj-cuerpo">
                <div className="fh-dj-kpis">
                  <div className="fh-dj-pl">
                    <span className="fh-cifra-label">P&amp;L total</span>
                    <span className="fh-dj-pl-valor es-sube">{DEMO.pl}</span>
                    <span className="fh-dj-pl-pct">{DEMO.plPct} sobre tu capital</span>
                  </div>

                  <div className="fh-dj-win">
                    <svg viewBox="0 0 36 36" className="fh-dj-anillo">
                      <circle cx="18" cy="18" r="15.9" className="fh-dj-anillo-fondo" />
                      <circle
                        cx="18" cy="18" r="15.9"
                        className="fh-dj-anillo-valor"
                        strokeDasharray={`${(ANILLO * DEMO.winRate) / 100} ${ANILLO}`}
                      />
                    </svg>
                    <span className="fh-dj-win-texto">
                      <b>{DEMO.winRate} %</b>
                      <small>Win rate</small>
                    </span>
                  </div>

                  <div className="fh-dj-mini">
                    <span><small>Operaciones</small><b>{DEMO.operaciones}</b></span>
                    <span><small>P&amp;L medio</small><b className="es-sube">{DEMO.plMedio}</b></span>
                  </div>
                </div>

                <div className="fh-dj-curva">
                  <div className="fh-dj-curva-cab">
                    <span className="fh-cifra-label">Curva de capital</span>
                    <span className="fh-dj-max">Máximo histórico</span>
                  </div>
                  <div className="fh-dj-grafica">
                    <svg viewBox="0 0 320 110" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="fh-dj-relleno" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--fh-acento)" stopOpacity="0.32" />
                          <stop offset="100%" stopColor="var(--fh-acento)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {[28, 55, 82].map((y) => (
                        <line key={y} x1="0" x2="320" y1={y} y2={y} className="fh-dj-guia" />
                      ))}
                      <polygon points={`${CURVA_PUNTOS} 320,110 0,110`} fill="url(#fh-dj-relleno)" />
                      <polyline points={CURVA_PUNTOS} className="fh-dj-linea" />
                    </svg>
                    <span
                      className="fh-dj-punto"
                      style={{ left: `${(CURVA_X / 320) * 100}%`, top: `${(CURVA_Y / 110) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="fh-dj-ops">
                  {DEMO_OPS.map((o) => (
                    <div key={o.par} className="fh-dj-op">
                      <span className="fh-dj-moneda">{o.par.slice(0, 1)}</span>
                      <span className="fh-dj-par">{o.par}<small>/USDT</small></span>
                      <span className={`fh-dj-dir ${o.dir === "Long" ? "es-long" : "es-short"}`}>{o.dir}</span>
                      <span className="fh-dj-estrategia">{o.estrategia}</span>
                      <span className={`fh-dj-res ${o.tono}`}>{o.res}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* El aviso de hito, como sale en la herramienta al subir de nivel. */}
            <div className="fh-dj-hito">
              <span className="fh-dj-hito-icono"><Trophy size={16} strokeWidth={2.2} /></span>
              <span>
                <small>Hito conseguido</small>
                <b>Disciplina de riesgo · Nivel 2</b>
              </span>
            </div>
          </div>

          <h3 className="dj-h3">Diez estadísticas que se calculan solas</h3>
          <dl className="fh-metricas">
            {METRICAS.map(([nombre, texto]) => (
              <div key={nombre} className="fh-metrica">
                <dt>{nombre}</dt>
                <dd>{texto}</dd>
              </div>
            ))}
          </dl>
          <p className="fh-nota">
            Se leen en pareja: un 58 % de acierto es malo si ganas 40 € y
            pierdes 120 €. Y tu racha perdedora por la pérdida media dice si
            tu <Link href="/glosario/tamano-de-posicion">tamaño de posición</Link> es
            demasiado grande para tu capital.
          </p>
        </section>

        {/* ── Sensaciones ── */}
        <section className="fh-bloque dj-animo">
          <div className="dj-animo-visual" aria-hidden="true">
            <span className="dj-animo-titulo">Tu dinero según tu ánimo</span>
            {ANIMOS.map((a, i) => {
              const valores = [64, 38, -22, -55];
              const v = valores[i] ?? 0;
              return (
                <div key={a.value} className="dj-animo-fila">
                  <span className="dj-animo-cara">{a.emoji}</span>
                  <span className="dj-animo-nombre">{a.label}</span>
                  <span className="dj-animo-barra">
                    <i className={v >= 0 ? "es-sube" : "es-baja"} style={{ width: `${Math.abs(v)}%` }} />
                  </span>
                  <span className={`dj-animo-valor ${v >= 0 ? "es-sube" : "es-baja"}`}>{v >= 0 ? "+" : "−"}{Math.abs(v)} $</span>
                </div>
              );
            })}
          </div>
          <div className="dj-animo-texto">
            <span className="dj-kicker"><HeartPulse size={14} aria-hidden="true" /> Sensaciones</span>
            <h2 className="fh-h2">Tus emociones, con números</h2>
            <p className="dj-p">
              Cada día apuntas cómo te sientes con un toque y, si quieres, una nota. El diario cruza tu ánimo con tus
              resultados y te enseña qué le pasa a tu dinero cuando operas eufórico, cansado o con ganas de revancha.
            </p>
            <p className="dj-p">
              Es lo que casi ningún diario mide, y la parte del trading que más dinero cuesta.
            </p>
          </div>
        </section>

        {/* ── Así funciona ── */}
        <section className="fh-bloque">
          <h2 className="fh-h2">Así funciona</h2>
          <div className="fh-dentro">
            {PASOS.map((d, i) => {
              const Icon = d.icon;
              return (
                <article key={d.title} className="fh-paso">
                  <span className="fh-paso-num" aria-hidden="true">{i + 1}</span>
                  <span className="fh-paso-icono" aria-hidden="true">
                    {d.nova ? <NovaMini size={30} /> : <Icon size={20} strokeWidth={1.9} />}
                  </span>
                  <h3>{d.title}</h3>
                  <p>{d.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── Y además ── */}
        <section className="fh-bloque">
          <h2 className="fh-h2">Y además</h2>
          <div className="fh-ademas dj-ademas">
            {ADEMAS.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.title} className="fh-extra">
                  <span className="fh-paso-icono" aria-hidden="true"><Icon size={18} strokeWidth={1.9} /></span>
                  <div>
                    <h3>{a.title}</h3>
                    <p><ConTermino text={a.text} termino={a.termino} /></p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── EL SÚPER HITO ── */}
        <section className="dj-super" aria-labelledby="dj-super-titulo">
          <span className="dj-super-rayos" aria-hidden="true" />
          <div className="dj-super-corona" aria-hidden="true">
            <span className="dj-super-medalla"><Crown size={54} strokeWidth={1.7} /></span>
          </div>
          <span className="dj-super-kicker">Súper hito · El más difícil del diario</span>
          <h2 id="dj-super-titulo" className="dj-super-titulo">Conseguiste vivir del trading</h2>
          <p className="dj-super-lead">
            Solo se consigue con <strong>un año entero de rentabilidad</strong>: doce meses cerrados seguidos operando
            de verdad, el año en beneficio y casi sin tropiezos. Un mes que no cumple y la cuenta vuelve a empezar.
            Muy pocos llegan. Quien llega, lo tiene para siempre.
          </p>

          <ul className="dj-super-reglas">
            <li><span>{VIVIR_MONTHS}</span> meses cerrados seguidos</li>
            <li><span>{VIVIR_MIN_OPS}+</span> operaciones cada mes</li>
            <li><span>{VIVIR_MAX_RED}</span> meses en rojo como mucho, y el año en beneficio</li>
          </ul>

          <div className="dj-super-racha" aria-hidden="true">
            <div className="dj-super-racha-cab">
              <span>Tu racha</span>
              <b>9 <i>de {VIVIR_MONTHS} meses</i></b>
            </div>
            <div className="dj-super-meses">
              {RACHA.map((m, i) => (
                <span key={i} className={`es-${m}`}><i /></span>
              ))}
            </div>
          </div>

          <div className="dj-super-hitos">
            <h3>Y siete hitos con niveles para el camino</h3>
            <ul>
              {HITOS.map((h) => (
                <li key={h}><Trophy size={14} strokeWidth={2} aria-hidden="true" />{h}</li>
              ))}
            </ul>
            <p>Premian cómo operas, no cuánto: ninguno se consigue operando más.</p>
          </div>

          {!isPremium && (
            <div className="dj-super-cta">
              <Cta premium={false} texto="Empezar mi racha hoy" />
            </div>
          )}
        </section>

        {/* ── Frente a lo habitual ── */}
        <section className="fh-bloque">
          <h2 className="fh-h2">Sin diario, y con él</h2>
          <div className="fh-compara">
            {COMPARA.map((c) => (
              <div key={c.aqui} className="fh-compara-fila">
                <span className="fh-compara-no"><X size={15} strokeWidth={2.6} aria-hidden="true" />{c.otros}</span>
                <span className="fh-compara-si"><Check size={15} strokeWidth={2.6} aria-hidden="true" />{c.aqui}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Qué no es ── */}
        <section className="fh-bloque fh-bloque--estrecho">
          <h2 className="fh-h2 fh-h2--peq">Para que nadie se lleve otra idea</h2>
          <ul className="fh-noes">
            {NO_ES.map((n) => <li key={n}>{n}</li>)}
          </ul>
          <p className="fh-nota">
            Las operaciones las apuntas tú, desde la próxima. El diario mira
            hacia atrás, no hacia delante: no hay señales.
          </p>
        </section>

        {/* ── Precio y llamada final ── */}
        <section className="fh-precio dj-precio" id="suscribirse">
          <div className="fh-precio-texto">
            <span className="fh-eyebrow">
              <span className="fh-eyebrow-punto" aria-hidden="true" />
              Premium · todo incluido
            </span>
            <h2 className="fh-precio-titulo">Tu mejor operación empieza por apuntar la próxima</h2>
            <ul className="fh-incluye">
              <li><Check size={16} strokeWidth={2.6} aria-hidden="true" />El Diario de Trading completo, con Nova y su pulso</li>
              <li><Check size={16} strokeWidth={2.6} aria-hidden="true" />Sensaciones, análisis del riesgo, siete hitos y el súper hito</li>
              <li><Check size={16} strokeWidth={2.6} aria-hidden="true" />El <Link href="/herramientas/portfolio">Portfolio Adelin</Link>: spot y DCA en directo</li>
              <li><Check size={16} strokeWidth={2.6} aria-hidden="true" />Todos los <Link href="/cursos">cursos</Link>, con examen y certificado</li>
            </ul>
          </div>

          <div className="fh-precio-caja">
            {isPremium ? (
              <p className="fh-precio-ya">Ya tienes acceso.</p>
            ) : (
              <>
                <p className="fh-precio-cifra">{PRECIO}<span>/mes</span></p>
                <p className="dj-precio-dia">Unos {PRECIO_DIA} al día. Menos que una mala operación.</p>
              </>
            )}
            <Cta premium={isPremium} grande />
            {!isPremium && (
              <ul className="fh-confianza">
                <li><ShieldCheck size={14} aria-hidden="true" />Sin permanencia</li>
                <li><RefreshCw size={14} aria-hidden="true" />Cancela en 1 clic</li>
                <li><CreditCard size={14} aria-hidden="true" />Pago seguro con Stripe</li>
              </ul>
            )}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="fh-bloque fh-bloque--estrecho">
          <h2 className="fh-h2">Preguntas frecuentes</h2>
          <div className="fh-faq">
            {FAQ.map((f) => (
              <details key={f.q} className="fh-faq-item">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <DisclaimerRiesgo variante="diario" />

        {!isPremium && (
          <div className="fh-barra">
            <span className="fh-barra-precio">{PRECIO}<small>/mes</small></span>
            <Link href="/api/checkout" prefetch={false} className="fh-barra-btn">
              Empezar mi diario <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
