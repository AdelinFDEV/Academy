"use client";

import Link from "next/link";
import { ANIMO_EMOJI, ANIMOS, METRICAS, porcentajeAvance, type Nota, type ObjetivoConProgreso } from "@/lib/objetivos";
import { RITMO, cifra, diasEntre, sumarDias } from "../editor";
import { Anillo, TONO } from "../SeccionObjetivos";

/**
 * «Así vas con tus metas», arriba del diario. Todo sale solo de los objetivos
 * y de las notas: no hay que apuntar nada para que se actualice.
 *
 * Va en el diario a propósito: es donde se escribe cómo te sientes, y conviene
 * escribirlo sabiendo cómo van las cosas de verdad, no cómo parece que van.
 */

type Veredicto = { emoji: string; titulo: string; texto: string; tono: string };

function veredicto(bien: number, total: number, detras: number): Veredicto {
  const parte = bien / total;
  if (parte === 1) return { emoji: "🚀", titulo: "Vas genial", texto: "Todas tus metas van en ritmo o por delante.", tono: "ok" };
  if (parte >= 0.6) return { emoji: "👍", titulo: "Vas bien", texto: `La mayoría van en ritmo. ${detras ? `Ojo con ${detras === 1 ? "la que va" : `las ${detras} que van`} por detrás.` : ""}`, tono: "ok" };
  if (parte >= 0.4) return { emoji: "⚖️", titulo: "A medias", texto: "La mitad de tus metas van bien y la otra mitad necesitan un empujón.", tono: "warn" };
  if (bien > 0) return { emoji: "⚠️", titulo: "Toca apretar", texto: "La mayoría van por detrás del ritmo que necesitan.", tono: "warn" };
  return { emoji: "🧭", titulo: "Hay que reenfocar", texto: "Ninguna meta va en ritmo ahora mismo. Quizá toca elegir menos y empujar más.", tono: "bad" };
}

function media(valores: number[]): number | null {
  return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null;
}

export default function ResumenMetas({ hoy, objetivos, notas }: { hoy: string; objetivos: ObjetivoConProgreso[]; notas: Nota[] }) {
  const activos = objetivos.filter((o) => !o.archivado && o.ritmo !== "pendiente");

  if (!activos.length) {
    return (
      <section className="obj-metas obj-metas--vacio">
        <span className="obj-metas-emoji" aria-hidden="true">🎯</span>
        <div>
          <strong>Aún no hay metas que seguir</strong>
          <p>Cuando crees objetivos, aquí verás de un vistazo si los vas cumpliendo, sin hacer nada.</p>
        </div>
        <Link href="/admin/objetivos" className="obj-boton obj-boton--principal obj-boton--pequeno">＋ Crear un objetivo</Link>
      </section>
    );
  }

  const avance = porcentajeAvance;

  const bien = activos.filter((o) => ["cumplido", "adelantado", "en-ritmo"].includes(o.ritmo)).length;
  const detras = activos.filter((o) => o.ritmo === "retrasado" || o.ritmo === "fallido").length;
  const v = veredicto(bien, activos.length, detras);
  const avanceMedio = activos.reduce((s, o) => s + avance(o), 0) / activos.length;

  // Historial de todos los objetivos: cuántos periodos cerrados se cumplieron.
  const cerrados = activos.flatMap((o) => o.historial);
  const cumplidos = cerrados.filter((h) => h.cumplido).length;

  // Ánimo de los últimos 30 días, para leerlo junto a cómo van las metas.
  const animo30 = media(
    notas.filter((n) => n.animo !== null && n.fecha >= sumarDias(hoy, -29)).map((n) => n.animo as number)
  );

  // Primero lo que pide atención.
  const orden = ["retrasado", "fallido", "en-ritmo", "adelantado", "cumplido"];
  const lista = [...activos].sort((a, b) => orden.indexOf(a.ritmo) - orden.indexOf(b.ritmo));

  return (
    <section className={`obj-metas obj-metas--${v.tono}`} aria-label="Así vas con tus metas">
      <div className="obj-metas-cabeza">
        <Anillo pct={avanceMedio} tono={v.tono} />
        <div className="obj-metas-veredicto">
          <span className="obj-metas-ey">🎯 Así vas con tus metas · se actualiza solo</span>
          <strong className="obj-metas-titulo">
            <span aria-hidden="true">{v.emoji}</span> {v.titulo}
          </strong>
          <p>{v.texto}</p>
        </div>
        <div className="obj-metas-cifras">
          <span className="obj-metas-cifra obj-metas-cifra--ok">
            <strong>{bien}</strong> de {activos.length}
            <small>van bien</small>
          </span>
          {cerrados.length > 0 && (
            <span className="obj-metas-cifra">
              <strong>{cumplidos}</strong> de {cerrados.length}
              <small>periodos cumplidos</small>
            </span>
          )}
          {animo30 !== null && (
            <span className="obj-metas-cifra">
              <strong>{ANIMO_EMOJI[Math.round(animo30) - 1]} {ANIMOS[Math.round(animo30) - 1]}</strong>
              <small>tu ánimo · 30 días ({cifra(animo30)}/5)</small>
            </span>
          )}
        </div>
      </div>

      <div className="obj-metas-lista">
        {lista.map((o) => {
          const pct = avance(o);
          const tono = TONO[o.ritmo];
          const quedan = diasEntre(hoy, o.periodo.hasta);
          const falta = Math.abs(o.meta - o.actual);
          const euros = o.metrica === "ingresos" ? " €" : "";
          return (
            <Link key={o.id} href="/admin/objetivos" className={`obj-meta obj-meta--${tono}`}>
              <span className="obj-meta-emoji" aria-hidden="true">{METRICAS[o.metrica].emoji}</span>
              <span className="obj-meta-cuerpo">
                <span className="obj-meta-linea">
                  <span className="obj-meta-titulo">{o.titulo}</span>
                  <span className={`obj-ritmo obj-ritmo--mini ${RITMO[o.ritmo].clase}`}>
                    {RITMO[o.ritmo].emoji} {RITMO[o.ritmo].texto}
                  </span>
                </span>
                <span className="obj-barra obj-barra--fina">
                  <span className={`obj-barra-relleno obj-barra-relleno--${tono}`} style={{ width: `${pct}%`, display: "block" }} />
                </span>
                <span className="obj-meta-pie">
                  {cifra(o.actual)}{euros} de {cifra(o.meta)}{euros} · {Math.round(pct)}%
                  {o.ritmo === "cumplido"
                    ? " · 🎉 ¡conseguido!"
                    : quedan >= 0
                      ? ` · faltan ${cifra(falta)}${euros} en ${quedan} día${quedan === 1 ? "" : "s"}`
                      : ""}
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      {animo30 !== null && detras > 0 && (
        <p className="obj-metas-nota">
          💭 Tienes {detras} meta{detras === 1 ? "" : "s"} por detrás y tu ánimo medio es «{ANIMOS[Math.round(animo30) - 1]}».
          Escribirlo ayuda a separar lo que depende de ti de lo que no.
        </p>
      )}
    </section>
  );
}
