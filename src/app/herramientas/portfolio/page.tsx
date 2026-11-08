import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowRight, Lock, ShieldCheck, Check, X, CreditCard, Zap, Radio, TrendingUp, TrendingDown, Scale,
  PieChart, ListOrdered, Bitcoin, CalendarClock, Target, Eye, GraduationCap, HeartCrack, Ruler, Crown,
  RefreshCw, Layers,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import { CoinGeckoGlyph } from "@/components/BrandMarks";
import { IconoPortfolio } from "@/components/IconosAnimados";
import { resumenPortfolioPublico } from "@/lib/portfolio-publico";
import { PORTFOLIOS } from "@/lib/portfolios";
import { PREMIUM_PRICE_EUR, precioEur } from "@/lib/stripe";
import "../ficha.css";
import "./portfolio.css";

/**
 * Ficha pública del Portfolio Adelin — punto 13 del plan SEO.
 *
 * Rehecha de arriba abajo el 08-11-2026, a petición del admin, al nivel de las
 * fichas del Diario y de los Cursos, y repasada el mismo día para que todo se
 * vea nítido: superficies sólidas con borde, sin halos difuminados dentro de
 * las tarjetas ni paneles girados en 3D (emborronaban el texto). Lo común con
 * la ficha del Diario sigue en `../ficha.css`; lo propio, en `./portfolio.css`
 * (prefijo `pa-`).
 *
 * Lo que se enseña en claro son **solo agregados reales** de
 * `resumenPortfolioPublico()`: rentabilidad, número de posiciones, cuántas van
 * en ganancias y en pérdidas, y las cifras del DCA. **Nunca qué monedas ni a
 * qué precio**, que es lo que se paga. En las maquetas, las monedas son
 * círculos de color y las cifras de pago son velos: no hay datos inventados
 * que pasen por reales.
 *
 * El texto describe lo que `PortfolioClient` y `DcaClient` hacen DE VERDAD
 * (valor, P&L, mejor y peor posición, mayor peso, reparto, tabla ordenable;
 * rentabilidad del DCA, BTC acumulado, precio medio, ritmo, gráfico de
 * compras y la proyección rotulada). Si cambian, revisa esta página.
 */
export const metadata: Metadata = {
  title: "Portfolio real de cripto, posición a posición",
  description:
    "Qué compré este ciclo, a qué precio entré y cuánto lleva cada moneda, con precios en vivo. La cartera entera, también las posiciones que van en pérdidas.",
  alternates: { canonical: "/herramientas/portfolio" },
};

// El precio sale de la misma constante que cobra Stripe: nunca a mano.
const PRECIO = precioEur(PREMIUM_PRICE_EUR);
const PRECIO_DIA = precioEur(Math.round((PREMIUM_PRICE_EUR / 30) * 100) / 100);

/** Colores de los círculos de las maquetas: dicen «monedas», no cuáles. */
const COLORES = ["#4f9dff", "#f7931a", "#a78bfa", "#22d3ee", "#34d399", "#f472b6"];

/** El reparto de la maqueta del spot: tramos del anillo (suman 100). */
const REPARTO = [34, 24, 18, 14, 10];

type Trae = { icon: typeof Eye; titulo: string; texto: string; termino?: { texto: string; href: string } };

const SPOT_TRAE: Trae[] = [
  { icon: Eye, titulo: "Estado de la cartera", texto: "Valor, P&L y rentabilidad, al momento", termino: { texto: "P&L", href: "/glosario/pnl" } },
  { icon: TrendingUp, titulo: "Destacadas", texto: "La mejor posición, la peor y la que más pesa" },
  { icon: PieChart, titulo: "Reparto", texto: "Cuánto pesa cada moneda en el total" },
  { icon: ListOrdered, titulo: "Tabla ordenable", texto: "Cada posición con su precio de entrada" },
];

