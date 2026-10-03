import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Wallet, LineChart, PieChart, TrendingUp, ArrowRight } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import { resumenPortfolioPublico, MOSTRAR_IMPORTES } from "@/lib/portfolio-publico";
import "../detalle.css";

/**
 * Ficha pública del Portfolio Adelin — punto 13 del plan SEO.
 *
 * La herramienta vive en `/portfolio` y exige suscripción, así que Google solo
 * veía el salto a `/premium`. Esta página explica qué hay dentro sin abrir
 * nada, y **enseña una parte real**: las cifras agregadas de la cartera, en
 * vivo, que es lo único que prueba que existe.
 *
 * El contenido está escrito sobre lo que la herramienta hace DE VERDAD —las
 * cuatro métricas del panel y las ocho columnas de la tabla de
 * `PortfolioClient`—, no sobre una descripción genérica. Si cambian esas
 * columnas, este texto hay que revisarlo.
 */
export const metadata: Metadata = {
  title: "Portfolio real de cripto, posición a posición",
  description:
    "Qué compré este ciclo, a qué precio entré y cuánto lleva cada moneda, con precios en vivo. La cartera entera, también las posiciones que van en pérdidas.",
  alternates: { canonical: "/herramientas/portfolio" },
};

const PILARES = [
  {
    num: "01",
    title: "La cartera entera",
    desc: "No una selección de aciertos: todas las posiciones, incluidas las que van en rojo.",
  },
  {
    num: "02",
    title: "Precio de entrada real",
    desc: "El precio al que se ejecutó cada compra, no una franja aproximada ni «entré por aquí».",
  },
  {
    num: "03",
    title: "Valoración en vivo",
    desc: "Cada posición se revaloriza con el precio de mercado del momento en que abres la página.",
  },
];

/** Las cuatro métricas del panel superior, tal cual las calcula la herramienta. */
const RESUMEN = [
  {
    icon: Wallet,
    label: "Invertido",
    text: "La suma de todas las compras a su precio de entrada. Es el dinero que salió de la cuenta, no lo que vale hoy.",
  },
  {
    icon: TrendingUp,
    label: "Valor actual",
    text: "Lo que valdría la cartera si se vendiera ahora mismo, con el precio de mercado de cada moneda en este instante.",
  },
  {
    icon: LineChart,
    label: "P&L total",
    text: "La diferencia entre lo anterior y lo invertido, en dólares. En verde si gana y en rojo si pierde — y se enseña igual en los dos casos.",
  },
  {
    icon: PieChart,
    label: "Rentabilidad",
    text: "Ese mismo resultado en porcentaje, que es lo comparable. «He ganado 3.000 dólares» no dice nada sin saber sobre cuánto.",
  },
];

const COLUMNAS: [string, string][] = [
  ["Coin", "La moneda con su símbolo. Sin abreviaturas ni apodos: el activo exacto que compré."],
  ["Cantidad", "Cuántas unidades. Junto al precio de entrada permite reconstruir la operación completa."],
  ["Precio de compra", "El precio al que se ejecutó. Es lo único con lo que puedes juzgar si la entrada tenía sentido cuando se tomó."],
  ["Invertido", "Cantidad por precio de compra: lo que arriesgué en esa posición concreta."],
  ["Precio actual", "Cotización en vivo, no una captura de hace semanas."],
  ["Valor actual", "Lo que vale hoy esa posición."],
  ["P&L", "Ganancia o pérdida de la posición, en dólares y en porcentaje, uno al lado del otro."],
  ["Variación 24 h", "Cuánto se ha movido la moneda en el último día, para leer el momento sin salir de la página."],
];

const LECTURAS = [
  {
    cifra: "+30 %",
    title: "El P&L en porcentaje dice si la decisión fue buena",
    text: "Es lo comparable entre monedas y entre operaciones. Una entrada que sube un 30 % fue una buena entrada, pese al tamaño que tuviera.",
    mute: false,
  },
  {
    cifra: "+120 $",
    title: "El P&L en dólares dice cuánto importa esa decisión",
    text: "Un +30 % sobre una posición diminuta es una anécdota. Esta es la lectura que menos se mira y la que más explica por qué dos carteras con el mismo acierto acaban muy distintas.",
    mute: false,
  },
  {
    cifra: "−2,1 %",
    title: "La variación de 24 h no dice nada de la decisión",
    text: "Es ruido del día. Sirve para saber en qué momento estás mirando la cartera, no para juzgar si la posición estaba bien tomada.",
    mute: true,
  },
];

