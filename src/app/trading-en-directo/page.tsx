import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HORARIO_DIRECTO as HORARIO } from "@/lib/directo";
import {
  Radio, MessageSquare, ShieldCheck, Video, ArrowRight, Send,
} from "lucide-react";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import "../herramientas/detalle.css";

/**
 * Trading en Directo — ficha pública de la herramienta.
 *
 * Antes esta ruta hacía `if (role !== "admin") redirect("/")`, así que Google
 * solo veía el salto. Ahora sigue el patrón del punto 13: **la explicación es
 * pública e indexable y solo el acceso a la sala queda tras el muro**.
 *
 * Los datos de funcionamiento están confirmados por el admin (05-09-2026):
 * las sesiones ya se hacen, se emiten en el canal privado de Telegram, tienen
 * día y hora fijos cada semana y quedan grabadas para los suscriptores.
 */

/*
 * El horario vive en `@/lib/directo`, que es de donde lo lee también la
 * tarjeta del dashboard. Aquí había una copia, y una copia de un horario es
 * un horario que algún día dirá dos cosas distintas.
 *
 * Ojo con `franjaEs`: lleva incorporado el "(hora de España)" porque las horas
 * NO se convierten a la zona del visitante. Quien mire desde México leería
 * "17:00" y entendería las suyas.
 */

export const metadata: Metadata = {
  title: "Trading en directo de NASDAQ y cripto",
  description:
    "Sesiones operando futuros de NASDAQ, Bitcoin, Solana y XRP en gráficos de 5 minutos, tres días por semana y con cada entrada comentada. Quedan grabadas.",
  alternates: { canonical: "/trading-en-directo" },
};

/** Datos de la sesión. Son hechos, no métricas de adorno. */
const FICHA = [
  { valor: "NASDAQ", label: "Lo más operado ahora" },
  { valor: "5m", label: "Temporalidad" },
  { valor: "3 / semana", label: "Sesiones fijas" },
  { valor: "Sí", label: "Quedan grabadas" },
];

const PILARES = [
  {
    num: "01",
    title: "Sin edición",
    desc: "No es un vídeo montado después. Las operaciones que salen mal se ven igual que las que salen bien.",
  },
  {
    num: "02",
    title: "Se explica mientras pasa",
    desc: "El razonamiento va en voz alta en el momento de decidir, no reconstruido a posteriori con el gráfico ya hecho.",
  },
  {
    num: "03",
    title: "Puedes preguntar",
    desc: "Hay chat durante la sesión. Si algo no se entiende, se para y se explica.",
  },
];

const EN_SESION = [
  {
    icon: Radio,
    title: "La operativa mientras ocurre",
    text: "Futuros en gráficos de 5 minutos, sobre todo NASDAQ, y también Bitcoin, Solana y XRP. Verás dónde entro, dónde coloco el stop y por qué salgo, en el instante en que se decide.",
  },
  {
    icon: ShieldCheck,
    title: "La gestión de riesgo, en voz alta",
    text: "Cuánto arriesgo en cada operación y de dónde sale ese número. Es la parte que casi nunca se enseña y la que separa una racha buena de una cuenta que aguanta el año.",
  },
  {
    icon: MessageSquare,
    title: "Chat de preguntas",
    text: "Puedes preguntar durante la sesión. Esa es la diferencia entre ver operar a alguien y entender por qué lo hace.",
  },
  {
    icon: Video,
    title: "Grabación para después",
    text: "Si no puedes estar a esa hora, la sesión queda disponible para suscriptores. No pierdes el contenido por trabajar.",
  },
];

/** Cómo transcurre una sesión, en tres tiempos. */
const MOMENTOS = [
  {
    cifra: "Antes",
    title: "Se avisa en el canal privado",
    text: "Los huecos son fijos —lunes, miércoles y viernes— y el aviso con el enlace llega al canal de Telegram incluido en tu suscripción. No hay que estar pendiente de nada más.",
  },
  {
    cifra: "Durante",
    title: "Se opera y se comenta",
    text: "Gráfico en pantalla, operativa en tiempo real y explicación de cada decisión: por qué esa entrada, dónde va el stop y qué haría falta para salir.",
  },
  {
    cifra: "Después",
    title: "Queda la grabación",
    text: "La sesión se guarda y sigue disponible para los suscriptores, así que se puede repasar con calma o verla entera si no pudiste asistir.",
  },
];

