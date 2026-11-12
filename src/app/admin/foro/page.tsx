import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AccionesMensaje from "@/components/foro/admin/AccionesMensaje";
import LevantarSancion from "@/components/foro/admin/LevantarSancion";
import ModoForo from "@/components/foro/admin/ModoForo";
import { panelDeModeracion } from "@/lib/foro/datos/moderacion";
import { MOTIVOS_REPORTE, nivelDe } from "@/lib/foro/limites";
import { sesionAdmin } from "@/lib/foro/permisos";
import type { MensajeModerado } from "@/lib/foro/tipos";
import "./foro-admin.css";

export const metadata: Metadata = { title: "Foro · Moderación", robots: { index: false, follow: false } };
// Lo que se modera cambia a cada minuto: nunca desde la caché.
export const dynamic = "force-dynamic";

const NOMBRE_MOTIVO = new Map<string, string>(MOTIVOS_REPORTE.map((m) => [m.id, m.nombre]));
const NOMBRE_CLASE = { pregunta: "Pregunta", respuesta: "Respuesta", replica: "Réplica" } as const;
const NOMBRE_ACCION: Record<string, string> = {
  ocultar: "Ocultó",
  ocultar_auto: "Ocultado por reportes",
  restaurar: "Restauró",
  borrar: "Borró",
  editar: "Editó",
  cerrar: "Cerró el hilo",
  reabrir: "Reabrió el hilo",
  fijar: "Fijó el hilo",
  desfijar: "Desfijó el hilo",
  mover: "Movió de categoría",
  elegir_ganadora: "Eligió ganadora",
  cambiar_ganadora: "Cambió la ganadora",
  aceptar_reporte: "Aceptó un reporte",
  desestimar_reporte: "Desestimó reportes",
  sancionar: "Sancionó",
  levantar_sancion: "Levantó una sanción",
  cambiar_modo: "Cambió el modo",
  cambiar_normas: "Cambió las normas",
  purgar: "Purga",
  recalcular: "Recálculo",
};
const NOMBRE_SANCION: Record<string, string> = { aviso: "Aviso", suspension: "Suspensión", expulsion: "Expulsión" };

const fecha = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });
const cuando = (iso: string) => fecha.format(new Date(iso));

function Mensaje({ m, puedeModerar }: { m: MensajeModerado; puedeModerar: boolean }) {
  const estafa = m.reportes.some((r) => r.motivo === "estafa");
  return (
    <article className={`fa-mensaje${estafa ? " is-estafa" : ""}`}>
      <header className="fa-mensaje-cab">
        <span className="fa-clase">{NOMBRE_CLASE[m.clase]}</span>
        {m.estado === "oculta" && <span className="fa-chip fa-chip--oculto">Oculto</span>}
        {estafa && <span className="fa-chip fa-chip--estafa">Posible estafa</span>}
        {m.imagenes > 0 && <span className="fa-chip">{m.imagenes} {m.imagenes === 1 ? "imagen" : "imágenes"}</span>}
        <span className="fa-hilo">en «{m.hilo.titulo}»</span>
        <time className="fa-cuando" dateTime={m.fecha}>{cuando(m.fecha)}</time>
      </header>

      {/* Texto plano del usuario: React lo escapa. Nunca como HTML. */}
      <p className="fa-texto">{m.texto}</p>

      <dl className="fa-autor">
        <div><dt>Autor</dt><dd>{m.autor.alias ?? "Cuenta eliminada"}</dd></div>
        <div><dt>Nivel</dt><dd>{nivelDe(m.autor.puntos)} · {m.autor.puntos} pts</dd></div>
        <div><dt>Sanciones</dt><dd className={m.autor.sanciones ? "es-malo" : undefined}>{m.autor.sanciones}</dd></div>
        <div><dt>Retirados</dt><dd className={m.autor.retirados ? "es-malo" : undefined}>{m.autor.retirados}</dd></div>
        {m.autor.nuevo && <div><dt>Antigüedad</dt><dd className="es-malo">Menos de 7 días en el foro</dd></div>}
      </dl>

      {m.reportes.length > 0 && (
        <ul className="fa-reportes">
          {m.reportes.map((r, i) => (
            <li key={i}>
              <b>{NOMBRE_MOTIVO.get(r.motivo) ?? r.motivo}</b>
              {r.detalle && <span>{r.detalle}</span>}
              <time dateTime={r.fecha}>{cuando(r.fecha)}</time>
            </li>
          ))}
        </ul>
      )}

      <AccionesMensaje
        preguntaId={m.preguntaId}
        respuestaId={m.respuestaId}
        estado={m.estado}
        conReportes={m.reportes.length > 0}
        puedeModerar={puedeModerar}
      />
    </article>
  );
}

