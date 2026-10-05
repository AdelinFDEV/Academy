"use client";

import Link from "next/link";
import type { ActividadMes as Datos, Publicacion } from "@/lib/actividadMes";
import { mesVecino, nombreMes } from "../editor";

/**
 * «Actividad del mes»: todo lo publicado en un mes —vídeos de YouTube,
 * entradas y guías—, con su comparación con el mes anterior.
 */

function dia(instante: string): string {
  return new Date(instante).toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: "Europe/Bucharest" });
}

function duracion(segundos: number | null): string {
  if (segundos === null) return "";
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

/** «▲ 2» / «▼ 1» / «=» frente al mes anterior. */
function Variacion({ ahora, antes }: { ahora: number; antes: number }) {
  const d = ahora - antes;
  return (
    <span className={`act-var${d > 0 ? " act-var--sube" : d < 0 ? " act-var--baja" : ""}`} title="Frente al mes anterior">
      {d > 0 ? `▲ ${d}` : d < 0 ? `▼ ${Math.abs(d)}` : "="}
    </span>
  );
}

export default function ActividadMes({ datos, hoy, hrefMes }: { datos: Datos; hoy: string; hrefMes: (mes: string) => string }) {
  const { mes, anterior } = datos;
  const largos = datos.videos.filter((v) => !v.short);
  const shorts = datos.videos.filter((v) => v.short);
  const total = datos.videos.length + datos.entradas.length + datos.guias.length;
  const totalAnt = anterior.largos + anterior.shorts + anterior.entradas + anterior.guias;
  const mesActual = hoy.slice(0, 7);

  return (
    <section className="crec-bloque act">
      <div className="act-cabeza">
        <h3 className="crec-bloque-titulo"><span aria-hidden="true">📅</span> Actividad del mes</h3>
        <nav className="act-nav" aria-label="Mes">
          <Link href={hrefMes(mesVecino(mes, -1))} className="obj-flecha" aria-label="Mes anterior" scroll={false}>‹</Link>
          <strong>{nombreMes(mes)}</strong>
          {mes < mesActual ? (
            <Link href={hrefMes(mesVecino(mes, 1))} className="obj-flecha" aria-label="Mes siguiente" scroll={false}>›</Link>
          ) : (
            <span className="obj-flecha act-nav-off" aria-hidden="true">›</span>
          )}
        </nav>
      </div>

      <p className="act-resumen">
        {total
          ? <>En {nombreMes(mes, true)} publicaste <strong>{total} pieza{total === 1 ? "" : "s"}</strong>{totalAnt ? `, frente a ${totalAnt} en ${nombreMes(anterior.mes, true)}` : ""}.</>
          : <>En {nombreMes(mes, true)} aún no hay nada publicado.</>}
      </p>

      <div className="act-cifras">
        <div className="act-cifra act-cifra--youtube">
          <span className="act-cifra-emoji" aria-hidden="true">▶️</span>
          <strong>{largos.length}</strong>
          <span>vídeo{largos.length === 1 ? "" : "s"}</span>
          <Variacion ahora={largos.length} antes={anterior.largos} />
        </div>
        <div className="act-cifra act-cifra--short">
          <span className="act-cifra-emoji" aria-hidden="true">⚡</span>
          <strong>{shorts.length}</strong>
          <span>short{shorts.length === 1 ? "" : "s"}</span>
          <Variacion ahora={shorts.length} antes={anterior.shorts} />
        </div>
        <div className="act-cifra act-cifra--web">
          <span className="act-cifra-emoji" aria-hidden="true">📝</span>
          <strong>{datos.entradas.length}</strong>
          <span>entrada{datos.entradas.length === 1 ? "" : "s"}</span>
          <Variacion ahora={datos.entradas.length} antes={anterior.entradas} />
        </div>
        <div className="act-cifra act-cifra--guia">
          <span className="act-cifra-emoji" aria-hidden="true">📚</span>
          <strong>{datos.guias.length}</strong>
          <span>guía{datos.guias.length === 1 ? "" : "s"}</span>
          <Variacion ahora={datos.guias.length} antes={anterior.guias} />
        </div>
      </div>

      <div className="act-columnas">
        <div className="act-col">
          <h4>▶️ YouTube</h4>
          {datos.videos.length ? (
            <ul className="act-videos">
              {datos.videos.map((v) => (
                <li key={v.id}>
                  <a href={v.url} target="_blank" rel="noopener noreferrer" className="act-video">
                    <span className="act-video-mini">
                      {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de YouTube, sin pasar por el optimizador */}
                      <img src={v.thumbnail} alt="" loading="lazy" />
                      {v.segundos !== null && <span className="act-video-dur">{duracion(v.segundos)}</span>}
                    </span>
                    <span className="act-video-textos">
                      <span className="act-video-titulo">{v.title}</span>
                      <span className="act-meta">
                        {dia(v.publishedAt)}
                        {v.short && <span className="act-etiqueta act-etiqueta--short">⚡ Short</span>}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="act-vacio">Sin vídeos este mes.</p>
          )}
          {datos.fuenteVideos === "anuncios" && (
            <p className="act-aviso">Sin la clave de YouTube solo se ven los vídeos largos que anunció el bot, sin título.</p>
          )}
        </div>

        <div className="act-col">
          <h4>📝 Entradas de la web</h4>
          <Lista items={datos.entradas} vacio="Sin entradas este mes." />
          <h4 className="act-h4-guias">📚 Guías</h4>
          <Lista items={datos.guias} vacio="Sin guías nuevas este mes." />
        </div>
      </div>
    </section>
  );
}

function Lista({ items, vacio }: { items: Publicacion[]; vacio: string }) {
  if (!items.length) return <p className="act-vacio">{vacio}</p>;
  return (
    <ul className="act-lista">
      {items.map((p) => (
        <li key={p.enlace}>
          <a href={p.enlace} target="_blank" rel="noopener noreferrer" className="act-item">
            <span className="act-item-titulo">{p.titulo}</span>
            <span className="act-meta">
              {dia(p.fecha)}
              {p.premium ? <span className="act-etiqueta act-etiqueta--premium">👑 Premium</span> : <span className="act-etiqueta">Gratis</span>}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
