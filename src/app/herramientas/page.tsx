import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, Lock } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { HERRAMIENTAS, HERRAMIENTAS_DISPONIBLES, ETIQUETA_ACCESO, detalleDe, sinSalida, type Herramienta } from "@/lib/herramientas";
import { resumenPortfolioPublico } from "@/lib/portfolio-publico";
import "./detalle.css";
import "./herramientas.css";

/**
 * Landing pública de las herramientas — punto 13 del plan SEO.
 *
 * Es el **tercer pilar** de la academia y hasta el 04-09-2026 no tenía ni una
 * URL indexable. Esta página es la puerta a todas, y la que Google lee.
 *
 * Reconstruida el 05-09-2026 sobre el sistema visual de las fichas
 * (`detalle.css`): la primera versión usaba `var(--surface-card, #fff)` y las
 * tarjetas salían **en blanco** sobre el fondo oscuro, porque se escribió
 * antes de que existiera ese sistema.
 *
 * Dos decisiones de estructura, ambas del admin:
 *  · Se agrupan **por lo que quieres hacer**, no por precio. Un visitante no
 *    llega buscando «herramientas premium», llega buscando saber cuánto
 *    arriesgar o si su moneda puede llegar a X.
 *  · Cada herramienta enseña **un dato real** cuando existe. Nada inventado
 *    donde no lo hay.
 */
export const metadata: Metadata = {
  title: "Herramientas de trading e inversión",
  description:
    "Diez herramientas para decidir cuánto arriesgar, seguir el mercado y aprender de tus operaciones. Varias se usan gratis y sin registro.",
  alternates: { canonical: "/herramientas" },
};

/**
 * Los cuatro momentos en los que una herramienta sirve de algo.
 *
 * El orden sigue el recorrido real de una operación —decidir, vigilar,
 * repasar— y deja al final las dos que enseñan cómo opero yo, que son las que
 * más venden pero las que menos ayudan a alguien que empieza.
 */
const GRUPOS: { num: string; titulo: string; sub: string; ids: string[] }[] = [
  {
    num: "01",
    titulo: "Antes de entrar: decidir con criterio",
    sub: "Las dos preguntas que conviene responder antes de poner dinero: si el objetivo se sostiene y cuánto puedes arriesgar sin romperte.",
    ids: ["prediccion", "riesgo"],
  },
  {
    num: "02",
    titulo: "Mientras tanto: seguir el mercado",
    sub: "Lo que se mueve hoy, lo que se libera esta semana y las monedas que estás vigilando.",
    ids: ["radar", "liberaciones", "watchlist"],
  },
  {
    num: "03",
    titulo: "Después: llevar tus cuentas y aprender",
    sub: "La parte que casi nadie hace, y la que separa a quien mejora de quien repite los mismos errores.",
    ids: ["diario", "mi-portfolio", "logros", "cursos"],
  },
  {
    num: "04",
    titulo: "Y de paso, ver cómo lo hago yo",
    sub: "Mi cartera real y mi operativa en directo. No para copiarlas: para ver el razonamiento completo, incluidas las veces que sale mal.",
    ids: ["portfolio", "directo"],
  },
];

const FAQ = [
  {
    q: "¿Cuáles puedo usar sin pagar?",
    a: "La calculadora de predicción de precio se usa sin registrarse siquiera. Con una cuenta gratuita entran además la calculadora de riesgo y la watchlist. El resto va en Premium, y de todas ellas puedes leer antes qué hacen en su propia página de detalles.",
  },
  {
    q: "¿Hay que comprar cada herramienta por separado?",
    a: "No. Todo lo que no es gratuito entra en la misma suscripción Premium de 49,99 €/mes, sin extras ni compras sueltas. Y lo que se lance a partir de ahora entra también, sin subir el precio a quien ya está suscrito.",
  },
  {
    q: "¿Alguna se conecta a mi exchange o opera por mí?",
    a: "Ninguna. No hay conexión con exchanges, ni ejecución automática, ni acceso a tus fondos. Todas son herramientas de consulta y registro: los datos los introduces tú o son públicos de mercado.",
  },
  {
    q: "¿Son señales de compra o venta?",
    a: "No. Ninguna herramienta te dice qué comprar ni cuándo. Sirven para que decidas tú con más información, y la decisión y su resultado son siempre responsabilidad tuya.",
  },
  {
    q: "¿De dónde salen los datos de mercado?",
    a: "Los precios y capitalizaciones vienen de CoinGecko, el calendario de desbloqueos de DefiLlama y el índice de miedo y codicia de alternative.me. Son fuentes públicas y los datos pueden llevar unos minutos de retardo.",
  },
];

/** Un dato real por herramienta, cuando existe. Nada inventado donde no lo hay. */
type Datos = Record<string, string | undefined>;

