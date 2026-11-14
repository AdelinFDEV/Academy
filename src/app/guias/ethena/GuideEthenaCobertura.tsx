"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Scale } from "lucide-react";

/**
 * Simulador de la cobertura de Ethena, en dos pestañas:
 *  · Precio: 1.000 $ de ETH al contado más una posición corta del mismo tamaño
 *    en un perpetuo lineal. Si ETH se mueve un X %, lo que gana una pata lo
 *    pierde la otra y el conjunto sigue valiendo 1.000 $.
 *  · Funding: lo que cobra (o paga) la parte cubierta del respaldo según el
 *    funding anual, y cuántos días aguantaría el fondo de reserva si fuese
 *    negativo.
 *
 * Es un modelo de enseñanza: no cuenta comisiones, deslizamiento ni el
 * rendimiento del efectivo. Los dos datos del protocolo (respaldo total y
 * fondo de reserva) son los del panel de transparencia de Ethena el
 * 14-11-2026: al revisar la guía, se actualizan aquí y en el texto.
 */
const RESPALDO_USD = 4_910_000_000;
const FONDO_RESERVA_USD = 62_000_000;
const NOCIONAL = 1000;

const usd = (n: number, dec = 0) =>
  `${n < 0 ? "−" : ""}${Math.abs(n).toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec })} $`;
const pct = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toLocaleString("es-ES")} %`;

function Precio() {
  const [mov, setMov] = useState(-30);
  const spot = NOCIONAL * (1 + mov / 100);
  const corto = -NOCIONAL * (mov / 100);
  const total = spot + corto;

  return (
    <>
      <label htmlFor="ena-mov" className="ena-sim-control">
        <span>
          ETH se mueve <strong>{pct(mov)}</strong>
        </span>
        <input
          id="ena-mov"
          type="range"
          min={-80}
          max={200}
          step={5}
          value={mov}
          onChange={(e) => setMov(Number(e.target.value))}
        />
        <span className="ena-sim-escala" aria-hidden="true"><span>−80 %</span><span>0</span><span>+200 %</span></span>
      </label>

      <div className="ena-sim-patas" aria-live="polite">
        <div>
          <span className="ena-sim-pata-icono" aria-hidden="true">{mov >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}</span>
          <span>ETH al contado</span>
          <strong>{usd(spot)}</strong>
          <small>Empezó en 1.000 $</small>
        </div>
        <div>
          <span className="ena-sim-pata-icono" aria-hidden="true">{mov >= 0 ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}</span>
          <span>Posición corta</span>
          <strong className={corto < 0 ? "es-neg" : corto > 0 ? "es-pos" : ""}>{corto > 0 ? "+" : ""}{usd(corto)}</strong>
          <small>Gana si ETH baja, pierde si sube</small>
        </div>
        <div className="es-total">
          <span className="ena-sim-pata-icono" aria-hidden="true"><Scale size={18} /></span>
          <span>Lo que vale el conjunto</span>
          <strong>{usd(total)}</strong>
          <small>Respalda 1.000 USDe</small>
        </div>
      </div>
      <p className="ena-sim-nota">
        {mov === 0
          ? "Sin movimiento no hay nada que compensar: el conjunto vale lo mismo."
          : `ETH ${mov > 0 ? "sube" : "baja"} un ${Math.abs(mov)} %. La pata al contado ${mov > 0 ? "gana" : "pierde"} ${usd(Math.abs(spot - NOCIONAL))} y la corta ${mov > 0 ? "pierde" : "gana"} lo mismo. Eso sí: si sube, alguien tiene que aportar margen a la posición corta a tiempo.`}
      </p>
    </>
  );
}

function Funding() {
  const [funding, setFunding] = useState(8);
  const [cubierto, setCubierto] = useState(20);

  const anualPorMil = NOCIONAL * (cubierto / 100) * (funding / 100);
  const anualProtocolo = RESPALDO_USD * (cubierto / 100) * (funding / 100);
  const diasFondo = anualProtocolo < 0 ? FONDO_RESERVA_USD / (-anualProtocolo / 365) : null;

  return (
    <>
      <div className="ena-sim-dos">
        <label htmlFor="ena-funding" className="ena-sim-control">
          <span>
            Funding anualizado <strong>{pct(funding)}</strong>
          </span>
          <input id="ena-funding" type="range" min={-20} max={30} step={1} value={funding} onChange={(e) => setFunding(Number(e.target.value))} />
          <span className="ena-sim-escala" aria-hidden="true"><span>−20 %</span><span>0</span><span>+30 %</span></span>
        </label>
        <label htmlFor="ena-cubierto" className="ena-sim-control">
          <span>
            Parte del respaldo con cobertura <strong>{cubierto} %</strong>
          </span>
          <input id="ena-cubierto" type="range" min={0} max={100} step={5} value={cubierto} onChange={(e) => setCubierto(Number(e.target.value))} />
          <span className="ena-sim-escala" aria-hidden="true"><span>0 %</span><span>50 %</span><span>100 %</span></span>
        </label>
      </div>

      <div className="ena-sim-patas ena-sim-patas--dos" aria-live="polite">
        <div>
          <span>Por cada 1.000 USDe, al año</span>
          <strong className={anualPorMil < 0 ? "es-neg" : anualPorMil > 0 ? "es-pos" : ""}>{anualPorMil > 0 ? "+" : ""}{usd(anualPorMil, 2)}</strong>
          <small>{anualPorMil >= 0 ? "Lo pagan quienes apuestan al alza" : "Lo paga la posición corta de Ethena"}</small>
        </div>
        <div className={diasFondo !== null ? "es-alerta" : ""}>
          <span>Fondo de reserva (62 M$)</span>
          <strong>{diasFondo === null ? "No se toca" : `${Math.round(diasFondo).toLocaleString("es-ES")} días`}</strong>
          <small>
            {diasFondo === null
              ? "Con funding positivo, la cobertura cobra"
              : `Pierde ${usd(-anualProtocolo / 365)} al día solo por funding`}
          </small>
        </div>
      </div>
      <p className="ena-sim-nota">
        Empieza en el 20 % cubierto, cerca de lo que había el 14-11-2026. Cuenta solo el funding de la parte cubierta. Ni el rendimiento del efectivo ni el del staking de ETH, que suavizan
        las pérdidas, ni el hecho de que Ethena pueda reducir la cobertura cuando el funding se vuelve negativo.
      </p>
    </>
  );
}

export default function GuideEthenaCobertura() {
  const [tab, setTab] = useState<"precio" | "funding">("precio");

  return (
    <div className="ena-sim">
      <p className="ena-sim-titulo">Simulador de la cobertura de USDe</p>
      <div className="ena-sim-tabs" role="tablist" aria-label="Qué quieres simular">
        <button type="button" role="tab" id="ena-tab-precio" aria-controls="ena-panel" aria-selected={tab === "precio"} className={tab === "precio" ? "is-activa" : ""} onClick={() => setTab("precio")}>
          Si ETH se mueve
        </button>
        <button type="button" role="tab" id="ena-tab-funding" aria-controls="ena-panel" aria-selected={tab === "funding"} className={tab === "funding" ? "is-activa" : ""} onClick={() => setTab("funding")}>
          Si cambia el funding
        </button>
      </div>
      <div role="tabpanel" id="ena-panel" aria-labelledby={tab === "precio" ? "ena-tab-precio" : "ena-tab-funding"}>{tab === "precio" ? <Precio /> : <Funding />}</div>
    </div>
  );
}
