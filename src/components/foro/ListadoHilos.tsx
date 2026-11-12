import Link from "next/link";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import Firma from "@/components/foro/Firma";
import type { ListadoForo } from "@/lib/foro/tipos";
import "@/app/foro/listado.css";

/**
 * El listado de preguntas: la portada del foro (`/foro`) y la de cada
 * categoría (`/foro/<categoria>`). Es la misma pantalla con otro filtro.
 *
 * Es igual para todo el mundo: aquí no hay nada que dependa de quién mira,
 * salvo la barra de arriba.
 */
export default function ListadoHilos({
  datos,
  conSesion,
  aviso,
}: {
  datos: ListadoForo;
  conSesion: boolean;
  /** El foro no está abierto del todo: se dice arriba (solo lo ve el admin o en solo lectura). */
  aviso: string | null;
}) {
  const base = datos.categoria ? `/foro/${datos.categoria.slug}` : "/foro";
  const pagina = (n: number) => (n <= 1 ? base : `${base}?pagina=${n}`);

  return (
    <div className="blog-page">
      <SiteNav user={conSesion} />

      <main className="blog-main fo-main">
        <header className="fo-cabecera">
          <span className="fo-antetitulo">
            {datos.categoria ? <Link href="/foro">Foro</Link> : "Preguntas y respuestas"}
          </span>
          <h1 className="fo-titulo">{datos.categoria ? datos.categoria.nombre : "Foro de criptomonedas"}</h1>
          <p className="fo-entradilla">
            {datos.categoria
              ? datos.categoria.descripcion
              : "Dudas reales sobre Bitcoin, trading, seguridad e impuestos, respondidas por la comunidad. Leer es libre; participar es parte de Premium."}
          </p>
        </header>

        {aviso && <p className="fo-aviso" role="status">{aviso}</p>}

        <div className="fl-barra">
          <Link href="/foro/preguntar" className="fp-btn fp-btn--firme">Hacer una pregunta</Link>
          <Link href="/foro/normas" className="fl-enlace">Normas del foro</Link>
        </div>

        <nav className="fo-categorias" aria-label="Categorías del foro">
          <Link href="/foro" className={`fo-categoria${datos.categoria ? "" : " is-activa"}`} aria-current={datos.categoria ? undefined : "page"}>
            Todas
          </Link>
          {datos.categorias.map((c) => {
            const activa = datos.categoria?.slug === c.slug;
            return (
              <Link key={c.slug} href={`/foro/${c.slug}`} className={`fo-categoria${activa ? " is-activa" : ""}`} aria-current={activa ? "page" : undefined}>
                {c.nombre}
                <span className="fo-categoria-cuenta">{c.hilos}</span>
              </Link>
            );
          })}
        </nav>

        {datos.hilos.length === 0 ? (
          <p className="fo-vacio">
            {datos.categoria ? "Todavía no hay preguntas en esta categoría." : "Todavía no hay preguntas."}
          </p>
        ) : (
          <ol className="fl-lista">
            {datos.hilos.map((h) => (
              <li key={h.id} className="fl-hilo">
                <div className="fl-cuerpo">
                  <h2 className="fl-titulo">
                    <Link href={`/foro/${h.id}-${h.slug}`}>{h.titulo}</Link>
                  </h2>
                  <div className="fl-meta">
                    {h.fijado && <span className="fo-sello">Fijado</span>}
                    {h.resuelto && <span className="fo-sello fo-sello--resuelto">Resuelto</span>}
                    {!datos.categoria && (
                      <Link href={`/foro/${h.categoria.slug}`} className="fl-categoria">{h.categoria.nombre}</Link>
                    )}
                    <Firma autor={h.autor} fecha={h.fecha} compacta />
                  </div>
                </div>
                <dl className="fl-cifras">
                  <div>
                    <dt>{h.respuestas === 1 ? "respuesta" : "respuestas"}</dt>
                    <dd>{h.respuestas}</dd>
                  </div>
                  {h.yoTambien > 0 && (
                    <div>
                      <dt>con la misma duda</dt>
                      <dd>{h.yoTambien}</dd>
                    </div>
                  )}
                </dl>
              </li>
            ))}
          </ol>
        )}

        {datos.paginas > 1 && (
          <nav className="fo-paginas" aria-label="Páginas">
            {datos.pagina > 1 ? <Link href={pagina(datos.pagina - 1)} rel="prev">Anteriores</Link> : <span aria-hidden="true" />}
            <span>
              Página {datos.pagina} de {datos.paginas}
            </span>
            {datos.pagina < datos.paginas ? <Link href={pagina(datos.pagina + 1)} rel="next">Siguientes</Link> : <span aria-hidden="true" />}
          </nav>
        )}
      </main>

      <Footer />
    </div>
  );
}
