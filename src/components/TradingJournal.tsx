"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Filter, X, LineChart, Check, NotebookPen } from "lucide-react";
import { TjSegmented, TjSelect } from "@/components/trading/TjControls";
import { EquityChart, type EquityMode } from "@/components/trading/TjCharts";
import TjSummary, { TjInsights } from "@/components/trading/TjSummary";
import TjAnalysis from "@/components/trading/TjAnalysis";
import TjMilestones, { TjNextMilestone, milestoneNotices } from "@/components/trading/TjMilestones";
import type { UnlockEventDetail } from "@/components/BadgeNotifier";
import type { DiarioLogrosSync } from "@/lib/diarioLogros";
import TjTradeForm from "@/components/trading/TjTradeForm";
import TjTradeLog, { TjRecentTrades } from "@/components/trading/TjTradeLog";
import { dateLong } from "@/components/trading/tjFormat";
import {
  MILESTONES, NO_FILTERS, NO_STRATEGY, accountContext, applyFilters, buildInsights, buildMilestones, byChronology,
  computeStats, distinctByUse, equitySeries, isFiltered, maxDrawdown, parseStoredLevels,
  type Filters, type RangeId, type Trade,
} from "@/components/trading/tjStats";

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : "Ha ocurrido un error inesperado");

const COMMON_PAIRS = [
  "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT",
  "XRP/USDT", "DOGE/USDT", "ADA/USDT", "AVAX/USDT", "LINK/USDT",
];

const RANGES: { value: RangeId; label: string }[] = [
  { value: "all", label: "Todo" },
  { value: "30d", label: "30 días" },
  { value: "90d", label: "90 días" },
  { value: "ytd", label: "Este año" },
];

type View = "resumen" | "analisis" | "operaciones" | "hitos";

const VIEWS: { value: View; label: string }[] = [
  { value: "resumen", label: "Resumen" },
  { value: "analisis", label: "Análisis" },
  { value: "operaciones", label: "Operaciones" },
  { value: "hitos", label: "Hitos" },
];

/**
 * La vista vive en el hash (#analisis…): se puede enlazar desde fuera, y
 * "atrás" en el navegador vuelve a la anterior. Leerla con useSyncExternalStore
 * evita el desajuste de hidratación: en el servidor siempre es "resumen".
 */
function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function readView(): View {
  const hash = window.location.hash.slice(1);
  return VIEWS.some(v => v.value === hash) ? (hash as View) : "resumen";
}

const serverView = (): View => "resumen";

/** Cabecera de cada vista: el mismo lenguaje que las fichas públicas (número, título, lectura). */
const VIEW_HEADS: Record<View, { num: string; title: string; sub: string }> = {
  resumen: { num: "01", title: "Tu cuenta, de un vistazo", sub: "Rentabilidad, evolución del capital y lo que dicen tus números. Siempre sobre la cuenta completa." },
  analisis: { num: "02", title: "Análisis", sub: "Dónde ganas, dónde pierdes y cómo gestionas el riesgo. Todo lo que ves aquí obedece a los filtros." },
  operaciones: { num: "03", title: "Tus operaciones", sub: "El registro completo: busca, ordena, abre el detalle de cada una o expórtalo a CSV." },
  hitos: { num: "04", title: "Hitos", sub: "Niveles que premian la disciplina, no el volumen. Cada uno queda guardado entre tus logros." },
};

function ViewHead({ view }: { view: View }) {
  const h = VIEW_HEADS[view];
  return (
    <header className="imm-sechead">
      <span className="imm-sechead-num">{h.num}</span>
      <div>
        <h2>{h.title}</h2>
        <p>{h.sub}</p>
      </div>
    </header>
  );
}

