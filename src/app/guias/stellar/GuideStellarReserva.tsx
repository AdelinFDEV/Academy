"use client";

import { useState } from "react";

/**
 * Cuánto XLM queda retenido en una cuenta de Stellar. La cuenta es la del
 * texto: (2 + entradas) × reserva base, donde una entrada es cada línea de
 * confianza, cada orden abierta y cada firmante añadido.
 *
 * La reserva base (0,5 XLM) la fijan los validadores. Al revisar la guía, se
 * comprueba en la documentación de Stellar.
 */
const RESERVA_BASE = 0.5;
const num = (n: number, dec: number) => n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });

function Contador({ id, etiqueta, ayuda, valor, cambiar }: { id: string; etiqueta: string; ayuda: string; valor: number; cambiar: (n: number) => void }) {
  return (
    <div className="xlm-contador">
      <div>
        <span id={id} className="xlm-contador-etiqueta">{etiqueta}</span>
        <span className="xlm-contador-ayuda">{ayuda}</span>
      </div>
      <div className="xlm-contador-botones" role="group" aria-labelledby={id}>
        <button type="button" onClick={() => cambiar(Math.max(valor - 1, 0))} disabled={valor === 0} aria-label={`Quitar una: ${etiqueta}`}>−</button>
        <output aria-live="polite">{valor}</output>
        <button type="button" onClick={() => cambiar(Math.min(valor + 1, 50))} disabled={valor === 50} aria-label={`Añadir una: ${etiqueta}`}>+</button>
      </div>
    </div>
  );
}

export default function GuideStellarReserva() {
  const [lineas, setLineas] = useState(2);
  const [ordenes, setOrdenes] = useState(0);
  const [firmantes, setFirmantes] = useState(0);
  const [saldo, setSaldo] = useState("20");

  const entradas = lineas + ordenes + firmantes;
  const retenido = (2 + entradas) * RESERVA_BASE;
  const tengo = Math.min(Math.max(Number(saldo.replace(",", ".")) || 0, 0), 1_000_000_000);
  const libre = tengo - retenido;

  return (
    <div className="xlm-reserva">
      <p className="xlm-reserva-titulo">Calculadora de la reserva</p>

      <div className="xlm-reserva-campos">
        <Contador id="xlm-lineas" etiqueta="Líneas de confianza" ayuda="Una por cada moneda que quieras poder recibir" valor={lineas} cambiar={setLineas} />
        <Contador id="xlm-ordenes" etiqueta="Órdenes abiertas" ayuda="Compras o ventas que esperan en el mercado" valor={ordenes} cambiar={setOrdenes} />
        <Contador id="xlm-firmantes" etiqueta="Firmantes añadidos" ayuda="Otras claves con permiso sobre la cuenta" valor={firmantes} cambiar={setFirmantes} />
        <label htmlFor="xlm-saldo" className="xlm-reserva-saldo">
          <span>XLM que tienes en la cuenta</span>
          <input id="xlm-saldo" inputMode="decimal" value={saldo} onChange={(e) => setSaldo(e.target.value)} />
        </label>
      </div>

      <div className="xlm-reserva-resultados" aria-live="polite">
        <div className="es-principal">
          <span>Queda retenido</span>
          <strong>{num(retenido, 1)} XLM</strong>
          <small>1 de la cuenta + {num(entradas * RESERVA_BASE, 1)} de lo demás</small>
        </div>
        <div className={libre < 0 ? "es-poco" : ""}>
          <span>Puedes gastar</span>
          <strong>{libre < 0 ? "0" : num(libre, 1)} XLM</strong>
          <small>{libre < 0 ? `Te faltan ${num(-libre, 1)} XLM para abrir todo eso` : "Menos las comisiones, que son mínimas"}</small>
        </div>
      </div>
      <p className="xlm-reserva-nota">
        Lo retenido se recupera al cerrar lo que lo bloquea. Algunas carteras piden un poco más de margen del
        mínimo que exige la red.
      </p>
    </div>
  );
}
