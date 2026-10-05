"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ANIMOS, ANIMO_EMOJI, CANAL_EMOJI, EMOCIONES, EMOCION_EMOJI, ESTADOS, ESTADO_EMOJI, ETIQUETAS, METRICAS, TIPOS, TIPO_EMOJI,
  estadoPieza, periodosEnRango, porcentajeAvance,
  type Balance, type Emocion, type Etiqueta, type ObjetivoConProgreso, type Pieza,
} from "@/lib/objetivos";
import ResumenMes from "./ResumenMes";
import { useCierreDia } from "../CierreDia";
import { MarcarDia } from "./MarcarDia";
import type { DineroMes } from "@/lib/objetivosServidor";
import { RITMO, cifra, datosPieza, enviar, fechaCorta, finDeMes, mesVecino, nombreMes, siguienteEstado, useEditor } from "../editor";

/** Algo que de verdad salió, aunque no estuviera planeado: entradas y vídeos. */
export type Hecho = { fecha: string; tipo: "entrada" | "video"; titulo: string; enlace: string };

/** Lo que el calendario necesita de cada nota del diario: nunca el texto. */
export type Animo = { fecha: string; animo: number | null; emocion: Emocion | null; etiqueta: Etiqueta | null };

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** Las celdas del mes, empezando en lunes. `null` = hueco antes del día 1. */
function celdasMes(mes: string): (string | null)[] {
  const [a, m] = mes.split("-").map(Number);
  const hueco = (new Date(Date.UTC(a, m - 1, 1)).getUTCDay() + 6) % 7;
  const total = new Date(Date.UTC(a, m, 0)).getUTCDate();
  const celdas: (string | null)[] = Array(hueco).fill(null);
  for (let d = 1; d <= total; d++) celdas.push(`${mes}-${String(d).padStart(2, "0")}`);
  while (celdas.length % 7) celdas.push(null);
  return celdas;
}

const TONO_RITMO: Record<string, string> = {
  cumplido: "ok", adelantado: "ok", "en-ritmo": "neutro", retrasado: "warn", fallido: "bad", pendiente: "off",
};

/** Un objetivo dibujado como franja dentro de una semana del calendario. */
type Franja = {
  o: ObjetivoConProgreso;
  /** Columna de inicio y de fin dentro de la semana (0 = lunes). */
  ini: number;
  fin: number;
  carril: number;
  tono: string;
  /** Si el periodo viene de la semana anterior o sigue en la siguiente: entonces no se redondea ese lado. */
  sigueIzq: boolean;
  sigueDcha: boolean;
  esActual: boolean;
};

/**
 * Cómo pintar un periodo de un objetivo:
 * - el que se mide ahora, según su ritmo;
 * - uno pasado, verde si se cumplió y rojo si no (sale del historial);
 * - uno futuro, en gris.
 */
function tonoDePeriodo(o: ObjetivoConProgreso, desde: string, hoy: string): { tono: string; esActual: boolean } {
  if (desde >= o.periodo.desde && desde <= o.periodo.hasta) return { tono: TONO_RITMO[o.ritmo], esActual: true };
  const pasado = o.historial.find((h) => desde >= h.desde && desde <= h.hasta);
  if (pasado) return { tono: pasado.cumplido ? "ok" : "bad", esActual: false };
  return { tono: desde > hoy ? "futuro" : "off", esActual: false };
}

