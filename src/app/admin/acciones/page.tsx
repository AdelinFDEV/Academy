import Link from "next/link";
import Icon from "@/components/Icon";
import { cargarAcciones, faltaAlCurso, type CursoAccion, type GuiaAccion } from "@/lib/acciones";
import BotonPublicar from "./BotonPublicar";
import "./acciones.css";

/**
 * /admin/acciones · Lo que está construido y espera a que el admin lo publique.
 *
 * Aquí llegan las guías y los cursos ya terminados y con su SEO hecho. Nadie
 * más que el admin los ve hasta que pulsa «Publicar». El foro va aparte, en su
 * propia sección.
 */
export const dynamic = "force-dynamic";

const ZONA = "Europe/Bucharest";

function fecha(iso: string | null) {
  if (!iso) return "—";
  const t = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00Z` : iso;
  return new Date(t).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: ZONA });
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="ac-dato">
      <dt>{etiqueta}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function TarjetaGuia({ g }: { g: GuiaAccion }) {
  const publicada = Boolean(g.publicada);
  return (
    <article className="ac-tarjeta">
      <div className="ac-tarjeta-cuerpo">
        <div className="ac-cabecera">
          <span className="ac-tipo ac-tipo--guia"><Icon name="book" size={13} /> Guía</span>
          {g.auditada
            ? <span className="ac-sello ac-sello--bien">SEO auditado el {fecha(g.auditada)}</span>
            : <span className="ac-sello ac-sello--ojo">Sin auditoría SEO</span>}
        </div>
        <h3>{g.title}</h3>
        <p className="ac-descripcion">{g.description}</p>
        <dl className="ac-datos">
          <Dato etiqueta="Búsqueda a la que responde">{g.consulta}</Dato>
          <Dato etiqueta="Dirección"><code>/guias/{g.slug}</code></Dato>
          <Dato etiqueta="Lectura">{g.readTime} · {g.difficulty}</Dato>
          <Dato etiqueta={publicada ? "Publicada" : "Lista desde"}>{fecha(g.publicada ?? g.lista)}</Dato>
        </dl>
      </div>
      <div className="ac-tarjeta-acciones">
        <Link href={`/guias/${g.slug}`} className="ac-enlace" target="_blank">{publicada ? "Ver la guía" : "Ver el borrador"}</Link>
        <BotonPublicar tipo="guia" slug={g.slug} publicar={!publicada} />
      </div>
    </article>
  );
}

function TarjetaCurso({ c }: { c: CursoAccion }) {
  const falta = faltaAlCurso(c);
  return (
    <article className="ac-tarjeta">
      <div className="ac-tarjeta-cuerpo">
        <div className="ac-cabecera">
          <span className="ac-tipo ac-tipo--curso"><Icon name="star" size={13} /> Curso</span>
          {!c.published && (falta
            ? <span className="ac-sello ac-sello--ojo">{falta}</span>
            : <span className="ac-sello ac-sello--bien">Completo</span>)}
        </div>
        <h3>{c.titulo}</h3>
        {c.descripcion && <p className="ac-descripcion">{c.descripcion}</p>}
        <dl className="ac-datos">
          <Dato etiqueta="Contenido">{c.modulos} módulos · {c.lecciones} lecciones · {c.preguntas} preguntas</Dato>
          <Dato etiqueta="Dirección"><code>/cursos/{c.slug}</code></Dato>
          <Dato etiqueta="Último cambio">{fecha(c.updated_at)}</Dato>
        </dl>
      </div>
      <div className="ac-tarjeta-acciones">
        <Link href={`/cursos/${c.slug}`} className="ac-enlace" target="_blank">{c.published ? "Ver el curso" : "Ver el borrador"}</Link>
        {(c.published || !falta) && <BotonPublicar tipo="curso" slug={c.slug} publicar={!c.published} />}
      </div>
    </article>
  );
}

export default async function AccionesPage() {
  const { guias, cursos, faltaSql } = await cargarAcciones();

  const guiasListas = guias.filter((g) => !g.publicada);
  const guiasPublicadas = guias.filter((g) => g.publicada);
  const cursosListos = cursos.filter((c) => !c.published && !faltaAlCurso(c));
  const cursosEnObras = cursos.filter((c) => !c.published && faltaAlCurso(c));
  const cursosPublicados = cursos.filter((c) => c.published);
  const listos = guiasListas.length + cursosListos.length;

  return (
    <div className="admin-page ac">
      <header className="admin-page-header">
        <div>
          <h1>Acciones</h1>
          <p className="admin-page-subtitle">
            Lo que ya está construido y con su SEO hecho, a falta de que tú lo publiques. Hasta que pulses «Publicar», solo lo ves tú.
          </p>
        </div>
        <div className="ac-contador">
          <strong>{listos}</strong>
          <span>{listos === 1 ? "pendiente de publicar" : "pendientes de publicar"}</span>
        </div>
      </header>

      {faltaSql && (
        <p className="ac-aviso">
          Falta ejecutar <code>scripts/create-acciones.sql</code> en Supabase: sin él, esta página no puede leer ni guardar nada.
        </p>
      )}

      <section className="ac-seccion">
        <h2><span className="ac-punto ac-punto--listo" /> Listo para publicar <small>{listos}</small></h2>
        {listos === 0 ? (
          <p className="ac-vacio">
            No hay nada esperando. Cuando una guía o un curso estén terminados y auditados, aparecerán aquí con su botón de publicar.
          </p>
        ) : (
          <div className="ac-lista">
            {guiasListas.map((g) => <TarjetaGuia key={g.slug} g={g} />)}
            {cursosListos.map((c) => <TarjetaCurso key={c.slug} c={c} />)}
          </div>
        )}
      </section>

      {cursosEnObras.length > 0 && (
        <section className="ac-seccion">
          <h2><span className="ac-punto ac-punto--obras" /> En construcción <small>{cursosEnObras.length}</small></h2>
          <p className="ac-nota">Todavía no se pueden publicar: les falta contenido.</p>
          <div className="ac-lista">
            {cursosEnObras.map((c) => <TarjetaCurso key={c.slug} c={c} />)}
          </div>
        </section>
      )}

      <section className="ac-seccion">
        <h2><span className="ac-punto ac-punto--publicado" /> Publicado <small>{guiasPublicadas.length + cursosPublicados.length}</small></h2>
        <p className="ac-nota">
          Los cursos publicados y las guías que has publicado desde aquí, por si hay que retirar algo. Las guías antiguas no salen: están publicadas en el propio código.
        </p>
        {guiasPublicadas.length + cursosPublicados.length === 0 ? (
          <p className="ac-vacio">Todavía no hay nada publicado.</p>
        ) : (
          <div className="ac-lista">
            {guiasPublicadas.map((g) => <TarjetaGuia key={g.slug} g={g} />)}
            {cursosPublicados.map((c) => <TarjetaCurso key={c.slug} c={c} />)}
          </div>
        )}
      </section>
    </div>
  );
}