export default function TradingJournal({
  initialTrades,
  userName,
  initialCapital,
  initialLogros,
}: {
  initialTrades: Trade[];
  userName: string;
  initialCapital: number | null;
  /** Niveles de hito ya guardados como logro en user_badges. */
  initialLogros: DiarioLogrosSync["stored"];
}) {
  const [trades, setTrades] = useState<Trade[]>(() => [...initialTrades].sort(byChronology));
  const [capital, setCapital] = useState<number | null>(initialCapital);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [eqMode, setEqMode] = useState<EquityMode>("equity");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Trade | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [now] = useState(() => new Date());
  const [logros, setLogros] = useState(initialLogros);
  const [editingCapital, setEditingCapital] = useState(false);
  const view = useSyncExternalStore(subscribeHash, readView, serverView);
  const formRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formOpen) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [formOpen, editing]);

  // Atajo: N abre una operación nueva, salvo que se esté escribiendo en un campo.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (e.key !== "n" && e.key !== "N") return;
      if (e.ctrlKey || e.metaKey || e.altKey || el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      e.preventDefault();
      setEditing(null);
      setFormOpen(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function goTo(v: View) {
    window.location.hash = v;
    // Si se cambia de vista desde abajo del todo, sube a las pestañas.
    const tabs = tabsRef.current;
    if (tabs && tabs.getBoundingClientRect().top < 0) tabs.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Cuenta completa: lo que no cambia al filtrar.
  const ctx = useMemo(() => accountContext(trades, capital), [trades, capital]);
  const stored = useMemo(() => parseStoredLevels(logros), [logros]);
  const account = useMemo(() => {
    const stats = computeStats(trades);
    const series = equitySeries(trades, capital ?? 0);
    return {
      stats,
      series,
      drawdown: maxDrawdown(series),
      insights: buildInsights(trades, stats, ctx),
      milestones: buildMilestones(trades, capital, ctx, now, stored),
    };
  }, [trades, capital, ctx, now, stored]);

  // Al abrir el diario, pone al día lo conseguido antes, sin avisos en cascada.
  useEffect(() => {
    let alive = true;
    fetch("/api/diario-logros", { method: "POST" })
      .then(res => (res.ok ? (res.json() as Promise<DiarioLogrosSync>) : null))
      .then(data => { if (alive && data) setLogros(data.stored); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Selección para Análisis y Operaciones.
  const filtered = useMemo(() => applyFilters(trades, filters, now), [trades, filters, now]);
  const filtering = isFiltered(filters);

  const pairs = useMemo(() => distinctByUse(trades.map(t => t.pair)), [trades]);
  const strategies = useMemo(() => distinctByUse(trades.map(t => t.strategy).filter((s): s is string => !!s)), [trades]);
  const hasUntagged = trades.some(t => !t.strategy);

  /**
   * Tras un cambio del usuario: guarda como logro los niveles de hito alcanzados.
   * Lo decide el servidor con las operaciones guardadas, y solo se avisa de lo
   * que acaba de conceder: cada nivel se anuncia una vez, con el popup de logros.
   */
  async function syncLogros() {
    try {
      const res = await fetch("/api/diario-logros", { method: "POST" });
      if (!res.ok) return;
      const data: DiarioLogrosSync = await res.json();
      setLogros(data.stored);
      const notices = milestoneNotices(MILESTONES, data.newlyUnlocked);
      if (notices.length) window.dispatchEvent(new CustomEvent<UnlockEventDetail>("badge-unlocked", { detail: { notices } }));
    } catch {
      // Sin red, el logro se guardará en la próxima sincronización.
    }
  }

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function onSaved(saved: Trade) {
    setTrades(prev =>
      (editing ? prev.map(t => (t.id === editing.id ? saved : t)) : [...prev, saved]).sort(byChronology)
    );
    closeForm();
    void syncLogros();
  }

  async function onDelete(id: string) {
    const res = await fetch("/api/trades", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error("No se pudo borrar la operación");
    setTrades(prev => prev.filter(t => t.id !== id));
    if (editing?.id === id) closeForm();
  }

  async function handleReset() {
    setResetting(true);
    setResetError("");
    try {
      const res = await fetch("/api/trades/reset", { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error al resetear");
      setTrades([]);
      setCapital(null);
      setFilters(NO_FILTERS);
      closeForm();
      setResetOpen(false);
    } catch (err) {
      setResetError(errorMessage(err));
    } finally {
      setResetting(false);
    }
  }

  const last = trades[trades.length - 1];
  const setFilter = <K extends keyof Filters>(k: K, v: Filters[K]) => setFilters(f => ({ ...f, [k]: v }));
  const openReset = () => { setResetOpen(true); setResetError(""); };

  const summary = (
    <TjSummary
      key={capital ?? "sin-capital"}
      stats={account.stats}
      capital={capital}
      drawdown={account.drawdown}
      editing={editingCapital}
      onEditingChange={setEditingCapital}
      onCapitalSaved={v => { setCapital(v); void syncLogros(); }}
      onReset={openReset}
    />
  );

  const filterBar = (
    <div className="tj-card tj-filters">
      <span className="tj-label"><Filter size={15} /> Filtrar</span>
      <TjSegmented label="Periodo" value={filters.range} onChange={v => setFilter("range", v)} options={RANGES} />
      <TjSelect compact value={filters.pair} onChange={v => setFilter("pair", v)}
        options={[{ value: "", label: "Todos los pares" }, ...pairs.map(p => ({ value: p, label: p }))]} />
      {strategies.length > 0 && (
        <TjSelect compact value={filters.strategy} onChange={v => setFilter("strategy", v)}
          options={[
            { value: "", label: "Todas las estrategias" },
            ...strategies.map(s => ({ value: s, label: s })),
            ...(hasUntagged ? [{ value: NO_STRATEGY, label: NO_STRATEGY }] : []),
          ]} />
      )}
      <TjSelect compact value={filters.direction} onChange={v => setFilter("direction", v as Filters["direction"])}
        options={[{ value: "", label: "Long y short" }, { value: "long", label: "Solo long" }, { value: "short", label: "Solo short" }]} />
      {filtering && (
        <div className="tj-actions is-end">
          <span className="tj-count">{filtered.length} de {trades.length}</span>
          <button type="button" className="tj-btn" onClick={() => setFilters(NO_FILTERS)}><X size={13} /> Limpiar</button>
        </div>
      )}
    </div>
  );

  const noMatch = (
    <div className="tj-card tj-empty">
      <p>Ninguna operación coincide con estos filtros.</p>
      <button type="button" className="tj-btn" onClick={() => setFilters(NO_FILTERS)}><X size={13} /> Quitar filtros</button>
    </div>
  );

  return (
    <div className="trading-journal imm">
      <div className="imm-backdrop" aria-hidden="true">
        <span className="imm-grid" />
        <span className="imm-orb imm-orb--1" />
        <span className="imm-orb imm-orb--2" />
        <span className="imm-orb imm-orb--3" />
      </div>

      <header className="tj-header imm-head">
        <span className="imm-watermark" aria-hidden="true">R</span>
        <div>
          <span className="imm-eyebrow">
            <span className="imm-eyebrow-dot" aria-hidden="true" />
            Premium · Privado y solo tuyo
          </span>
          <h1 className="imm-title">
            Diario de Trading
            <span className="imm-title-grad">Los números, no tu memoria.</span>
          </h1>
          <p className="imm-sub">
            {trades.length} {trades.length === 1 ? "operación registrada" : "operaciones registradas"} · {userName}
            {last && ` · última el ${dateLong(last.date)}`}
          </p>
        </div>
        <button type="button" className="btn-primary btn-small tj-new" onClick={openNew} title="Atajo: tecla N" aria-keyshortcuts="N">
          <Plus size={16} /> Nueva operación
        </button>
      </header>

      {resetOpen && (
        <div className="tj-card tj-alert">
          <p>
            Se borrarán las {trades.length} {trades.length === 1 ? "operación registrada" : "operaciones registradas"} y tu
            capital inicial. <strong>Esta acción no se puede deshacer.</strong>
          </p>
          {resetError && <p className="auth-error">{resetError}</p>}
          <div className="tj-actions">
            <button type="button" className="tj-btn tone-loss" onClick={handleReset} disabled={resetting}>
              {resetting ? "Reseteando..." : "Sí, resetear todo"}
            </button>
            <button type="button" className="tj-btn" onClick={() => setResetOpen(false)} disabled={resetting}>Cancelar</button>
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {formOpen && (
          <motion.div
            ref={formRef}
            className="tj-scroll-anchor"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <TjTradeForm
              key={editing?.id ?? "new"}
              editing={editing}
              pairOptions={distinctByUse([...pairs, ...COMMON_PAIRS])}
              strategyOptions={strategies}
              equity={capital != null ? capital + account.stats.totalPnl : null}
              onSaved={onSaved}
              onClose={closeForm}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {trades.length === 0 ? (
        <>
          {summary}
          <section className="tj-card tj-onboarding">
            <span className="tj-label"><NotebookPen size={15} /> Empieza tu diario</span>
            <ol>
              <li className={capital != null ? "on" : undefined}>
                <span>{capital != null ? <Check size={13} /> : 1}</span>
                Define tu capital inicial para medir rentabilidad y riesgo en %.
              </li>
              <li><span>2</span> Apunta cada operación con su riesgo, su objetivo y el porqué.</li>
              <li><span>3</span> A partir de 30 operaciones, tus números empiezan a decir la verdad.</li>
            </ol>
            <button type="button" className="tj-btn is-primary" onClick={openNew}><Plus size={15} /> Registrar mi primera operación</button>
          </section>
        </>
      ) : (
        <>
          <div className="tj-tabs tj-scroll-anchor" ref={tabsRef}>
            <TjSegmented label="Vista del diario" value={view} onChange={goTo} options={VIEWS} />
            {(view === "analisis" || view === "operaciones") && filtering && (
              <span className="tj-count">Filtros activos · {filtered.length} de {trades.length}</span>
            )}
          </div>

          <ViewHead view={view} />

          {view === "resumen" && (
            <>
              {summary}
              <section className="tj-card">
                <div className="tj-card-head">
                  <span className="tj-label">
                    <LineChart size={15} /> {capital != null ? "Evolución del capital" : "Curva de P&L"}
                  </span>
                  <TjSegmented label="Vista del gráfico" value={eqMode} onChange={setEqMode}
                    options={[{ value: "equity", label: "Capital" }, { value: "drawdown", label: "Drawdown" }]} />
                </div>
                <EquityChart series={account.series} base={capital ?? 0} mode={eqMode} />
              </section>
              <div className="tj-split is-balanced">
                <TjInsights insights={account.insights} />
                <TjNextMilestone milestones={account.milestones} />
              </div>
              <TjRecentTrades trades={trades} onSeeAll={() => goTo("operaciones")} />
            </>
          )}

          {view === "analisis" && (
            <>
              {filterBar}
              {filtered.length ? <TjAnalysis trades={filtered} ctx={ctx} /> : noMatch}
            </>
          )}

          {view === "operaciones" && (
            <>
              {filterBar}
              {filtered.length ? (
                <TjTradeLog
                  trades={filtered}
                  ctx={ctx}
                  onEdit={t => { setEditing(t); setFormOpen(true); }}
                  onDelete={onDelete}
                />
              ) : noMatch}
            </>
          )}

          {view === "hitos" && (
            <>
              <TjNextMilestone milestones={account.milestones} />
              <TjMilestones
                milestones={account.milestones}
                onDefineCapital={() => { setEditingCapital(true); goTo("resumen"); }}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