const FAQ = [
  {
    q: "¿Cuándo son las sesiones?",
    a: "Lunes, miércoles y viernes, de 17:00 a 19:00 hora de España peninsular (18:00 a 20:00 en Rumanía, desde donde se emite). Las horas se publican siempre en hora española: no se ajustan solas a tu país, así que si vives fuera de España conviene que hagas la cuenta. Se avisa en el canal privado de Telegram incluido en la suscripción Premium.",
  },
  {
    q: "¿Y si no puedo asistir en directo?",
    a: "La sesión queda grabada y disponible para los suscriptores. Pierdes el chat de preguntas, pero no el contenido.",
  },
  {
    q: "¿Son señales para copiar las operaciones?",
    a: "No. Es contenido formativo: se enseña cómo se toma una decisión, no qué debes hacer tú. No se dan entradas para replicar ni hay alertas.",
  },
  {
    q: "¿Hace falta saber operar futuros para aprovecharlo?",
    a: "Ayuda tener los conceptos básicos, sobre todo tamaño de posición y stop-loss. Si vienes de cero, es mejor empezar por las guías y por la calculadora de riesgo, y llegar aquí después.",
  },
  {
    q: "¿Qué activos se operan?",
    a: "Futuros de NASDAQ, que es lo que más se está operando ahora mismo, y también Bitcoin, Solana y XRP. Que haya un índice y no solo cripto es intencionado: el NASDAQ se mueve con otra lógica y obliga a mirar el contexto macro, no solo el gráfico.",
  },
  {
    q: "¿Se opera con dinero real?",
    a: "Sí, es operativa real. Por eso también se ven las operaciones perdedoras: en directo no hay forma de esconderlas.",
  },
  {
    q: "¿Cuesta algo aparte de la suscripción?",
    a: "No. Entra en la misma cuota Premium que el resto de herramientas, sin pagos adicionales.",
  },
];

