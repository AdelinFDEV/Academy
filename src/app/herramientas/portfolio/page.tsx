import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowRight, Lock, ShieldCheck, Check, X, Radio, TrendingUp, TrendingDown, Scale,
  PieChart, ListOrdered, Bitcoin, CalendarClock, Target, Eye, HeartCrack, Ruler,
  Layers,
} from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import SimboloEstudio from "@/components/cuaderno/SimboloEstudio";
import TeclaPremium from "@/components/cuaderno/TeclaPremium";
import TarjetaPremium from "@/components/TarjetaPremium";
import Anotacion from "@/components/cuaderno/Anotacion";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
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
 *
 * Estilo «Cuaderno de estudio» desde el 17-11-2026 (ESTILO.md): el Portfolio
 * es menta; el DCA de bitcoin, naranja (el color de bitcoin y de la marca);
 * Premium y el pago, naranja, con el precio en el bloque de tinta. Todos los
 * botones son `<Tecla>`. Los colores de las monedas de las maquetas son los de
 * la paleta: dicen «monedas», no cuáles.
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

/** Colores de los círculos de las maquetas (los de la paleta): dicen «monedas», no cuáles. */
const COLORES = ["var(--menta)", "var(--naranja)", "var(--lila)", "var(--cielo)", "var(--azul)", "var(--coral)"];

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
// Simplificado el 19-11-2026 (pedido por el admin): cada punto, una línea.
const APRENDES = [
  {
    icon: Ruler,
    color: "menta",
    titulo: "Cuánto pesa cada posición",
    texto: "Con qué parte del total se entra y cuándo se deja de añadir.",
    termino: { texto: "parte del total", href: "/glosario/tamano-de-posicion" },
  },
  {
    icon: HeartCrack,
    color: "coral",
    titulo: "Cómo se lleva una posición en rojo",
    texto: "Las pérdidas se quedan en la tabla, con su cifra.",
  },
  {
    icon: CalendarClock,
    color: "naranja",
    titulo: "Qué hace la constancia",
    texto: "Comprar con ritmo fijo, suba o baje el mercado.",
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
function Cta({ premium, grande = false, texto = "Ver la cartera completa", verde = false }: { premium: boolean; grande?: boolean; texto?: string; verde?: boolean }) {
  if (premium) {
    return (
      <Tecla href="/portfolio" color="menta" tamano={grande ? "grande" : "normal"}>
        Abrir el portfolio
        <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
      </Tecla>
    );
  }
  // /api/checkout manda primero al registro si no hay sesión y vuelve solo
  // al pago (ver su ruta): un paso menos que pasar por /premium.
  return (
    <Tecla href="/api/checkout" prefetch={false} tamano={grande ? "grande" : "normal"} color={verde ? "menta" : undefined}>
      {/* «Ver la cartera» lleva el ojo; «Desbloquear», el candado (19-11-2026). */}
      {verde ? <Eye size={18} strokeWidth={2.6} aria-hidden="true" /> : <Lock size={16} strokeWidth={2.6} aria-hidden="true" />}
      {texto}
      <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
    </Tecla>
  );
}

/** Las cuatro piezas de cada cartera, en rejilla. */
function ListaTrae({ items }: { items: Trae[] }) {
  return (
    <ul className="pa-trae">
      {items.map(({ icon: Icon, titulo, texto, termino }) => (
        <li key={titulo}>
          <span className="pa-trae-icono" aria-hidden="true"><Icon size={16} strokeWidth={2.4} /></span>
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
    <div className="blog-page fh-pagina">

      <SiteNav user={!!user} isPremium={isPremium} isAdmin={role === "admin"} />

      <main className="fh fh-c-menta pa">
        {/* ── Cabecera: la promesa y el panel, velado ─────────────────────── */}
        <section className="fh-hero pa-hero">
          <div className="fh-hero-texto">
            {/* Cabecera reinventada (19-11-2026, pedido por el admin) en el
                estilo del cuaderno: pósit «en vivo», el título con
                «Adelin» rodeado a rotulador, la frase a mano con su flecha y
                el texto en tres apuntes con su color. Mismas palabras. */}
            <div className="pa-cab">
              <span className="pa-cab-posit">
                <span className="pa-cab-punto" aria-hidden="true" />
                Cartera real · Precios en vivo
              </span>
            </div>

            <h1 className="fh-titulo pa-cab-titulo">
              Portfolio <span className="pa-cab-nombre">Adelin</span>
              <span className="fh-titulo-2 pa-cab-frase">
                Mira mi cartera real, <span className="pa-cab-subraya">posición a posición.</span>
              </span>
            </h1>

            <ul className="pa-cab-apuntes">
              <li className="pa-cab-apunte pa-cab-apunte--menta">
                <span className="pa-cab-icono" aria-hidden="true"><IconoPortfolio size={16} /></span>
                <span>Qué compré, a qué precio entré y cuánto lleva cada moneda, con precios de mercado al momento.</span>
              </li>
              <li className="pa-cab-apunte pa-cab-apunte--cielo">
                <span className="pa-cab-icono" aria-hidden="true"><TrendingUp size={16} strokeWidth={2.6} /></span>
                <span>
                  Mi cartera en <Link href="/glosario/spot">spot</Link> y mi <Link href="/glosario/dca">DCA</Link> de Bitcoin.
                </span>
              </li>
              <li className="pa-cab-apunte pa-cab-apunte--coral">
                <span className="pa-cab-icono" aria-hidden="true"><TrendingDown size={16} strokeWidth={2.6} /></span>
                <strong>También lo que va en pérdidas.</strong>
              </li>
            </ul>

            {resumen && (
              <div className="pa-datos">
              {/* El aviso de que es la cartera real y al precio del momento
                  (19-11-2026, pedido por el admin), como etiqueta sobre la ficha. */}
              <p className="pa-datos-vivo">
                <span className="pa-cab-punto" aria-hidden="true" />
                <span>Precio <strong>real</strong>, en directo</span>
              </p>
              <dl className="pa-hero-datos" aria-label="Cifras reales de la cartera, ahora mismo">
                <div className="pa-dato--spot">
                  <dt>Rentabilidad spot</dt>
                  <dd className={sube ? "es-sube" : "es-baja"}>{pct(resumen.rentabilidadPct)}</dd>
                </div>
                <div>
                  <dt>Posiciones</dt>
                  <dd>{resumen.posiciones}</dd>
                </div>
                {resumen.dca && (
                  <div className="pa-dato--dca">
                    <dt>DCA de Bitcoin</dt>
                    <dd className={resumen.dca.rentabilidadPct >= 0 ? "es-sube" : "es-baja"}>
                      {pct(resumen.dca.rentabilidadPct)}
                    </dd>
                  </div>
                )}
              </dl>
              </div>
            )}

            {/* El botón y sus datos, rediseñados (19-11-2026, pedido por el
                admin): texto corto, y debajo el precio grande con lo que cuesta
                al día y las dos garantías como etiquetas. */}
            <div className="fh-cta pa-cta">
              <Cta premium={isPremium} grande texto="Ver la cartera" verde />
              {!isPremium && (
                <div className="pa-cta-datos">
                  {/* El café: el precio al día es menos que uno (19-11-2026). */}
                  {/* eslint-disable-next-line @next/next/no-img-element -- pegatina decorativa, ya optimizada */}
                  <img src="/cuaderno/cafe-pegatina.webp" alt="" width={300} height={371} className="pa-cta-cafe" loading="lazy" draggable={false} />
                  <p className="pa-cta-precio">
                    <span className="pa-cta-etiqueta">Con Premium</span>
                    <strong>{PRECIO}</strong>
                    <span>al mes</span>
                    <span className="pa-cta-dia">menos que un café: {PRECIO_DIA} al día</span>
                  </p>
                  <ul className="pa-cta-garantias">
                    <li><ShieldCheck size={14} strokeWidth={2.6} aria-hidden="true" /> Sin permanencia</li>
                    <li><Check size={14} strokeWidth={3} aria-hidden="true" /> Cancelas cuando quieras</li>
                  </ul>
                </div>
              )}
              {!user && (
                <p className="fh-cta-login pa-cta-login">
                  ¿Ya eres Premium?{" "}
                  <Link href={`/login?next=${encodeURIComponent("/portfolio")}`}>Inicia sesión</Link>
                </p>
              )}
            </div>
          </div>

          {/* El panel tal y como es, con lo de pago velado. */}
          <div className="pa-escena">
            {/* Garabatos de trading detrás del panel, solo en el ordenador
                (19-11-2026, pedido por el admin): velas, una gráfica que sube,
                una tarta de reparto, un porcentaje y una moneda. Decoración. */}
            <span className="pa-garabatos" aria-hidden="true">
              <svg className="pa-g pa-g--velas" viewBox="0 0 70 60"><path d="M10.2 8.4c.3 14.1-.4 30 .2 44.6M5.6 18.3c3.1-.4 6.2.3 9.1-.2.4 7.2-.3 14.3.2 21.6-3 .4-6.1-.2-9.2.2-.3-7.3.2-14.4-.1-21.6zM30.4 4.1c-.4 16.3.5 34.8-.2 51.2M25.8 12.6c3.2-.3 6 .2 9.2-.1.2 4.9-.3 9.6.1 14.6-3.1.3-6.2-.2-9.1.2-.4-5 .1-9.8-.2-14.7zM50.3 14.2c.2 12.4-.3 26.1.3 38.4M45.7 24.9c3-.2 6.3.3 9.2-.1.3 6.4-.2 12.6.2 19.1-3.2.2-6.1-.2-9.3.1-.2-6.4.2-12.8-.1-19.1z" /></svg>
              <svg className="pa-g pa-g--sube" viewBox="0 0 80 60"><path d="M5.3 50.6c8.2-7.4 13-14.7 20.4-11.6 6.6 2.8 9.4 8.3 16.1.7 7.4-8.6 13.6-21.6 30.6-32.4M58.6 6.2c4.6-.5 9.9-.9 14.5-.6.4 4.3-.2 9.2.4 13.4" /></svg>
              <svg className="pa-g pa-g--tarta" viewBox="0 0 60 60"><path d="M30.6 6.1c13.5-.4 24.2 10.9 23.5 24.4-.7 13-11.9 23.6-24.8 22.9C16.2 52.8 5.6 41.6 6.3 28.4 7 16 17.6 6.5 30.6 6.1zM30.2 6.6c.4 8.1-.3 16.1.2 23.9 7.8-.2 15.5.4 23.2-.1M30.4 30.4c-6.4 5.1-12.6 10.6-19.1 15.4" /></svg>
              <svg className="pa-g pa-g--porcentaje" viewBox="0 0 50 60"><path d="M40.3 6.4C30.6 22.4 19.4 38.6 9.6 54.1M13.4 8.2c4.4-.3 7.5 3.3 7.1 7.4-.4 4-4.2 6.6-8 5.8-3.6-.8-5.4-4.6-4.3-7.9 1-2.9 3.1-5.1 5.2-5.3zM37.2 39.4c4.3-.2 7.4 3.5 6.9 7.6-.5 3.8-4.3 6.4-8 5.6-3.6-.7-5.4-4.5-4.2-7.8 1-2.8 3-5.2 5.3-5.4z" /></svg>
              <svg className="pa-g pa-g--moneda" viewBox="0 0 60 60"><path d="M30.2 7.4c12.1-.2 21.9 9.8 21.5 21.9-.4 11.6-10.4 21.6-22.2 21-11.9-.6-21-10.4-20.4-22.1.6-11.3 9.6-20.6 21.1-20.8zM26.4 18.6c.2 7.7-.3 15.6.2 23.1M26.5 19.1c5.3-.6 10.4.2 10.6 4.6.2 4.1-5.2 5.3-10.4 5.3 6.5-.2 12 1 11.9 5.9-.1 4.9-6.1 6.2-12 6M29.6 14.6l.1 4.2M29.7 41.7l.1 4.3" /></svg>
            </span>
            <div className="pa-panel" aria-label="Vista previa del panel del Portfolio Adelin">
              <div className="pa-panel-barra">
                <span className="fh-ventana-puntos" aria-hidden="true"><i /><i /><i /></span>
                <span className="pa-pestanas" aria-hidden="true">
                  <span className="is-activa">{spot.label}</span>
                  <span>{dca.label}</span>
                </span>
                <span className="pa-vivo"><span aria-hidden="true" />En vivo</span>
              </div>

              <div className="pa-panel-cuerpo">
                <div className="pa-kpis">
                  <div className="pa-kpi pa-kpi--principal">
                    <span className="fh-cifra-label">Valor actual</span>
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
                    <span className="fh-cifra-label">Invertido</span>
                    <span className="pa-velo pa-velo--medio" aria-hidden="true" />
                    <small>Coste de entrada</small>
                  </div>
                  <div className="pa-kpi">
                    <span className="fh-cifra-label">Posiciones</span>
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
                <span className="pa-candado-icono"><Lock size={17} strokeWidth={2.6} aria-hidden="true" /></span>
                <p>
                  {resumen
                    ? <><strong>{resumen.posiciones} posiciones reales</strong> con su precio de entrada</>
                    : <><strong>Todas las posiciones</strong> con su precio de entrada</>}
                </p>
                {!isPremium && (
                  <TeclaPremium tamano="peq" />
                )}
              </div>
            </div>

            {/* Un pósit pegado al panel. Decorativo: lo que dice ya está en la página. */}
            <div className="pa-flota" aria-hidden="true">
              <span className="pa-flota-icono"><CoinGeckoGlyph size={16} /></span>
              <span><b>Precios de CoinGecko</b><small>al abrir y al refrescar</small></span>
            </div>
          </div>
        </section>

        {/* ── Las cifras, calculadas al abrir ─────────────────────────────── */}
        {resumen && (
          <section className="fh-bloque pa-cifras" aria-labelledby="pa-cifras-titulo">
            {/* Solo en el ordenador (19-11-2026, pedido por el admin): en el
                hueco de la derecha, «¡datos reales!» a mano en rojo y una
                flecha grande a rotulador que baja a los tiques. Decoración. */}
            <span className="pa-reales" aria-hidden="true">
              <span className="pa-reales-texto">¡datos reales!</span>
              <SimboloEstudio tipo="flecha" color="coral" giro={78} tamano={120} semilla={21} retraso={400} className="pa-reales-flecha" />
            </span>
            <div className="pa-cabeza">
              <span className="fh-kicker"><Radio size={14} aria-hidden="true" /> Calculado ahora mismo</span>
              <h2 id="pa-cifras-titulo" className="fh-h2">Números que no se pueden <Anotacion tipo="circle" color="var(--menta)">maquillar</Anotacion></h2>
              <p className="pa-p">
                Salen de la cartera de verdad y de los precios de mercado de este momento. Si fueran negativos, se
                verían igual.
              </p>
            </div>

            {/* Rediseñada de cero (19-11-2026, pedido por el admin): de cuatro
                tarjetas a dos tiques, uno por cartera, con su cifra grande y
                su detalle en una línea. Spot en lila y DCA en naranja, como
                en la cabecera. */}
            <div className="pa-tiques">
              <div className="pa-tique pa-tique--spot">
                <span className="pa-tique-cab">
                  <span className="pa-tique-icono" aria-hidden="true"><Layers size={16} strokeWidth={2.4} /></span>
                  Cartera spot
                </span>
                <b className="pa-tique-cifra">{pct(resumen.rentabilidadPct)}</b>
                <span className="pa-tique-detalle">
                  {resumen.posiciones} posiciones{resumen.desdeAnio ? ` · desde ${resumen.desdeAnio}` : ""}
                </span>
                {conPrecio > 0 && (
                  <span className="pa-tique-balanza">
                    <span className="pa-tique-barra" aria-hidden="true">
                      <i style={{ width: `${(resumen.enGanancias / conPrecio) * 100}%` }} />
                    </span>
                    <span className="pa-tique-leyenda">
                      <span className="es-sube">{resumen.enGanancias} en verde</span>
                      <span className="es-baja">{resumen.enPerdidas} en rojo</span>
                    </span>
                  </span>
                )}
              </div>

              {resumen.dca && (
                <div className="pa-tique pa-tique--dca">
                  <span className="pa-tique-cab">
                    <span className="pa-tique-icono" aria-hidden="true"><Bitcoin size={16} strokeWidth={2.4} /></span>
                    DCA de bitcoin
                  </span>
                  <b className="pa-tique-cifra">{pct(resumen.dca.rentabilidadPct)}</b>
                  <span className="pa-tique-detalle">
                    {resumen.dca.compras} compras, cada una con su fecha y su precio
                    {resumen.dca.desdeAnio ? ` · desde ${resumen.dca.desdeAnio}` : ""}
                  </span>
                </div>
              )}
            </div>

            <p className="pa-cifras-nota pa-tiques-nota">
              Sin importes a propósito: el capital no prueba nada. <strong>La rentabilidad, sí.</strong>
            </p>
          </section>
        )}

        {/* ── Dos carteras ────────────────────────────────────────────────── */}
        <section className="fh-bloque" aria-labelledby="pa-carteras-titulo">
          <div className="pa-cabeza">
            <span className="fh-kicker"><PieChart size={14} aria-hidden="true" /> Lo que hay dentro</span>
            <h2 id="pa-carteras-titulo" className="fh-h2">
              {/* «Dos carteras», destacado (19-11-2026): el «dos» rodeado a
                  rotulador y «carteras» con fluorescente. */}
              <span className="pa-dos"><span className="pa-dos-num">Dos</span> <span className="pa-dos-marca">carteras</span></span>, cada una por su lado
            </h2>
            <p className="pa-p">
              No se suman a propósito: el DCA y las compras puntuales son estrategias distintas, y una media de las
              dos no describiría a ninguna.
            </p>
          </div>

          <div className="pa-carteras">
            {/* ── Spot ── */}
            <article className="pa-cartera pa-cartera--spot">
              <header className="pa-cartera-cab">
                <span className="pa-cartera-icono" aria-hidden="true"><Layers size={20} strokeWidth={2.4} /></span>
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
            <article className="pa-cartera pa-cartera--dca">
              <header className="pa-cartera-cab">
                <span className="pa-cartera-icono" aria-hidden="true"><Bitcoin size={20} strokeWidth={2.4} /></span>
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
                <Target size={14} aria-hidden="true" />
                Incluye una proyección a un precio redondo, rotulada como supuesto: no es una previsión.
              </p>
            </article>
          </div>
        </section>

        {/* ── Qué se aprende ──────────────────────────────────────────────── */}
        <section className="fh-bloque pa-ap" aria-labelledby="pa-aprende-titulo">
          {/* Rediseñada el 19-11-2026 (pedido por el admin): título con
              «copiar» tachado y «gestionar» marcado, y los tres puntos como
              apuntes de una sola línea con su número a mano. */}
          <div className="pa-cabeza">
            <span className="pa-ap-nota">Para qué sirve</span>
            <h2 id="pa-aprende-titulo" className="fh-h2 pa-ap-titulo">
              No es para <s className="pa-ap-tachon">copiar</s>. Es para aprender a{" "}
              <span className="pa-ap-marca">gestionar</span>
            </h2>
            {/* Solo en el ordenador (19-11-2026): garabatos de lo que se
                aprende, una balanza, una tirita sobre una vela roja y un
                calendario con sus marcas. Decoración. */}
            <span className="pa-ap-garabatos" aria-hidden="true">
              <svg className="pa-apg pa-apg--balanza" viewBox="0 0 80 70"><path d="M40.3 8.2c.4 17.4-.3 36.1.2 52.6M24.6 62.1c10.4-.5 20.5.4 31.2-.2M12.4 18.6c18.2-2.1 37.4-1.6 55.6-.3M12.6 18.9C9.4 26.8 6.2 33.4 3.6 40.2c5.9 4.1 13.6 4.4 19.4.2-3.4-7.1-6.6-14.1-10.4-21.5zM67.8 18.4c-3.6 7.6-6.8 14.6-9.6 21.6 6 4.2 13.7 4.2 19.3-.1-3.2-7.2-6.2-14.2-9.7-21.5zM38.1 8.6c1.4-1.8 3.5-1.6 4.6.1" /></svg>
              <svg className="pa-apg pa-apg--vela" viewBox="0 0 60 80"><path d="M30.4 4.6c-.3 22.6.4 47.9-.2 70.6M20.2 18.4c6.8-.4 13.4.3 20.1-.2.4 13.6-.3 27.3.2 40.7-6.7.4-13.6-.2-20.3.2-.3-13.4.2-27.2 0-40.7zM12.4 34.6c11.6-6.2 23.8-7.4 35.4-1.8M12.2 44.8c11.8-6 24.2-6.8 35.8-1.4M22.6 32.8c.6 4 1 7.9 1.2 11.8M36.4 31.6c.4 4 .7 8 .6 12" /></svg>
              <svg className="pa-apg pa-apg--calendario" viewBox="0 0 70 70"><path d="M8.4 14.2c17.8-.6 36.4.4 53.6-.2.6 15.6-.3 31.8.3 47.4-17.8.5-35.8-.3-53.6.2-.5-15.8.2-31.6-.3-47.4zM8.6 26.4c17.6-.3 35.6.4 53.4-.1M20.2 6.4c.2 4 .3 8 .1 11.8M49.6 6.2c.3 4.1.2 8 .1 12M15.6 37.2l4.6 4.8 7.8-9.6M33.4 37.4l4.4 4.6 7.6-9.2M15.4 50.4l4.8 4.6 7.6-9.4M33.6 50.6l4.4 4.8 7.8-9.6M50.4 36.4c2.6 2 5.2 4.4 7.6 6.6M58 36.2c-2.4 2.3-4.8 4.8-7.4 7" /></svg>
            </span>
          </div>
          <ol className="pa-ap-lista">
            {APRENDES.map(({ icon: Icon, color, titulo, texto, termino }, i) => (
              <li key={titulo} className={`pa-ap-punto pa-ap-punto--${color}`}>
                <span className="pa-ap-num" aria-hidden="true">{i + 1}</span>
                <span className="pa-ap-texto">
                  <strong><Icon size={16} strokeWidth={2.4} aria-hidden="true" /> {titulo}</strong>
                  <span><ConTermino text={texto} termino={termino} /></span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Frente a lo habitual ────────────────────────────────────────── */}
        <section className="fh-bloque pa-vs" aria-labelledby="pa-versus-titulo">
          {/* Rediseñada de cero (19-11-2026, pedido por el admin): como una
              corrección en el cuaderno. Cada fila, lo de las redes tachado en
              coral y, debajo, lo que hay aquí, a mano y con su check verde. */}
          <div className="pa-cabeza">
            <h2 id="pa-versus-titulo" className="fh-h2">
              Lo que suele enseñarse, y <span className="pa-vs-marca">lo que ves aquí</span>
            </h2>
            {/* Solo en el ordenador: un móvil con su «me gusta» (las redes) y
                un cuaderno con su check (lo de aquí). Decoración. */}
            <span className="pa-vs-garabatos" aria-hidden="true">
              <svg className="pa-vsg pa-vsg--movil" viewBox="0 0 60 90"><path d="M12.6 6.4c11.6-.6 23.8.3 35.2-.2 1.6 25.6-.4 52.4.4 77.6-11.8.6-23.8-.2-35.6.2-.6-25.8.4-51.8 0-77.6zM12.8 16.4c11.6-.2 23.4.3 35-.1M12.6 72.6c11.8-.3 23.4.3 35.2-.1M26.4 78.4c2.4-.2 4.8 0 7.2-.1M30.2 50.6c-6.8-4.8-11.4-9.2-9.8-14.2 1.4-4.2 7.2-4.8 9.6-.6 2.6-4.4 8.6-3.6 9.8.8 1.4 5-3.6 9.4-9.6 14z" /></svg>
              <svg className="pa-vsg pa-vsg--cuaderno" viewBox="0 0 80 80"><path d="M14.6 8.4c17.4-.6 35.4.4 52.6-.2.6 20.6-.3 42.6.3 63.4-17.6.5-35.2-.3-52.8.2-.5-21 .3-42.4-.1-63.4zM8.4 18.4c4.2-.2 8.2.2 12.2 0M8.2 32.6c4.2-.3 8.4.2 12.4-.1M8.6 46.8c4-.2 8.2.3 12.2 0M8.4 61.2c4.2-.3 8.2.2 12.4-.1M30.6 40.4l9.2 10.4 17.4-24.6" /></svg>
            </span>
            <p className="pa-vs-leyenda" aria-hidden="true">
              <span className="pa-vs-pildora pa-vs-pildora--no"><X size={13} strokeWidth={3.2} /> En redes</span>
              <span className="pa-vs-pildora pa-vs-pildora--si"><Check size={13} strokeWidth={3.2} /> Portfolio Adelin</span>
            </p>
          </div>
          {/* En el ordenador (19-11-2026, rehecha de cero a petición del admin):
              dos hojas enfrentadas con un «vs» a mano en medio. La de la
              izquierda, lo de las redes tachado; la de la derecha, más grande,
              lo de aquí. En el móvil se usa la lista de abajo; cada una se
              oculta donde no toca, así nadie lee lo mismo dos veces. */}
          <div className="pa-vs-pc">
            <div className="pa-vs-hoja pa-vs-hoja--no">
              <p className="pa-vs-hoja-cab">
                <span className="pa-vs-hoja-nota">En redes</span>
                te enseñan <span className="pa-vs-hoja-mano">solo lo bonito</span>
              </p>
              <ul>
                {COMPARA.map((c) => (
                  <li key={c.otros}>
                    <span className="pa-vs-aspa" aria-hidden="true"><X size={14} strokeWidth={3.4} /></span>
                    <s>{c.otros}</s>
                  </li>
                ))}
              </ul>
            </div>
            <span className="pa-vs-vs" aria-hidden="true">vs</span>
            <div className="pa-vs-hoja pa-vs-hoja--si">
              <p className="pa-vs-hoja-cab">
                <span className="pa-vs-hoja-nota">Aquí</span>
                lo ves <span className="pa-vs-hoja-mano">todo, tal cual</span>
              </p>
              <ul>
                {COMPARA.map((c) => (
                  <li key={c.aqui}>
                    <span className="pa-vs-check" aria-hidden="true"><Check size={14} strokeWidth={3.4} /></span>
                    {c.aqui}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <ol className="pa-vs-lista">
            {COMPARA.map((c) => (
              <li key={c.aqui} className="pa-vs-fila">
                <span className="pa-vs-no">
                  <span className="sr-only">En redes: </span>
                  <s>{c.otros}</s>
                </span>
                <span className="pa-vs-si">
                  <span className="pa-vs-check" aria-hidden="true"><Check size={14} strokeWidth={3.4} /></span>
                  <span><span className="sr-only">Aquí: </span>{c.aqui}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Qué no es ───────────────────────────────────────────────────── */}
        {/* Rediseñada el 19-11-2026 (pedido por el admin): un pósit lila con
            su celo, lo que NO es en cuatro líneas con su aspa a rotulador, y
            la nota final a mano. */}
        <section className="fh-bloque pa-noes" aria-labelledby="pa-noes-titulo">
          <h2 id="pa-noes-titulo" className="pa-noes-titulo">
            Para que nadie se lleve <span className="pa-noes-mano">otra idea</span>
          </h2>
          <ul className="pa-noes-lista">
            {NO_ES.map((n) => (
              <li key={n}>
                <span className="pa-noes-aspa" aria-hidden="true"><X size={14} strokeWidth={3.4} /></span>
                {n}
              </li>
            ))}
          </ul>
          <p className="pa-noes-nota">
            Solo compras en spot: sin <Link href="/glosario/futuros">futuros</Link> ni{" "}
            <Link href="/glosario/apalancamiento">apalancamiento</Link>. Es para consultar, no una orden de compra.
          </p>
        </section>

        {/* ── Precio y llamada final: la tarjeta Premium, la misma que en los
            cursos (TarjetaPremium.tsx), con el portfolio destacado. ── */}
        <TarjetaPremium aqui="portfolio" esPremium={isPremium} accionPremium={<Cta premium grande />} />

        {/* Sin descargo propio (19-11-2026, pedido por el admin): ya lo cubre
            el aviso de riesgo del pie de página. */}
      </main>

      <Footer />
    </div>
  );
}
