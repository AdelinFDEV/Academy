"use client";

import { useState } from "react";
import { Cpu, Database, Undo2, Receipt } from "lucide-react";

/**
 * Lo que cuesta una operación en Sui, con la fórmula del protocolo:
 * cálculo + almacenamiento − devolución.
 *
 * Parámetros leídos en la red principal por GraphQL el 14-11-2026 (versión de
 * protocolo 141, época 1311):
 *   · precio de referencia del gas: 100 MIST por unidad de cálculo
 *   · `storage_gas_price`: 76 MIST por unidad de almacenamiento
 *   · 100 unidades de almacenamiento por byte (documentación oficial)
 *   · `storage_rebate_rate`: 9999 puntos básicos, el 99,99 %
 * 1 SUI = 1.000.000.000 MIST. Al revisar la guía, se vuelven a leer los tres.
 *
 * El cálculo se cobra por tramos fijos de unidades (1.000, 5.000, 10.000…):
 * una operación sencilla cae en el primero, el mínimo. Por eso los ejemplos
 * usan 1.000 unidades; una cifra fuera de tramo no existiría en la red.
 *
 * Los tamaños de los ejemplos son orientativos: un objeto moneda ronda los
 * 130 bytes (su almacenamiento cuesta 988.000 MIST al precio actual).
 */
const PRECIO_REFERENCIA = 100;
const MIST_POR_BYTE = 76 * 100;
const DEVOLUCION = 0.9999;
const MIST_POR_SUI = 1_000_000_000;

type Ejemplo = { id: string; texto: string; unidades: number; crea: number; libera: number };

const EJEMPLOS: Ejemplo[] = [
  { id: "enviar", texto: "Enviar SUI a otra persona", unidades: 1_000, crea: 260, libera: 130 },
  { id: "nft", texto: "Crear un NFT sencillo", unidades: 1_000, crea: 630, libera: 130 },
  { id: "borrar", texto: "Borrar un objeto que ya no usas", unidades: 1_000, crea: 130, libera: 630 },
];

const num = (n: number, dec: number) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });

/** Las cantidades en SUI son muy pequeñas: seis decimales siempre. */
const sui = (mist: number) => num(mist / MIST_POR_SUI, 6);

const leer = (s: string, max: number) => Math.min(Math.max(Number(s.replace(",", ".")) || 0, 0), max);

export default function GuideSuiComisiones() {
  const [ejemplo, setEjemplo] = useState<string>("enviar");
  const [crea, setCrea] = useState("260");
  const [libera, setLibera] = useState("130");
  const [unidades, setUnidades] = useState(1_000);
  const [precio, setPrecio] = useState("0,69");

  const elegir = (e: Ejemplo) => {
    setEjemplo(e.id);
    setCrea(String(e.crea));
    setLibera(String(e.libera));
    setUnidades(e.unidades);
  };

  const bytesCrea = leer(crea, 10_000_000);
  const bytesLibera = leer(libera, 10_000_000);
  const calculo = unidades * PRECIO_REFERENCIA;
  const almacenamiento = bytesCrea * MIST_POR_BYTE;
  const devolucion = bytesLibera * MIST_POR_BYTE * DEVOLUCION;
  const neto = calculo + almacenamiento - devolucion;
  const euros = (neto / MIST_POR_SUI) * leer(precio, 1_000);
  const futura = almacenamiento * DEVOLUCION;

  return (
    <div className="sui-calc">
      <p className="sui-calc-titulo">Calculadora de comisiones en Sui</p>

      <div className="sui-calc-ejemplos" role="group" aria-label="Elige un ejemplo">
        {EJEMPLOS.map((e) => (
          <button
            key={e.id}
            type="button"
            aria-pressed={ejemplo === e.id}
            className={ejemplo === e.id ? "is-activo" : ""}
            onClick={() => elegir(e)}
          >
            {e.texto}
          </button>
        ))}
      </div>

      <div className="sui-calc-campos">
        <label htmlFor="sui-calc-crea" className="sui-calc-campo">
          <span className="sui-calc-etiqueta">Bytes que creas o reescribes</span>
          <span className="sui-calc-ayuda">Cada objeto nuevo o modificado se vuelve a guardar entero</span>
          <input
            id="sui-calc-crea"
            inputMode="numeric"
            value={crea}
            onChange={(e) => { setCrea(e.target.value); setEjemplo(""); }}
          />
        </label>
        <label htmlFor="sui-calc-libera" className="sui-calc-campo">
          <span className="sui-calc-etiqueta">Bytes que liberas</span>
          <span className="sui-calc-ayuda">La versión anterior de lo que modificas, o lo que borras</span>
          <input
            id="sui-calc-libera"
            inputMode="numeric"
            value={libera}
            onChange={(e) => { setLibera(e.target.value); setEjemplo(""); }}
          />
        </label>
        <label htmlFor="sui-calc-precio" className="sui-calc-campo">
          <span className="sui-calc-etiqueta">Precio de SUI, en euros</span>
          <span className="sui-calc-ayuda">Pon el del día: solo cambia la línea en euros</span>
          <input id="sui-calc-precio" inputMode="decimal" value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </label>
      </div>

      <div className="sui-calc-ticket" aria-live="polite">
        <div className="sui-calc-linea">
          <span><Cpu size={15} aria-hidden="true" /> Cálculo</span>
          <small>{num(unidades, 0)} unidades × {PRECIO_REFERENCIA} MIST</small>
          <strong>+{sui(calculo)} SUI</strong>
        </div>
        <div className="sui-calc-linea">
          <span><Database size={15} aria-hidden="true" /> Almacenamiento</span>
          <small>{num(bytesCrea, 0)} bytes × 7.600 MIST</small>
          <strong>+{sui(almacenamiento)} SUI</strong>
        </div>
        <div className="sui-calc-linea es-devolucion">
          <span><Undo2 size={15} aria-hidden="true" /> Devolución</span>
          <small>{num(bytesLibera, 0)} bytes, al 99,99 %</small>
          <strong>−{sui(devolucion)} SUI</strong>
        </div>
        <div className="sui-calc-linea es-total">
          <span><Receipt size={15} aria-hidden="true" /> {neto < 0 ? "Te devuelven, en neto" : "Pagas, en neto"}</span>
          <small>{euros < 0 ? "−" : ""}{Math.abs(euros) < 0.0001 && euros !== 0 ? "< 0,0001" : num(Math.abs(euros), 4)} €</small>
          <strong>{sui(Math.abs(neto))} SUI</strong>
        </div>
      </div>

      <p className="sui-calc-nota">
        Si algún día borras lo que creas ahora, recuperas {sui(futura)} SUI. El cálculo se cobra por tramos:
        el mínimo son 1.000 unidades, y una operación sencilla no pasa de ahí. Ejemplos orientativos, con los
        parámetros de la red principal del 14 de noviembre de 2026; la devolución asume que lo liberado se guardó
        al mismo precio que hoy.
      </p>
    </div>
  );
}
