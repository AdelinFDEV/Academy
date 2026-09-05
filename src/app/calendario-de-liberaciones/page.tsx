import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Unlock, CalendarClock, PieChart, Users, LineChart, Search, ArrowRight,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import { TOKENS } from "@/app/herramientas/liberaciones/tokenData";
import "../herramientas/detalle.css";

/**
 * Ficha pública del calendario de liberaciones — punto 13 del plan SEO.
 *
 * Vive en la raíz por lo mismo que `/radar-diario`: `/herramientas/liberaciones`
 * la ocupa la herramienta de pago y `robots.txt` bloquea **por prefijo**, así
 * que cualquier URL que empiece igual habría quedado sin rastrear.
 *
 * Es la ficha con mejor retorno esperado de las cinco: «liberaciones de tokens»
 * y «unlocks de <token>» son búsquedas concretas, con intención clara y poca
 * competencia en español.
 *
 * ⚠️ Escrito sobre lo que la herramienta hace HOY, leído en `page.tsx` y
 * `LiberacionesClient.tsx`: **es Premium entera**. El cliente tiene lista una
 * vista parcial con dos tokens abiertos (`FREE_TOKEN_IDS`), pero `page.tsx`
 * manda a `/premium` a quien no lo sea, así que hoy nadie llega a verla. El
 * catálogo decía «cuenta gratuita» y se corrigió el 06-09-2026.
 */
export const metadata: Metadata = {
  title: "Calendario de liberaciones de tokens",
  description:
    "Qué tokens desbloquean monedas nuevas, cuándo y cuántas. Diez proyectos con datos en vivo de DefiLlama para no comprar justo antes de un unlock.",
  alternates: { canonical: "/calendario-de-liberaciones" },
};

/** Los tokens rastreados salen del mismo archivo que alimenta la herramienta. */
const SIMBOLOS = TOKENS.map((t) => ({ symbol: t.symbol, name: t.name, color: t.color }));

const DENTRO = [
  {
    icon: CalendarClock,
    title: "La fecha del próximo desbloqueo",
    text: "De cada uno de los diez tokens, con la cuenta atrás en días y un aviso visual cuando quedan menos de una o dos semanas.",
  },
  {
    icon: LineChart,
    title: "Cuántas monedas entran",
    text: "La cantidad concreta que se libera y qué representa sobre lo que ya circula. No es lo mismo un 0,5 % que un 12 %.",
  },
  {
    icon: PieChart,
    title: "El reparto completo del suministro",
    text: "Qué porcentaje se llevaron el equipo, los inversores, la fundación y la comunidad, con el calendario de cada bloque y su cliff.",
  },
  {
    icon: Users,
    title: "Quién recibe cada paquete",
    text: "Un desbloqueo de la tesorería de una fundación y otro de inversores que entraron a céntimos no presionan igual el precio.",
  },
  {
    icon: Search,
    title: "Ficha propia por token",
    text: "Cada uno con sus gráficas de emisión y el detalle de su calendario, para mirarlo antes de entrar a largo plazo.",
  },
  {
    icon: Unlock,
    title: "Datos en vivo",
    text: "Las cifras se leen del conjunto de datos público de DefiLlama, no de una tabla escrita a mano que envejece sola.",
  },
];

