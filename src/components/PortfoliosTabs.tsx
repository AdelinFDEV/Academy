"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Bitcoin, Coins } from "lucide-react";
import { PORTFOLIOS, type PortfolioId } from "@/lib/portfolios";
import Tecla from "@/components/cuaderno/Tecla";

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
 * Rehecho el 17-11-2026 con el estilo «Cuaderno de estudio»: las dos carteras
 * son dos teclas, y la de la cartera abierta se queda hundida, como una tecla
 * de bloqueo. Se cambia también con las flechas del teclado (patrón de
 * pestañas de WAI-ARIA).
 */

const ICONO: Record<PortfolioId, ReactNode> = {
  spot: <Coins size={18} strokeWidth={2.4} aria-hidden="true" />,
  dca: <Bitcoin size={18} strokeWidth={2.4} aria-hidden="true" />,
};

export default function PortfoliosTabs({
  spot,
  dca,
}: {
  spot: ReactNode;
  dca: ReactNode;
}) {
  const [activa, setActiva] = useState<PortfolioId>("spot");
  const actual = PORTFOLIOS.find((p) => p.id === activa)!;

  function conFlechas(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = PORTFOLIOS.findIndex((p) => p.id === activa);
    const siguiente = (i + (e.key === "ArrowRight" ? 1 : -1) + PORTFOLIOS.length) % PORTFOLIOS.length;
    setActiva(PORTFOLIOS[siguiente].id);
    document.getElementById(`pv-tab-${PORTFOLIOS[siguiente].id}`)?.focus();
  }

  return (
    <>
      <div className="pv-pestanas-fila">
        <div className="pv-pestanas" role="tablist" aria-label="Carteras" onKeyDown={conFlechas}>
          {PORTFOLIOS.map((p) => {
            const es = p.id === activa;
            return (
              <Tecla
                key={p.id}
                role="tab"
                id={`pv-tab-${p.id}`}
                aria-selected={es}
                aria-controls={`pv-panel-${p.id}`}
                tabIndex={es ? 0 : -1}
                color={es ? "menta" : "blanca"}
                className={`pv-pestana${es ? " is-pulsada" : ""}`}
                onClick={() => setActiva(p.id)}
              >
                {ICONO[p.id]}
                {p.label}
              </Tecla>
            );
          })}
        </div>
        <p className="pv-pestanas-desc" aria-live="polite">{actual.desc}</p>
      </div>

      {/* Las dos se montan siempre y se oculta la que no toca: cambiar de
          pestaña no debe volver a pedir precios a CoinGecko ni perder lo que
          hubiera a medio escribir en el formulario de admin. */}
      <div className="pv-panel" role="tabpanel" id="pv-panel-spot" aria-labelledby="pv-tab-spot" hidden={activa !== "spot"}>
        {spot}
      </div>
      <div className="pv-panel" role="tabpanel" id="pv-panel-dca" aria-labelledby="pv-tab-dca" hidden={activa !== "dca"}>
        {dca}
      </div>
    </>
  );
}
