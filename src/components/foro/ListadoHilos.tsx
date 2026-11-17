import Link from "next/link";
import { ArrowRight, Check, MessageCircle, PenLine, Pin, Trophy, Users } from "lucide-react";
import AvatarUsuario from "@/components/AvatarUsuario";
import Anotacion from "@/components/cuaderno/Anotacion";
import Tecla from "@/components/cuaderno/Tecla";
import Firma from "@/components/foro/Firma";
import MarcoForo from "@/components/foro/MarcoForo";
import { aspectoDe, colorDe } from "@/components/foro/categorias";
import type { FilaRanking, ListadoForo } from "@/lib/foro/tipos";
import "@/app/foro/listado.css";

/**
 * El listado de preguntas: la portada del foro (`/foro`) y la de cada
 * categoría (`/foro/<categoria>`). Es la misma pantalla con otro filtro.
 *
 * Estilo «Cuaderno de estudio» (17-11-2026), en coral:
 *   · la cabecera, con el titular, las teclas de lo que se puede hacer y las
 *     cifras del foro en una ficha con su pegatina;
 *   · las categorías, una tecla por cada una con su color;
 *   · las preguntas como tarjetas de papel con la pestaña del color de su
 *     categoría, y a la derecha quién ayuda más este mes (con pegatinas) y un
 *     pósit con cómo funciona.
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

  return (
    <MarcoForo conSesion={conSesion} tono={cat ? colorDe(cat.slug) : undefined}>
      {/* ── Cabecera ── */}
      <header className="fl-cabecera">
        <div className="fl-cabecera-texto">
          <p className="fo-nota">
            {cat ? <><Link href="/foro">Foro</Link> · {cat.nombre}</> : "Foro de la comunidad"}
          </p>

          {cat ? (
            <h1 className="fo-titulo">{cat.nombre}</h1>
          ) : (
            <h1 className="fo-titulo">
              Las dudas de cripto,{" "}
              <Anotacion tipo="circle" color="var(--coral)" retraso={300}>resueltas</Anotacion>{" "}
              entre todos.
            </h1>
          )}

          <p className="fo-entradilla">
            {cat
              ? cat.descripcion
              : "Pregunta lo que no entiendes y ayuda con lo que sabes. Leer es libre; participar es parte de Premium."}
          </p>

          <div className="fl-acciones">
            <Tecla href="/foro/preguntar" color="coral" tamano="grande">
              <PenLine size={19} strokeWidth={2.6} aria-hidden="true" />
              Hacer una pregunta
            </Tecla>
            <Tecla href="/foro/ranking" color="blanca">
              <Trophy size={17} strokeWidth={2.5} aria-hidden="true" />
              Ranking
            </Tecla>
            {conSesion && <Tecla href="/foro/mio" color="blanca">Lo mío</Tecla>}
          </div>
        </div>

        {/* Las cifras del foro entero, en una ficha con su pegatina. */}
        <div className="fl-ficha">
          <span className="fl-ficha-pegatina" aria-hidden="true">?</span>
          {/* Las cifras son siempre las del foro entero: dentro de una
              categoría se dice, para que no se lean como suyas. */}
          {cat && <p className="fl-ficha-nota">en todo el foro</p>}
          <dl className="fl-cifras">
            <div>
              <dt>Preguntas</dt>
              <dd>{datos.cifras.preguntas}</dd>
            </div>
            <div>
              <dt>Respuestas</dt>
              <dd>{datos.cifras.respuestas}</dd>
            </div>
            <div className="es-resueltas">
              <dt>Resueltas</dt>
              <dd>{datos.cifras.resueltas}</dd>
            </div>
          </dl>
        </div>
      </header>

      {aviso && <p className="fo-aviso" role="status">{aviso}</p>}

      {/* ── Categorías: una tecla por cada una ── */}
      <nav className="fl-categorias" aria-label="Categorías del foro">
        <Tecla
          href="/foro"
          color="blanca"
          tamano="peq"
          className={`fl-categoria${cat ? "" : " is-activa"}`}
          aria-current={cat ? undefined : "page"}
        >
          <span className="fl-categoria-icono" aria-hidden="true"><MessageCircle size={15} strokeWidth={2.5} /></span>
          Todas
          <span className="fl-categoria-cuenta">{datos.cifras.preguntas}</span>
        </Tecla>
        {datos.categorias.map((c) => {
          const { Icono } = aspectoDe(c.slug);
          const activa = cat?.slug === c.slug;
          return (
            <Tecla
              key={c.slug}
              href={`/foro/${c.slug}`}
              color="blanca"
              tamano="peq"
              className={`fl-categoria${activa ? " is-activa" : ""}`}
              style={colorDe(c.slug)}
              aria-current={activa ? "page" : undefined}
            >
              <span className="fl-categoria-icono" aria-hidden="true"><Icono size={15} strokeWidth={2.5} /></span>
              {c.nombre}
              <span className="fl-categoria-cuenta">{c.hilos}</span>
            </Tecla>
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
                    <article className={`fl-hilo is-${estado}`}>
                      {/* La cifra que se mira primero: cuántas respuestas tiene. */}
                      <div className="fl-marcador" aria-hidden="true">
                        {h.resuelto ? <Check size={22} strokeWidth={3.4} /> : <b>{h.respuestas}</b>}
                        <span>{h.resuelto ? "resuelta" : h.respuestas === 1 ? "respuesta" : "respuestas"}</span>
                      </div>

                      <div className="fl-contenido">
                        <div className="fl-etiquetas">
                          <Link href={`/foro/${h.categoria.slug}`} className="fo-cat">
                            <Icono size={13} strokeWidth={2.6} aria-hidden="true" />
                            {h.categoria.nombre}
                          </Link>
                          {h.fijado && (
                            <span className="fo-sello"><Pin size={12} strokeWidth={2.8} aria-hidden="true" /> Fijada</span>
                          )}
                          {h.resuelto && (
                            <span className="fo-sello fo-sello--resuelto">
                              <Check size={12} strokeWidth={3.4} aria-hidden="true" />
                              {h.respuestas} {h.respuestas === 1 ? "respuesta" : "respuestas"}
                            </span>
                          )}
                        </div>

                        {/* El enlace del título cubre la tarjeta entera (`::after`). */}
                        <h3 className="fl-titulo">
                          <Link href={`/foro/${h.id}-${h.slug}`}>
                            {h.titulo}
                            {/* El marcador de la izquierda es solo visual: su dato, para el lector de pantalla. */}
                            <span className="sr-only">
                              {" "}({h.resuelto ? "resuelta, " : ""}{h.respuestas} {h.respuestas === 1 ? "respuesta" : "respuestas"})
                            </span>
                          </Link>
                        </h3>
                        {h.extracto && <p className="fl-extracto">{h.extracto}</p>}

                        <div className="fl-pie">
                          <Firma autor={h.autor} fecha={h.fecha} compacta />
                          {h.yoTambien > 0 && (
                            <span className="fl-misma-duda">
                              <Users size={14} strokeWidth={2.5} aria-hidden="true" />
                              {h.yoTambien} con la misma duda
                            </span>
                          )}
                        </div>
                      </div>

                      <ArrowRight className="fl-flecha" size={20} strokeWidth={2.6} aria-hidden="true" />
                    </article>
                  </li>
                );
              })}
            </ol>
          )}

          {datos.paginas > 1 && (
            <nav className="fo-paginas" aria-label="Páginas">
              {datos.pagina > 1 ? (
                <Tecla href={pagina(datos.pagina - 1)} rel="prev" color="blanca" tamano="peq">Anteriores</Tecla>
              ) : (
                <span aria-hidden="true" />
              )}
              <span>página {datos.pagina} de {datos.paginas}</span>
              {datos.pagina < datos.paginas ? (
                <Tecla href={pagina(datos.pagina + 1)} rel="next" color="blanca" tamano="peq">Siguientes</Tecla>
              ) : (
                <span aria-hidden="true" />
              )}
            </nav>
          )}
        </section>

        {/* ── La columna lateral ── */}
        <aside className="fl-lateral">
          <section className="fl-caja fo-tarjeta" aria-labelledby="fl-top">
            <h2 id="fl-top" className="fl-caja-titulo">
              <span className="fl-caja-icono" aria-hidden="true"><Trophy size={16} strokeWidth={2.5} /></span>
              Quién ayuda más este mes
            </h2>
            {destacados.length === 0 ? (
              <p className="fl-caja-vacia">El mes acaba de empezar. Responde y aparece aquí.</p>
            ) : (
              <ol className="fl-top">
                {destacados.map((f) => (
                  <li key={f.posicion}>
                    <span className={`fl-top-puesto fl-top-puesto--${f.posicion}`}>{f.posicion}</span>
                    <AvatarUsuario avatar={f.avatar} inicial={f.alias.slice(0, 1).toUpperCase()} className="fl-top-foto" />
                    <span className="fl-top-quien">
                      <b>{f.alias}</b>
                      <small>{f.nivel}</small>
                    </span>
                    <span className="fl-top-puntos">{f.cifra}<small> pts</small></span>
                  </li>
                ))}
              </ol>
            )}
            <Tecla href="/foro/ranking" color="blanca" tamano="peq" ancho>
              Ver el ranking <ArrowRight size={15} strokeWidth={2.8} aria-hidden="true" />
            </Tecla>
          </section>

          {/* Cómo funciona: un pósit pegado en la mesa. */}
          <section className="fl-postit" aria-labelledby="fl-como">
            <h2 id="fl-como" className="fl-postit-titulo">Cómo funciona</h2>
            <ol className="fl-pasos">
              <li><b>Pregunta</b> con contexto: qué has hecho y qué esperabas.</li>
              <li><b>Responde</b> lo que sepas. Las mejores respuestas suben.</li>
              <li><b>Elige</b> la que te ha servido: el hilo queda resuelto.</li>
            </ol>
            <Link href="/foro/normas" className="fl-postit-enlace">
              Normas del foro <ArrowRight size={14} strokeWidth={2.6} aria-hidden="true" />
            </Link>
          </section>
        </aside>
      </div>
    </MarcoForo>
  );
}