/** Las franjas de una semana, repartidas en carriles para que no se pisen. */
function franjasDeSemana(semana: (string | null)[], objetivos: ObjetivoConProgreso[], hoy: string): Franja[] {
  const dias = semana.filter((d): d is string => !!d);
  if (!dias.length) return [];
  const primero = dias[0];
  const ultimo = dias[dias.length - 1];

  const franjas: Omit<Franja, "carril">[] = [];
  for (const o of objetivos) {
    if (o.archivado) continue;
    for (const p of periodosEnRango(o, primero, ultimo)) {
      const finObjetivo = o.hasta ?? "9999-12-31";
      // ¿El periodo real empieza antes de esta semana o acaba después?
      const empiezaPeriodo =
        o.repeticion === "no" ? o.desde : o.repeticion === "mensual" ? `${p.desde.slice(0, 8)}01` : p.desde;
      const acabaPeriodo =
        o.repeticion === "no" ? finObjetivo : o.repeticion === "mensual" ? finDeMes(p.hasta.slice(0, 7)) : p.hasta;
      franjas.push({
        o,
        ini: semana.indexOf(p.desde),
        fin: semana.indexOf(p.hasta),
        sigueIzq: p.desde === primero && p.desde > empiezaPeriodo && p.desde > o.desde,
        sigueDcha: p.hasta === ultimo && p.hasta < acabaPeriodo && p.hasta < finObjetivo,
        ...tonoDePeriodo(o, p.desde, hoy),
      });
    }
  }

  // Carriles: cada franja va al primer hueco libre, las largas primero.
  franjas.sort((a, b) => a.ini - b.ini || b.fin - b.ini - (a.fin - a.ini));
  const finCarril: number[] = [];
  return franjas.map((f) => {
    let carril = finCarril.findIndex((fin) => fin < f.ini);
    if (carril === -1) carril = finCarril.length;
    finCarril[carril] = f.fin;
    return { ...f, carril };
  });
}

type Props = {
  hoy: string;
  mes: string;
  objetivos: ObjetivoConProgreso[];
  piezas: Pieza[];
  hechos: Hecho[];
  animos: Animo[];
  /** Cierre de cada día (productividad y dinero), de este mes y del anterior. */
  balances: Record<string, Balance>;
  premiumEstimado: Record<string, number>;
  dineroMeses: DineroMes[];
};

