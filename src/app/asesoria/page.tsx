import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, Check, MessageCircle, ShieldCheck, TrendingUp, UserRound, Video } from "lucide-react";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import { InstagramIcon } from "@/components/SocialLinks";
import {
  ASESORIA_PILLARS,
  ASESORIA_PLANS,
  INSTAGRAM_DM_URL,
  INSTAGRAM_USER,
} from "@/lib/asesoria";
import "./asesoria.css";

export const metadata: Metadata = {
  // Sin sufijo: el template del layout raíz ya añade "| AdelinBTC Academy".
  title: "Asesorías 1:1",
  description:
    "Sesiones individuales de trading conmigo: estrategias en spot y futuros, gestión de riesgo y psicología. Asesoría de 1 hora o programa completo con seguimiento.",
};

// Cómo funciona: tres pasos para que nadie dude de qué pasa después de
// escribir. La fricción en un producto de ticket alto suele ser esta.
const STEPS = [
  {
    n: 1,
    icon: InstagramIcon,
    title: "Me escribes por Instagram",
    desc: `Abre el chat conmigo en @${INSTAGRAM_USER} y dime cuál de las dos opciones te interesa.`,
  },
  {
    n: 2,
    icon: MessageCircle,
    title: "Vemos si encaja",
    desc: "Te pregunto por tu nivel y por lo que buscas. Si no creo que te vaya a servir, te lo digo.",
  },
  {
    n: 3,
    icon: Video,
    title: "Reservamos la sesión",
    desc: "Cerramos día, hora y forma de pago, y nos vemos en videollamada.",
  },
];

// Glifo identitario de cada plan — la cabecera de la tarjeta lo usa como
// medallón. Se mapea aquí para no acoplar lib/asesoria.ts a lucide-react.
const PLAN_GLYPHS: Record<string, typeof UserRound> = {
  general: UserRound,
  "pack-trader": TrendingUp,
};

// Chips de ficha técnica por plan — acento monoespaciado, estética terminal.
const PLAN_META: Record<string, string[]> = {
  general: ["60 min", "En directo", "1 sesión"],
  "pack-trader": ["3 estrategias", "En directo", "30 días"],
};

// Cifras del hero. Ninguna inventada: salen de la propia oferta.
const HERO_STATS = [
  { value: "1:1", label: "Sesiones individuales, nunca en grupo" },
  { value: "30d", label: "De seguimiento en el programa completo" },
  { value: "4", label: "Pilares: trading, estrategia, riesgo y psicología" },
];

const FAQS = [
  {
    q: "¿Necesito experiencia previa?",
    a: "Para la Asesoría General conviene que ya operes o hayas operado: la sesión rinde más cuando hay operativa real que revisar. El programa Conviértete en Trader está pensado para construir el método desde la base.",
  },
  {
    q: "¿Cómo y cuándo se paga?",
    a: "Todo se cierra hablando por Instagram: acordamos método de pago y fecha antes de la sesión. En la web no hay ningún cobro automático.",
  },
  {
    q: "¿Dónde se hace la sesión?",
    a: "En videollamada, en directo y solo tú y yo. El día y la hora los pactamos por mensaje según tu disponibilidad.",
  },
  {
    q: "¿Puedo empezar por una sesión y pasar después al programa?",
    a: "Sí. Muchos empiezan por la Asesoría General para desatascar algo concreto y, si después quieren el método completo, seguimos con el programa. Me lo dices por DM y lo organizamos.",
  },
];

