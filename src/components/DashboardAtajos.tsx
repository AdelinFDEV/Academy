import Link from "next/link";
import { Wallet, Radio, ArrowRight, Lock } from "lucide-react";
import { proximaSesion } from "@/lib/directo";
import { resumenPortfolioPublico } from "@/lib/portfolio-publico";
import { destinoPorRuta } from "@/lib/herramientas";

/**
 * Los dos únicos atajos del dashboard, arriba del todo.
 *
 * Sustituyen a las seis tarjetas del antiguo spotlight, retiradas el
 * 06-09-2026: el usuario entra a su panel a ver lo suyo, no a que le vendan
 * media academia. Quedan dos, y cada una porque **enseña un dato vivo**, no
 * porque haya que anunciar la herramienta:
 *
 *  · La cartera real, con su rentabilidad de hoy.
 *  · El directo, con la fecha de la próxima sesión.
 *
 * Un atajo sin dato es un botón más, y de esos ya hay de sobra en el menú.
 *
 * Si la cartera no responde, su tarjeta **no se pinta**: mejor una sola que una
 * con un hueco donde debería ir la cifra.
 */
export default async function DashboardAtajos({ isPremium }: { isPremium: boolean }) {
  const [resumen, sesion] = [await resumenPortfolioPublico(), proximaSesion()];

  const destinoPortfolio = destinoPorRuta("/portfolio", { logueado: true, premium: isPremium });
  const destinoDirecto = destinoPorRuta("/trading-en-directo", { logueado: true, premium: isPremium });

  const sube = (resumen?.rentabilidadPct ?? 0) >= 0;

  return (
    <div className="dash-atajos">
      {resumen && (
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
      )}

      <Link href={destinoDirecto} className="dash-atajo dash-atajo--directo">
        <span className="dash-atajo-icon" aria-hidden="true">
          <Radio size={17} strokeWidth={2} />
        </span>

        <span className="dash-atajo-cuerpo">
          <span className="dash-atajo-label">
            Trading en Directo
            {sesion.enCurso && <span className="dash-atajo-vivo">EN VIVO</span>}
          </span>
          <span className="dash-atajo-cifra dash-atajo-cifra--fecha">
            {sesion.relativo ?? sesion.cuando}
          </span>
          <span className="dash-atajo-pie">
            {sesion.enCurso
              ? "La sesión está en marcha ahora mismo"
              : `Próxima sesión${sesion.relativo ? ` — ${sesion.cuando}` : ""} · 17:00 a 19:00`}
          </span>
        </span>

        <span className="dash-atajo-cta">
          {!isPremium && <Lock size={12} strokeWidth={2.6} aria-hidden="true" />}
          {sesion.enCurso ? "Entrar" : "Ver detalles"}
          <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
        </span>
      </Link>
    </div>
  );
}
