"use client";
import { useState } from "react";
import { Flame, Coins, TrendingDown, TrendingUp, Minus } from "lucide-react";

// Visualización interactiva del Burn-and-Mint Equilibrium (BME):
// el usuario mueve la demanda de renderizado y ve cómo el balance entre
// tokens quemados (por artistas) y emitidos (a node operators) hace que
// RENDER sea deflacionario, inflacionario o neutral.

export default function GuideRenderTokenomics() {
  const [demand, setDemand] = useState(60); // 0–100 nivel de demanda de render

  // Modelo simplificado y didáctico (no son cifras reales de la red):
  // - burn crece con la demanda (más trabajos = más RENDER quemado al pagar)
  // - mint es la emisión base a node operators, relativamente estable
  const burn = Math.round(demand * 1.4);
  const mint = 55;
  const net = burn - mint; // >0 deflacionario, <0 inflacionario

  const state =
    net > 8 ? { label: "Deflacionario", cls: "defl", Icon: TrendingDown,
      desc: "Se quema más RENDER del que se emite: la oferta neta baja. Suele ocurrir cuando hay mucha demanda real de renderizado." }
    : net < -8 ? { label: "Inflacionario", cls: "infl", Icon: TrendingUp,
      desc: "Se emite más RENDER del que se quema: la oferta neta sube. Ocurre cuando hay poca demanda y la red sigue premiando a los nodos." }
    : { label: "En equilibrio", cls: "eq", Icon: Minus,
      desc: "Lo que se quema y lo que se emite casi se compensan: la oferta se mantiene estable. Es el punto de \"equilibrio\" que busca el modelo." };

  const StateIcon = state.Icon;
  const max = 140;
  const burnPct = Math.min((burn / max) * 100, 100);
  const mintPct = Math.min((mint / max) * 100, 100);

  return (
    <div className="render-bme">
      <div className="render-bme-lbl">Modelo Burn-and-Mint Equilibrium — mueve la demanda de renderizado</div>

      <div className="render-bme-flow">
        {/* Lado quema */}
        <div className="render-bme-side">
          <div className="render-bme-side-icon burn"><Flame size={20} /></div>
          <div className="render-bme-side-name">Artistas queman RENDER</div>
          <div className="render-bme-side-sub">Pagan por trabajos de render</div>
          <div className="render-bme-bar-track">
            <div className="render-bme-bar burn" style={{ width: `${burnPct}%` }} />
          </div>
          <div className="render-bme-side-val">{burn} <span>tokens/período</span></div>
        </div>

        {/* Lado emisión */}
        <div className="render-bme-side">
          <div className="render-bme-side-icon mint"><Coins size={20} /></div>
          <div className="render-bme-side-name">Node operators reciben RENDER</div>
          <div className="render-bme-side-sub">Recompensa por prestar su GPU</div>
          <div className="render-bme-bar-track">
            <div className="render-bme-bar mint" style={{ width: `${mintPct}%` }} />
          </div>
          <div className="render-bme-side-val">{mint} <span>tokens/período</span></div>
        </div>
      </div>

      {/* Slider de demanda */}
      <div className="render-bme-control">
        <label htmlFor="render-demand" className="render-bme-control-lbl">
          Demanda de renderizado en la red
        </label>
        <input
          id="render-demand"
          type="range"
          min={0}
          max={100}
          value={demand}
          onChange={(e) => setDemand(Number(e.target.value))}
          className="render-bme-slider"
          aria-valuetext={`${demand}% de demanda`}
        />
        <div className="render-bme-control-scale">
          <span>Red vacía</span>
          <span>Red saturada</span>
        </div>
      </div>

      {/* Resultado */}
      <div className={`render-bme-result ${state.cls}`}>
        <StateIcon size={22} aria-hidden="true" />
        <div>
          <div className="render-bme-result-label">{state.label}</div>
          <div className="render-bme-result-desc">{state.desc}</div>
        </div>
      </div>

      <div className="render-bme-note">
        Cifras ilustrativas para explicar el mecanismo — no representan la emisión real de la red.
      </div>
    </div>
  );
}
