import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowRight, Lock, ShieldCheck, NotebookPen, BarChart3, Search,
  LineChart, CalendarRange, Crosshair, EyeOff, Trophy, Check, X,
  CreditCard, RefreshCw,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import "../ficha.css";

/**
 * Ficha pública del Diario de Trading — punto 13 del plan SEO.
 *
 * Rehecha el 04-11-2026 con la misma plantilla que la del Portfolio
 * (`../ficha.css`): menos texto, la herramienta a la vista y la llamada a
 * suscribirse en el hero, en el bloque de precio y en la barra de móvil.
 *
 * Escrita sobre lo que la herramienta hace DE VERDAD, revisado en
 * `TradingJournal.tsx` y `src/components/trading/`: capital inicial, diez
 * estadísticas, curva de capital, P&L real opcional, rendimiento por periodo,
 * calendario, desglose por par/estrategia/día/hora e hitos con niveles.
 *
 * **Hitos, no retos.** Hay siete hitos con niveles. No hay "retos" (objetivos
 * que se aceptan o se proponen): no los anuncies.
 *
 * La ventana del hero es una maqueta decorativa (`aria-hidden`): el diario es
 * de cada usuario, así que no hay datos reales que enseñar. Sin rótulo de
 * «ejemplo» por decisión del admin (04-11-2026); las cifras son redondas y
 * no se atribuyen a nadie.
 */
export const metadata: Metadata = {
  title: "Diario de trading con 10 estadísticas",
  description:
    "Anota cada operación con su riesgo y su resultado, y descubre tu win rate, tus rachas, tu ganancia media y tu curva de capital. Privado y solo tuyo.",
  alternates: { canonical: "/herramientas/diario" },
};

const PRECIO = "49,99 €";

/** Cifras de la maqueta del hero. Redondas y coherentes entre sí. */
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

