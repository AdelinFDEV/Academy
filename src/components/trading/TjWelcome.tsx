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

/**
 * La portada del cuaderno (estilo «Cuaderno de estudio», 17-11-2026): la
 * etiqueta del cuaderno con la foto pegada con cinta, el saludo con el nombre
 * en rotulador y, a la derecha, el balance. Debajo, cuatro fichas con la
 * semana, el mes, el trimestre y el año.
 */
export default function TjWelcome({
  name,
  avatar,
  trades,
  capital,
  now,
  balance,
}: {
  name: string;
  /** La foto que eligió en «Mi perfil»: sale junto a su nombre si la eligió. */
  avatar: string | null;
  trades: Trade[];
  capital: number | null;
  now: Date;
  /** El balance de la cuenta (TjBalance), a la derecha del saludo. */
  balance: React.ReactNode;
}) {
  const { texto: saludo, Icono: IconoMomento, momento } = useGreeting();
  const hoy = useFechaDeHoy();
  const reads = useMemo(() => periodReads(trades, now), [trades, now]);

  return (
    <header className="djp">
      <div className="djp-portada">
        <div className={`djp-hola is-${momento}`}>
          <span className="djp-foto">
            <AvatarUsuario avatar={avatar} inicial={(name.charAt(0) || "U").toUpperCase()} className="djp-foto-img" />
            <i className="djp-cinta" aria-hidden="true" />
          </span>
          <div className="djp-hola-texto">
            <p className="dj-nota djp-momento">
              <IconoMomento size={18} strokeWidth={2.4} aria-hidden="true" /> {saludo}
            </p>
            <h1 className="djp-titulo">
              Diario de <span className="fluor">{name}</span>
            </h1>
            <p className="djp-lead">
              Cada operación, cada día y cómo te sentiste, en un mismo cuaderno.
            </p>
            {hoy && <span className="dj-chip dj-chip--azul djp-fecha"><CalendarDays size={14} aria-hidden="true" /> {hoy}</span>}
          </div>
        </div>
        {balance}
      </div>

      {trades.length > 0 && (
        <dl className="djp-periodos" aria-label="Tu operativa por periodos">
          {reads.map(p => {
            const diff = p.pnl - p.prevPnl;
            // Comparar solo tiene sentido si hay operaciones en los dos periodos.
            const showTrend = p.count > 0 && p.prevCount > 0;
            const Trend = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus;
            return (
              <div
                key={p.id}
                className={`djp-periodo${p.count ? "" : " is-vacio"}`}
                title={capital && p.count ? `${p.sub}: ${pctStr((p.pnl / capital) * 100)} sobre tu capital inicial` : p.sub}
              >
                {/* Tres datos y nada más (sin gráfica desde el 13-11-2026, pedido por el
                    admin): periodo, resultado y cuántas con qué acierto. La flecha compara
                    con el periodo anterior; el resto, al pasar el ratón. */}
                <dt>
                  <span className="dj-etq">{p.label}</span>
                  {showTrend && (
                    <span className={`dj-chip tone-${toneOf(diff)}`} title={`Frente al periodo anterior (${pnlStr(p.prevPnl)})`}>
                      <Trend size={12} strokeWidth={2.8} aria-hidden="true" /> {diff > 0 ? "Mejor" : diff < 0 ? "Peor" : "Igual"}
                    </span>
                  )}
                </dt>
                {p.count ? (
                  <>
                    <dd className={`dj-cifra djp-periodo-pnl tone-${toneOf(p.pnl)}`}>{pnlStr(p.pnl)}</dd>
                    <dd className="djp-periodo-meta">
                      {p.count} {p.count === 1 ? "operación" : "operaciones"} · {Math.round(p.winRate)} % de acierto
                    </dd>
                  </>
                ) : (
                  <dd className="djp-periodo-meta">Sin operaciones</dd>
                )}
              </div>
            );
          })}
        </dl>
      )}
    </header>
  );
}
