"use client";

import Link from "next/link";
import { RANGOS, type DatosCrecimiento, type Punto, type Rango, type Serie } from "@/lib/crecimiento";
import { GraficaBarras, GraficaLinea, type Tono } from "./Graficas";
import { fechaCorta, nombreMes } from "../editor";

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
  const t = n.toLocaleString("es-ES", { maximumFractionDigits: decimales });
  return n > 0 ? `+${t}` : t;
}

function euros(n: number): string {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
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
        <strong className="cp-card-value">{s.ahora ?? "—"}</strong>
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

export default function SeccionCrecimiento({ datos, rango }: { datos: DatosCrecimiento; rango: Rango }) {
  const d = datos.dinero;
  const renuevan = d.activos - d.cancelan;
  return (
    <>
      <div className="obj-barra-seccion">
        <div>
          <h2 className="obj-titulo-seccion">📈 Cómo crece el proyecto</h2>
          <p className="obj-sub-seccion">
            Tus canales y lo que deja Premium. Los miembros salen de la foto diaria de las 04:00 y del dato en vivo de hoy.
          </p>
        </div>
        <nav className="crec-rangos" aria-label="Periodo">
          {(Object.keys(RANGOS) as Rango[]).map((r) => (
            <Link
              key={r}
              href={r === "90" ? "/admin/objetivos/crecimiento" : `/admin/objetivos/crecimiento?rango=${r}`}
              className={`crec-rango${r === rango ? " crec-rango--activo" : ""}`}
              aria-current={r === rango ? "page" : undefined}
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

      {/* ── Dinero ───────────────────────────────────────────────── */}
      <section className="crec-bloque crec-bloque--dinero">
      <h3 className="crec-bloque-titulo"><span aria-hidden="true">💶</span> Dinero · Premium</h3>
      <div className="obj-tiles crec-tiles--dinero">
        <div className="obj-tile obj-tile--destacado">
          <span className="obj-tile-emoji" aria-hidden="true">💰</span>
          <span className="cp-card-label">Ingreso mensual (MRR)</span>
          <strong className="cp-card-value">{euros(d.mrr)}</strong>
          <span className="cp-card-foot">
            {renuevan} suscripci{renuevan === 1 ? "ón" : "ones"} que renuevan × {euros(d.precio)}
          </span>
        </div>
        <div className="obj-tile">
          <span className="obj-tile-emoji" aria-hidden="true">👑</span>
          <span className="cp-card-label">Premium activos</span>
          <strong className="cp-card-value">{d.activos}</strong>
          <span className="cp-card-foot">{d.cancelan ? `${d.cancelan} ya han cancelado` : "ninguno ha cancelado"}</span>
        </div>
        <div className="obj-tile">
          <span className="obj-tile-emoji" aria-hidden="true">📅</span>
          <span className="cp-card-label">Ingresos en el periodo</span>
          <strong className="cp-card-value">{euros(d.ingresosRango)}</strong>
          <span className="cp-card-foot">{RANGOS[rango].toLowerCase()}</span>
        </div>
        <div className="obj-tile">
          <span className="obj-tile-emoji" aria-hidden="true">🏦</span>
          <span className="cp-card-label">Ingresos totales</span>
          <strong className="cp-card-value">{euros(d.ingresosTotales)}</strong>
          <span className="cp-card-foot">desde el primer Premium</span>
        </div>
      </div>

      <div className="obj-graficas-fila">
        <figure className="obj-grafica">
          <figcaption className="obj-grafica-titulo">Ingresos por mes</figcaption>
          <GraficaBarras
            puntos={d.porMes.map((m) => ({ etiqueta: nombreMes(m.mes, true), valor: m.valor }))}
            euros
            vacio="Todavía no hay ingresos de Premium. En cuanto entre el primero, aquí verás mes a mes lo que deja."
            tono="dinero"
          />
        </figure>
        <figure className="obj-grafica">
          <figcaption className="obj-grafica-titulo">Premium activos</figcaption>
          <GraficaLinea puntos={aPuntos(d.activosPorDia)} vacio="Todavía no hay ningún Premium de pago." tono="dinero" />
        </figure>
      </div>
      </section>

      <p className="obj-truco">
        ℹ️ Los ingresos son una <strong>estimación</strong>, la misma que la pestaña Premium: una cuota de {euros(d.precio)} al
        darse de alta y otra cada mes mientras sigue activo. No descuenta comisiones de Stripe, devoluciones ni impuestos.
        Los administradores no cuentan.
      </p>
    </>
  );
}