export default async function AdminForoPage() {
  const admin = await sesionAdmin();
  // El layout de /admin ya echa a quien no es admin; esto es la segunda barrera.
  if (!admin.ok && admin.error !== "falta_2fa_admin") notFound();
  const puedeModerar = admin.ok;

  const panel = await panelDeModeracion();

  return (
    <div className="admin-page fa">
      <div className="admin-page-header">
        <div>
          <h1>Foro</h1>
          <p className="admin-page-subtitle">
            {panel.cifras.preguntas} preguntas · {panel.cifras.respuestas} respuestas · {panel.cifras.participantes} participantes
          </p>
        </div>
      </div>

      {!puedeModerar && (
        <p className="fa-aviso" role="status">
          Puedes ver el panel, pero para moderar tienes que tener activada la verificación en dos pasos y haberla
          pasado en esta sesión. Actívala en «Mi perfil» y vuelve a iniciar sesión.
        </p>
      )}

      <section className="admin-card fa-seccion">
        <h2 className="fa-titulo">Modo del foro</h2>
        <ModoForo modo={panel.modo} puedeModerar={puedeModerar} />
      </section>

      <section className="fa-seccion">
        <h2 className="fa-titulo">
          Reportes abiertos <span className="fa-cuenta">{panel.cola.length}</span>
        </h2>
        {panel.cola.length === 0 ? (
          <p className="fa-vacio">No hay nada reportado.</p>
        ) : (
          panel.cola.map((m) => <Mensaje key={m.clave} m={m} puedeModerar={puedeModerar} />)
        )}
      </section>

      {panel.ocultos.length > 0 && (
        <section className="fa-seccion">
          <h2 className="fa-titulo">
            Ocultos por moderación <span className="fa-cuenta">{panel.ocultos.length}</span>
          </h2>
          {panel.ocultos.map((m) => <Mensaje key={m.clave} m={m} puedeModerar={puedeModerar} />)}
        </section>
      )}

      {panel.alertas.length > 0 && (
        <section className="admin-card fa-seccion">
          <h2 className="fa-titulo">Votos cruzados en los últimos 7 días</h2>
          <p className="fa-nota">Muchos votos de una misma persona a otra. No es una falta por sí solo: es para mirarlo.</p>
          <ul className="fa-lista">
            {panel.alertas.map((a, i) => (
              <li key={i}><b>{a.de}</b> ha votado <b>{a.votos}</b> veces a <b>{a.a}</b></li>
            ))}
          </ul>
        </section>
      )}

      <section className="admin-card fa-seccion">
        <h2 className="fa-titulo">Sanciones en vigor</h2>
        {panel.sanciones.length === 0 ? (
          <p className="fa-vacio">Ninguna.</p>
        ) : (
          <ul className="fa-lista fa-lista--filas">
            {panel.sanciones.map((s) => (
              <li key={s.id}>
                <span>
                  <b>{s.alias ?? "Cuenta eliminada"}</b> · {NOMBRE_SANCION[s.tipo] ?? s.tipo}
                  {s.hasta && <> hasta el {cuando(s.hasta)}</>}
                  <small>{s.motivo}</small>
                </span>
                {puedeModerar && s.tipo !== "aviso" && <LevantarSancion sancionId={s.id} />}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-card fa-seccion">
        <h2 className="fa-titulo">Registro</h2>
        <p className="fa-nota">Las últimas acciones. No se puede editar ni borrar.</p>
        {panel.registro.length === 0 ? (
          <p className="fa-vacio">Todavía no hay nada.</p>
        ) : (
          <ol className="fa-registro">
            {panel.registro.map((e) => (
              <li key={e.id}>
                <time dateTime={e.fecha}>{cuando(e.fecha)}</time>
                <span>
                  <b>{e.actor}</b> · {NOMBRE_ACCION[e.accion] ?? e.accion}
                  {e.sobre && <> · a {e.sobre}</>}
                  {e.hilo && <> · «{e.hilo.titulo}»</>}
                  {e.motivo && <small>{e.motivo}</small>}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
