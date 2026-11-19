import type { ReactNode } from "react";
import Link from "next/link";
import { Check, CreditCard, Crown, ShieldCheck, Zap } from "lucide-react";
import SimboloEstudio from "@/components/cuaderno/SimboloEstudio";
import TeclaPremium from "@/components/cuaderno/TeclaPremium";
import { PREMIUM_PRICE_EUR, precioEur } from "@/lib/stripe";
import "./tarjeta-premium.css";

const PRECIO = precioEur(PREMIUM_PRICE_EUR);
const PRECIO_DIA = precioEur(Math.round((PREMIUM_PRICE_EUR / 30) * 100) / 100);

type Pieza = "portfolio" | "diario" | "foro" | "cursos";

/** Lo que incluye Premium, cada pieza con su color y su texto. */
const PIEZAS: Record<Pieza, { color: string; texto: ReactNode; destacado: ReactNode }> = {
  portfolio: {
    color: "menta",
    texto: <><Link href="/herramientas/portfolio">Portfolio Adelin</Link>: spot y DCA de Bitcoin</>,
    destacado: <><strong>Portfolio Adelin</strong>: spot y DCA de Bitcoin</>,
  },
  diario: {
    color: "cielo",
    texto: <>El <Link href="/herramientas/diario">Diario de Trading</Link> avanzado</>,
    destacado: <>El <strong>Diario de Trading</strong> avanzado</>,
  },
  foro: {
    color: "azul",
    texto: <>El <Link href="/foro">foro</Link> de preguntas y respuestas</>,
    destacado: <>El <strong>foro</strong> de preguntas y respuestas</>,
  },
  cursos: {
    color: "lila",
    texto: <>Todos los <Link href="/cursos">cursos</Link>, con examen y certificado</>,
    destacado: <><strong>Todos los cursos</strong>, con examen y certificado, también los que lleguen</>,
  },
};
const ORDEN: Pieza[] = ["portfolio", "diario", "foro", "cursos"];

/**
 * La tarjeta Premium del final de página, la MISMA en el portfolio y en los
 * cursos (19-11-2026, pedido por el admin): ficha amarilla con contorno de
 * rotulador, celo, etiqueta ladeada, las coronas de pegatina, lo que incluye
 * (la pieza de la página en la que se está, primera y destacada con «estás
 * aquí»; cada una de las demás enlaza a la página que la explica) y el precio
 * con fluorescente. En el móvil, una flecha a mano baja
 * del título a la pieza destacada.
 *
 * `accionPremium`: lo que ve quien ya es Premium en lugar del botón de compra
 * (p. ej. «Abrir el portfolio»). Sin él, a quien ya es Premium no se le enseña
 * la tarjeta: la página decide si la pinta.
 */
export default function TarjetaPremium({
  aqui,
  esPremium = false,
  accionPremium,
}: {
  aqui: Pieza;
  esPremium?: boolean;
  accionPremium?: ReactNode;
}) {
  const piezas = [aqui, ...ORDEN.filter((p) => p !== aqui)];

  return (
    <section className="pa-pr" id="suscribirse" aria-labelledby="pa-precio-titulo">
      {/* eslint-disable-next-line @next/next/no-img-element -- pegatina decorativa, ya optimizada */}
      <img src="/cuaderno/premium-coronas-pegatina.webp" alt="" width={560} height={408} className="pa-pr-coronas" loading="lazy" draggable={false} />
      <span className="pa-pr-sello"><Crown size={14} strokeWidth={2.6} aria-hidden="true" /> Premium · todo incluido</span>
      <h2 id="pa-precio-titulo" className="pa-pr-titulo">Ábrelo y <span className="pa-pr-mano">júzgalo tú</span></h2>
      {/* Flecha a mano, verde, del título a la pieza de esta página (solo en el móvil). */}
      <SimboloEstudio tipo="flecha" color="menta" giro={62} tamano={64} semilla={14} retraso={300} className="pa-pr-flecha" />

      <ul className="pa-pr-incluye">
        {piezas.map((p) => {
          const pieza = PIEZAS[p];
          const check = (
            <span className={`pa-pr-check pa-pr-check--${pieza.color}`} aria-hidden="true">
              <Check size={14} strokeWidth={3.4} />
            </span>
          );
          return p === aqui ? (
            <li key={p} className="pa-pr-aqui">
              {check}
              <span>{pieza.destacado}</span>
              <span className="pa-pr-aqui-nota" aria-hidden="true">estás aquí</span>
            </li>
          ) : (
            <li key={p}>{check}<span>{pieza.texto}</span></li>
          );
        })}
      </ul>

      <div className="pa-pr-pie">
        {esPremium ? (
          <p className="pa-pr-ya">Ya tienes acceso.</p>
        ) : (
          <p className="pa-pr-precio">
            <strong>{PRECIO}</strong>
            <span>al mes</span>
            <small>unos {PRECIO_DIA} al día · el precio se te queda fijado</small>
          </p>
        )}
        {esPremium ? accionPremium : <TeclaPremium tamano="grande" />}
        {!esPremium && (
          <ul className="pa-pr-confianza">
            <li><ShieldCheck size={14} strokeWidth={2.6} aria-hidden="true" />Sin permanencia</li>
            <li><Zap size={14} strokeWidth={2.6} aria-hidden="true" />Acceso inmediato</li>
            <li><CreditCard size={14} strokeWidth={2.6} aria-hidden="true" />Pago seguro con Stripe</li>
          </ul>
        )}
      </div>
    </section>
  );
}
