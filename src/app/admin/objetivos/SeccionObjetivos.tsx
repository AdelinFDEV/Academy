"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  METRICAS, REPETICIONES, REPETICION_EMOJI, cumpleMeta, porcentajeAvance, type Ambito, type ObjetivoConProgreso, type Ritmo,
} from "@/lib/objetivos";
import { RITMO, cifra, diasEntre, fechaCorta, nombreMes, useEditor } from "./editor";

/** El resumen de arriba: primero lo que pide atención. */
const RESUMEN: { ritmos: Ritmo[]; texto: string; emoji: string; tono: string }[] = [
  { ritmos: ["retrasado"], texto: "Por detrás", emoji: "⚠️", tono: "warn" },
  { ritmos: ["en-ritmo"], texto: "En ritmo", emoji: "👍", tono: "neutro" },
  { ritmos: ["adelantado", "cumplido"], texto: "Por delante o cumplidos", emoji: "🚀", tono: "ok" },
  { ritmos: ["fallido"], texto: "Sin cumplir", emoji: "❌", tono: "bad" },
];

export default function SeccionObjetivos({ hoy, objetivos }: { hoy: string; objetivos: ObjetivoConProgreso[] }) {
  const editor = useEditor(objetivos);
  const [verArchivados, setVerArchivados] = useState(false);
  const [ambito, setAmbito] = useState<Ambito | "">("");

  const delAmbito = objetivos.filter((o) => !ambito || o.ambito === ambito);
  const activos = delAmbito.filter((o) => !o.archivado);
  const archivados = delAmbito.filter((o) => o.archivado);
  const cuenta = (a: Ambito | "") => objetivos.filter((o) => !o.archivado && (!a || o.ambito === a)).length;
  const bien = activos.filter((o) => ["cumplido", "adelantado", "en-ritmo"].includes(o.ritmo)).length;

  return (
    <>
      <div className="obj-barra-seccion">
        <div>
          <h2 className="obj-titulo-seccion">🎯 Tus objetivos</h2>
          <p className="obj-sub-seccion">Cada tarjeta te dice si vas por delante o por detrás del ritmo que necesitas.</p>
        </div>
        <button className="obj-boton obj-boton--principal" onClick={() => editor.nuevoObjetivo(hoy.slice(0, 7), ambito || "negocio")}>
          ＋ Nuevo objetivo
        </button>
      </div>

      <div className="obj-areas" role="radiogroup" aria-label="Filtrar por ámbito">
        {([["", "🗂️", "Todos"], ["negocio", "💼", "Negocio"], ["personal", "💪", "Personal"]] as const).map(([valor, emoji, texto]) => (
          <button
            key={valor || "todos"}
            role="radio"
            aria-checked={ambito === valor}
            className={`obj-area${ambito === valor ? " obj-area--activa" : ""}`}
            onClick={() => setAmbito(valor)}
          >
            <span aria-hidden="true">{emoji}</span> {texto} <small>{cuenta(valor)}</small>
          </button>
        ))}
      </div>

      {activos.length > 0 && (
        <div className="obj-panel-resumen">
          <div className="obj-panel-resumen-principal">
            <span className="obj-panel-resumen-cifra">
              {bien}<small>/{activos.length}</small>
            </span>
            <span className="obj-panel-resumen-texto">
              {bien === activos.length ? "¡Todos van bien! 🎉" : "objetivos van bien ahora mismo"}
            </span>
          </div>
          <div className="obj-panel-resumen-chips">
            {RESUMEN.map((r) => {
              const n = activos.filter((o) => r.ritmos.includes(o.ritmo)).length;
              return (
                <span key={r.texto} className={`obj-contador obj-contador--${r.tono}${n ? "" : " obj-contador--cero"}`}>
                  <span aria-hidden="true">{r.emoji}</span>
                  <strong>{n}</strong>
                  {r.texto}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {activos.length === 0 ? (
        <div className="obj-vacio-grande">
          <span className="obj-vacio-emoji" aria-hidden="true">🎯</span>
          <strong>Aún no tienes objetivos</strong>
          <p>
            Empieza por uno o dos que de verdad te importen: un ritmo de publicación que se repita cada mes, un número de
            registros o tu primer Premium.
          </p>
          <button className="obj-boton obj-boton--principal" onClick={() => editor.nuevoObjetivo(hoy.slice(0, 7))}>
            ＋ Crear mi primer objetivo
          </button>
        </div>
      ) : (
        <div className="obj-grid">
          {activos.map((o) => <TarjetaObjetivo key={o.id} o={o} hoy={hoy} onEditar={() => editor.editarObjetivo(o)} />)}
        </div>
      )}

      {archivados.length > 0 && (
        <button className="obj-boton obj-boton--suave obj-boton--pequeno" onClick={() => setVerArchivados((v) => !v)}>
          🗄️ {verArchivados ? "Ocultar" : "Ver"} {archivados.length} archivado{archivados.length === 1 ? "" : "s"}
        </button>
      )}
      {verArchivados && (
        <div className="obj-grid obj-grid--archivo">
          {archivados.map((o) => <TarjetaObjetivo key={o.id} o={o} hoy={hoy} onEditar={() => editor.editarObjetivo(o)} />)}
        </div>
      )}

      {editor.modal}
    </>
  );
}

/** «octubre 2026», «semana del 5 oct» o «5 oct – 31 oct», según cómo se repita. */
function nombrePeriodo(o: ObjetivoConProgreso, p: { desde: string; hasta: string }, corto = false): string {
  if (o.repeticion === "mensual") return nombreMes(p.desde.slice(0, 7), corto);
  if (o.repeticion === "semanal") return corto ? fechaCorta(p.desde) : `semana del ${fechaCorta(p.desde)}`;
  return `${fechaCorta(p.desde)} – ${fechaCorta(p.hasta)}`;
}

/** Anillo de progreso. El porcentaje va escrito dentro: el color nunca va solo. */
export function Anillo({ pct, tono }: { pct: number; tono: string }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className={`obj-anillo obj-anillo--${tono}`}>
      <svg viewBox="0 0 72 72" aria-hidden="true">
        <circle cx="36" cy="36" r={r} className="obj-anillo-pista" />
        <circle cx="36" cy="36" r={r} className="obj-anillo-valor" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
      </svg>
      <span className="obj-anillo-texto">{Math.round(pct)}%</span>
    </div>
  );
}

export const TONO: Record<Ritmo, string> = {
  cumplido: "ok", adelantado: "ok", "en-ritmo": "neutro", retrasado: "warn", fallido: "bad", pendiente: "off",
};

export function TarjetaObjetivo({ o, hoy, onEditar }: { o: ObjetivoConProgreso; hoy: string; onEditar: () => void }) {
  const router = useRouter();
  const [sumando, setSumando] = useState(false);

  const [nuevaMarca, setNuevaMarca] = useState("");
  const esNivel = METRICAS[o.metrica].tipo === "nivel";
  const base = esNivel ? o.base : 0;
  const pct = porcentajeAvance(o);
  const marca = porcentajeAvance({ ...o, actual: o.esperado });
  const quedan = diasEntre(hoy, o.periodo.hasta);
  const r = RITMO[o.ritmo];
  const tono = TONO[o.ritmo];
  const euros = o.metrica === "ingresos";
  const valor = (n: number) => (euros ? `${cifra(n)} €` : cifra(n));
  const falta = cumpleMeta(o.meta, base, o.actual) ? 0 : Math.abs(o.meta - o.actual);

  const cumplidos = o.historial.filter((h) => h.cumplido).length;
  const unidad = o.repeticion === "semanal" ? "semanas" : "meses";

  async function apuntarMarca(e: React.FormEvent) {
    e.preventDefault();
    if (nuevaMarca.trim() === "") return;
    setSumando(true);
    const res = await fetch(`/api/admin/plan/objetivo/${o.id}/marca`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valor: nuevaMarca.replace(",", ".") }),
    }).catch(() => null);
    setSumando(false);
    if (res?.ok) {
      setNuevaMarca("");
      router.refresh();
    } else {
      const json: { error?: string } = (await res?.json().catch(() => ({}))) ?? {};
      alert(json.error || "No se pudo apuntar la marca.");
    }
  }

  async function sumar(delta: number) {
    setSumando(true);
    const res = await fetch(`/api/admin/plan/objetivo/${o.id}/sumar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta }),
    }).catch(() => null);
    setSumando(false);
    if (res?.ok) router.refresh();
  }

  return (
    <article className={`obj-card obj-card--${tono}`}>
      <div className="obj-card-top">
        <span className="obj-insignia">
          <span aria-hidden="true">{METRICAS[o.metrica].emoji}</span> {METRICAS[o.metrica].texto}
        </span>
        <button className="obj-card-editar" onClick={onEditar} aria-label={`Editar «${o.titulo}»`} title="Editar">
          ✏️
        </button>
      </div>

      <div className="obj-card-cuerpo">
        <Anillo pct={pct} tono={tono} />
        <div className="obj-card-datos">
          <h3 className="obj-card-titulo">{o.titulo}</h3>
          <span className="obj-card-cifra">
            <strong>{valor(o.actual)}</strong>
            <span>{esNivel ? " · meta " : " de "}{valor(o.meta)}</span>
          </span>
          <span className={`obj-ritmo ${r.clase}`}>
            <span aria-hidden="true">{r.emoji}</span> {r.texto}
          </span>
        </div>
      </div>

      <div className="obj-barra" aria-label={`${Math.round(pct)} % del camino`}>
        <div className={`obj-barra-relleno obj-barra-relleno--${tono}`} style={{ width: `${pct}%` }} />
        {(o.ritmo === "en-ritmo" || o.ritmo === "retrasado" || o.ritmo === "adelantado") && (
          <div className="obj-barra-marca" style={{ left: `${marca}%` }} title={`Hoy deberías llevar ${valor(o.esperado)}`}>
            <span>hoy</span>
          </div>
        )}
      </div>

      <div className="obj-card-pie">
        <span>
          {o.repeticion !== "no" && <span aria-hidden="true">{REPETICION_EMOJI[o.repeticion]} </span>}
          {nombrePeriodo(o, o.periodo)}
        </span>
        <span className="obj-card-pie-dato">
          {o.ritmo === "cumplido"
            ? "🎉 ¡Hecho!"
            : quedan > 0
              ? `⏱️ ${quedan} día${quedan === 1 ? "" : "s"} · faltan ${valor(falta)}`
              : quedan === 0
                ? "⏱️ acaba hoy"
                : "terminado"}
        </span>
      </div>

      {o.metrica === "marca" && (
        <>
          {o.marcas.length >= 2 && <MiniGrafica marcas={o.marcas} meta={o.meta} />}
          <form className="obj-marca" onSubmit={apuntarMarca}>
            <input
              className="obj-input"
              type="number"
              step="any"
              inputMode="decimal"
              value={nuevaMarca}
              onChange={(e) => setNuevaMarca(e.target.value)}
              placeholder={o.marcas.length ? `Última: ${cifra(o.marcas[o.marcas.length - 1].valor)}` : "Tu marca de hoy"}
              aria-label="Nueva marca"
            />
            <button type="submit" className="obj-boton obj-boton--principal" disabled={sumando || nuevaMarca.trim() === ""}>
              📏 Apuntar
            </button>
          </form>
        </>
      )}

      {o.metrica === "manual" && (
        <div className="obj-sumar">
          <button onClick={() => sumar(-1)} disabled={sumando || o.actual <= 0} aria-label="Restar uno" className="obj-sumar-menos">−1</button>
          <button onClick={() => sumar(1)} disabled={sumando} className="obj-sumar-mas" aria-label="Sumar uno">
            ＋1 {sumando ? "…" : "hecho"}
          </button>
        </div>
      )}

      {o.historial.length > 0 && (
        <div className="obj-historial">
          <span className="obj-historial-resumen">
            📊 Cumplido <strong>{cumplidos} de {o.historial.length}</strong>{" "}
            {o.historial.length === 1 ? (unidad === "meses" ? "mes anterior" : "semana anterior") : `${unidad} anteriores`}
          </span>
          <div className="obj-historial-puntos">
            {o.historial.map((h) => (
              <span
                key={h.desde}
                className={`obj-historial-punto ${h.cumplido ? "obj-historial-punto--si" : "obj-historial-punto--no"}`}
                title={`${nombrePeriodo(o, h)}: ${valor(h.valor)} de ${valor(o.meta)} — ${h.cumplido ? "cumplido" : "no se llegó"}`}
              >
                <span aria-hidden="true">{h.cumplido ? "✓" : "✕"}</span>
                <span className="obj-historial-etiqueta">{nombrePeriodo(o, h, true)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {o.notas && <p className="obj-card-notas">💭 {o.notas}</p>}
      {o.repeticion !== "no" && <span className="obj-card-repite">{REPETICIONES[o.repeticion]}</span>}
    </article>
  );
}

/** La evolución de las marcas apuntadas, con la meta como línea de puntos. */
function MiniGrafica({ marcas, meta }: { marcas: { fecha: string; valor: number }[]; meta: number }) {
  const ultimas = marcas.slice(-20);
  const valores = [...ultimas.map((m) => m.valor), meta];
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const rango = max - min || 1;
  const ancho = 240;
  const alto = 56;
  const x = (i: number) => (i / Math.max(ultimas.length - 1, 1)) * ancho;
  const y = (v: number) => 4 + (1 - (v - min) / rango) * (alto - 8);
  const linea = ultimas.map((m, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(m.valor).toFixed(1)}`).join(" ");
  const primera = ultimas[0];
  const ultima = ultimas[ultimas.length - 1];
  const cambio = ultima.valor - primera.valor;
  return (
    <div className="obj-mini">
      <svg viewBox={`0 0 ${ancho} ${alto}`} preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" x2={ancho} y1={y(meta)} y2={y(meta)} className="obj-mini-meta" />
        <path d={linea} className="obj-mini-linea" />
        <circle cx={x(ultimas.length - 1)} cy={y(ultima.valor)} r="3.5" className="obj-mini-punto" />
      </svg>
      <span className="obj-mini-texto">
        {cambio === 0 ? "➖ sin cambios" : `${cambio > 0 ? "📈 +" : "📉 "}${cifra(cambio)}`} desde el {fechaCorta(primera.fecha)} · {ultimas.length} marcas
      </span>
    </div>
  );
}
