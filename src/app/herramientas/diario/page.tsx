import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  NotebookPen, BarChart3, LineChart, Lock, ArrowRight, Trophy, CalendarRange, Crosshair,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import "../detalle.css";

/**
 * Ficha pública del Diario de Trading — punto 13 del plan SEO.
 *
 * Escrita sobre lo que la herramienta hace DE VERDAD, revisado en
 * `TradingJournal.tsx` y `src/components/trading/`: capital inicial, diez
 * estadísticas, curva de capital, P&L real opcional, rendimiento por periodo,
 * calendario, desglose por par/estrategia/día/hora e hitos con niveles.
 *
 * **Hitos, no retos.** Hasta el 26-09-2026 aquí se decía que no había retos ni
 * niveles. Desde entonces hay siete hitos con niveles, y el admin decidió que
 * cumplen esa promesa. No hay "retos" (objetivos que se aceptan o se proponen):
 * no los anuncies.
 *
 * El texto le habla a quien YA opera y no lleva registro (decisión del admin),
 * y el gancho son las estadísticas, no la gamificación.
 */
export const metadata: Metadata = {
  title: "Diario de trading con 10 estadísticas",
  description:
    "Anota cada operación con su riesgo y su resultado, y descubre tu win rate, tus rachas, tu ganancia media y tu curva de capital. Privado y solo tuyo.",
  alternates: { canonical: "/herramientas/diario" },
};

/** Las diez métricas reales del panel, tal cual las calcula la herramienta. */
const METRICAS: [string, string][] = [
  ["P&L Total", "Lo que llevas ganado o perdido en total, sumando todas las operaciones registradas."],
  ["Win Rate", "El porcentaje de operaciones ganadoras. Útil, pero engañoso solo: se lee junto a la ganancia y la pérdida medias."],
  ["Operaciones", "Cuántas llevas apuntadas. Con menos de treinta, casi ninguna conclusión se sostiene."],
  ["P&L Medio", "Cuánto deja de media cada operación. Es la cifra que dice si tu método tiene ventaja."],
  ["Ganancia media", "Cuánto ganas cuando aciertas."],
  ["Pérdida media", "Cuánto pierdes cuando fallas. Comparada con la anterior te dice si tus pérdidas están controladas."],
  ["Mejor operación", "Tu mayor acierto. Si destaca demasiado sobre el resto, tu resultado depende de un golpe de suerte."],
  ["Peor operación", "Tu mayor pérdida, calculada solo entre las perdedoras. Es la que revela si alguna vez se te fue de las manos."],
  ["Mayor racha ganando", "Cuántas seguidas encadenaste sin fallar."],
  ["Mayor racha perdiendo", "La racha mala más larga. Saber que la aguantaste ayuda a no abandonar en la siguiente."],
];

const DENTRO = [
  {
    icon: BarChart3,
    title: "Diez estadísticas sobre cómo operas",
    text: "El panel completo se calcula solo a medida que apuntas: win rate, P&L medio, ganancia y pérdida medias, mejor y peor operación y tus dos rachas máximas.",
  },
  {
    icon: LineChart,
    title: "Tu curva de capital",
    text: "Partes de tu capital inicial y el diario dibuja cómo evoluciona operación a operación. Es la vista que más rápido te dice si estás mejorando o solo dando vueltas.",
  },
  {
    icon: NotebookPen,
    title: "El registro, con el porqué",
    text: "Par, dirección, riesgo asumido, ganancia esperada, resultado, estrategia y una nota. Ese porqué es lo que dentro de tres meses te dirá si el problema era el método o la disciplina.",
  },
  {
    icon: CalendarRange,
    title: "Dónde ganas y dónde pierdes",
    text: "Tu rendimiento por mes, trimestre y año, un calendario con el resultado de cada día y el desglose por par, estrategia, día de la semana y franja horaria.",
  },
  {
    icon: Crosshair,
    title: "El plan frente a lo que pasó",
    text: "Si cerraste antes del objetivo o el stop-loss se deslizó, apuntas el P&L real. El diario mide qué parte del objetivo te llevas en las ganadoras y cuánto pierdes frente al stop en las perdedoras.",
    link: { term: "stop-loss", href: "/glosario/stop-loss" },
  },
  {
    icon: Lock,
    title: "Privado de verdad",
    text: "Cada operación queda ligada a tu cuenta y no la ve nadie más: ni otros suscriptores, ni un muro público de resultados. Es tu registro.",
  },
];

