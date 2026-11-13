"use client";

import { useMemo, useRef, useState } from "react";
import type { CompraCalculada } from "@/lib/dca";
import { formatoES } from "@/lib/formato";

interface Props {
  /** Las compras realizadas, en cualquier orden: aquí se ordenan por fecha. */
  compras: CompraCalculada[];
  precioMedio: number;
  /** `null` si CoinGecko no respondió: entonces no hay línea de hoy ni colores. */
  precioActual: number | null;
}

/** Medidas internas del gráfico, en unidades del viewBox. */
const ANCHO = 1000;
const ALTO = 300;

const usd = (n: number, dec = 0) =>
  formatoES(n, { minimumFractionDigits: dec, maximumFractionDigits: dec }) + " $";

const pct = (n: number) =>
  `${n >= 0 ? "+" : ""}${formatoES(n, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

const fechaLarga = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("es-ES", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];

/** Un número «redondo» para las marcas del eje: 1, 2, 2,5 o 5 por potencia de 10. */
function pasoRedondo(rango: number, marcas: number): number {
  const bruto = rango / marcas;
  const pot = Math.pow(10, Math.floor(Math.log10(bruto)));
  const n = bruto / pot;
  const base = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return base * pot;
}

/**
 * El gráfico del DCA de Bitcoin: el precio pagado en cada compra a lo largo
 * del tiempo, frente al precio medio y al de hoy.
 *
 * Hecho el 04-11-2026 para sustituir al primero, que repartía las compras por
 * su posición en la lista y no por su fecha (con huecos entre compras, el
 * tiempo salía deformado) y no tenía ejes. Este:
 *
 *  · Pone cada compra en su fecha real, con los meses abajo y la escala de
 *    precios a la izquierda.
 *  · Marca cada compra en verde si hoy va en ganancias y en rojo si va en
 *    pérdidas: se ve de un vistazo qué compras están por debajo del precio
 *    actual.
 *  · Al pasar el ratón (o el dedo) enseña la compra más cercana: fecha,
 *    importe, precio, BTC comprados y cómo va hoy.
 *  · Arriba, el resumen: cuántas compras van en ganancias, cuántas se hicieron
 *    por debajo del precio medio, y la más barata y la más cara.
 *
 * Todo sale de las compras reales; nada es estimado.
 */
export default function DcaGrafico({ compras, precioMedio, precioActual }: Props) {
  const lienzo = useRef<HTMLDivElement>(null);
  const [activa, setActiva] = useState<number | null>(null);

  const datos = useMemo(() => {
    const puntos = compras
      .filter((c) => c.estado === "realizada")
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
    if (puntos.length < 2) return null;

    const t = puntos.map((c) => Date.parse(c.fecha + "T00:00:00Z"));
    const t0 = t[0];
    const t1 = t[t.length - 1];
    const span = Math.max(t1 - t0, 1);

    // Escala vertical con un margen, y siempre incluyendo el medio y el de hoy.
    const precios = [...puntos.map((c) => c.precio_btc), precioMedio, ...(precioActual ? [precioActual] : [])];
    const min = Math.min(...precios);
    const max = Math.max(...precios);
    const paso = pasoRedondo(max - min || max * 0.1, 4);
    const bajo = Math.floor((min - paso * 0.3) / paso) * paso;
    const alto = Math.ceil((max + paso * 0.3) / paso) * paso;

    const x = (i: number) => ((t[i] - t0) / span) * ANCHO;
    const y = (v: number) => ALTO - ((v - bajo) / (alto - bajo)) * ALTO;

    const linea = puntos.map((c, i) => `${x(i).toFixed(1)},${y(c.precio_btc).toFixed(1)}`).join(" ");

    // Marcas del eje de precios.
    const marcasY: number[] = [];
    for (let v = bajo + paso; v < alto; v += paso) marcasY.push(v);

    // Un mes por marca; si son muchos, uno de cada dos.
    const marcasX: { pos: number; texto: string }[] = [];
    const d = new Date(t0);
    let cursor = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
    while (cursor <= t1) {
      const f = new Date(cursor);
      const mes = f.getUTCMonth();
      marcasX.push({
        pos: ((cursor - t0) / span) * 100,
        texto: mes === 0 ? `ene ${String(f.getUTCFullYear()).slice(2)}` : MESES[mes],
      });
      cursor = Date.UTC(f.getUTCFullYear(), mes + 1, 1);
    }
    const marcasXVisibles = marcasX.length > 8 ? marcasX.filter((_, i) => i % 2 === 0) : marcasX;

    const enGanancia = precioActual ? puntos.filter((c) => c.precio_btc < precioActual).length : null;
    const bajoMedia = puntos.filter((c) => c.precio_btc < precioMedio).length;
    const masBarata = puntos.reduce((a, c) => (c.precio_btc < a.precio_btc ? c : a));
    const masCara = puntos.reduce((a, c) => (c.precio_btc > a.precio_btc ? c : a));

    return {
      puntos,
      xs: puntos.map((_, i) => x(i)),
      ys: puntos.map((c) => y(c.precio_btc)),
      linea,
      area: `0,${ALTO} ${linea} ${ANCHO},${ALTO}`,
      yMedio: y(precioMedio),
      yActual: precioActual ? y(precioActual) : null,
      marcasY: marcasY.map((v) => ({ v, top: (y(v) / ALTO) * 100 })),
      marcasX: marcasXVisibles,
      enGanancia,
      bajoMedia,
      masBarata,
      masCara,
    };
  }, [compras, precioMedio, precioActual]);

  if (!datos) return null;

  const { puntos } = datos;

  // La compra más cercana al puntero, por su posición horizontal.
  function mover(e: React.PointerEvent<HTMLDivElement>) {
    const r = lienzo.current?.getBoundingClientRect();
    if (!r || !datos) return;
    const fx = ((e.clientX - r.left) / r.width) * ANCHO;
    let mejor = 0;
    for (let i = 1; i < datos.xs.length; i++) {
      if (Math.abs(datos.xs[i] - fx) < Math.abs(datos.xs[mejor] - fx)) mejor = i;
    }
    setActiva(mejor);
  }

  const sel = activa !== null ? puntos[activa] : null;
  const selIzq = activa !== null ? (datos.xs[activa] / ANCHO) * 100 : 0;
  const selArriba = activa !== null ? (datos.ys[activa] / ALTO) * 100 : 0;

  // Las etiquetas del medio y de hoy van a la derecha, como en un gráfico de
  // trading. Si caen casi a la misma altura, se separan para que no se pisen.
  const medioTop = (datos.yMedio / ALTO) * 100;
  let hoyTop = datos.yActual !== null ? (datos.yActual / ALTO) * 100 : null;
  let medioTopFinal = medioTop;
  if (hoyTop !== null && Math.abs(hoyTop - medioTop) < 9) {
    const centro = (hoyTop + medioTop) / 2;
    const arribaEsHoy = hoyTop <= medioTop;
    hoyTop = arribaEsHoy ? centro - 4.5 : centro + 4.5;
    medioTopFinal = arribaEsHoy ? centro + 4.5 : centro - 4.5;
  }

  return (
    <div className="pv-grafico">
      <div className="pv-grafico-cab">
        <div>
          <span className="pv-etiqueta">Precio pagado en cada compra</span>
          <p className="pv-grafico-sub">
            {puntos.length} compras · de {fechaLarga(puntos[0].fecha)} a {fechaLarga(puntos[puntos.length - 1].fecha)}
          </p>
        </div>
        <ul className="pv-grafico-leyenda">
          <li className="es-compras"><i aria-hidden="true" /> Precio de compra</li>
          <li className="es-medio"><i aria-hidden="true" /> Precio medio</li>
          {precioActual && <li className="es-hoy"><i aria-hidden="true" /> Precio de hoy</li>}
        </ul>
      </div>

      {/* ── El resumen ── */}
      <div className="pv-g-resumen">
        {datos.enGanancia !== null && (
          <div className="pv-g-dato">
            <span className="pv-g-dato-valor es-sube">{datos.enGanancia}<small>/{puntos.length}</small></span>
            <span className="pv-g-dato-texto">compras en ganancias hoy</span>
          </div>
        )}
        <div className="pv-g-dato">
          <span className="pv-g-dato-valor">{datos.bajoMedia}<small>/{puntos.length}</small></span>
          <span className="pv-g-dato-texto">por debajo del precio medio</span>
        </div>
        <div className="pv-g-dato">
          <span className="pv-g-dato-valor">{usd(datos.masBarata.precio_btc)}</span>
          <span className="pv-g-dato-texto">la más barata · {fechaLarga(datos.masBarata.fecha)}</span>
        </div>
        <div className="pv-g-dato">
          <span className="pv-g-dato-valor">{usd(datos.masCara.precio_btc)}</span>
          <span className="pv-g-dato-texto">la más cara · {fechaLarga(datos.masCara.fecha)}</span>
        </div>
      </div>

      {/* ── El gráfico ── */}
      <div className="pv-g-cuerpo">
        <div className="pv-g-eje-y" aria-hidden="true">
          {datos.marcasY.map((m) => (
            <span key={m.v} style={{ top: `${m.top}%` }}>{(m.v / 1000).toLocaleString("es-ES")}k</span>
          ))}
        </div>

        <div className="pv-g-zona">
          <div
            className="pv-grafico-lienzo"
            ref={lienzo}
            onPointerMove={mover}
            onPointerDown={mover}
            onPointerLeave={() => setActiva(null)}
            role="img"
            aria-label={`Precio de Bitcoin en cada una de las ${puntos.length} compras del DCA, frente al precio medio de ${usd(precioMedio)}${precioActual ? ` y al de hoy, ${usd(precioActual)}` : ""}.`}
          >
            <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="pvDcaArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#f7931a" stopOpacity="0.3" />
                  <stop offset="1" stopColor="#f7931a" stopOpacity="0" />
                </linearGradient>
              </defs>
              {datos.marcasY.map((m) => (
                <line key={m.v} x1="0" x2={ANCHO} y1={(m.top / 100) * ALTO} y2={(m.top / 100) * ALTO} className="pv-g-guia" />
              ))}
              <polygon points={datos.area} fill="url(#pvDcaArea)" />
              <line x1="0" x2={ANCHO} y1={datos.yMedio} y2={datos.yMedio} className="pv-g-medio" />
              {datos.yActual !== null && (
                <line x1="0" x2={ANCHO} y1={datos.yActual} y2={datos.yActual} className="pv-g-hoy" />
              )}
              <polyline points={datos.linea} className="pv-g-linea" />
            </svg>

            {/* Un punto por compra, en HTML: en el SVG estirado saldrían ovalados. */}
            {puntos.map((c, i) => (
              <span
                key={c.id}
                className={`pv-g-punto${precioActual ? (c.precio_btc < precioActual ? " es-sube" : " es-baja") : ""}${activa === i ? " is-activo" : ""}`}
                style={{ left: `${(datos.xs[i] / ANCHO) * 100}%`, top: `${(datos.ys[i] / ALTO) * 100}%` }}
                aria-hidden="true"
              />
            ))}

            <span className="pv-g-etiqueta es-medio" style={{ top: `${medioTopFinal}%` }}>
              Medio {usd(precioMedio)}
            </span>
            {hoyTop !== null && precioActual && (
              <span className="pv-g-etiqueta es-hoy" style={{ top: `${hoyTop}%` }}>
                Hoy {usd(precioActual)}
              </span>
            )}

            {/* La compra bajo el puntero. */}
            {sel && (
              <>
                <span className="pv-g-cruz" style={{ left: `${selIzq}%` }} aria-hidden="true" />
                <div
                  className={`pv-g-ficha${selIzq > 60 ? " a-la-izquierda" : ""}`}
                  style={{ left: `${selIzq}%`, top: `${Math.min(Math.max(selArriba, 18), 70)}%` }}
                >
                  <span className="pv-g-ficha-fecha">{fechaLarga(sel.fecha)}</span>
                  <span className="pv-g-ficha-fila"><span>Precio BTC</span><b>{usd(sel.precio_btc)}</b></span>
                  <span className="pv-g-ficha-fila"><span>Importe</span><b>{usd(sel.importe, 2)}</b></span>
                  <span className="pv-g-ficha-fila"><span>BTC comprados</span><b>{sel.btc.toFixed(8)}</b></span>
                  {precioActual && (
                    <span className={`pv-g-ficha-hoy ${sel.ganancia >= 0 ? "es-sube" : "es-baja"}`}>
                      Hoy {pct(sel.rentabilidadPct)} · {sel.ganancia >= 0 ? "+" : ""}{usd(sel.ganancia, 2)}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="pv-g-eje-x" aria-hidden="true">
            {datos.marcasX.map((m) => (
              <span key={m.pos} style={{ left: `${m.pos}%` }}>{m.texto}</span>
            ))}
          </div>
        </div>
      </div>

      <p className="pv-g-pista">Pasa el ratón por el gráfico para ver cada compra.</p>
    </div>
  );
}