const FAQ = [
  {
    q: "¿Qué es una liberación de tokens?",
    a: "Es el momento en que un paquete de monedas que estaba bloqueado por contrato pasa a poder venderse. Los proyectos reservan monedas para el equipo, los inversores iniciales y la tesorería, y se comprometen a no soltarlas de golpe: las van liberando durante meses o años según un calendario llamado vesting.",
  },
  {
    q: "¿Por qué debería importarme antes de comprar?",
    a: "Porque aparece oferta nueva que antes no existía. Si el lunes se pueden vender millones de monedas que llevaban dos años inmovilizadas, y quienes las reciben entraron a un precio muy inferior al de hoy, hay una presión vendedora real y anunciada de antemano. Comprar justo antes de un desbloqueo grande es una de las formas más comunes y más evitables de perder dinero.",
  },
  {
    q: "¿El precio baja siempre el día del desbloqueo?",
    a: "No, y quien diga lo contrario simplifica de más. El mercado suele anticiparlo, así que a veces la caída llega antes; y si hay demanda suficiente, puede no llegar. Un desbloqueo no es una señal de venta automática: es un dato de contexto, y pesa mucho más cuando el paquete que entra es grande comparado con lo que ya circula.",
  },
  {
    q: "¿Qué tokens se siguen?",
    a: `Diez: ${SIMBOLOS.map((t) => t.symbol).join(", ")}. Son proyectos con calendarios de vesting largos todavía en curso, que es donde el dato cambia una decisión de compra.`,
  },
  {
    q: "¿De dónde salen los datos?",
    a: "Del conjunto de datos público de DefiLlama, que agrega los calendarios de emisión declarados por cada proyecto. El reparto del suministro entre equipo, inversores, fundación y comunidad está contrastado proyecto a proyecto.",
  },
  {
    q: "¿Puedo ver el calendario de cualquier token?",
    a: "No. La herramienta sigue diez proyectos concretos, elegidos por tener vesting largo aún en marcha. No es un buscador universal de unlocks.",
  },
  {
    q: "¿Me avisa cuando se acerca un desbloqueo?",
    a: "No hay notificaciones ni alertas. La herramienta muestra la cuenta atrás y resalta lo que queda a menos de una o dos semanas, pero eres tú quien la consulta.",
  },
  {
    q: "¿Cómo accedo?",
    a: "Está incluido en la suscripción Premium, junto con el resto de herramientas de la academia. No se vende por separado.",
  },
];

