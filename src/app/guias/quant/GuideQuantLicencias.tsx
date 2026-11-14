"use client";

import { useState } from "react";

/**
 * Cuántos QNT retirarían del mercado las licencias de Overledger, en el caso
 * más favorable al token: todo lo que pagan los clientes se convierte en QNT y
 * queda retenido durante la licencia.
 *
 * Las cifras por defecto son las del texto (14-11-2026, CoinGecko): precio de
 * unos 138 € y 14,56 millones de QNT en circulación. Al revisar la guía, se
 * actualizan aquí y en el page.tsx a la vez.
 */
const CIRCULANTE = 14_556_178;
const VOLUMEN_DIARIO_EUR = 60_000_000; // mediana de 30 días, CoinGecko

const entero = (n: number) => Math.round(n).toLocaleString("es-ES");
const pct = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: n < 10 ? 2 : 1, maximumFractionDigits: n < 10 ? 2 : 1 });

function leer(texto: string, max: number) {
  // «100.000» y «138,5» a la española; «138.5» también se entiende.
  const limpio = texto.trim().replace(/\s/g, "");
  const miles = limpio.includes(",") || /^\d{1,3}(\.\d{3})+$/.test(limpio);
  const n = Number((miles ? limpio.replace(/\./g, "") : limpio).replace(",", "."));
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), max) : 0;
}

export default function GuideQuantLicencias() {
  const [clientes, setClientes] = useState(500);
  const [cuota, setCuota] = useState("100000");
  const [precio, setPrecio] = useState("138");

  const cuotaEur = leer(cuota, 100_000_000);
  const precioEur = leer(precio, 1_000_000);
  const totalEur = clientes * cuotaEur;
  const bloqueados = precioEur > 0 ? totalEur / precioEur : 0;
  const parte = (bloqueados / CIRCULANTE) * 100;
  const dias = totalEur / VOLUMEN_DIARIO_EUR;
  const conDoble = precioEur > 0 ? totalEur / (precioEur * 2) : 0;

  return (
    <div className="qnt-calc">
      <p className="qnt-calc-titulo">Simulador: cuánto QNT retiran las licencias</p>

      <div className="qnt-calc-campos">
        <label htmlFor="qnt-clientes" className="qnt-calc-campo qnt-calc-campo--ancho">
          <span>Clientes con licencia: <strong>{entero(clientes)}</strong></span>
          <input
            id="qnt-clientes"
            type="range"
            min={1}
            max={5000}
            step={1}
            value={clientes}
            onChange={(e) => setClientes(Number(e.target.value))}
          />
          <small>Bancos y empresas que pagan cada año por usar Overledger</small>
        </label>
        <label htmlFor="qnt-cuota" className="qnt-calc-campo">
          <span>Lo que paga cada uno al año (€)</span>
          <input id="qnt-cuota" inputMode="decimal" value={cuota} onChange={(e) => setCuota(e.target.value)} />
        </label>
        <label htmlFor="qnt-precio" className="qnt-calc-campo">
          <span>Precio de un QNT (€)</span>
          <input id="qnt-precio" inputMode="decimal" value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </label>
      </div>

      <div className="qnt-calc-resultados" aria-live="polite">
        <div className="es-principal">
          <span>QNT retenidos durante un año</span>
          <strong>{entero(bloqueados)}</strong>
          <small>{entero(totalEur)} € al año entre todos</small>
        </div>
        <div>
          <span>Parte de la oferta en circulación</span>
          <strong>{pct(parte)} %</strong>
          <small>Sobre {entero(CIRCULANTE)} QNT</small>
        </div>
        <div>
          <span>Días de negociación que equivale</span>
          <strong>{dias < 10 ? pct(dias) : entero(dias)}</strong>
          <small>Con unos 60 millones de euros negociados al día</small>
        </div>
      </div>

      <p className="qnt-calc-nota">
        Si el precio de QNT se duplicara, esas mismas cuotas retendrían {entero(conDoble)} QNT: la mitad. La
        cuota se fija en dinero, no en tokens. Y es el caso más favorable: supone que todo lo que pagan los
        clientes acaba convertido en QNT y retenido, algo que Quant no publica.
      </p>
    </div>
  );
}
