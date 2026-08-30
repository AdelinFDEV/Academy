import Link from "next/link";
import { ArrowRight, NotebookPen, ShieldCheck, Crown, Gem, Check, Unlock, Wallet, Radio, Radar, PieChart, Send } from "lucide-react";
import { DefiLlamaGlyph, CoinGeckoGlyph } from "@/components/BrandMarks";

const FEATURES = [
  {
    icon: NotebookPen,
    color: "#ff9a4d", bg: "rgba(255,154,77,0.14)", border: "rgba(255,154,77,0.3)",
    title: "Diario de Trading",
    desc: "No solo registras: completas retos que te convierten en un trader disciplinado.",
  },
  {
    icon: Unlock,
    color: "#34d399", bg: "rgba(52,211,153,0.14)", border: "rgba(52,211,153,0.3)",
    title: "Liberaciones de Tokens",
    desc: "Anticipa la presión vendedora con el calendario de vesting en tiempo real.",
  },
  {
    icon: Wallet,
    color: "#fb923c", bg: "rgba(251,146,60,0.14)", border: "rgba(251,146,60,0.3)",
    title: "Portfolio Adelin",
    desc: "Sigue en directo las compras reales de AdelinBTC, con precios de entrada y contexto.",
  },
  {
    icon: Radar,
    color: "#38bdf8", bg: "rgba(56,189,248,0.14)", border: "rgba(56,189,248,0.3)",
    title: "Radar Diario",
    desc: "Tu resumen del mercado cada día: Bitcoin en 24h, miedo y codicia, eventos macro y los mayores movimientos.",
  },
  {
    icon: PieChart,
    color: "#a78bfa", bg: "rgba(167,139,250,0.14)", border: "rgba(167,139,250,0.3)",
    title: "Mi Portfolio",
    desc: "Crea tu portfolio y sigue precio medio, valor actual y ganancia o pérdida con todos los gráficos y el detalle.",
  },
  {
    icon: Gem,
    color: "#ffd166", bg: "rgba(255,209,102,0.14)", border: "rgba(255,209,102,0.3)",
    title: "Guías Premium",
    desc: "Desbloquea todas las guías interactivas, no solo las básicas.",
  },
  {
    icon: Send,
    color: "#2aabee", bg: "rgba(42,171,238,0.14)", border: "rgba(42,171,238,0.3)",
    title: "Comunidad en Telegram",
    desc: "Canal privado solo para miembros, y a mí al otro lado: escríbeme y te contesto en persona.",
  },
];

export default function PremiumPitch({ variant = "card" }: { variant?: "card" | "section" }) {
  const glow = <span className="premium-pitch-glow" aria-hidden="true" />;

  const top = (
    <div className="premium-pitch-top">
      <span className="premium-pitch-badge">
        <Crown size={13} aria-hidden="true" /> Premium
      </span>
      <span className="premium-pitch-discount">-60%</span>
    </div>
  );

  const heading = (
    <>
      <h3 className="premium-pitch-title">
        Deja de mirar el mercado.<br />
        <span className="text-gradient">Empieza a operarlo.</span>
      </h3>
      <p className="premium-pitch-sub">
        Las herramientas que separan a los que improvisan de los que operan con ventaja.
      </p>
    </>
  );

  const features = (
    <ul className="premium-pitch-features">
      {FEATURES.map((f) => {
        const Icon = f.icon;
        return (
          <li key={f.title} className="premium-pitch-feature">
            <span className="premium-pitch-feature-icon" style={{ color: f.color, background: f.bg, borderColor: f.border }}>
              <Icon size={16} aria-hidden="true" />
            </span>
            <span>
              <strong>{f.title}</strong>
              {f.desc}
            </span>
          </li>
        );
      })}
    </ul>
  );

  const partners = (
    <div className="premium-pitch-partners">
      <span className="premium-pitch-partners-label">
        <ShieldCheck size={12} aria-hidden="true" /> Datos oficiales, no estimaciones
      </span>
      <div className="premium-pitch-partners-logos">
        <span className="premium-pitch-partner premium-pitch-partner--dl">
          <span className="premium-pitch-partner-mark"><DefiLlamaGlyph size={12} /></span>
          DefiLlama
        </span>
        <span className="premium-pitch-partner premium-pitch-partner--cg">
          <span className="premium-pitch-partner-mark"><CoinGeckoGlyph size={12} /></span>
          CoinGecko
        </span>
      </div>
    </div>
  );

  const included = (
    <div className="premium-pitch-included">
      <Radio size={15} aria-hidden="true" />
      <span>
        El trading en directo llega pronto y entrará incluido — sin coste extra,{" "}
        <strong className="premium-pitch-included-em">exclusivamente para los usuarios Premium</strong>.
      </span>
    </div>
  );

  const price = (
    <div className="premium-pitch-price-wrapper">
      <span className="premium-pitch-limited">Por tiempo limitado</span>
      <div className="premium-pitch-price">
        <span className="premium-pitch-old-price">49,99€</span>
        <span className="premium-pitch-amount">19,99€</span>
        <span className="premium-pitch-period">/mes</span>
      </div>
    </div>
  );

  const cta = (
    <Link href="/premium" className="premium-pitch-cta">
      Más información <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
    </Link>
  );

  const note = (
    <p className="premium-pitch-note">
      <Check size={13} aria-hidden="true" /> Sin permanencia · Cancela cuando quieras
    </p>
  );

  if (variant === "section") {
    return (
      <div className="premium-pitch premium-pitch--section">
        {glow}
        <div className="premium-pitch-col premium-pitch-col--main">
          {top}
          {heading}
          {price}
          {cta}
          {note}
        </div>
        <div className="premium-pitch-col premium-pitch-col--aside">
          {features}
          {included}
          {partners}
        </div>
      </div>
    );
  }

  return (
    <div className="premium-pitch">
      {glow}
      {top}
      {heading}
      {features}
      {included}
      {partners}
      {price}
      {cta}
      {note}
    </div>
  );
}
