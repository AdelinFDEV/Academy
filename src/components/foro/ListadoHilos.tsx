import Link from "next/link";
import { ArrowRight, Check, MessageCircle, PenLine, Pin, Trophy, Users } from "lucide-react";
import AvatarUsuario from "@/components/AvatarUsuario";
import Firma from "@/components/foro/Firma";
import MarcoForo from "@/components/foro/MarcoForo";
import { aspectoDe, colorDe } from "@/components/foro/categorias";
import type { FilaRanking, ListadoForo } from "@/lib/foro/tipos";
import "@/app/foro/listado.css";

/**
 * El listado de preguntas: la portada del foro (`/foro`) y la de cada
 * categoría (`/foro/<categoria>`). Es la misma pantalla con otro filtro.
 *
 * Tres zonas (rediseño del 12-11-2026):
 *   · la cabecera, con el titular, lo que se puede hacer y las cifras del foro;
 *   · las categorías, cada una con su color y su icono;
 *   · las preguntas a la izquierda y, a la derecha, quién ayuda más este mes
 *     y cómo funciona el foro.
 *
 * Es igual para todo el mundo: aquí no hay nada que dependa de quién mira,
 * salvo la barra de arriba y el enlace a «lo mío».
 */
export default function ListadoHilos({
  datos,
  conSesion,
  aviso,
  destacados,
}: {
  datos: ListadoForo;
  conSesion: boolean;
  /** El foro no está abierto del todo: se dice arriba (solo lo ve el admin o en solo lectura). */
  aviso: string | null;
  /** Los tres con más puntos este mes. */
  destacados: FilaRanking[];
}) {
  const cat = datos.categoria;
  const base = cat ? `/foro/${cat.slug}` : "/foro";
  const pagina = (n: number) => (n <= 1 ? base : `${base}?pagina=${n}`);
  const acento = cat ? aspectoDe(cat.slug).color : undefined;

  return (
    <MarcoForo conSesion={conSesion} acento={acento}>
      {/* ── Cabecera ── */}
      <header className="fl-cabecera">
        <div className="fl-cabecera-texto">
          <span className="fo-antetitulo">
            <span className="fo-antetitulo-punto" aria-hidden="true" />
            {cat ? <Link href="/foro">Foro</Link> : "Comunidad"}
            <span aria-hidden="true">/</span>
            {cat ? cat.nombre : "Preguntas y respuestas"}
          </span>

          {cat ? (
            <h1 className="fo-titulo">{cat.nombre}</h1>
          ) : (
            <h1 className="fo-titulo">
              Las dudas de cripto, <em>resueltas</em> entre todos.
            </h1>
          )}

          <p className="fo-entradilla">
            {cat
              ? cat.descripcion
              : "Pregunta lo que no entiendes y ayuda con lo que sabes. Leer es libre; participar es parte de Premium."}
          </p>

          <div className="fl-acciones">
            <Link href="/foro/preguntar" className="fp-btn fp-btn--firme fp-btn--grande">
              <PenLine size={17} strokeWidth={2.4} aria-hidden="true" />
              Hacer una pregunta
            </Link>
            <Link href="/foro/ranking" className="fp-btn fp-btn--grande">Ranking</Link>
            {conSesion && <Link href="/foro/mio" className="fp-btn fp-btn--grande">Lo mío</Link>}
          </div>
        </div>

        {/* Las cifras del foro entero, sobre un signo de interrogación enorme. */}
        <dl className="fl-cifras fo-tarjeta">
          <span className="fl-cifras-marca" aria-hidden="true">?</span>
          <div>
            <dt>Preguntas</dt>
            <dd>{datos.cifras.preguntas}</dd>
          </div>
          <div>
            <dt>Respuestas</dt>
            <dd>{datos.cifras.respuestas}</dd>
          </div>
          <div className="es-verde">
            <dt>Resueltas</dt>
            <dd>{datos.cifras.resueltas}</dd>
          </div>
        </dl>
      </header>

      {aviso && <p className="fo-aviso" role="status">{aviso}</p>}

      {/* ── Categorías ── */}
      <nav className="fl-categorias" aria-label="Categorías del foro">
        <Link href="/foro" className={`fl-categoria fl-categoria--todas${cat ? "" : " is-activa"}`} aria-current={cat ? undefined : "page"}>
          <span className="fl-categoria-icono" aria-hidden="true"><MessageCircle size={17} strokeWidth={2.2} /></span>
          <span className="fl-categoria-nombre">Todas</span>
          <span className="fl-categoria-cuenta">{datos.cifras.preguntas}</span>
        </Link>
        {datos.categorias.map((c) => {
          const { Icono } = aspectoDe(c.slug);
          const activa = cat?.slug === c.slug;
          return (
            <Link
              key={c.slug}
              href={`/foro/${c.slug}`}
              className={`fl-categoria${activa ? " is-activa" : ""}`}
              style={colorDe(c.slug)}
              aria-current={activa ? "page" : undefined}
            >
              <span className="fl-categoria-icono" aria-hidden="true"><Icono size={17} strokeWidth={2.2} /></span>
              <span className="fl-categoria-nombre">{c.nombre}</span>
              <span className="fl-categoria-cuenta">{c.hilos}</span>
            </Link>
          );
        })}
      </nav>

      <div className="fl-cuerpo">
        {/* ── Las preguntas ── */}
        <section aria-labelledby="fl-preguntas">
          <div className="fo-seccion-cab">
            <h2 id="fl-preguntas" className="fo-seccion-titulo">{cat ? `Preguntas de ${cat.nombre}` : "Últimas preguntas"}</h2>
            <span className="fo-seccion-nota">
              {datos.total === 0 ? "Ninguna todavía" : `${datos.total} ${datos.total === 1 ? "pregunta" : "preguntas"}`}
            </span>
          </div>

          {datos.hilos.length === 0 ? (
            <div className="fo-vacio">
              <b>{cat ? "Todavía no hay preguntas aquí" : "El foro está por estrenar"}</b>
              <p>Sé la primera persona en preguntar.</p>
            </div>
          ) : (
            <ol className="fl-lista">
              {datos.hilos.map((h) => {
                const { Icono } = aspectoDe(h.categoria.slug);
                const estado = h.resuelto ? "resuelto" : h.respuestas > 0 ? "con" : "sin";
                return (
                  <li key={h.id} style={colorDe(h.categoria.slug)}>
                    <article className={`fl-hilo fo-tarjeta is-${estado}`}>
                      {/* La cifra que se mira primero: cuántas respuestas tiene. */}
                      <div className="fl-marcador" aria-hidden="true">
                        {h.resuelto ? <Check size={20} strokeWidth={3} /> : <b>{h.respuestas}</b>}
                        <span>{h.resuelto ? "resuelta" : h.respuestas === 1 ? "respuesta" : "respuestas"}</span>
                      </div>

                      <div className="fl-contenido">
                        <div className="fl-etiquetas">
                          <Link href={`/foro/${h.categoria.slug}`} className="fo-cat">
                            <Icono size={12} strokeWidth={2.4} aria-hidden="true" />
                            {h.categoria.nombre}
                          </Link>
                          {h.fijado && (
                            <span className="fo-sello"><Pin size={10} strokeWidth={2.6} aria-hidden="true" /> Fijada</span>
                          )}
                          {h.resuelto && (
                            <span className="fo-sello fo-sello--resuelto">
                              {h.respuestas} {h.respuestas === 1 ? "respuesta" : "respuestas"}
                            </span>
                          )}
                        </div>

                        <h3 className="fl-titulo">
                          <Link href={`/foro/${h.id}-${h.slug}`}>{h.titulo}</Link>
                        </h3>
                        {h.extracto && <p className="fl-extracto">{h.extracto}</p>}

                        <div className="fl-pie">
                          <Firma autor={h.autor} fecha={h.fecha} compacta />
                          {h.yoTambien > 0 && (
                            <span className="fl-misma-duda">
                              <Users size={13} strokeWidth={2.2} aria-hidden="true" />
                              {h.yoTambien} con la misma duda
                            </span>
                          )}
                        </div>
                      </div>

                      <ArrowRight className="fl-flecha" size={18} strokeWidth={2.2} aria-hidden="true" />
                    </article>
                  </li>
                );
              })}
            </ol>
          )}

          {datos.paginas > 1 && (
            <nav className="fo-paginas" aria-label="Páginas">
              {datos.pagina > 1 ? <Link href={pagina(datos.pagina - 1)} rel="prev" className="fp-btn">Anteriores</Link> : <span aria-hidden="true" />}
              <span>Página {datos.pagina} de {datos.paginas}</span>
              {datos.pagina < datos.paginas ? <Link href={pagina(datos.pagina + 1)} rel="next" className="fp-btn">Siguientes</Link> : <span aria-hidden="true" />}
            </nav>
          )}
        </section>

        {/* ── La columna lateral ── */}
        <aside className="fl-lateral">
          <section className="fl-caja fo-tarjeta" aria-labelledby="fl-top">
            <h2 id="fl-top" className="fl-caja-titulo">
              <Trophy size={15} strokeWidth={2.3} aria-hidden="true" />
              Quién ayuda más este mes
            </h2>
            {destacados.length === 0 ? (
              <p className="fl-caja-vacia">El mes acaba de empezar. Responde y aparece aquí.</p>
            ) : (
              <ol className="fl-top">
                {destacados.map((f) => (
                  <li key={f.posicion}>
                    <span className="fl-top-puesto">{f.posicion}</span>
                    <AvatarUsuario avatar={f.avatar} inicial={f.alias.slice(0, 1).toUpperCase()} className="fl-top-foto" />
                    <span className="fl-top-quien">
                      <b>{f.alias}</b>
                      <small>{f.nivel}</small>
                    </span>
                    <span className="fl-top-puntos">{f.cifra}</span>
                  </li>
                ))}
              </ol>
            )}
            <Link href="/foro/ranking" className="fl-caja-enlace">
              Ver el ranking <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
            </Link>
          </section>

          <section className="fl-caja fo-tarjeta" aria-labelledby="fl-como">
            <h2 id="fl-como" className="fl-caja-titulo">Cómo funciona</h2>
            <ol className="fl-pasos">
              <li><b>Pregunta</b> con contexto: qué has hecho y qué esperabas.</li>
              <li><b>Responde</b> lo que sepas. Las mejores respuestas suben.</li>
              <li><b>Elige</b> la que te ha servido: el hilo queda resuelto.</li>
            </ol>
            <Link href="/foro/normas" className="fl-caja-enlace">
              Normas del foro <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
            </Link>
          </section>
        </aside>
      </div>
    </MarcoForo>
  );
}
