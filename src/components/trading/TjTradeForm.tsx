"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Check, Minus, TrendingDown, TrendingUp, X } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";
import { TjCombobox, TjDateTimePicker } from "./TjControls";
import { dateTime, pctStr, pnlStr, ratioStr, toneOf } from "./tjFormat";
import { RISK_LIMIT_PCT, type Direction, type Trade, type TradeResult } from "./tjStats";
import TjDayJournal from "./TjDayJournal";
import { fechaKey, type DiaDiario, type DiasMap } from "./tjDias";
import { SIN_CAPTURAS, TIPOS_CAPTURA, TjCapturasCampo, capturaDe, type CapturasPendientes } from "./TjCapturas";
import { bloquearScroll, useAjusteTeclado } from "./useVentanaMovil";

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

/** El rótulo de cada paso: su número en una bolita y el título. */
function Leyenda({ n, children, opcional }: { n: number; children: React.ReactNode; opcional?: boolean }) {
  return (
    <legend className="djf-leyenda">
      <b aria-hidden="true">{n}</b>
      <span>{children}</span>
      {opcional && <span className="dj-chip">Opcional</span>}
    </legend>
  );
}

export default function TjTradeForm({ editing, initialDate, pairOptions, strategyOptions, equity, onSaved, onClose, dias, onSaveDia }: Props) {
  const [form, setForm] = useState<FormState>(() => fromTrade(editing, initialDate));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [capturas, setCapturas] = useState<CapturasPendientes>(SIN_CAPTURAS);
  // En qué paso de la ventana se está (0 = el primero).
  const [paso, setPaso] = useState(0);
  const ventana = useRef<HTMLElement>(null);
  const velo = useRef<HTMLDivElement>(null);
  // En el móvil, el pie con «Siguiente» y «Guardar» no se esconde bajo el teclado.
  useAjusteTeclado(velo);

  // Con la ventana abierta, la página de detrás no se desplaza. El foco entra en
  // la ventana al abrirla y vuelve a donde estaba (el botón que la abrió) al cerrarla.
  useEffect(() => {
    const foco = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const soltar = bloquearScroll();
    ventana.current?.focus({ preventScroll: true });
    return () => {
      soltar();
      foco?.focus({ preventScroll: true });
    };
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

  /** Pone o quita el signo menos del P&L real (en el iPhone no hay tecla para él). */
  function cambiarSigno() {
    const v = form.real_pnl.trim();
    set("real_pnl", v.startsWith("-") ? v.slice(1) : `-${v}`);
  }

  async function submit() {
    if (submitting) return;
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
      sonar("error");
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
  /*
   * GUARDAR SIN RECORRER LO OPCIONAL (17-11-2026): el Diario se usa a diario y
   * apuntar una operación tiene que ser rápido. En cuanto lo obligatorio está
   * relleno (el par, el plan y cómo acabó), «Guardar ya» guarda desde el paso en
   * que se esté; el porqué, el gráfico y el ánimo siguen a un «Siguiente». Al
   * editar, todo está relleno: se guarda desde cualquier paso.
   */
  const guardarYa = paso < ULTIMO && primeroSinHacer === -1 && (paso >= 2 || !!editing);

  /** Enter o el botón principal: avanza si el paso está completo; en el último, guarda. */
  function alEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (paso < ULTIMO) {
      if (actual.ok) {
        sonar("pestana");
        setPaso(paso + 1);
      }
      return;
    }
    void submit();
  }

  const avisoRiesgo = (peq: boolean) => (
    <div className={`dj-aviso dj-aviso--riesgo${peq ? " dj-aviso--peq" : ""} djf-riesgo`} role="status">
      <span className="ic" aria-hidden="true">!</span>
      <span>
        <b>Por encima del {RISK_LIMIT_PCT} % de tu cuenta</b>
        Esta operación arriesga el {pctStr(riskPct ?? 0, false, 2)} de tu cuenta.
      </span>
    </div>
  );

  /*
   * El formulario es una ventana en el centro de la pantalla que se recorre
   * paso a paso con «Atrás» y «Siguiente» (pedido por el admin el 13-11-2026).
   * Va en un portal y su envoltorio lleva también la clase `trading-journal`:
   * así heredan sus colores y estilos los campos, los tonos y las caras del
   * ánimo, que en el CSS cuelgan de esa clase. No se cierra pulsando fuera:
   * sería muy fácil perder una operación a medio escribir.
   *
   * Estilo «Cuaderno de estudio» (17-11-2026): una ficha de papel para apuntar
   * la operación. Las elecciones son teclas grandes que se quedan hundidas al
   * elegirlas; a la derecha, el resguardo con lo que se va a guardar.
   */
  return createPortal(
    <div className="trading-journal djf-portal">
      <div className="dj-velo djf-velo" ref={velo}>
        <section
          ref={ventana} tabIndex={-1}
          className="dj-ventana djf" role="dialog" aria-modal="true" aria-labelledby="djf-titulo"
          onKeyDown={(e) => e.key === "Escape" && onClose()}
        >
          <header className="djf-cab">
            <div className="djf-cab-txt">
              <span className="dj-etq">Paso {paso + 1} de {pasos.length}{actual.opcional ? " · opcional" : ""}</span>
              <h2 id="djf-titulo">{editing ? "Editar operación" : "Nueva operación"}</h2>
              <span className="dj-nota">{actual.titulo}</span>
            </div>
            <Tecla color="blanca" tamano="peq" icono className="djf-cerrar" onClick={onClose} aria-label="Cerrar sin guardar">
              <X size={18} strokeWidth={2.8} aria-hidden="true" />
            </Tecla>
          </header>

          <div
            className="dj-barra djf-barra" role="progressbar" aria-label="Avance de la operación"
            aria-valuemin={1} aria-valuemax={pasos.length} aria-valuenow={paso + 1}
          >
            <i style={{ width: `${((paso + 1) / pasos.length) * 100}%` }} />
          </div>

          <ol className="djf-indice" aria-label="Pasos de la operación">
            {pasos.map((x, i) => (
              <li key={x.titulo}>
                <Tecla
                  tamano="peq"
                  color={i === paso ? "azul" : i < paso ? "menta" : "blanca"}
                  className="djf-indice-tecla"
                  sonido={i === paso ? undefined : "pestana"}
                  onClick={() => setPaso(i)}
                  disabled={i > tope}
                  aria-current={i === paso ? "step" : undefined}
                  aria-label={`Paso ${i + 1}: ${x.titulo}${i < paso ? " (hecho)" : ""}`}
                >
                  <b aria-hidden="true">{i < paso ? <Check size={14} strokeWidth={3.2} /> : i + 1}</b>
                  <span aria-hidden="true">{x.titulo}</span>
                </Tecla>
              </li>
            ))}
          </ol>

          <form onSubmit={alEnviar} className="djf-form">
            <div className="djf-cuerpo">
              <div className="djf-pasos" key={paso}>
                {paso === 0 && (
                <fieldset className="djf-paso">
                  <Leyenda n={1}>La operación</Leyenda>
                  <div className="djf-fila">
                    <div className="dj-campo">
                      <span className="dj-campo-tit">Par</span>
                      <TjCombobox value={form.pair} onChange={v => set("pair", v.toUpperCase())} options={pairOptions} placeholder="BTC/USDT, o el que operes" required maxLength={30} />
                      <span className="ayuda">Elige uno o escribe el tuyo: oro, un índice, una acción… Lo que apuntes se queda en tu lista.</span>
                    </div>
                    <div className="dj-campo">
                      <span className="dj-campo-tit">Fecha y hora</span>
                      <TjDateTimePicker value={form.date} onChange={v => set("date", v)} />
                    </div>
                  </div>
                  <div className="dj-campo">
                    <span className="dj-campo-tit" id="djf-dir">Dirección</span>
                    <div className="djf-opciones" role="radiogroup" aria-labelledby="djf-dir">
                      {DIRECCIONES.map(({ valor, titulo, ayuda, icono: Icono }) => {
                        const on = form.direction === valor;
                        return (
                          <Tecla
                            key={valor} role="radio" aria-checked={on}
                            color={on ? (valor === "long" ? "azul" : "lila") : "blanca"}
                            className={`djf-opcion is-${valor}${on ? " is-on" : ""}`}
                            sonido="elegir"
                            onClick={() => set("direction", valor)}
                          >
                            <span className="djf-opcion-icono" aria-hidden="true"><Icono size={22} strokeWidth={2.6} /></span>
                            <span className="djf-opcion-txt"><strong>{titulo}</strong><small>{ayuda}</small></span>
                          </Tecla>
                        );
                      })}
                    </div>
                  </div>
                </fieldset>
                )}
                {paso === 1 && (
                <fieldset className="djf-paso">
                  <Leyenda n={2}>El plan</Leyenda>
                  <div className="djf-fila">
                    <div className="dj-campo">
                      <label htmlFor="tj-risk">Cuánto arriesgas</label>
                      <div className="djf-dinero">
                        <span aria-hidden="true">$</span>
                        <input id="tj-risk" type="number" inputMode="decimal" value={form.risk_amount} onChange={e => set("risk_amount", e.target.value)} step="any" min="0" placeholder="0,00" required />
                      </div>
                      <span className="ayuda">lo que pierdes si salta el stop</span>
                    </div>
                    <div className="dj-campo">
                      <label htmlFor="tj-gain">Cuánto quieres ganar</label>
                      <div className="djf-dinero">
                        <span aria-hidden="true">$</span>
                        <input id="tj-gain" type="number" inputMode="decimal" value={form.expected_gain} onChange={e => set("expected_gain", e.target.value)} step="any" min="0" placeholder="0,00" required />
                      </div>
                      <span className="ayuda">lo que ganas si llega al objetivo</span>
                    </div>
                  </div>
                  <div className={`djf-plan${hayPlan ? "" : " is-vacio"}`} aria-hidden="true">
                    <div className="djf-plan-barra">
                      <span className="djf-plan-riesgo" style={{ width: `${parteRiesgo}%` }} />
                      <span className="djf-plan-objetivo" />
                    </div>
                    <div className="djf-plan-pie">
                      <span>Riesgo</span>
                      <strong className={tonoRatio ? `tone-${tonoRatio}` : undefined}>{ratio != null ? `R:R ${ratioStr(ratio)}` : "Rellena los dos para ver tu ratio"}</strong>
                      <span>Objetivo</span>
                    </div>
                  </div>
                  {riesgoAlto && avisoRiesgo(false)}
                </fieldset>
                )}
                {paso === 2 && (
                <fieldset className="djf-paso">
                  <Leyenda n={3}>Cómo acabó</Leyenda>
                  <div className="djf-opciones is-tres" role="radiogroup" aria-label="Resultado">
                    {RESULTADOS.map(({ valor, tono, icono: Icono }) => {
                      const on = result === valor;
                      return (
                        <Tecla
                          key={valor} role="radio" aria-checked={on}
                          color="blanca"
                          className={`djf-opcion djf-res is-${tono}${on ? " is-on" : ""}`}
                          sonido="elegir"
                          onClick={() => set("result", valor)}
                          disabled={hasReal}
                          title={hasReal ? "Se deduce del signo del P&L real" : undefined}
                        >
                          <span className="djf-opcion-icono" aria-hidden="true"><Icono size={20} strokeWidth={2.6} /></span>
                          <span className="djf-opcion-txt"><strong>{RESULT_LABEL[valor]}</strong></span>
                        </Tecla>
                      );
                    })}
                  </div>
                  <div className="dj-campo">
                    <label htmlFor="tj-real">P&L real <em className="djf-opc">opcional</em></label>
                    <div className="djf-dinero djf-dinero--signo">
                      <span aria-hidden="true">$</span>
                      <input
                        id="tj-real" type="number" inputMode="decimal" value={form.real_pnl} onChange={e => set("real_pnl", e.target.value)}
                        step="any" placeholder="Solo si cerraste distinto del plan"
                      />
                      {/* El teclado numérico del iPhone no tiene la tecla del menos:
                          esta pone o quita el signo de la cifra escrita. */}
                      <Tecla
                        color="blanca" tamano="peq" className="djf-signo" sonido="interruptor"
                        onClick={cambiarSigno} disabled={!hasReal || real === 0}
                        aria-label={hasReal && real < 0 ? "Pasar a ganancia (quitar el signo menos)" : "Pasar a pérdida (poner el signo menos)"}
                        title="Cambiar el signo"
                      >
                        +/−
                      </Tecla>
                    </div>
                    <span className="ayuda">
                      {hasReal
                        ? "Con el P&L real, el resultado sale de su signo: en negativo es una pérdida."
                        : "Si lo dejas vacío, se apunta tu objetivo si ganaste y tu riesgo si perdiste."}
                    </span>
                  </div>
                </fieldset>
                )}
                {paso === 3 && (
                <fieldset className="djf-paso">
                  <Leyenda n={4} opcional>El porqué</Leyenda>
                  <div className="dj-campo">
                    <span className="dj-campo-tit">Estrategia</span>
                    <TjCombobox value={form.strategy} onChange={v => set("strategy", v)} options={strategyOptions} placeholder="Scalping, swing, breakout... o la tuya" maxLength={60} />
                  </div>
                  <div className="dj-campo">
                    <label htmlFor="tj-notes" className="djf-label-cuenta">
                      Notas
                      <span className={`djf-cuenta${form.notes.length > NOTES_MAX - 20 ? " is-cerca" : ""}`}>{form.notes.length}/{NOTES_MAX}</span>
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

              {/* El resguardo: lo que se va a guardar, a la vista en todos los pasos. */}
              <aside className="dj-ficha djf-resumen" aria-label="Resumen de la operación" aria-live="polite">
                <span className="dj-nota djf-resumen-nota">Lo que se va a guardar</span>
                <div className="djf-resumen-par">
                  <strong className={form.pair ? undefined : "is-vacio"}>{form.pair || "Par"}</strong>
                  <span className={`dj-dir is-${form.direction}`}>
                    {form.direction === "long" ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
                    {form.direction === "long" ? "Long" : "Short"}
                  </span>
                </div>
                <span className="djf-resumen-fecha">{fechaOk ? dateTime(inputValueToIso(form.date)) : "Sin fecha"}</span>

                <div className={`djf-pnl${tonoPnl ? ` tone-${tonoPnl}` : ""}`}>
                  <span className="dj-etq">P&L que se registra</span>
                  <strong className="dj-cifra">{pnl == null ? "—" : pnlStr(pnl)}</strong>
                  <small>
                    {pnl == null ? "Rellena el plan" : !hasReal ? "según el plan" : planned != null && real !== planned ? `real · el plan era ${pnlStr(planned)}` : "real, igual que el plan"}
                  </small>
                </div>

                <dl className="djf-datos">
                  <div>
                    <dt>Resultado</dt>
                    <dd><span className={`dj-chip tone-${result === "win" ? "win" : result === "loss" ? "loss" : "be"}`}>{RESULT_LABEL[result]}</span></dd>
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
                  <div className={`dj-barra dj-barra--fina djf-medidor${riesgoAlto ? " is-alto" : ""}`} aria-hidden="true">
                    <i style={{ width: `${Math.min((riskPct / (RISK_LIMIT_PCT * 2)) * 100, 100)}%` }} />
                    <b />
                  </div>
                )}
                {riesgoAlto && paso !== 1 && avisoRiesgo(true)}
              </aside>
            </div>

            <div className="djf-pie">
              {error && (
                <div className="dj-aviso dj-aviso--error dj-aviso--peq djf-error" role="alert">
                  <span className="ic" aria-hidden="true">×</span>
                  <span><b>No se pudo guardar</b>{error}</span>
                </div>
              )}
              <Tecla color="blanca" className="djf-atras" sonido={paso === 0 ? undefined : "pestana"} onClick={() => (paso === 0 ? onClose() : setPaso(paso - 1))}>
                {paso === 0 ? "Cancelar" : <><ArrowLeft size={18} strokeWidth={2.8} aria-hidden="true" /> Atrás</>}
              </Tecla>
              <span className="djf-pie-nota" aria-live="polite">
                {!actual.ok
                  ? <span className="dj-nota">{actual.falta}</span>
                  : pnl != null ? <>Se registra <strong className={`dj-cifra tone-${tonoPnl}`}>{pnlStr(pnl)}</strong></> : ""}
              </span>
              <Tecla
                type="submit"
                color={paso < ULTIMO ? (guardarYa ? "blanca" : "azul") : "naranja"}
                className="djf-seguir"
                disabled={submitting || !actual.ok}
              >
                {paso < ULTIMO
                  ? <>{actual.opcional && actual.vacio ? "Omitir" : guardarYa ? "Más detalles" : "Siguiente"} <ArrowRight size={18} strokeWidth={2.8} aria-hidden="true" /></>
                  : <>{submitting ? "Guardando..." : guardada ? "Guardar cambios" : "Guardar operación"}{!submitting && <Check size={18} strokeWidth={3} aria-hidden="true" />}</>}
              </Tecla>
              {guardarYa && (
                <Tecla color="naranja" className="djf-guardar" onClick={() => void submit()} disabled={submitting}>
                  {submitting ? "Guardando..." : guardada ? "Guardar cambios" : "Guardar ya"}
                  {!submitting && <Check size={18} strokeWidth={3} aria-hidden="true" />}
                </Tecla>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>,
    document.body,
  );
}
