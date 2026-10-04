"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CANAL_EMOJI, ESTADOS, ESTADO_EMOJI, METRICAS, TIPOS, TIPO_EMOJI, estadoPieza, type ObjetivoConProgreso, type Pieza,
} from "@/lib/objetivos";
import { RITMO, cifra, datosPieza, enviar, fechaCorta, finDeMes, mesVecino, nombreMes, siguienteEstado, useEditor } from "../editor";

/** Algo que de verdad salió, aunque no estuviera planeado: entradas y vídeos. */
export type Hecho = { fecha: string; tipo: "entrada" | "video"; titulo: string; enlace: string };

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

type Props = { hoy: string; mes: string; objetivos: ObjetivoConProgreso[]; piezas: Pieza[]; hechos: Hecho[] };

export default function SeccionCalendario({ hoy, mes, objetivos, piezas, hechos }: Props) {
  const editor = useEditor(objetivos);
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
              const base = METRICAS[o.metrica].tipo === "nivel" ? o.base : 0;
              const pct = Math.min(100, Math.max(0, ((o.actual - base) / Math.max(o.meta - base, 1)) * 100));
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

      <div className="obj-cal">
        {DIAS_SEMANA.map((d, i) => <div key={d} className={`obj-cal-cabecera${i >= 5 ? " obj-cal-cabecera--finde" : ""}`}>{d}</div>)}
        {celdasMes(mes).map((dia, i) => {
          if (!dia) return <div key={`h${i}`} className="obj-cal-celda obj-cal-celda--vacia" />;
          const deDia = piezas.filter((p) => p.fecha === dia);
          const salidos = hechos.filter((h) => h.fecha === dia);
          const finde = i % 7 >= 5;
          const clases = [
            "obj-cal-celda",
            finde ? "obj-cal-celda--finde" : "",
            dia < hoy ? "obj-cal-celda--pasado" : "",
            dia === hoy ? "obj-cal-celda--hoy" : "",
            sobre === dia ? "obj-cal-celda--sobre" : "",
            // En el móvil solo se ven los días con algo (y hoy).
            !deDia.length && !salidos.length && dia !== hoy ? "obj-cal-celda--sin-nada" : "",
          ].filter(Boolean).join(" ");
          return (
            <div
              key={dia}
              className={clases}
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
                <span className="obj-cal-numero">
                  {Number(dia.slice(8))}
                  {dia === hoy && <span className="obj-cal-hoy">hoy</span>}
                </span>
                <button className="obj-cal-mas" onClick={() => editor.nuevaPieza(dia)} aria-label={`Planear algo el ${fechaCorta(dia)}`}>＋</button>
              </div>
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
      </div>

      <p className="obj-truco">
        💡 Pulsa <strong>›</strong> para pasar una pieza al siguiente paso ({Object.values(ESTADO_EMOJI).join(" → ")}),
        arrástrala para cambiarla de día y pulsa su título para editarla. Al publicar una entrada o un vídeo, su pieza
        planeada se cierra sola.
      </p>

      {editor.modal}
    </>
  );
}
