"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

/**
 * Las proporciones que dicen si las cifras de un token se sostienen: precio,
 * oferta, TVL y volumen, puestos unos frente a otros. Viene rellenada con los
 * datos de Rain del 14-11-2026 (CoinGecko y DefiLlama), pero sirve para
 * cualquier token: basta con cambiar las casillas.
 *
 * No consulta nada en vivo. Al revisar la guía, se actualiza INICIAL con las
 * mismas fuentes y la misma fecha que cita el texto.
 */
const INICIAL = {
  precio: "0,003692",
  circulante: "714,41",
  total: "1142,40",
  tvl: "6,59",
  volumen: "12,16",
  compra: "5000",
};

type Campo = keyof typeof INICIAL;

const leer = (s: string) => {
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
// El precio lleva muchos decimales: ahí el punto no es separador de miles.
const leerPrecio = (s: string) => {
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const num = (n: number, dec = 0) => n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const millones = (dolares: number) => `${num(dolares / 1e6, dolares >= 1e9 ? 0 : 1)} M$`;

const CAMPOS: { id: Campo; etiqueta: string; unidad: string }[] = [
  { id: "precio", etiqueta: "Precio del token", unidad: "dólares" },
  { id: "circulante", etiqueta: "Oferta circulante", unidad: "miles de millones" },
  { id: "total", etiqueta: "Oferta total", unidad: "miles de millones" },
  { id: "tvl", etiqueta: "Dinero depositado (TVL)", unidad: "millones de dólares" },
  { id: "volumen", etiqueta: "Volumen de 24 horas", unidad: "millones de dólares" },
  { id: "compra", etiqueta: "Lo que piensas comprar", unidad: "dólares" },
];

export default function GuideRainProporciones() {
  const [v, setV] = useState(INICIAL);
  const cambiar = (id: Campo, valor: string) => setV((prev) => ({ ...prev, [id]: valor }));

  const precio = leerPrecio(v.precio);
  const circulante = leer(v.circulante) * 1e9;
  const total = leer(v.total) * 1e9;
  const tvl = leer(v.tvl) * 1e6;
  const volumen = leer(v.volumen) * 1e6;
  const compra = leer(v.compra);

  const cap = precio * circulante;
  const fdv = precio * total;
  const bloqueados = Math.max(total - circulante, 0);
  const valorBloqueado = bloqueados * precio;
  const capTvl = tvl > 0 ? cap / tvl : 0;
  const rotacion = cap > 0 ? (volumen / cap) * 100 : 0;
  const dias = volumen > 0 ? valorBloqueado / volumen : 0;
  const pesoCompra = volumen > 0 ? (compra / volumen) * 100 : 0;
  const pctBloqueado = total > 0 ? (bloqueados / total) * 100 : 0;

  const listo = precio > 0 && circulante > 0 && total > 0;

  return (
    <div className="rain-prop">
      <div className="rain-prop-cab">
        <p className="rain-prop-titulo">Medidor de proporciones de un token</p>
        <button type="button" className="rain-prop-reset" onClick={() => setV(INICIAL)}>
          <RotateCcw size={15} aria-hidden="true" /> Datos de Rain
        </button>
      </div>

      <div className="rain-prop-campos">
        {CAMPOS.map((c) => (
          <label key={c.id} htmlFor={`rain-${c.id}`}>
            <span>{c.etiqueta}</span>
            <input
              id={`rain-${c.id}`}
              inputMode="decimal"
              value={v[c.id]}
              onChange={(e) => cambiar(c.id, e.target.value)}
            />
            <small>{c.unidad}</small>
          </label>
        ))}
      </div>

      {listo ? (
        <div className="rain-prop-resultados" aria-live="polite">
          <div>
            <span>Capitalización</span>
            <strong>{millones(cap)}</strong>
            <small>Precio por oferta circulante. Si incluyes lo bloqueado: {millones(fdv)}</small>
          </div>
          <div className={capTvl > 50 ? "es-alerta" : ""}>
            <span>Capitalización frente al TVL</span>
            <strong>{capTvl > 0 ? `${num(capTvl)} veces` : "—"}</strong>
            <small>Cuántas veces vale el token lo que hay depositado en el protocolo</small>
          </div>
          <div className={rotacion < 1 ? "es-alerta" : ""}>
            <span>Rotación diaria</span>
            <strong>{num(rotacion, 2)} %</strong>
            <small>Parte de la capitalización que cambia de manos en un día</small>
          </div>
          <div>
            <span>Aún sin circular</span>
            <strong>{num(pctBloqueado, 1)} %</strong>
            <small>{num(bloqueados / 1e9, 1)} mil millones de tokens, que hoy valdrían {millones(valorBloqueado)}</small>
          </div>
          <div className={dias > 30 ? "es-alerta" : ""}>
            <span>Días de volumen para absorberlos</span>
            <strong>{dias > 0 ? num(dias) : "—"}</strong>
            <small>Si todo lo que falta saliera a la venta al precio de hoy</small>
          </div>
          <div className={pesoCompra > 1 ? "es-alerta" : ""}>
            <span>Tu compra frente al volumen</span>
            <strong>{num(pesoCompra, pesoCompra < 0.01 ? 4 : 2)} %</strong>
            <small>Por encima del 1 % ya moverías el precio al entrar o al salir</small>
          </div>
        </div>
      ) : (
        <p className="rain-prop-aviso">Escribe al menos el precio y las dos ofertas para ver el resultado.</p>
      )}

      <p className="rain-prop-nota">
        Datos iniciales del 14 de noviembre de 2026: precio, ofertas y volumen de CoinGecko; TVL de DefiLlama.
        En rojo, las proporciones que merecen una segunda mirada: los umbrales son orientativos, no una regla.
      </p>
    </div>
  );
}
