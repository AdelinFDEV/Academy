import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Radar, CalendarClock, Globe2, Gauge, TrendingUp, Clock, ArrowRight,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import { SERIES_INFO } from "@/app/herramientas/radar/macroEvents";
import "../herramientas/detalle.css";

/**
 * Ficha pública del Radar Diario — punto 13 del plan SEO.
 *
 * ── Por qué vive en la raíz y no en /herramientas/radar ────────────────────
 *
 * Esa URL ya la ocupa la herramienta de pago, y `robots.txt` la bloquea. El
 * bloqueo es **por prefijo**, así que `/herramientas/radar-diario` habría caído
 * también — el mismo fallo que dejó sin rastrear las fichas de portfolio y
 * diario el 06-09-2026. Por eso va en la raíz, igual que `/trading-en-directo`.
 *
 * El contenido está escrito leyendo `RadarClient.tsx`, `macroEvents.ts` y
 * `/api/radar`: cuatro datos macro (FOMC, IPC, PCE, IPP) mantenidos a mano
 * desde los calendarios oficiales, y el pulso de mercado de CoinGecko más el
 * índice de miedo y codicia de alternative.me. **No hay alertas, ni avisos por
 * Telegram, ni datos de inflación en vivo**: hay agenda y explicación.
 */
export const metadata: Metadata = {
  title: "Radar diario: agenda macro y Bitcoin",
  description:
    "Los datos que mueven el mercado —IPC, PCE, IPP y tipos de la Fed— con la hora ya convertida a la tuya, más el pulso de Bitcoin y el miedo y codicia.",
  alternates: { canonical: "/radar-diario" },
};

/** Las cuatro series que vigila el radar, con su explicación real. */
const SERIES = (["fomc", "cpi", "pce", "ppi"] as const).map((s) => ({
  id: s,
  ...SERIES_INFO[s],
}));

const DENTRO = [
  {
    icon: CalendarClock,
    title: "La agenda de las próximas semanas",
    text: "Las fechas de las decisiones de tipos de la Fed y de las tres publicaciones de inflación de EE. UU., con la cuenta atrás en días y el PCE marcado aparte por ser el que mira la Fed.",
  },
  {
    icon: Clock,
    title: "La hora, ya convertida",
    text: "Los datos salen a las 08:30 y las 14:00 de Nueva York. El radar los pasa a tu hora local respetando los cambios de horario de ambos lados, que se dan en semanas distintas.",
  },
  {
    icon: Globe2,
    title: "El pulso del mercado",
    text: "Precio de Bitcoin con su máximo y su mínimo de las últimas 24 horas, volumen, capitalización total del mercado y qué porcentaje de todo eso es Bitcoin.",
  },
  {
    icon: Gauge,
    title: "Miedo y codicia",
    text: "El índice que resume el ánimo del mercado en un número del 0 al 100. No predice nada, pero avisa de cuándo estás comprando en pleno euforia colectiva.",
  },
  {
    icon: TrendingUp,
    title: "Quién sube y quién baja",
    text: "Las mayores subidas y las mayores bajadas de las últimas 24 horas, para ver de un vistazo si el movimiento es general o de una moneda concreta.",
  },
  {
    icon: Radar,
    title: "Qué significa cada dato",
    text: "Cada sigla explicada en dos frases: qué mide y por qué le importa a cripto. Escrito para quien no ha estudiado economía.",
  },
];

const FAQ = [
  {
    q: "¿Qué es el Radar Diario?",
    a: "Una página que reúne, en un solo sitio, lo que puede mover el precio hoy: la agenda de datos macroeconómicos de Estados Unidos y el estado actual del mercado cripto. Está pensado para mirarlo un minuto antes de abrir una posición y saber si hay algo en el calendario que conviene esquivar.",
  },
  {
    q: "¿Por qué importan los datos de Estados Unidos si opero cripto?",
    a: "Porque el precio de las criptomonedas se mueve, sobre todo, con el apetito de riesgo global, y ese lo marca la política monetaria de la Reserva Federal. Cuando los tipos suben, el dinero se va a activos seguros y cripto sufre; cuando bajan, ocurre lo contrario. Un dato de inflación por encima de lo esperado puede tumbar el mercado en minutos.",
  },
  {
    q: "¿Qué datos concretos vigila?",
    a: "Cuatro: las decisiones de tipos de la Reserva Federal (FOMC), el IPC o índice de precios al consumo, el PCE —que es el indicador de inflación que la Fed usa para su objetivo del 2 %— y el IPP, que mide los precios mayoristas y suele adelantar a los otros dos.",
  },
  {
    q: "¿Los horarios están en mi hora?",
    a: "Sí. Las publicaciones se anuncian en horario del Este de Estados Unidos y el radar las convierte a tu zona horaria, respetando que el cambio de hora de Estados Unidos y el de Europa no caen la misma semana. Es un detalle que en otras webs sale desplazado una hora durante quince días al año.",
  },
  {
    q: "¿Los datos del mercado son en tiempo real?",
    a: "Se actualizan cada cinco minutos desde CoinGecko para precios, dominancia y volumen, y desde el índice de miedo y codicia de alternative.me. No es un terminal de trading con velas en directo: es una foto del mercado para orientarte, no para ejecutar.",
  },
  {
    q: "¿Me avisa cuando se acerca un dato?",
    a: "No. El radar no envía notificaciones ni alertas: es una página que consultas tú. Muestra la cuenta atrás en días para cada evento, pero eres tú quien decide cuándo mirarla.",
  },
  {
    q: "¿El radar dice si comprar o vender?",
    a: "No, y nunca lo hará. Enseña qué hay en la agenda y cómo está el mercado, y explica qué significa cada dato. La decisión es tuya y la responsabilidad también.",
  },
  {
    q: "¿Cómo accedo?",
    a: "Está incluido en la suscripción Premium, junto con el resto de herramientas de la academia. No se vende por separado.",
  },
];

