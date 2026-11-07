"use client";

import { useMemo, useSyncExternalStore } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { pctStr, pnlStr, toneOf } from "./tjFormat";
import { periodReads, type Trade } from "./tjStats";
import AvatarUsuario from "@/components/AvatarUsuario";

const noSubscribe = () => () => {};

/**
 * El saludo depende de la hora del visitante, no de la del servidor. En el
 * servidor (y en la hidratación) sale «Hola»; en el navegador, el que toca.
 */
function useGreeting(): string {
  const hour = useSyncExternalStore(noSubscribe, () => new Date().getHours(), () => null);
  if (hour == null) return "Hola";
  if (hour >= 6 && hour < 14) return "Buenos días";
  if (hour >= 14 && hour < 21) return "Buenas tardes";
  return "Buenas noches";
}

export default function TjWelcome({
  name,
  avatar,
  trades,
  capital,
  now,
  balance,
  bot,
}: {
  name: string;
  /** La foto que eligió en «Mi perfil»: sale junto a su nombre si la eligió. */
  avatar: string | null;
  trades: Trade[];
  capital: number | null;
  now: Date;
  /** El balance de la cuenta (TjBalance), a la derecha del saludo. */
  balance: React.ReactNode;
  /** Nova, el asistente (TjBot), bajo el saludo. */
  bot: React.ReactNode;
}) {
  const greeting = useGreeting();
  const reads = useMemo(() => periodReads(trades, now), [trades, now]);

  return (
    <header className="tjw">
      <div className="tjw-top">
        <div className="tjw-hello">
          <div className="tjw-title-fila">
            {avatar && <AvatarUsuario avatar={avatar} inicial={(name.charAt(0) || "U").toUpperCase()} className="tjw-foto" />}
            <h1 className="tjw-title">
              {greeting}, <span className="tjw-name">{name}</span>
            </h1>
          </div>
          {/* Nova: lo que antes era la frase de la cabecera ahora lo cuenta él, y mucho más. */}
          {bot}
        </div>
        {balance}
      </div>

      {trades.length > 0 && (
        <dl className="tjw-periods" aria-label="Tu operativa por periodos">
          {reads.map(p => {
            const diff = p.pnl - p.prevPnl;
            // Comparar solo tiene sentido si hay operaciones en los dos periodos.
            const showTrend = p.count > 0 && p.prevCount > 0;
            const Trend = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus;
            return (
              <div
                key={p.id}
                className={`tjw-period tone-${toneOf(p.pnl)}${p.count ? "" : " is-quiet"}`}
                title={capital && p.count ? `${p.sub}: ${pctStr((p.pnl / capital) * 100)} sobre tu capital inicial` : p.sub}
              >
                {/* Tres datos y nada más: periodo, resultado y cuántas/acierto. El resto, al pasar el ratón. */}
                <dt>
                  <span className="tjw-label">{p.label}</span>
                  {showTrend && (
                    <span className={`tjw-trend tone-${toneOf(diff)}`} title={`Frente al periodo anterior (${pnlStr(p.prevPnl)})`}>
                      <Trend size={12} />
                    </span>
                  )}
                </dt>
                {p.count ? (
                  <>
                    <dd className="tjw-pnl">{pnlStr(p.pnl)}</dd>
                    <dd className="tjw-meta">
                      {p.count} {p.count === 1 ? "operación" : "operaciones"} · {Math.round(p.winRate)} %
                    </dd>
                    <dd className="tjw-foot" aria-hidden="true">
                      <span className="tjw-bar"><i style={{ width: `${p.winRate}%` }} /></span>
                    </dd>
                  </>
                ) : (
                  <dd className="tjw-empty">Sin operaciones</dd>
                )}
              </div>
            );
          })}
        </dl>
      )}
    </header>
  );
}
