"use client";

import { useState } from "react";
import Tecla from "@/components/cuaderno/Tecla";

/**
 * La calculadora de colegio de la portada (RecursosGratisHome.tsx): enseña lo
 * que hace la calculadora de Predicción de Precio con una cuenta de ejemplo y
 * datos en vivo de CoinGecko, que llegan ya pedidos desde el servidor.
 *
 * Sus teclas son de verdad: eliges la moneda y cuántas veces su precio de hoy,
 * y la pantalla rehace la cuenta. Es un ejemplo, no una previsión, y lo dice.
 * La tecla «=» lleva a la calculadora entera.
 */

export type Moneda = "bitcoin" | "ethereum" | "solana";
export type Mercado = Record<Moneda, { usd: number; usd_market_cap: number }>;

const MONEDAS: { id: Moneda; tecla: string; nombre: string }[] = [
  { id: "bitcoin", tecla: "BTC", nombre: "Bitcoin" },
  { id: "ethereum", tecla: "ETH", nombre: "Ethereum" },
  { id: "solana", tecla: "SOL", nombre: "Solana" },
];

const VECES = [2, 5, 10];

/** Dos cifras significativas: 1.234,5 → 1.200 · 0,0456 → 0,046. */
function redondo(v: number): number {
  const escala = 10 ** (Math.floor(Math.log10(v)) - 1);
  return Math.round(v / escala) * escala;
}

function precio(v: number): string {
  return `${v.toLocaleString("es-ES", { maximumFractionDigits: v < 10 ? 2 : 0 })} $`;
}

/** 1,8 billones $ · 92 mil millones $ */
function capital(v: number): string {
  if (v >= 1e12) return `${(v / 1e12).toLocaleString("es-ES", { maximumFractionDigits: 1 })} billones $`;
  return `${(v / 1e9).toLocaleString("es-ES", { maximumFractionDigits: 0 })} mil millones $`;
}

/** La misma cifra, abreviada para el tique del móvil: «213 mil M $», «1,3 bill. $». */
function capitalCorto(v: number): string {
  if (v >= 1e12) return `${(v / 1e12).toLocaleString("es-ES", { maximumFractionDigits: 1 })} bill. $`;
  return `${(v / 1e9).toLocaleString("es-ES", { maximumFractionDigits: 0 })} mil M $`;
}

export default function CalculadoraEscolar({ mercado }: { mercado: Mercado }) {
  const [moneda, setMoneda] = useState<Moneda>("solana");
  const [veces, setVeces] = useState(5);

  const elegida = MONEDAS.find((m) => m.id === moneda) ?? MONEDAS[2];
  const hoy = mercado[moneda];
  const circulacion = hoy.usd_market_cap / hoy.usd;
  const objetivo = redondo(hoy.usd * veces);
  const capObjetivo = objetivo * circulacion;
  const multiplo = capObjetivo / hoy.usd_market_cap;
  const max = Math.max(capObjetivo, ...MONEDAS.map((m) => mercado[m.id].usd_market_cap));
  const ancho = (v: number) => `${Math.max(2, (v / max) * 100).toFixed(1)}%`;

  const tira = [
    // `corto`, para el móvil: con la sigla, que cabe en una línea.
    { clave: "objetivo", nombre: `${elegida.nombre} a ${precio(objetivo)}`, corto: `${elegida.tecla} a ${precio(objetivo)}`, valor: capObjetivo, objetivo: true },
    ...MONEDAS.map((m) => ({ clave: m.id, nombre: `${m.nombre} hoy`, corto: `${m.tecla} hoy`, valor: mercado[m.id].usd_market_cap, objetivo: false })),
  ];

  return (
    <div className="rg-calc-objeto">
      <div className="rg-calculadora">
        <div className="rg-calc-marca" aria-hidden="true">
          <span>Adelin · calc</span>
          <span className="rg-calc-solar"><i /><i /><i /><i /></span>
        </div>

        <div className="rg-lcd" aria-live="polite">
          <span className="rg-lcd-linea">
            Si {elegida.nombre} llegara a <b>{precio(objetivo)}</b>
          </span>
          <span className="rg-lcd-sub">su capitalización tendría que ser</span>
          <span className="rg-lcd-total">{capital(capObjetivo)}</span>
          <span className="rg-lcd-sub">
            {multiplo.toLocaleString("es-ES", { maximumFractionDigits: 1 })} veces la de hoy
          </span>
        </div>

        <div className="rg-teclado">
          <span className="rg-teclado-rotulo">Moneda</span>
          <div className="rg-teclado-fila" role="group" aria-label="Moneda del ejemplo">
            {MONEDAS.map((m) => (
              <Tecla
                key={m.id}
                color="blanca"
                tamano="peq"
                className={m.id === moneda ? "is-pulsada" : undefined}
                aria-pressed={m.id === moneda}
                onClick={() => setMoneda(m.id)}
              >
                {m.tecla}
              </Tecla>
            ))}
          </div>
          <span className="rg-teclado-rotulo">Veces su precio de hoy</span>
          <div className="rg-teclado-fila" role="group" aria-label="Cuántas veces el precio de hoy">
            {VECES.map((v) => (
              <Tecla
                key={v}
                color="cielo"
                tamano="peq"
                className={v === veces ? "is-pulsada" : undefined}
                aria-pressed={v === veces}
                onClick={() => setVeces(v)}
              >
                ×{v}
              </Tecla>
            ))}
          </div>
          <Tecla href="/calculadora" ancho className="rg-igual">
            = Haz tu cálculo
          </Tecla>
        </div>
      </div>

      {/* La tira de papel que sale por arriba, como en las calculadoras que imprimen. */}
      <div className="rg-tira">
        {/* En el móvil, sobre la columna de cifras, «MC»: la capitalización de
            mercado (home.css). En el ordenador las cifras ya lo dicen enteras. */}
        <span className="rg-tira-cab">
          <span className="rg-tira-tit">Comparada con hoy</span>
          <abbr className="rg-tira-mc" title="Capitalización de mercado (market cap)">MC</abbr>
        </span>
        <ul className="rg-barras">
          {tira.map((b) => (
            <li key={b.clave} className={`rg-fila--${b.clave}${b.objetivo ? " is-objetivo" : ""}`}>
              <span className="rg-barra-nombre">
                <span className="rg-largo">{b.nombre}</span>
                <span className="rg-corto">{b.corto}</span>
              </span>
              <span className="rg-barra-pista">
                <span className="rg-barra" style={{ width: ancho(b.valor) }} />
              </span>
              <span className="rg-barra-valor">
                <span className="rg-largo">{capital(b.valor)}</span>
                <span className="rg-corto">{capitalCorto(b.valor)}</span>
              </span>
            </li>
          ))}
        </ul>
        {/* En el móvil, sin la fuente: solo el aviso de que es un ejemplo. */}
        <span className="rg-fuente">
          <span className="rg-largo">Datos en vivo de CoinGecko · un ejemplo, no una previsión</span>
          <span className="rg-corto">Un ejemplo, no una previsión</span>
        </span>
      </div>
    </div>
  );
}
