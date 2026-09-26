"use client";

import { Fragment, useMemo, useState } from "react";
import { NotebookText, Pencil, Trash2, Download, Search, Check, X, ChevronDown } from "lucide-react";
import { TjSelect } from "./TjControls";
import { dateTime, moneyStr, pctStr, pnlStr, rStr, ratioStr, toneOf } from "./tjFormat";
import { RISK_LIMIT_PCT, rOf, resultTone, type Trade, type TradeContext } from "./tjStats";

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

export function TjRecentTrades({ trades, onSeeAll }: { trades: Trade[]; onSeeAll: () => void }) {
  const recent = trades.slice(-RECENT).reverse();
  return (
    <section className="tj-card">
      <div className="tj-card-head">
        <span className="tj-label"><NotebookText size={15} /> Últimas operaciones</span>
        <button type="button" className="tj-btn" onClick={onSeeAll}>Ver las {trades.length}</button>
      </div>
      <div className="tj-table-wrap">
        <table className="tj-table">
          <tbody>
            {recent.map(t => {
              const r = rOf(t);
              return (
                <tr key={t.id} className="tj-log-row" data-tone={resultTone(t.result)} onClick={onSeeAll}>
                  <td className="muted nowrap">{dateTime(t.date)}</td>
                  <td>
                    <span className="strong">{t.pair}</span>
                    {t.strategy && <span className="tj-sub">{t.strategy}</span>}
                  </td>
                  <td className={`num strong tone-${toneOf(r ?? 0)}`}>{r != null ? rStr(r) : "—"}</td>
                  <td className={`num strong tone-${toneOf(t.pnl)}`}>{pnlStr(t.pnl)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

interface Props {
  trades: Trade[];
  ctx: Map<string, TradeContext>;
  onEdit: (t: Trade) => void;
  onDelete: (id: string) => Promise<void>;
}

export default function TjTradeLog({ trades, ctx, onEdit, onDelete }: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortId>("recent");
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const found = q
      ? trades.filter(t => [t.pair, t.strategy, t.notes].some(v => v?.toLowerCase().includes(q)))
      : trades;
    return sortTrades(found, sort);
  }, [trades, query, sort]);

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

  return (
    <section className="tj-card">
      <div className="tj-card-head">
        <span className="tj-label"><NotebookText size={15} /> Registro de operaciones</span>
        <div className="tj-actions">
          <label className="tj-search">
            <Search size={14} aria-hidden="true" />
            <input
              type="search" value={query} placeholder="Buscar par, estrategia, nota…" aria-label="Buscar operaciones"
              onChange={e => { setQuery(e.target.value); setLimit(PAGE); }}
            />
          </label>
          <TjSelect compact value={sort} onChange={v => setSort(v as SortId)} options={SORTS} />
          <button type="button" className="tj-btn" onClick={() => exportCsv(list, ctx)} disabled={!list.length}>
            <Download size={13} /> CSV
          </button>
        </div>
      </div>

      {error && <p className="auth-error">{error}</p>}

      {list.length === 0 ? (
        <p className="tj-empty">Ninguna operación coincide con «{query}».</p>
      ) : (
        <div className="tj-table-wrap">
          <table className="tj-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Par</th>
                <th className="tj-hide-sm">Dir.</th>
                <th className="num tj-hide-sm">Riesgo</th>
                <th className="num">R</th>
                <th className="num">P&L</th>
                <th className="tj-hide-sm">Resultado</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {list.slice(0, limit).map(t => {
                const tone = resultTone(t.result);
                const r = rOf(t);
                const c = ctx.get(t.id);
                const isOpen = open === t.id;
                return (
                  <Fragment key={t.id}>
                    <tr className={`tj-log-row${isOpen ? " is-open" : ""}`} data-tone={tone} onClick={() => setOpen(isOpen ? null : t.id)}>
                      <td className="muted nowrap">{dateTime(t.date)}</td>
                      <td>
                        <span className="strong">{t.pair}</span>
                        {t.strategy && <span className="tj-sub">{t.strategy}</span>}
                      </td>
                      <td className="tj-hide-sm">
                        <span className={`tj-chip tone-${t.direction === "long" ? "win" : "loss"}`}>{t.direction === "long" ? "Long" : "Short"}</span>
                      </td>
                      <td className="num tj-hide-sm">
                        {moneyStr(t.risk_amount)}
                        {c?.riskPct != null && (
                          <span className={`tj-sub${c.riskPct > RISK_LIMIT_PCT ? " tone-loss" : ""}`}>{pctStr(c.riskPct, false, 2)}</span>
                        )}
                      </td>
                      <td className={`num strong tone-${toneOf(r ?? 0)}`}>{r != null ? rStr(r) : "—"}</td>
                      <td className={`num strong tone-${toneOf(t.pnl)}`}>
                        {pnlStr(t.pnl)}
                        {t.real_pnl != null && t.pnl !== plannedPnl(t) && <span className="tj-sub muted">plan {pnlStr(plannedPnl(t))}</span>}
                      </td>
                      <td className="tj-hide-sm"><span className={`tj-chip tone-${tone}`}>{RESULT_LABEL[t.result]}</span></td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="tj-actions is-end">
                          {confirming === t.id ? (
                            <>
                              <button type="button" className="tj-icon-btn tone-loss" onClick={() => remove(t.id)} disabled={deleting === t.id} aria-label="Confirmar borrado" title="Confirmar borrado">
                                <Check size={14} />
                              </button>
                              <button type="button" className="tj-icon-btn" onClick={() => setConfirming(null)} aria-label="Cancelar borrado" title="Cancelar">
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button type="button" className="tj-icon-btn" onClick={() => onEdit(t)} aria-label="Editar" title="Editar">
                                <Pencil size={14} />
                              </button>
                              <button type="button" className="tj-icon-btn" onClick={() => setConfirming(t.id)} aria-label="Eliminar" title="Eliminar">
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                          <button
                            type="button" className="tj-icon-btn" aria-expanded={isOpen} aria-label="Ver detalle" title="Ver detalle"
                            onClick={() => setOpen(isOpen ? null : t.id)}
                          >
                            <ChevronDown size={15} className="tj-log-chevron" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="tj-log-detail">
                        <td colSpan={8}>
                          <dl className="tj-strip">
                            <div className="tj-metric"><dt>Plan</dt><dd>{moneyStr(t.risk_amount)} → {moneyStr(t.expected_gain)}</dd>
                              {t.risk_amount > 0 && <dd className="tj-metric-sub">R:R {ratioStr(t.expected_gain / t.risk_amount)}</dd>}
                            </div>
                            <div className="tj-metric"><dt>Ejecución</dt><dd>{t.real_pnl != null ? pnlStr(t.real_pnl) : "Según el plan"}</dd>
                              {executionText(t) && <dd className="tj-metric-sub">{executionText(t)}</dd>}
                            </div>
                            <div className="tj-metric"><dt>Capital antes</dt><dd>{c?.equityBefore != null ? moneyStr(c.equityBefore) : "—"}</dd>
                              {c?.riskPct != null && <dd className="tj-metric-sub">arriesgó el {pctStr(c.riskPct, false, 2)}</dd>}
                            </div>
                            <div className="tj-metric"><dt>Dirección</dt><dd>{t.direction === "long" ? "Long" : "Short"}</dd></div>
                            <div className="tj-metric"><dt>Estrategia</dt><dd>{t.strategy ?? "—"}</dd></div>
                          </dl>
                          <p className={t.notes ? "tj-log-notes" : "tj-note"}>{t.notes ?? "Sin notas. Apuntar por qué entraste es lo que dentro de tres meses te dirá si falló el método o la disciplina."}</p>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {list.length > limit && (
        <button type="button" className="tj-btn tj-more" onClick={() => setLimit(l => l + PAGE)}>
          Mostrar más ({list.length - limit} restantes)
        </button>
      )}
    </section>
  );
}