export default async function HerramientasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let role = "free";
  let userName = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? "free";
    userName = profile?.full_name ?? user.email?.split("@")[0] ?? "Usuario";
  }
  const isPremium = role === "premium" || role === "admin";

  // Única consulta viva de la página. Si falla, la tarjeta del portfolio se
  // queda sin su dato y el resto no se entera.
  const resumen = await resumenPortfolioPublico();

  const datos: Datos = {
    portfolio: resumen
      ? `${resumen.rentabilidadPct >= 0 ? "+" : ""}${resumen.rentabilidadPct.toFixed(1).replace(".", ",")} % en la cartera real`
      : undefined,
    directo: "Solo NASDAQ en 5 min · martes y jueves",
    diario: "10 estadísticas automáticas",
    liberaciones: "10 tokens rastreados",
    riesgo: "Tamaño de posición en 4 datos",
    prediccion: "Sin registro, al instante",
    radar: "Macro de EE. UU. en hora española",
    watchlist: "Precios en vivo",
    "mi-portfolio": "Precio medio ponderado",
    logros: "Insignias por actividad",
  };

  /**
   * A dónde manda cada tarjeta a quien la pulsa.
   *
   * Nunca a una ruta que vaya a rebotarle: eso es justo lo que hacía que
   * Google no indexara nada de aquí.
   */
  /*
   * Aquí el botón principal NO usa `destinoPorRuta`, y es a propósito: en esta
   * página el botón fantasma «Ver detalles» ya lleva a la ficha, así que mandar
   * los dos al mismo sitio dejaría la tarjeta sin acción de compra. En los
   * menús, donde no hay segundo botón, sí manda la ficha.
   */
  function destino(h: Herramienta): string {
    if (h.acceso === "gratis") return h.href ?? "/herramientas";
    if (h.acceso === "cuenta") return user ? h.premiumHref ?? "/dashboard" : "/register";
    // Lo que aún no existe no se vende: «Ver Premium» llevaría a pagar por
    // algo que no hay. Va a su ficha, que dice en qué punto está.
    if (h.acceso === "proximamente") return detalleDe(h);
    return isPremium ? h.premiumHref ?? "/dashboard" : "/premium";
  }

  function etiquetaCta(h: Herramienta): string {
    if (h.acceso === "gratis") return "Abrir";
    if (h.acceso === "cuenta") return user ? "Abrir" : "Crear cuenta gratis";
    if (h.acceso === "proximamente") return "Ver en qué punto está";
    return isPremium ? "Abrir" : "Ver Premium";
  }

  const gratuitas = HERRAMIENTAS.filter((h) => h.acceso === "gratis" || h.acceso === "cuenta").length;

  return (
    <div className="blog-page">
      <div className="bg-ambient" />
      <JsonLd
        data={[
          {
            "@type": "ItemList",
            name: "Herramientas de AdelinBTC Academy",
            itemListElement: HERRAMIENTAS.map((h, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: h.label,
              description: h.resumen,
            })),
          },
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

      <SiteNav
        user={!!user}
        isPremium={isPremium}
        userName={user ? userName : undefined}
        isAdmin={role === "admin"}
      />

      <main className="blog-main det-main">
        <div className="det-backdrop" aria-hidden="true">
          <span className="det-backdrop-grid" />
          <span className="det-orb det-orb--1" />
          <span className="det-orb det-orb--2" />
          <span className="det-orb det-orb--3" />
        </div>

        {/* ── Hero ── */}
        <header className="det-hero">
          <span className="det-hero-watermark" aria-hidden="true">{HERRAMIENTAS_DISPONIBLES.length}</span>

          <span className="det-eyebrow">
            <span className="det-eyebrow-dot" aria-hidden="true" />
            El tercer pilar
          </span>

          <h1 className="det-title">
            Herramientas de trading
            <span className="det-title-grad">Para decidir mejor, no más rápido.</span>
          </h1>

          <p className="det-lead">
            La academia tiene tres patas: las <Link href="/articulos">entradas</Link>{" "}
            explican, las <Link href="/guias">guías</Link> enseñan y estas
            herramientas son con las que se trabaja el día a día. Ninguna te dice
            qué comprar — todas sirven para que lo decidas tú con más
            información.
          </p>

          <div className="det-stats">
            <div className="det-stat">
              <span className="det-stat-value">{HERRAMIENTAS_DISPONIBLES.length}</span>
              <span className="det-stat-label">Herramientas</span>
            </div>
            <div className="det-stat">
              <span className="det-stat-value">{gratuitas}</span>
              <span className="det-stat-label">Sin pagar nada</span>
            </div>
            <div className="det-stat">
              <span className="det-stat-value">1</span>
              <span className="det-stat-label">Suscripción, sin extras</span>
            </div>
          </div>
        </header>

        {/* ── Grupos por intención ── */}
        {GRUPOS.map((g) => (
          <section key={g.num} className="det-seccion">
            <header className="det-sechead">
              <span className="det-sechead-num">{g.num}</span>
              <div className="det-sechead-text">
                <h2 className="det-h2">{g.titulo}</h2>
                <p className="det-sechead-sub">{g.sub}</p>
              </div>
            </header>

            <ul className="herr-grid">
              {g.ids.map((id) => {
                const h = HERRAMIENTAS.find((x) => x.id === id);
                if (!h) return null;
                const Icon = h.icon;
                // El candado solo donde de verdad no se puede pasar. Una
                // herramienta con ficha pública siempre tiene a dónde llevarte,
                // aunque sea de pago: ponerle candado la hace parecer un muro
                // cerrado cuando es una puerta con folleto.
                const bloqueada = sinSalida(h, { logueado: !!user, premium: isPremium });

                return (
                  <li
                    key={h.id}
                    id={h.id}
                    className="herr-card"
                    style={{ "--herr-color": h.color } as React.CSSProperties}
                  >
                    <span className="herr-card-edge" aria-hidden="true" />

                    <div className="herr-card-top">
                      <span className="herr-card-icon" aria-hidden="true">
                        <Icon size={20} strokeWidth={1.9} />
                      </span>
                      <span className={`herr-badge herr-badge--${h.acceso}`}>
                        {bloqueada && <Lock size={9} strokeWidth={2.6} aria-hidden="true" />}
                        {ETIQUETA_ACCESO[h.acceso]}
                      </span>
                    </div>

                    <h3 className="herr-card-title">{h.label}</h3>
                    <p className="herr-card-text">{h.resumen}</p>

                    {datos[h.id] && (
                      <p className="herr-card-dato">
                        <span className="herr-card-dato-dot" aria-hidden="true" />
                        {datos[h.id]}
                      </p>
                    )}

                    <div className="herr-card-actions">
                      <Link href={destino(h)} className="herr-btn">
                        {etiquetaCta(h)}
                        <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
                      </Link>
                      {/* Si los dos botones irían al mismo sitio, sobra uno. */}
                      {destino(h) !== detalleDe(h) && (
                        <Link href={detalleDe(h)} className="herr-btn herr-btn--ghost">
                          Ver detalles
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {/* ── Cómo se accede ── */}
        <section className="det-seccion det-seccion--panel">
          <header className="det-sechead">
            <span className="det-sechead-num">05</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">Qué cuesta cada cosa</h2>
              <p className="det-sechead-sub">
                Tres niveles y ninguna letra pequeña: no hay compras sueltas ni
                complementos.
              </p>
            </div>
          </header>

          <div className="det-anatomia">
            <div className="det-lectura">
              <span className="det-lectura-cifra">0 €</span>
              <span>
                <span className="det-lectura-title">Sin registro</span>
                <span className="det-lectura-text">
                  La <Link href="/calculadora">calculadora de precio objetivo</Link>{" "}
                  se abre y se usa. Tres cálculos sin cuenta, y después basta
                  con registrarse gratis.
                </span>
              </span>
            </div>

            <div className="det-lectura">
              <span className="det-lectura-cifra">0 €</span>
              <span>
                <span className="det-lectura-title">Con cuenta gratuita</span>
                <span className="det-lectura-text">
                  Calculadora de riesgo, watchlist y el calendario de
                  liberaciones con dos tokens completos. Crear la cuenta no
                  pide tarjeta.
                </span>
              </span>
            </div>

            <div className="det-lectura">
              <span className="det-lectura-cifra">49,99 €</span>
              <span>
                <span className="det-lectura-title">Premium, al mes</span>
                <span className="det-lectura-text">
                  Todo lo anterior más el diario, el portfolio, el directo, el
                  radar y las liberaciones completas. Una sola cuota, se
                  cancela en un clic y lo que se lance después entra incluido.
                </span>
              </span>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
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

        {/* ── Cierre ── */}
        <section className="det-final">
          <span className="det-final-watermark" aria-hidden="true">{HERRAMIENTAS_DISPONIBLES.length}</span>
          <h2 className="det-final-title">Empieza por lo que no cuesta nada</h2>
          <p className="det-final-sub">
            La calculadora de precio objetivo se usa sin registrarse. Si después
            quieres el resto, están todas en la misma suscripción.
          </p>
          <div className="det-actions">
            <Link href="/calculadora" className="det-btn">
              Probar sin registro
              <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
            </Link>
            <Link href="/premium" className="det-btn det-btn--ghost">
              Ver qué incluye Premium
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
