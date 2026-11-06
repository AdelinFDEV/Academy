"use client";

import { useState } from "react";
import { PORTFOLIOS, type PortfolioId } from "@/lib/portfolios";

/**
 * El conmutador entre carteras.
 *
 * Vive aparte de las dos carteras porque cada una es un componente pesado con
 * su propio estado, y meter el conmutador dentro de cualquiera de ellas dejaría
 * a la otra colgando de su hermana.
 *
 * El estado NO va en la URL a propósito: `/portfolio` es una ruta de pago que
 * ni siquiera está en el sitemap, así que no hay nada que indexar por cartera,
 * y un `?tab=` añadiría una URL más que mantener a cambio de nada.
 *
 * Rehecho el 04-11-2026 como un control segmentado: cada pestaña con su color
 * y la descripción de la cartera activa al lado.
 */
export default function PortfoliosTabs({
  spot,
  dca,
}: {
  spot: React.ReactNode;
  dca: React.ReactNode;
}) {
  const [activa, setActiva] = useState<PortfolioId>("spot");
  const actual = PORTFOLIOS.find((p) => p.id === activa)!;

  return (
    <>
      <div className="pv-pestanas-fila">
        <div className="pv-pestanas" role="tablist" aria-label="Carteras">
          {PORTFOLIOS.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={p.id === activa}
              className={`pv-pestana${p.id === activa ? " is-activa" : ""}`}
              style={{ "--pv-tab": p.color } as React.CSSProperties}
              onClick={() => setActiva(p.id)}
            >
              <i aria-hidden="true" />
              {p.label}
            </button>
          ))}
        </div>
        <p className="pv-pestanas-desc" style={{ "--pv-tab": actual.color } as React.CSSProperties}>
          {actual.desc}
        </p>
      </div>

      {/* Las dos se montan siempre y se oculta la que no toca: cambiar de
          pestaña no debe volver a pedir precios a CoinGecko ni perder lo que
          hubiera a medio escribir en el formulario de admin. */}
      <div className="pv-panel" hidden={activa !== "spot"}>{spot}</div>
      <div className="pv-panel" hidden={activa !== "dca"}>{dca}</div>
    </>
  );
}
