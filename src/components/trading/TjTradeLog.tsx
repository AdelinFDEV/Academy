"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Trash2, Download, Search, Check, X, ChevronDown, ArrowRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";
import { useSonidoVentana } from "./useSonidoVentana";
import { Cara } from "./TjDayJournal";
import { TjSelect } from "./TjControls";
import { MONTHS, WEEKDAY_NAMES, dateTime, moneyStr, pctStr, pnlStr, rStr, ratioStr, toneOf } from "./tjFormat";
import { RISK_LIMIT_PCT, computeStats, rOf, resultTone, type Trade, type TradeContext, type TradeResult } from "./tjStats";
import { animoInfo, fechaKey, type DiasMap } from "./tjDias";
import { TjCapturasVista } from "./TjCapturas";

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

/** El taco de calendario: el mes arriba y el día grande, como una hoja arrancable. */
function Taco({ d, hora, grande = false }: { d: Date; hora?: string; grande?: boolean }) {
  return (
    <span className={`djo-taco${grande ? " is-grande" : ""}`} aria-hidden="true">
      <small>{MONTH_SHORT[d.getMonth()]}</small>
      <b>{d.getDate()}</b>
      {hora && <em>{hora}</em>}
    </span>
  );
}

/** Long o short: la dirección, en azul o lila (no es un resultado). */
function Direccion({ t }: { t: Trade }) {
  return (
    <span className={`dj-dir is-${t.direction}`}>
      {t.direction === "long" ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
      {t.direction === "long" ? "Long" : "Short"}
    </span>
  );
}

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

/**
 * La tarjeta «Últimas operaciones» del Resumen. Cada línea es una tecla blanca
 * (como las respuestas del quiz del sistema) que lleva a la lista entera; el
 * pie, con el balance de lo que se ve, se queda abajo aunque haya pocas.
 */
export function TjRecentTrades({ trades, onSeeAll }: { trades: Trade[]; onSeeAll: () => void }) {
  const recent = trades.slice(-RECENT).reverse();
  const recentPnl = recent.reduce((s, t) => s + t.pnl, 0);
  const recentWins = recent.filter(t => t.result === "win").length;
  return (
    <section className="dj-hoja djo-ultimas">
      <header className="dj-cabeza">
        <div>
          <h3>Últimas operaciones</h3>
        </div>
        <Tecla color="blanca" tamano="peq" onClick={onSeeAll}>
          Ver las {trades.length} <ArrowRight size={14} strokeWidth={3} aria-hidden="true" />
        </Tecla>
      </header>
      <ul className="djo-ultimas-lista">
        {recent.map(t => {
          const r = rOf(t);
          const d = new Date(t.date);
          return (
            <li key={t.id}>
              <Tecla color="blanca" ancho className="djo-ultima dj-llana" onClick={onSeeAll}>
                <Taco d={d} />
                <span className="djo-ultima-que">
                  <span className="djo-par">{t.pair} <Direccion t={t} /></span>
                  <span className="djo-sub">
                    {timeOf(t.date)}
                    {t.strategy && ` · ${t.strategy}`}
                  </span>
                </span>
                <span className="djo-ultima-cifras">
                  <strong className={`dj-cifra tone-${toneOf(t.pnl)}`}>{pnlStr(t.pnl)}</strong>
                  <span className={`djo-r tone-${toneOf(r ?? 0)}`}>{r != null ? rStr(r) : "—"}</span>
                </span>
              </Tecla>
            </li>
          );
        })}
      </ul>
      {/* El balance de lo que se ve: el pie se queda abajo aunque haya pocas operaciones. */}
      <footer className="djo-ultimas-pie">
        <span className="dj-nota">{recent.length === 1 ? "Tu última operación" : `Tus últimas ${recent.length}`}</span>
        <span className="djo-ultimas-balance">
          <span className="dj-chip">{recentWins} de {recent.length} ganadas</span>
          <strong className={`dj-cifra tone-${toneOf(recentPnl)}`}>{pnlStr(recentPnl)}</strong>
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

/**
 * El registro completo, como las páginas de un cuaderno. Arriba, la franja con
 * el balance de lo que se ve; luego buscar, filtrar por resultado, ordenar y
 * exportar. Por fecha, la lista va agrupada por días (cada día con su taco de
 * calendario y su ánimo); por P&L o R, en una sola lista y cada operación con
 * su propio taco. Cada línea se despliega con el plan, la ejecución, el capital
 * de antes, las notas y las capturas.
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
  useSonidoVentana(open != null);

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
      sonar("borrar");
    } catch (err) {
      sonar("error");
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
      <section className="dj-hoja djo-franja" aria-label="Balance de la selección">
        <dl className="djo-cifras">
          <div className="djo-cifra-principal">
            <dt className="dj-etq">P&L de la selección</dt>
            <dd className={`dj-cifra tone-${toneOf(stats.totalPnl)}`}>{pnlStr(stats.totalPnl)}</dd>
          </div>
          <div><dt className="dj-etq">Operaciones</dt><dd className="dj-cifra">{stats.count}</dd></div>
          <div><dt className="dj-etq">Acierto</dt><dd className="dj-cifra">{stats.count ? `${Math.round(stats.winRate)} %` : "—"}</dd></div>
          <div><dt className="dj-etq">R acumulada</dt><dd className={`dj-cifra tone-${toneOf(stats.totalR)}`}>{stats.count ? rStr(stats.totalR) : "—"}</dd></div>
          <div><dt className="dj-etq">Mejor</dt><dd className={`dj-cifra tone-${toneOf(stats.best ?? 0)}`}>{stats.best != null ? pnlStr(stats.best) : "—"}</dd></div>
          <div><dt className="dj-etq">Peor</dt><dd className={`dj-cifra tone-${toneOf(stats.worst ?? 0)}`}>{stats.worst != null ? pnlStr(stats.worst) : "—"}</dd></div>
        </dl>
      </section>

      <section className="dj-hoja djo">
        <header className="dj-cabeza">
          <div>
            <h3>Tus operaciones</h3>
            <p>Pulsa una línea para ver su plan, cómo la ejecutaste, tus notas y tus capturas.</p>
          </div>
          <span className="dj-nota">{list.length === 1 ? "1 operación" : `${list.length} operaciones`}</span>
        </header>

        <div className="djo-herramientas">
          <div className="djo-filtros" role="radiogroup" aria-label="Filtrar por resultado">
            {RESULT_FILTERS.map(f => {
              const n = f.value === "all" ? trades.length : trades.filter(t => t.result === f.value).length;
              const on = result === f.value;
              return (
                <Tecla
                  key={f.value}
                  role="radio"
                  aria-checked={on}
                  tamano="peq"
                  color={on ? "azul" : "blanca"}
                  className="djo-filtro dj-llana"
                  onClick={() => { setResult(f.value); setLimit(PAGE); }}
                >
                  {f.value !== "all" && <i className={`djo-punto tone-${resultTone(f.value as TradeResult)}`} aria-hidden="true" />}
                  {f.label}
                  <span className="djo-cuenta">{n}</span>
                </Tecla>
              );
            })}
          </div>
          <div className="djo-utiles">
            <label className="dj-buscar djo-buscar">
              <Search size={16} strokeWidth={2.6} aria-hidden="true" />
              <input
                type="search" value={query} placeholder="Buscar par, estrategia, nota…" aria-label="Buscar operaciones"
                onChange={e => { setQuery(e.target.value); setLimit(PAGE); }}
              />
            </label>
            <TjSelect compact value={sort} onChange={v => setSort(v as SortId)} options={SORTS} />
            <Tecla color="azul" tamano="peq" sonido="guardado" onClick={() => exportCsv(list, ctx)} disabled={!list.length} title="Descargar lo que ves en CSV (Excel)">
              <Download size={15} strokeWidth={2.6} aria-hidden="true" /> CSV
            </Tecla>
          </div>
        </div>

        {error && (
          <div className="dj-aviso dj-aviso--error dj-aviso--peq djo-error" role="alert">
            <span className="ic" aria-hidden="true">×</span>
            <span><b>No se pudo borrar</b>{error}</span>
          </div>
        )}

        {list.length === 0 ? (
          <div className="dj-vacio">
            <h3>Nada por aquí</h3>
            <p>Ninguna operación coincide{query ? ` con «${query}»` : ""}.</p>
            <Tecla color="blanca" tamano="peq" onClick={reset}><X size={14} strokeWidth={3} aria-hidden="true" /> Quitar búsqueda y filtro</Tecla>
          </div>
        ) : (
          <div className="djo-lista">
            {groups.map(g => {
              const dayPnl = g.trades.reduce((sum, t) => sum + t.pnl, 0);
              const dia = g.date ? dias[fechaKey(g.date)] : undefined;
              const mood = dia?.animo ? animoInfo(dia.animo) : null;
              return (
                <section key={g.key} className={`djo-dia${g.date ? "" : " is-suelta"}`}>
                  {g.date && (
                    <header className="djo-dia-cabeza">
                      <Taco d={g.date} grande />
                      <span className="djo-dia-titulo">
                        <span className="cap">{dayTitle(g.date)}</span>
                        <small>{g.trades.length} {g.trades.length === 1 ? "operación" : "operaciones"}</small>
                      </span>
                      {mood && dia?.animo && (
                        <span className={`djo-animo mood-${dia.animo}`} title={`Ese día te sentías: ${mood.label.toLowerCase()}`}>
                          <Cara valor={dia.animo} peq /> {mood.label}
                        </span>
                      )}
                      <strong className={`dj-chip djo-dia-pnl tone-${toneOf(dayPnl)}`}>{pnlStr(dayPnl)}</strong>
                    </header>
                  )}
                  {g.trades.map(t => {
                    const tone = resultTone(t.result);
                    const r = rOf(t);
                    const c = ctx.get(t.id);
                    const isOpen = open === t.id;
                    const exceso = c?.riskPct != null && c.riskPct > RISK_LIMIT_PCT;
                    const ejecucion = executionText(t);
                    // Cuánto del objetivo se llevó una ganadora con P&L real apuntado.
                    const delObjetivo = t.real_pnl != null && t.pnl > 0 && t.expected_gain > 0 ? (t.pnl / t.expected_gain) * 100 : null;
                    return (
                      <article key={t.id} className={`djo-op${isOpen ? " is-abierta" : ""}`}>
                        <div className="djo-linea" onClick={() => setOpen(isOpen ? null : t.id)}>
                          <span className="djo-cuando">
                            {byDate
                              ? <span className="djo-hora">{timeOf(t.date)}</span>
                              : <Taco d={new Date(t.date)} hora={timeOf(t.date)} />}
                          </span>
                          <span className="djo-que">
                            <span className="djo-par">{t.pair} <Direccion t={t} /></span>
                            <span className="djo-sub">
                              {t.strategy ?? "Sin estrategia"}{t.notes ? " · con nota" : ""}{t.captura_antes || t.captura_despues ? " · con capturas" : ""}
                            </span>
                          </span>
                          <span className="djo-datos">
                            <span className="djo-riesgo">
                              <span className="djo-rot">Riesgo</span>
                              <span>{moneyStr(t.risk_amount)}</span>
                              {c?.riskPct != null && (
                                <small
                                  className={exceso ? "is-exceso" : undefined}
                                  title={exceso ? `Por encima del ${RISK_LIMIT_PCT} % de la cuenta` : undefined}
                                >
                                  {pctStr(c.riskPct, false, 2)} cuenta
                                </small>
                              )}
                            </span>
                            <span className={`djo-r tone-${toneOf(r ?? 0)}`}>
                              <span className="djo-rot">R</span>
                              <span>{r != null ? rStr(r) : "—"}</span>
                            </span>
                          </span>
                          <span className="djo-pnl">
                            <strong className={`dj-cifra tone-${toneOf(t.pnl)}`}>{pnlStr(t.pnl)}</strong>
                            <span className={`dj-chip tone-${tone}`}>{RESULT_LABEL[t.result]}</span>
                          </span>
                          <span className="djo-acc" onClick={e => e.stopPropagation()}>
                            {confirming === t.id ? (
                              <>
                                <Tecla color="coral" tamano="peq" className="djo-borrar" onClick={() => remove(t.id)} disabled={deleting === t.id}>
                                  <Check size={14} strokeWidth={3} aria-hidden="true" /> {deleting === t.id ? "Borrando…" : "Borrar"}
                                </Tecla>
                                <Tecla color="blanca" tamano="peq" icono onClick={() => setConfirming(null)} aria-label="Cancelar borrado" title="Cancelar">
                                  <X size={16} strokeWidth={3} />
                                </Tecla>
                              </>
                            ) : (
                              <>
                                <Tecla color="blanca" tamano="peq" icono onClick={() => onEdit(t)} aria-label={`Editar ${t.pair}`} title="Editar">
                                  <Pencil size={15} strokeWidth={2.6} />
                                </Tecla>
                                <Tecla color="blanca" tamano="peq" icono className="djo-papelera" onClick={() => setConfirming(t.id)} aria-label={`Eliminar ${t.pair}`} title="Eliminar">
                                  <Trash2 size={15} strokeWidth={2.6} />
                                </Tecla>
                              </>
                            )}
                            <Tecla
                              color={isOpen ? "azul" : "blanca"} tamano="peq" icono className="djo-abrir"
                              aria-expanded={isOpen} aria-label={isOpen ? "Ocultar detalle" : "Ver detalle"} title={isOpen ? "Ocultar detalle" : "Ver detalle"}
                              onClick={() => setOpen(isOpen ? null : t.id)}
                            >
                              <ChevronDown size={17} strokeWidth={3} />
                            </Tecla>
                          </span>
                        </div>

                        {confirming === t.id && (
                          <p className="dj-aviso dj-aviso--error dj-aviso--peq djo-confirma" role="alert">
                            <span className="ic" aria-hidden="true">×</span>
                            <span><b>¿Borrar {t.pair}?</b>Se borra del diario y no se puede deshacer.</span>
                          </p>
                        )}

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              className="djo-detalle"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                            >
                              <div className="djo-detalle-dentro">
                                <dl className="djo-fichas">
                                  <div className="dj-ficha">
                                    <dt className="dj-etq">Plan</dt>
                                    <dd className="djo-ficha-valor">{moneyStr(t.risk_amount)} → {moneyStr(t.expected_gain)}</dd>
                                    {t.risk_amount > 0 && <dd className="djo-ficha-sub">R:R {ratioStr(t.expected_gain / t.risk_amount)}</dd>}
                                  </div>
                                  <div className="dj-ficha">
                                    <dt className="dj-etq">Ejecución</dt>
                                    <dd className={`djo-ficha-valor${t.real_pnl != null ? ` tone-${toneOf(t.real_pnl)}` : ""}`}>
                                      {t.real_pnl != null ? pnlStr(t.real_pnl) : "Según el plan"}
                                    </dd>
                                    {ejecucion && <dd className="djo-ficha-sub">{ejecucion}</dd>}
                                    {delObjetivo != null && (
                                      <dd className="dj-barra dj-barra--fina djo-ficha-barra" aria-hidden="true">
                                        <i style={{ width: `${Math.min(100, delObjetivo)}%` }} />
                                      </dd>
                                    )}
                                    {t.real_pnl != null && t.pnl !== plannedPnl(t) && <dd className="djo-ficha-sub">el plan era {pnlStr(plannedPnl(t))}</dd>}
                                  </div>
                                  <div className="dj-ficha">
                                    <dt className="dj-etq">Capital antes</dt>
                                    <dd className="djo-ficha-valor">{c?.equityBefore != null ? moneyStr(c.equityBefore) : "—"}</dd>
                                    {c?.riskPct != null && <dd className="djo-ficha-sub">arriesgó el {pctStr(c.riskPct, false, 2)}</dd>}
                                  </div>
                                  <div className="dj-ficha">
                                    <dt className="dj-etq">Fecha</dt>
                                    <dd className="djo-ficha-valor">{dateTime(t.date)}</dd>
                                  </div>
                                </dl>
                                <div className={`djo-notas${t.notes ? "" : " is-vacia"}`}>
                                  <span className="dj-etq">Notas</span>
                                  <p>
                                    {t.notes ?? "Sin notas. Apuntar por qué entraste es lo que dentro de tres meses te dirá si falló el método o la disciplina."}
                                  </p>
                                </div>
                                <TjCapturasVista trade={t} />
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
          <div className="djo-mas">
            <Tecla color="blanca" onClick={() => setLimit(l => l + PAGE)}>
              Mostrar más ({list.length - limit} restantes)
            </Tecla>
          </div>
        )}
      </section>
    </>
  );
}
