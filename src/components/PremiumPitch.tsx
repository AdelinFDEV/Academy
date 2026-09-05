import Link from "next/link";
import { ArrowRight, ShieldCheck, Crown, Gem, Check, Send, Infinity as InfinityIcon, Radio } from "lucide-react";
import { DefiLlamaGlyph, CoinGeckoGlyph } from "@/components/BrandMarks";
import { HERRAMIENTAS } from "@/lib/herramientas";

/**
 * La tarjeta de Premium de la portada (y su variante de sección).
 *
 * Las herramientas **salen del catálogo** (`@/lib/herramientas`), no de una
 * lista propia: antes estaban escritas aquí a mano y por eso el diario seguía
 * prometiendo «retos» inexistentes y el directo se anunciaba como
 * «próximamente» cuando ya había sesiones tres días por semana.
 *
 * Cada una añade un `dato` concreto —un número, un horario, una fuente— porque
 * a 49,99 €/mes una lista de adjetivos no convence: los hechos comprobables sí.
 */

/**
 * Lo que hace cada herramienta, en UNA línea.
 *
 * No se usa el `desc` del catálogo: está escrito para las tarjetas grandes del
 * hero y aquí, multiplicado por nueve ventajas, hacía que la tarjeta se saliera
 * de la pantalla. Una lista de venta se lee de un vistazo o no se lee.
 */
const DATOS: Record<string, string> = {
  directo: "3 sesiones/semana · NASDAQ, BTC, SOL y XRP",
  portfolio: "Mis posiciones reales, con PnL en vivo",
  diario: "10 estadísticas y tu curva de capital",
  radar: "Bitcoin 24h, miedo y codicia y macro de EE. UU.",
  liberaciones: "Calendario de 10 tokens, datos de DefiLlama",
  "mi-portfolio": "Tu cartera: precio medio ponderado y P&L",
};

/** El orden de venta: primero lo que más convierte. */
const ORDEN = ["directo", "portfolio", "diario", "radar", "liberaciones", "mi-portfolio"];

const DEL_CATALOGO = ORDEN.map((id) => {
  const h = HERRAMIENTAS.find((x) => x.id === id)!;
  return { id, icon: h.icon, color: h.color, title: h.label, dato: DATOS[id] };
});

/** Ventajas que no son herramientas y por eso no viven en el catálogo. */
const EXTRAS = [
  {
    id: "guias",
    icon: Gem,
    color: "#ffd166",
    title: "Guías Premium",
    dato: "Todas desbloqueadas, con quiz y logros",
  },
  {
    id: "telegram",
    icon: Send,
    color: "#2aabee",
    title: "Comunidad en Telegram",
    dato: "Canal privado y hablas conmigo, no con un bot",
  },
  {
    id: "futuro",
    icon: InfinityIcon,
    color: "#e6b455",
    title: "Todo lo que venga, incluido",
    /* Antes: "Tu tarifa queda congelada". Se cambió porque prometía más de lo
       que es: el precio se conserva MIENTRAS la suscripción siga activa, y si
       cancelas y vuelves entras con la tarifa vigente (así lo explica la FAQ
       de /premium). La frase sonaba a garantía de por vida. Aquí se afirma solo
       lo que esta ventaja hace: lo nuevo entra sin cobrar aparte. */
    dato: "Las herramientas nuevas, sin pagar aparte",
  },
];

const FEATURES = [...DEL_CATALOGO, ...EXTRAS];

export default function PremiumPitch({ variant = "card" }: { variant?: "card" | "section" }) {
  const glow = <span className="premium-pitch-glow" aria-hidden="true" />;

  /* Sin badge de descuento: el «-60%» se quedó aquí olvidado cuando el precio
     subió a 49,99 € y desapareció la oferta de lanzamiento. Anunciaba una
     rebaja que ya no existe. */
  const top = (
    <div className="premium-pitch-top">
      <span className="premium-pitch-badge">
        <Crown size={13} aria-hidden="true" /> Premium
      </span>
      <span className="premium-pitch-count">{HERRAMIENTAS.length} herramientas</span>
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
          <li
            key={f.id}
            className="premium-pitch-feature"
            style={{ "--pf-color": f.color } as React.CSSProperties}
          >
            <span className="premium-pitch-feature-icon">
              <Icon size={16} aria-hidden="true" />
            </span>
            <span className="premium-pitch-feature-text">
              <strong>{f.title}</strong>
              <em className="premium-pitch-feature-dato">{f.dato}</em>
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

  /* Antes decía «el trading en directo llega pronto». Ya no: hay sesiones tres
     días por semana desde septiembre de 2026, y anunciarlo como futuro
     desperdiciaba el argumento más fuerte de la suscripción. */
  const included = (
    <div className="premium-pitch-included">
      <span className="premium-pitch-included-dot" aria-hidden="true" />
      <Radio size={15} aria-hidden="true" />
      <span>
        <strong className="premium-pitch-included-em">Trading en directo, ya disponible</strong>{" "}
        — tres sesiones por semana operando NASDAQ, Bitcoin, Solana y XRP, y
        quedan grabadas.
      </span>
    </div>
  );

  const price = (
    <div className="premium-pitch-price-wrapper">
      <div className="premium-pitch-price">
        <span className="premium-pitch-amount">49,99€</span>
        <span className="premium-pitch-period">/mes</span>
      </div>
      <span className="premium-pitch-price-note">
        Menos de 1,70 € al día, sin extras ni compras sueltas
      </span>
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
          {included}
          {price}
          {cta}
          {note}
        </div>
        <div className="premium-pitch-col premium-pitch-col--aside">
          {features}
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
