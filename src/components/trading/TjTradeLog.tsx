"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Trash2, Download, Search, Check, X, ChevronDown, ArrowRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { TjSelect } from "./TjControls";
import { MONTHS, WEEKDAY_NAMES, dateTime, moneyStr, pctStr, pnlStr, rStr, ratioStr, toneOf } from "./tjFormat";
import { RISK_LIMIT_PCT, computeStats, rOf, resultTone, type Trade, type TradeContext, type TradeResult } from "./tjStats";
import { animoInfo, fechaKey, type DiasMap } from "./tjDias";

const PAGE = 25;

type SortId = "recent" | "oldest" | "pnl-desc" | "pnl-asc" | "r-desc";

const SORTS: { value: SortId; label: string }[] = [
  { value: "recent", label: "Más recientes" },
  { value: "oldest", label: "Más antiguas" },
  { value: "pnl-desc", label: "Mayor P&L" },
  { value: "pnl-asc", label: "Menor P&L" },
  { value: "r-desc", label: "Mayor R" },
];

const RESULT_LABEL = { win: "Ganada", loss: "Perdida", breakeven: "Breakeven" } as const;

function sortTrades(trades: Trade[], sort: SortId): Trade[] {
  const list = [...trades];
  if (sort === "recent") return list.reverse();
  if (sort === "pnl-desc") return list.sort((a, b) => b.pnl - a.pnl);
  if (sort === "pnl-asc") return list.sort((a, b) => a.pnl - b.pnl);
  if (sort === "r-desc") return list.sort((a, b) => (rOf(b) ?? -Infinity) - (rOf(a) ?? -Infinity));
  return list;
}

/** Lo que el plan daba para ese resultado: el objetivo si gana, −riesgo si pierde. */
const plannedPnl = (t: Trade) => (t.result === "win" ? t.expected_gain : t.result === "loss" ? -t.risk_amount : 0);

/** Cómo se ejecutó frente al plan. Solo tiene sentido si hay P&L real apuntado. */
function executionText(t: Trade): string | null {
  if (t.real_pnl == null) return null;
  if (t.pnl > 0 && t.expected_gain > 0) return `${Math.round((t.pnl / t.expected_gain) * 100)} % del objetivo`;
  if (t.pnl < 0 && t.risk_amount > 0) return `${(-t.pnl / t.risk_amount).toFixed(2).replace(".", ",")} × el riesgo`;
  return "cerrada en breakeven";
}

/** Excel ejecuta como fórmula cualquier celda que empiece por = + - @. */
const safeText = (s: string) => (/^[=+\-@]/.test(s) ? `'${s}` : s);