export default async function AsesoriaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profileData = user
    ? (await supabase.from("profiles").select("full_name, role").eq("id", user.id).single()).data
    : null;
  const role = profileData?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  const isAdmin = role === "admin";
  const userName = profileData?.full_name || user?.email?.split("@")[0] || "Usuario";

  const marqueeItems = [...ASESORIA_PILLARS.map((p) => p.title), "Mentoría 1:1"];

  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      <SiteNav
        user={!!user}
        isPremium={isPremium}
        userName={user ? userName : undefined}
        isAdmin={isAdmin}
      />

      <main className="ase-main">
        {/* Fondo técnico: rejilla de terminal + auroras. Decorativo. */}
        <div className="ase-backdrop" aria-hidden="true">
          <span className="ase-backdrop-grid" />
          <span className="ase-orb ase-orb--gold" />
          <span className="ase-orb ase-orb--orange" />
          <span className="ase-orb ase-orb--blue" />
        </div>

        {/* ── Cinta marquesina ── */}
        <div className="ase-marquee" aria-hidden="true">
          <div className="ase-marquee-track">
            {[0, 1].map((dup) => (
              <span key={dup} className="ase-marquee-seq">
                {marqueeItems.map((item) => (
                  <span key={item} className="ase-marquee-item">
                    {item}
                    <i />
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* ── Hero editorial ── */}
        <section className="ase-hero">
          <span className="ase-hero-watermark" aria-hidden="true">1:1</span>

          <span className="ase-hero-eyebrow">
            <span className="ase-eyebrow-dot" aria-hidden="true" />
            Mentoría privada
          </span>

          <h1 className="ase-hero-title">
            Deja de aprender solo.
            <br />
            <span className="ase-hero-title-grad">Trabajemos tu operativa juntos.</span>
          </h1>

          <p className="ase-hero-sub">
            La academia te da las herramientas y el contenido. Una asesoría te da algo que ningún
            curso puede darte: alguien mirando <em>tu</em> operativa, señalando <em>tus</em> errores
            y respondiendo a <em>tus</em> dudas.
          </p>

          <div className="ase-hero-stats">
            {HERO_STATS.map((s) => (
              <div key={s.value} className="ase-hero-stat">
                <span className="ase-hero-stat-value">{s.value}</span>
                <span className="ase-hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Los 4 pilares: franja editorial dividida ── */}
        <div className="ase-pillars">
          {ASESORIA_PILLARS.map((p, i) => (
            <div key={p.id} className="ase-pillar">
              <span className="ase-pillar-num" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="ase-pillar-title">{p.title}</span>
              <span className="ase-pillar-desc">{p.desc}</span>
            </div>
          ))}
        </div>

        {/* ── 01 · Planes ── */}
        <section className="ase-plans" id="planes">
          <header className="ase-sechead">
            <span className="ase-sechead-num">01</span>
            <div className="ase-sechead-text">
              <h2 className="ase-sechead-title">Elige cómo trabajamos</h2>
              <p className="ase-sechead-sub">
                Una sesión suelta para desatascar algo concreto, o el programa completo si lo que
                quieres es construir un método desde cero.
              </p>
            </div>
            <span className="ase-sechead-side">Pago único · Sin suscripción</span>
          </header>

          <div className="ase-plan-grid">
            {ASESORIA_PLANS.map((plan, idx) => {
              const Glyph = PLAN_GLYPHS[plan.id] ?? UserRound;
              // "2.499€" → cifra y divisa por separado, para componer la
              // divisa como superíndice pequeño junto al número gigante.
              const amount = plan.price.replace("€", "");
              return (
              <article
                key={plan.id}
                className={`ase-plan${plan.featured ? " ase-plan--featured" : ""}`}
                style={{ "--plan-color": plan.color } as React.CSSProperties}
              >
                <span className="ase-plan-topbar" aria-hidden="true" />
                {/* Glifo del plan como marca de agua gigante */}
                <span className="ase-plan-watermark" aria-hidden="true">
                  <Glyph size={150} strokeWidth={1} />
                </span>
                {plan.featured && <span className="ase-plan-flag">Programa completo</span>}

                {/* Cabecera tipo expediente: índice mono + nombre + ficha técnica,
                    cerrada por la perforación de ticket (borde discontinuo) */}
                <header className="ase-plan-head">
                  <span className="ase-plan-index">Plan {String(idx + 1).padStart(2, "0")}</span>
                  <h3 className="ase-plan-name">{plan.name}</h3>
                  <p className="ase-plan-tagline">{plan.tagline}</p>
                  <div className="ase-plan-meta">
                    {(PLAN_META[plan.id] ?? []).map((m) => (
                      <span key={m}>{m}</span>
                    ))}
                  </div>
                </header>

                <div className="ase-plan-price">
                  <span className="ase-plan-price-halo" aria-hidden="true" />
                  <div className="ase-plan-price-main">
                    <div className="ase-plan-price-value">
                      <span className="ase-plan-price-amount">{amount}</span>
                      <span className="ase-plan-price-currency">€</span>
                    </div>
                    {plan.oldPrice && plan.oldPriceValue && (
                      <div className="ase-plan-price-was">
                        <span className="ase-plan-price-old-label">Antes</span>
                        <s className="ase-plan-price-old">{plan.oldPrice}</s>
                        <span className="ase-plan-price-save">
                          Ahorras {Math.round((1 - plan.priceValue / plan.oldPriceValue) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="ase-plan-price-note">{plan.priceNote}</span>
                </div>

                <p className="ase-plan-summary">{plan.summary}</p>

                {/* Hoja de especificaciones: filas numeradas en mono + check */}
                <span className="ase-plan-zone">Incluye</span>
                <ul className="ase-plan-list">
                  {plan.includes.map((item, j) => (
                    <li key={item} className="ase-plan-item">
                      <i className="ase-plan-item-num">{String(j + 1).padStart(2, "0")}</i>
                      <span>{item}</span>
                      <Check size={14} strokeWidth={3} aria-hidden="true" />
                    </li>
                  ))}
                </ul>

                <div className="ase-plan-audience">
                  <span className="ase-plan-audience-label">Para quién es</span>
                  <p>{plan.audience}</p>
                </div>

                <a
                  href={INSTAGRAM_DM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ase-plan-cta"
                >
                  <span className="ase-plan-cta-icon" aria-hidden="true">
                    <InstagramIcon size={15} />
                  </span>
                  <span>Reservar por Instagram</span>
                  <ArrowRight size={16} strokeWidth={2.5} className="ase-plan-cta-arrow" aria-hidden="true" />
                </a>
                <p className="ase-plan-dm">
                  <span className="ase-plan-dm-label">Escríbeme</span>
                  <span className="ase-plan-dm-bubble">&laquo;{plan.dmIntent}&raquo;</span>
                </p>
              </article>
              );
            })}
          </div>
        </section>

        {/* ── 02 · Cómo se reserva: línea de tiempo ── */}
        <section className="ase-how">
          <header className="ase-sechead">
            <span className="ase-sechead-num">02</span>
            <div className="ase-sechead-text">
              <h2 className="ase-sechead-title">Cómo se reserva</h2>
              <p className="ase-sechead-sub">
                Tres pasos y cero letra pequeña. Sin pasarelas de pago ni formularios: una
                conversación.
              </p>
            </div>
          </header>

          <div className="ase-steps">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.n} className="ase-step">
                  <span className="ase-step-node" aria-hidden="true">
                    <Icon size={17} />
                  </span>
                  <span className="ase-step-index">Paso {String(s.n).padStart(2, "0")}</span>
                  <h3 className="ase-step-title">{s.title}</h3>
                  <p className="ase-step-desc">{s.desc}</p>
                </div>
              );
            })}
          </div>

          <p className="ase-how-note">
            <ShieldCheck size={14} aria-hidden="true" />
            No hay pago automático en la web: todo se cierra hablando contigo primero.
          </p>
        </section>

        {/* ── 03 · FAQ ── */}
        <section className="ase-faq">
          <header className="ase-sechead">
            <span className="ase-sechead-num">03</span>
            <div className="ase-sechead-text">
              <h2 className="ase-sechead-title">Preguntas frecuentes</h2>
            </div>
          </header>

          <div className="ase-faq-list">
            {FAQS.map((f) => (
              <details key={f.q} className="ase-faq-item">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── CTA final ── */}
        <section className="ase-final">
          <div className="ase-final-glow" aria-hidden="true" />
          <span className="ase-final-watermark" aria-hidden="true">1:1</span>
          <h2 className="ase-final-title">
            Si has llegado hasta aquí,
            <br />
            probablemente ya sabes que te hace falta.
          </h2>
          <p className="ase-final-sub">
            Escríbeme y lo hablamos. Sin compromiso y sin argumentario de ventas: si veo que no es
            tu momento, te lo digo.
          </p>
          <a
            href={INSTAGRAM_DM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ase-final-cta"
          >
            <InstagramIcon size={18} />
            Hablar conmigo en Instagram
          </a>
          <p className="ase-final-sign">Adelin · @{INSTAGRAM_USER}</p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