const DCA_TRAE: Trae[] = [
  { icon: Bitcoin, titulo: "Rentabilidad", texto: "Del DCA entero, y el bitcoin acumulado" },
  { icon: Scale, titulo: "Precio medio", texto: "El de compra, frente al de hoy" },
  { icon: CalendarClock, titulo: "Ritmo", texto: "Cada cuánto compro y cuánto, de media" },
  { icon: ListOrdered, titulo: "Histórico", texto: "Todas las compras, con fecha y precio" },
];

/** Lo que se aprende mirando una cartera real, no lo que se ve. */
const APRENDES = [
  {
    icon: Ruler,
    titulo: "Cuánto pesa cada posición",
    texto: "El reparto enseña más que la moneda elegida: con qué parte del total se entra y cuándo se deja de añadir.",
    termino: { texto: "parte del total", href: "/glosario/tamano-de-posicion" },
  },
  {
    icon: HeartCrack,
    titulo: "Cómo se lleva una posición en rojo",
    texto: "Las que pierden se quedan en la tabla, con su cifra. Ver una pérdida de verdad, y qué se hace con ella, es lo que ninguna captura enseña.",
  },
  {
    icon: CalendarClock,
    titulo: "Qué hace la constancia",
    texto: "Compra a compra, el DCA enseña lo que pasa al comprar con ritmo fijo, suba o baje el mercado.",
  },
];

const COMPARA: { otros: string; aqui: string }[] = [
  { otros: "Capturas de las operaciones que salieron bien", aqui: "La cartera entera, también lo que va en rojo" },
  { otros: "«Entré por aquí», sin precio exacto", aqui: "El precio al que se ejecutó cada compra" },
  { otros: "Una foto de hace semanas", aqui: "Precios de mercado al abrir la página" },
  { otros: "Promesas de rentabilidad", aqui: "La rentabilidad que hay, sea la que sea" },
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
    a: "Los precios, cada vez que abres la página, y con un botón para refrescarlos. Las posiciones y las compras del DCA, cuando compro o vendo de verdad.",
  },
  {
    q: "¿Por qué no se ven aquí las monedas?",
    a: "Porque qué monedas tengo y a qué precio entré es justo lo que incluye la suscripción. Aquí solo salen cifras agregadas y reales: la rentabilidad, cuántas posiciones hay y cuántas van en pérdidas.",
  },
  {
    q: "¿Qué más incluye la suscripción?",
    a: `El Diario de Trading con Nova y todos los cursos, con examen y certificado. Todo va en la misma cuota de ${PRECIO} al mes, sin permanencia: cancelas cuando quieras desde tu cuenta.`,
  },
];

function pct(n: number): string {
  return `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(1).replace(".", ",")} %`;
}

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

