"use client";

import { TrendingUp, TrendingDown, Gauge } from "lucide-react";

/**
 * Los dos widgets del Radar Diario —Bitcoin 24h y Miedo y Codicia—, extraídos
 * para que **la portada y el radar pinten exactamente lo mismo**.
 *
 * Estaban escritos dentro de `RadarClient`. Copiarlos a la portada habría
 * creado dos versiones que se desincronizan a la primera mejora, que es el
 * problema que ya nos costó dos fallos en esta web (la calculadora que seguía
 * pidiendo registro y el directo anunciado como «próximamente»).
 *
 * Se alimentan de `/api/radar`, que es público y cachea 5 minutos: los datos
 * son los mismos y están igual de vivos en los dos sitios.
 */

export interface RadarBtc {
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  marketCap: number;
  volume24h: number;
}

export interface RadarFng {
  value: number;
  classification: string;
}

const usd = (n: number, max = 0) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: max });

function abbrev(n: number): string {
  if (n >= 1e12) return "$" + (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  return usd(n);
}

const pct = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

export function fngMeta(value: number): { label: string; color: string } {
  if (value <= 24) return { label: "Miedo extremo", color: "#f87171" };
  if (value <= 44) return { label: "Miedo", color: "#fb923c" };
  if (value <= 55) return { label: "Neutral", color: "#fbbf24" };
  if (value <= 74) return { label: "Codicia", color: "#a3e635" };
  return { label: "Codicia extrema", color: "#4ade80" };
}

/**
 * El rango del día que se pinta, y dónde cae el precio dentro de él.
 *
 * CoinGecko refresca `high_24h` y `low_24h` en otro ciclo que
 * `current_price`, y `/api/radar` cachea cinco minutos por encima: llega a
 * pasar que el precio venga por DEBAJO del mínimo del propio rango (o por
 * encima del máximo). Cuando pasaba, la posición salía negativa, el punto se
 * pintaba con un `left` negativo y —como el carril solo es
 * `position: relative`— se escapaba de la tarjeta hasta el borde izquierdo
 * de la web.
 *
 * Se estira el rango hasta incluir el precio, que además es lo cierto: si
 * ahora mismo vale 77.826, el mínimo de las 24 h es 77.826 y no 78.193. Y la
 * posición se acota a [0, 100] de todas formas, que cubre el rango degenerado
 * —máximo igual al mínimo— y cualquier dato raro que llegue de la fuente.
 */
function rangoDelDia(btc: RadarBtc): { low: number; high: number; pos: number } {
  const low = Number.isFinite(btc.low24h) ? Math.min(btc.low24h, btc.price) : btc.price;
  const high = Number.isFinite(btc.high24h) ? Math.max(btc.high24h, btc.price) : btc.price;
  const pos = high > low ? ((btc.price - low) / (high - low)) * 100 : 50;
  return { low, high, pos: Math.min(100, Math.max(0, pos)) };
}

/** Bitcoin en las últimas 24 h: precio, variación, rango del día y volumen. */
export function RadarBtcCard({ btc, loaded }: { btc: RadarBtc | null; loaded: boolean }) {
  const rango = btc ? rangoDelDia(btc) : null;

  return (
    <section className="rd-card rd-card--btc">
      <div className="rd-card-head">
        <span className="rd-card-title">Bitcoin · últimas 24h</span>
        <span className="rd-btc-tag">BTC/USD</span>
      </div>
      {btc && rango ? (
        <>
          <div className="rd-btc-price-row">
            <span className="rd-btc-price">{usd(btc.price)}</span>
            <span className={`rd-btc-change ${btc.change24h >= 0 ? "up" : "down"}`}>
              {btc.change24h >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {pct(btc.change24h)}
            </span>
          </div>
          <div className="rd-range">
            <div className="rd-range-track">
              <span className="rd-range-dot" style={{ left: `${rango.pos}%` }} />
            </div>
            <div className="rd-range-ends">
              <span className="rd-range-low">Mín {usd(rango.low)}</span>
              <span className="rd-range-high">Máx {usd(rango.high)}</span>
            </div>
          </div>
          <div className="rd-btc-foot">
            <div><span>Cap. mercado</span><strong>{abbrev(btc.marketCap)}</strong></div>
            <div><span>Volumen 24h</span><strong>{abbrev(btc.volume24h)}</strong></div>
          </div>
        </>
      ) : (
        <div className="rd-skel">{loaded ? "Sin datos" : "Cargando…"}</div>
      )}
    </section>
  );
}

/** Índice de Miedo y Codicia, con el anillo de progreso. */
export function RadarFngCard({ fng, loaded }: { fng: RadarFng | null; loaded: boolean }) {
  if (!fng) {
    return (
      <section className="rd-card rd-card--fng">
        <div className="rd-card-head">
          <span className="rd-card-title"><Gauge size={15} /> Miedo y Codicia</span>
        </div>
        <div className="rd-skel">{loaded ? "Sin datos" : "Cargando…"}</div>
      </section>
    );
  }

  const meta = fngMeta(fng.value);

  return (
    <section className="rd-card rd-card--fng">
      <div className="rd-card-head">
        <span className="rd-card-title"><Gauge size={15} /> Miedo y Codicia</span>
      </div>
      <div className="rd-fng">
        <div
          className="rd-fng-ring"
          style={{ background: `conic-gradient(${meta.color} ${fng.value * 3.6}deg, rgba(240,244,255,0.08) 0deg)` }}
        >
          <div className="rd-fng-inner">
            <span className="rd-fng-val" style={{ color: meta.color }}>{fng.value}</span>
            <span className="rd-fng-max">/100</span>
          </div>
        </div>
        <span className="rd-fng-label" style={{ color: meta.color }}>{meta.label}</span>
        <span className="rd-fng-note">Sentimiento del mercado cripto</span>
      </div>
    </section>
  );
}
