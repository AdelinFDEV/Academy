import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, MessageCircle, PenLine, Trophy, Users } from "lucide-react";
import AvatarUsuario from "@/components/AvatarUsuario";
import Tecla from "@/components/cuaderno/Tecla";
import MarcoForo from "@/components/foro/MarcoForo";
import PuntoNovedades from "@/components/foro/PuntoNovedades";
import TarjetaHilo from "@/components/foro/TarjetaHilo";
import BuscadorForo from "@/components/foro/BuscadorForo";
import CategoriasMovil from "@/components/foro/CategoriasMovil";
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
      {/* ── Cabecera (23-11-2026, rehecha de cero: pedido por el admin) ──
          Una hoja entera en el pastel de la categoría (coral en la portada del
          foro), con los puntos de la libreta. A la izquierda, la nota a mano,
          el titular, la entradilla y las teclas; a la derecha, la escena: la
          pegatina de las burbujas que charlan, la del «?» pensativo y unos
          bocadillos que flotan. Abajo, dentro de la misma hoja, las cifras
          del foro en tres fichas y las categorías en una tira de teclas. */}
      <header className="flc">
        <div className="flc-texto">
          <p className="fo-nota flc-nota">
            {cat ? <><Link href="/foro">Foro</Link> · {cat.nombre}</> : "Foro de la comunidad"}
          </p>

          {cat ? (
            <h1 className="flc-titulo">{cat.nombre}</h1>
          ) : (
            <h1 className="flc-titulo">
              Las dudas de cripto, <span className="flc-fluor">resueltas entre todos</span>.
            </h1>
          )}

          <p className="flc-entradilla">
            {cat
              ? cat.descripcion
              : "Pregunta lo que no entiendes y ayuda con lo que sabes. Leer es libre; participar es parte de Premium."}
          </p>

          {/* Las acciones (23-11-2026, pedido por el admin): «Hacer una pregunta»
              grande y protagonista, y debajo, juntas y cada una en su color,
              «Ranking» (amarillo, el de los logros) y «Lo mío» (lila). */}
          <div className="flc-acciones">
            <Tecla href="/foro/preguntar" color="coral" tamano="grande" className="flc-preguntar">
              <span className="flc-preguntar-icono" aria-hidden="true"><PenLine size={22} strokeWidth={2.6} /></span>
              <span className="flc-preguntar-texto">
                Hacer una pregunta
                <small>la comunidad te responde</small>
              </span>
              <ArrowRight className="flc-preguntar-flecha" size={22} strokeWidth={2.8} aria-hidden="true" />
            </Tecla>
            <div className={`flc-acciones-fila${conSesion ? "" : " is-sola"}`}>
              <Tecla href="/foro/ranking" color="amarillo">
                <Trophy size={17} strokeWidth={2.5} aria-hidden="true" />
                Ranking
              </Tecla>
              {conSesion && (
                <Tecla href="/foro/mio" color="lila">
                  <Users size={17} strokeWidth={2.5} aria-hidden="true" />
                  Lo mío
                  {/* El punto rojo con sus novedades: lo pide el navegador aparte. */}
                  <PuntoNovedades />
                </Tecla>
              )}
            </div>
          </div>
        </div>

        {/* La escena: decoración pura. Va en un lienzo de proporción fija y
            todo se coloca en % de él, así que personajes y bocadillos guardan
            siempre su sitio en cualquier pantalla (23-11-2026). Cada bocadillo
            sale de su personaje, con el pico apuntándole. */}
        <div className="flc-escena" aria-hidden="true">
          <div className="flc-lienzo">
            <Image src="/cuaderno/burbujas-pegatina.webp" alt="" width={360} height={339} className="flc-burbujas" draggable={false} />
            <Image src="/cuaderno/pregunta-pegatina.webp" alt="" width={225} height={300} className="flc-pregunta" draggable={false} />
            <span className="flc-bocadillo flc-bocadillo--escribe"><MessageCircle strokeWidth={2.6} /> <i /><i /><i /></span>
            <span className="flc-bocadillo flc-bocadillo--duda">¿y esto?</span>
            <span className="flc-bocadillo flc-bocadillo--resuelta"><Check strokeWidth={3} /> resuelta</span>
          </div>
        </div>

        {/* Las cifras del foro entero. */}
        <div className="flc-pie">
          {/* El buscador (23-11-2026): antes de preguntar, mira si ya está respondido. */}
          <BuscadorForo />
          <dl className="flc-cifras">
            <div className="flc-cifra">
              <span className="flc-cifra-icono" aria-hidden="true"><MessageCircle size={18} strokeWidth={2.6} /></span>
              <dd>{datos.cifras.preguntas}</dd>
              <dt>{datos.cifras.preguntas === 1 ? "pregunta" : "preguntas"}</dt>
            </div>
            <div className="flc-cifra">
              <span className="flc-cifra-icono" aria-hidden="true"><Users size={18} strokeWidth={2.6} /></span>
              <dd>{datos.cifras.respuestas}</dd>
              <dt>{datos.cifras.respuestas === 1 ? "respuesta" : "respuestas"}</dt>
            </div>
            <div className="flc-cifra es-resueltas">
              <span className="flc-cifra-icono" aria-hidden="true"><Check size={18} strokeWidth={3} /></span>
              <dd>{datos.cifras.resueltas}</dd>
              <dt>{datos.cifras.resueltas === 1 ? "resuelta" : "resueltas"}</dt>
            </div>
          </dl>
        </div>

        {/* ── En el móvil, las categorías en una ventana (CategoriasMovil) ── */}
        <div className="flc-cat-movil-caja">
          <CategoriasMovil
            categorias={[
              {
                slug: null,
                nombre: "Todas",
                hilos: datos.cifras.preguntas,
                activa: !cat,
                icono: <MessageCircle size={16} strokeWidth={2.5} />,
              },
              ...datos.categorias.map((c) => {
                const { Icono } = aspectoDe(c.slug);
                return {
                  slug: c.slug,
                  nombre: c.nombre,
                  hilos: c.hilos,
                  activa: cat?.slug === c.slug,
                  estilo: colorDe(c.slug),
                  icono: <Icono size={16} strokeWidth={2.5} />,
                };
              }),
            ]}
          />
        </div>

        {/* ── Las categorías, una tecla por cada una, en la misma hoja ── */}
        <nav className="flc-categorias" aria-label="Categorías del foro">
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
      </header>

      {aviso && <p className="fo-aviso" role="status">{aviso}</p>}

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
              {datos.hilos.map((h) => <TarjetaHilo key={h.id} h={h} />)}
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
