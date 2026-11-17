import { Wallet, ArrowRight, Lock } from "lucide-react";
import { resumenPortfolioPublico } from "@/lib/portfolio-publico";
import { destinoPorRuta } from "@/lib/herramientas";
import Tecla from "@/components/cuaderno/Tecla";

/**
 * El atajo del dashboard: la cartera real con su rentabilidad. Está porque **enseña un dato vivo**; un atajo sin dato
 * es un botón más, y de esos ya hay de sobra en el menú.
 *
 * Es una tarjeta de producto menta (el color del Portfolio) con su cifra con
 * signo en verde o rojo, y el botón es una tecla.
 *
 * Hubo otro, el del Trading en Directo, que se retiró con el servicio el
 * 31-10-2026. Si la cartera no responde, no se pinta nada: mejor eso que una
 * tarjeta con un hueco donde debería ir la cifra.
 */
export default async function DashboardAtajos({ isPremium }: { isPremium: boolean }) {
  const resumen = await resumenPortfolioPublico();
  if (!resumen) return null;

  const destinoPortfolio = destinoPorRuta("/portfolio", { logueado: true, premium: isPremium });

  const sube = resumen.rentabilidadPct >= 0;

  return (
    <section className="dash-atajo tono-menta" aria-label="Portfolio Adelin">
      <span className="dash-atajo-icon" aria-hidden="true">
        <Wallet size={24} strokeWidth={2.2} />
      </span>

      <span className="dash-atajo-cuerpo">
        <span className="pn-etiqueta">Portfolio Adelin</span>
        <span className={`dash-atajo-cifra ${sube ? "is-sube" : "is-baja"}`}>
          {sube ? "+" : ""}
          {resumen.rentabilidadPct.toFixed(1).replace(".", ",")} %
        </span>
        <span className="dash-atajo-pie">
          Rentabilidad de la cartera real · {resumen.posiciones}{" "}
          {resumen.posiciones === 1 ? "posición" : "posiciones"}
        </span>
      </span>

      <Tecla href={destinoPortfolio} color="menta" className="dash-atajo-cta">
        {!isPremium && <Lock size={14} strokeWidth={2.6} aria-hidden="true" />}
        Ver cartera
        <ArrowRight size={16} strokeWidth={2.6} aria-hidden="true" />
      </Tecla>
    </section>
  );
}