const FAQ = [
  {
    q: "¿Es tu cartera de verdad o una demostración?",
    a: "Es la cartera real con la que opero en spot. Se actualiza cuando la muevo, y las posiciones que van en pérdidas se ven igual que las que van en ganancias. Arriba de esta página están las cifras agregadas en vivo, calculadas con los precios de mercado del momento en que la abres.",
  },
  {
    q: "¿Me vais a avisar cuando compres o vendas?",
    a: "No. No es un servicio de señales ni hay alertas: la herramienta refleja el estado de la cartera, no manda avisos para copiar operaciones.",
  },
  {
    q: "¿Se conecta a mi exchange?",
    a: "No. No se conecta a ninguna cuenta ni ejecuta nada. Es información para consultar, no una herramienta que opere por ti.",
  },
  {
    q: "¿Puedo copiar la cartera tal cual?",
    a: "Puedes, pero es mala idea y no es lo que se ofrece. El peso de cada posición está pensado para un capital, un horizonte y una tolerancia a la pérdida que son míos. Copiar los porcentajes de otro sin eso es la parte fácil y la que menos ayuda.",
  },
  {
    q: "¿Incluye el trading apalancado?",
    a: "No. Aquí solo hay compras en spot. La operativa con futuros se ve en Trading en Directo, que es otra herramienta.",
  },
  {
    q: "¿Cada cuánto se actualiza?",
    a: "Los precios, cada vez que abres la página. Las posiciones, cuando compro o vendo de verdad.",
  },
];

