"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Check, Minus, NotebookPen, TrendingDown, TrendingUp, X } from "lucide-react";
import { TjCombobox, TjDateTimePicker } from "./TjControls";
import { dateTime, pctStr, pnlStr, ratioStr, toneOf } from "./tjFormat";
import { RISK_LIMIT_PCT, type Direction, type Trade, type TradeResult } from "./tjStats";
import TjDayJournal from "./TjDayJournal";
import { fechaKey, type DiaDiario, type DiasMap } from "./tjDias";
import { SIN_CAPTURAS, TIPOS_CAPTURA, TjCapturasCampo, capturaDe, type CapturasPendientes } from "./TjCapturas";

const NOTES_MAX = 150;

interface FormState {
  date: string;
  pair: string;
  direction: Direction;
  risk_amount: string;
  expected_gain: string;
  result: TradeResult;
  real_pnl: string;
  strategy: string;
  notes: string;
}

const RESULT_LABEL: Record<TradeResult, string> = { win: "Ganada", loss: "Perdida", breakeven: "Breakeven" };
const RESULTADOS: { valor: TradeResult; tono: "win" | "loss" | "be"; icono: typeof TrendingUp }[] = [
  { valor: "win", tono: "win", icono: TrendingUp },
  { valor: "loss", tono: "loss", icono: TrendingDown },
  { valor: "breakeven", tono: "be", icono: Minus },
];
const DIRECCIONES: { valor: Direction; titulo: string; ayuda: string; icono: typeof ArrowUpRight }[] = [
  { valor: "long", titulo: "Long", ayuda: "Compras: ganas si sube", icono: ArrowUpRight },
  { valor: "short", titulo: "Short", ayuda: "Vendes: ganas si baja", icono: ArrowDownRight },
];

/**
 * Instante real -> texto para el selector de fecha, que trabaja en hora de
 * pared sin zona ("2026-09-01T22:07"). Hay que desplazar el instante por el
 * desfase local ANTES de serializar para que salga la hora del reloj del visitante.
 */
function toInputValue(d: Date): string {
  const copia = new Date(d);
  copia.setSeconds(0, 0);
  copia.setMinutes(copia.getMinutes() - copia.getTimezoneOffset());
  return copia.toISOString().slice(0, 16);
}

/**
 * Hora de pared -> instante real en ISO con zona. La columna `date` es
 * timestamptz: si recibe texto sin desfase lo da por UTC, y quien apuntaba una
 * operación a las 22:07 la veía a la 01:07 del día siguiente. `new Date(texto)`
 * lo interpreta como hora LOCAL, que es lo que quiso escribir el usuario.
 */
function inputValueToIso(valor: string): string {
  const d = new Date(valor);
  return isNaN(d.getTime()) ? valor : d.toISOString();
}

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : "Ha ocurrido un error inesperado");

function fromTrade(t: Trade | null, initialDate?: Date): FormState {
  if (!t) {
    return {
      date: toInputValue(initialDate ?? new Date()), pair: "", direction: "long", risk_amount: "", expected_gain: "",
      result: "win", real_pnl: "", strategy: "", notes: "",
    };
  }
  return {
    date: toInputValue(new Date(t.date)), pair: t.pair, direction: t.direction,
    risk_amount: String(t.risk_amount), expected_gain: String(t.expected_gain),
    result: t.result, real_pnl: t.real_pnl != null ? String(t.real_pnl) : "",
    strategy: t.strategy ?? "", notes: t.notes ?? "",
  };
}

interface Props {
  editing: Trade | null;
  /** Fecha con la que abrir una operación nueva (desde un día del calendario). */
  initialDate?: Date;
  pairOptions: string[];
  strategyOptions: string[];
  equity: number | null;
  /** `cerrar = false`: los datos ya están guardados, pero faltan las capturas. */
  onSaved: (trade: Trade, cerrar?: boolean) => void;
  onClose: () => void;
  /** Ánimo y nota por día: el formulario enseña los del día de la operación. */
  dias: DiasMap;
  onSaveDia: (d: DiaDiario) => Promise<void>;
}

