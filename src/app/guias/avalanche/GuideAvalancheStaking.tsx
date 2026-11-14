"use client";

import { useState } from "react";

/**
 * Calculadora del staking de AVAX con la fórmula de la documentación oficial
 * de Avalanche (build.avax.network, «AVAX token»):
 *
 *   recompensa = depósito × (tope − oferta actual) / oferta actual
 *                × (días / 365) × tasa(días)
 *   tasa(días) = mínima + (máxima − mínima) × días / 365
 *
 * Tasa máxima 12 %; mínima 7,5 % desde que ACP-285 (Helicon, 22-09-2026)
 * termina de aplicarse, hacia el 21-12-2026. Oferta actual leída en la P-Chain
 * (platform.getCurrentSupply) el 14-11-2026: 476,56 millones. Al revisar la
 * guía, se vuelve a leer: cuanto más crece, menos reparte la fórmula.
 */
const TOPE = 720_000_000;
const OFERTA_ACTUAL = 476_560_000;
const TASA_MAX = 0.12;
const TASA_MIN = 0.075;

const DURACIONES = [
  { dias: 2, rotulo: "48 horas" },
  { dias: 14, rotulo: "2 semanas" },
  { dias: 30, rotulo: "1 mes" },
  { dias: 90, rotulo: "3 meses" },
  { dias: 180, rotulo: "6 meses" },
  { dias: 365, rotulo: "1 año" },
];

type Modo = "delegar" | "validar";

const num = (n: number, dec: number) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });

function leer(texto: string): number {
  const limpio = texto.trim();
  const n = Number(limpio.includes(",") ? limpio.replace(/\./g, "").replace(",", ".") : limpio);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 3_000_000) : 0;
}

function recompensaBruta(deposito: number, dias: number): number {
  const tasa = TASA_MIN + (TASA_MAX - TASA_MIN) * (dias / 365);
  return deposito * ((TOPE - OFERTA_ACTUAL) / OFERTA_ACTUAL) * (dias / 365) * tasa;
}

export default function GuideAvalancheStaking() {
  const [modo, setModo] = useState<Modo>("delegar");
  const [cantidad, setCantidad] = useState("1000");
  const [dias, setDias] = useState(365);
  const [comision, setComision] = useState(5);
  const [precio, setPrecio] = useState("7,22");

  const minimo = modo === "validar" ? 2000 : 25;
  const deposito = leer(cantidad);
  const diasEfectivos = modo === "delegar" && dias < 14 ? 14 : dias;
  const bruta = recompensaBruta(deposito, diasEfectivos);
  const neta = modo === "delegar" ? bruta * (1 - comision / 100) : bruta;
  const periodo = deposito > 0 ? neta / deposito : 0;
  const anualSimple = periodo * (365 / diasEfectivos);
  const anualRenovando = Math.pow(1 + periodo, 365 / diasEfectivos) - 1;
  const euros = neta * leer(precio);
  const pordebajo = deposito < minimo;

  function cambiarModo(m: Modo) {
    setModo(m);
    if (m === "delegar" && dias < 14) setDias(14);
  }

  return (
    <div className="avax-calc">
      <p className="avax-calc-titulo">Calculadora del staking de AVAX</p>

      <div className="avax-calc-modos" role="group" aria-label="Cómo haces staking">
        <button type="button" className={modo === "delegar" ? "is-activo" : ""} aria-pressed={modo === "delegar"} onClick={() => cambiarModo("delegar")}>
          Delegar en un validador
        </button>
        <button type="button" className={modo === "validar" ? "is-activo" : ""} aria-pressed={modo === "validar"} onClick={() => cambiarModo("validar")}>
          Montar mi validador
        </button>
      </div>

      <div className="avax-calc-campos">
        <label htmlFor="avax-cantidad" className="avax-campo">
          <span>AVAX que bloqueas</span>
          <input id="avax-cantidad" inputMode="decimal" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          <small>Mínimo: {num(minimo, 0)} AVAX</small>
        </label>

        <label htmlFor="avax-dias" className="avax-campo">
          <span>Cuánto tiempo</span>
          <select id="avax-dias" value={diasEfectivos} onChange={(e) => setDias(Number(e.target.value))}>
            {DURACIONES.filter((d) => modo === "validar" || d.dias >= 14).map((d) => (
              <option key={d.dias} value={d.dias}>{d.rotulo}</option>
            ))}
          </select>
          <small>{modo === "delegar" ? "Delegar: de 2 semanas a 1 año" : "Validar: de 48 horas a 1 año"}</small>
        </label>

        {modo === "delegar" ? (
          <label htmlFor="avax-comision" className="avax-campo">
            <span>Comisión del validador: {comision} %</span>
            <input id="avax-comision" type="range" min={2} max={20} step={1} value={comision} onChange={(e) => setComision(Number(e.target.value))} />
            <small>La red no deja bajar del 2 %. La mediana era un 5 %</small>
          </label>
        ) : (
          <div className="avax-campo avax-campo--nota">
            <span>Sin comisión</span>
            <small>Cobras todo lo tuyo, más la comisión de quien delegue en ti. A cambio, tu nodo tiene que estar encendido el 90 % del tiempo.</small>
          </div>
        )}

        <label htmlFor="avax-precio" className="avax-campo">
          <span>Precio de AVAX, en euros</span>
          <input id="avax-precio" inputMode="decimal" value={precio} onChange={(e) => setPrecio(e.target.value)} />
          <small>7,22 € el 14 de noviembre de 2026</small>
        </label>
      </div>

      {pordebajo ? (
        <p className="avax-calc-aviso" role="status">
          Con menos de {num(minimo, 0)} AVAX no puedes {modo === "validar" ? "montar un validador" : "delegar"} en la red principal.
        </p>
      ) : (
        <div className="avax-calc-resultados" aria-live="polite">
          <div className="es-principal">
            <span>Recibes al terminar</span>
            <strong>{num(neta, 2)} AVAX</strong>
            <small>Unos {num(euros, 2)} € al precio que has puesto</small>
          </div>
          <div>
            <span>Equivale a, al año</span>
            <strong>{num(anualSimple * 100, 2)} %</strong>
            <small>{diasEfectivos < 365 ? `Renovando cada vez: ${num(anualRenovando * 100, 2)} %` : "Sin renovar: es el plazo más largo"}</small>
          </div>
          <div className="es-cero">
            <span>Si el validador falla</span>
            <strong>0 AVAX</strong>
            <small>Por debajo del 90 % de tiempo activo no hay recompensa. Tus AVAX vuelven enteros.</small>
          </div>
        </div>
      )}

      <p className="avax-calc-nota">
        Fórmula oficial de Avalanche con la oferta del 14 de noviembre de 2026 (476,56 millones) y la tasa mínima del
        7,5 % que deja Helicon desde el 21 de diciembre de 2026. Un bloqueo corto que empiece antes cobra algo más.
        Es una estimación: la cifra baja a medida que se crean más AVAX. Los AVAX quedan
        bloqueados todo el plazo y no se pueden sacar antes.
      </p>
    </div>
  );
}