function pct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1).replace(".", ",")} %`;
}

function usd(n: number): string {
  return `${Math.round(n).toLocaleString("es-ES")} $`;
}

export default async function FichaPortfolioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const role = profile?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";

  const resumen = await resumenPortfolioPublico();

  return (
    <div className="blog-page">
      <div className="bg-ambient" />
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Inicio", path: "/" },
            { name: "Herramientas", path: "/herramientas" },
            { name: "Portfolio Adelin", path: "/herramientas/portfolio" },
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

      <main className="blog-main det-main" style={{ "--det-accent": "#4f9dff", "--det-accent-2": "#a8c9ff" } as React.CSSProperties}>
        {/* Fondo técnico: rejilla y orbes a la deriva. Sin esto la página es
            texto sobre un color plano, que es lo que la hacía parecer un blog. */}
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
          <span>Portfolio Adelin</span>
        </nav>

        {/* ── Hero ── */}
        <header className="det-hero">
          <span className="det-hero-watermark" aria-hidden="true">P&amp;L</span>

          <span className="det-eyebrow">
            <span className="det-eyebrow-dot" aria-hidden="true" />
            Incluido en Premium
          </span>

          <h1 className="det-title">
            Portfolio Adelin
            <span className="det-title-grad">La cartera, sin recortes.</span>
          </h1>

          <p className="det-lead">
            Qué compré este ciclo, a qué precio entré y cuánto lleva ganado o
            perdido cada moneda. Con precios en vivo y con las posiciones que
            van mal a la vista.
          </p>

          {/* Cifras reales, calculadas en el servidor para que estén en el HTML
              y las lea también Google. Nunca por posición: qué monedas y a qué
              precio es justo lo que se paga. Si el cálculo falla, no se pinta —
              antes nada que una rentabilidad equivocada. */}
          {resumen && (
            <>
              <div className="det-stats">
                <div className="det-stat">
                  <span className={`det-stat-value ${resumen.rentabilidadPct >= 0 ? "es-verde" : "es-rojo"}`}>
                    {pct(resumen.rentabilidadPct)}
                  </span>
                  <span className="det-stat-label">Rentabilidad</span>
                </div>
                <div className="det-stat">
                  <span className="det-stat-value">{resumen.posiciones}</span>
                  <span className="det-stat-label">Posiciones abiertas</span>
                </div>
                {resumen.desdeAnio && (
                  <div className="det-stat">
                    <span className="det-stat-value">{resumen.desdeAnio}</span>
                    <span className="det-stat-label">Publicando desde</span>
                  </div>
                )}
                {MOSTRAR_IMPORTES && (
                  <div className="det-stat">
                    <span className="det-stat-value">{usd(resumen.invertido)}</span>
                    <span className="det-stat-label">Invertido</span>
                  </div>
                )}
              </div>
              {/* El DCA va en su propia línea, no sumado al spot: son dos
                  estrategias distintas y una media entre ambas no describiría
                  a ninguna. Aquí tampoco se enseña ni una compra suelta. */}
              {resumen.dca && (
                <div className="det-stats">
                  <div className="det-stat">
                    <span className={`det-stat-value ${resumen.dca.rentabilidadPct >= 0 ? "es-verde" : "es-rojo"}`}>
                      {pct(resumen.dca.rentabilidadPct)}
                    </span>
                    <span className="det-stat-label">DCA de Bitcoin</span>
                  </div>
                  <div className="det-stat">
                    <span className="det-stat-value">{resumen.dca.compras}</span>
                    <span className="det-stat-label">Aportaciones seguidas</span>
                  </div>
                  {resumen.dca.desdeAnio && (
                    <div className="det-stat">
                      <span className="det-stat-value">{resumen.dca.desdeAnio}</span>
                      <span className="det-stat-label">Comprando BTC desde</span>
                    </div>
                  )}
                  {MOSTRAR_IMPORTES && (
                    <div className="det-stat">
                      <span className="det-stat-value">{usd(resumen.dca.precioMedio)}</span>
                      <span className="det-stat-label">Precio medio de entrada</span>
                    </div>
                  )}
                </div>
              )}

              <p className="det-stats-nota">
                <span className="det-stats-dot" aria-hidden="true" />
                Cifras reales, calculadas al abrir esta página. Si la
                rentabilidad fuera negativa, aparecería igual.
              </p>
            </>
          )}
        </header>

        <div className="det-pilares">
          {PILARES.map((p) => (
            <div key={p.num} className="det-pilar">
              <span className="det-pilar-num">{p.num}</span>
              <span className="det-pilar-title">{p.title}</span>
              <span className="det-pilar-desc">{p.desc}</span>
            </div>
          ))}
        </div>

        {/* ── 01 · El problema ── */}
        <section className="det-seccion">
          <header className="det-sechead">
            <span className="det-sechead-num">01</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">El problema que resuelve</h2>
              <p className="det-sechead-sub">
                Por qué una captura de pantalla no demuestra absolutamente nada.
              </p>
            </div>
          </header>

          <p className="det-p">
            En cripto es fácil parecer buenísimo: basta con enseñar las
            operaciones que salieron bien y callarse el resto. Una captura no
            desmiente nada — no lleva fecha verificable, no dice a qué precio se
            entró y, sobre todo, <strong>no dice cuánto pesaba esa posición en
            la cartera</strong>.
          </p>

          <p className="det-destacado">
            Acertar con el 2 % del capital y acertar con el 40 % se enseñan
            igual de bien en una foto. No tienen nada que ver.
          </p>

          <p className="det-p">
            Esta herramienta quita la ambigüedad por el método más simple:
            publicar la cartera <strong>entera</strong>, con las posiciones
            buenas y las malas, el precio de entrada de cada una y su peso sobre
            el total. Si me equivoco, se ve — y ese es justamente el punto.
          </p>
        </section>

        {/* ── 02 · El panel ── */}
        <section className="det-seccion det-seccion--panel">
          <header className="det-sechead">
            <span className="det-sechead-num">02</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">Lo primero que ves: el estado de la cartera</h2>
              <p className="det-sechead-sub">
                Cuatro cifras que responden a «¿cómo va esto?» sin tener que
                leer la tabla.
              </p>
            </div>
          </header>

          <div className="det-grid">
            {RESUMEN.map((m, i) => {
              const Icon = m.icon;
              return (
                <article key={m.label} className="det-card">
                  <span className="det-card-num" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="det-card-icon" aria-hidden="true">
                    <Icon size={19} strokeWidth={1.9} />
                  </span>
                  <h3 className="det-card-title">{m.label}</h3>
                  <p className="det-card-text">{m.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── 03 · La tabla ── */}
        <section className="det-seccion">
          <header className="det-sechead">
            <span className="det-sechead-num">03</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">Y debajo, cada posición con ocho datos</h2>
              <p className="det-sechead-sub">
                La tabla es el corazón de la herramienta. Cada fila es una
                compra real y cada columna está para que puedas reconstruirla.
              </p>
            </div>
          </header>

          <dl className="det-columnas">
            {COLUMNAS.map(([nombre, texto], i) => (
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

        {/* ── 04 · Cómo se lee ── */}
        <section className="det-seccion det-seccion--panel">
          <header className="det-sechead">
            <span className="det-sechead-num">04</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">Anatomía de una fila</h2>
              <p className="det-sechead-sub">
                Una posición comprada a 20 $ que hoy cotiza a 26 $ te da tres
                lecturas distintas. Conviene no confundirlas.
              </p>
            </div>
          </header>

          <div className="det-anatomia">
            {LECTURAS.map((l) => (
              <div key={l.title} className="det-lectura">
                <span className={`det-lectura-cifra${l.mute ? " es-mute" : ""}`}>
                  {l.cifra}
                </span>
                <span>
                  <span className="det-lectura-title">{l.title}</span>
                  <span className="det-lectura-text">{l.text}</span>
                </span>
              </div>
            ))}
          </div>

          <p className="det-p" style={{ marginTop: "1.6rem" }}>
            Si estás empezando, la más útil de las tres es la segunda, y es la
            que menos se mira. Está muy relacionada con el{" "}
            <Link href="/glosario/tamano-de-posicion">tamaño de posición</Link>:
            la diferencia entre una cartera que aguanta y una que no rara vez
            está en qué se compra, sino en cuánto.
          </p>
        </section>

        {/* ── 05 · Qué no es ── */}
        <section className="det-seccion">
          <header className="det-sechead">
            <span className="det-sechead-num">05</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">Qué NO es</h2>
              <p className="det-sechead-sub">
                Dicho antes de que lo preguntes, para que nadie se lleve una
                idea equivocada.
              </p>
            </div>
          </header>

          <ul className="det-lista">
            <li>
              <strong>No es un servicio de señales.</strong> No se avisa de
              cuándo comprar ni cuándo vender, ni hay alertas para copiar
              operaciones.
            </li>
            <li>
              <strong>No es copy-trading.</strong> No se conecta a tu exchange
              ni ejecuta nada por ti. Es información, no una orden.
            </li>
            <li>
              <strong>No es una cartera recomendada.</strong> Lo que encaja en
              mi situación no tiene por qué encajar en la tuya.
            </li>
            <li>
              <strong>No incluye operativa apalancada.</strong> Aquí solo hay
              spot. Los <Link href="/glosario/futuros">futuros</Link> se ven en{" "}
              <Link href="/trading-en-directo">Trading en Directo</Link>.
            </li>
          </ul>
        </section>

        {/* ── 06 · FAQ ── */}
        <section className="det-seccion">
          <header className="det-sechead">
            <span className="det-sechead-num">06</span>
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

        <DisclaimerRiesgo variante="portfolio" />

        {/* ── Cierre ── */}
        <section className="det-final">
          <span className="det-final-watermark" aria-hidden="true">P&amp;L</span>
          <h2 className="det-final-title">Ábrelo y júzgalo tú</h2>
          <p className="det-final-sub">
            Va incluido en la suscripción Premium, junto con el{" "}
            <Link href="/herramientas/diario">diario de trading</Link>, el{" "}
            <Link href="/trading-en-directo">directo</Link> y el resto de{" "}
            <Link href="/herramientas">herramientas</Link>. Una sola cuota, sin
            comprar nada por separado.
          </p>
          <div className="det-actions">
            {isPremium ? (
              <Link href="/portfolio" className="det-btn">
                Abrir el portfolio
                <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link href="/premium" className="det-btn">
                  Ver qué incluye Premium
                  <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
                </Link>
                {!user && (
                  <Link href="/login?next=/portfolio" className="det-btn det-btn--ghost">
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