export default async function FichaLiberacionesPage() {
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
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Inicio", item: "/" },
              { "@type": "ListItem", position: 2, name: "Herramientas", item: "/herramientas" },
              { "@type": "ListItem", position: 3, name: "Calendario de liberaciones" },
            ],
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

      <SiteNav user={!!user} isPremium={isPremium} isAdmin={role === "admin"} />

      <main
        className="blog-main det-main"
        style={{ "--det-accent": "#34d399", "--det-accent-2": "#a7f3d0" } as React.CSSProperties}
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
          <span>Calendario de liberaciones</span>
        </nav>

        {/* ── Hero ── */}
        <header className="det-hero">
          <span className="det-hero-watermark" aria-hidden="true">10</span>

          <span className="det-eyebrow">
            <span className="det-eyebrow-dot" aria-hidden="true" />
            Incluido en Premium
          </span>

          <h1 className="det-title">
            Calendario de liberaciones de tokens
            <span className="det-title-grad">Mira quién va a vender antes de comprar.</span>
          </h1>

          <p className="det-lead">
            Qué proyectos desbloquean monedas nuevas, <strong>qué día y
            cuántas</strong>. Es información pública y anunciada con años de
            antelación, y casi nadie la mira antes de entrar.
          </p>

          <div className="det-stats">
            <div className="det-stat">
              <span className="det-stat-value">{SIMBOLOS.length}</span>
              <span className="det-stat-label">Tokens rastreados</span>
            </div>
            <div className="det-stat">
              <span className="det-stat-value">4</span>
              <span className="det-stat-label">Bloques por proyecto</span>
            </div>
            <div className="det-stat">
              <span className="det-stat-value">En vivo</span>
              <span className="det-stat-label">Datos de DefiLlama</span>
            </div>
          </div>
        </header>

        <div className="det-pilares">
          <div className="det-pilar">
            <span className="det-pilar-num">01</span>
            <span className="det-pilar-title">Es previsible</span>
            <span className="det-pilar-desc">
              A diferencia de casi todo en cripto, las fechas están publicadas
              de antemano. Solo hay que mirarlas.
            </span>
          </div>
          <div className="det-pilar">
            <span className="det-pilar-num">02</span>
            <span className="det-pilar-title">No solo la fecha</span>
            <span className="det-pilar-desc">
              También cuánto entra, qué parte del circulante supone y a quién le
              toca cobrarlo.
            </span>
          </div>
          <div className="det-pilar">
            <span className="det-pilar-num">03</span>
            <span className="det-pilar-title">Sin adornos</span>
            <span className="det-pilar-desc">
              Un desbloqueo no es una señal de venta. Aquí es contexto para
              decidir, no una recomendación.
            </span>
          </div>
        </div>

        {/* ── 01 · El problema ── */}
        <section className="det-seccion">
          <header className="det-sechead">
            <span className="det-sechead-num">01</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">La moneda no estaba barata: estaba a medio repartir</h2>
              <p className="det-sechead-sub">
                El error cuesta caro y se comete por no mirar una fecha.
              </p>
            </div>
          </header>

          <div className="det-columnas">
            <p>
              Encuentras un proyecto con una{" "}
              <Link href="/glosario/market-cap">capitalización</Link> pequeña y
              piensas que aún tiene recorrido. Compras. Tres semanas después el
              precio se ha ido a la mitad sin que haya pasado nada malo con el
              proyecto: simplemente entraron en circulación millones de monedas
              que llevaban dos años bloqueadas.
            </p>
            <p>
              Es lo que se llama una{" "}
              <Link href="/glosario/liberacion-de-tokens">liberación de tokens</Link>, y
              obedece al{" "}
              <Link href="/glosario/vesting">vesting</Link>: el calendario que
              impide al equipo y a los inversores iniciales vender todo el
              primer día. Existe por una buena razón —alinea intereses— pero
              tiene una consecuencia directa para quien compra después:
              <strong> hay oferta futura garantizada, con fecha</strong>.
            </p>
            <p>
              Y aquí está lo que hace este dato distinto de casi todo lo demás
              en cripto: <strong>no hay que adivinarlo</strong>. Las fechas y
              las cantidades están escritas en la documentación de cada
              proyecto desde el primer día. Consultarlo cuesta un minuto. No
              consultarlo es lo caro.
            </p>
          </div>
        </section>

        {/* ── 02 · Qué hay dentro ── */}
        <section className="det-seccion det-seccion--panel">
          <header className="det-sechead">
            <span className="det-sechead-num">02</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">Qué encuentras dentro</h2>
              <p className="det-sechead-sub">
                Seis bloques, y una ficha propia por token.
              </p>
            </div>
          </header>

          <div className="det-grid">
            {DENTRO.map((d, i) => {
              const Icon = d.icon;
              return (
                <article key={d.title} className="det-card">
                  <span className="det-card-num" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="det-card-icon" aria-hidden="true">
                    <Icon size={19} strokeWidth={2} />
                  </span>
                  <h3 className="det-card-title">{d.title}</h3>
                  <p className="det-card-text">{d.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── 03 · Los tokens ── */}
        <section className="det-seccion">
          <header className="det-sechead">
            <span className="det-sechead-num">03</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">Los {SIMBOLOS.length} proyectos que se siguen</h2>
              <p className="det-sechead-sub">
                Elegidos por tener vesting largo todavía en marcha, que es donde
                el dato cambia una decisión.
              </p>
            </div>
          </header>

          {/* La lista sale de `tokenData.ts`, el mismo archivo que alimenta la
              herramienta: añadir un token allí lo añade aquí, y el recuento del
              hero y del título se ajusta solo. */}
          <div className="det-anatomia">
            {SIMBOLOS.map((t) => (
              <div key={t.symbol} className="det-lectura">
                <span className="det-lectura-cifra" style={{ color: t.color }}>
                  {t.symbol}
                </span>
                <span>
                  <span className="det-lectura-title">{t.name}</span>
                  <span className="det-lectura-text">
                    Próximo desbloqueo, cantidad y reparto del suministro entre
                    equipo, inversores, fundación y comunidad.
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── 04 · Cómo se lee ── */}
        <section className="det-seccion det-seccion--panel">
          <header className="det-sechead">
            <span className="det-sechead-num">04</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">Cómo se lee un desbloqueo</h2>
              <p className="det-sechead-sub">
                La fecha sola no dice gran cosa. Son tres preguntas.
              </p>
            </div>
          </header>

          <div className="det-columnas">
            <p>
              <strong>Primera: ¿cuánto entra comparado con lo que ya
              circula?</strong> Un desbloqueo de un 0,5 % de la{" "}
              <Link href="/glosario/oferta-circulante">oferta circulante</Link>{" "}
              es ruido. Uno del 15 % es otra cosa. La cifra absoluta impresiona
              y engaña; la proporción es la que importa.
            </p>
            <p>
              <strong>Segunda: ¿a quién le toca?</strong> No presiona igual un
              paquete que va a la tesorería de una fundación, que lo usará para
              subvenciones a lo largo de meses, que uno que va a inversores que
              entraron a céntimos hace tres años y llevan desde entonces
              esperando poder vender.
            </p>
            <p>
              <strong>Tercera: ¿es el primero tras el cliff?</strong> Muchos
              calendarios no liberan nada durante el primer año y después
              sueltan de golpe un paquete grande. Ese primer desbloqueo suele
              ser el más abultado de toda la serie, y el que más se nota.
            </p>
            <p>
              Con esas tres respuestas, el dato deja de ser una fecha suelta y
              pasa a ser contexto útil. Lo que no te va a dar —ni esto ni nada—
              es la certeza de qué hará el precio.
            </p>
          </div>
        </section>

        {/* ── 05 · Qué NO es ── */}
        <section className="det-seccion">
          <header className="det-sechead">
            <span className="det-sechead-num">05</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">Qué NO es</h2>
              <p className="det-sechead-sub">
                Mejor decirlo antes de que pagues.
              </p>
            </div>
          </header>

          <div className="det-grid">
            <article className="det-card">
              <h3 className="det-card-title">No es un buscador universal</h3>
              <p className="det-card-text">
                Sigue {SIMBOLOS.length} proyectos concretos. Si te interesa un
                token que no está en la lista, esta herramienta no lo cubre.
              </p>
            </article>
            <article className="det-card">
              <h3 className="det-card-title">No manda alertas</h3>
              <p className="det-card-text">
                No hay notificaciones ni avisos por Telegram. Resalta lo que
                queda a menos de una o dos semanas, pero la consultas tú.
              </p>
            </article>
            <article className="det-card">
              <h3 className="det-card-title">No predice el precio</h3>
              <p className="det-card-text">
                Un desbloqueo no implica una caída. El mercado suele
                anticiparlo, y a veces no pasa nada.
              </p>
            </article>
            <article className="det-card">
              <h3 className="det-card-title">No da señales</h3>
              <p className="det-card-text">
                No hay «vende antes del unlock». Es un dato de contexto; la
                decisión y sus consecuencias son tuyas.
              </p>
            </article>
          </div>
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

        <DisclaimerRiesgo variante="general" />

        {/* ── Cierre ── */}
        <section className="det-final">
          <span className="det-final-watermark" aria-hidden="true">10</span>
          <h2 className="det-final-title">Comprueba el calendario antes de entrar</h2>
          <p className="det-final-sub">
            Va incluido en Premium, junto con el{" "}
            <Link href="/radar-diario">radar diario</Link>, el{" "}
            <Link href="/herramientas/portfolio">portfolio</Link>, el{" "}
            <Link href="/trading-en-directo">directo</Link> y el resto de{" "}
            <Link href="/herramientas">herramientas</Link>. Una sola cuota.
          </p>
          <div className="det-actions">
            {isPremium ? (
              <Link href="/herramientas/liberaciones" className="det-btn">
                Abrir el calendario
                <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link href="/premium" className="det-btn">
                  Ver qué incluye Premium
                  <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
                </Link>
                {!user && (
                  <Link href="/login?next=/herramientas/liberaciones" className="det-btn det-btn--ghost">
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