export default async function TradingEnDirectoPage() {
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
            { name: "Trading en Directo", path: "/trading-en-directo" },
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
        style={{ "--det-accent": "#a3a3ff", "--det-accent-2": "#d0d0ff" } as React.CSSProperties}
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
          <span>Trading en Directo</span>
        </nav>

        {/* ── Hero ── */}
        <header className="det-hero">
          <span className="det-hero-watermark" aria-hidden="true">5m</span>

          <span className="det-eyebrow">
            <span className="det-eyebrow-dot" aria-hidden="true" />
            En directo · Incluido en Premium
          </span>

          <h1 className="det-title">
            Trading en Directo
            <span className="det-title-grad">Se opera delante de ti.</span>
          </h1>

          <p className="det-lead">
            Tres sesiones por semana operando{" "}
            <Link href="/glosario/futuros">futuros</Link> en gráficos de 5
            minutos: <strong>NASDAQ</strong>, que es lo que más se opera ahora
            mismo, y también Bitcoin, Solana y XRP. Cada entrada y cada salida,
            en el momento en que se toman.
          </p>

          <div className="det-stats">
            {FICHA.map((f) => (
              <div key={f.label} className="det-stat">
                <span className="det-stat-value">{f.valor}</span>
                <span className="det-stat-label">{f.label}</span>
              </div>
            ))}
          </div>

          <p className="det-stats-nota">
            <span className="det-stats-dot" aria-hidden="true" />
            {HORARIO.dias}, de <strong>{HORARIO.franjaEs}</strong>. El
            aviso, con el enlace, llega al canal privado de Telegram.
          </p>
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

        {/* ── 01 · Por qué en directo ── */}
        <section className="det-seccion">
          <header className="det-sechead">
            <span className="det-sechead-num">01</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">Por qué en directo y no un vídeo</h2>
              <p className="det-sechead-sub">
                La diferencia no es el formato. Es que en directo no se puede
                elegir qué enseñar.
              </p>
            </div>
          </header>

          <p className="det-p">
            Un vídeo de trading editado siempre acaba enseñando la operación que
            salió bien. No hace falta mentir para engañar: basta con grabar diez
            y publicar la que funcionó. El resultado es un contenido donde todo
            encaja, todo se ve claro y nada se parece a operar de verdad.
          </p>

          <p className="det-destacado">
            Lo que enseña a operar no es ver una entrada perfecta. Es ver qué
            hace alguien cuando la operación se le pone en contra.
          </p>

          <p className="det-p">
            En directo eso no se puede esquivar. Si la entrada falla, se ve
            fallar; si hay que cerrar con pérdida, se cierra delante de todos y
            se explica por qué. <strong>Esa parte es la que no sale en los
            vídeos</strong> y es exactamente la que separa a quien sigue
            operando dentro de dos años de quien lo deja.
          </p>
        </section>

        {/* ── 02 · Qué ves ── */}
        <section className="det-seccion det-seccion--panel">
          <header className="det-sechead">
            <span className="det-sechead-num">02</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">Qué vas a ver en una sesión</h2>
              <p className="det-sechead-sub">
                Operativa real, el riesgo explicado en voz alta y sitio para
                preguntar.
              </p>
            </div>
          </header>

          <div className="det-grid">
            {EN_SESION.map((b, i) => {
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
                  <p className="det-card-text">{b.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── 03 · Cómo transcurre ── */}
        <section className="det-seccion">
          <header className="det-sechead">
            <span className="det-sechead-num">03</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">Cómo transcurre una sesión</h2>
              <p className="det-sechead-sub">
                Del aviso a la grabación, para que sepas exactamente qué
                esperar.
              </p>
            </div>
          </header>

          <div className="det-anatomia">
            {MOMENTOS.map((m) => (
              <div key={m.cifra} className="det-lectura">
                <span className="det-lectura-cifra">{m.cifra}</span>
                <span>
                  <span className="det-lectura-title">{m.title}</span>
                  <span className="det-lectura-text">{m.text}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── 04 · Qué no es ── */}
        <section className="det-seccion det-seccion--panel">
          <header className="det-sechead">
            <span className="det-sechead-num">04</span>
            <div className="det-sechead-text">
              <h2 className="det-h2">Qué NO es</h2>
              <p className="det-sechead-sub">
                Dicho antes de que lo preguntes, y con más motivo que en
                cualquier otra herramienta.
              </p>
            </div>
          </header>

          <ul className="det-lista">
            <li>
              <strong>No son señales.</strong> No se dan entradas para que las
              copies ni hay alertas: se enseña cómo se decide, no qué debes
              hacer tú.
            </li>
            <li>
              <strong>No es una promesa de rentabilidad.</strong> Se opera de
              verdad, y operar de verdad incluye perder. Las sesiones con
              pérdidas se ven igual que las demás.
            </li>
            <li>
              <strong>No es un curso para empezar de cero.</strong> Si aún no
              manejas{" "}
              <Link href="/glosario/tamano-de-posicion">tamaño de posición</Link>{" "}
              y <Link href="/glosario/stop-loss">stop-loss</Link>, empieza por
              las <Link href="/guias">guías</Link> y vuelve después.
            </li>
            <li>
              <strong>No opera por ti.</strong> No hay conexión con tu exchange
              ni ejecución automática de nada.
            </li>
          </ul>
        </section>

        {/* ── 05 · FAQ ── */}
        <section className="det-seccion">
          <header className="det-sechead">
            <span className="det-sechead-num">05</span>
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

        <DisclaimerRiesgo variante="directo" />

        {/* ── Cierre: cambia según tenga acceso o no ── */}
        <section className="det-final">
          <span className="det-final-watermark" aria-hidden="true">LIVE</span>

          {isPremium ? (
            <>
              <h2 className="det-final-title">Tu acceso está activo</h2>
              <p className="det-final-sub">
                Las sesiones se avisan en el canal privado de Telegram, incluido
                en tu suscripción. Si aún no lo has vinculado, se hace en un
                momento desde tu cuenta.
              </p>
              <div className="det-actions">
                <Link href="/cuenta" className="det-btn">
                  <Send size={16} strokeWidth={2.2} aria-hidden="true" />
                  Vincular mi Telegram
                </Link>
                <Link href="/dashboard" className="det-btn det-btn--ghost">
                  Ir a mi academia
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="det-final-title">Entra en la próxima sesión</h2>
              <p className="det-final-sub">
                Va incluido en la suscripción Premium, junto con el{" "}
                <Link href="/herramientas/portfolio">portfolio</Link>, el{" "}
                <Link href="/herramientas/diario">diario de trading</Link> y el
                resto de <Link href="/herramientas">herramientas</Link>. Una
                sola cuota, sin comprar nada por separado.
              </p>
              <div className="det-actions">
                <Link href="/premium" className="det-btn">
                  Ver qué incluye Premium
                  <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
                </Link>
                {!user && (
                  <Link href="/login?next=/trading-en-directo" className="det-btn det-btn--ghost">
                    Ya tengo cuenta
                  </Link>
                )}
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
