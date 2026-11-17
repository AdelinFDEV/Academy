import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft, BarChart3 } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import "./estadisticas.css";

export const metadata: Metadata = {
  title: "Mis Estadísticas",
  description: "Analiza tu rendimiento como trader con datos reales de tu diario.",
};

type TradeResult = "win" | "loss" | "breakeven";

interface Trade {
  id: string;
  pair: string;
  direction: "long" | "short";
  pnl: number;
  result: TradeResult;
  date: string;
}

function pct(n: number, total: number) {
  return total === 0 ? 0 : Math.round((n / total) * 100);
}

export default async function EstadisticasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "free";
  if (role !== "admin") redirect("/dashboard");

  const { data: trades } = await supabase
    .from("trades")
    .select("id, pair, direction, pnl, result, date")
    .eq("user_id", user.id)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  const all: Trade[] = trades ?? [];
  const total = all.length;
  const wins = all.filter((t) => t.result === "win").length;
  const losses = all.filter((t) => t.result === "loss").length;
  const breakevens = all.filter((t) => t.result === "breakeven").length;
  const winRate = pct(wins, total);
  const totalPnl = all.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const bestTrade = total > 0 ? all.reduce((best, t) => t.pnl > best.pnl ? t : best, all[0]) : null;
  const worstTrade = total > 0 ? all.reduce((worst, t) => t.pnl < worst.pnl ? t : worst, all[0]) : null;
  const avgPnl = total > 0 ? totalPnl / total : 0;

  // La racha de wins más larga
  let maxStreak = 0, curStreak = 0;
  for (const t of all) {
    if (t.result === "win") { curStreak++; maxStreak = Math.max(maxStreak, curStreak); }
    else curStreak = 0;
  }

  // Desglose por par
  const pairMap: Record<string, { count: number; pnl: number }> = {};
  for (const t of all) {
    if (!pairMap[t.pair]) pairMap[t.pair] = { count: 0, pnl: 0 };
    pairMap[t.pair].count++;
    pairMap[t.pair].pnl += t.pnl ?? 0;
  }
  const pairStats = Object.entries(pairMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8);

  // Long vs Short
  const longs = all.filter((t) => t.direction === "long").length;
  const shorts = all.filter((t) => t.direction === "short").length;

  const fmtPnl = (n: number) =>
    `${n >= 0 ? "+" : ""}${n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const signo = (n: number) => (n > 0 ? "is-sube" : n < 0 ? "is-baja" : "");

  return (
    <main className="dashboard-main es">
      <header className="pn-cab tono-azul">
        <Tecla href="/dashboard" color="blanca" tamano="peq" className="pn-volver">
          <ArrowLeft size={14} strokeWidth={2.6} aria-hidden="true" /> Mi panel
        </Tecla>
        <p className="pn-mano">de tu Diario de Trading</p>
        <h1 className="pn-titulo">Mis <span className="fluor">estadísticas</span></h1>
        <p className="pn-lead">
          {total === 1 ? "Basado en la única operación" : `Basado en las ${total} operaciones`} de tu Diario de Trading.
        </p>
      </header>

      {total === 0 ? (
        <div className="pn-vacio">
          <span className="pn-vacio-icono tono-azul" aria-hidden="true"><BarChart3 size={22} /></span>
          <p>Aún no tienes operaciones registradas.</p>
          <Tecla href="/dashboard/trading" color="azul">Ir al Diario de Trading</Tecla>
        </div>
      ) : (
        <>
          {/* Las cuatro cifras */}
          <div className="es-cifras">
            <div className="es-cifra">
              <span className="es-cifra-valor">{total}</span>
              <span className="pn-etiqueta">Operaciones</span>
            </div>
            <div className="es-cifra">
              <span className="es-cifra-valor">{winRate} %</span>
              <span className="pn-etiqueta">Win rate</span>
            </div>
            <div className="es-cifra">
              <span className={`es-cifra-valor ${signo(totalPnl)}`}>{fmtPnl(totalPnl)}</span>
              <span className="pn-etiqueta">PnL total</span>
            </div>
            <div className="es-cifra">
              <span className="es-cifra-valor">{maxStreak}</span>
              <span className="pn-etiqueta">Racha de wins</span>
            </div>
          </div>

          {/* Repartos y extremos */}
          <div className="es-rejilla">
            <section className="pn-hoja es-bloque">
              <h2 className="pn-etiqueta">Wins / Losses / BE</h2>
              <div className="es-reparto" role="img" aria-label={`${wins} ganadas, ${losses} perdidas y ${breakevens} sin resultado`}>
                <i className="es-reparto-a" style={{ width: `${pct(wins, total)}%` }} title={`${wins} wins`} />
                <i className="es-reparto-b" style={{ width: `${pct(losses, total)}%` }} title={`${losses} losses`} />
                <i className="es-reparto-c" style={{ width: `${pct(breakevens, total)}%` }} title={`${breakevens} BE`} />
              </div>
              <p className="es-leyenda">
                <span className="es-leyenda-a">{wins} W</span>
                <span className="es-leyenda-b">{losses} L</span>
                {breakevens > 0 && <span className="es-leyenda-c">{breakevens} BE</span>}
              </p>
            </section>

            <section className="pn-hoja es-bloque">
              <h2 className="pn-etiqueta">Long vs Short</h2>
              <div className="es-reparto" role="img" aria-label={`${longs} en largo y ${shorts} en corto`}>
                <i className="es-reparto-long" style={{ width: `${pct(longs, total)}%` }} />
                <i className="es-reparto-short" style={{ width: `${pct(shorts, total)}%` }} />
              </div>
              <p className="es-leyenda">
                <span className="es-leyenda-long">{longs} Long</span>
                <span className="es-leyenda-short">{shorts} Short</span>
              </p>
            </section>

            <section className="pn-hoja es-bloque">
              <h2 className="pn-etiqueta">Mejor operación</h2>
              {bestTrade && (
                <p className="es-destacada">
                  <span className="es-par">{bestTrade.pair}</span>
                  <span className={`es-pnl ${signo(bestTrade.pnl)}`}>{fmtPnl(bestTrade.pnl)}</span>
                </p>
              )}
            </section>
            <section className="pn-hoja es-bloque">
              <h2 className="pn-etiqueta">Peor operación</h2>
              {worstTrade && (
                <p className="es-destacada">
                  <span className="es-par">{worstTrade.pair}</span>
                  <span className={`es-pnl ${signo(worstTrade.pnl)}`}>{fmtPnl(worstTrade.pnl)}</span>
                </p>
              )}
            </section>
            <section className="pn-hoja es-bloque">
              <h2 className="pn-etiqueta">PnL promedio</h2>
              <p className="es-destacada">
                <span className={`es-pnl ${signo(avgPnl)}`}>{fmtPnl(avgPnl)}</span>
                <span className="es-par">por op.</span>
              </p>
            </section>
          </div>

          {/* Desglose por par */}
          {pairStats.length > 0 && (
            <section className="pn-hoja">
              <h2 className="pn-h2">Desglose por par</h2>
              <ul className="es-pares">
                {pairStats.map(([pair, st]) => (
                  <li key={pair} className="es-par-fila">
                    <span className="es-par">{pair}</span>
                    <span className="pn-chip tono-gris">{st.count} op.</span>
                    <span className={`es-pnl ${signo(st.pnl)}`}>{fmtPnl(st.pnl)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}