/** El botón principal. Quien ya es Premium abre la herramienta; el resto paga. */
function Cta({ premium, grande = false, texto = "Ver la cartera completa" }: { premium: boolean; grande?: boolean; texto?: string }) {
  const clase = `fh-btn${grande ? " fh-btn--grande" : ""}`;
  if (premium) {
    return (
      <Link href="/portfolio" className={clase}>
        Abrir el portfolio
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

/** Las cuatro piezas de cada cartera, en rejilla. */
function ListaTrae({ items }: { items: Trae[] }) {
  return (
    <ul className="pa-trae">
      {items.map(({ icon: Icon, titulo, texto, termino }) => (
        <li key={titulo}>
          <span className="pa-trae-icono" aria-hidden="true"><Icon size={16} strokeWidth={2.1} /></span>
          <span className="pa-trae-texto">
            <strong>{titulo}</strong>
            <span><ConTermino text={texto} termino={termino} /></span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function FichaPortfolioPage() {
  const supabase = await createClient();

  // La sesión y la cartera no dependen una de otra: a la vez.
  const [{ data: { user } }, resumen] = await Promise.all([
    supabase.auth.getUser(),
    resumenPortfolioPublico(),
  ]);

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const role = profile?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";

  const spot = PORTFOLIOS.find((p) => p.id === "spot")!;
  const dca = PORTFOLIOS.find((p) => p.id === "dca")!;

  // Las filas de la maqueta: tantas como posiciones reales, entre 4 y 6.
  const filas = Math.min(Math.max(resumen?.posiciones ?? 5, 4), 6);
  const sube = (resumen?.rentabilidadPct ?? 0) >= 0;
  const conPrecio = resumen ? resumen.enGanancias + resumen.enPerdidas : 0;

  // Desfases del anillo: cada tramo empieza donde acaba el anterior, desde las 12.
  const tramos = REPARTO.map((largo, i) => ({
    largo,
    desfase: 25 - REPARTO.slice(0, i).reduce((t, x) => t + x, 0),
    color: COLORES[i],
  }));

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
        className={`fh pa${isPremium ? "" : " fh--con-barra"}`}
        style={{ "--fh-acento": "#4f9dff", "--fh-acento-2": "#a8c9ff" } as React.CSSProperties}
      >
        <nav className="fh-migas" aria-label="Migas de pan">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true">›</span>
          <span>Portfolio Adelin</span>
        </nav>

        {/* ── Cabecera: la promesa y el panel, velado ─────────────────────── */}
        <section className="pa-hero">
          <div className="pa-hero-texto">
            <span className="pa-sello">
              <span className="pa-sello-icono" aria-hidden="true"><IconoPortfolio size={15} /></span>
              Cartera real · Precios en vivo
            </span>

            <h1 className="pa-titulo">
              Portfolio Adelin
              <span>Mira mi cartera real, posición a posición.</span>
            </h1>

            <p className="pa-lead">
              Qué compré, a qué precio entré y cuánto lleva cada moneda, con precios de mercado al momento. Mi cartera
              en <Link href="/glosario/spot">spot</Link> y mi <Link href="/glosario/dca">DCA</Link> de Bitcoin.{" "}
              <strong>También lo que va en pérdidas.</strong>
            </p>

            {resumen && (
              <dl className="pa-hero-datos" aria-label="Cifras reales de la cartera, ahora mismo">
                <div>
                  <dt>Rentabilidad spot</dt>
                  <dd className={sube ? "es-sube" : "es-baja"}>{pct(resumen.rentabilidadPct)}</dd>
                </div>
                <div>
                  <dt>Posiciones</dt>
                  <dd>{resumen.posiciones}</dd>
                </div>
                {resumen.dca && (
                  <div>
                    <dt>DCA de Bitcoin</dt>
                    <dd className={resumen.dca.rentabilidadPct >= 0 ? "es-sube" : "es-baja"}>
                      {pct(resumen.dca.rentabilidadPct)}
                    </dd>
                  </div>
                )}
              </dl>
            )}

            <div className="fh-cta">
              <Cta premium={isPremium} />
              {!isPremium && (
                <p className="fh-cta-nota">
                  <ShieldCheck size={14} aria-hidden="true" />
                  {PRECIO}/mes · Sin permanencia · Cancela cuando quieras
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

          {/* El panel tal y como es, con lo de pago velado. Plano y nítido:
              girado en 3D emborronaba el texto. */}
          <div className="pa-escena">
            <div className="pa-panel" aria-label="Vista previa del panel del Portfolio Adelin">
              <div className="pa-panel-barra">
                <span className="pa-puntos" aria-hidden="true"><i /><i /><i /></span>
                <span className="pa-pestanas" aria-hidden="true">
                  <span className="is-activa" style={{ "--t": spot.color } as React.CSSProperties}>{spot.label}</span>
                  <span style={{ "--t": dca.color } as React.CSSProperties}>{dca.label}</span>
                </span>
                <span className="pa-vivo"><span aria-hidden="true" />En vivo</span>
              </div>

              <div className="pa-panel-cuerpo">
                <div className="pa-kpis">
                  <div className="pa-kpi pa-kpi--principal">
                    <span className="pa-etiqueta">Valor actual</span>
                    <span className="pa-velo pa-velo--grande" aria-hidden="true" />
                    {resumen ? (
                      <span className={`pa-pill ${sube ? "es-sube" : "es-baja"}`}>
                        {sube ? <TrendingUp size={13} aria-hidden="true" /> : <TrendingDown size={13} aria-hidden="true" />}
                        {pct(resumen.rentabilidadPct)}
                      </span>
                    ) : (
                      <span className="pa-velo pa-velo--pill" aria-hidden="true" />
                    )}
                  </div>
                  <div className="pa-kpi">
                    <span className="pa-etiqueta">Invertido</span>
                    <span className="pa-velo pa-velo--medio" aria-hidden="true" />
                    <small>Coste de entrada</small>
                  </div>
                  <div className="pa-kpi">
                    <span className="pa-etiqueta">Posiciones</span>
                    <b>{resumen ? resumen.posiciones : "—"}</b>
                    <small>
                      {resumen && conPrecio > 0
                        ? `${resumen.enGanancias} en verde · ${resumen.enPerdidas} en rojo`
                        : "Con su precio de entrada"}
                    </small>
                  </div>
                </div>

                <div className="pa-tabla" aria-hidden="true">
                  <div className="pa-tabla-cab">
                    <span>Moneda</span>
                    <span>Entrada</span>
                    <span>Ahora</span>
                    <span>P&amp;L</span>
                  </div>
                  {Array.from({ length: filas }, (_, i) => (
                    <div key={i} className="pa-tabla-fila" style={{ "--i": i } as React.CSSProperties}>
                      <span className="pa-moneda">
                        <i style={{ background: COLORES[i % COLORES.length] }} />
                        <span className="pa-velo" style={{ width: `${48 + ((i * 17) % 30)}%` }} />
                      </span>
                      <span className="pa-velo" style={{ width: `${55 + ((i * 13) % 35)}%` }} />
                      <span className="pa-velo" style={{ width: `${50 + ((i * 23) % 40)}%` }} />
                      <span className={`pa-velo pa-velo--pl ${i % 3 === 2 ? "es-baja" : "es-sube"}`} style={{ width: `${40 + ((i * 19) % 45)}%` }} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pa-candado">
                <span className="pa-candado-icono"><Lock size={17} strokeWidth={2.4} aria-hidden="true" /></span>
                <p>
                  {resumen
                    ? <><strong>{resumen.posiciones} posiciones reales</strong> con su precio de entrada</>
                    : <><strong>Todas las posiciones</strong> con su precio de entrada</>}
                </p>
                {!isPremium && (
                  <Link href="/api/checkout" prefetch={false} className="pa-candado-btn">
                    Desbloquear <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>

            {/* Un aviso flotante. Decorativo: lo que dice ya está en la página. */}
            <div className="pa-flota" aria-hidden="true">
              <span className="pa-flota-icono"><CoinGeckoGlyph size={16} /></span>
              <span><b>Precios de CoinGecko</b><small>al abrir y al refrescar</small></span>
            </div>
          </div>
        </section>

        {/* ── Las cifras, calculadas al abrir ─────────────────────────────── */}
        {resumen && (
          <section className="pa-cifras" aria-labelledby="pa-cifras-titulo">
            <div className="pa-cabeza">
              <span className="pa-kicker pa-kicker--verde"><Radio size={14} aria-hidden="true" /> Calculado ahora mismo</span>
              <h2 id="pa-cifras-titulo" className="pa-h2">Números que no se pueden maquillar</h2>
              <p className="pa-p">
                Salen de la cartera de verdad y de los precios de mercado de este momento. Si fueran negativos, se
                verían igual.
              </p>
            </div>

            <div className="pa-cifras-rejilla">
              <div className="pa-cifra pa-cifra--azul">
                <span className="pa-cifra-cab">
                  <span className="pa-cifra-icono" aria-hidden="true"><Layers size={16} /></span>
                  Rentabilidad de la cartera spot
                </span>
                <b className={sube ? "es-sube" : "es-baja"}>{pct(resumen.rentabilidadPct)}</b>
                <small>
                  {resumen.posiciones} posiciones{resumen.desdeAnio ? ` · desde ${resumen.desdeAnio}` : ""}
                </small>
              </div>

              <div className="pa-cifra pa-cifra--azul">
                <span className="pa-cifra-cab">
                  <span className="pa-cifra-icono" aria-hidden="true"><Scale size={16} /></span>
                  En verde y en rojo
                </span>
                <b>
                  <span className="es-sube">{resumen.enGanancias}</span>
                  <i aria-hidden="true">/</i>
                  <span className={resumen.enPerdidas > 0 ? "es-baja" : ""}>{resumen.enPerdidas}</span>
                </b>
                {conPrecio > 0 && (
                  <span className="pa-balanza" aria-hidden="true">
                    <i style={{ width: `${(resumen.enGanancias / conPrecio) * 100}%` }} />
                  </span>
                )}
                <small>Todas en la tabla, con su cifra</small>
              </div>

              {resumen.dca && (
                <>
                  <div className="pa-cifra pa-cifra--btc">
                    <span className="pa-cifra-cab">
                      <span className="pa-cifra-icono" aria-hidden="true"><Bitcoin size={16} /></span>
                      Rentabilidad del DCA
                    </span>
                    <b className={resumen.dca.rentabilidadPct >= 0 ? "es-sube" : "es-baja"}>
                      {pct(resumen.dca.rentabilidadPct)}
                    </b>
                    <small>{resumen.dca.desdeAnio ? `Desde ${resumen.dca.desdeAnio}` : "Compra a compra"}</small>
                  </div>
                  <div className="pa-cifra pa-cifra--btc">
                    <span className="pa-cifra-cab">
                      <span className="pa-cifra-icono" aria-hidden="true"><CalendarClock size={16} /></span>
                      Compras de bitcoin
                    </span>
                    <b>{resumen.dca.compras}</b>
                    <small>Cada una con su fecha y su precio</small>
                  </div>
                </>
              )}
            </div>

            <p className="pa-cifras-nota">
              <RefreshCw size={12} aria-hidden="true" />
              Sin importes a propósito: el capital no prueba nada. La rentabilidad, sí.
            </p>
          </section>
        )}

        {/* ── Dos carteras ────────────────────────────────────────────────── */}
        <section className="fh-bloque" aria-labelledby="pa-carteras-titulo">
          <div className="pa-cabeza">
            <span className="pa-kicker"><PieChart size={14} aria-hidden="true" /> Lo que hay dentro</span>
            <h2 id="pa-carteras-titulo" className="pa-h2">Dos carteras, cada una por su lado</h2>
            <p className="pa-p">
              No se suman a propósito: el DCA y las compras puntuales son estrategias distintas, y una media de las
              dos no describiría a ninguna.
            </p>
          </div>

          <div className="pa-carteras">
            {/* ── Spot ── */}
            <article className="pa-cartera" style={{ "--c": spot.color } as React.CSSProperties}>
              <header className="pa-cartera-cab">
                <span className="pa-cartera-icono" aria-hidden="true"><Layers size={20} strokeWidth={2.1} /></span>
                <span>
                  <span className="pa-cartera-etiqueta">{spot.label}</span>
                  <h3>Cada moneda, con su precio de entrada</h3>
                </span>
              </header>
              <p className="pa-cartera-desc">
                <ConTermino text={spot.desc} termino={{ texto: "altcoins", href: "/glosario/altcoin" }} />
              </p>

              {/* Maqueta del reparto: anillo + leyenda. Las monedas no se nombran. */}
              <div className="pa-mini" aria-hidden="true">
                <div className="pa-mini-barra">
                  <span>Reparto de la cartera</span>
                  <small>por valor actual</small>
                </div>
                <div className="pa-mini-reparto">
                  <div className="pa-donut">
                    <svg viewBox="0 0 42 42">
                      <circle cx="21" cy="21" r="15.9155" className="pa-donut-fondo" />
                      {tramos.map((t, i) => (
                        <circle
                          key={i}
                          cx="21" cy="21" r="15.9155"
                          className="pa-donut-tramo"
                          style={{
                            stroke: t.color,
                            strokeDasharray: `${t.largo - 1.2} ${100 - t.largo + 1.2}`,
                            strokeDashoffset: t.desfase,
                            "--i": i,
                          } as React.CSSProperties}
                        />
                      ))}
                    </svg>
                    <span className="pa-donut-centro">
                      <b>{resumen ? resumen.posiciones : "—"}</b>
                      <small>monedas</small>
                    </span>
                  </div>
                  <ul className="pa-leyenda">
                    {tramos.map((t, i) => (
                      <li key={i}>
                        <i style={{ background: t.color }} />
                        <span className="pa-velo" style={{ width: `${58 - i * 6}%` }} />
                        <span className="pa-leyenda-barra"><em style={{ width: `${t.largo * 2.6}%`, background: t.color }} /></span>
                        <Lock size={11} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <ListaTrae items={SPOT_TRAE} />
            </article>

            {/* ── DCA ── */}
            <article className="pa-cartera" style={{ "--c": dca.color } as React.CSSProperties}>
              <header className="pa-cartera-cab">
                <span className="pa-cartera-icono" aria-hidden="true"><Bitcoin size={20} strokeWidth={2.1} /></span>
                <span>
                  <span className="pa-cartera-etiqueta">{dca.label}</span>
                  <h3>Bitcoin, compra a compra, pase lo que pase</h3>
                </span>
              </header>
              <p className="pa-cartera-desc">{dca.desc}</p>

              {/* Maqueta del gráfico de compras. La rentabilidad y el número de
                  compras, si los hay, son los reales; el dibujo, no. */}
              <div className="pa-mini" aria-hidden="true">
                <div className="pa-mini-barra">
                  <span>Compras y precio medio</span>
                  {resumen?.dca ? (
                    <b className={resumen.dca.rentabilidadPct >= 0 ? "es-sube" : "es-baja"}>{pct(resumen.dca.rentabilidadPct)}</b>
                  ) : (
                    <small>compra a compra</small>
                  )}
                </div>
                <div className="pa-mini-grafico">
                  <svg viewBox="0 0 300 120" preserveAspectRatio="none">
                    {[20, 50, 80, 110].map((y) => (
                      <line key={y} x1="0" x2="300" y1={y} y2={y} className="pa-guia" />
                    ))}
                    <polyline
                      className="pa-dca-linea"
                      points="0,88 30,72 60,82 90,60 120,76 150,50 180,64 210,38 240,54 270,26 300,32"
                    />
                    <line x1="0" x2="300" y1="66" y2="66" className="pa-dca-medio" />
                  </svg>
                  {[[30, 72], [90, 60], [150, 50], [210, 38], [270, 26]].map(([x, y], i) => (
                    <span
                      key={i}
                      className="pa-dca-compra"
                      style={{ left: `${(x / 300) * 100}%`, top: `${(y / 120) * 100}%`, "--i": i } as React.CSSProperties}
                    />
                  ))}
                </div>
                <div className="pa-mini-pie">
                  <span><i className="es-compra" /> Compra</span>
                  <span><i className="es-medio" /> Precio medio</span>
                  {resumen?.dca && <span className="pa-mini-dato">{resumen.dca.compras} compras</span>}
                </div>
              </div>

              <ListaTrae items={DCA_TRAE} />

              <p className="pa-cartera-nota">
                <Target size={13} aria-hidden="true" />
                Incluye una proyección a un precio redondo, rotulada como supuesto: no es una previsión.
              </p>
            </article>
          </div>
        </section>

        {/* ── Qué se aprende ──────────────────────────────────────────────── */}
        <section className="fh-bloque" aria-labelledby="pa-aprende-titulo">
          <div className="pa-cabeza">
            <span className="pa-kicker"><GraduationCap size={14} aria-hidden="true" /> Para qué sirve</span>
            <h2 id="pa-aprende-titulo" className="pa-h2">No es para copiar. Es para aprender a gestionar</h2>
          </div>
          <div className="pa-aprende">
            {APRENDES.map(({ icon: Icon, titulo, texto, termino }, i) => (
              <article key={titulo} className="pa-aprende-tarjeta">
                <span className="pa-aprende-cab">
                  <span className="pa-aprende-icono" aria-hidden="true"><Icon size={19} strokeWidth={2} /></span>
                  <span className="pa-aprende-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                </span>
                <h3>{titulo}</h3>
                <p><ConTermino text={texto} termino={termino} /></p>
              </article>
            ))}
          </div>
        </section>

        {/* ── Frente a lo habitual ────────────────────────────────────────── */}
        <section className="fh-bloque" aria-labelledby="pa-versus-titulo">
          <div className="pa-cabeza">
            <h2 id="pa-versus-titulo" className="pa-h2">Lo que suele enseñarse, y lo que ves aquí</h2>
          </div>
          <div className="pa-versus">
            <div className="pa-versus-col pa-versus-col--no">
              <span className="pa-versus-cab"><X size={15} strokeWidth={2.6} aria-hidden="true" /> En redes</span>
              <ul>
                {COMPARA.map((c) => <li key={c.otros}><X size={14} strokeWidth={2.6} aria-hidden="true" />{c.otros}</li>)}
              </ul>
            </div>
            <div className="pa-versus-col pa-versus-col--si">
              <span className="pa-versus-cab"><Check size={15} strokeWidth={2.6} aria-hidden="true" /> Portfolio Adelin</span>
              <ul>
                {COMPARA.map((c) => <li key={c.aqui}><Check size={14} strokeWidth={2.8} aria-hidden="true" />{c.aqui}</li>)}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Qué no es ───────────────────────────────────────────────────── */}
        <section className="fh-bloque fh-bloque--estrecho">
          <h2 className="fh-h2 fh-h2--peq">Para que nadie se lleve otra idea</h2>
          <ul className="fh-noes">
            {NO_ES.map((n) => <li key={n}>{n}</li>)}
          </ul>
          <p className="fh-nota">
            Solo hay compras en spot: sin <Link href="/glosario/futuros">futuros</Link> ni{" "}
            <Link href="/glosario/apalancamiento">apalancamiento</Link>. Es información para consultar, no una orden de
            compra.
          </p>
        </section>

        {/* ── Precio y llamada final ──────────────────────────────────────── */}
        <section className="pa-precio" id="suscribirse" aria-labelledby="pa-precio-titulo">
          <div className="pa-precio-texto">
            <span className="pa-kicker pa-kicker--oro"><Crown size={14} aria-hidden="true" /> Premium · todo incluido</span>
            <h2 id="pa-precio-titulo" className="pa-precio-titulo">Ábrelo y júzgalo tú</h2>
            <ul className="pa-incluye">
              <li><Check size={14} strokeWidth={3} aria-hidden="true" />Portfolio Adelin: spot y DCA de Bitcoin</li>
              <li><Check size={14} strokeWidth={3} aria-hidden="true" />Precios de mercado en cada posición</li>
              <li><Check size={14} strokeWidth={3} aria-hidden="true" />El <Link href="/herramientas/diario">Diario de Trading</Link> con Nova</li>
              <li><Check size={14} strokeWidth={3} aria-hidden="true" />Todos los <Link href="/cursos">cursos</Link>, con examen y certificado</li>
            </ul>
          </div>

          <div className="pa-precio-caja">
            {isPremium ? (
              <p className="pa-precio-ya">Ya tienes acceso.</p>
            ) : (
              <>
                <span className="pa-precio-plan"><Crown size={13} aria-hidden="true" /> Premium</span>
                <p className="pa-precio-cifra">{PRECIO}<span>/mes</span></p>
                <p className="pa-precio-dia">Unos {PRECIO_DIA} al día · el precio se te queda fijado</p>
              </>
            )}
            <Cta premium={isPremium} grande texto="Desbloquear el portfolio" />
            {!isPremium && (
              <ul className="pa-confianza">
                <li><ShieldCheck size={13} aria-hidden="true" />Sin permanencia</li>
                <li><Zap size={13} aria-hidden="true" />Acceso inmediato</li>
                <li><CreditCard size={13} aria-hidden="true" />Pago seguro con Stripe</li>
              </ul>
            )}
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
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

        {/* Barra fija en móvil: en pantalla pequeña el botón de la cabecera se
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