/** Cómo funciona, en el orden en que pasa. */
const PASOS = [
  {
    icon: NotebookPen,
    title: "Apuntas la operación",
    text: "Par, dirección, riesgo, resultado y por qué entraste. Un minuto.",
  },
  {
    icon: BarChart3,
    title: "El diario hace las cuentas",
    text: "Diez estadísticas y tu curva de capital, al día con cada operación.",
  },
  {
    icon: Search,
    title: "Ves dónde se te va el dinero",
    text: "Por par, estrategia, día y hora. Sin discutir con tu memoria.",
  },
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
  {
    icon: LineChart,
    title: "Curva de capital",
    text: "Desde el capital que indiques, operación a operación.",
  },
  {
    icon: CalendarRange,
    title: "Calendario y periodos",
    text: "El resultado de cada día, y tu rendimiento por mes, trimestre y año.",
  },
  {
    icon: Crosshair,
    title: "El plan frente a lo que pasó",
    text: "Si cerraste antes o el stop-loss se deslizó, el diario mide la diferencia.",
    termino: { texto: "stop-loss", href: "/glosario/stop-loss" },
  },
  {
    icon: EyeOff,
    title: "Privado de verdad",
    text: "Nadie más ve tus operaciones: ni otros suscriptores ni un ranking.",
  },
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

const COMPARA: { otros: string; aqui: string }[] = [
  { otros: "«Voy más o menos bien»", aqui: "Tu P&L medio, en una cifra" },
  { otros: "Recuerdas los aciertos, olvidas las pérdidas", aqui: "Todas las operaciones, también las malas" },
  { otros: "Un win rate alto que no dice nada", aqui: "Win rate junto a ganancia y pérdida medias" },
];

const NO_ES = [
  "No opera por ti",
  "No se conecta a ningún exchange",
  "No te dice qué comprar",
  "No importa tu histórico",
];

const FAQ = [
  {
    q: "¿Tengo que apuntar las operaciones a mano?",
    a: "Sí. El diario no se conecta a ningún exchange ni importa operaciones automáticamente. Es más trabajo, y también la razón de que funcione: al escribir por qué entraste te obligas a tener un motivo.",
  },
  {
    q: "¿Cuántas operaciones hacen falta para que los números signifiquen algo?",
    a: "Como referencia, por debajo de treinta casi nada es concluyente: un win rate del 70 % en diez operaciones es ruido. A partir de ahí las medias y las rachas empiezan a describir tu forma de operar.",
  },
  {
    q: "¿Puedo usarlo si opero en varios mercados?",
    a: "Sí. El par lo escribes tú, así que vale para cripto, índices o lo que operes, y el diario te desglosa el P&L por par para que veas dónde ganas y dónde pierdes.",
  },
  {
    q: "¿Tiene niveles o recompensas?",
    a: "Tiene siete hitos con niveles, y un aviso cada vez que subes uno. Premian cómo operas más que cuánto: arriesgar poco de forma constante, esperar después de una pérdida antes de volver a entrar, anotar el porqué o cerrar meses en verde.",
  },
  {
    q: "¿Qué más incluye la suscripción?",
    a: `El Portfolio Adelin, mi cartera real con precios en vivo. Las dos herramientas van en la misma cuota de ${PRECIO} al mes, sin permanencia: cancelas cuando quieras desde tu cuenta.`,
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
function Cta({ premium, grande = false }: { premium: boolean; grande?: boolean }) {
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
      Empezar mi diario
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
        className={`fh${isPremium ? "" : " fh--con-barra"}`}
        style={{ "--fh-acento": "#ff9a4d", "--fh-acento-2": "#ffcfa3" } as React.CSSProperties}
      >
        <nav className="fh-migas" aria-label="Migas de pan">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true">›</span>
          <span>Diario de Trading</span>
        </nav>

        {/* ── Hero ── */}
        <section className="fh-hero">
          <div className="fh-hero-texto">
            <span className="fh-eyebrow">
              <span className="fh-eyebrow-punto" aria-hidden="true" />
              Incluido en Premium
            </span>

            <h1 className="fh-titulo">
              Diario de Trading
              <span>Los números, no tu memoria.</span>
            </h1>

            <p className="fh-lead">
              Apunta cada operación y descubre en diez estadísticas cómo operas
              de verdad. Privado y solo tuyo.
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
          </div>

          {/* Maqueta del panel. Decorativa: las cifras ilustran cómo se ve,
              no son de nadie. El admin pidió el 04-11-2026 no rotularla. */}
          <div className="fh-ventana-marco" aria-hidden="true">
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
        </section>

        {/* ── Cómo funciona ── */}
        <section className="fh-bloque">
          <h2 className="fh-h2">Así funciona</h2>
          <div className="fh-dentro">
            {PASOS.map((d, i) => {
              const Icon = d.icon;
              return (
                <article key={d.title} className="fh-paso">
                  <span className="fh-paso-num" aria-hidden="true">{i + 1}</span>
                  <span className="fh-paso-icono" aria-hidden="true"><Icon size={20} strokeWidth={1.9} /></span>
                  <h3>{d.title}</h3>
                  <p>{d.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── Las diez estadísticas ── */}
        <section className="fh-bloque">
          <h2 className="fh-h2">Diez estadísticas que se calculan solas</h2>
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

        {/* ── Y además ── */}
        <section className="fh-bloque">
          <h2 className="fh-h2">Y además</h2>
          <div className="fh-ademas">
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

        {/* ── Hitos ── */}
        <section className="fh-bloque">
          <h2 className="fh-h2">Siete hitos que premian la disciplina</h2>
          <ul className="fh-hitos">
            {HITOS.map((h) => (
              <li key={h}><Trophy size={15} strokeWidth={2} aria-hidden="true" />{h}</li>
            ))}
          </ul>
          <p className="fh-nota">
            Cada uno sube de nivel a medida que apuntas, y te avisa cuando lo
            consigues. Ninguno premia operar más: premian lo que depende de ti.
          </p>
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
        <section className="fh-precio" id="suscribirse">
          <div className="fh-precio-texto">
            <span className="fh-eyebrow">
              <span className="fh-eyebrow-punto" aria-hidden="true" />
              Premium
            </span>
            <h2 className="fh-precio-titulo">Empieza por la próxima operación</h2>
            <ul className="fh-incluye">
              <li><Check size={16} strokeWidth={2.6} aria-hidden="true" />Diario de Trading con sus diez estadísticas</li>
              <li><Check size={16} strokeWidth={2.6} aria-hidden="true" />Curva de capital, calendario y siete hitos</li>
              <li><Check size={16} strokeWidth={2.6} aria-hidden="true" />El <Link href="/herramientas/portfolio">Portfolio Adelin</Link>, en la misma cuota</li>
            </ul>
          </div>

          <div className="fh-precio-caja">
            {isPremium ? (
              <p className="fh-precio-ya">Ya tienes acceso.</p>
            ) : (
              <p className="fh-precio-cifra">{PRECIO}<span>/mes</span></p>
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
              Empezar <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
