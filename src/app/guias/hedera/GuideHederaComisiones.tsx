"use client";

import { useState } from "react";

/**
 * Cuánto cuestan N operaciones en Hedera. Las tarifas están fijadas en dólares
 * (docs.hedera.com, «Fees», tabla de la red principal, consultada el
 * 14-11-2026) y se cobran en HBAR al cambio del momento. El precio del HBAR y
 * el cambio a euros son los de CoinGecko de esa misma fecha; el lector puede
 * cambiar el precio para ver que en dólares no se mueve nada.
 *
 * Al revisar la guía: las tarifas (el consejo puede cambiarlas, como hizo con
 * el mensaje de HCS en enero de 2026), el precio y el cambio euro/dólar.
 */
type Tipo = { id: string; nombre: string; usd: number; antes?: number };

const TIPOS: Tipo[] = [
  { id: "hbar", nombre: "Enviar HBAR", usd: 0.0001 },
  { id: "token", nombre: "Enviar un token", usd: 0.001 },
  { id: "hcs", nombre: "Mensaje al servicio de consenso", usd: 0.0008, antes: 0.0001 },
  { id: "nft", nombre: "Acuñar un NFT", usd: 0.02 },
  { id: "asociar", nombre: "Asociar un token a tu cuenta", usd: 0.05 },
  { id: "cuenta", nombre: "Crear una cuenta", usd: 0.05 },
  { id: "crear-token", nombre: "Crear un token nuevo", usd: 1 },
];

const PRECIO_HBAR_USD = 0.0582;
const EUR_POR_USD = 0.907;
const CANTIDADES = [1, 1_000, 100_000, 1_000_000];

/** Cantidades: el punto es separador de miles («1.000»). */
const leerEntero = (texto: string) => Number(texto.replace(/[.\s]/g, "").replace(",", "."));
/** Precios: con coma, la coma es el decimal; sin coma, vale también el punto («0.06»). */
const leerDecimal = (texto: string) => {
  const limpio = texto.trim().replace(/\s/g, "");
  return Number(limpio.includes(",") ? limpio.replace(/\./g, "").replace(",", ".") : limpio);
};
const fmt = (n: number) => {
  const dec = n === 0 ? 0 : n < 0.01 ? 4 : n < 10 ? 2 : 0;
  return n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });
};

export default function GuideHederaComisiones() {
  const [tipoId, setTipoId] = useState("hbar");
  const [cantidad, setCantidad] = useState("1000");
  const [precio, setPrecio] = useState("0,0582");

  const tipo = TIPOS.find((t) => t.id === tipoId) ?? TIPOS[0];
  const n = Math.min(Math.max(Math.round(leerEntero(cantidad)) || 0, 0), 1_000_000_000);
  const p = Math.max(leerDecimal(precio) || PRECIO_HBAR_USD, 0.0001);

  const usd = n * tipo.usd;
  const eur = usd * EUR_POR_USD;
  const hbar = usd / p;

  return (
    <div className="hbar-calc">
      <p className="hbar-calc-titulo">Calculadora de comisiones</p>

      <div className="hbar-calc-campos">
        <label className="hbar-calc-campo">
          <span>Qué operación</span>
          <select value={tipoId} onChange={(e) => setTipoId(e.target.value)}>
            {TIPOS.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre} · {t.usd.toLocaleString("es-ES", { maximumFractionDigits: 4 })} $</option>
            ))}
          </select>
        </label>

        <div className="hbar-calc-campo">
          <label htmlFor="hbar-cantidad">Cuántas veces</label>
          <input id="hbar-cantidad" inputMode="numeric" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          <div className="hbar-calc-atajos" role="group" aria-label="Cantidades rápidas">
            {CANTIDADES.map((c) => (
              <button key={c} type="button" aria-pressed={n === c} className={n === c ? "is-activa" : ""} onClick={() => setCantidad(String(c))}>
                {c.toLocaleString("es-ES")}
              </button>
            ))}
          </div>
        </div>

        <label className="hbar-calc-campo">
          <span>Precio del HBAR, en dólares</span>
          <input inputMode="decimal" value={precio} onChange={(e) => setPrecio(e.target.value)} />
          <small>El 14-11-2026 estaba en 0,0582 $. Cámbialo y mira qué se mueve.</small>
        </label>
      </div>

      <div className="hbar-calc-resultados" aria-live="polite">
        <div className="es-principal">
          <span>Pagas en dólares</span>
          <strong>{fmt(usd)} $</strong>
          <small>Unos {fmt(eur)} €</small>
        </div>
        <div>
          <span>Que se cobran en HBAR</span>
          <strong>{fmt(hbar)} HBAR</strong>
          <small>Al precio que has puesto</small>
        </div>
      </div>

      <p className="hbar-calc-nota">
        {tipo.antes
          ? `Antes de enero de 2026, el mismo número de mensajes costaba ${fmt(n * tipo.antes)} $. El consejo multiplicó esta tarifa por ocho.`
          : "Es la tarifa base. Las firmas o claves de más, y el gas de los contratos, la suben un poco."}
      </p>
    </div>
  );
}
