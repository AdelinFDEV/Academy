"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Filter, X, Check, NotebookPen } from "lucide-react";
import { TjSegmented, TjSelect } from "@/components/trading/TjControls";
import { TjEquityCard } from "@/components/trading/TjCharts";
import TjSummary from "@/components/trading/TjSummary";
import TjAnalysis from "@/components/trading/TjAnalysis";
import TjMilestones, { TjMilestoneTeaser, milestoneNotices } from "@/components/trading/TjMilestones";
import type { UnlockEventDetail } from "@/components/BadgeNotifier";
import type { DiarioLogrosSync } from "@/lib/diarioLogros";
import TjTradeForm from "@/components/trading/TjTradeForm";
import TjTradeLog, { TjRecentTrades } from "@/components/trading/TjTradeLog";
import TjCalendar from "@/components/trading/TjCalendar";
import TjWelcome from "@/components/trading/TjWelcome";
import TjBalance from "@/components/trading/TjBalance";
import TjBot, { reiniciarNova } from "@/components/trading/TjBot";
import { NOVA_FIRMA, NOVA_RESUMEN, buildBotReport, type BotActionKind } from "@/components/trading/tjNova";
import TjEmotions from "@/components/trading/TjEmotions";
import { toDiasMap, type DiaDiario, type DiasMap } from "@/components/trading/tjDias";
import {
  MILESTONES, NO_FILTERS, NO_STRATEGY, accountContext, applyFilters, buildMilestones, byChronology,
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

type View = "resumen" | "emociones" | "analisis" | "operaciones" | "hitos";

const VIEWS: { value: View; label: string }[] = [
  { value: "resumen", label: "Resumen" },
  { value: "emociones", label: "Emociones" },
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

export default function TradingJournal({
  initialTrades,
  userName,
  userAvatar,
  initialCapital,
  initialLogros,
  initialDias,
}: {
  initialTrades: Trade[];
  /** Nombre de pila para el saludo. */
  userName: string;
  /** La foto que eligió en «Mi perfil», junto a su nombre en el saludo. */
  userAvatar: string | null;
  initialCapital: number | null;
  /** Niveles de hito ya guardados como logro en user_badges. */
  initialLogros: DiarioLogrosSync["stored"];
  /** Ánimo y nota de cada día (tabla diario_dias). */
  initialDias: DiaDiario[];
}) {
  const [trades, setTrades] = useState<Trade[]>(() => [...initialTrades].sort(byChronology));
  const [capital, setCapital] = useState<number | null>(initialCapital);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Trade | null>(null);
  /** Fecha con la que abrir una operación nueva; null = ahora. */
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [now] = useState(() => new Date());
  const [logros, setLogros] = useState(initialLogros);
  const [dias, setDias] = useState<DiasMap>(() => toDiasMap(initialDias));
  const [editingCapital, setEditingCapital] = useState(false);
  const view = useSyncExternalStore(subscribeHash, readView, serverView);
  const formRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  // Marca fija justo encima de las pestañas: ellas son sticky y nunca «salen»
  // de la pantalla, así que su posición no dice dónde empieza el contenido.
  const anclaRef = useRef<HTMLDivElement>(null);
  const vistaPrevia = useRef(view);

  useEffect(() => {
    if (formOpen) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [formOpen, editing, newDate]);

  // Las operaciones nuevas solo se apuntan desde el Resumen: el resto de vistas
  // no enseñan el botón ni responden al atajo. Editar sí se puede desde Operaciones.
  const canAdd = view === "resumen" || trades.length === 0;

  // Atajo: N abre una operación nueva, salvo que se esté escribiendo en un campo.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (!canAdd || (e.key !== "n" && e.key !== "N")) return;
      if (e.ctrlKey || e.metaKey || e.altKey || el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      e.preventDefault();
      setEditing(null);
      setNewDate(null);
      setFormOpen(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canAdd]);

  function goTo(v: View) {
    // Salir del Resumen descarta una operación nueva a medias (las ediciones siguen).
    if (v !== "resumen" && formOpen && !editing) setFormOpen(false);
    window.location.hash = v;
  }

  // Al cambiar de vista, si la barra ya iba fija encima del contenido, se sube
  // hasta dejarla justo en su sitio, con la vista nueva empezando debajo. Sin
  // animación: con el desplazamiento suave, el cambio de contenido lo dejaba a
  // medias y la barra tapaba la primera tarjeta (10-11-2026).
  useEffect(() => {
    if (vistaPrevia.current === view) return;
    vistaPrevia.current = view;
    const ancla = anclaRef.current;
    const tabs = tabsRef.current;
    if (!ancla || !tabs) return;
    const fija = parseFloat(getComputedStyle(tabs).top) || 0;
    const top = ancla.getBoundingClientRect().top;
    if (top < fija) window.scrollBy({ top: top - fija, behavior: "auto" });
  }, [view]);

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

  function openNew(date: Date | null = null) {
    setEditing(null);
    setNewDate(date);
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

  /** Guarda el ánimo y la nota de un día. Lanza si falla, para que el panel lo diga. */
  async function saveDia(d: DiaDiario) {
    const res = await fetch("/api/diario-dias", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(d),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
    setDias(prev => {
      const next = { ...prev };
      if (d.animo == null && !d.nota) delete next[d.fecha];
      else next[d.fecha] = { fecha: d.fecha, animo: d.animo, nota: d.nota };
      return next;
    });
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
      setDias({});
      setLogros([]);
      setFilters(NO_FILTERS);
      reiniciarNova();
      closeForm();
      setResetOpen(false);
    } catch (err) {
      setResetError(errorMessage(err));
    } finally {
      setResetting(false);
    }
  }

  const setFilter = <K extends keyof Filters>(k: K, v: Filters[K]) => setFilters(f => ({ ...f, [k]: v }));
  const openReset = () => { setResetOpen(true); setResetError(""); };
  const diasApuntados = Object.keys(dias).length;

  const calendar = (
    <TjCalendar
      trades={trades}
      onEdit={t => { setEditing(t); setFormOpen(true); }}
      onAdd={d => openNew(d)}
      dias={dias}
    />
  );

  const summary = (
    <TjSummary stats={account.stats} drawdown={account.drawdown} />
  );

  /*
   * Nova lee todo (operaciones, sensaciones, hitos) y lo cuenta desde la cabecera.
   * Se rehace ENTERO cada vez que cambia un dato: una operación nueva o editada,
   * un ánimo, el capital o un hito. «Ahora» se toma en cada análisis, no al abrir
   * la página: así la operación que se acaba de apuntar entra en todo.
   */
  const botReport = useMemo(
    () => buildBotReport({
      name: userName, trades, dias, milestones: account.milestones, ctx, stats: account.stats, capital, now: new Date(),
    }),
    [userName, trades, dias, account, ctx, capital],
  );

  // La huella del último análisis y su resumen (cuántas cosas, cuántas importantes
  // y la frase principal): Nova en la barra sabe si hay algo sin leer y QUÉ es.
  useEffect(() => {
    try {
      localStorage.setItem(NOVA_FIRMA, botReport.signature);
      localStorage.setItem(NOVA_RESUMEN, JSON.stringify(botReport.resumen));
    } catch {
      // Sin almacenamiento: la barra no podrá avisar de novedades, sin más.
    }
    window.dispatchEvent(new Event("tj-bot-visto"));
  }, [botReport.signature, botReport.resumen]);

  /** Los botones de los mensajes de Nova: cada uno lleva a hacer lo que propone. */
  function onBotAction(kind: BotActionKind) {
    if (kind === "nuevo") openNew();
    else if (kind === "capital") setEditingCapital(true);
    else goTo(kind);
  }

  // El balance va en la cabecera: lo primero que se ve al entrar.
  const balance = (
    <TjBalance
      key={capital ?? "sin-capital"}
      totalPnl={account.stats.totalPnl}
      capital={capital}
      series={account.series}
      editing={editingCapital}
      onEditingChange={setEditingCapital}
      onCapitalSaved={v => { setCapital(v); void syncLogros(); }}
      onReset={openReset}
    />
  );

  /** Quita los filtros de verdad (par, estrategia, dirección) y deja el periodo como estaba. */
  const limpiarFiltros = () => setFilters(f => ({ ...NO_FILTERS, range: f.range }));

  const filterBar = (
    <div className="tj-card tj-filters">
      <span className="tj-filters-title">
        <Filter size={14} /> Filtros
        <small>{view === "analisis" ? "Todo lo de abajo los obedece" : "Afectan a la lista"}</small>
      </span>
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
          <button type="button" className="tj-btn" onClick={limpiarFiltros}><X size={13} /> Limpiar</button>
        </div>
      )}
    </div>
  );

  // Lo vacío se explica por lo que lo causa: un filtro de verdad o, si no lo hay, el periodo elegido.
  const noMatch = filtering ? (
    <div className="tj-card tj-empty">
      <p>Ninguna operación coincide con estos filtros.</p>
      <button type="button" className="tj-btn" onClick={limpiarFiltros}><X size={13} /> Quitar filtros</button>
    </div>
  ) : (
    <div className="tj-card tj-empty">
      <p>No hay operaciones en este periodo.</p>
      <button type="button" className="tj-btn" onClick={() => setFilter("range", "all")}>Ver todas</button>
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

      {/* La cabecera (saludo, Nova y el balance) se queda en TODAS las vistas
          (pedido por el admin el 10-11-2026): así la página no cambia de alto al
          cambiar de pestaña, la barra no se solapa con la primera tarjeta y Nova
          sigue en su habitación sin volver a aterrizar. */}
      <TjWelcome name={userName} avatar={userAvatar} trades={trades} capital={capital} now={now} balance={balance} bot={<TjBot report={botReport} onAction={onBotAction} />} />
      <div ref={anclaRef} className="tj-scroll-anchor tj-ancla-vista" aria-hidden="true" />
      <div className="tj-topbar" ref={tabsRef}>
        {trades.length > 0 && (
          <div className="tj-tabs">
            <TjSegmented label="Vista del diario" value={view} onChange={goTo} options={VIEWS} />
            {(view === "analisis" || view === "operaciones") && filtering && (
              <span className="tj-count">Filtros activos · {filtered.length} de {trades.length}</span>
            )}
          </div>
        )}
        {canAdd && <button type="button" className="btn-primary btn-small tj-new" onClick={() => openNew()} title="Nueva operación (atajo: tecla N)" aria-label="Nueva operación" aria-keyshortcuts="N">
          <Plus size={16} /> <span className="tj-hide-sm">Nueva operación</span>
        </button>}
      </div>

      {resetOpen && (
        <div className="tj-card tj-alert">
          <p>
            Empezarás de cero: se borrarán {trades.length === 1 ? "tu operación" : `tus ${trades.length} operaciones`}, tu capital
            inicial, {diasApuntados === 1 ? "el día con emociones y notas" : `los ${diasApuntados} días con emociones y notas`} y
            los hitos del diario que hayas conseguido. Nova también olvidará todo lo que sabía de ti.
            {" "}<strong>Esta acción no se puede deshacer.</strong>
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
        {/* Una operación nueva a medias se cierra al salir del Resumen; una edición sigue abierta. */}
        {formOpen && (editing || canAdd) && (
          <motion.div
            ref={formRef}
            className="tj-scroll-anchor"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <TjTradeForm
              key={editing?.id ?? `new-${newDate?.getTime() ?? "ahora"}`}
              editing={editing}
              initialDate={newDate ?? undefined}
              pairOptions={distinctByUse([...pairs, ...COMMON_PAIRS])}
              strategyOptions={strategies}
              equity={capital != null ? capital + account.stats.totalPnl : null}
              onSaved={onSaved}
              onClose={closeForm}
              dias={dias}
              onSaveDia={saveDia}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={trades.length === 0 ? "vacio" : view}
        className="tj-vista"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
      {trades.length === 0 ? (
        <>
          {calendar}
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
            <button type="button" className="tj-btn is-primary" onClick={() => openNew()}><Plus size={15} /> Registrar mi primera operación</button>
          </section>
        </>
      ) : (
        <>
          {view === "resumen" && (
            <>
              {/* El calendario, a todo el ancho y lo primero; la cuenta, en franja debajo. */}
              <div className="tjr-top">
                {calendar}
                {summary}
              </div>
              <TjEquityCard series={account.series} capital={capital} drawdown={account.drawdown} />
              {/* Últimas operaciones y próximo hito, a la misma altura. Las lecturas automáticas
                  que iban aquí («Lo que dicen tus números») serán frases del bot. */}
              <div className="tjr-duo">
                <TjRecentTrades trades={trades} onSeeAll={() => goTo("operaciones")} />
                <TjMilestoneTeaser milestones={account.milestones} onOpen={() => goTo("hitos")} />
              </div>
            </>
          )}

          {view === "emociones" && (
            <TjEmotions trades={trades} dias={dias} now={now} onOpenToday={() => { goTo("resumen"); openNew(); }} />
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
                  dias={dias}
                  onEdit={t => { setEditing(t); setFormOpen(true); }}
                  onDelete={onDelete}
                />
              ) : noMatch}
            </>
          )}

          {view === "hitos" && (
            <TjMilestones
              milestones={account.milestones}
              trades={trades}
              now={now}
              onDefineCapital={() => { setEditingCapital(true); goTo("resumen"); }}
            />
          )}
        </>
      )}
      </motion.div>
      </AnimatePresence>
    </div>
  );
}