/** Enlaza al diccionario la primera aparición de un término dentro de un texto plano. */
function TextoConTermino({ text, link }: { text: string; link?: { term: string; href: string } }) {
  const i = link ? text.indexOf(link.term) : -1;
  if (!link || i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <Link href={link.href}>{link.term}</Link>
      {text.slice(i + link.term.length)}
    </>
  );
}

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
    q: "¿Qué es el capital inicial y para qué sirve?",
    a: "Es el saldo desde el que arranca tu curva. Al indicarlo, el diario puede calcular tu rentabilidad en porcentaje además del resultado en dinero. Se puede cambiar cuando quieras.",
  },
  {
    q: "¿Puedo empezar de cero si me lío?",
    a: "Sí, hay opción de resetear el diario y borrar todas las operaciones registradas. Es irreversible, así que conviene estar seguro.",
  },
  {
    q: "¿Tiene niveles o recompensas?",
    a: "Tiene siete hitos con niveles, y un aviso cada vez que subes uno. Premian cómo operas más que cuánto: arriesgar poco de forma constante, esperar después de una pérdida antes de volver a entrar, anotar el porqué o cerrar meses en verde. Van incluidos en la suscripción.",
  },
];

/** Cifras de la maqueta. Redondas a propósito: ilustran, no fingen ser reales. */
const DEMO = [
  { valor: "+1.240 $", label: "P&L Total", tono: "es-verde" },
  { valor: "58 %", label: "Win Rate", tono: "" },
  { valor: "47", label: "Operaciones", tono: "" },
  { valor: "+26 $", label: "P&L Medio", tono: "es-verde" },
  { valor: "+118 $", label: "Ganancia media", tono: "es-verde" },
  { valor: "−87 $", label: "Pérdida media", tono: "es-rojo" },
];

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
            { name: "Herramientas", path: "/herramientas" },
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
        className="blog-main det-main"
        style={{ "--det-accent": "#ff9a4d", "--det-accent-2": "#ffcfa3" } as React.CSSProperties}
      >
        <div className="det-backdrop" aria-hidden="true">
          <span className="det-backdrop-grid" />
          <span className="det-orb det-orb--1" />
          <span className="det-orb det-orb--2" />
          <span className="det-orb det-orb--3" />
        </div>

        <nav className="det-breadcrumb" aria-label="Migas de pan">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true">›</span>
          <Link href="/herramientas">Herramientas</Link>
          <span aria-hidden="true">›</span>
          <span>Diario de Trading</span>
        </nav>

        {/* ── Hero ── */}
        <header className="det-hero">
          <span className="det-hero-watermark" aria-hidden="true">10</span>

          <span className="det-eyebrow">
            <span className="det-eyebrow-dot" aria-hidden="true" />
            Incluido en Premium
          </span>

          <h1 className="det-title">
            Diario de Trading
            <span className="det-title-grad">Los números, no tu memoria.</span>
          </h1>

          <p className="det-lead">
            Apuntas cada operación con su riesgo y su resultado, y el diario te
            devuelve <strong>diez estadísticas</strong> que describen cómo
            operas de verdad. Privado, solo tuyo y sin conexión a ningún
            exchange.
          </p>

          {/* Maqueta del panel. Cifras de ejemplo, declaradas como tales justo
              debajo: enseñar el producto vende, fingir datos reales engaña. */}
          <div className="det-stats" aria-hidden="true">
            {DEMO.slice(0, 4).map((d) => (
              <div key={d.label} className="det-stat">
                <span className={`det-stat-value ${d.tono}`}>{d.valor}</span>
                <span className="det-stat-label">{d.label}</span>
              </div>
            ))}
          </div>
          <p className="det-stats-nota">
            <span className="det-stats-dot" aria-hidden="true" />
            Cifras de ejemplo para ilustrar el panel. Las tuyas salen de lo que
            apuntes.
          </p>
        </header>

        <div className="det-pilares">
          <div className="det-pilar">
            <span className="det-pilar-num">01</span>
            <span className="det-pilar-title">Diez métricas, no una</span>
            <span className="det-pilar-desc">
              Win rate, medias, extremos y rachas. El win rate solo no dice casi nada.
            </span>
          </div>
          <div className="det-pilar">
            <span className="det-pilar-num">02</span>
            <span className="det-pilar-title">Curva de capital</span>
            <span className="det-pilar-desc">
              Desde el capital que tú indiques, para ver la evolución y no solo el total.
            </span>
          </div>
          <div className="det-pilar">
            <span className="det-pilar-num">03</span>
            <span className="det-pilar-title">Nadie más lo ve</span>
            <span className="det-pilar-desc">
              Ni otros suscriptores ni un ranking público. Es un registro privado.
            </span>
          </div>
        </div>

        {/* ── 01 · El problema ── */}
        <section className="det-seccion">
          <header className="det-sechead">
            <span className="det-sechead-num">01</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">Crees que sabes cómo te va</h2>
              <p className="det-sechead-sub">
                Y casi seguro que no. No por falta de atención — por cómo
                funciona la memoria.
              </p>
            </div>
          </header>

          <p className="det-p">
            La memoria guarda las operaciones buenas con todo detalle y difumina
            las malas. Por eso la sensación de «voy más o menos bien» rara vez
            coincide con el número, y por eso mucha gente lleva años operando
            sin saber si su método tiene ventaja o si simplemente ha tenido
            rachas.
          </p>

          <p className="det-destacado">
            No hace falta operar mejor para descubrir por qué pierdes. Hace
            falta apuntarlo.
          </p>

          <p className="det-p">
            Cuando anotas cuánto arriesgaste y por qué entraste, en unas semanas
            deja de haber discusión. Se ve si el problema son las entradas, si
            es que arriesgas de más en unas pocas operaciones, o si simplemente
            operas demasiado. <strong>Son tres problemas distintos y se
            arreglan de formas distintas</strong> — pero sin registro los tres
            se sienten igual.
          </p>
        </section>

        {/* ── 02 · Las diez métricas ── */}
        <section className="det-seccion det-seccion--panel">
          <header className="det-sechead">
            <span className="det-sechead-num">02</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">Las diez estadísticas, una por una</h2>
              <p className="det-sechead-sub">
                Se calculan solas a medida que apuntas. Ninguna hay que
                configurarla.
              </p>
            </div>
          </header>

          <dl className="det-columnas">
            {METRICAS.map(([nombre, texto], i) => (
              <div key={nombre} className="det-columna">
                <span className="det-columna-num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <dt>{nombre}</dt>
                <dd>{texto}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── 03 · Qué más hay ── */}
        <section className="det-seccion">
          <header className="det-sechead">
            <span className="det-sechead-num">03</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">Y además</h2>
              <p className="det-sechead-sub">
                Lo que rodea al panel: la curva, el análisis, el registro y a
                quién pertenece todo esto.
              </p>
            </div>
          </header>

          <div className="det-grid">
            {DENTRO.map((b, i) => {
              const Icon = b.icon;
              return (
                <article key={b.title} className="det-card">
                  <span className="det-card-num" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="det-card-icon" aria-hidden="true">
                    <Icon size={19} strokeWidth={1.9} />
                  </span>
                  <h3 className="det-card-title">{b.title}</h3>
                  <p className="det-card-text"><TextoConTermino text={b.text} link={b.link} /></p>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── 04 · Cómo leerlas juntas ── */}
        <section className="det-seccion det-seccion--panel">
          <header className="det-sechead">
            <span className="det-sechead-num">04</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">Las métricas se leen en pareja</h2>
              <p className="det-sechead-sub">
                Una sola cifra casi siempre miente. Estas tres combinaciones son
                las que de verdad explican un resultado.
              </p>
            </div>
          </header>

          <div className="det-anatomia">
            <div className="det-lectura">
              <span className="det-lectura-cifra">58 %</span>
              <span>
                <span className="det-lectura-title">Win rate + ganancia y pérdida medias</span>
                <span className="det-lectura-text">
                  Un 58 % de acierto es malo si ganas 40 € y pierdes 120 €. Y un
                  35 % es excelente si es al revés. El win rate solo no dice
                  nada sin el tamaño de lo que ganas y lo que pierdes.
                </span>
              </span>
            </div>

            <div className="det-lectura">
              <span className="det-lectura-cifra">+1.240 $</span>
              <span>
                <span className="det-lectura-title">P&amp;L total + mejor operación</span>
                <span className="det-lectura-text">
                  Si tu mejor operación se acerca a todo tu resultado
                  acumulado, no tienes un método: tuviste un acierto. Comparar
                  las dos cifras es la forma más rápida de detectarlo.
                </span>
              </span>
            </div>

            <div className="det-lectura">
              <span className="det-lectura-cifra es-mute">7</span>
              <span>
                <span className="det-lectura-title">Racha perdedora + pérdida media</span>
                <span className="det-lectura-text">
                  Multiplícalas y tendrás lo que tu cuenta llegó a encajar
                  seguido. Si ese número te incomoda, tu{" "}
                  <Link href="/glosario/tamano-de-posicion">tamaño de posición</Link>{" "}
                  es demasiado grande para tu capital.
                </span>
              </span>
            </div>
          </div>
        </section>

        {/* ── 05 · Qué no es ── */}
        <section className="det-seccion">
          <header className="det-sechead">
            <span className="det-sechead-num">05</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">Qué NO es</h2>
            </div>
          </header>

          <ul className="det-lista">
            <li>
              <strong>No opera por ti</strong> ni se conecta a ningún exchange.
              Las operaciones las apuntas tú, a mano.
            </li>
            <li>
              <strong>No te dice qué comprar.</strong> No hay señales ni
              sugerencias de entrada: el diario mira hacia atrás, no hacia
              delante.
            </li>
            <li>
              <strong>No importa tu histórico automáticamente.</strong> Empiezas
              desde la próxima operación, no desde tus últimos dos años.
            </li>
          </ul>
        </section>

        {/* ── 06 · Hitos ── */}
        <section className="det-seccion">
          <header className="det-sechead">
            <span className="det-sechead-num">06</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">Hitos que premian la disciplina</h2>
              <p className="det-sechead-sub">
                El problema de un diario nunca es abrirlo: es seguir
                escribiéndolo al mes siguiente.
              </p>
            </div>
          </header>

          <div className="det-lectura">
            <span className="det-lectura-cifra es-mute">
              <Trophy size={22} strokeWidth={2} aria-hidden="true" />
            </span>
            <span>
              <span className="det-lectura-title">Siete hitos con niveles</span>
              <span className="det-lectura-text">
                Cada uno sube de nivel a medida que apuntas, y te avisa cuando
                lo consigues. Ninguno premia operar más ni tener una buena
                racha: premian lo que depende de ti.
              </span>
            </span>
          </div>

          <ul className="det-lista">
            <li>
              <strong>Del proceso:</strong> muestra fiable (tus números
              empiezan a significar algo), disciplina de riesgo, diario con
              porqué y sin revancha, que cuenta las veces que esperaste una
              hora tras una pérdida antes de volver a entrar.
            </li>
            <li>
              <strong>De los resultados:</strong> meses cerrados en verde,
              rentabilidad sobre tu capital y vuelta a máximos después de una
              caída de más del 5 %.
            </li>
          </ul>
        </section>

        {/* ── 07 · FAQ ── */}
        <section className="det-seccion">
          <header className="det-sechead">
            <span className="det-sechead-num">07</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">Preguntas frecuentes</h2>
            </div>
          </header>

          <div className="det-faq">
            {FAQ.map((f) => (
              <details key={f.q} className="det-faq-item">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <DisclaimerRiesgo variante="diario" />

        {/* ── Cierre ── */}
        <section className="det-final">
          <span className="det-final-watermark" aria-hidden="true">10</span>
          <h2 className="det-final-title">Empieza por la próxima operación</h2>
          <p className="det-final-sub">
            Va incluido en la suscripción Premium, junto con el{" "}
            <Link href="/herramientas/portfolio">portfolio</Link>, el{" "}
            <Link href="/trading-en-directo">directo</Link> y el resto de{" "}
            <Link href="/herramientas">herramientas</Link>. Una sola cuota, sin
            comprar nada por separado.
          </p>
          <div className="det-actions">
            {isPremium ? (
              <Link href="/dashboard/trading" className="det-btn">
                Abrir mi diario
                <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link href="/premium" className="det-btn">
                  Ver qué incluye Premium
                  <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
                </Link>
                {!user && (
                  <Link href="/login?next=/dashboard/trading" className="det-btn det-btn--ghost">
                    Ya tengo cuenta
                  </Link>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