export default async function FichaRadarPage() {
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
            { name: "Radar Diario", path: "/radar-diario" },
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
        style={{ "--det-accent": "#f472b6", "--det-accent-2": "#fbcfe8" } as React.CSSProperties}
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
          <span>Radar Diario</span>
        </nav>

        {/* ── Hero ── */}
        <header className="det-hero">
          <span className="det-hero-watermark" aria-hidden="true">24h</span>

          <span className="det-eyebrow">
            <span className="det-eyebrow-dot" aria-hidden="true" />
            Incluido en Premium
          </span>

          <h1 className="det-title">
            Radar Diario
            <span className="det-title-grad">Qué puede mover el precio hoy.</span>
          </h1>

          <p className="det-lead">
            La agenda de los datos que de verdad mueven el mercado —inflación y
            tipos de interés de Estados Unidos— <strong>con la hora ya
            convertida a la tuya</strong>, y al lado el pulso de Bitcoin. Un
            minuto de lectura antes de abrir una posición.
          </p>

          <div className="det-stats">
            <div className="det-stat">
              <span className="det-stat-value">4</span>
              <span className="det-stat-label">Datos macro vigilados</span>
            </div>
            <div className="det-stat">
              <span className="det-stat-value">5 min</span>
              <span className="det-stat-label">Frecuencia de actualización</span>
            </div>
            <div className="det-stat">
              <span className="det-stat-value">24 h</span>
              <span className="det-stat-label">Máximos, mínimos y volumen</span>
            </div>
          </div>
        </header>

        <div className="det-pilares">
          <div className="det-pilar">
            <span className="det-pilar-num">01</span>
            <span className="det-pilar-title">La agenda, filtrada</span>
            <span className="det-pilar-desc">
              Solo lo que mueve cripto de verdad. Ni un calendario económico con
              cincuenta datos irrelevantes.
            </span>
          </div>
          <div className="det-pilar">
            <span className="det-pilar-num">02</span>
            <span className="det-pilar-title">En tu hora, bien</span>
            <span className="det-pilar-desc">
              Con los dos cambios de horario resueltos, que caen en semanas
              distintas a los dos lados del Atlántico.
            </span>
          </div>
          <div className="det-pilar">
            <span className="det-pilar-num">03</span>
            <span className="det-pilar-title">Explicado, no listado</span>
            <span className="det-pilar-desc">
              Cada sigla dice qué mide y por qué le importa a cripto. Para quien
              no ha estudiado economía.
            </span>
          </div>
        </div>

        {/* ── 01 · El problema ── */}
        <section className="det-seccion">
          <header className="det-sechead">
            <span className="det-sechead-num">01</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">El mercado no se cae porque sí</h2>
              <p className="det-sechead-sub">
                Casi siempre había una fecha en el calendario.
              </p>
            </div>
          </header>

          <div className="det-columnas">
            <p>
              Un día abres el móvil y Bitcoin ha caído un 6 % en veinte minutos.
              La primera reacción es buscar una noticia, una ballena, un
              exchange en problemas. La mayoría de las veces la explicación es
              más aburrida: a las 14:30 hora española se publicó un dato de{" "}
              <Link href="/glosario/inflacion">inflación</Link> en Estados
              Unidos que salió peor de lo esperado.
            </p>
            <p>
              Las criptomonedas se mueven con el apetito de riesgo global, y ese
              lo marca la Reserva Federal. Cuando el dinero está caro, los
              activos de riesgo sufren; cuando se abarata, vuelan. Por eso las
              cuatro fechas que vigila este radar mueven más el precio que
              cualquier noticia del sector.
            </p>
            <p>
              El problema no es que la información no exista: está publicada en
              los calendarios oficiales de la Fed y de las oficinas
              estadísticas de Estados Unidos. El problema es que está en inglés,
              en horario de Nueva York, mezclada con otros cuarenta datos que a
              cripto no le afectan, y sin una sola línea que explique qué
              significa cada sigla.
            </p>
          </div>
        </section>

        {/* ── 02 · Las cuatro series ── */}
        <section className="det-seccion det-seccion--panel">
          <header className="det-sechead">
            <span className="det-sechead-num">02</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">Los cuatro datos, uno por uno</h2>
              <p className="det-sechead-sub">
                Qué mide cada uno y por qué le importa a tu cartera.
              </p>
            </div>
          </header>

          {/* Los textos salen de SERIES_INFO, el mismo objeto que pinta la
              herramienta. Si allí se corrige una explicación, aquí cambia sola:
              una definición contada de dos formas distintas es la manera segura
              de acabar contradiciéndose. */}
          <div className="det-anatomia">
            {SERIES.map((s) => (
              <div key={s.id} className="det-lectura">
                <span className="det-lectura-cifra">{s.short}</span>
                <span>
                  <span className="det-lectura-title">{s.name}</span>
                  <span className="det-lectura-text">
                    {s.what} <strong>Por qué importa:</strong> {s.why}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── 03 · Qué hay dentro ── */}
        <section className="det-seccion">
          <header className="det-sechead">
            <span className="det-sechead-num">03</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">Qué encuentras dentro</h2>
              <p className="det-sechead-sub">
                Seis bloques, todos en la misma pantalla.
              </p>
            </div>
          </header>

          <div className="det-grid">
            {DENTRO.map((d) => {
              const Icon = d.icon;
              return (
                <article key={d.title} className="det-card">
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

        {/* ── 04 · La hora ── */}
        <section className="det-seccion det-seccion--panel">
          <header className="det-sechead">
            <span className="det-sechead-num">04</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">El detalle de la hora, que parece una tontería</h2>
              <p className="det-sechead-sub">
                Y es donde fallan casi todos los calendarios.
              </p>
            </div>
          </header>

          <div className="det-columnas">
            <p>
              El IPC se publica a las 08:30 de Nueva York. Eso son las 14:30 en
              España… durante parte del año. Estados Unidos adelanta el reloj el
              segundo domingo de marzo y Europa el último domingo del mismo mes:
              hay <strong>tres semanas al año en las que la diferencia no es de
              seis horas, sino de cinco</strong>. Y en otoño pasa lo mismo al
              revés.
            </p>
            <p>
              Durante esas semanas, un calendario que aplique una diferencia
              fija te enseña la hora equivocada. Si has planificado no tener
              posiciones abiertas en el momento del dato, te pilla dentro.
            </p>
            <p>
              El radar calcula la conversión con el calendario real de cada
              zona, no con una tabla fija. Es el tipo de detalle que nadie
              agradece cuando funciona y que se nota mucho el día que falla.
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
              <h3 className="det-card-title">No manda alertas</h3>
              <p className="det-card-text">
                No hay notificaciones ni avisos por Telegram cuando se acerca un
                dato. Es una página que consultas tú, con la cuenta atrás a la
                vista.
              </p>
            </article>
            <article className="det-card">
              <h3 className="det-card-title">No es un terminal de trading</h3>
              <p className="det-card-text">
                No hay velas, ni indicadores, ni órdenes. Para operar sigues
                usando tu exchange; esto es el paso de antes.
              </p>
            </article>
            <article className="det-card">
              <h3 className="det-card-title">No predice el dato</h3>
              <p className="det-card-text">
                Te dice cuándo sale y qué significa, no si va a salir alto o
                bajo. Quien te prometa eso, te está vendiendo humo.
              </p>
            </article>
            <article className="det-card">
              <h3 className="det-card-title">No da señales</h3>
              <p className="det-card-text">
                No hay «compra aquí» ni «vende allá». La decisión es tuya, y
                también lo que salga de ella.
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
          <span className="det-final-watermark" aria-hidden="true">24h</span>
          <h2 className="det-final-title">Mira la agenda antes de entrar</h2>
          <p className="det-final-sub">
            Va incluido en Premium, junto con el{" "}
            <Link href="/calendario-de-liberaciones">calendario de liberaciones</Link>, el{" "}
            <Link href="/herramientas/portfolio">portfolio</Link>, el{" "}
            <Link href="/trading-en-directo">directo</Link> y el resto de{" "}
            <Link href="/herramientas">herramientas</Link>. Una sola cuota.
          </p>
          <div className="det-actions">
            {isPremium ? (
              <Link href="/herramientas/radar" className="det-btn">
                Abrir el radar
                <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link href="/premium" className="det-btn">
                  Ver qué incluye Premium
                  <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
                </Link>
                {!user && (
                  <Link href="/login?next=/herramientas/radar" className="det-btn det-btn--ghost">
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
