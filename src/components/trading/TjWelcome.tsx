"use client";

import { useMemo, useSyncExternalStore } from "react";
import { ArrowUpRight, ArrowDownRight, CalendarDays, Minus, Moon, Sun, Sunset } from "lucide-react";
import { pctStr, pnlStr, toneOf } from "./tjFormat";
import { periodReads, type Trade } from "./tjStats";
import AvatarUsuario from "@/components/AvatarUsuario";

const noSubscribe = () => () => {};

/**
 * El saludo depende de la hora del visitante, no de la del servidor. En el
 * servidor (y en la hidratación) sale «Hola»; en el navegador, el que toca.
 */
function useGreeting(): { texto: string; Icono: typeof Sun; momento: "dia" | "tarde" | "noche" } {
  const hour = useSyncExternalStore(noSubscribe, () => new Date().getHours(), () => null);
  if (hour == null) return { texto: "Hola", Icono: Sun, momento: "dia" };
  if (hour >= 6 && hour < 14) return { texto: "Buenos días", Icono: Sun, momento: "dia" };
  if (hour >= 14 && hour < 21) return { texto: "Buenas tardes", Icono: Sunset, momento: "tarde" };
  return { texto: "Buenas noches", Icono: Moon, momento: "noche" };
}

/** La fecha de hoy, en el reloj del visitante. En el servidor no sale: allí es otra hora. */
const fechaDeHoy = () => new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
function useFechaDeHoy(): string | null {
  return useSyncExternalStore(noSubscribe, fechaDeHoy, () => null);
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
  const { texto: saludo, Icono: IconoMomento, momento } = useGreeting();
  const hoy = useFechaDeHoy();
  const reads = useMemo(() => periodReads(trades, now), [trades, now]);

  return (
    <header className="tjw">
      <div className="tjw-top">
        <div className="tjw-hello">
          {/* El saludo (rehecho el 13-11-2026): una franja del mismo ancho que la
              habitación de Nova, que hace de marquesina sobre ella. La foto con su
              aro, el momento del día con su icono, el nombre en grande y la fecha. */}
          <div className={`tjw-saludo is-${momento}`}>
            <span className="tjw-foto-aro">
              <AvatarUsuario avatar={avatar} inicial={(name.charAt(0) || "U").toUpperCase()} className="tjw-foto" />
            </span>
            <h1 className="tjw-title">
              <span className="tjw-momento"><IconoMomento size={14} aria-hidden="true" /> {saludo}</span>
              <span className="tjw-name">{name}</span>
            </h1>
            {hoy && <span className="tjw-fecha"><CalendarDays size={13} aria-hidden="true" /> {hoy}</span>}
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
                {/* Tres datos y nada más (sin gráfica desde el 13-11-2026, pedido por el
                    admin): periodo, resultado y cuántas con qué acierto. La flecha compara
                    con el periodo anterior; el resto, al pasar el ratón. */}
                <dt>
                  <span className="tjw-label">{p.label}</span>
                  {showTrend && (
                    <span className={`tjw-trend tone-${toneOf(diff)}`} title={`Frente al periodo anterior (${pnlStr(p.prevPnl)})`}>
                      <Trend size={12} /> {diff > 0 ? "Mejor" : diff < 0 ? "Peor" : "Igual"}
                    </span>
                  )}
                </dt>
                {p.count ? (
                  <>
                    <dd className="tjw-pnl">{pnlStr(p.pnl)}</dd>
                    <dd className="tjw-meta">
                      {p.count} {p.count === 1 ? "operación" : "operaciones"} · {Math.round(p.winRate)} % de acierto
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