export default function TjTradeForm({ editing, initialDate, pairOptions, strategyOptions, equity, onSaved, onClose, dias, onSaveDia }: Props) {
  const [form, setForm] = useState<FormState>(() => fromTrade(editing, initialDate));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [capturas, setCapturas] = useState<CapturasPendientes>(SIN_CAPTURAS);
  // En qué paso de la ventana se está (0 = el primero).
  const [paso, setPaso] = useState(0);

  // Con la ventana abierta, la página de detrás no se desplaza.
  useEffect(() => {
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = antes; };
  }, []);
  // La operación tal como está en el servidor. Una nueva pasa a tener una en
  // cuanto se guardan sus datos: si después falla una captura y se reintenta,
  // se edita esa en vez de crear otra igual.
  const [guardada, setGuardada] = useState<Trade | null>(editing);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));

  const risk = parseFloat(form.risk_amount);
  const gain = parseFloat(form.expected_gain);
  const hasRisk = !isNaN(risk) && risk > 0;
  // Con P&L real, manda él: la API guarda ese importe y saca el resultado de su signo.
  const real = form.real_pnl.trim() === "" ? null : Number(form.real_pnl);
  const hasReal = real != null && Number.isFinite(real);
  const result: TradeResult = hasReal ? (real > 0 ? "win" : real < 0 ? "loss" : "breakeven") : form.result;
  const planned = result === "breakeven" ? 0 : result === "win" ? (isNaN(gain) ? null : gain) : hasRisk ? -risk : null;
  const pnl = hasReal ? real : planned;
  const riskPct = hasRisk && equity && equity > 0 ? (risk / equity) * 100 : null;
  const ratio = hasRisk && !isNaN(gain) && gain > 0 ? gain / risk : null;
  // El día de la operación, en el calendario del usuario: sus emociones van con ella.
  const fechaDia = fechaKey(isNaN(new Date(form.date).getTime()) ? new Date() : new Date(form.date));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/trades", {
        method: guardada ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, date: inputValueToIso(form.date), ...(guardada ? { id: guardada.id } : {}) }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error al guardar");
      let trade: Trade = await res.json();
      // La respuesta de editar no trae cambios en las capturas, pero sí su estado actual.
      setGuardada(trade);

      // Las capturas van después y una a una: necesitan el id de la operación.
      const pendientes = TIPOS_CAPTURA.filter((tipo) => capturas[tipo].archivo || (capturas[tipo].quitar && capturaDe(trade, tipo)));
      if (pendientes.length) onSaved(trade, false);
      for (const tipo of pendientes) {
        const { archivo } = capturas[tipo];
        let r: Response;
        if (archivo) {
          const datos = new FormData();
          datos.set("id", trade.id);
          datos.set("tipo", tipo);
          datos.set("archivo", archivo, `${tipo}.webp`);
          r = await fetch("/api/trades/captura", { method: "POST", body: datos });
        } else {
          r = await fetch("/api/trades/captura", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: trade.id, tipo }),
          });
        }
        if (!r.ok) {
          const motivo = (await r.json().catch(() => null))?.error ?? "no se pudo subir";
          throw new Error(`La operación está guardada, pero la captura no: ${motivo}`);
        }
        trade = await r.json();
        setGuardada(trade);
        setCapturas((c) => ({ ...c, [tipo]: SIN_CAPTURAS[tipo] }));
      }
      onSaved(trade);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  // Para el dibujo del plan: qué parte de la barra es riesgo y cuál objetivo.
  const hayPlan = hasRisk && !isNaN(gain) && gain > 0;
  const parteRiesgo = hayPlan ? (risk / (risk + gain)) * 100 : 50;
  const tonoRatio = ratio == null ? "" : ratio >= 2 ? "win" : ratio >= 1 ? "be" : "loss";
  const riesgoAlto = riskPct != null && riskPct > RISK_LIMIT_PCT;
  const tonoPnl = pnl == null ? "" : toneOf(pnl);
  const fechaOk = !isNaN(new Date(form.date).getTime());

  /*
   * Los pasos de la ventana (13-11-2026). `ok` dice si se puede pasar al
   * siguiente: en los obligatorios, que esté relleno lo que la operación
   * necesita; los opcionales siempre dejan pasar. `vacio` solo cambia el texto
   * del botón: «Omitir» si no se ha puesto nada, «Siguiente» si sí.
   */
  const riesgoOk = form.risk_amount.trim() !== "" && !isNaN(risk) && risk >= 0;
  const objetivoOk = form.expected_gain.trim() !== "" && !isNaN(gain) && gain >= 0;
  const hayCapturas = TIPOS_CAPTURA.some((t) => capturas[t].archivo || (capturaDe(guardada, t) && !capturas[t].quitar));
  const pasos: { titulo: string; opcional: boolean; ok: boolean; vacio: boolean; falta: string }[] = [
    { titulo: "La operación", opcional: false, ok: form.pair.trim() !== "" && fechaOk, vacio: false, falta: "Escribe el par para seguir" },
    { titulo: "El plan", opcional: false, ok: riesgoOk && objetivoOk, vacio: false, falta: "Pon cuánto arriesgas y cuánto quieres ganar" },
    { titulo: "Cómo acabó", opcional: false, ok: !hasReal || Number.isFinite(real), vacio: false, falta: "" },
    { titulo: "El porqué", opcional: true, ok: true, vacio: !form.strategy.trim() && !form.notes.trim(), falta: "" },
    { titulo: "El gráfico", opcional: true, ok: true, vacio: !hayCapturas, falta: "" },
    { titulo: "Tu cabeza", opcional: true, ok: true, vacio: !dias[fechaDia]?.animo && !dias[fechaDia]?.nota, falta: "" },
  ];
  const ULTIMO = pasos.length - 1;
  // Hasta dónde se puede saltar desde el índice: el primer paso obligatorio sin rellenar.
  const primeroSinHacer = pasos.findIndex((x) => !x.ok);
  const tope = primeroSinHacer === -1 ? ULTIMO : primeroSinHacer;
  const actual = pasos[paso];

  /** Enter o el botón principal: avanza si el paso está completo; en el último, guarda. */
  function alEnviar(e: React.FormEvent) {
    if (paso < ULTIMO) {
      e.preventDefault();
      if (actual.ok) setPaso(paso + 1);
      return;
    }
    void submit(e);
  }

  /*
   * El formulario es una ventana en el centro de la pantalla que se recorre
   * paso a paso con «Atrás» y «Siguiente» (pedido por el admin el 13-11-2026).
   * Va en un portal y su envoltorio lleva también la clase `trading-journal`:
   * así heredan sus colores y estilos los campos, los tonos y las caras del
   * ánimo, que en el CSS cuelgan de esa clase. No se cierra pulsando fuera:
   * sería muy fácil perder una operación a medio escribir.
   */
  return createPortal(
    <div className="trading-journal tjf-velo">
      <section
        className="tj-card tj-form tjf" role="dialog" aria-modal="true" aria-labelledby="tjf-titulo"
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      >
        <header className="tjf-cab">
          <span className="tjf-cab-icono" aria-hidden="true"><NotebookPen size={20} /></span>
          <div>
            <h2 id="tjf-titulo">{editing ? "Editar operación" : "Nueva operación"}</h2>
            <p>Paso {paso + 1} de {pasos.length} · {actual.titulo}{actual.opcional ? " · opcional" : ""}</p>
          </div>
          <button type="button" className="tj-icon-btn" onClick={onClose} aria-label="Cerrar sin guardar">
            <X size={16} />
          </button>
        </header>

        <ol className="tjf-indice" aria-label="Pasos de la operación">
          {pasos.map((x, i) => (
            <li key={x.titulo} className={i === paso ? "is-aqui" : i < paso ? "is-hecho" : undefined}>
              <button type="button" onClick={() => setPaso(i)} disabled={i > tope} aria-current={i === paso ? "step" : undefined}>
                <b>{i < paso ? <Check size={13} strokeWidth={3} /> : i + 1}</b>
                <span>{x.titulo}</span>
              </button>
            </li>
          ))}
        </ol>

        <form onSubmit={alEnviar}>
          <div className="tjf-cuerpo">
            <div className="tjf-pasos" key={paso}>
              {paso === 0 && (
              <fieldset className="tjf-paso">
                <legend><b>1</b> La operación</legend>
                <div className="tjf-fila">
                  <div className="field">
                    <label>Par</label>
                    <TjCombobox value={form.pair} onChange={v => set("pair", v.toUpperCase())} options={pairOptions} placeholder="BTC/USDT" required />
                  </div>
                  <div className="field">
                    <label>Fecha y hora</label>
                    <TjDateTimePicker value={form.date} onChange={v => set("date", v)} />
                  </div>
                </div>
                <div className="tjf-opciones" role="radiogroup" aria-label="Dirección">
                  {DIRECCIONES.map(({ valor, titulo, ayuda, icono: Icono }) => (
                    <button
                      key={valor} type="button" role="radio" aria-checked={form.direction === valor}
                      className={`tjf-opcion is-${valor}${form.direction === valor ? " is-on" : ""}`}
                      onClick={() => set("direction", valor)}
                    >
                      <span className="tjf-opcion-icono" aria-hidden="true"><Icono size={20} strokeWidth={2.4} /></span>
                      <span><strong>{titulo}</strong><small>{ayuda}</small></span>
                    </button>
                  ))}
                </div>
              </fieldset>
              )}
              {paso === 1 && (
              <fieldset className="tjf-paso">
                <legend><b>2</b> El plan</legend>
                <div className="tjf-fila">
                  <div className="field">
                    <label htmlFor="tj-risk">Cuánto arriesgas</label>
                    <div className="tjf-dinero is-riesgo">
                      <span aria-hidden="true">$</span>
                      <input id="tj-risk" type="number" inputMode="decimal" value={form.risk_amount} onChange={e => set("risk_amount", e.target.value)} step="any" min="0" placeholder="0,00" required />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="tj-gain">Cuánto quieres ganar</label>
                    <div className="tjf-dinero is-objetivo">
                      <span aria-hidden="true">$</span>
                      <input id="tj-gain" type="number" inputMode="decimal" value={form.expected_gain} onChange={e => set("expected_gain", e.target.value)} step="any" min="0" placeholder="0,00" required />
                    </div>
                  </div>
                </div>
                <div className={`tjf-plan${hayPlan ? "" : " is-vacio"}`} aria-hidden="true">
                  <div className="tjf-plan-barra">
                    <span className="tjf-plan-riesgo" style={{ width: `${parteRiesgo}%` }} />
                    <span className="tjf-plan-objetivo" />
                  </div>
                  <div className="tjf-plan-pie">
                    <span>Riesgo</span>
                    <strong className={tonoRatio ? `tone-${tonoRatio}` : undefined}>{ratio != null ? `R:R ${ratioStr(ratio)}` : "Rellena los dos para ver tu ratio"}</strong>
                    <span>Objetivo</span>
                  </div>
                </div>
              </fieldset>
              )}
              {paso === 2 && (
              <fieldset className="tjf-paso">
                <legend><b>3</b> Cómo acabó</legend>
                <div className="tjf-opciones is-tres" role="radiogroup" aria-label="Resultado">
                  {RESULTADOS.map(({ valor, tono, icono: Icono }) => (
                    <button
                      key={valor} type="button" role="radio" aria-checked={result === valor}
                      className={`tjf-opcion is-${tono}${result === valor ? " is-on" : ""}`}
                      onClick={() => set("result", valor)}
                      disabled={hasReal}
                      title={hasReal ? "Se deduce del signo del P&L real" : undefined}
                    >
                      <span className="tjf-opcion-icono" aria-hidden="true"><Icono size={18} strokeWidth={2.4} /></span>
                      <span><strong>{RESULT_LABEL[valor]}</strong></span>
                    </button>
                  ))}
                </div>
                <div className="field">
                  <label htmlFor="tj-real">P&L real <em>opcional</em></label>
                  <div className="tjf-dinero">
                    <span aria-hidden="true">$</span>
                    <input
                      id="tj-real" type="number" inputMode="decimal" value={form.real_pnl} onChange={e => set("real_pnl", e.target.value)}
                      step="any" placeholder="Solo si cerraste distinto del plan"
                    />
                  </div>
                  <p className="tjf-ayuda">
                    {hasReal
                      ? "Con el P&L real, el resultado sale de su signo: en negativo es una pérdida."
                      : "Si lo dejas vacío, se apunta tu objetivo si ganaste y tu riesgo si perdiste."}
                  </p>
                </div>
              </fieldset>
              )}
              {paso === 3 && (
              <fieldset className="tjf-paso">
                <legend><b>4</b> El porqué</legend>
                <div className="field">
                  <label>Estrategia <em>opcional</em></label>
                  <TjCombobox value={form.strategy} onChange={v => set("strategy", v)} options={strategyOptions} placeholder="Scalping, swing, breakout..." />
                </div>
                <div className="field">
                  <label htmlFor="tj-notes">
                    Notas <em>opcional</em> <span className="tj-count">{form.notes.length}/{NOTES_MAX}</span>
                  </label>
                  <textarea
                    id="tj-notes" value={form.notes} onChange={e => set("notes", e.target.value)}
                    rows={3} maxLength={NOTES_MAX} placeholder="Por qué entraste, qué viste, qué harías distinto..."
                  />
                </div>
              </fieldset>
              )}
              {paso === 4 && <TjCapturasCampo editing={guardada} pendientes={capturas} onChange={setCapturas} />}

              {/* Emociones del día: se guardan aparte, al pulsar el ánimo o al salir de la nota. */}
              {paso === 5 && (
                <TjDayJournal
                  key={fechaDia}
                  fecha={fechaDia}
                  dia={dias[fechaDia]}
                  isToday={fechaDia === fechaKey(new Date())}
                  onSave={onSaveDia}
                />
              )}
            </div>

            <aside className="tjf-resumen" aria-label="Resumen de la operación" aria-live="polite">
              <span className="tjf-resumen-rotulo">Lo que se va a guardar</span>
              <div className="tjf-resumen-par">
                <strong>{form.pair || "Par"}</strong>
                <span className={`tj-dir is-${form.direction}`}>
                  {form.direction === "long" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {form.direction === "long" ? "Long" : "Short"}
                </span>
              </div>
              <span className="tjf-resumen-fecha">{fechaOk ? dateTime(inputValueToIso(form.date)) : "Sin fecha"}</span>

              <div className={`tjf-pnl${tonoPnl ? ` tone-${tonoPnl}` : ""}`}>
                <span>P&L que se registra</span>
                <strong>{pnl == null ? "—" : pnlStr(pnl)}</strong>
                <small>
                  {pnl == null ? "Rellena el plan" : !hasReal ? "según el plan" : planned != null && real !== planned ? `real · el plan era ${pnlStr(planned)}` : "real, igual que el plan"}
                </small>
              </div>

              <dl className="tjf-datos">
                <div>
                  <dt>Resultado</dt>
                  <dd><span className={`tj-chip tone-${result === "win" ? "win" : result === "loss" ? "loss" : "be"}`}>{RESULT_LABEL[result]}</span></dd>
                </div>
                <div>
                  <dt>Ratio R:R</dt>
                  <dd className={tonoRatio ? `tone-${tonoRatio}` : undefined}>{ratio != null ? ratioStr(ratio) : "—"}</dd>
                </div>
                <div className={riesgoAlto ? "is-alto" : undefined}>
                  <dt>Riesgo de la cuenta</dt>
                  <dd>{riskPct != null ? pctStr(riskPct, false, 2) : "—"}</dd>
                </div>
              </dl>
              {riskPct != null && (
                <div className={`tjf-medidor${riesgoAlto ? " is-alto" : ""}`} aria-hidden="true">
                  <span style={{ width: `${Math.min((riskPct / (RISK_LIMIT_PCT * 2)) * 100, 100)}%` }} />
                  <i />
                </div>
              )}
              {riesgoAlto && <p className="tjf-aviso"><AlertTriangle size={13} /> Por encima del {RISK_LIMIT_PCT} % de tu cuenta</p>}
            </aside>
          </div>

          <div className="tjf-pie">
            {error && <p className="auth-error">{error}</p>}
            <button type="button" className="tjf-cancelar" onClick={() => (paso === 0 ? onClose() : setPaso(paso - 1))}>
              {paso === 0 ? "Cancelar" : <><ArrowLeft size={16} aria-hidden="true" /> Atrás</>}
            </button>
            <span className="tjf-pie-nota" aria-live="polite">
              {!actual.ok ? actual.falta : pnl != null ? <>Se registra <strong className={`tone-${tonoPnl}`}>{pnlStr(pnl)}</strong></> : ""}
            </span>
            <button type="submit" className="tjf-guardar" disabled={submitting || !actual.ok}>
              {paso < ULTIMO
                ? <>{actual.opcional && actual.vacio ? "Omitir" : "Siguiente"} <ArrowRight size={16} aria-hidden="true" /></>
                : submitting ? "Guardando..." : guardada ? "Guardar cambios" : "Guardar operación"}
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  );
}