function exportCsv(trades: Trade[], ctx: Map<string, TradeContext>) {
  const n = (v: number | null | undefined) => (v == null ? "" : v.toFixed(2).replace(".", ","));
  const pad = (v: number) => String(v).padStart(2, "0");
  const localDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const rows = [
    ["Fecha", "Par", "Dirección", "Riesgo", "Objetivo", "P&L", "P&L real", "Resultado", "R", "Riesgo % cuenta", "Estrategia", "Notas"],
    ...trades.map(t => [
      localDate(t.date), safeText(t.pair), t.direction, n(t.risk_amount), n(t.expected_gain), n(t.pnl), n(t.real_pnl),
      RESULT_LABEL[t.result], n(rOf(t)), n(ctx.get(t.id)?.riskPct), safeText(t.strategy ?? ""), safeText(t.notes ?? ""),
    ]),
  ];
  // Punto y coma y coma decimal: es lo que Excel en español abre en columnas sin preguntar.
  const csv = "﻿" + rows.map(r => r.map(c => (/[";\r\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `diario-trading-${localDate(new Date().toISOString()).slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const RECENT = 5;

const MONTH_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function TjRecentTrades({ trades, onSeeAll }: { trades: Trade[]; onSeeAll: () => void }) {
  const recent = trades.slice(-RECENT).reverse();
  const recentPnl = recent.reduce((s, t) => s + t.pnl, 0);
  const recentWins = recent.filter(t => t.result === "win").length;
  return (
    <section className="tj-card tjt">
      <header className="tjr-head">
        <h3>Últimas operaciones</h3>
        <button type="button" className="tjr-link" onClick={onSeeAll}>
          Ver las {trades.length} <ArrowRight size={14} />
        </button>
      </header>
      <ul className="tjt-list">
        {recent.map(t => {
          const r = rOf(t);
          const d = new Date(t.date);
          return (
            <li key={t.id}>
              <button type="button" className={`tjt-row tone-${resultTone(t.result)}`} onClick={onSeeAll}>
                <span className="tjt-date">
                  <strong>{d.getDate()}</strong>
                  <small>{MONTH_SHORT[d.getMonth()]}</small>
                </span>
                <span className="tjt-main">
                  <span className="tjt-pair">
                    {t.pair}
                    <span className={`tj-dir is-${t.direction}`}>
                      {t.direction === "long" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {t.direction === "long" ? "Long" : "Short"}
                    </span>
                  </span>
                  <span className="tjt-meta">
                    {d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                    {t.strategy && ` · ${t.strategy}`}
                  </span>
                </span>
                <span className={`tjt-r tone-${toneOf(r ?? 0)}`}>{r != null ? rStr(r) : "—"}</span>
                <strong className={`tjt-pnl tone-${toneOf(t.pnl)}`}>{pnlStr(t.pnl)}</strong>
              </button>
            </li>
          );
        })}
      </ul>
      {/* El balance de lo que se ve: el pie se queda abajo aunque haya pocas operaciones. */}
      <footer className="tjt-foot">
        <span>{recent.length === 1 ? "Tu última operación" : `Tus últimas ${recent.length}`}</span>
        <span className="tjt-foot-stats">
          <span>{recentWins} de {recent.length} ganadas</span>
          <strong className={`tone-${toneOf(recentPnl)}`}>{pnlStr(recentPnl)}</strong>
        </span>
      </footer>
    </section>
  );
}

type ResultFilter = "all" | TradeResult;

const RESULT_FILTERS: { value: ResultFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "win", label: "Ganadas" },
  { value: "loss", label: "Perdidas" },
  { value: "breakeven", label: "Breakeven" },
];

interface Props {
  trades: Trade[];
  ctx: Map<string, TradeContext>;
  /** Ánimo de cada día: su emoji va en la cabecera de cada día de la lista. */
  dias: DiasMap;
  onEdit: (t: Trade) => void;
  onDelete: (id: string) => Promise<void>;
}

const dayTitle = (d: Date) => `${WEEKDAY_NAMES[(d.getDay() + 6) % 7]} ${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

/**
 * El registro completo. Arriba, el balance de lo que se ve; luego buscar, filtrar
 * por resultado, ordenar y exportar. Por fecha, la lista va agrupada por días (con
 * el ánimo de cada día); por P&L o R, en una sola lista. Cada fila se despliega
 * con el plan, la ejecución, el capital de antes y las notas.
 */
export default function TjTradeLog({ trades, ctx, dias, onEdit, onDelete }: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortId>("recent");
  const [result, setResult] = useState<ResultFilter>("all");
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const found = trades.filter(t =>
      (result === "all" || t.result === result) &&
      (!q || [t.pair, t.strategy, t.notes].some(v => v?.toLowerCase().includes(q))),
    );
    return sortTrades(found, sort);
  }, [trades, query, sort, result]);

  const stats = useMemo(() => computeStats(list), [list]);
  const shown = list.slice(0, limit);
  const byDate = sort === "recent" || sort === "oldest";

  // Por fecha: grupos por día, en el orden de la lista.
  const groups = useMemo(() => {
    if (!byDate) return [{ key: "all", date: null as Date | null, trades: shown }];
    const out: { key: string; date: Date | null; trades: Trade[] }[] = [];
    for (const t of shown) {
      const d = new Date(t.date);
      const key = fechaKey(d);
      const last = out[out.length - 1];
      if (last?.key === key) last.trades.push(t);
      else out.push({ key, date: d, trades: [t] });
    }
    return out;
  }, [shown, byDate]);

  async function remove(id: string) {
    setDeleting(id);
    setError("");
    try {
      await onDelete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo borrar la operación");
    } finally {
      setDeleting(null);
      setConfirming(null);
    }
  }

  const reset = () => { setQuery(""); setResult("all"); setLimit(PAGE); };

  return (
    <>
      {/* El balance de lo que se ve (obedece a los filtros de arriba y a los de aquí). */}
      <dl className="tjo-band">
        <div className={`tjo-band-main tone-${toneOf(stats.totalPnl)}`}>
          <dt>P&L de la selección</dt>
          <dd>{pnlStr(stats.totalPnl)}</dd>
        </div>
        <div><dt>Operaciones</dt><dd>{stats.count}</dd></div>
        <div><dt>Acierto</dt><dd>{stats.count ? `${Math.round(stats.winRate)} %` : "—"}</dd></div>
        <div className={`tone-${toneOf(stats.totalR)}`}><dt>R acumulada</dt><dd>{stats.count ? rStr(stats.totalR) : "—"}</dd></div>
        <div className="tone-win"><dt>Mejor</dt><dd>{stats.best != null ? pnlStr(stats.best) : "—"}</dd></div>
        <div className="tone-loss"><dt>Peor</dt><dd>{stats.worst != null ? pnlStr(stats.worst) : "—"}</dd></div>
      </dl>

      <section className="tj-card tjo">
        <header className="tjo-toolbar">
          <div className="tjo-chips" role="radiogroup" aria-label="Filtrar por resultado">
            {RESULT_FILTERS.map(f => {
              const n = f.value === "all" ? trades.length : trades.filter(t => t.result === f.value).length;
              return (
                <button
                  key={f.value}
                  type="button"
                  role="radio"
                  aria-checked={result === f.value}
                  className={`tjo-chip${result === f.value ? " is-on" : ""}${f.value !== "all" ? ` tone-${resultTone(f.value as TradeResult)}` : ""}`}
                  onClick={() => { setResult(f.value); setLimit(PAGE); }}
                >
                  {f.value !== "all" && <i aria-hidden="true" />}
                  {f.label}
                  <span>{n}</span>
                </button>
              );
            })}
          </div>
          <div className="tjo-tools">
            <label className="tj-search">
              <Search size={14} aria-hidden="true" />
              <input
                type="search" value={query} placeholder="Buscar par, estrategia, nota…" aria-label="Buscar operaciones"
                onChange={e => { setQuery(e.target.value); setLimit(PAGE); }}
              />
            </label>
            <TjSelect compact value={sort} onChange={v => setSort(v as SortId)} options={SORTS} />
            <button type="button" className="tj-btn" onClick={() => exportCsv(list, ctx)} disabled={!list.length} title="Descargar lo que ves en CSV (Excel)">
              <Download size={13} /> CSV
            </button>
          </div>
        </header>

        {error && <p className="auth-error">{error}</p>}

        {list.length === 0 ? (
          <div className="tj-empty">
            <p>Ninguna operación coincide{query ? ` con «${query}»` : ""}.</p>
            <button type="button" className="tj-btn" onClick={reset}><X size={13} /> Quitar búsqueda y filtro</button>
          </div>
        ) : (
          <div className="tjo-list">
            {groups.map(g => {
              const dayPnl = g.trades.reduce((sum, t) => sum + t.pnl, 0);
              const dia = g.date ? dias[fechaKey(g.date)] : undefined;
              const mood = dia?.animo ? animoInfo(dia.animo) : null;
              return (
                <section key={g.key} className="tjo-day">
                  {g.date && (
                    <header className="tjo-day-head">
                      <span className="tjo-day-title cap">{dayTitle(g.date)}</span>
                      {mood && <span className="tjo-day-mood" title={`Ese día te sentías: ${mood.label.toLowerCase()}`}>{mood.emoji}</span>}
                      <span className="tjo-day-meta">{g.trades.length} op.</span>
                      <strong className={`tjo-day-pnl tone-${toneOf(dayPnl)}`}>{pnlStr(dayPnl)}</strong>
                    </header>
                  )}
                  {g.trades.map(t => {
                    const tone = resultTone(t.result);
                    const r = rOf(t);
                    const c = ctx.get(t.id);
                    const isOpen = open === t.id;
                    return (
                      <article key={t.id} className={`tjo-row${isOpen ? " is-open" : ""}`} data-tone={tone}>
                        <div className="tjo-line" onClick={() => setOpen(isOpen ? null : t.id)}>
                          <span className="tjo-time">{byDate ? timeOf(t.date) : dateTime(t.date)}</span>
                          <span className="tjo-main">
                            <span className="tjo-pair">
                              {t.pair}
                              <span className={`tj-dir is-${t.direction}`}>
                                {t.direction === "long" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {t.direction === "long" ? "Long" : "Short"}
                              </span>
                            </span>
                            <span className="tjo-sub">{t.strategy ?? "Sin estrategia"}{t.notes ? " · con nota" : ""}</span>
                          </span>
                          <span className="tjo-risk">
                            {moneyStr(t.risk_amount)}
                            {c?.riskPct != null && <small className={c.riskPct > RISK_LIMIT_PCT ? "tone-loss" : undefined}>{pctStr(c.riskPct, false, 2)} cuenta</small>}
                          </span>
                          <span className={`tjo-r tone-${toneOf(r ?? 0)}`}>{r != null ? rStr(r) : "—"}</span>
                          <span className="tjo-pnl">
                            <strong className={`tone-${toneOf(t.pnl)}`}>{pnlStr(t.pnl)}</strong>
                            <span className={`tj-chip tone-${tone}`}>{RESULT_LABEL[t.result]}</span>
                          </span>
                          <span className="tjo-actions" onClick={e => e.stopPropagation()}>
                            {confirming === t.id ? (
                              <>
                                <button type="button" className="tj-btn tone-loss" onClick={() => remove(t.id)} disabled={deleting === t.id}>
                                  <Check size={13} /> {deleting === t.id ? "Borrando…" : "Borrar"}
                                </button>
                                <button type="button" className="tj-icon-btn" onClick={() => setConfirming(null)} aria-label="Cancelar borrado" title="Cancelar">
                                  <X size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button type="button" className="tj-icon-btn" onClick={() => onEdit(t)} aria-label={`Editar ${t.pair}`} title="Editar">
                                  <Pencil size={14} />
                                </button>
                                <button type="button" className="tj-icon-btn" onClick={() => setConfirming(t.id)} aria-label={`Eliminar ${t.pair}`} title="Eliminar">
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                            <button
                              type="button" className="tj-icon-btn tjo-toggle" aria-expanded={isOpen} aria-label="Ver detalle" title="Ver detalle"
                              onClick={() => setOpen(isOpen ? null : t.id)}
                            >
                              <ChevronDown size={15} />
                            </button>
                          </span>
                        </div>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              className="tjo-detail"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                            >
                              <div className="tjo-detail-inner">
                                <dl className="tjo-facts">
                                  <div><dt>Plan</dt><dd>{moneyStr(t.risk_amount)} → {moneyStr(t.expected_gain)}</dd>
                                    {t.risk_amount > 0 && <dd className="tjo-fact-sub">R:R {ratioStr(t.expected_gain / t.risk_amount)}</dd>}
                                  </div>
                                  <div><dt>Ejecución</dt><dd>{t.real_pnl != null ? pnlStr(t.real_pnl) : "Según el plan"}</dd>
                                    {executionText(t) && <dd className="tjo-fact-sub">{executionText(t)}</dd>}
                                    {t.real_pnl != null && t.pnl !== plannedPnl(t) && <dd className="tjo-fact-sub">el plan era {pnlStr(plannedPnl(t))}</dd>}
                                  </div>
                                  <div><dt>Capital antes</dt><dd>{c?.equityBefore != null ? moneyStr(c.equityBefore) : "—"}</dd>
                                    {c?.riskPct != null && <dd className="tjo-fact-sub">arriesgó el {pctStr(c.riskPct, false, 2)}</dd>}
                                  </div>
                                  <div><dt>Fecha</dt><dd>{dateTime(t.date)}</dd></div>
                                </dl>
                                <p className={t.notes ? "tjo-notes" : "tjo-notes is-empty"}>
                                  {t.notes ?? "Sin notas. Apuntar por qué entraste es lo que dentro de tres meses te dirá si falló el método o la disciplina."}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </article>
                    );
                  })}
                </section>
              );
            })}
          </div>
        )}

        {list.length > limit && (
          <button type="button" className="tj-btn tj-more" onClick={() => setLimit(l => l + PAGE)}>
            Mostrar más ({list.length - limit} restantes)
          </button>
        )}
      </section>
    </>
  );
}