export default function SeccionCalendario({ hoy, mes, objetivos, piezas, hechos, animos, balances, premiumEstimado, dineroMeses }: Props) {
  const editor = useEditor(objetivos);
  const cierre = useCierreDia();
  const router = useRouter();
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  /** Guarda un cambio rápido (estado o fecha) sin abrir el formulario. */
  async function cambiarPieza(p: Pieza, cambios: Record<string, string>) {
    setOcupado(true);
    const fallo = await enviar("pieza", p.id, { ...datosPieza(p), ...cambios });
    setOcupado(false);
    if (fallo) alert(fallo);
    else router.refresh();
  }

  const delMes = objetivos.filter((o) => !o.archivado && o.desde <= finDeMes(mes) && (o.hasta ?? "9999-12-31") >= `${mes}-01`);
  const publicadas = piezas.filter((p) => p.estado === "publicado").length + hechos.length;
  const enMarcha = piezas.filter((p) => ["en-curso", "en-riesgo"].includes(estadoPieza(p, hoy))).length;
  const enRiesgo = piezas.filter((p) => estadoPieza(p, hoy) === "en-riesgo").length;
  const vencidas = piezas.filter((p) => estadoPieza(p, hoy) === "vencida").length;
  const esEsteMes = mes === hoy.slice(0, 7);

  // El ánimo de cada día, sacado del diario: la media si ese día hay varias notas.
  const animoDelDia = new Map<string, { valor: number; notas: Animo[] }>();
  for (const n of animos) {
    if (n.animo === null || !n.fecha.startsWith(mes)) continue;
    const previo = animoDelDia.get(n.fecha);
    const notas = [...(previo?.notas ?? []), n];
    const valores = notas.map((x) => x.animo as number);
    animoDelDia.set(n.fecha, { valor: valores.reduce((s, v) => s + v, 0) / valores.length, notas });
  }
  const celdas = celdasMes(mes);
  const semanas = Array.from({ length: celdas.length / 7 }, (_, w) => celdas.slice(w * 7, w * 7 + 7));

  return (
    <>
      <div className="obj-barra-seccion">
        <div className="obj-mes-nav">
          <Link href={`/admin/objetivos/calendario?mes=${mesVecino(mes, -1)}`} className="obj-flecha" aria-label="Mes anterior">‹</Link>
          <h2 className="obj-mes-nombre">{nombreMes(mes)}</h2>
          <Link href={`/admin/objetivos/calendario?mes=${mesVecino(mes, 1)}`} className="obj-flecha" aria-label="Mes siguiente">›</Link>
          {!esEsteMes && <Link href="/admin/objetivos/calendario" className="obj-boton obj-boton--suave obj-boton--pequeno">Volver a hoy</Link>}
        </div>
        <button className="obj-boton obj-boton--principal" onClick={() => editor.nuevaPieza(esEsteMes ? hoy : `${mes}-01`)}>
          ＋ Planear contenido
        </button>
      </div>

      <div className="obj-contadores">
        <span className="obj-contador obj-contador--ok"><span aria-hidden="true">✅</span><strong>{publicadas}</strong>publicado{publicadas === 1 ? "" : "s"}</span>
        <span className="obj-contador obj-contador--neutro"><span aria-hidden="true">🛠️</span><strong>{enMarcha}</strong>en marcha</span>
        <span className={`obj-contador obj-contador--warn${enRiesgo ? "" : " obj-contador--cero"}`}><span aria-hidden="true">⏰</span><strong>{enRiesgo}</strong>salen ya y siguen en idea</span>
        <span className={`obj-contador obj-contador--bad${vencidas ? "" : " obj-contador--cero"}`}><span aria-hidden="true">🔴</span><strong>{vencidas}</strong>con la fecha pasada</span>
      </div>

      {/* El vistazo de «cómo voy» este mes */}
      {delMes.length > 0 && (
        <div className="obj-franja">
          <span className="obj-franja-titulo">🎯 Objetivos de {nombreMes(mes, true)}</span>
          <div className="obj-franja-items">
            {delMes.map((o) => {
              const pct = porcentajeAvance(o);
              const tono = TONO_RITMO[o.ritmo];
              return (
                <div key={o.id} className="obj-franja-item">
                  <div className="obj-franja-linea">
                    <span className="obj-franja-nombre"><span aria-hidden="true">{METRICAS[o.metrica].emoji}</span> {o.titulo}</span>
                    <span className="obj-franja-cifra">{cifra(o.actual)} / {cifra(o.meta)}</span>
                  </div>
                  <div className="obj-barra obj-barra--fina">
                    <div className={`obj-barra-relleno obj-barra-relleno--${tono}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`obj-ritmo obj-ritmo--mini ${RITMO[o.ritmo].clase}`}>{RITMO[o.ritmo].emoji} {RITMO[o.ritmo].texto}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="obj-cal-cabeceras">
        {DIAS_SEMANA.map((d, i) => <div key={d} className={`obj-cal-cabecera${i >= 5 ? " obj-cal-cabecera--finde" : ""}`}>{d}</div>)}
      </div>

      <div className="obj-cal">
        {semanas.map((semana, w) => {
          const franjas = franjasDeSemana(semana, objetivos, hoy);
          const carriles = franjas.reduce((m, f) => Math.max(m, f.carril + 1), 0);
          return (
            <div key={w} className="obj-cal-semana" style={{ "--carriles": carriles } as CSSProperties}>
              {franjas.map((f) => (
                <button
                  key={`${f.o.id}-${f.ini}`}
                  className={[
                    "obj-franja-cal",
                    `obj-franja-cal--${f.tono}`,
                    f.sigueIzq ? "obj-franja-cal--sigue-izq" : "",
                    f.sigueDcha ? "obj-franja-cal--sigue-dcha" : "",
                  ].filter(Boolean).join(" ")}
                  style={{ gridColumn: `${f.ini + 1} / ${f.fin + 2}`, gridRow: f.carril + 1 }}
                  onClick={() => editor.editarObjetivo(f.o)}
                  title={`${f.o.titulo}${f.esActual ? ` · ${cifra(f.o.actual)} de ${cifra(f.o.meta)} · ${RITMO[f.o.ritmo].texto}` : ""}. Pulsa para editarlo.`}
                >
                  <span aria-hidden="true">{METRICAS[f.o.metrica].emoji}</span>
                  <span className="obj-franja-cal-titulo">{f.o.titulo}</span>
                  {f.esActual && <span className="obj-franja-cal-cifra">{cifra(f.o.actual)}/{cifra(f.o.meta)}</span>}
                </button>
              ))}
              {semana.map((dia, d) => {
                const i = w * 7 + d;
                const posicion: CSSProperties = { gridColumn: d + 1, gridRow: carriles + 1 };
                if (!dia) return <div key={`h${i}`} className="obj-cal-celda obj-cal-celda--vacia" style={posicion} />;
                const deDia = piezas.filter((p) => p.fecha === dia);
                const salidos = hechos.filter((h) => h.fecha === dia);
                const finde = i % 7 >= 5;
                const balance = balances[dia];
                const abrirCierre = () => cierre.abrir(dia, balance, premiumEstimado[dia] ?? 0);
                const clases = [
                  "obj-cal-celda",
                  finde ? "obj-cal-celda--finde" : "",
                  dia < hoy ? "obj-cal-celda--pasado" : "",
                  dia === hoy ? "obj-cal-celda--hoy" : "",
                  sobre === dia ? "obj-cal-celda--sobre" : "",
                  // Productivo en verde, no productivo en rojo: se ve el mes de un vistazo.
                  balance?.productividad === 1 ? "obj-cal-celda--no-prod" : "",
                  balance?.productividad === 2 ? "obj-cal-celda--prod" : "",
                  balance?.productividad === 3 ? "obj-cal-celda--prod obj-cal-celda--prod-max" : "",
                  // En el móvil se ocultan solo los días por llegar sin nada: los pasados
                  // se quedan, para poder marcarlos productivos o no.
                  !deDia.length && !salidos.length && !balance && dia > hoy ? "obj-cal-celda--sin-nada" : "",
                ].filter(Boolean).join(" ");
                return (
                  <div
                    key={dia}
                    className={clases}
                    style={posicion}
                    onDragOver={(e) => {
                      if (!arrastrando) return;
                      e.preventDefault();
                      if (sobre !== dia) setSobre(dia);
                    }}
                    onDragLeave={() => setSobre((s) => (s === dia ? null : s))}
                    onDrop={(e) => {
                      e.preventDefault();
                      setSobre(null);
                      const pieza = piezas.find((p) => p.id === e.dataTransfer.getData("text/plain"));
                      if (pieza && pieza.fecha !== dia) cambiarPieza(pieza, { fecha: dia });
                    }}
                  >
                    <div className="obj-cal-dia">
                      <button
                        type="button"
                        className="obj-cal-numero"
                        onClick={abrirCierre}
                        title={dia > hoy ? "Día por llegar" : "Cerrar el día: productividad y dinero ganado"}
                        disabled={dia > hoy}
                      >
                        {Number(dia.slice(8))}
                        {dia === hoy && <span className="obj-cal-hoy">hoy</span>}
                      </button>
                      {animoDelDia.has(dia) && (() => {
                        const d = animoDelDia.get(dia)!;
                        const nivel = Math.min(5, Math.max(1, Math.round(d.valor)));
                        const detalle = d.notas
                          .map((n) => [n.etiqueta ? ETIQUETAS[n.etiqueta].emoji : "", n.emocion ? `${EMOCION_EMOJI[n.emocion]} ${EMOCIONES[n.emocion]}` : ""].filter(Boolean).join(" "))
                          .filter(Boolean)
                          .join(" · ");
                        return (
                          <span
                            className={`obj-cal-animo obj-cal-animo--${nivel}`}
                            title={`Ánimo del día: ${ANIMOS[nivel - 1]} (${d.valor.toFixed(1)}/5) · ${d.notas.length} nota${d.notas.length === 1 ? "" : "s"}${detalle ? ` · ${detalle}` : ""}`}
                          >
                            {ANIMO_EMOJI[nivel - 1]}
                          </span>
                        );
                      })()}
                      <button className="obj-cal-mas" onClick={() => editor.nuevaPieza(dia)} aria-label={`Planear algo el ${fechaCorta(dia)}`} title="Planear contenido este día">＋</button>
                    </div>
                    {balance && balance.total > 0 && (
                      <button type="button" className="obj-cal-dinero" onClick={abrirCierre} title={`Ganado este día: ${cifra(balance.total)} €`}>
                        <span aria-hidden="true">💶</span> +{cifra(balance.total)} €
                      </button>
                    )}
                    {deDia.map((p) => {
                      const siguiente = siguienteEstado(p.estado);
                      return (
                        <div
                          key={p.id}
                          className={`obj-pieza obj-pieza--${estadoPieza(p, hoy)} obj-pieza--canal-${p.canal}${arrastrando === p.id ? " obj-pieza--arrastrando" : ""}`}
                          draggable={!ocupado}
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", p.id);
                            e.dataTransfer.effectAllowed = "move";
                            setArrastrando(p.id);
                          }}
                          onDragEnd={() => {
                            setArrastrando(null);
                            setSobre(null);
                          }}
                        >
                          <button
                            className="obj-pieza-abrir"
                            onClick={() => editor.editarPieza(p)}
                            title={`${p.titulo} · ${TIPOS[p.tipo]} · ${ESTADO_EMOJI[p.estado]} ${ESTADOS[p.estado]}. Arrástrala a otro día para moverla.`}
                          >
                            <span className="obj-pieza-canal" aria-hidden="true">{CANAL_EMOJI[p.canal]}</span>
                            <span className="obj-pieza-titulo">{p.titulo}</span>
                            <span className="obj-pieza-estado" aria-hidden="true">{ESTADO_EMOJI[p.estado]}</span>
                          </button>
                          {siguiente && (
                            <button
                              className="obj-pieza-avanzar"
                              onClick={() => cambiarPieza(p, { estado: siguiente })}
                              disabled={ocupado}
                              title={`${ESTADOS[p.estado]} → ${ESTADO_EMOJI[siguiente]} ${ESTADOS[siguiente]}`}
                              aria-label={`Pasar «${p.titulo}» a ${ESTADOS[siguiente]}`}
                            >
                              ›
                            </button>
                          )}
                        </div>
                      );
              })}
              {salidos.map((h, j) => (
                <a
                  key={`${h.enlace}-${j}`}
                  href={h.enlace}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="obj-pieza obj-pieza--salido"
                  title={`Publicado: ${h.titulo}`}
                >
                  <span className="obj-pieza-abrir">
                    <span className="obj-pieza-canal" aria-hidden="true">{h.tipo === "video" ? CANAL_EMOJI.youtube : CANAL_EMOJI.web}</span>
                    <span className="obj-pieza-titulo">{h.titulo}</span>
                    <span className="obj-pieza-estado" aria-hidden="true">{TIPO_EMOJI[h.tipo === "video" ? "video" : "entrada"]}</span>
                  </span>
                </a>
              ))}
              {/* Abajo del todo: productivo o no, y la nota */}
              {dia <= hoy && <MarcarDia key={`${dia}-${balance?.productividad ?? 0}-${balance?.nota ?? ""}`} dia={dia} balance={balance} aLaIzquierda={d >= 4} />}
            </div>
          );
              })}
            </div>
          );
        })}
      </div>

      <div className="obj-leyenda">
        <span><i className="obj-punto obj-punto--hecha" /> Publicado</span>
        <span><i className="obj-punto obj-punto--en-curso" /> En marcha</span>
        <span><i className="obj-punto obj-punto--en-riesgo" /> Sale en 2 días y sigue en idea o guion</span>
        <span><i className="obj-punto obj-punto--vencida" /> Se pasó la fecha</span>
        <span><i className="obj-punto obj-punto--salido" /> Salió sin planear (detectado solo)</span>
        <span><i className="obj-leyenda-franja" /> Objetivo: cubre sus días · verde cumplido, rojo no, gris futuro</span>
        <span><span aria-hidden="true">😄</span> Tu ánimo de ese día (del diario)</span>
        <span><span aria-hidden="true">✅ ❌ 💶</span> Día productivo, no productivo y dinero ganado · pulsa el número del día para cerrarlo</span>
      </div>

      <p className="obj-truco">
        💡 Pulsa <strong>›</strong> para pasar una pieza al siguiente paso ({Object.values(ESTADO_EMOJI).join(" → ")}),
        arrástrala para cambiarla de día y pulsa su título para editarla. Al publicar una entrada o un vídeo, su pieza
        planeada se cierra sola.
      </p>

      <ResumenMes hoy={hoy} mes={mes} objetivos={objetivos} piezas={piezas} hechos={hechos} animos={animos} balances={balances} dineroMeses={dineroMeses} />

      {editor.modal}
      {cierre.modal}
    </>
  );
}
