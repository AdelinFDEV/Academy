"use client";

import { useState } from "react";
import { Database, Lock, Undo2 } from "lucide-react";

/**
 * Cuánto NEAR queda bloqueado por guardar datos en la red (storage staking).
 *
 * La regla es la del protocolo: 10^19 yoctoNEAR por byte, es decir, 1 NEAR por
 * cada 100.000 bytes. Leída en la configuración de la red principal
 * (`storage_amount_per_byte`) el 14-11-2026.
 *
 * Darse de alta en un token cuesta 0,00125 NEAR en wrap.near y en
 * usdt.tether-token.near (`storage_balance_bounds`, misma fecha): 125 bytes.
 * Al revisar la guía, se vuelven a consultar los dos valores.
 */
const NEAR_POR_BYTE = 1 / 100_000;
const BYTES_POR_TOKEN = 125;

const PRESETS = [
  { kb: 0, texto: "Nada más" },
  { kb: 1, texto: "Una nota de texto (1 kB)" },
  { kb: 200, texto: "Un contrato pequeño (200 kB)" },
  { kb: 2_000, texto: "Una foto (2 MB)" },
];

const num = (n: number, dec: number) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });

/** Pocas cifras para lo pequeño, dos decimales para lo grande. */
const nearTxt = (n: number) => (n === 0 ? "0" : n < 0.01 ? num(n, 5) : n < 1 ? num(n, 3) : num(n, 2));

const leer = (s: string, max: number) => Math.min(Math.max(Number(s.replace(",", ".")) || 0, 0), max);

export default function GuideNearAlmacenamiento() {
  const [tokens, setTokens] = useState(3);
  const [kb, setKb] = useState("0");
  const [precio, setPrecio] = useState("3");

  const kbNum = leer(kb, 10_000_000);
  const bytes = tokens * BYTES_POR_TOKEN + kbNum * 1000;
  const bloqueado = bytes * NEAR_POR_BYTE;
  const euros = bloqueado * leer(precio, 100_000);

  return (
    <div className="near-alm">
      <p className="near-alm-titulo">Calculadora del almacenamiento</p>

      <div className="near-alm-campos">
        <div className="near-alm-campo">
          <span id="near-alm-tokens" className="near-alm-etiqueta">Tokens en los que te das de alta</span>
          <span className="near-alm-ayuda">Cada token que quieras recibir te pide registrarte una vez: unos 125 bytes</span>
          <div className="near-alm-contador" role="group" aria-labelledby="near-alm-tokens">
            <button type="button" onClick={() => setTokens(Math.max(tokens - 1, 0))} disabled={tokens === 0} aria-label="Un token menos">−</button>
            <output aria-live="polite">{tokens}</output>
            <button type="button" onClick={() => setTokens(Math.min(tokens + 1, 50))} disabled={tokens === 50} aria-label="Un token más">+</button>
          </div>
        </div>

        <div className="near-alm-campo">
          <label htmlFor="near-alm-kb" className="near-alm-etiqueta">Datos propios que guardas, en kB</label>
          <span className="near-alm-ayuda">Un contrato que despliegas, un texto, un archivo</span>
          <input id="near-alm-kb" inputMode="decimal" value={kb} onChange={(e) => setKb(e.target.value)} />
          <div className="near-alm-presets" role="group" aria-label="Ejemplos de tamaño">
            {PRESETS.map((p) => (
              <button
                key={p.kb}
                type="button"
                aria-pressed={kbNum === p.kb}
                className={kbNum === p.kb ? "is-activo" : ""}
                onClick={() => setKb(String(p.kb))}
              >
                {p.texto}
              </button>
            ))}
          </div>
        </div>

        <label htmlFor="near-alm-precio" className="near-alm-campo">
          <span className="near-alm-etiqueta">Precio de NEAR, en euros</span>
          <span className="near-alm-ayuda">Pon el del día: la cuenta en NEAR no cambia, la de euros sí</span>
          <input id="near-alm-precio" inputMode="decimal" value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </label>
      </div>

      <div className="near-alm-resultados" aria-live="polite">
        <div className="es-principal">
          <span><Lock size={14} aria-hidden="true" /> Queda bloqueado</span>
          <strong>{nearTxt(bloqueado)} NEAR</strong>
          <small>{num(bytes, 0)} bytes, a 1 NEAR cada 100.000</small>
        </div>
        <div>
          <span><Database size={14} aria-hidden="true" /> Equivale hoy a</span>
          <strong>{euros < 0.01 && euros > 0 ? "< 0,01" : num(euros, 2)} €</strong>
          <small>No lo pagas: lo inmovilizas mientras los datos existan</small>
        </div>
        <div>
          <span><Undo2 size={14} aria-hidden="true" /> Si borras los datos</span>
          <strong>Vuelve a ti</strong>
          <small>Se desbloquea lo que ocupaba lo borrado</small>
        </div>
      </div>
      <p className="near-alm-nota">
        Los 125 bytes por token son lo que piden wNEAR y USDT en noviembre de 2026; otros tokens pueden pedir algo
        distinto. Las comisiones de cada operación se pagan aparte y esas sí se queman.
      </p>
    </div>
  );
}
