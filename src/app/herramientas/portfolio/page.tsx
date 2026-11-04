import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowRight, Lock, ShieldCheck, Eye, LineChart, Bitcoin, X, Check,
  CreditCard, RefreshCw,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import { resumenPortfolioPublico } from "@/lib/portfolio-publico";
import { PORTFOLIOS } from "@/lib/portfolios";
import "../ficha.css";

/**
 * Ficha pública del Portfolio Adelin — punto 13 del plan SEO.
 *
 * Rehecha el 04-11-2026: la versión anterior explicaba la herramienta en seis
 * secciones de texto y nadie llegaba al botón. Esta enseña la herramienta en
 * vez de describirla —una ventana del panel real, con lo de pago velado— y
 * repite la llamada a suscribirse en tres sitios: el hero, el bloque de precio
 * y, en móvil, una barra fija abajo.
 *
 * Lo que se enseña en claro son **solo agregados reales** de
 * `resumenPortfolioPublico()`: rentabilidad, número de posiciones y de
 * aportaciones. Nunca qué monedas ni a qué precio, que es lo que se paga. Las
 * filas de la ventana son barras veladas, no datos inventados.
 *
 * El texto describe lo que `PortfolioClient` y `DcaClient` hacen DE VERDAD.
 * Si cambian sus cifras o sus columnas, revisa esta página.
 */
export const metadata: Metadata = {
  title: "Portfolio real de cripto, posición a posición",
  description:
    "Qué compré este ciclo, a qué precio entré y cuánto lleva cada moneda, con precios en vivo. La cartera entera, también las posiciones que van en pérdidas.",
  alternates: { canonical: "/herramientas/portfolio" },
};

const PRECIO = "49,99 €";

/** Lo que encuentras al entrar, en el orden en que lo ves. */
const DENTRO = [
  {
    icon: Eye,
    title: "El estado de la cartera, de un vistazo",
    text: "Invertido, valor actual, P&L y rentabilidad. Cuatro cifras y sabes cómo va.",
  },
  {
    icon: LineChart,
    title: "Cada posición, con su precio de entrada",
    text: "Moneda, cantidad, precio de compra, valor de hoy y ganancia o pérdida de cada una.",
  },
  {
    icon: Bitcoin,
    title: "El DCA de Bitcoin, compra a compra",
    text: "Cada aportación con su fecha, su importe y el precio de Bitcoin de aquel día.",
  },
];

const COMPARA: { otros: string; aqui: string }[] = [
  { otros: "Capturas de las operaciones que salieron bien", aqui: "La cartera entera, también lo que va en rojo" },
  { otros: "«Entré por aquí», sin precio exacto", aqui: "El precio al que se ejecutó cada compra" },
  { otros: "Una foto de hace semanas", aqui: "Precios de mercado al abrir la página" },
];

const NO_ES = [
  "No son señales ni alertas",
  "No se conecta a tu exchange",
  "No es una cartera recomendada",
  "Sin futuros ni apalancamiento",
];

const FAQ = [
  {
    q: "¿Es tu cartera de verdad o una demostración?",
    a: "Es la cartera real con la que opero en spot y mi DCA de Bitcoin. Se actualiza cuando la muevo, y las posiciones que van en pérdidas se ven igual que las que van en ganancias. Las cifras de esta página se calculan con los precios de mercado del momento en que la abres.",
  },
  {
    q: "¿Me vais a avisar cuando compres o vendas?",
    a: "No. No es un servicio de señales ni hay alertas: la herramienta refleja el estado de la cartera, no manda avisos para copiar operaciones.",
  },
  {
    q: "¿Puedo copiar la cartera tal cual?",
    a: "Puedes, pero es mala idea. El peso de cada posición está pensado para un capital, un horizonte y una tolerancia a la pérdida que son míos. Copiar los porcentajes de otro sin eso es la parte fácil y la que menos ayuda.",
  },
  {
    q: "¿Cada cuánto se actualiza?",
    a: "Los precios, cada vez que abres la página. Las posiciones y las compras del DCA, cuando compro o vendo de verdad.",
  },
  {
    q: "¿Qué más incluye la suscripción?",
    a: `El Diario de Trading. Las dos herramientas van en la misma cuota de ${PRECIO} al mes, sin permanencia: cancelas cuando quieras desde tu cuenta.`,
  },
];

