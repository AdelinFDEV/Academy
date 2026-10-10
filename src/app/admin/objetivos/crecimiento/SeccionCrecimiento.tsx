"use client";

import Link from "next/link";
import { RANGOS, type DatosCrecimiento, type Punto, type Rango, type Serie } from "@/lib/crecimiento";
import { GraficaLinea, type Tono } from "./Graficas";
import ActividadMes from "./ActividadMes";
import type { ActividadMes as DatosActividad } from "@/lib/actividadMes";
import { fechaCorta } from "../editor";
import { formatoES } from "@/lib/objetivos";

/** Cuánto ha cambiado una serie dentro del rango, y su media semanal. */
function cambio(s: Serie): { total: number; porSemana: number } | null {
  if (s.puntos.length < 2) return null;
  const primero = s.puntos[0];
  const ultimo = s.puntos[s.puntos.length - 1];
  const dias = Math.max(1, (Date.parse(`${ultimo.fecha}T00:00:00Z`) - Date.parse(`${primero.fecha}T00:00:00Z`)) / 86400000);
  const total = ultimo.valor - primero.valor;
  return { total, porSemana: (total / dias) * 7 };
}

function conSigno(n: number, decimales = 0): string {
  const t = formatoES(n, { maximumFractionDigits: decimales });
  return n > 0 ? `+${t}` : t;
}

const aPuntos = (puntos: Punto[]) => puntos.map((p) => ({ etiqueta: fechaCorta(p.fecha), valor: p.valor }));

function Tarjetas({ s, unidad, tono, emoji }: { s: Serie; unidad: string; tono: Tono; emoji: string }) {
  const c = cambio(s);
  const sube = c ? c.total > 0 : false;
  const baja = c ? c.total < 0 : false;
  return (
    <div className={`obj-tiles crec-tiles--${tono}`}>
      <div className="obj-tile obj-tile--destacado">
        <span className="obj-tile-emoji" aria-hidden="true">{emoji}</span>
        <span className="cp-card-label">{unidad} ahora</span>
        <strong className="cp-card-value">{s.ahora !== null ? formatoES(s.ahora) : "—"}</strong>
        <span className="cp-card-foot">{s.fuente ?? "sin datos todavía"}</span>
      </div>
      <div className={`obj-tile${sube ? " obj-tile--sube" : baja ? " obj-tile--baja" : ""}`}>
        <span className="obj-tile-emoji" aria-hidden="true">{sube ? "📈" : baja ? "📉" : "➖"}</span>
        <span className="cp-card-label">Cambio en el periodo</span>
        <strong className="cp-card-value">{c ? conSigno(c.total) : "—"}</strong>
        <span className="cp-card-foot">{c ? `desde ${fechaCorta(s.puntos[0].fecha)}` : "hacen falta dos días de datos"}</span>
      </div>
      <div className="obj-tile">
        <span className="obj-tile-emoji" aria-hidden="true">⚡</span>
        <span className="cp-card-label">Ritmo</span>
        <strong className="cp-card-value">{c ? conSigno(c.porSemana, 1) : "—"}</strong>
        <span className="cp-card-foot">de media por semana</span>
      </div>
    </div>
  );
}

export default function SeccionCrecimiento({ datos, rango, actividad }: {
  datos: DatosCrecimiento;
  rango: Rango;
  actividad: DatosActividad;
}) {
  // Los enlaces conservan el otro filtro: cambiar el periodo no cambia el mes, y al revés.
  const mesActual = datos.hoy.slice(0, 7);
  const href = (r: Rango, mes: string) => {
    const q = [r !== "30" ? `rango=${r}` : "", mes !== mesActual ? `mes=${mes}` : ""].filter(Boolean).join("&");
    return `/admin/objetivos/crecimiento${q ? `?${q}` : ""}`;
  };
  return (
    <>
      <div className="obj-barra-seccion">
        <div>
          <h2 className="obj-titulo-seccion">📈 Crecimiento</h2>
          <p className="obj-sub-seccion">
            Lo que publicas cada mes y cómo crecen tus canales. El dinero tiene su propia pestaña.
          </p>
        </div>
      </div>

      {/* ── Lo publicado en el mes ───────────────────────────────── */}
      <ActividadMes datos={actividad} hoy={datos.hoy} hrefMes={(m) => href(rango, m)} />

      {/* ── Los canales: lo único que cambia con el periodo ─────── */}
      <div className="obj-barra-seccion crec-canales-cabeza">
        <div>
          <h2 className="obj-titulo-seccion">📡 Tus canales</h2>
          <p className="obj-sub-seccion">Salen de la foto diaria de las 04:00 y del dato en vivo de hoy.</p>
        </div>
        <nav className="crec-rangos" aria-label="Periodo de los canales">
          {(Object.keys(RANGOS) as Rango[]).map((r) => (
            <Link
              key={r}
              href={href(r, actividad.mes)}
              className={`crec-rango${r === rango ? " crec-rango--activo" : ""}`}
              aria-current={r === rango ? "page" : undefined}
              scroll={false}
            >
              {RANGOS[r]}
            </Link>
          ))}
        </nav>
      </div>

      {/* ── Telegram ─────────────────────────────────────────────── */}
      <section className="crec-bloque crec-bloque--telegram">
      <h3 className="crec-bloque-titulo"><span aria-hidden="true">✈️</span> Telegram · canal gratuito</h3>
      <Tarjetas s={datos.telegramFree} unidad="Miembros" tono="telegram" emoji="👥" />
      <figure className="obj-grafica">
        <figcaption className="obj-grafica-titulo">Miembros del canal gratuito</figcaption>
        <GraficaLinea puntos={aPuntos(datos.telegramFree.puntos)} vacio="Aún no hay dos días de fotos del canal en este periodo." tono="telegram" />
      </figure>
      </section>

      {datos.telegramPremium && (
        <>
          <section className="crec-bloque crec-bloque--telegram">
          <h3 className="crec-bloque-titulo"><span aria-hidden="true">👑</span> Telegram · canal Premium</h3>
          <Tarjetas s={datos.telegramPremium} unidad="Miembros" tono="telegram" emoji="💎" />
          <figure className="obj-grafica">
            <figcaption className="obj-grafica-titulo">Miembros del canal Premium</figcaption>
            <GraficaLinea puntos={aPuntos(datos.telegramPremium.puntos)} vacio="Aún no hay dos días de fotos del canal en este periodo." tono="telegram" />
          </figure>
          </section>
        </>
      )}

      {/* ── YouTube ──────────────────────────────────────────────── */}
      <section className="crec-bloque crec-bloque--youtube">
      <h3 className="crec-bloque-titulo"><span aria-hidden="true">▶️</span> YouTube · suscriptores</h3>
      {!datos.youtubeConClave && (
        <p className="cp-alerta">
          Falta <code>YOUTUBE_API_KEY</code> en este entorno. En producción está en Vercel; en local, añádela a{" "}
          <code>.env.local</code> para ver la cifra en vivo.
        </p>
      )}
      <Tarjetas s={datos.youtube} unidad="Suscriptores" tono="youtube" emoji="🔔" />
      <figure className="obj-grafica">
        <figcaption className="obj-grafica-titulo">Suscriptores de YouTube</figcaption>
        <GraficaLinea
          puntos={aPuntos(datos.youtube.puntos)}
          vacio="El historial empieza con la primera foto diaria (04:00) tras desplegar: YouTube solo da la cifra del momento, así que no hay pasado que recuperar."
          tono="youtube"
        />
      </figure>
      </section>
    </>
  );
}
