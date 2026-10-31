import Link from "next/link";
import { Wallet, ArrowRight, Lock } from "lucide-react";
import { resumenPortfolioPublico } from "@/lib/portfolio-publico";
import { destinoPorRuta } from "@/lib/herramientas";

/**
 * El atajo del dashboard, arriba del todo: la cartera real con su
 * rentabilidad de hoy. Está porque **enseña un dato vivo**; un atajo sin dato
 * es un botón más, y de esos ya hay de sobra en el menú.
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
    <div className="dash-atajos">
      <Link href={destinoPortfolio} className="dash-atajo dash-atajo--portfolio">
        <span className="dash-atajo-icon" aria-hidden="true">
          <Wallet size={17} strokeWidth={2} />
        </span>

        <span className="dash-atajo-cuerpo">
          <span className="dash-atajo-label">Portfolio Adelin</span>
          <span className={`dash-atajo-cifra${sube ? "" : " is-baja"}`}>
            {sube ? "+" : ""}
            {resumen.rentabilidadPct.toFixed(1).replace(".", ",")} %
          </span>
          <span className="dash-atajo-pie">
            Rentabilidad de la cartera real · {resumen.posiciones}{" "}
            {resumen.posiciones === 1 ? "posición" : "posiciones"}
          </span>
        </span>

        <span className="dash-atajo-cta">
          {!isPremium && <Lock size={12} strokeWidth={2.6} aria-hidden="true" />}
          Ver cartera
          <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
        </span>
      </Link>
    </div>
  );
}