function pct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1).replace(".", ",")} %`;
}

/** El botón principal. Quien ya es Premium abre la herramienta; el resto paga. */
function Cta({ premium, grande = false }: { premium: boolean; grande?: boolean }) {
  if (premium) {
    return (
      <Link href="/portfolio" className={`fh-btn${grande ? " fh-btn--grande" : ""}`}>
        Abrir el portfolio
        <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
      </Link>
    );
  }
  // /api/checkout manda primero al registro si no hay sesión y vuelve solo
  // al pago (ver su ruta): un paso menos que pasar por /premium.
  return (
    <Link href="/api/checkout" prefetch={false} className={`fh-btn${grande ? " fh-btn--grande" : ""}`}>
      <Lock size={16} strokeWidth={2.4} aria-hidden="true" />
      Desbloquear el portfolio
      <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
    </Link>
  );
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
  const filas = Math.min(Math.max(resumen?.posiciones ?? 5, 3), 5);
  const spot = PORTFOLIOS.find((p) => p.id === "spot")!;
  const dca = PORTFOLIOS.find((p) => p.id === "dca")!;

  return (
    <div className="blog-page">
      <div className="bg-ambient" />
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Inicio", path: "/" },
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

      <main
        className={`fh${isPremium ? "" : " fh--con-barra"}`}
        style={{ "--fh-acento": "#4f9dff", "--fh-acento-2": "#a8c9ff" } as React.CSSProperties}
      >
        <nav className="fh-migas" aria-label="Migas de pan">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true">›</span>
          <span>Portfolio Adelin</span>
        </nav>

        {/* ── Hero: la promesa a la izquierda, la herramienta a la derecha ── */}
        <section className="fh-hero">
          <div className="fh-hero-texto">
            <span className="fh-eyebrow">
              <span className="fh-eyebrow-punto" aria-hidden="true" />
              Incluido en Premium
            </span>

            <h1 className="fh-titulo">
              Portfolio Adelin
              <span>Mira mi cartera real, posición a posición.</span>
            </h1>

            <p className="fh-lead">
              Qué compré, a qué precio entré y cuánto lleva cada moneda, con
              precios en vivo. También lo que va en pérdidas.
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
                  <Link href={`/login?next=${encodeURIComponent("/portfolio")}`}>Inicia sesión</Link>
                </p>
              )}
            </div>
          </div>

          {/* La ventana del panel. Lo de pago va velado: las barras no son
              datos, son el hueco donde están. Lo único en claro es la
              rentabilidad agregada, que es real. */}
          <div className="fh-ventana" aria-label="Vista previa del panel del Portfolio Adelin">
            <div className="fh-ventana-barra">
              <span className="fh-ventana-puntos" aria-hidden="true"><i /><i /><i /></span>
              <span className="fh-ventana-nombre">Portfolio Adelin</span>
              <span className="fh-vivo"><span aria-hidden="true" />En vivo</span>
            </div>

            <div className="fh-ventana-tabs" aria-hidden="true">
              <span className="is-activa" style={{ "--fh-tab": spot.color } as React.CSSProperties}>{spot.label}</span>
              <span style={{ "--fh-tab": dca.color } as React.CSSProperties}>{dca.label}</span>
            </div>

            <div className="fh-resumen">
              {["Invertido", "Valor actual", "P&L total"].map((l) => (
                <div key={l} className="fh-cifra">
                  <span className="fh-cifra-label">{l}</span>
                  <span className="fh-velo fh-velo--cifra" aria-hidden="true" />
                </div>
              ))}
              <div className="fh-cifra fh-cifra--real">
                <span className="fh-cifra-label">Rentabilidad</span>
                {resumen ? (
                  <span className={`fh-cifra-valor ${resumen.rentabilidadPct >= 0 ? "es-sube" : "es-baja"}`}>
                    {pct(resumen.rentabilidadPct)}
                  </span>
                ) : (
                  <span className="fh-velo fh-velo--cifra" aria-hidden="true" />
                )}
              </div>
            </div>

            <div className="fh-tabla" aria-hidden="true">
              <div className="fh-tabla-cab">
                <span>Coin</span>
                <span>Precio de compra</span>
                <span>Valor actual</span>
                <span>P&amp;L</span>
              </div>
              {Array.from({ length: filas }, (_, i) => (
                <div key={i} className="fh-tabla-fila">
                  <span className="fh-moneda"><i /><span className="fh-velo" style={{ width: `${46 + ((i * 17) % 30)}%` }} /></span>
                  <span className="fh-velo" style={{ width: `${55 + ((i * 13) % 35)}%` }} />
                  <span className="fh-velo" style={{ width: `${50 + ((i * 23) % 40)}%` }} />
                  <span className="fh-velo fh-velo--pl" style={{ width: `${40 + ((i * 19) % 45)}%` }} />
                </div>
              ))}
            </div>

            <div className="fh-candado">
              <span className="fh-candado-icono"><Lock size={18} strokeWidth={2.2} aria-hidden="true" /></span>
              <p>
                {resumen
                  ? <><strong>{resumen.posiciones} posiciones reales</strong> con su precio de entrada</>
                  : <><strong>Todas las posiciones</strong> con su precio de entrada</>}
              </p>
              {!isPremium && (
                <Link href="/api/checkout" prefetch={false} className="fh-candado-btn">
                  Verlas ahora <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ── Prueba: cifras reales, calculadas al abrir ── */}
        {resumen && (
          <section className="fh-prueba" aria-label="Cifras reales de la cartera">
            <div className="fh-dato">
              <span className={`fh-dato-valor ${resumen.rentabilidadPct >= 0 ? "es-sube" : "es-baja"}`}>
                {pct(resumen.rentabilidadPct)}
              </span>
              <span className="fh-dato-label">Rentabilidad spot</span>
            </div>
            <div className="fh-dato">
              <span className="fh-dato-valor">{resumen.posiciones}</span>
              <span className="fh-dato-label">Posiciones abiertas</span>
            </div>
            {resumen.dca && (
              <>
                <div className="fh-dato">
                  <span className={`fh-dato-valor ${resumen.dca.rentabilidadPct >= 0 ? "es-sube" : "es-baja"}`}>
                    {pct(resumen.dca.rentabilidadPct)}
                  </span>
                  <span className="fh-dato-label">DCA de Bitcoin</span>
                </div>
                <div className="fh-dato">
                  <span className="fh-dato-valor">{resumen.dca.compras}</span>
                  <span className="fh-dato-label">Compras de BTC</span>
                </div>
              </>
            )}
            <p className="fh-prueba-nota">
              <RefreshCw size={12} aria-hidden="true" />
              Calculado ahora mismo con precios de mercado. Si fuera negativo, saldría igual.
            </p>
          </section>
        )}

        {/* ── Qué ves al entrar ── */}
        <section className="fh-bloque">
          <h2 className="fh-h2">Lo que ves al entrar</h2>
          <div className="fh-dentro">
            {DENTRO.map((d, i) => {
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

        {/* ── Dos carteras ── */}
        <section className="fh-bloque">
          <h2 className="fh-h2">Dos carteras, cada una por su lado</h2>
          <div className="fh-carteras">
            {PORTFOLIOS.map((p) => (
              <div key={p.id} className="fh-cartera" style={{ "--fh-color": p.color } as React.CSSProperties}>
                <span className="fh-cartera-label">{p.label}</span>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
          <p className="fh-nota">
            No se suman a propósito: el <Link href="/glosario/dca">DCA</Link> y
            las compras puntuales son estrategias distintas, y una media de las
            dos no describiría a ninguna.
          </p>
        </section>

        {/* ── Frente a lo habitual ── */}
        <section className="fh-bloque">
          <h2 className="fh-h2">Lo que suele enseñarse, y lo que ves aquí</h2>
          <div className="fh-compara">
            {COMPARA.map((c) => (
              <div key={c.aqui} className="fh-compara-fila">
                <span className="fh-compara-no"><X size={15} strokeWidth={2.6} aria-hidden="true" />{c.otros}</span>
                <span className="fh-compara-si"><Check size={15} strokeWidth={2.6} aria-hidden="true" />{c.aqui}</span>
              </div>
            ))}
          </div>
          <p className="fh-nota">
            Lo que más enseña no es el <Link href="/glosario/pnl">P&amp;L</Link> en
            porcentaje, sino cuánto pesa cada posición: el{" "}
            <Link href="/glosario/tamano-de-posicion">tamaño de posición</Link> explica
            más que la moneda elegida.
          </p>
        </section>

        {/* ── Qué no es ── */}
        <section className="fh-bloque fh-bloque--estrecho">
          <h2 className="fh-h2 fh-h2--peq">Para que nadie se lleve otra idea</h2>
          <ul className="fh-noes">
            {NO_ES.map((n) => <li key={n}>{n}</li>)}
          </ul>
          <p className="fh-nota">
            Solo hay compras en spot, sin <Link href="/glosario/futuros">futuros</Link>.
            Es información para consultar, no una orden de compra.
          </p>
        </section>

        {/* ── Precio y llamada final ── */}
        <section className="fh-precio" id="suscribirse">
          <div className="fh-precio-texto">
            <span className="fh-eyebrow">
              <span className="fh-eyebrow-punto" aria-hidden="true" />
              Premium
            </span>
            <h2 className="fh-precio-titulo">Ábrelo y júzgalo tú</h2>
            <ul className="fh-incluye">
              <li><Check size={16} strokeWidth={2.6} aria-hidden="true" />Portfolio Adelin: spot y DCA de Bitcoin</li>
              <li><Check size={16} strokeWidth={2.6} aria-hidden="true" />Precios en vivo en cada posición</li>
              <li><Check size={16} strokeWidth={2.6} aria-hidden="true" />El <Link href="/herramientas/diario">Diario de Trading</Link>, en la misma cuota</li>
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

        <DisclaimerRiesgo variante="portfolio" />

        {/* Barra fija en móvil: en pantalla pequeña el botón del hero se
            pierde al primer gesto, y aquí es donde se decide. */}
        {!isPremium && (
          <div className="fh-barra">
            <span className="fh-barra-precio">{PRECIO}<small>/mes</small></span>
            <Link href="/api/checkout" prefetch={false} className="fh-barra-btn">
              Desbloquear <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
